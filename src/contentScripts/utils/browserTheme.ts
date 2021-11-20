// TODO: allow user-defined custom selectors
export const isDocumentInDarkMode = () =>
  document.querySelector('[data-color-mode]')?.attributes?.['data-color-mode']
    ?.value === 'dark' || !!document.querySelector('meta[name="darkreader"]');

export const prefersDarkTheme = matchMedia('(prefers-color-scheme: dark)');
