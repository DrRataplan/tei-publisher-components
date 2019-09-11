import { LitElement, html, css } from 'lit-element';
import { pbMixin } from './pb-mixin.js';
import '@polymer/iron-ajax';
import '@polymer/paper-dialog';
import '@polymer/paper-dialog-scrollable';

/**
 * Dynamically load data by calling a server-side script, optionally triggered by an event.
 * This is used for e.g. the document list on the start page or the table
 * of contents.
 * 
 * @customElement
 * @polymer
 * @demo demo/pb-load.html
 * @appliesMixin pbMixin
 */
export class PbLoad extends pbMixin(LitElement) {

    static get properties() {
        return {
            /** The URL for the AJAX request. If a relative URL is passed, it will be resolved
             * either against the app root (if known) or the location of the webcomponent.
             */
            url: {
                type: String
            },
            /** ID of the pb-document this element is connected to. The document path to
            * load will be taken from the pb-document.
             */
            src: {
                type: String
            },
            /**
             * The container element into which the results returned by
             * the AJAX request will be loaded.
             */
            container: {
                type: String
            },
            /**
             * Should content be loaded immediately when the component is initialized?
             */
            auto: {
                type: Boolean
            },
            /**
             * Only load content once, not every time a `pb-load` event is received.
             */
            loadOnce: {
                type: Boolean
            },
            /**
             * Start offset to use for showing paginated content.
             */
            start: {
                type: Number
            },
            history: {
                type: Boolean
            },
            event: {
                type: String
            },
            ...super.properties
        };
    }

    constructor() {
        super();
        this.auto = false;
        this.loadOnce = false;
        this.history = false;
        this.event = 'pb-load';
        this.loaded = false;
        this.parameters = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.subscribeTo(this.event, function (ev) {
            if (this.history && ev.detail && ev.detail.params) {
                const start = ev.detail.params.start;
                if (start) {
                    this.setParameter('start', start);
                    this.pushHistory('pagination', {
                        start: start
                    });
                }
            }
            this.load(ev);
        }.bind(this));

        if (this.history) {
            window.addEventListener('popstate', function (ev) {
                ev.preventDefault();
                if (ev.state && ev.state.start && ev.state.start !== this.start) {
                    this.start = ev.state.start;
                    this.load();
                }
            }.bind(this));
        }
    }

    firstUpdated() {
        if (this.auto) {
            this.start = this.getParameter('start', this.start);
            this.load();
        }
    }

    render() {
        return html`
            <slot></slot>
            <iron-ajax
                id="loadContent"
                verbose
                handle-as="text"
                method="get"
                withCredentials
                @response="${this._handleContent}"
                @error="${this._handleError}"></iron-ajax>
            <paper-dialog id="errorDialog">
                <h2>Error</h2>
                <paper-dialog-scrollable></paper-dialog-scrollable>
                <div class="buttons">
                    <paper-button dialog-confirm="dialog-confirm" autofocus="autofocus">
                        Closes
                    </paper-button>
                </div>
            </paper-dialog>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
        `;
    }

    load(ev) {
        if (this.loadOnce && this.loaded) {
            return;
        }

        this.emitTo('pb-start-update');

        const url = this.getEndpoint() + '/' + this.url;

        let params = {};

        if (ev) {
            if (ev instanceof Event) {
                if (ev.detail && ev.detail.params) {
                    params = ev.detail.params;
                }
            } else {
                params = ev;
            }
        }

        const doc = this.getDocument();
        if (doc) {
            params.doc = doc.path;
        }

        // set start parameter to start property, but only if not provided otherwise already
        if (this.start && !params.start) {
            params.start = this.start;
        }

        params = this.getParameters(params);

        console.log("<pb-load> Loading %s with parameters %o", this.url, params);
        const loader = this.shadowRoot.getElementById('loadContent');
        loader.params = params;
        loader.url = url;
        loader.generateRequest();

        if (this.loadOnce) {
            this.loaded = true;
        }
    }

    /**
     * Allow subclasses to set parameters before the request is being sent.
     *
     * @param parameters Map of parameters
     * @return new or modified parameters map
     */
    getParameters(params) {
        return params;
    }

    _handleContent(ev) {
        this._parseHeaders(ev.detail.xhr);

        const resp = this.shadowRoot.getElementById('loadContent').lastResponse;
        if (this.container) {
            this.style.display = 'none';
            document.querySelectorAll(this.container).forEach((elem) => {
                elem.innerHTML = resp
                this._onLoad(elem);
            });
        } else {
            this.style.display = '';
            this._clearContent();

            const div = document.createElement('div');
            div.innerHTML = resp;
            div.slot = '';
            this.appendChild(div);
            this._onLoad(this);
        }

        this.emitTo('pb-end-update');
    }

    _clearContent() {
        const contentSlot = this.shadowRoot.querySelector('slot:not([name])');
        if (contentSlot) {
            // clear content from slot
            contentSlot.assignedNodes().forEach((node) => node.parentNode.removeChild(node));
        }
    }

    _handleError() {
        this.emitTo('pb-end-update');
        const loader = this.shadowRoot.getElementById('loadContent');
        const msg = loader.lastError.response;
        const parser = new DOMParser();
        const doc = parser.parseFromString(msg, "application/xml");
        const node = doc.querySelector('message');

        const dialog = this.shadowRoot.getElementById('errorDialog');
        const body = dialog.querySelector("paper-dialog-scrollable");
        body.innerHTML = node.textContent;
        dialog.open();
    }

    _parseHeaders(xhr) {
        const total = xhr.getResponseHeader('pb-total');
        const start = xhr.getResponseHeader('pb-start');

        if (this.start !== start) {
            this.start = parseInt(start);
        }
        this.emitTo('pb-results-received', {
            "count": parseInt(total),
            "start": this.start,
            "params": this.shadowRoot.getElementById('loadContent').params
        });
    }

    _onLoad(content) {
    }

    /**
     * Fired before the element updates its content
     *
     * @event pb-start-update
     * @param {object} Parameters to be passed to the request
     */

    /**
     * Fired after the element has finished updating its content
     *
     * @event pb-end-update
     */

    /**
     * Fired after the element has received content from the server
     *
     * @event pb-results-received
     * @param {int} count number of results received (according to `pb-total` header)
     * @param {int} start offset into the result set (according to `pb-start` header)
     */
}
customElements.define('pb-load', PbLoad);