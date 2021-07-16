import {LOGGER_REQUEST} from '@utils/constants';

export type LoggerFn = ReturnType<typeof Logger.prototype.getLogger>;

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

  protected log = (...message: any[]) => {
    if (DEBUG) {
      this.port.postMessage({type: LOGGER_REQUEST, payload: message});
    }
  };
  public getLogger() {
    if (!this.port) {
      console.trace('no port defined!');
    }
    return this.log;
  }
}
