/**
 * @fileoverview Storage types used in this extension.
 */

/***/
interface ExtensionStorage {
  /** The url of the current extension context. */
  [key: string]: {
    /** Whether or not the document color will be modified. */
    disabled: boolean;
    /** The brightness to set the background & images at */
    value: uint;
  };
}
type ExtensionStorageKeys = string;
type ExtensionStorageValues = ExtensionStorage[ExtensionStorageKeys];
