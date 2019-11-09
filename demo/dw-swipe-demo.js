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
        :host {
          display: flex;
          flex-wrap: wrap;
        }

        dw-swipe-integrater {
          margin: 16px;
        }
      `
    ];
  }

  render(){
    return html `
      <dw-swipe-integrater></dw-swipe-integrater>
      <dw-swipe-integrater .swipeDirection=${"vertical"}></dw-swipe-integrater>
    `
  }
}

window.customElements.define('dw-swipe-demo', DwSwipeDemo);
