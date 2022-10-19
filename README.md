# dw-swipe
A LitElement mixin to implement Swipe behavior. e.g. It's used in Kerika board to scroll column one at a time through swipe gesture.


## Installation

```html
npm install @dreamworld/dw-swipe
```

## Usage

1. Apply Mixin to your view-element Class.
```js
//Import dw -swiper mixin
@import {DwSwipe} from '@dreamworld/dw-swipe';
	
//Import lit-element class
@import {LitElement} . from 'lit-element';
	
//Extend dw-swipe class to lit-element class
class swiperList extends DwSwipe(LitElement) {}
```

2. Set required layout in your view-element template.
e.g. 
```html
<!-- Slider main container -->  
<div class="dw-swipe-container">  
	<!-- Additional required slider wrapper -->  
	<div class="dw-swipe-slider-frame">  
		<!-- Slides -->  
		<div>Slide 1</div>  
		<div>Slide 2</div>  
		<div >Slide 3</div> ... 
  </div>
</div>
```

3. Set fix width/height to the `.dw-swipe-container`.
```css
.dw-swipe-container {  
	width: 600px;  
	height: 300px;  
}
```

## Slider Methods & Properties
### Properties
| Name | Type | Default |  Description |
| :------- | ----: | :---: |  :---: |
| swipeDisabled | Boolean | false | Swipe is disabled or not |
| swipeDirection | String | horizontal | Could be 'horizontal' or 'vertical' (for vertical slider). |
| swipeMinDisplacement | Number | 25 | Number of pixels. If total movement (mouse or touch) is less than this number, than it won't be considered a swipe event and at the end scroll will be restored to the start position. |
| swipeRestraint | Number | 25 | Number of pixels. Actual move/scroll operation will be started only when user moves (mouse or touch) by these many pixels. |
| swipeMultiplier | Number | 1 | How many slides are a move to next/previous?|

### Methods
| Name | Description |  
| :------- | ----: |  
| _swipeRestore() | Restore swipe to current slide |
| _swipeNext() | Swipe to next slide |
| _swipePrev() | Swipe to previous slide |
| _swipeScrollToPosition(pos) | Swipe to specific position. **pos**: Passed to   swipe position |
| _swipeScrollToIndex(index, disableTransition) | Swipe to specific Slide (identified by the 0-based index.).|
| _swipeDestroy() | Destroy a swipe |
 