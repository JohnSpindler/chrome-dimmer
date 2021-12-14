import type {ImageLike} from './isImageLike';

/**
 *
 * @param value         Value to set brightness to. Used to compare with current brightness.
 * @param currentFilter The current filter on the image.
 * @returns Whether or not the filter was changed.
 */
const shouldUpdate = (currentFilter: string, updatedFilter: string) => {
  if (!currentFilter) {
    return true;
  }
  // Don't update if the filter is either already set to either the correct
  // value, or is inverted.
  return ![updatedFilter, 'invert'].some((filter) =>
    currentFilter.includes(filter),
  );
};

export function setImageBrightness(value: number) {
  return function setImageBrightnessCb(image: ImageLike) {
    const updatedFilter = `brightness(${value}%)`;
    // TODO: apply brightness to existing filter.
    // Check the applied filter.
    if (!shouldUpdate(image.style.filter, updatedFilter)) {
      return;
    }

    // Now check computed filter and don't apply filter if one already exists
    // and/or isn't a brightness filter
    const {filter: computedFilter} = getComputedStyle(image);
    if (!shouldUpdate(computedFilter, updatedFilter)) {
      return;
    }
    // TODO: https://stackoverflow.com/a/52721409/12170428
    image.style.filter = updatedFilter;
    image.style.webkitFilter = updatedFilter;
  };
}
