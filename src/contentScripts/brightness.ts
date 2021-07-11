import getImageObserver from './utils/observer';
import {getRgbVal, getStorage, logStorage} from '@utils';
import {
  APP_NAME,
  GET_URL_REQUEST,
  GET_URL_RESPONSE,
  LOGGER_REQUEST,
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
class DocumentBrightness {
  protected doc: HTMLDocument;
  /** Whether or not document color modifications are disabled. */
  protected disabled = false;
  /** The initial computed document background color before modification. */
  protected initBackgroundColor: string;
  /** The initial computed value for `document.style.transition`. */
  protected initTransition: string;
  /** Refs that get updated on value change. */
  protected refs: HTMLElement[];
  /**
   * Style applied to document during change of brightness.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transition}
   */
  public static readonly TRANSITION_ANIMATION = 'background-color 50ms linear';

  constructor(
    {
      doc,
      refs,
    }: {
      doc?: HTMLDocument;
      refs?: HTMLElement[];
    } = DocumentBrightness.defaults()
  ) {
    this.doc = doc ?? DocumentBrightness.defaults({doc: true}).doc;
    this.refs = refs ?? DocumentBrightness.defaults({refs: true}).refs;
    const bodyStyle = getComputedStyle(this.doc.body);
    this.initBackgroundColor = bodyStyle.backgroundColor;
    this.initTransition = bodyStyle.transition;
  }

  public static defaults(
    {doc = false, refs = false}: {doc?: boolean; refs?: boolean} = {
      doc: true,
      refs: true,
    }
  ) {
    return {
      ...(doc === true && {doc: document}),
      ...(refs === true && {
        refs: [document.body, ...document.body.querySelectorAll('main')],
      }),
    };
  }

  public get isDisabled() {
    return this.disabled;
  }
  // todo: update to set brightness when reenabling
  public set isDisabled(disable: boolean) {
    // restore colors back to default
    if (disable) {
      this.restoreDefaultColors();
    }
    this.disabled = disable;
  }
  protected restoreDefaultColors() {
    this.update(this.initBackgroundColor as rgb);
  }
  protected update(value: rgb) {
    this.refs.forEach((el) => {
      el.style.transition = DocumentBrightness.TRANSITION_ANIMATION;
      el.style.backgroundColor = value;
      setTimeout(() => (el.style.transition = this.initTransition), 50);
    });
  }
  /**
   * Sets the document brightness to specified value.
   * If modifications are disabled, returns `false`.
   */
  public set(value: rgb) {
    if (this.isDisabled) {
      return false;
    }
    this.update(value);
    return true;
  }
}

const documentBrightness = new DocumentBrightness();

/* HELPERS */
// todo: allow user-defined custom selectors
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
    documentBrightness.isDisabled = true;
  }
  port.onMessage.addListener(onMessageListener);
  port.onDisconnect.addListener(onDisconnect);
};

/* MAIN */
const setInitBrightness = (storage: ExtensionStorage): void => {
  const {disabled, value} = storage[HOST];

  if (isDocumentInDarkMode() || disabled) {
    documentBrightness.isDisabled = true;
  }

  setBrightness({
    rgbVal: getRgbVal(value),
    numberVal: value,
  });
  // setup observer to catch any images that are loaded in lazily
  imageObserver.setBrightness(value).watch();
};

const onStorageChange: ExtractCallbackType<
  StorageChangedEvent['addListener']
> = (changes, _areaName) => {
  if (
    changes[HOST]?.newValue &&
    changes[HOST].oldValue &&
    changes[HOST].newValue.disabled === changes[HOST].oldValue.disabled
  ) {
    return;
  }
  debug(JSON.stringify(changes, null, 2));
  if (changes[HOST]?.newValue?.disabled) {
    // documentBrightness.set(getRgbVal(100));
    documentBrightness.isDisabled = true;
  } else {
    documentBrightness.isDisabled = false;
    const value = changes[HOST]?.newValue?.value;
    setBrightness({
      rgbVal: getRgbVal(value),
      numberVal: value,
    });
  }
};

logStorage();
getStorage(HOST, setInitBrightness);
chrome.runtime.onConnect.addListener(onConnectListener);
chrome.storage.onChanged.addListener(onStorageChange);
