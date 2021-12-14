/**
 * @fileoverview Initializes an observer on images lazy loaded in the document.
 *
 * `getChromeDimmerInstance()` and helper functions are derived from
 * https://github.com/darkreader/darkreader/blob/master/src/inject/dynamic-theme/index.ts
 */
import {Observer} from './Observer';
import type {ObserverCallback} from './Observer';
import {setImageBrightness} from '../..';
import {getChromeDimmerInstance} from './getChromeDimmerInstance';

export class ImageObserver {
  protected readonly doc: Document;
  protected readonly observer: Observer | null;
  protected brightness: number;
  protected disabled: boolean;

  protected readonly setImageBrightness: (value: number) => ObserverCallback;
  constructor() {
    this.doc = document;
    this.setImageBrightness = setImageBrightness;
    this.observer = null;

    const {instanceRef, result} = getChromeDimmerInstance();
    debug('chromeDimmerInstance', {instanceRef, result});

    switch (result) {
      case -1:
        this.disabled = true;
        break;
      case 0:
      case 1:
        this.disabled = false;
        this.observer = new Observer(this.doc);
        instanceRef.observerRef = this.observer;
        break;
    }
  }

  public setBrightness(brightness: number) {
    this.brightness = brightness;
    return this;
  }

  /** Enable observer on any images loaded into the document. */
  public watch() {
    if (!this.disabled) {
      this.observer?.observe(this.setImageBrightness(this.brightness));
    }
  }
  /** Disables observer when message from popup is received. */
  public unwatch() {
    this.observer?.disconnect();
  }
}
