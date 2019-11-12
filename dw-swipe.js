import forEach from 'lodash-es/forEach';
export const DwSwipe = (baseElement) => class extends baseElement {
  static get properties() {
    return {

      /**
       * Swipe is applied or not
       */
      swipeEnabled: { type: Boolean },

      /**
       * swipeMinDisplacement value in px. If "touch/mouse move distance" will be lower than this value then swiper will not move.
       */
      swipeMinDisplacement: { type: Number },

      /**
       * Could be 'horizontal' or 'vertical' (for vertical slider).
       */
      swipeDirection: { type: String, reflect: true },

      /**
       * How many slides are a move to next/previous?
       */
      swipeMultiplier: { type: Number }
    }
  }

  constructor() {
    super();
    this.swipeEnabled = false;
    this.swipeMinDisplacement = 25;
    this.swipeDirection = 'horizontal';
    this.swipeMultiplier = 1;

    //Maximum distance allowed at the same time in perpendicular direction;
    this.__restraint = 50;

    this.__swipePointerDown = false;
    this.__resetPosition();

    this.__swipeStart = this.__swipeStart.bind(this);
    this.__swipeEnd = this.__swipeEnd.bind(this);
    this.__swipeMove = this.__swipeMove.bind(this);
  }

  /**
   * Setter of swipeEnabled.
   */
  set swipeEnabled(value) {
    let oldValue = this.__swipeEnabled;
    if (oldValue == value) {
      return;
    }

    this.__swipeEnabled = value;
    //Update swipe style
    this._swipeUpdateStyles();
    this.__siwpeBindUnbindEvents();
  }

  __siwpeBindUnbindEvents() {
    //Bind or unbind event;
    if (this.__swipeEnabled) {
      this._swipeInit();
    } else {
      this._swipeDestroy();
    }
  }

  /**
   * Getter of swiperEnabled.
   */
  get swipeEnabled() {
    return this.__swipeEnabled;
  }

  disconnectedCallback() {
    this._swipeDestroy();
    super.disconnectedCallback && super.disconnectedCallback();
  }

  /**
   * Intialz swipe when swipe is Enable.
   * @protected
   */
  _swipeInit() {
    if (!this.swipeEnabled) {
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

      this.__swipeBindEventListner();
      this._swipeUpdateStyles();
    });
  }

  /**
   * Destroy swipe.
   * @protected
   */
  _swipeDestroy() {
    this.__swipeUnbindEventListner();
  }

  /**
   * Update swipe style.
   * @protected
   */
  _swipeUpdateStyles() {
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
    let offset = this._getSwipeCurrentSlideTop();
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      this._swipeScrollTo(this._getSwipeSliderLength() - this._getSwipeContainerLength());
      return;
    }

    if(offset < 0) {
      this._swipeScrollTo(0);
      return;
    }

    this._swipeScrollTo(offset);
  }

  /**
   * Swipe to next element.
   * @protected 
   */
  _swipeNext() {
    let offset = this._swipeFindNext();

    //If slider has no more slide a next slide
    if ((offset + this._getSwipeContainerLength()) >= this._getSwipeSliderLength()) {
      this._swipeScrollTo(this._getSwipeSliderLength() - this._getSwipeContainerLength());
      return;
    }
    this._swipeScrollTo(offset);
  }

  /**
   * Swipe to prev element.
   * @protected
   */
  _swipePrev() {
    let offset = this._swipeFindPrev();

    //If preve element is first element of slider.
    if (offset < 0) {
      this._swipeScrollTo(0);
      return;
    }
    this._swipeScrollTo(offset);
  }

  /**
   * Swipe to specific position.
   * @protected
   */
  _swipeScrollTo(pos) {
    if (this.swipeDirection == 'horizontal') {
      this._swipeSliderFrame.style[this.__webkitOrNot()] = `translate3d(${-1 * pos}px, 0, 0)`;
      return;
    }

    this._swipeSliderFrame.style[this.__webkitOrNot()] = `translate3d(0, ${-1 * pos}px, 0)`;
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
    let currentSlide = 0;
    let swipeSlideElements = this._getSwipeSlideElements();
    let swipeContainerBoundry = this._swipeContainerBoundry();
    let swipeContainerTopLength = this.swipeDirection == 'horizontal' ? swipeContainerBoundry.left : swipeContainerBoundry.top;
    let swipeContainerBottomLength = this.swipeDirection == 'horizontal' ? swipeContainerBoundry.right : swipeContainerBoundry.bottom;

    forEach(swipeSlideElements, (element, index)=> {
      let elementBoundary = element.getBoundingClientRect();

      let elmentTopLength = this.swipeDirection == 'horizontal' ? elementBoundary.left : elementBoundary.top;

      let elementBottomLength = this.swipeDirection == 'horizontal' ? elementBoundary.right : elementBoundary.bottom;

      if (elmentTopLength >= swipeContainerTopLength && elementBottomLength <= swipeContainerBottomLength) {
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
  _getSwipeCurrentSlideTop() {
    let element =  this._getSwipeSlideEl(this.__currentSlideIndex);
    if (this.swipeDirection == 'horizontal') {
      return element && element.offsetLeft || 0;
    }
    return element && element.offsetTop || 0;
  }

  /**
   * Apply style to swipe container.
   * @private
   */
  __swipeManageContainerStyle() {
    if (this._swipeContainer) {
      if(this.swipeEnabled) {
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
        this._swipeSliderFrame.style.width = this._swipeSliderFrame.scrollWidth + 'px';
        this._swipeSliderFrame.style.height = '100%';
      }

      if (this.swipeDirection === 'vertical') {
        this._swipeSliderFrame.style.width = '100%';
        this._swipeSliderFrame.style.height = this._swipeSliderFrame.scrollHeight + 'px';
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
    if (!this.swipeEnabled) {
      return;
    }
    
    //Old event listner remove.
    this._swipeDestroy();

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
    this.__swipePointerDown = true;
    this.__position.startX = this.__swipeEventUnify(e).clientX;
    this.__position.startY = this.__swipeEventUnify(e).clientY;
    this.__currentSlideIndex = this._getSwipeCurrentSlideIndex();
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

      this.__swipeDisableTransition();
      let currentOffset = this._getSwipeCurrentSlideTop();
      let positionOffset = this.swipeDirection == 'horizontal' ? this.__position.distX : this.__position.distY;

      if (Math.abs(positionOffset) <= this.__restraint) {
        return;
      }

      this._swipeScrollTo(currentOffset - positionOffset);
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
    if (distX >= this.swipeMinDisplacement && distY <= this.__restraint) {
      swipeEvent = (this.__position.distX < 0) ? 'right' : 'left';
    }
    else if (distY >= this.swipeMinDisplacement && distX <= this.__restraint) {
      swipeEvent = (this.__position.distY < 0) ? 'bottom' : 'top';
    }
    return swipeEvent;
  }

  /**
   * Fire swipe event.
   * @private
   */
  __fireSwipeEvent() {
    let swipeEvent = this.__detectSwipeEvent();

    if ((this.swipeDirection == 'vertical' && swipeEvent == 'bottom')
      || (this.swipeDirection == 'horizontal' && swipeEvent == 'right')) {
      this._swipeNext();
      return;
    }

    if ((this.swipeDirection == 'vertical' && swipeEvent == 'top')
      || (this.swipeDirection == 'horizontal' && swipeEvent == 'left')) {
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