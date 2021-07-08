/**
 * Constants that get replaced during webpack build.
 * @see {@link file://./../webpack.config.js}
 */

const EXTENSION_ID: string;
/**
 * Whether extension is running in debug mode.
 * @see {@link file://./../env.js}
 */
const DEBUG: boolean;
/** No-op when `DEBUG` is false. Otherwise `console.debug` */
const debug: typeof console.debug;
const NOOP: (...args: any[]) => void;
