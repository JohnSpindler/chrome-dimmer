import {Logger, URLStorageHelper} from './utils';
import {
  checkRuntimeError,
  debounce,
  getRgbVal,
  GetStorageCallback,
} from '@utils';
import {
  GET_URL_REQUEST,
  GET_URL_RESPONSE,
  PORT_NAME,
  SET_BRIGHTNESS,
} from '@utils/constants';

const urlStorageHelper = new URLStorageHelper();
const logger = new Logger();

function mountListener(port: Port, initValue: ExtensionStorageValues): void {
  const log = logger.getLogger() || noop;
  const slider = document.getElementById('slider') as HTMLInputElement;
  const sliderValueDisplay = document.getElementById('numberValue');
  const sliderRGBDisplay = document.getElementById('rgbValue');
  if (!sliderValueDisplay || !sliderRGBDisplay) {
    return;
  }

  const setBrightness = (val: uint): Brightness => {
    urlStorageHelper.urlValue = val;
    sliderValueDisplay.innerHTML = `${val.toFixed(1)}%`;

    const rgbVal = getRgbVal(val);
    sliderRGBDisplay.innerHTML = rgbVal;

    return {numberVal: val, rgbVal};
  };

  const onSliderValueChange = (_ev: HTMLElementEventMap['input']): void => {
    port.postMessage({
      type: SET_BRIGHTNESS,
      payload: setBrightness(parseFloat(slider.value) as uint),
    });
  };

  setBrightness(initValue.value);
  slider.value = initValue.value.toString();

  // this ensures a smooth visual transition by checking that there
  // are not too many changes in between updates.
  const debouncedOnSliderValueChange = debounce(onSliderValueChange, {
    maxCalls: 10,
  });
  const debouncedUpdateStorage = debounce(urlStorageHelper.save, {
    timeout: 500,
  });

  slider.addEventListener('input', (ev) => {
    debouncedOnSliderValueChange(ev);
    debouncedUpdateStorage();
  });

  const toggleLabel = document.getElementById('toggle-label');
  const inputContent = document.getElementById('toggle-input-url');
  if (!inputContent || !toggleLabel) {
    return;
  }

  const toggleInput = document.getElementById(
    'toggle-input'
  ) as HTMLInputElement;

  if (toggleInput.checked === initValue.disabled) {
    toggleInput.click();
  }

  const onToggleLabelClick = () => {
    const {checked} = toggleInput;
    if (checked === urlStorageHelper.disabled) {
      urlStorageHelper.disabled = !checked;
    }
  };
  toggleLabel.onclick = onToggleLabelClick;

  inputContent.textContent = urlStorageHelper.url.match(/(www\.)?(.*)/)?.[2] || null;
}

const onMessageListener: PortMessageEventListener = (message, port) => {
  if (message.type === GET_URL_RESPONSE) {
    logger.port = port;
    urlStorageHelper.setFrontendLogger(logger.getLogger());
    const {payload} = message;
    const messageStorageLoadCb: GetStorageCallback = (items) => {
      mountListener(port, items[payload]);
    };
    urlStorageHelper.load(payload, messageStorageLoadCb);
  }
  port.onMessage.removeListener(onMessageListener);
  checkRuntimeError();
};

const onDisconnectListener: PortDisconnectEventListener = (port) => {
  port.onDisconnect.removeListener(onDisconnectListener);
  port.disconnect();
  urlStorageHelper.save();
  checkRuntimeError();
};

const connect = (tabs: chrome.tabs.Tab[]) => {
  const port = chrome.tabs.connect(tabs[0].id ?? chrome.tabs.TAB_ID_NONE, PORT_NAME);

  port.onMessage.addListener(onMessageListener);
  port.postMessage({type: GET_URL_REQUEST});

  port.onDisconnect.addListener(onDisconnectListener);
  window.addEventListener('beforeunload', () => onDisconnectListener(port));
  checkRuntimeError();
};

chrome.tabs.query({active: true, currentWindow: true}, connect);
