import type {Observer} from './Observer';

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

export const getChromeDimmerInstance = (): {
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
