export function handleHealth(): Record<string, unknown> {
  return {
    status: "ok",
    binary: "stamped-l6",
    surface: "agent-cli",
  };
}
