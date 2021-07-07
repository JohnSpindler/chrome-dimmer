import getImageObserver from './utils/observer';
import {
  APP_NAME,
  GET_URL,
  GET_URL_RESPONSE,
  SET_BRIGHTNESS,
} from '@utils/constants';

const HOST = location.host;

/** @todo move this into ./utils/observer.ts */
const imageObserver = new (class ImageObserver {
  protected observer: MutationObserver | null = null;
  protected brightness: number;
  protected imageBrightnessSetter = () => setImageBrightness(this.brightness);

  public setBrightness(brightness: number) {
    this.brightness = brightness;
    return this;
  }
  /** Enable observer on any images loaded into the document. */
  public watch() {
    this.observer = getImageObserver(this.imageBrightnessSetter());
  }
  /** Disables observer when message from popup is received. */
  public unwatch() {
    this.observer?.disconnect();
    this.observer = null;
  }
})();

/** @todo move this into its own file */
const documentBrightness = new (class DocumentBrightness {
  protected doc: HTMLDocument = document;
  protected disabled = false;

  public set(value: string) {
    if (this.isDisabled()) {
      return false;
    }
    [this.doc.body, ...this.doc.body.querySelectorAll('main')].forEach(
      (element) => {
        const initTransition = element.style.transition;
        element.style.transition = 'background-color 50ms linear';
        element.style.backgroundColor = value;
        setTimeout(() => (element.style.transition = initTransition), 50);
      }
    );
    return true;
  }
  public disable() {
    this.disabled = true;
  }
  public isDisabled() {
    return this.disabled;
  }
})();

/* HELPERS */
// todo: allow custom selectors to disable this also
const isDocumentInDarkMode = () =>
  document.querySelector('[data-color-mode]')?.attributes?.['data-color-mode']
    ?.value === 'dark';

const setImageBrightness = (value: number) => (image: HTMLImageElement) => {
  // @todo https://stackoverflow.com/a/52721409/12170428
  image.style.filter = `brightness(${value}%)`;
  image.style.webkitFilter = `brightness(${value}%)`;
};

function setBrightness(value: Brightness): void {
  const {numberVal, rgbVal} = value;
  documentBrightness.set(rgbVal);
  const imageBrightnessSetter = setImageBrightness(numberVal);
  [...document.images].forEach(imageBrightnessSetter);

  imageObserver.setBrightness(numberVal);
}

/* LISTENERS */
const onDisconnect: OnDisconnectListener = (port) => {
  debug('brightness->onDisconect()', {port});
  imageObserver.watch();
  documentBrightness.disable();
  port.onDisconnect.removeListener(onDisconnect);
  port.disconnect();
};

const onMessageListener: OnMessageListener = (message, port) => {
  debug('brightness->onMessageListener()', {message, port});
  switch (message.type) {
    case SET_BRIGHTNESS: {
      imageObserver.unwatch();
      setBrightness(message.payload);
      break;
    }
    case GET_URL: {
      debug(`url requested. sending "${HOST}" as response.`);
      port.postMessage({type: GET_URL_RESPONSE, payload: HOST});
      break;
    }
    default: {
      debug('unknown value for `message.type`');
      port.disconnect();
    }
  }
};

const onConnectListener: OnConnectListener = (port) => {
  debug('brightness->onConnectListener()', {port});
  const {sender} = port;
  if (sender?.id !== EXTENSION_ID || port.name !== APP_NAME) {
    debug('unknown connect request', {port});
    return port.disconnect();
  }
  if (isDocumentInDarkMode()) {
    debug('document is in dark mode');
    documentBrightness.disable();
  }
  debug('connected to: ', {sender});
  port.onMessage.addListener(onMessageListener);
  port.onDisconnect.addListener(onDisconnect);
};

/* MAIN */
const setInitBrightness = (storage: {[key: string]: uint}) => {
  debug('brightness->setInitBrightness()', {storage});
  const storageValue = storage[HOST];
  if (!storageValue) {
    return debug('url not found in storage:', {host: HOST, storageValue});
  }
  debug('url found in storage:', storage);

  if (isDocumentInDarkMode()) {
    debug('document is in dark mode');
    documentBrightness.disable();
  }

  const getRgbVal = (numberVal: uint): rgb => {
    const scaledVal = (2.55 * numberVal).toFixed() as uintStr;
    // @ts-ignore
    return `rgb(${scaledVal},${scaledVal},${scaledVal})` as rgb;
  };
  setBrightness({
    rgbVal: getRgbVal(storageValue),
    numberVal: storageValue,
  });
  // setup observer to catch any images that are loaded in lazily
  imageObserver.setBrightness(storageValue).watch();
};

chrome.storage.local.get(HOST, setInitBrightness);
chrome.runtime.onConnect.addListener(onConnectListener);
