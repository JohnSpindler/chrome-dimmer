const prefersDarkTheme = matchMedia('(prefers-color-scheme: dark)');

export class DocumentBrightness {
  //#region
  protected doc: Document;
  /** Refs that get updated on value change. */
  protected refs: HTMLElement[];
  /** Whether or not document color modifications are disabled. */
  protected disabled_: boolean;
  /**
   * Contains timeouts returned from `setTimeout`.
   * See usage in {@link DocumentBrightness.update}.
   */
  protected timers: number[];
  /** The initial computed document background color before modification. */
  protected initBackgroundColor: string;
  /** The initial computed value for `document.style.transition`. */
  protected initTransition: string;
  /**
   * The duration of the transition animation applied to the brightness change.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transition-duration}
   */
  public static readonly TRANSITION_DURATION = 150;
  /**
   * Style applied to document during change of brightness.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transition}
   */
  public readonly TRANSITION_ANIMATION =
    `background-color ${DocumentBrightness.TRANSITION_DURATION}ms linear` as const;
  //#endregion

  constructor() {
    this.doc = document;
    this.refs = [this.doc.body, ...this.doc.body.querySelectorAll('main')];
    this.disabled_ = true;
    this.timers = [];

    const bodyStyle = getComputedStyle(this.doc.body);
    this.initBackgroundColor = bodyStyle.backgroundColor;
    this.initTransition = bodyStyle.transition;
  }

  public get disabled() {
    DEBUG &&
      (console.groupCollapsed(`get isDisabled ${this.disabled_}`),
      trace(this),
      console.groupEnd());
    return this.disabled_;
  }
  // todo: update to set brightness when reenabling
  public set disabled(disable: boolean) {
    DEBUG &&
      (console.groupCollapsed(`set isDisabled ${disable}`),
      trace(this),
      console.groupEnd());
    // restore colors back to default only if not already disabled
    if (disable && !this.disabled_) {
      this.restoreDefaultColors();
      this.disabled_ = disable;
    }
  }

  protected isDocumentVisible = () => !!this.doc.elementFromPoint(0, 0);

  protected restoreDefaultColors() {
    DEBUG &&
      (console.groupCollapsed('restoreDefaultColors'),
      trace(this),
      console.groupEnd());
    /** @todo STORE INIT COLORS PER REF */
    this.update(this.initBackgroundColor as rgb);
  }

  protected update(value: rgb) {
    DEBUG &&
      (console.groupCollapsed(`update(value: ${value})`),
      trace(this),
      console.groupEnd());
    this.refs.forEach((el, i) => {
      DEBUG &&
        (console.groupCollapsed(`before ${i}`),
        log(
          el,
          el.style.getPropertyValue('backgroundColor'),
          el.style.getPropertyPriority('backgroundColor'),
          el.style.getPropertyValue('transition'),
          el.style.getPropertyPriority('transition'),
        ),
        console.groupEnd());

      clearTimeout(this.timers[i]);
      el.style.transition = this.TRANSITION_ANIMATION;
      el.style.backgroundColor = value;

      this.timers[i] = setTimeout(
        // () => (el.style.transition = this.initTransition),
        () =>
          el.style.setProperty('transition', this.initTransition, 'important'),
        DocumentBrightness.TRANSITION_DURATION * 2,
      ) as unknown as number; // clashes with node's setTimeout return type
      DEBUG &&
        (console.groupCollapsed(`after ${i}`),
        log(
          el,
          el.style.getPropertyValue('backgroundColor'),
          el.style.getPropertyPriority('backgroundColor'),
          el.style.getPropertyValue('transition'),
          el.style.getPropertyPriority('transition'),
        ),
        console.groupEnd());
    });
  }

  /**
   * Sets the document brightness to specified value.
   * If modifications are disabled, returns `false`.
   */
  public set(value: rgb) {
    DEBUG &&
      (console.groupCollapsed(`set(value: ${value})`),
      trace(this),
      console.groupEnd());
    if (this.disabled_ || !this.isDocumentVisible()) {
      return false;
    }
    this.update(value);
    return true;
  }
}
