/**
 * @fileoverview Initializes an observer on images lazy loaded in the document.
 *
 * Some functions within this file are adapted from
 * https://github.com/darkreader/darkreader/blob/master/src/inject/dynamic-theme/index.ts
 */

/***/
type MetaWithObserverRef = HTMLMetaElement & {
  observerRef?: Observer;
};

const generateUID = () => {
  const hexify = (num: number) => `${num < 16 ? '0' : ''}${num.toString(16)}`;
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((x) => hexify(x))
    .join('');
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
  const meta: MetaWithObserverRef = document.querySelector(
    `meta[name="${APP_NAME}"]`
  );
  if (meta) {
    if (meta.content !== INSTANCE_ID) {
      return {result: -1, instanceRef: meta};
    }
    return {result: 1, instanceRef: meta};
  } else {
    return {result: 0, instanceRef: createChromeDimmerInstanceMarker()};
  }
};

class Observer {
  protected callback: (image: HTMLImageElement | HTMLVideoElement) => void;
  protected observee: Node;
  protected isDisconnected_: boolean;
  protected observer: MutationObserver;

  constructor(observee: typeof Observer.prototype.observee) {
    this.observee = observee;
    this.isDisconnected = true;
  }

  protected set isDisconnected(disconnect: boolean) {
    this.isDisconnected_ = disconnect;
  }
  protected get isDisconnected() {
    return this.isDisconnected_;
  }

  protected maybeUpdate = (node: Node) => {
    const isImage = (node: Node): node is HTMLImageElement | HTMLVideoElement =>
      node.nodeName === 'IMG' ||
      node instanceof HTMLImageElement ||
      node.nodeName === 'VIDEO' ||
      node instanceof HTMLVideoElement;
    if (isImage(node)) {
      return this.callback(node);
    }
    node.childNodes.forEach(this.maybeUpdate);
  };

  protected mutationObserver: MutationCallback = (
    mutations: MutationRecord[]
  ): void => {
    const mutationCb = (mutation: MutationRecord) => {
      if (mutation.target) {
        this.maybeUpdate(mutation.target);
      }
      if (mutation.target.childNodes) {
        mutation.target.childNodes?.forEach(this.maybeUpdate);
      }
      if (mutation.addedNodes?.length) {
        mutation.addedNodes.forEach(this.maybeUpdate);
      }
    };

    mutations.forEach(mutationCb);
  };

  public disconnect() {
    this.observer?.disconnect();
    this.isDisconnected = true;
  }

  public observe(callback: typeof Observer.prototype.callback) {
    // allow the callback to be updated
    this.callback = callback;
    if (!this.isDisconnected) {
      return;
    }

    if (!this.observer) {
      this.observer = new MutationObserver(this.mutationObserver);
    }

    this.observer.observe(this.observee, {
      attributes: true,
      attributeFilter: ['currentSrc', 'sizes', 'src', 'srcset'],
      childList: true,
      subtree: true,
    });

    this.isDisconnected = false;
  }
}

export class ImageObserver {
  private doc: Document;
  protected observer: Observer | null = null;
  protected brightness: number;
  protected setImageBrightness: (
    value: number
  ) => (image: HTMLImageElement | HTMLImageElement) => void;

  protected disabled: boolean;
  constructor(
    setImageBrightness: typeof ImageObserver.prototype.setImageBrightness
  ) {
    this.doc = document;
    this.setImageBrightness = setImageBrightness;
    const chromeDimmerInstance = getChromeDimmerInstance();
    const {instanceRef, result} = chromeDimmerInstance;
    // TODO: pass instance ID back to `popup` so popup has the correct URL context
    log('chromeDimmerInstance', {instanceRef, result});

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
      this.observer.observe(this.setImageBrightness(this.brightness));
    }
  }
  /** Disables observer when message from popup is received. */
  public unwatch() {
    this.observer?.disconnect();
  }
}
