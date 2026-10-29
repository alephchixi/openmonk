import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "inventory_under_test",
    Path(__file__).resolve().parents[1] / "scripts" / "dependency_inventory.py",
)
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)
npm_manifest = inventory.npm_manifest
package_url = inventory.package_url
pip_manifests = inventory.pip_manifests
requirements = inventory.requirements
snapshot = inventory.snapshot


class InventoryTests(unittest.TestCase):
    def test_npm_preserves_direct_transitive_and_development_boundaries(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            packages = {
                "": {
                    "dependencies": {"public": "^1"},
                    "devDependencies": {"tool": "^2"},
                },
                "node_modules/public": {
                    "version": "1.0.0",
                    "resolved": "https://registry.npmjs.org/public/-/public.tgz",
                    "dependencies": {"shared": "^3"},
                },
                "node_modules/shared": {
                    "version": "3.0.0",
                    "resolved": "https://registry.npmjs.org/shared/-/shared.tgz",
                },
                "node_modules/tool": {
                    "version": "2.0.0",
                    "dev": True,
                    "resolved": "https://registry.npmjs.org/tool/-/tool.tgz",
                },
            }
            (root / "package-lock.json").write_text(
                json.dumps({"lockfileVersion": 3, "packages": packages})
            )
            resolved = npm_manifest(root)["package-lock.json"]["resolved"]
            self.assertEqual(
                resolved["pkg:npm/public@1.0.0"]["dependencies"],
                ["pkg:npm/shared@3.0.0"],
            )
            self.assertEqual(
                resolved["pkg:npm/shared@3.0.0"]["relationship"], "indirect"
            )
            self.assertEqual(resolved["pkg:npm/tool@2.0.0"]["scope"], "development")

    def test_missing_required_package_is_not_reported_as_complete(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "package-lock.json").write_text(
                json.dumps(
                    {
                        "lockfileVersion": 3,
                        "packages": {"": {"dependencies": {"missing": "1.0.0"}}},
                    }
                )
            )
            with self.assertRaises(ValueError):
                npm_manifest(root)

    def test_requirements_reject_external_reads_options_and_cycles(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for content in [
                "-r ../outside.txt",
                "-r requirements.txt",
                "--extra-index-url https://unexpected.example/",
                "unbounded>=1",
            ]:
                with self.subTest(content=content):
                    (root / "requirements.txt").write_text(content)
                    with self.assertRaises(ValueError):
                        requirements(root, "requirements.txt")

    def test_pip_keeps_development_extras_out_of_runtime_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "requirements.txt").write_text("runtime==1.0\n")
            (root / "requirements-dev.txt").write_text(
                "-r requirements.txt\ndevelopment==2.0\n"
            )
            items = []
            for name, version, deps in [
                ("runtime", "1.0", ["child>=1", "development; extra == 'optional'"]),
                ("child", "1.0", []),
                ("development", "2.0", []),
            ]:
                items.append(
                    {
                        "download_info": {
                            "url": "https://files.pythonhosted.org/example.whl"
                        },
                        "metadata": {
                            "name": name,
                            "version": version,
                            "requires_dist": deps,
                        },
                    }
                )
            report = root / "report.json"
            report.write_text(
                json.dumps(
                    {
                        "install": items,
                        "environment": {
                            "python_version": "3.12",
                            "sys_platform": "linux",
                        },
                    }
                )
            )
            manifests = pip_manifests(root, report)
            self.assertEqual(
                set(manifests["requirements.txt"]["resolved"]),
                {"pkg:pypi/runtime@1.0", "pkg:pypi/child@1.0"},
            )
            self.assertEqual(
                manifests["requirements-dev.txt"]["resolved"][
                    "pkg:pypi/development@2.0"
                ]["scope"],
                "development",
            )

    def test_snapshot_requires_exact_source_and_repository(self):
        for repository, sha in [
            ("../repo", "a" * 40),
            ("owner/repo", "main"),
            ("owner/repo;other", "a" * 40),
        ]:
            with (
                self.subTest(repository=repository, sha=sha),
                self.assertRaises(ValueError),
            ):
                snapshot(repository, sha, {})
        self.assertEqual(
            package_url("npm", "@scope/package", "1.2.3"),
            "pkg:npm/%40scope/package@1.2.3",
        )


if __name__ == "__main__":
    unittest.main()
