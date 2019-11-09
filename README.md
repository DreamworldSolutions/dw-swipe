# dw-swipe
A LitElement mixin to implement Swipe behavior. e.g. It's used in Kerika board to scroll column one at a time through swipe gesture.


## Installation

```html
npm install @dreamworld/dw-swipe
```

## Usage

### Import a dw-swiper mixin 
```js
@import {DwSwipe} from '@dreamworld/dw-swipe';
```
### Extend a mixin apply to your class
##### Example
```js
//Import dw -swiper mixin
@import {DwSwipe} from '@dreamworld/dw-swipe';
	
//Import lit-element class
@import {LitElement} . from 'lit-element';
	
//Extend dw-swipe class to lit-element class
class swiperList extends DwSwipe(LitElement) {}
```

### Add  dw-swipe HTML Layout
Now, we need to add basic dw-swipe layout to:
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

### Container CSS Styles/Size
After that, we may need to set Swiper size:

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
| swipeEnabled | Boolean | false | Swipe is applied or not |
| swipeDirection | String | horizontal | Could be 'horizontal' or 'vertical' (for vertical slider). |
| swipeMinDisplacement | Number | 25 | swipeMinDisplacement value in px. If "touch/mouse move distance" will be lower than this value then swiper will not move |
| swipeMultiplier | Number | 1 | How many slides are a move to next/previous?|

### Methods
| Name | Description |  
| :------- | ----: |  
| _swipeRestore() | Restore swipe to current slide |
| _swipeNext() | Swipe to next slide |
| _swipePrev() | Swipe to previous slide |
| _swipeScrollTo(pos) | Swipe to specific position. **pos**: Passed to   swipe position |
| _swipeDestroy | Destroy a swipe |
