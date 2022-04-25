namespace chrome.storage {
  export interface StorageChange {
    newValue?: ExtensionStorageValues;
    oldValue?: ExtensionStorageValues;
  }
}
interface StorageChangedEvent extends chrome.storage.StorageChangedEvent {}
