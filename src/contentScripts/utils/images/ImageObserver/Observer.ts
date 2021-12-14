import {isImageLike} from '../isImageLike';
import type {ImageLike} from '../isImageLike';

export type ObserverCallback = (image: ImageLike) => void;

export class Observer {
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
