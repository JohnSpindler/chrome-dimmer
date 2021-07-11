import {getStorage, setStorage} from '@utils';

export class URLStorageHelper {
  private _disabled: boolean;
  private _url: Maybe<string>;
  private _urlValue: Maybe<uint>;

  constructor({url = null, urlValue = null} = {url: null, urlValue: null}) {
    this._url = url;
    this._urlValue = urlValue;
    this._disabled = false;
  }

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

  public load(
    url: string,
    callback: (items: {[key: string]: ExtensionStorageValues}) => any
  ) {
    getStorage(url, (items) => {
      debug('urlStorageHelper->load()', {url, items});
      const {disabled, value} = items[url];
      this._url = url;
      this._disabled = disabled;
      this._urlValue = value;
      callback(items);
    });
  }
  public save = () => {
    if (this.url) {
      setStorage({
        [this.url]: {disabled: this.disabled, value: this.urlValue},
      });
    }
  };
}
