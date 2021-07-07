# v0.0.1 [02/28/2021] - initial commit

- partially working

# v0.0.2 [07/06/2021] - many consistency improvements

- saves brightness on a per-domain basis
- added MutationObserver to watch for any lazy loaded images that load in after initial page load
- disables changing background color when `"data-color-mode"="dark"` theme is detected. e.g. GitHub dark mode
- running `yarn watch` now opens a browser where any changes can be live tested
