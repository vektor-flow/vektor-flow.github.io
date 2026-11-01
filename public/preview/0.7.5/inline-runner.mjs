// Review pages deliberately expose no compiler or worker entry point before release.
export const DEFAULT_EXECUTION_TIMEOUT_MS = 30000;
export function createInlineRunner() {
  const disabled = () => Promise.reject(new Error('Run is disabled before release; the latest compiler is required.'));
  return Object.freeze({prewarm: disabled, run: disabled, compileApplication: disabled, dispose: async () => {}});
}
