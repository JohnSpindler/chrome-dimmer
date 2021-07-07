import {
  GET_URL,
  GET_URL_RESPONSE,
  PORT_NAME,
  SET_BRIGHTNESS,
} from '@utils/constants';
import {checkRuntimeError, debounce} from '@utils';

/** @todo move this into its own file */
const urlStorageHelper = new (class URLStorageHelper {
  private _url: Maybe<string>;
  private _urlValue: Maybe<uint>;
  constructor({url = null, urlValue = null} = {url: null, urlValue: null}) {
    this._url = url;
    this._urlValue = urlValue;
  }

  public get url() {
    return this._url;
  }
  public set url(value: string) {
    this._url = value;
  }
  public get urlValue() {
    return this._urlValue;
  }
  public set urlValue(value: uint) {
    this._urlValue = value;
    this.save();
  }

  public load(url: string, callback: (items: {[key: string]: uint}) => any) {
    chrome.storage.local.get(url, (items) => {
      debug('urlStorageHelper->load()', {items});
      this.url = url;
      this.urlValue = items[url] ?? 100;
      callback(items);
    });
  }
  public save() {
    debug('urlStorageHelper->save()', {url: this.url});
    if (this.url) {
      if (this.urlValue < 100) {
        chrome.storage.local.set({[this.url]: this.urlValue});
      } else {
        chrome.storage.local.remove(this.url);
      }
    }
  }
})();

function mountListener(port: Port, initValue: uint = 100) {
  debug('mountListener', {port, initValue});
  const slider = document.getElementById('slider') as HTMLInputElement;
  const sliderValueDisplay = document.getElementById('numberValue');
  const sliderRGBDisplay = document.getElementById('rgbValue');

  const getRGBVal = (val: uint): rgb => {
    const scaledVal = (2.55 * val).toFixed() as uintStr;
    // @ts-ignore
    const rgbVal = `rgb(${scaledVal},${scaledVal},${scaledVal})` as rgb;
    return rgbVal;
  };

  const setBrightness = (val: uint): Brightness => {
    urlStorageHelper.urlValue = val;
    sliderValueDisplay.innerHTML = val.toFixed(1);

    const rgbVal = getRGBVal(val);
    sliderRGBDisplay.innerHTML = rgbVal;

    return {numberVal: val, rgbVal};
  };

  const onSliderValueChange = (_ev: HTMLElementEventMap['input']): void => {
    port.postMessage({
      type: SET_BRIGHTNESS,
      payload: setBrightness(parseFloat(slider.value) as uint),
    });
  };

  setBrightness(initValue);
  slider.value = initValue.toString();

  // this ensures a smooth visual transition by checking that there
  // are not too many changes in between updates.
  const debouncedOnSliderValueChange = debounce(onSliderValueChange, {
    maxCalls: 10,
  });

  const debouncedUpdateStorage = debounce(
    urlStorageHelper.save.bind(urlStorageHelper),
    {
      timeout: 500,
    }
  );

  slider.addEventListener('input', (ev) => {
    debouncedOnSliderValueChange(ev);
    debouncedUpdateStorage();
  });
}

const onMessageListener: OnMessageListener = (message, port) => {
  debug('popup->onMessageListener()', {message, port});
  if (message?.type === GET_URL_RESPONSE) {
    const {payload} = message;
    urlStorageHelper.load(payload, (items) => {
      mountListener(port, items[payload]);
    });
  } else {
    mountListener(port);
  }

  port.onMessage.removeListener(onMessageListener);
  checkRuntimeError();
};

const onDisconnectListener: OnDisconnectListener = (port) => {
  debug('popup->onDisconnectListener()', {port});
  port.onDisconnect.removeListener(onDisconnectListener);
  port.disconnect();
  urlStorageHelper.save();
  checkRuntimeError();
};

const connect = (tabs: chrome.tabs.Tab[]) => {
  debug('popup->connect()', {tabs});
  const port = chrome.tabs.connect(tabs[0].id, PORT_NAME);

  port.onMessage.addListener(onMessageListener);
  port.postMessage({type: GET_URL});

  port.onDisconnect.addListener(onDisconnectListener);
  window.addEventListener('beforeunload', () => onDisconnectListener(port));
  checkRuntimeError();
};

chrome.tabs.query({active: true, currentWindow: true}, connect);
DEBUG &&
  chrome.storage.local.get((storage) =>
    debug('popup: Extension Storage', storage)
  );
