/** Injectable process exit — tests can stub without fighting Node internals. */
let exitImpl: (code: number) => never = (code) => {
  process.exit(code);
};

export function setExitImpl(fn: (code: number) => never): void {
  exitImpl = fn;
}

export function resetExitImpl(): void {
  exitImpl = (code) => {
    process.exit(code);
  };
}

export function exitProcess(code: number): never {
  return exitImpl(code);
}
