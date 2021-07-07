export const checkRuntimeError = (trace = new Error().stack) => {
  const ERROR = chrome.runtime.lastError?.message;
  if (ERROR) {
    console.trace(
      'runtime error',
      JSON.stringify({ERROR, TRACE: trace}, null, 2)
    );
  }
};
