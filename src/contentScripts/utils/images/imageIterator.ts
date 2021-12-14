import {isImageLike} from './isImageLike';
import type {ImageLike} from './isImageLike';

export class IterableNodeIterator {
  nodeIterator = document.createNodeIterator(
    document,
    // Only consider nodes that are element nodes (nodeType 1)
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        return isImageLike(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    },
  );
  *[Symbol.iterator]() {
    while (this.nodeIterator.nextNode()) {
      yield this.nodeIterator.referenceNode as ImageLike;
    }
  }
}
