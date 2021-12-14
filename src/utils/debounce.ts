interface DebounceOptions {
  /**
   * Duration (ms) of time before execution.
   * @default 20
   */
  timeout: number;
  /**
   * Max number of calls before executing. Overrides the `timeout` value.
   * @default Infinity
   */
  maxCalls: number;
}

type Fn = (...args: any[]) => any;

/**
 * Delays function calls that are executed repeatedly.
 *
 * @param fn      Function to debounce.
 * @param options {@link DebounceOptions Optional}. Allows timeout customization.
 */
export function debounce<T extends Fn>(
  fn: T,
  {timeout = 20, maxCalls = Infinity}: Partial<DebounceOptions> = {},
) {
  let timer = 0;
  let timesCalled = 0;

  return function debounceCb(...args: Parameters<T>) {
    /** The real function call. */
    const functionCall = () => {
      timesCalled = 0;
      return fn.apply(this, args);
    };

    // clear current timer if called again before execution
    clearTimeout(timer);

    // if the function is called more than `maxCalls` times before executed,
    // remove timeout duration.
    const time = ++timesCalled > maxCalls ? 0 : timeout;

    timer = setTimeout(functionCall, time);
  };
}
