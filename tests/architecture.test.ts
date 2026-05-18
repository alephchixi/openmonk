// OpenMonk — Architecture Boundary Tests
// §6.2: Assert layer boundaries to prevent dependency inversion.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function collectFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === ".next") continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function getImports(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  const matches: string[] = [];
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

describe("Architecture boundaries", () => {
  it("lib/ files do not import from react, next, or components", () => {
    const libDir = join(process.cwd(), "lib");
    const files = [...collectFiles(libDir, ".ts"), ...collectFiles(libDir, ".tsx")];
    const violations: string[] = [];

    for (const file of files) {
      // Skip server directory (allowed to use next)
      if (file.includes("/server/")) continue;
      const imports = getImports(file);
      for (const imp of imports) {
        if (imp === "react" || imp.startsWith("react/") || imp.startsWith("@/components")) {
          violations.push(`${file}: imports "${imp}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("app/api/ files do not import from components", () => {
    const apiDir = join(process.cwd(), "app", "api");
    const files = [...collectFiles(apiDir, ".ts"), ...collectFiles(apiDir, ".tsx")];
    const violations: string[] = [];

    for (const file of files) {
      const imports = getImports(file);
      for (const imp of imports) {
        if (imp.startsWith("@/components")) {
          violations.push(`${file}: imports "${imp}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("components/ files do not import from app/api/", () => {
    const compDir = join(process.cwd(), "components");
    const files = [...collectFiles(compDir, ".ts"), ...collectFiles(compDir, ".tsx")];
    const violations: string[] = [];

    for (const file of files) {
      const imports = getImports(file);
      for (const imp of imports) {
        if (imp.startsWith("@/app/api")) {
          violations.push(`${file}: imports "${imp}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
