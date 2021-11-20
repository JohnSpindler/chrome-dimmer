/**
 * @fileoverview Initializes an observer on images lazy loaded in the document.
 *
 * `getChromeDimmerInstance()` and helper functions are derived from
 * https://github.com/darkreader/darkreader/blob/master/src/inject/dynamic-theme/index.ts
 */
import {isImageLike} from './isImageLike';
import {setImageBrightness} from '../../utils';
import type {ImageLike} from './isImageLike';

type MetaWithObserverRef = HTMLMetaElement & {
  observerRef?: Observer;
};

const generateUID = () => {
  const hexify = (num: number) => `${num < 16 ? '0' : ''}${num.toString(16)}`;
  return [...crypto.getRandomValues(new Uint8Array(16))].map(hexify).join('');
};
const INSTANCE_ID = generateUID();

const createChromeDimmerInstanceMarker = () => {
  const metaElement = document.createElement('meta');
  metaElement.name = APP_NAME;
  metaElement.content = INSTANCE_ID;
  return document.head.appendChild(metaElement) as MetaWithObserverRef;
};

const getChromeDimmerInstance = (): {
  result: -1 | 0 | 1;
  instanceRef: MetaWithObserverRef;
} => {
  const meta: MetaWithObserverRef | null = document.querySelector(
    `meta[name="${APP_NAME}"]`,
  );
  if (meta) {
    // meta el already exists but has a different instance ID. Shouldn't happen.
    if (meta.content !== INSTANCE_ID) {
      return {result: -1, instanceRef: meta};
    }
    // meta el already exists from this instance
    return {result: 1, instanceRef: meta};
  } else {
    // create new ref
    return {result: 0, instanceRef: createChromeDimmerInstanceMarker()};
  }
};

type ObserverCallback = (image: ImageLike) => void;

class Observer {
  protected callback: ObserverCallback;
  protected disconnected_: boolean;
  protected observer: MutationObserver;

  constructor(protected observee: Node) {
    this.observee = observee;
    this.disconnected = true;
  }

  protected set disconnected(disconnect: boolean) {
    this.disconnected_ = disconnect;
  }
  protected get disconnected() {
    return this.disconnected_;
  }

  protected maybeUpdate = (node: Node) => {
    if (isImageLike(node)) {
      return this.callback(node);
    }
    node.childNodes.forEach(this.maybeUpdate);
  };

  // should be renamed
  protected mutationObserver = ({
    addedNodes,
    target,
    target: {childNodes},
  }: MutationRecord) => {
    childNodes?.forEach(this.maybeUpdate);
    addedNodes?.forEach(this.maybeUpdate);
    this.maybeUpdate(target);
  };

  public disconnect() {
    this.observer?.disconnect();
    this.disconnected = true;
  }

  public observe(callback: ObserverCallback) {
    // allow the callback to be updated
    this.callback = callback;
    if (!this.disconnected) {
      return;
    }

    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach(this.mutationObserver);
      });
    }

    this.observer.observe(this.observee, {
      attributes: true,
      attributeFilter: ['currentSrc', 'src'],
      childList: true,
      subtree: true,
    });

    this.disconnected = false;
  }
}

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

    const chromeDimmerInstance = getChromeDimmerInstance();
    const {instanceRef, result} = chromeDimmerInstance;
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
