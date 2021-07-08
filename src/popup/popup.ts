import {
  GET_URL_REQUEST,
  GET_URL_RESPONSE,
  LOGGER_REQUEST,
  PORT_NAME,
  SET_BRIGHTNESS,
} from '@utils/constants';
import {checkRuntimeError, debounce} from '@utils';
import {URLStorageHelper} from './utils/URLStorageHelper';

const urlStorageHelper = new URLStorageHelper();
const logger = (port: Port, message: any) =>
  port.postMessage({type: LOGGER_REQUEST, payload: message});

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

const onMessageListener: PortMessageCallback = (message, port) => {
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

const onDisconnectListener: PortDisconnectCallback = (port) => {
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
  port.postMessage({type: GET_URL_REQUEST});

  port.onDisconnect.addListener(onDisconnectListener);
  window.addEventListener('beforeunload', () => onDisconnectListener(port));
  checkRuntimeError();
};

chrome.tabs.query({active: true, currentWindow: true}, connect);
DEBUG &&
  chrome.storage.local.get((storage) =>
    debug('popup: Extension Storage', storage)
  );
