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

//These are the dw element needed by this elemenet
import './dw-swipe-integrater';
export class DwSwipeDemo extends LitElement {
  static get styles() {
    return [
      css`
        dw-swipe-integrater {
          margin: 16px;
        }
      `
    ];
  }

  render(){
    return html `
      <div>
        <h1>Horizotnal swipe</h1>
        <dw-swipe-integrater></dw-swipe-integrater>
      </div>

      <div>
        <h1>Vertical swipe</h1>
        <dw-swipe-integrater .swipeDirection=${"vertical"}></dw-swipe-integrater>
      </div>

      <div>
        <h1>Horizotnal swipe with 2 slide swipe</h1>
        <dw-swipe-integrater .swipeMultiplier=${2}></dw-swipe-integrater>
      </div>

      <div>
        <h1>Vertical swipe with 2 slide swipe</h1>
        <dw-swipe-integrater .swipeDirection=${"vertical"} .swipeMultiplier=${2}></dw-swipe-integrater>
      </div>
    `
  }
}

window.customElements.define('dw-swipe-demo', DwSwipeDemo);
