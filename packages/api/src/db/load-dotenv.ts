import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Load gitignored `.env` into process.env (does not override existing keys).
 * Searches from CWD upward and from this package root.
 * Never logs values.
 */
export function loadDotEnv(): void {
  const candidates = new Set<string>();
  let dir = resolve(process.cwd());
  for (let i = 0; i < 6; i++) {
    candidates.add(join(dir, ".env"));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    candidates.add(resolve(here, "../../../.env")); // packages/api/src → repo root
    candidates.add(resolve(here, "../../.env"));
  } catch {
    /* ignore */
  }

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    return;
  }
}
