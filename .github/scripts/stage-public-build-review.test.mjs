import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { stagePublicBuildReview } from "./stage-public-build-review.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "openmonk-review-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of [".next/static", ".next/server", "public/audio/generated-private"]) mkdirSync(path.join(root, name), { recursive: true });
  for (const name of ["package.json", "package-lock.json", "next.config.ts"]) writeFileSync(path.join(root, name), "{}");
  writeFileSync(path.join(root, "public/logo.svg"), "<svg></svg>");
  writeFileSync(path.join(root, "public/audio/generated-private/private.wav"), "private audio fixture");
  writeFileSync(path.join(root, ".next/static/client.js"), "console.log('public');");
  const marker = "fixture-only-material-" + "x".repeat(32);
  writeFileSync(path.join(root, ".next/server/server-reference-manifest.json"), JSON.stringify({ node: {}, edge: {}, encryptionKey: marker }));
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", "add", "public/logo.svg"]);
  return { root, marker };
}

test("retains public files and server hashes without server contents or untracked private audio", t => {
  const { root, marker } = fixture(t);
  const manifest = stagePublicBuildReview(root, { sha: "a".repeat(40) });
  assert.equal(manifest.generatedPrivateValuesChecked, 1);
  assert.ok(manifest.buildFiles.some(file => file.path === ".next/server/server-reference-manifest.json"));
  assert.equal(existsSync(path.join(root, ".build-review/.next/server")), false);
  assert.equal(existsSync(path.join(root, ".build-review/public/audio")), false);
  assert.equal(readFileSync(path.join(root, ".build-review/public/logo.svg"), "utf8"), "<svg></svg>");
  assert.equal(JSON.stringify(manifest).includes(marker), false);
});

test("fails before producing output if generated private material reaches client assets", t => {
  const { root, marker } = fixture(t);
  writeFileSync(path.join(root, ".next/static/client.js"), marker);
  assert.throws(() => stagePublicBuildReview(root), /Build-private material/);
  assert.equal(existsSync(path.join(root, ".build-review")), false);
});

test("rejects symbolic links rather than copying data from outside the asset tree", t => {
  const { root } = fixture(t);
  symlinkSync(path.join(root, ".next/server/server-reference-manifest.json"), path.join(root, ".next/static/linked.js"));
  assert.throws(() => stagePublicBuildReview(root), /symbolic link/);
  assert.equal(existsSync(path.join(root, ".build-review")), false);
});

test("rejects operator-home paths without embedding an actual operator identity", t => {
  const { root } = fixture(t);
  writeFileSync(path.join(root, ".next/static/client.js"), ["", "Users", "fixture-account", "file"].join("/"));
  assert.throws(() => stagePublicBuildReview(root), /Operator path/);
  assert.equal(existsSync(path.join(root, ".build-review")), false);
});
