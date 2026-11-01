import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync, realpathSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const privateFields = new Set([
  "encryptionKey", "previewModeId", "previewModeSigningKey", "previewModeEncryptionKey",
  "__NEXT_PREVIEW_MODE_ID", "__NEXT_PREVIEW_MODE_SIGNING_KEY", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
]);

export function stagePublicBuildReview(directory, source = {}) {
  const root = realpathSync(directory);
  const output = path.join(root, ".build-review");
  if (existsSync(output)) throw new Error("Review output already exists.");
  let bytes = 0;
  let count = 0;
  function read(relative) {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(root + path.sep) || /[\x00-\x1f\\]/.test(relative)) throw new Error("Unsafe review path.");
    const parts = relative.split("/");
    for (let index = 1; index <= parts.length; index++) {
      if (lstatSync(path.join(root, ...parts.slice(0, index))).isSymbolicLink()) throw new Error("Review input contains a symbolic link.");
    }
    const info = lstatSync(absolute);
    if (!info.isFile() || info.size > 32 * 1024 * 1024) throw new Error("Review input is not a bounded regular file.");
    bytes += info.size;
    if (++count > 10000 || bytes > 256 * 1024 * 1024) throw new Error("Review input exceeds its size limit.");
    const data = readFileSync(absolute);
    return { data, receipt: { path: relative, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") } };
  }
  function walk(relative, depth = 0) {
    if (depth > 32) throw new Error("Review input is too deeply nested.");
    if (relative === ".next/cache") return [];
    const info = lstatSync(path.join(root, relative));
    if (info.isSymbolicLink()) throw new Error("Review input contains a symbolic link.");
    if (info.isDirectory()) return readdirSync(path.join(root, relative)).sort().flatMap(name => walk(`${relative}/${name}`, depth + 1));
    return [relative];
  }
  const build = walk(".next").map(relative => read(relative));
  const generatedPrivateValues = new Set();
  function collect(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (privateFields.has(key) && typeof item === "string" && item.length >= 16) generatedPrivateValues.add(item);
      else collect(item);
    }
  }
  for (const file of build) {
    if (/\/(prerender-manifest|preview-props|middleware-manifest|server-reference-manifest)\.json$/.test(file.receipt.path)) collect(JSON.parse(file.data.toString("utf8")));
  }
  const trackedPublic = execFileSync("git", ["-c", "core.hooksPath=/dev/null", "ls-files", "-z", "--", "public"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
  if (trackedPublic.some(name => name === "public/audio/generated-private" || name.startsWith("public/audio/generated-private/"))) throw new Error("Private generated audio is tracked as a public asset.");
  const assets = new Set([
    ...walk(".next/static"), ...trackedPublic,
    "package.json", "package-lock.json", "next.config.ts",
  ]);
  const publicFiles = [...assets].sort().map(relative => read(relative));
  for (const file of publicFiles) {
    if ([...generatedPrivateValues].some(value => file.data.includes(Buffer.from(value)))) throw new Error(`Build-private material reached a public review asset: ${file.receipt.path}`);
    if (["/Users/", "/Volumes/"].some(value => file.data.includes(Buffer.from(value)))) throw new Error(`Operator path reached a public review asset: ${file.receipt.path}`);
  }
  const manifest = {
    schemaVersion: 1, source,
    scope: "Public review assets and hashes only. Server output and generated build-private values are not retained here. Not a deployable server bundle.",
    buildFiles: build.map(file => file.receipt),
    publicFiles: publicFiles.map(file => file.receipt),
    generatedPrivateValuesChecked: generatedPrivateValues.size,
  };
  mkdirSync(output);
  for (const file of publicFiles) {
    const destination = path.join(output, file.receipt.path);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, file.data);
  }
  writeFileSync(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = stagePublicBuildReview(process.cwd(), {
    repository: process.env.GITHUB_REPOSITORY,
    sha: process.env.GITHUB_SHA,
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
  });
  console.log(JSON.stringify({ buildFilesHashed: manifest.buildFiles.length, publicFilesRetained: manifest.publicFiles.length }));
}
