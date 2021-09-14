import {getStorage, setStorage} from '@utils';
import type {LoggerFn} from './Logger';

export class URLStorageHelper {
  private disabled_: boolean;
  private url_: Maybe<string>;
  private urlValue_: Maybe<uint>;

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
    this.url_ = url;
    this.urlValue_ = urlValue;
    this.disabled_ = false;
  }

  /* getters & setters */
  public get disabled() {
    return this.disabled_;
  }
  public set disabled(value: boolean) {
    this.disabled_ = value;
    this.save();
  }
  public get url() {
    return this.url_;
  }
  public set url(value: string) {
    this.url_ = value;
  }
  public get urlValue() {
    return this.urlValue_;
  }
  public set urlValue(value: uint) {
    this.urlValue_ = value;
    this.save();
  }

  /* methods */
  public load(url: string, callback: typeof getStorage.cb) {
    const getStorageCb: typeof getStorage.cb = (items) => {
      debug('urlStorageHelper->load()', {url, items});
      const {disabled, value} = items[url];
      this.log({url, items: items[url]});
      this.url_ = url;
      this.disabled_ = disabled;
      this.urlValue_ = value;

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
