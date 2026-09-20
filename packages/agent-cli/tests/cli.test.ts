import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAgentCli } from "../src/main.js";
import { resetExitImpl, setExitImpl } from "../src/runtime.js";

class CliExit extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
    this.name = "CliExit";
  }
}

async function invoke(args: string[], env?: NodeJS.ProcessEnv) {
  const prevEnv = process.env;
  if (env) {
    process.env = { ...process.env, ...env };
  }
  const lines: string[] = [];
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
    lines.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    const cb = rest.find((v) => typeof v === "function") as (() => void) | undefined;
    cb?.();
    return true;
  }) as typeof process.stdout.write;

  let exitCode = 0;
  setExitImpl((code) => {
    exitCode = code;
    throw new CliExit(code);
  });

  try {
    await runAgentCli(args);
  } catch (err) {
    if (!(err instanceof CliExit)) {
      throw err;
    }
  } finally {
    process.stdout.write = write;
    resetExitImpl();
    process.env = prevEnv;
  }

  const stdout = lines.join("").trim();
  const line = stdout.split("\n").at(-1) ?? "";
  return { exitCode, body: JSON.parse(line) as Record<string, unknown> };
}

describe("stamped-l6 CLI", () => {
  it("health returns envelope ok", async () => {
    const { exitCode, body } = await invoke(["health"]);
    assert.equal(exitCode, 0);
    assert.equal(body.ok, true);
    assert.equal((body.meta as { verb: string }).verb, "health");
    assert.equal((body.meta as { layer: string }).layer, "l6");
  });

  it("contracts upstream-check returns pinned layers", async () => {
    const { exitCode, body } = await invoke(["contracts", "upstream-check"]);
    assert.equal(exitCode, 0);
    assert.equal(body.ok, true);
    const data = body.data as { layers: Record<string, unknown> };
    assert.ok(data.layers.l2);
    assert.ok(data.layers.l4);
    assert.ok(data.layers.l5);
  });

  it("authz matrix returns role × permission entries", async () => {
    const { exitCode, body } = await invoke(["authz", "matrix"]);
    assert.equal(exitCode, 0);
    const data = body.data as { entries: unknown[] };
    assert.ok(data.entries.length > 0);
  });

  it("openapi public-dump includes paths", async () => {
    const { exitCode, body } = await invoke(["openapi", "public-dump"]);
    assert.equal(exitCode, 0);
    const data = body.data as { pathCount: number };
    assert.ok(data.pathCount >= 1);
  });

  it("upstreams probe works offline with fixtures", async () => {
    const { exitCode, body } = await invoke(
      ["upstreams", "probe", "--plant-id", "plant_vinayak_1"],
      { USE_FIXTURES: "true" },
    );
    assert.equal(exitCode, 0);
    const data = body.data as { probe: { plantId: string } };
    assert.equal(data.probe.plantId, "plant_vinayak_1");
  });

  it("denies --write on upstream-check", async () => {
    const { exitCode, body } = await invoke([
      "contracts",
      "upstream-check",
      "--write",
    ]);
    assert.notEqual(exitCode, 0);
    assert.equal(body.ok, false);
    assert.equal((body.error as { code: string }).code, "denied");
  });

  it("unknown mutating path returns denied", async () => {
    const { exitCode, body } = await invoke(["prescriptions", "act"]);
    assert.notEqual(exitCode, 0);
    assert.equal((body.error as { code: string }).code, "denied");
  });
});
