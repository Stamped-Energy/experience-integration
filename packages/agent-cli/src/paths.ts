import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo root (experience-integration). */
export const REPO_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
