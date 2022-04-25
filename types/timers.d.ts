/**
 * Override Node's return type of `setTimeout` to `number`.
 */

/***/
namespace NodeJS {
  type Timeout = number;
  type Timer = number;
}
