import {APP_NAME} from '@utils/constants';

function getImageObserver() {
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
    document.head.appendChild(metaElement);
  };

  const isAnotherChromeDimmerInstanceActive = () => {
    const meta: HTMLMetaElement = document.querySelector(
      `meta[name="${APP_NAME}"]`
    );
    if (meta) {
      if (meta.content !== INSTANCE_ID) {
        return true;
      }
      return false;
    } else {
      createChromeDimmerInstanceMarker();
      return false;
    }
  };

  function getObserver(f: Function) {
    if (isAnotherChromeDimmerInstanceActive()) {
      debug('instance exists');
      return;
    }

    const isImage = ({nodeName}: Node) => nodeName === 'IMG';
    const maybeUpdate = (node: Node) => {
      if (isImage(node)) {
        return f(node);
      }
      node.childNodes.forEach(maybeUpdate);
    };

    const mutationObserver = (mutations: MutationRecord[]) => {
      const mutationCb = (mutation: MutationRecord) => {
        if (mutation.target) {
          maybeUpdate(mutation.target);
        }
        if (mutation.target.childNodes) {
          mutation.target.childNodes?.forEach(maybeUpdate);
        }
        if (mutation.addedNodes?.length) {
          mutation.addedNodes.forEach(maybeUpdate);
        }
      };

      mutations.forEach(mutationCb);
    };

    const imageObserver = new MutationObserver(mutationObserver);

    imageObserver.observe(document, {
      attributes: true,
      attributeFilter: ['currentSrc', 'sizes', 'src', 'srcset'],
      childList: true,
      subtree: true,
    });

    return imageObserver;
  }

  return getObserver;
}

export default getImageObserver();
