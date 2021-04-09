import forEach from 'lodash-es/forEach';
import debounce from 'lodash-es/debounce';
import { defaultMemoize } from 'reselect';
export const DwSwipe = (baseElement) => class extends baseElement {
  static get properties() {
    return {

      /**
       * Swipe is disabled or not.
       */
      swipeDisabled: { type: Boolean },

      /**
       * Number of pixels. If total movement (mouse or touch) is less than this number, than it won't be considered a
       * swipe event and at the end scroll will be restored to the start position.
       * Default value: `25`.
       */
      swipeMinDisplacement: { type: Number },

      /**
       * Number of pixels. Actual move/scroll operation will be started only when user moves (mouse or touch) by
       * these many pixels. 
       * Default value: `25`.
       */
      swipeRestraint: { type: Number },

      /**
       * Could be 'horizontal' or 'vertical' (for vertical slider).
       * Default value: `horizontal`.
       */
      swipeDirection: { type: String, reflect: true },

      /**
       * How many slides are a move to next/previous?
       * Default value: `1`
       */
      swipeMultiplier: { type: Number }
    }
  }

  constructor() {
    super();
    this.swipeMinDisplacement = 25;
    this.swipeRestraint = 25;
    this.swipeDirection = 'horizontal';
    this.swipeMultiplier = 1;

    this.__swipeResetInstanceProps();
    this.__swipeStart = this.__swipeStart.bind(this);
    this.__swipeEnd = this.__swipeEnd.bind(this);
    this.__swipeMove = this.__swipeMove.bind(this);
    this.__swipeResetCurrentSlideindex = debounce(this.__swipeResetCurrentSlideindex.bind(this), 2000);

    //Memoize function for swipe containre Boundary.
    this.___swipeContainerBoundryMemoize = defaultMemoize(this.___swipeContainerBoundryMemoize.bind(this));

    this.swipeDisabled = false;
  }

  /**
   * Setter of swipeDisabled.
   */
  set swipeDisabled(value) {
    let oldValue = this.__swipeDisabled;
    if (oldValue == value) {
      return;
    }

    this.requestUpdate('swipeDisabled', oldValue);
    this.__swipeDisabled = value;
    this.__swipeDisabled ? this._swipeDestroy() : this._swipeInit();
  }

  /**
   * Getter of swiperEnabled.
   */
  get swipeDisabled() {
    return this.__swipeDisabled;
  }

  disconnectedCallback() {
    this._swipeDestroy();
    super.disconnectedCallback && super.disconnectedCallback();
  }

  /**
   * Apply swipe.
   */
  firstUpdated() {
    super.firstUpdated && super.firstUpdated();
    this.updateComplete.then(() => {
      this.swipeDisabled ? this._swipeDestroy() : this._swipeInit();
    });
  }

  /**
   * Intialz swipe when swipe is Enable.
   * @protected
   */
  _swipeInit() {
    if (this.swipeDisabled) {
      return;
    }

    this.__swipeResetInstanceProps();
    this.updateComplete.then(() => {
      this._swipeContainer = this.shadowRoot.querySelector('.dw-swipe-container');
      this._swipeSliderFrame = this.shadowRoot.querySelector('.dw-swipe-slider-frame');
      if (!this._swipeContainer) {
        throw new Error('Something wrong with your swipe container selector');
      }

      if (!this._swipeSliderFrame) {
        throw new Error('Something wrong with your swipe slider frame selector');
      }

      //Old event listner remove.
      this.__swipeUnbindEventListner();
      this.__swipeBindEventListner();
      this._swipeUpdateStyling();
    });
  }

  /**
   * Destroy swipe.
   * @protected
   */
  _swipeDestroy() {
    this._swipeUpdateStyling();
    this.__swipeUnbindEventListner();
    this.__swipeResetInstanceProps();
  }

  /**
   * Update swipe style.
   * @protected
   */
  _swipeUpdateStyling() {
    this.__swipeManageContainerStyle();
    this.__swipeManageSliderFrameStyle();
  }

  /**
   * Find next slide index.
   * @protected
   */
  _swipeFindNextSlideIndex() {
    let currentSlideIndex = this._getSwipeCurrentSlideIndex();
    let swipeMultiplier = this.swipeMultiplier > 0 ? this.swipeMultiplier : 1;
    let newSlideIndex = currentSlideIndex + swipeMultiplier;
    return (newSlideIndex > this._getSwipeSlidesLength()) ? this._getSwipeSlidesLength() : newSlideIndex;
  }

  /**
   * Find prev slide index.
   */
  _swipeFindPrevSlideIndex() {
    let currentSlideIndex = this._getSwipeCurrentSlideIndex();
    let swipeMultiplier = this.swipeMultiplier > 0 ? this.swipeMultiplier : 1;
    let newSlideIndex = currentSlideIndex - swipeMultiplier;
    return (newSlideIndex < 0) ? 0 : newSlideIndex;
  }

  /**
   * Find next item top/left position.
   * @protected
   */
  _swipeFindNext() {
    let swipeMultiplier = this.swipeMultiplier > 0 ? this.swipeMultiplier : 1;
    let newIndex = this._getSwipeCurrentSlideIndex() + swipeMultiplier;
    let element = this._getSwipeSlideEl(newIndex) || this._getSwipeSlideEl(this._getSwipeSlidesLength());
    return this.swipeDirection == 'horizontal' ? element.offsetLeft : element.offsetTop;
  }

  /**
   * Find previous item top/left position.
   * @protected
   */
  _swipeFindPrev() {
    let swipeMultiplier = this.swipeMultiplier > 0 ? this.swipeMultiplier : 1;
    let newIndex = this._getSwipeCurrentSlideIndex() - swipeMultiplier;
    let element = this._getSwipeSlideEl(newIndex) || this._getSwipeSlideEl(0);
    return this.swipeDirection == 'horizontal' ? element.offsetLeft : element.offsetTop;
  }

  /**
   * Restore swipe to current element.
   * @protected
   */
  _swipeRestore() {
    let offset = this._getSwipeCurrentOffest();
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      this._swipeScrollToPosition(this._getSwipeSliderLength() - this._getSwipeContainerLength());
      return;
    }

    if (offset < 0) {
      this._swipeScrollToPosition(0);
      return;
    }

    this._swipeScrollToPosition(offset);
  }

  /**
   * Swipe to next element.
   * @param {Boolean} disableTransition swipe without animation then passed this argument as a true.
   * @returns {Boolean} next swipe is possible or not.
   * @protected 
   */
  _swipeNext(disableTransition) {
    let offset = this._swipeFindNext();

    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      offset = this._getSwipeSliderLength() - this._getSwipeContainerLength();
    }

    this._swipeScrollToPosition(offset, disableTransition);
    this.__currentSlideIndex = this._swipeFindNextSlideIndex();
    this.dispatchEvent(new CustomEvent('swipe-next', { detail: { offset } }, { bubbles: false }));
    return this._swipeCanScrollBottom();
  }

  /**
   * Swipe to prev element.
   * @param {Boolean} disableTransition swipe without animation then passed this argument as a true.
   * @returns {Boolean} previous swipe is possible or not.
   * @protected
   */
  _swipePrev(disableTransition) {
    let offset = this._swipeFindPrev();

    //If preve element is first element of slider.
    if (offset < 0) {
      offset = 0;
    }

    this._swipeScrollToPosition(offset, disableTransition);
    this.__currentSlideIndex = this._swipeFindPrevSlideIndex();
    this.dispatchEvent(new CustomEvent('swipe-prev', { detail: { offset } }, { bubbles: false }));
    return this._swipeCanScrollTop();
  }

  /**
   * Swipe to specific position.
   * @param {Boolean} disableTransition swipe without animation then passed this argument as a true.
   * @protected
   */
  _swipeScrollToPosition(pos, disableTransition) { 
    if (disableTransition) {
      this.__swipeDisableTransition();
    } else {
      this.__swipeEnableTransition();
    }

    if (this.swipeDirection == 'horizontal') {
      this._swipeSliderFrame.style[this.__webkitOrNot()] = `translate3d(${-1 * pos}px, 0, 0)`;
    } else {
      this._swipeSliderFrame.style[this.__webkitOrNot()] = `translate3d(0, ${-1 * pos}px, 0)`;
    }
  }

  _getSwipeValidPosition(pos) {
    if (pos < 0) {
      return 0;
    }

    if ((pos + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      return this._getSwipeSliderLength() - this._getSwipeContainerLength();
    }

    return pos;
  }

  /**
   * Change scroll based on given `pixel` and `topScroll`.
   * @param {Number} pixel How many pixel scroll changed?
   * @param {Boolean} topScroll which side scroll is changed?
   * @protected
   */
  _swipeScroll(pixel, topScroll) {
    let scrollLength = this._getSwipeTransformLength();

    if (isNaN(scrollLength)) {
      return false;
    }

    //If already top.
    if (topScroll && !this._swipeCanScrollTop()) {
      return false;
    }

    //If alredy bottom.
    if (!topScroll && !this._swipeCanScrollBottom()) {
      return false;
    }

    let newScrollLength = (topScroll) ? scrollLength - pixel : scrollLength + pixel;
    newScrollLength = this._getSwipeValidPosition(newScrollLength);
    this._swipeScrollToPosition(newScrollLength);
    return true;
  }

  /**
   * @returns {Boolean} `true` when possible to scroll top, `false` otherwise.
   * @protected
   */
  _swipeCanScrollTop() {
    return this._getSwipeTransformLength() > 0;
  }

  /**
   * @returns {Boolean} `true` when possible to scroll bottom, `false` otherwise.
   * @protected
   */
  _swipeCanScrollBottom() {
    return (this._getSwipeTransformLength() + this._getSwipeContainerLength()) < this._getSwipeSliderLength();
  }

  /**
   * @returns {Number} swipe transform length based on `swipeDirection`.
   * @protected
   */
  _getSwipeTransformLength() {
    if (!this._swipeSliderFrame) {
      return;
    }

    let values = this._swipeSliderFrame.style[this.__webkitOrNot()].split(/\w+\(|\);?/);
    let transform = values[1] && values[1].split(/,\s?/g).map(parseInt) || [];

    if (this.swipeDirection == 'horizontal') {
      return Math.abs(transform && transform[0] || 0);
    }

    return Math.abs(transform && transform[1] || 0);
  }

  /**
   * Swipe to specific index.
   * @param {Number} index Index up to which slide you have to swipe
   * @param {Boolean} disableTransition swipe without animation then passed this argument as a true.
   * @protected
   */
  _swipeScrollToIndex(index, disableTransition) {
    let element = this._getSwipeSlideEl(index) || this._getSwipeSlideEl(0);
    if (!element) {
      console.warn('No swipeable element availabe.');
      return;
    }
    let offset = this.swipeDirection == 'horizontal' ? element.offsetLeft : element.offsetTop;
    //If preve element is first element of slider.
    if (offset < 0) {
      this._swipeScrollToPosition(0, disableTransition);
      return;
    }

    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      this._swipeScrollToPosition(this._getSwipeSliderLength() - this._getSwipeContainerLength(), disableTransition);
      return;
    }
    this._swipeScrollToPosition(offset, disableTransition);
  }

  /**
   * @returns {Array} slide elements.
   * @protected
   */
  _getSwipeSlideElements() {
    return this._swipeSliderFrame && this._swipeSliderFrame.children || [];
  }

  /**
   * @returns {Number} slides length.
   * @protected
   */
  _getSwipeSlidesLength() {
    let swipeSlideElements = this._getSwipeSlideElements();
    let length = swipeSlideElements && swipeSlideElements.length - 1;
    return length > 0 ? length : 0;
  }

  /**
   * Memoize function of `_swipeContainerBoundry` based on window height and width.
   * @private
   */
  ___swipeContainerBoundryMemoize() {
    return this._swipeContainer && this._swipeContainer.getBoundingClientRect() || {};
  }

  /**
   * @returns {Array} swipe container boundry.
   * @protected
   */
  _swipeContainerBoundry() {
    return this.___swipeContainerBoundryMemoize(`${window.innerHeight}-${window.innerWidth}`);
  }

  /**
   * @returns {Number} current slide index.
   * @protected
   */
  _getSwipeCurrentSlideIndex() {
    //If current slide index is already defined then avoid to re-compute.
    if (this.__currentSlideIndex !== undefined) {
      return this.__currentSlideIndex;
    }

    let currentSlide;
    let swipeSlideElements = this._getSwipeSlideElements();
    let swipeContainerBoundry = this._swipeContainerBoundry();
    let swipeContainerTopLength = this.swipeDirection == 'horizontal' ? swipeContainerBoundry.left : swipeContainerBoundry.top;

    forEach(swipeSlideElements, (element, index) => {
      let elementBoundary = element.getBoundingClientRect();

      let elmentTopLength = this.swipeDirection == 'horizontal' ? elementBoundary.left : elementBoundary.top;
      if (Math.trunc(elmentTopLength) >= Math.trunc(swipeContainerTopLength)) {
        currentSlide = index;
        return false;
      }
    });
    return currentSlide;
  }

  /**
   * @param {Number} Passed index to get slide element.
   * @returns {Element} slide element for passed `index`.
   * @protected
   */
  _getSwipeSlideEl(index) {
    let swipeSlideElements = this._getSwipeSlideElements();
    return swipeSlideElements && swipeSlideElements[index] || null;
  }

  /**
   * @returns {Number} swipe container length.
   * @protected
   */
  _getSwipeContainerLength() {
    if (this.swipeDirection == 'horizontal') {
      return this._swipeContainer && this._swipeContainer.offsetWidth || 0;
    }
    return this._swipeContainer && this._swipeContainer.offsetHeight || 0;
  }

  /**
   * @returns {Numner} swipe slier length.
   * @protected
   */
  _getSwipeSliderLength() {
    if (this.swipeDirection == 'horizontal') {
      return this._swipeSliderFrame && this._swipeSliderFrame.offsetWidth || 0;
    }
    return this._swipeSliderFrame && this._swipeSliderFrame.offsetHeight || 0;
  }

  /**
   * @return {Number} current slide top length.
   * @protected
   */
  _getSwipeCurrentOffest() {
    let element = this._getSwipeSlideEl(this.__currentSlideIndex);
    let offset = (this.swipeDirection == 'horizontal') ? element && element.offsetLeft || 0 : element && element.offsetTop || 0;

    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      offset = this._getSwipeSliderLength() - this._getSwipeContainerLength();
    }

    //If current slide is first element of slider.
    if (offset < 0) {
      offset = 0;
    }

    return offset;
  }

  /**
   * Apply style to swipe container.
   * @private
   */
  __swipeManageContainerStyle() {
    if (this._swipeContainer) {
      if (!this.swipeDisabled) {
        this._swipeContainer.style.overflow = 'hidden';
        this._swipeContainer.style.overscrollBehavior = 'none';
        return;
      }
      this._swipeContainer.style.overflow = 'auto';
      this._swipeContainer.style.overscrollBehavior = 'auto';
    }
  }

  /**
   * Apply style to swipe slider frame style.
   * @private
   */
  __swipeManageSliderFrameStyle() {
    if (this._swipeSliderFrame) {
      this._swipeSliderFrame.style.display = 'flex';
      this._swipeSliderFrame.style.position = 'relative';
      this._swipeSliderFrame.style.flexDirection = (this.swipeDirection == 'horizontal') ? 'row' : 'column';
      if (this.swipeDirection == 'horizontal') {
        this._swipeSliderFrame.style.minWidth = '-webkit-fit-content';
        this._swipeSliderFrame.style.minWidth = '-moz-fit-content';
        this._swipeSliderFrame.style.minWidth = 'fit-content';
        this._swipeSliderFrame.style.height = '100%';
      }

      if (this.swipeDirection === 'vertical') {
        this._swipeSliderFrame.style.width = '100%';
        this._swipeSliderFrame.style.minHeight = '-webkit-fit-content';
        this._swipeSliderFrame.style.minHeight = '-moz-fit-content';
        this._swipeSliderFrame.style.minHeight = 'fit-content';
      }
    }
  }

  /**
   * Bind  swipe events.
   * @private
   */
  __swipeBindEventListner() {
    if (!this._swipeContainer) {
      return;
    }

    //If swipe is disabled.
    if (this.swipeDisabled) {
      return;
    }

    //For swipe start
    this._swipeContainer.addEventListener('mousedown', this.__swipeStart);
    this._swipeContainer.addEventListener('touchstart', this.__swipeStart);

    //For swipe move
    this._swipeContainer.addEventListener('mousemove', this.__swipeMove);
    this._swipeContainer.addEventListener('touchmove', this.__swipeMove);

    //For swipe end
    this._swipeContainer.addEventListener('mouseup', this.__swipeEnd);
    this._swipeContainer.addEventListener('touchend', this.__swipeEnd);
    this._swipeContainer.addEventListener('mouseleave', this.__swipeEnd);

  }

  /**
   * Unbind swipe event.
   * @private
   */
  __swipeUnbindEventListner() {
    if (!this._swipeContainer) {
      return;
    }

    this._swipeContainer.removeEventListener('mousedown', this.__swipeStart);
    this._swipeContainer.removeEventListener('touchstart', this.__swipeStart);
    this._swipeContainer.removeEventListener('mousemove', this.__swipeMove);
    this._swipeContainer.removeEventListener('touchmove', this.__swipeMove);
    this._swipeContainer.removeEventListener('mouseup', this.__swipeEnd);
    this._swipeContainer.removeEventListener('touchend', this.__swipeEnd);
    this._swipeContainer.removeEventListener('mouseleave', this.__swipeEnd);

  }

  /**
   * When event is touch then return first finger event.
   * Otherwise return same event.
   * @private
   */
  __swipeEventUnify(e) {
    return e.changedTouches ? e.changedTouches[0] : e
  }

  /**
   * Swipe start.
   * @private
   */
  __swipeStart(e) {
    //Don't start swipe operation when user has used more than 1 finger. 
    if (e.touches && e.touches.length > 1) {
      return;
    }

    this.__swipePointerDown = true;
    this.__position.startX = this.__swipeEventUnify(e).clientX;
    this.__position.startY = this.__swipeEventUnify(e).clientY;
    this.__swipeThresholdCrossed = false;
  }


  /**
   * Reset current index.
   * When the swipe process is not completed then reset current index.
   * @private
   */
  __swipeResetCurrentSlideindex() {
    //If the swipe process is not completed.
    if (!this.__swipePointerDown) {
      this.__currentSlideIndex = undefined;
    }
  }

  /**
   * Swipe move.
   * @private
   */
  __swipeMove(e) {
    if (this.__swipePointerDown) {
      this.__position.endX = this.__swipeEventUnify(e).clientX;
      this.__position.endY = this.__swipeEventUnify(e).clientY;

      this.__position.distX = this.__position.endX - this.__position.startX;
      this.__position.distY = this.__position.endY - this.__position.startY;

      let distX = this.__position.distX;
      let distY = this.__position.distY;

      if (this.__currentSlideIndex === undefined) {
        this.__currentSlideIndex = this._getSwipeCurrentSlideIndex();
      }

      let currentOffset = this._getSwipeCurrentOffest();
      let positionOffset = this.swipeDirection == 'horizontal' ? distX : distY;

      if (!this.__swipeThresholdCrossed && Math.abs(positionOffset) <= this.swipeRestraint) {
        return;
      }

      //If user has moved a lot in opposite direction than the targetted travel duration, skip processing
      if ((this.swipeDirection == 'horizontal' && Math.abs(distY) > Math.abs(distX)) ||
        (this.swipeDirection == 'vertical' && Math.abs(distX) > Math.abs(distY))) {
        return;
      }

      //When reached at the start (first slide) the no further drag to the right is allowed.
      if (currentOffset == 0 && positionOffset > 0) {
        return;
      }

      //When reached at the end then no further drag to the left is allowed.
      if ((currentOffset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength() && positionOffset < 0) {
        return;
      }

      if (!this.__swipeThresholdCrossed) {
        this.__swipeThresholdCrossed = true;
        this.__swipeDisableTransition();
      }

      let movePosition = currentOffset - positionOffset;

      //If new scroll position is causing over-scroll, limit it.
      if ((movePosition + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
        movePosition = this._getSwipeSliderLength() - this._getSwipeContainerLength();
      }

      this._swipeScrollToPosition(movePosition);
    }
  }

  /**
   * Swipe end.
   * @private
   */
  __swipeEnd(e) {
    if (this.__swipePointerDown && this.__swipeThresholdCrossed) {
      this.__position.endX = this.__swipeEventUnify(e).clientX;
      this.__position.endY = this.__swipeEventUnify(e).clientY;
      this.__position.distX = this.__position.endX - this.__position.startX;
      this.__position.distY = this.__position.endY - this.__position.startY;
      this.__swipeEnableTransition();
      this.__fireSwipeEvent()
    }

    this.__swipePointerDown = false;
    this.__resetPosition();

    //If already current slide index set then reset after 2 seconds.
    if (this.__currentSlideIndex !== undefined) {
      this.__swipeResetCurrentSlideindex();
    }
  }

  /**
   * Detect Swipe event.
   * e.g. right, left, top, bottom
   * @private
   */
  __detectSwipeEvent() {
    let swipeEvent;
    let distX = Math.abs(this.__position.distX);
    let distY = Math.abs(this.__position.distY);
    if (this.swipeDirection == 'horizontal' && distX >= this.swipeMinDisplacement && distX > distY) {
      swipeEvent = (this.__position.distX < 0) ? 'next' : 'prev';
    }
    else if (this.swipeDirection == 'vertical' && distY >= this.swipeMinDisplacement && distY > distX) {
      swipeEvent = (this.__position.distY < 0) ? 'next' : 'prev';
    }
    return swipeEvent;
  }

  /**
   * Fire swipe event.
   * @private
   */
  __fireSwipeEvent() {
    let swipeEvent = this.__detectSwipeEvent();

    if (swipeEvent == 'next') {
      this._swipeNext();
      return;
    }

    if (swipeEvent == 'prev') {
      this._swipePrev();
      return;
    }

    this._swipeRestore();
  }

  /**
   * Disable transition on sliderFrame.
   * @private
   */
  __swipeDisableTransition() {
    if (this._swipeSliderFrame) {
      this._swipeSliderFrame.style.webkitTransition = `all 0ms ease-out`;
      this._swipeSliderFrame.style.transition = `all 0ms ease-out`;
    }
  }

  /**
   * Enable transition on sliderFrame.
   * @private
   */
  __swipeEnableTransition() {
    if (this._swipeSliderFrame) {
      this._swipeSliderFrame.style.webkitTransition = `all 200ms ease-out`;
      this._swipeSliderFrame.style.transition = `all 200ms ease-out`;
    }
  }

  /**
   * Clear position after touchend and mouseup event.
   * @private
   */
  __resetPosition() {
    this.__position = {
      startX: 0,
      endX: 0,
      startY: 0,
      endY: 0,
      distX: 0,
      distY: 0
    };
  }

  /**
   * Reset swipe instance props.
   * @protected
   */
  __swipeResetInstanceProps() {
    this.__resetPosition();
    this.__swipePointerDown = false;
    this.__currentSlideIndex = undefined;
  }

  /**
   * Determine if browser supports unprefixed transform property.
   * Google Chrome since version 26 supports prefix-less transform.
   * Firefox since version 50 support prefix-less transform.
   * @returns {string} - Transform property supported by client.
   */
  __webkitOrNot() {
    const style = document.documentElement.style;
    if (typeof style.transform === 'string') {
      return 'transform';
    }

    if (typeof style.MozTransform === 'string') {
      return 'MozTransform';
    }

    return 'WebkitTransform';
  }
}