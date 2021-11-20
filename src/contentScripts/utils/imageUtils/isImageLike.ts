export type ImageLike = HTMLOrSVGImageElement | HTMLVideoElement;

export const isImageLike = (node: Node): node is ImageLike => {
  return ['IMG', 'VIDEO', 'svg'].includes(node?.nodeName);
};
