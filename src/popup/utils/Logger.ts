import {LOGGER_REQUEST} from '@utils/constants';

/**
 * Helper class for sending messages to content scripts to log to the console.
 */
export class Logger {
  private _port: Port;
  public get port() {
    return this._port;
  }
  public set port(port: Port) {
    this._port = port;
  }
  protected logger = (message: string) => {
    if (DEBUG) {
      this.port.postMessage({type: LOGGER_REQUEST, payload: message});
    }
  };
  public getLogger() {
    if (!this.port) {
      return debug('no port defined!', {trace: new Error().stack});
    }
    return this.logger;
  }
}
