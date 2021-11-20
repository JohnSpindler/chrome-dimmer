/**
 * Default values.
 * @typedef {Object} DebounceOptions
 * @property {number} [timeout=20]
 * @property {number} [maxCalls=Infinity]
 */
const debounceOptions = {
  /** Duration (ms) of time before execution. */
  timeout: 20,
  /** Max number of calls before executing. Overrides the `timeout` value. */
  maxCalls: Infinity,
};

type DebounceOptions = Partial<typeof debounceOptions>;
type Fn = (...args: any[]) => any;

/**
 * Delays function calls that are executed repeatedly.
 *
 * @param {Function}        fn      Function to debounce.
 * @param {DebounceOptions} options Optional. Allows timeout customization.
 */
export function debounce<T extends Fn>(
  fn: T,
  {
    timeout = debounceOptions.timeout,
    maxCalls = debounceOptions.maxCalls,
  }: DebounceOptions = debounceOptions,
) {
  let timer = 0;
  let timesCalled = 0;

  return function debounceCb(...args: Parameters<T>): void {
    /** The real function call. */
    const functionCall = () => {
      timesCalled = 0;
      return fn.apply(this, args);
    };

    // clear current timer if called again before execution
    globalThis.clearTimeout(timer);

    // if the function is called more than `maxCalls` times before executed,
    // remove timeout duration.
    const time = ++timesCalled > maxCalls ? 0 : timeout;

    timer = globalThis.setTimeout(functionCall, time);
  };
}
