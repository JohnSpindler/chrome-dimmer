import {getStorage, setStorage} from '@utils';
import type {LoggerFn} from './Logger';

export class URLStorageHelper {
  private _disabled: boolean;
  private _url: Maybe<string>;
  private _urlValue: Maybe<uint>;

  protected logger: LoggerFn;

  public static readonly DEFAULTS: {
    url: Maybe<string>;
    urlValue: Maybe<uint>;
  } = {
    url: null,
    urlValue: null,
  };

  constructor(
    {
      url = URLStorageHelper.DEFAULTS.url,
      urlValue = URLStorageHelper.DEFAULTS.urlValue,
    }: typeof URLStorageHelper.DEFAULTS = URLStorageHelper.DEFAULTS
  ) {
    this._url = url;
    this._urlValue = urlValue;
    this._disabled = false;
  }

  /* getters & setters */
  public get disabled() {
    return this._disabled;
  }
  public set disabled(value: boolean) {
    this._disabled = value;
    this.save();
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

  /* methods */
  public load(url: string, callback: typeof getStorage.cb) {
    const getStorageCb: typeof getStorage.cb = (items) => {
      debug('urlStorageHelper->load()', {url, items});
      const {disabled, value} = items[url];
      this.log({url, items: items[url]});
      this._url = url;
      this._disabled = disabled;
      this._urlValue = value;

      callback(items);
    };

    getStorage(url, getStorageCb);
  }
  public save = () => {
    if (this.url) {
      setStorage({
        [this.url]: {disabled: this.disabled, value: this.urlValue},
      });
    } else {
      console.trace('failed saving to storage', this);
    }
  };
  public setFrontendLogger(logger: LoggerFn) {
    this.logger = logger;
  }

  protected log: LoggerFn = (...message) => {
    if (!this.logger) {
      console.trace(
        '"URLStorageHelper.prototype.log" called before "logger" was defined',
        ...message
      );
      return;
    }
    this.logger(...message);
  };
}
