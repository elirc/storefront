import { readFileSync, readdirSync, type Dirent } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

// 🔍 [Reviewer] A fitness test — discipline you can *fail*, like a broken unit test.
//
// The rule (Storefront rule #3, ADR-0002): money is integer minor units, and there is NO
// float money math under `server/`. `formatMoney` owns the single deliberate `/ 100`, and it
// lives in `lib/`, not `server/`. If a service or repository ever does `parseFloat`, divides
// a value by 100, or calls `.toFixed`, that is float money math sneaking in — this scan turns
// it RED and names the file and line, so review does not have to catch it by eye.
//
// The scan is a text scan on purpose: it does not care what the code *means*, only what it
// literally contains, so it cannot be argued around. (Exercise for the reader: break
// formatMoney to use parseFloat and move it under server/ — watch this go red and name it.)

// Anchored at the project root (Vitest's cwd), so the scan is independent of the test
// environment (jsdom vs node) — it is a filesystem scan, not a module-relative lookup.
const ROOT = process.cwd();
const SCAN_DIR = join(ROOT, "server");

// Forbidden shapes of float money arithmetic.
const FORBIDDEN: { name: string; re: RegExp }[] = [
  { name: "parseFloat", re: /\bparseFloat\s*\(/ },
  { name: "divide-by-100 (float money math)", re: /\/\s*100(?!\d)/ },
  { name: ".toFixed (format outside formatMoney)", re: /\.toFixed\s*\(/ },
];

function tsFilesUnder(dir: string): string[] {
  let entries: Dirent<string>[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // server/ may not exist yet in an early bootstrap — nothing to scan.
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...tsFilesUnder(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

describe("fitness: no float money math under server/", () => {
  const files = tsFilesUnder(SCAN_DIR);

  it("finds source files to scan", () => {
    // Guards the guard: if server/ is empty the scan would pass vacuously.
    expect(files.length).toBeGreaterThan(0);
  });

  it("contains no parseFloat, `/ 100`, or `.toFixed` in server/ source", () => {
    const violations: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, i) => {
        for (const rule of FORBIDDEN) {
          if (rule.re.test(line)) {
            const rel = file.slice(ROOT.length).replace(/\\/g, "/");
            violations.push(`${rel}:${i + 1} — ${rule.name}: ${line.trim()}`);
          }
        }
      });
    }
    expect(violations, `float money math found under server/:\n${violations.join("\n")}`).toEqual(
      [],
    );
  });
});
