type ExtractCallbackType<
  T extends Function,
  I extends number = 0,
> = Parameters<T>[I];

type Maybe<T> = T | null | undefined;
