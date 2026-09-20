export type ParsedCommand =
  | { verb: "health"; flags: Record<string, never> }
  | { verb: "contracts.upstream-check"; flags: Record<string, never> }
  | { verb: "authz.matrix"; flags: Record<string, never> }
  | { verb: "upstreams.probe"; flags: { plantId?: string; orgId?: string } }
  | { verb: "openapi.public-dump"; flags: Record<string, never> };

export type ParseError = { code: "invalid_args"; message: string };

function readFlag(
  argv: string[],
  name: string,
): { value?: string; rest: string[] } {
  const out: string[] = [];
  let value: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === name && i + 1 < argv.length) {
      value = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith(`${name}=`)) {
      value = arg.slice(name.length + 1);
      continue;
    }
    out.push(arg);
  }
  return { value, rest: out };
}

export function parseCommand(
  argv: string[],
): ParsedCommand | ParseError {
  let rest = [...argv];
  const plant = readFlag(rest, "--plant-id");
  rest = plant.rest;
  const org = readFlag(rest, "--org-id");
  rest = org.rest;

  if (rest.length === 0) {
    return { code: "invalid_args", message: "Missing subcommand" };
  }

  if (rest[0] === "health" && rest.length === 1) {
    return { verb: "health", flags: {} };
  }

  if (
    rest[0] === "contracts" &&
    rest[1] === "upstream-check" &&
    rest.length === 2
  ) {
    return { verb: "contracts.upstream-check", flags: {} };
  }

  if (rest[0] === "authz" && rest[1] === "matrix" && rest.length === 2) {
    return { verb: "authz.matrix", flags: {} };
  }

  if (rest[0] === "upstreams" && rest[1] === "probe" && rest.length === 2) {
    return {
      verb: "upstreams.probe",
      flags: {
        ...(plant.value ? { plantId: plant.value } : {}),
        ...(org.value ? { orgId: org.value } : {}),
      },
    };
  }

  if (
    rest[0] === "openapi" &&
    rest[1] === "public-dump" &&
    rest.length === 2
  ) {
    return { verb: "openapi.public-dump", flags: {} };
  }

  return {
    code: "invalid_args",
    message: `Unknown command: ${rest.join(" ")}`,
  };
}
