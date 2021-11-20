const debugGroup = (groupLabel, traceMessage, ...content) => {
  if (DEBUG) {
    console.groupCollapsed(groupLabel);
    console.trace(traceMessage, content);
    console.groupEnd();
  }
};

// `readonly` props are only to denote that they never get updated.
// They may change if needed in future update.
export class DocumentBrightness {
  //#region
  protected readonly doc: Document;
  /** Refs that get updated on value change. */
  protected readonly refs: HTMLElement[];
  /** Whether or not document color modifications are disabled. */
  protected disabled_: boolean;
  /**
   * Contains timeouts returned from `setTimeout`.
   * See usage in {@link DocumentBrightness.update}.
   */
  protected readonly timers: number[];
  /** The initial computed document background color before modification. */
  protected readonly initBackgroundColor: string;
  /** The initial computed value for `document.style.transition`. */
  protected readonly initTransition: string;
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
    this.refs = [this.doc.body /* ...this.doc.body.querySelectorAll('main') */];
    this.disabled_ = true;
    this.timers = [];

    const bodyStyle = getComputedStyle(this.doc.body);
    this.initBackgroundColor = bodyStyle.backgroundColor;
    this.initTransition = bodyStyle.transition;
  }

  public get disabled() {
    debugGroup(`get disabled: ${this.disabled_}`, this);
    return this.disabled_;
  }
  // todo: update to set brightness when reenabling
  public set disabled(disable: boolean) {
    debugGroup(`set disabled: ${disable}`, `previous: ${this.disabled_}`, this);
    // restore colors back to default only if not already disabled
    if (disable && !this.disabled_) {
      this.restoreDefaultColors();
      this.disabled_ = disable;
    }
  }

  protected isDocumentVisible = () => !!this.doc.elementFromPoint(0, 0);

  protected restoreDefaultColors() {
    debug('restoreDefaultColors', this.initBackgroundColor);
    /** @todo store init colors per ref */
    this.update(this.initBackgroundColor as rgb);
  }

  protected update(value: rgb) {
    debugGroup(`update: ${value}`, this);
    this.refs.forEach((el, i) => {
      clearTimeout(this.timers[i]);
      el.style.transition = this.TRANSITION_ANIMATION;
      el.style.backgroundColor = value;

      this.timers[i] = setTimeout(
        () =>
          el.style.setProperty('transition', this.initTransition, 'important'),
        DocumentBrightness.TRANSITION_DURATION * 2,
      );
    });
  }

  /**
   * Sets the document brightness to specified value.
   * If modifications are disabled, returns `false`.
   */
  public set(value: rgb) {
    debugGroup(`set(value: ${value})`, this);
    if (this.disabled_ || !this.isDocumentVisible()) {
      return false;
    }
    this.update(value);
    return true;
  }
}
