"""Build a GitHub dependency snapshot from data; never install or import project code."""

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urlsplit

LIMIT = 16 * 1024 * 1024
NAME = re.compile(r"(?:@[A-Za-z0-9_.-]+/)?[A-Za-z0-9_.-]+\Z")
VERSION = re.compile(r"[A-Za-z0-9.+_-]+\Z")
PIN = re.compile(r"([A-Za-z0-9_.-]+)==([A-Za-z0-9.+_-]+)\Z")


def read_text(root, name):
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError("manifest must be a regular file inside the repository")
    with path.open("rb") as handle:
        data = handle.read(LIMIT + 1)
    if len(data) > LIMIT:
        raise ValueError("manifest exceeds the inventory size limit")
    return data.decode("utf-8")


def normalized(name):
    return re.sub(r"[-_.]+", "-", name).lower()


def package_url(ecosystem, name, version):
    if not NAME.fullmatch(name) or not VERSION.fullmatch(version):
        raise ValueError("unsupported package name or version")
    if ecosystem == "pypi":
        name = normalized(name)
    return f"pkg:{ecosystem}/{quote(name, safe='/')}@{quote(version, safe='')}"


def npm_manifest(root):
    data = json.loads(read_text(root, "package-lock.json"))
    if data.get("lockfileVersion") not in (2, 3):
        raise ValueError("inventory requires an npm v2/v3 lockfile")
    packages = data["packages"]
    if len(packages) > 20000:
        raise ValueError("lockfile exceeds the package count limit")
    declared = packages.get("", {})
    direct = (
        set(declared.get("dependencies", {}))
        | set(declared.get("devDependencies", {}))
        | set(declared.get("optionalDependencies", {}))
    )
    by_path, resolved = {}, {}
    for path, entry in packages.items():
        if not path or entry.get("link") or not entry.get("version"):
            continue
        if "node_modules/" not in path or not str(entry.get("resolved", "")).startswith(
            "https://registry.npmjs.org/"
        ):
            raise ValueError(
                "non-registry package requires a separate provenance review"
            )
        name = entry.get("name") or path.rsplit("node_modules/", 1)[-1]
        purl = package_url("npm", name, entry["version"])
        item = {
            "package_url": purl,
            "relationship": "direct"
            if path in {"node_modules/" + n for n in direct}
            else "indirect",
            "scope": "development" if entry.get("dev") else "runtime",
            "dependencies": [],
        }
        previous = resolved.get(purl)
        if previous:
            if previous["scope"] == "runtime":
                item["scope"] = "runtime"
            if previous["relationship"] == "direct":
                item["relationship"] = "direct"
        resolved[purl] = item
        by_path[path] = purl
    required = set(declared.get("dependencies", {})) | set(
        declared.get("devDependencies", {})
    )
    if any("node_modules/" + name not in by_path for name in required):
        raise ValueError("lockfile omits a declared required package")
    for path, purl in by_path.items():
        entry = packages[path]
        dependencies = set(resolved[purl]["dependencies"])
        for name in set(entry.get("dependencies", {})) | set(
            entry.get("optionalDependencies", {})
        ):
            prefix = path
            while True:
                candidate = (prefix + "/" if prefix else "") + "node_modules/" + name
                if candidate in by_path:
                    dependencies.add(by_path[candidate])
                    break
                if not prefix:
                    break
                prefix = (
                    prefix.rsplit("/node_modules/", 1)[0]
                    if "/node_modules/" in prefix
                    else ""
                )
        resolved[purl]["dependencies"] = sorted(dependencies)
    return {
        "package-lock.json": {
            "name": "package-lock.json",
            "file": {"source_location": "package-lock.json"},
            "resolved": resolved,
        }
    }


def requirements(root, name, visiting=None):
    visiting = set() if visiting is None else visiting
    if name in visiting or len(visiting) >= 8:
        raise ValueError("requirements includes must be bounded and acyclic")
    visiting.add(name)
    pins = {}
    for raw in read_text(root, name).splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        if line.startswith("-r "):
            child = (Path(name).parent / line[3:].strip()).as_posix()
            pins.update(requirements(root, child, visiting))
            continue
        match = PIN.fullmatch(line)
        if not match:
            raise ValueError(
                "requirements inventory accepts exact public package pins and local -r includes only"
            )
        package, version = match.groups()
        key = normalized(package)
        if key in pins and pins[key] != version:
            raise ValueError("requirements contain conflicting exact pins")
        pins[key] = version
    visiting.remove(name)
    return pins


