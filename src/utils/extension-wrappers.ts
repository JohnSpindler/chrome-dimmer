export const checkRuntimeError = (trace = new Error().stack) => {
  const errorMessage = chrome.runtime.lastError?.message;
  if (errorMessage) {
    console.trace(
      'runtime error',
      JSON.stringify({message: errorMessage, trace}, null, 2)
    );
  }
};

const getDefaultValue = (url?: string | null): ExtensionStorage | null =>
  url == null
    ? null
    : {
        [url]: {disabled: true, value: 100},
      };

/**
 * Fetches data from extension's local storage.
 * @see {@link chrome.storage.local} `get()`
 *
 * @param key      Key to get from storage.
 * @param callback Function that gets called with storage.
 */
export function getStorage(
  key: string | null,
  callback: typeof getStorage.cb
): void {
  chrome.storage.local.get(
    getDefaultValue(key),
    function getStorageCb(items: ExtensionStorage) {
      callback(items);
      checkRuntimeError();
    }
  );
}
export type GetStorageCallback = (items: ExtensionStorage) => void;
const callback: GetStorageCallback = (_items) => {
  throw new Error(`"getStorage.cb" should only be used for it's type.`);
};
getStorage.cb = callback;

/**
 * Updates the extension's local storage.
 * @see {@link chrome.storage.local} `set()`
 *
 * @param items    The object containing the keys to update with the updated values.
 * @param callback Optional. Called when the storage is updated.
 */
export function setStorage(
  items: ExtensionStorage,
  callback?: () => void
): void {
  chrome.storage.local.set(items, () => (callback?.(), checkRuntimeError()));
}

/** @see {@link chrome.storage.local} `remove()` */
export const removeFromStorage = (
  keys: string | string[],
  callback?: () => void
) => {
  chrome.storage.local.remove(keys, () => (callback?.(), checkRuntimeError()));
};

export function logStorage() {
  const logStorageCb: GetStorageCallback = (items) => {
    console.groupCollapsed('Extension Storage Contents');
    console.trace(items);
    console.groupEnd();
  };
  DEBUG && getStorage(null, logStorageCb);
}
