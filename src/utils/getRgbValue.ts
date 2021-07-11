export const getRgbVal = (numberVal: number = 100): rgb => {
  const scaledVal = (2.55 * numberVal).toFixed() as uintStr;
  // @ts-ignore
  return `rgb(${scaledVal},${scaledVal},${scaledVal})` as rgb;
};
