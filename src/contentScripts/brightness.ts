import {GET_URL, SET_BRIGHTNESS, PORT_NAME} from '../constants';

const initTransition = document.body.style.transition;

const setBrightness = (value: Brightness): void => {
  const {numberVal, rgbVal} = value;

  document.body.style.backgroundColor = rgbVal;

  const docImages = [...document.getElementsByTagName('img')];
  docImages.forEach((img) => (img.style.filter = `brightness(${numberVal}%)`));
};

const onDisconnect: OnDisconnectListener = (port) => {
  document.body.style.transition = initTransition;
  port.onDisconnect.removeListener(onDisconnect);
  port.disconnect();
};

const onMessageListener: OnMessageListener = (message, port) => {
  switch (message.type) {
    case SET_BRIGHTNESS: {
      document.body.style.transition = 'background-color 100ms linear';
      setBrightness(message.value);
      break;
    }
    case GET_URL:
      port.postMessage(location.host);
      break;
    default: {
      port.disconnect();
      return;
    }
  }
};

const onConnectListener: OnConnectListener = (port) => {
  if (port.sender?.id === EXTENSION_ID) {
    switch (port.name) {
      case PORT_NAME.name: {
        port.onMessage.addListener(onMessageListener);
        break;
      }
      default: {
        port.disconnect();
        return;
      }
    }
  }
  port.onDisconnect.addListener(onDisconnect);
};

chrome.runtime.onConnect.addListener(onConnectListener);
