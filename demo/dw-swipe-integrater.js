import { LitElement, html, css } from '@dreamworld/pwa-helpers/lit.js';
import { DwSwipe } from '../dw-swipe';

//These are the dw element needed by this elemenet
export class DwSwipeIntegrater extends DwSwipe(LitElement) {
  static get styles() {
    return [
      css`
        :host {
          display: block;
        }

        .dw-swipe-container {
          width: 250px;
          height: 250px;
        }

        .dw-swipe-child {
          min-width: 250px;
          min-height: 250px;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: -moz-none;
          -o-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        .dw-swipe-child:nth-child(odd) {
          background: yellow;
        }

        .dw-swipe-child:nth-child(even) {
          background: blue;
        }
      `
    ];
  }

  constructor() {
    super();
    this.swipeMinDisplacement = 50;
  }

  render() {
    return html`
      <div class='dw-swipe-container'>
        <div class="dw-swipe-slider-frame">
          <div class='dw-swipe-child'>1</div>
          <div class='dw-swipe-child'>2</div>
          <div class='dw-swipe-child'>3</div>
          <div class='dw-swipe-child'>4</div>
          <div class='dw-swipe-child'>5</div>
          <div class='dw-swipe-child'>6</div>
          <div class='dw-swipe-child'>7</div>
          <div class='dw-swipe-child'>8</div>
          <div class='dw-swipe-child'>9</div>
          <div class='dw-swipe-child'>10</div>
        </div>
      </div>
    `
  }

}

window.customElements.define('dw-swipe-integrater', DwSwipeIntegrater);