def pip_manifests(root, report_path):
    from pip._vendor.packaging.requirements import Requirement

    # pip's own vendored parser is available in the same toolchain producing its report.
    report = json.loads(Path(report_path).read_text(encoding="utf-8"))
    runtime = requirements(root, "requirements.txt")
    requested = requirements(root, "requirements-dev.txt")
    records = {normalized(x["metadata"]["name"]): x for x in report["install"]}
    if len(records) > 20000:
        raise ValueError("report exceeds the package count limit")
    for item in records.values():
        origin = urlsplit(item.get("download_info", {}).get("url", ""))
        if (
            origin.scheme != "https"
            or origin.hostname != "files.pythonhosted.org"
            or origin.username
            or origin.password
        ):
            raise ValueError("resolver report must use public PyPI wheel artifacts")
    environment = {**report.get("environment", {}), "extra": ""}
    edges = {}
    for name, item in records.items():
        dependencies = set()
        for value in item["metadata"].get("requires_dist", []):
            requirement = Requirement(value)
            if requirement.marker and not requirement.marker.evaluate(environment):
                continue
            dependency = normalized(requirement.name)
            if dependency in records:
                dependencies.add(dependency)
        edges[name] = dependencies
    for name, version in requested.items():
        if name not in records or records[name]["metadata"]["version"] != version:
            raise ValueError("resolver report does not match the reviewed exact pins")
    reachable, pending = set(), list(runtime)
    while pending:
        name = pending.pop()
        if name not in reachable:
            reachable.add(name)
            pending.extend(edges.get(name, set()) - reachable)
    urls = {
        name: package_url("pypi", item["metadata"]["name"], item["metadata"]["version"])
        for name, item in records.items()
    }
    manifests = {}
    for filename, included, direct in [
        ("requirements.txt", reachable, runtime),
        ("requirements-dev.txt", set(records), requested),
    ]:
        resolved = {
            urls[name]: {
                "package_url": urls[name],
                "relationship": "direct" if name in direct else "indirect",
                "scope": "runtime" if name in reachable else "development",
                "dependencies": sorted(urls[d] for d in edges[name] if d in included),
            }
            for name in sorted(included)
        }
        manifests[filename] = {
            "name": filename,
            "file": {"source_location": filename},
            "resolved": resolved,
        }
    return manifests


def snapshot(repository, sha, manifests, run_id="manual", detector_ref=None):
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository) or any(
        p in {".", ".."} for p in repository.split("/")
    ):
        raise ValueError("invalid GitHub repository")
    if not re.fullmatch(r"[0-9a-f]{40}", sha) or not re.fullmatch(
        r"[0-9a-f]{40}", detector_ref or sha
    ):
        raise ValueError("source revisions must be exact commit hashes")
    return {
        "version": 0,
        "sha": sha,
        "ref": "refs/heads/main",
        "job": {"id": str(run_id), "correlator": "locked-dependency-inventory"},
        "detector": {
            "name": "locked-dependency-inventory",
            "version": "1.0.0",
            "url": f"https://github.com/{repository}/blob/{detector_ref or sha}/scripts/dependency_inventory.py",
        },
        "scanned": datetime.now(timezone.utc).isoformat(),
        "manifests": manifests,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository")
    parser.add_argument("--sha")
    parser.add_argument("--run-id", default="manual")
    parser.add_argument("--output")
    parser.add_argument("--pip-report")
    parser.add_argument("--validate-requirements", action="store_true")
    args = parser.parse_args()
    root = Path.cwd()
    if args.validate_requirements:
        requirements(root, "requirements.txt")
        requirements(root, "requirements-dev.txt")
        print("Validated bounded, exactly pinned requirements.")
        return
    if not args.repository or not args.sha or not args.output:
        parser.error("snapshot generation requires repository, sha and output")
    manifests = (
        pip_manifests(root, args.pip_report) if args.pip_report else npm_manifest(root)
    )
    Path(args.output).write_text(
        json.dumps(
            snapshot(args.repository, args.sha, manifests, args.run_id), indent=2
        )
        + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "manifest_count": len(manifests),
                "package_count": len(
                    {p for m in manifests.values() for p in m["resolved"]}
                ),
            }
        )
    )


if __name__ == "__main__":
    main()
