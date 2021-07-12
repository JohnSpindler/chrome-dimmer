/**
 * @fileoverview Constants that get replaced during webpack build.
 * @see {@link file://./../webpack.config.js}
 */

/***/
const APP_NAME: string;
/** The unique extension ID provided by the browser at runtime. */
const EXTENSION_ID: string;
/**
 * Whether extension is running in debug mode.
 * @see {@link file://./../env.js}
 */
const DEBUG: boolean;
const NOOP: (...args: any[]) => void;
const debug: typeof console.debug;
const trace: typeof console.trace;
