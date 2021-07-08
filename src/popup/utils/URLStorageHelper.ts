export class URLStorageHelper {
  private _url: Maybe<string>;
  private _urlValue: Maybe<uint>;
  constructor({url = null, urlValue = null} = {url: null, urlValue: null}) {
    this._url = url;
    this._urlValue = urlValue;
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

  public load(url: string, callback: (items: {[key: string]: uint}) => any) {
    chrome.storage.local.get(url, (items) => {
      debug('urlStorageHelper->load()', {items});
      this.url = url;
      this.urlValue = items[url] ?? 100;
      callback(items);
    });
  }
  public save() {
    debug('urlStorageHelper->save()', {url: this.url});
    if (this.url) {
      if (this.urlValue < 100) {
        chrome.storage.local.set({[this.url]: this.urlValue});
      } else {
        chrome.storage.local.remove(this.url);
      }
    }
  }
}
