import pkg from '../package.json';
const {name} = pkg;

export const PORT_NAME = {name};
export const GET_URL = `${PORT_NAME}.getUrl`;
export const SET_BRIGHTNESS = `${PORT_NAME}.setBrightness`;
