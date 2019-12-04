import forEach from 'lodash-es/forEach';
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
      swipeRestraint: {type: Number},

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
    
    this.__swipePointerDown = false;
    this.__resetPosition();
    
    this.__swipeStart = this.__swipeStart.bind(this);
    this.__swipeEnd = this.__swipeEnd.bind(this);
    this.__swipeMove = this.__swipeMove.bind(this);
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
   * Find next item top/left position.
   * @protected
   */
  _swipeFindNext() {
    let swipeMultiplier = this.swipeMultiplier > 0 ? this.swipeMultiplier: 1;
    let newIndex =  this.__currentSlideIndex + swipeMultiplier;
    let swipeSlideElements = this._getSwipeSlideElements();
    let lastSlideElementIndex = swipeSlideElements.length - 1 || 0;
    let element = this._getSwipeSlideEl(newIndex) || this._getSwipeSlideEl(lastSlideElementIndex);
    return this.swipeDirection == 'horizontal' ? element.offsetLeft: element.offsetTop;
  }

  /**
   * Find previous item top/left position.
   * @protected
   */
  _swipeFindPrev() {
    let swipeMultiplier = this.swipeMultiplier > 0 ? this.swipeMultiplier: 1;
    let newIndex =  this.__currentSlideIndex - swipeMultiplier;
    let element = this._getSwipeSlideEl(newIndex) || this._getSwipeSlideEl(0);
    return this.swipeDirection == 'horizontal' ? element.offsetLeft: element.offsetTop;
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

    if(offset < 0) {
      this._swipeScrollToPosition(0);
      return;
    }

    this._swipeScrollToPosition(offset);
  }

  /**
   * Swipe to next element.
   * @protected 
   */
  _swipeNext() {
    let offset = this._swipeFindNext();

    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      offset = this._getSwipeSliderLength() - this._getSwipeContainerLength();
    }

    this._swipeScrollToPosition(offset);
    this.dispatchEvent(new CustomEvent('swipe-next', { detail: {offset}}, { bubbles: false}));
  }

  /**
   * Swipe to prev element.
   * @protected
   */
  _swipePrev() {
    let offset = this._swipeFindPrev();

    //If preve element is first element of slider.
    if (offset < 0) {
      offset = 0;
    }

    this._swipeScrollToPosition(offset);
    this.dispatchEvent(new CustomEvent('swipe-prev', { detail: {offset}}, { bubbles: false}));
  }

  /**
   * Swipe to specific position.
   * @protected
   */
  _swipeScrollToPosition(pos) {

    if (this.swipeDirection == 'horizontal') {
      this._swipeSliderFrame.style[this.__webkitOrNot()] = `translate3d(${-1 * pos}px, 0, 0)`;
    } else {
      this._swipeSliderFrame.style[this.__webkitOrNot()] = `translate3d(0, ${-1 * pos}px, 0)`;
    }
  }

  /**
   * Swipe to specific index.
   * @protected
   */
  _swipeSctollToIndex(index) {
    this.__swipeEnableTransition();
    let element = this._getSwipeSlideEl(index) || this._getSwipeSlideEl(0);
    let offset = this.swipeDirection == 'horizontal' ? element.offsetLeft: element.offsetTop;
    //If preve element is first element of slider.
    if (offset < 0) {
      this._swipeScrollToPosition(0);
      return;
    }

    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      this._swipeScrollToPosition(this._getSwipeSliderLength() - this._getSwipeContainerLength());
      return;
    }
    this._swipeScrollToPosition(offset);
  }

  /**
   * @returns {Array} slide elements.
   * @protected
   */
  _getSwipeSlideElements() {
    return this._swipeSliderFrame && this._swipeSliderFrame.children || [];
  }

  /**
   * @returns {Array} swipe container boundry.
   * @protected
   */
  _swipeContainerBoundry() {
    return this._swipeContainer && this._swipeContainer.getBoundingClientRect() || [];
  }

  /**
   * @returns {Number} current slide index.
   * @protected
   */
  _getSwipeCurrentSlideIndex() {
    let currentSlide;
    let swipeSlideElements = this._getSwipeSlideElements();
    let swipeContainerBoundry = this._swipeContainerBoundry();
    let swipeContainerTopLength = this.swipeDirection == 'horizontal' ? swipeContainerBoundry.left : swipeContainerBoundry.top;

    forEach(swipeSlideElements, (element, index)=> {
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
    let element =  this._getSwipeSlideEl(this.__currentSlideIndex);
    let offset = (this.swipeDirection == 'horizontal')? element && element.offsetLeft || 0: element && element.offsetTop || 0;
    
    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      offset = this._getSwipeSliderLength() - this._getSwipeContainerLength();
    }

    //If current slide is first element of slider.
    if(offset < 0) {
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
      if(!this.swipeDisabled) {
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
        this._swipeSliderFrame.style.minWidth = 'fit-content';
        this._swipeSliderFrame.style.height = '100%';
      }

      if (this.swipeDirection === 'vertical') {
        this._swipeSliderFrame.style.width = '100%';
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
    if(e.touches && e.touches.length > 1) {
      return;
    }
    
    this.__swipePointerDown = true;
    this.__position.startX = this.__swipeEventUnify(e).clientX;
    this.__position.startY = this.__swipeEventUnify(e).clientY;
    this.__currentSlideIndex = this._getSwipeCurrentSlideIndex();
    this.__swipeThresholdCrossed = false;
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

      let currentOffset = this._getSwipeCurrentOffest(); 
      let positionOffset = this.swipeDirection == 'horizontal' ? distX : distY;

      if (!this.__swipeThresholdCrossed && Math.abs(positionOffset) <= this.swipeRestraint) {
        return;
      }

      if((this.swipeDirection == 'horizontal' && Math.abs(distY) >  Math.abs(distX)) || 
        (this.swipeDirection == 'vertical' && Math.abs(distX) >  Math.abs(distY))) {
        return;
      }

      //If current slides is first slide then swipe is not move prev
      if(currentOffset == 0 && positionOffset > 0) {
        return;
      }
      
      //If current slides is last slide then swipe is not move next
      if ((currentOffset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength() && positionOffset < 0) {
        return;
      }

      if(!this.__swipeThresholdCrossed) {
        this.__swipeThresholdCrossed = true;
        this.__swipeDisableTransition();
      }

      let movePosition = currentOffset - positionOffset;

      //If move position is greater then continer size
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
    if (this.__swipePointerDown) {
      this.__swipePointerDown = false;
      this.__position.endX = this.__swipeEventUnify(e).clientX;
      this.__position.endY = this.__swipeEventUnify(e).clientY;

      this.__position.distX = this.__position.endX - this.__position.startX;
      this.__position.distY = this.__position.endY - this.__position.startY;
      this.__swipeEnableTransition();
      this.__fireSwipeEvent()
      this.__resetPosition();
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
   * Determine if browser supports unprefixed transform property.
   * Google Chrome since version 26 supports prefix-less transform
   * @returns {string} - Transform property supported by client.
   */
  __webkitOrNot() {
    const style = document.documentElement.style;
    if (typeof style.transform === 'string') {
      return 'transform';
    }
    return 'WebkitTransform';
  }
}