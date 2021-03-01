export function debounce<T extends Function>(
  fn: T,
  time: number = 20
): () => void {
  let timer = 0;
  let num = 0;
  return function () {
    const args = arguments;

    const functionCall = () => {
      num = 0;
      return fn.apply(this, args);
    };

    window.clearTimeout(timer);

    // this ensures a smooth visual transition by checking that there
    // are not too many changes in between the function call to.
    const timeout = num++ > 10 ? 0 : time;
    timer = window.setTimeout(functionCall, num++ > 10 ? 0 : timeout);
  };
}

export default debounce;
