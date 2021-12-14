/**
 * The following two references ensure that dom types defined by TS override
 * the Node types. Was having issues with the return type of `setTimeout()`.
 */

/***/
declare namespace NodeJS {
  type Timeout = number;
  type Timer = number;
}
