/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { css, LitElement, html } from 'lit-element';
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
          width: 450px;
          height: 450px;
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
    this.swipeEnabled = true;
    this.swipeAlign = 'center';
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
        </div>
      </div>
    `
  }

  firstUpdated() {
    super.firstUpdated && super.firstUpdated();
  }

}

window.customElements.define('dw-swipe-integrater', DwSwipeIntegrater);
