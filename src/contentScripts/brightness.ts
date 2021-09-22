import {DocumentBrightness, ImageObserver} from './utils';
import {getRgbVal, getStorage, logStorage} from '@utils';
import {
  GET_URL_REQUEST,
  GET_URL_RESPONSE,
  LOGGER_REQUEST,
  SET_BRIGHTNESS,
} from '@utils/constants';

const HOST = location.host;

const documentBrightness = new DocumentBrightness();
const imageObserver = new ImageObserver(setImageBrightness);

/* HELPERS */
// TODO: allow user-defined custom selectors
const isDocumentInDarkMode = () =>
  document.querySelector('[data-color-mode]')?.attributes?.['data-color-mode']
    ?.value === 'dark' || !!document.querySelector('meta[name="darkreader"]');

function setImageBrightness(value: number) {
  return function setImageBrightnessCb(
    image: HTMLImageElement | HTMLVideoElement
  ) {
    // TODO: apply brightness to existing filter
    // don't apply filter if one already exists and isn't a brightness filter
    if (image.style.filter && !image.style.filter.startsWith('brightness')) {
      return;
    }
    // TODO: https://stackoverflow.com/a/52721409/12170428
    image.style.filter = `brightness(${value}%)`;
    image.style.webkitFilter = `brightness(${value}%)`;
  };
}

function setBrightness(value: Brightness): void {
  const {numberVal, rgbVal} = value;
  documentBrightness.set(rgbVal);
  const imageBrightnessSetter = setImageBrightness(numberVal);
  [...document.images, ...document.querySelectorAll('video')].forEach(
    imageBrightnessSetter
  );

  imageObserver.setBrightness(numberVal);
}

/* LISTENERS */
const onDisconnect: PortDisconnectEventListener = (port) => {
  imageObserver.watch();
  port.onDisconnect.removeListener(onDisconnect);
  port.disconnect();
};

const onMessageListener: PortMessageEventListener = (message, port) => {
  switch (message.type) {
    case SET_BRIGHTNESS: {
      imageObserver.unwatch();
      setBrightness(message.payload);
      break;
    }
    case GET_URL_REQUEST: {
      debug(`url requested. sending "${HOST}" as response.`);
      port.postMessage({type: GET_URL_RESPONSE, payload: HOST});
      break;
    }
    case LOGGER_REQUEST: {
      console.log('\x1b[36mpopup\x1b[0m', ...message.payload);
      break;
    }
    default: {
      debug('unknown value for `message.type`');
      port.disconnect();
    }
  }
};

const onConnectListener: ExtensionConnectEventListener = (port) => {
  const {sender} = port;
  if (sender?.id !== EXTENSION_ID || port.name !== APP_NAME) {
    debug('unknown connect request', {port});
    return port.disconnect();
  }
  if (isDocumentInDarkMode()) {
    debug('document is in dark mode');
    documentBrightness.disabled = true;
  }
  port.onMessage.addListener(onMessageListener);
  port.onDisconnect.addListener(onDisconnect);
};

/* MAIN */
const setInitBrightness = (storage: ExtensionStorage): void => {
  const {disabled, value} = storage[HOST];

  if (isDocumentInDarkMode() || disabled) {
    documentBrightness.disabled = true;
  }

  setBrightness({
    rgbVal: getRgbVal(value),
    numberVal: value,
  });
  // setup observer to catch any images that are loaded in lazily
  imageObserver.setBrightness(value).watch();
};

const onStorageChange: ExtractCallbackType<StorageChangedEvent['addListener']> =
  (changes, _areaName) => {
    const {newValue, oldValue} = changes[HOST] || {};
    // if values exist and `disabled` haven't changed, exit early
    if (!newValue || newValue.disabled === oldValue?.disabled) {
      return;
    }

    if (newValue.disabled) {
      documentBrightness.disabled = true;
    } else {
      documentBrightness.disabled = false;
      const value = newValue.value;
      setBrightness({
        rgbVal: getRgbVal(value),
        numberVal: value ?? 100,
      });
    }
  };

// initialize
getStorage(HOST, setInitBrightness);
// listeners
chrome.runtime.onConnect.addListener(onConnectListener);
chrome.storage.onChanged.addListener(onStorageChange);
// debug
logStorage();
