import pkg from '../../package.json';
const {name} = pkg;

export const APP_NAME = name;
export const PORT_NAME = {name};
export const GET_URL = `${APP_NAME}.getUrl`;
export const GET_URL_RESPONSE = `${APP_NAME}.getUrlResponse`;
export const SET_BRIGHTNESS = `${APP_NAME}.setBrightness`;
