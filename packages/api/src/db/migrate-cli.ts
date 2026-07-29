import { loadEnv } from "../config.js";
import { runMigrations } from "./migrate.js";

const env = loadEnv();
const url = env.DIRECT_URL ?? env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL or DATABASE_URL is required to migrate");
  process.exit(1);
}
console.log(
  `migrations: using ${env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL"}`,
);
await runMigrations(url);
console.log("migrations: OK");
