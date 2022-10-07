import { LitElement, html, css } from '@dreamworld/pwa-helpers/lit.js';

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
