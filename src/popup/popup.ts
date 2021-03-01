import {GET_URL, SET_BRIGHTNESS, PORT_NAME} from '../constants';
import debounce from './debounce';

const mountListener = (port: Port, initValue?: uint) => {
  const slider = document.getElementById('slider') as HTMLInputElement;
  const sliderValueDisplay = document.getElementById('numberValue');
  const sliderRGBDisplay = document.getElementById('rgbValue');

  const setRGBVal = (val: uint): rgb => {
    const scaledVal = (2.55 * val).toFixed() as uintStr;
    const rgbVal = `rgb(${scaledVal},${scaledVal},${scaledVal})` as rgb;
    sliderRGBDisplay.innerHTML = rgbVal;

    return rgbVal;
  };

  const setBrightness = (val: uint = 100): Brightness => {
    sliderValueDisplay.innerHTML = val.toFixed(1);
    return {numberVal: val, rgbVal: setRGBVal(val)};
  };
  setBrightness(initValue);

  const onSliderValueChange = (_ev: HTMLElementEventMap['input']): void => {
    port.postMessage({
      type: SET_BRIGHTNESS,
      value: setBrightness(parseFloat(slider.value) as uint),
    });
  };

  const debouncedOnSliderValueChange = debounce(onSliderValueChange);

  slider.addEventListener('input', debouncedOnSliderValueChange);
};

/** @todo Use storage here to allow domain-specific settings to be saved */
const onMessageListener: OnMessageListener = (message: string, port) => {
  if (message) {
    chrome.storage.local.get(message, (items) => {
      mountListener(port, items[message]);
    });
  } else {
    mountListener(port);
  }

  port.onMessage.removeListener(onMessageListener);
};

const onDisconnectListener: OnDisconnectListener = (port) => {
  port.onDisconnect.removeListener(onDisconnectListener);
};

const connect = (tabs: chrome.tabs.Tab[]) => {
  const port = chrome.tabs.connect(tabs[0].id, PORT_NAME);

  port.onMessage.addListener(onMessageListener);
  port.postMessage({type: GET_URL});
  port.onDisconnect.addListener(onDisconnectListener);

  window.addEventListener('unload', () => onDisconnectListener(port));
};

chrome.tabs.query({active: true}, connect);
