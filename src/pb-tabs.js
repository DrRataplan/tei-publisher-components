import { LitElement, html, css } from 'lit-element';
import '@polymer/paper-tabs';
import '@polymer/iron-pages';
import { pbMixin } from './pb-mixin.js';
import { registry } from "./urls.js";


/**
 * Combines a row of tabs with associated content.
 * 
 * @slot tab - tab area
 * @slot page - page area
 * @csspart pages - wrapper around the tab pages
 */
export class PbTabs extends pbMixin(LitElement) {
    static get properties() {
        return {
            ...super.properties,
            selected: {
                type: Number,
                reflect: true
            }
        };
    }

    constructor() {
        super();

        this.selected = 0;
        this._initialized = false;
    }
    
    connectedCallback() {
        super.connectedCallback();

        PbTabs.waitOnce('pb-page-ready', () => {
            this.selected = registry.state.tab || 0;

            registry.subscribe(this, (state) => {
                this.selected = state.tab;
            });

        });
    }

    _switchTab(ev) {
        const current = parseInt(ev.detail.value, 10);
        if (this.selected === current) {
            return;
        }
        this.selected = current;
        if (this._initialized) {
            registry.commit(this, { tab: this.selected });
        } else {
            registry.replace(this, { tab: this.selected });
        }
        this._initialized = true;
    }

    render() {
        return html`
            <paper-tabs id="tabs" selected="${this.selected || 0 }" @selected-changed="${this._switchTab}">
                <slot name="tab"></slot>
            </paper-tabs>
            <iron-pages part="pages" selected="${this.selected}">
                <slot name="page"></slot>
            </iron-pages>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
        `;
    }
}
customElements.define('pb-tabs', PbTabs);