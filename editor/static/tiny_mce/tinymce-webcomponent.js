(function () {
    'use strict';

    const Global = typeof window !== 'undefined' ? window : Function('return this;')();

    const path = (parts, scope) => {
      let o = scope !== undefined && scope !== null ? scope : Global;
      for (let i = 0; i < parts.length && o !== undefined && o !== null; ++i) {
        o = o[parts[i]];
      }
      return o;
    };
    const resolve = (p, scope) => {
      const parts = p.split('.');
      return path(parts, scope);
    };

    const identity = x => {
      return x;
    };

    const keys = Object.keys;
    const hasOwnProperty = Object.hasOwnProperty;
    const each = (obj, f) => {
      const props = keys(obj);
      for (let k = 0, len = props.length; k < len; k++) {
        const i = props[k];
        const x = obj[i];
        f(x, i);
      }
    };
    const has = (obj, key) => hasOwnProperty.call(obj, key);

    let unique = 0;
    const generate = prefix => {
      const date = new Date();
      const time = date.getTime();
      const random = Math.floor(Math.random() * 1000000000);
      unique++;
      return prefix + '_' + random + unique + String(time);
    };

    const createState = () => ({
      listeners: [],
      scriptId: generate('tiny-script'),
      scriptLoaded: false
    });
    const CreateScriptLoader = () => {
      let state = createState();
      const injectScriptTag = (scriptId, doc, url, callback) => {
        const scriptTag = doc.createElement('script');
        scriptTag.referrerPolicy = 'origin';
        scriptTag.type = 'application/javascript';
        scriptTag.id = scriptId;
        scriptTag.src = url;
        const handler = () => {
          scriptTag.removeEventListener('load', handler);
          callback();
        };
        scriptTag.addEventListener('load', handler);
        if (doc.head) {
          doc.head.appendChild(scriptTag);
        }
      };
      const load = (doc, url, callback) => {
        if (state.scriptLoaded) {
          callback();
        } else {
          state.listeners.push(callback);
          if (!doc.getElementById(state.scriptId)) {
            injectScriptTag(state.scriptId, doc, url, () => {
              state.listeners.forEach(fn => fn());
              state.scriptLoaded = true;
            });
          }
        }
      };
      const reinitialize = () => {
        state = createState();
      };
      return {
        load,
        reinitialize
      };
    };
    const ScriptLoader = CreateScriptLoader();

    var Status;
    (function (Status) {
      Status[Status['Raw'] = 0] = 'Raw';
      Status[Status['Initializing'] = 1] = 'Initializing';
      Status[Status['Ready'] = 2] = 'Ready';
    }(Status || (Status = {})));
    const closestRecursive = (selector, element) => {
      const found = element.closest(selector);
      if (found !== null) {
        return found;
      }
      const next = element.getRootNode().host;
      if (next !== null && next !== undefined) {
        return closestRecursive(selector, next);
      }
      return null;
    };
    const isLookupKey = (values, key) => has(values, key);
    const lookup = values => key => isLookupKey(values, key) ? values[key] : key;
    const parseGlobal = resolve;
    const parseString = identity;
    const parseFalseOrString = lookup({ false: false });
    const parseBooleanOrString = lookup({
      true: true,
      false: false
    });
    const parseNumberOrString = value => /^\d+$/.test(value) ? Number.parseInt(value, 10) : value;
    const configAttributes = {
      setup: parseGlobal,
      statusbar: parseBooleanOrString,
      toolbar: parseFalseOrString,
      menubar: parseFalseOrString,
      plugins: parseString,
      content_css: parseString,
      content_style: parseString,
      width: parseNumberOrString,
      height: parseNumberOrString,
      toolbar_mode: parseString,
      contextmenu: parseFalseOrString,
      quickbars_insert_toolbar: parseFalseOrString,
      quickbars_selection_toolbar: parseFalseOrString,
      powerpaste_word_import: parseString,
      powerpaste_html_import: parseString,
      powerpaste_allow_local_images: parseBooleanOrString,
      resize: parseBooleanOrString,
      skin: parseString,
      skin_url: parseString,
      images_upload_url: parseString,
      images_upload_handler: parseGlobal,
      images_upload_base_path: parseString,
      images_upload_credentials: parseBooleanOrString,
      images_reuse_filename: parseBooleanOrString,
      icons: parseString,
      icons_url: parseString,
      promotion: parseBooleanOrString
    };
    const configRenames = {};
    const isDisabledOptionSupported = editor => {
      var _a;
      return !!editor && typeof ((_a = editor.options) === null || _a === void 0 ? void 0 : _a.set) === 'function' && editor.options.isRegistered('disabled');
    };
    class TinyMceEditor extends HTMLElement {
      static get formAssociated() {
        return true;
      }
      static get observedAttributes() {
        const nativeEvents = [
          'on-BeforePaste',
          'on-Blur',
          'on-Click',
          'on-ContextMenu',
          'on-Copy',
          'on-Cut',
          'on-Dblclick',
          'on-Drag',
          'on-DragDrop',
          'on-DragEnd',
          'on-DragGesture',
          'on-DragOver',
          'on-Drop',
          'on-Focus',
          'on-FocusIn',
          'on-FocusOut',
          'on-KeyDown',
          'on-KeyPress',
          'on-KeyUp',
          'on-MouseDown',
          'on-MouseEnter',
          'on-MouseLeave',
          'on-MouseMove',
          'on-MouseOut',
          'on-MouseOver',
          'on-MouseUp',
          'on-Paste',
          'on-SelectionChange'
        ];
        const tinyEvents = [
          'on-Activate',
          'on-AddUndo',
          'on-BeforeAddUndo',
          'on-BeforeExecCommand',
          'on-BeforeGetContent',
          'on-BeforeRenderUI',
          'on-BeforeSetContent',
          'on-Change',
          'on-ClearUndos',
          'on-Deactivate',
          'on-Dirty',
          'on-ExecCommand',
          'on-GetContent',
          'on-Hide',
          'on-Init',
          'on-LoadContent',
          'on-NodeChange',
          'on-PostProcess',
          'on-PostRender',
          'on-PreProcess',
          'on-ProgressState',
          'on-Redo',
          'on-Remove',
          'on-Reset',
          'on-SaveContent',
          'on-SetAttrib',
          'on-ObjectResizeStart',
          'on-ObjectResized',
          'on-ObjectSelected',
          'on-SetContent',
          'on-Show',
          'on-Submit',
          'on-Undo',
          'on-VisualAid'
        ];
        return [
          'form',
          'readonly',
          'autofocus',
          'placeholder',
          'disabled'
        ].concat(nativeEvents).concat(tinyEvents);
      }
      constructor() {
        super();
        this._eventAttrHandler = records => {
          records.forEach(record => {
            var _a;
            if (record.type === 'attributes' && record.target === this && ((_a = record.attributeName) === null || _a === void 0 ? void 0 : _a.toLowerCase().startsWith('on-'))) {
              this._updateEventAttr(record.attributeName, this.getAttribute(record.attributeName));
            }
          });
        };
        this._formDataHandler = evt => {
          const name = this.name;
          if (name != null) {
            const value = this.value;
            if (value != null) {
              const data = evt.formData;
              data.append(name, value);
            }
          }
        };
        this._status = Status.Raw;
        this._shadowDom = this.attachShadow({ mode: 'open' });
        this._form = null;
        this._eventHandlers = {};
        this._mutationObserver = new MutationObserver(this._eventAttrHandler);
      }
      _updateEventAttr(attrKey, attrValue) {
        const event = attrKey.substring('on-'.length).toLowerCase();
        const resolved = attrValue !== null ? resolve(attrValue) : undefined;
        const handler = typeof resolved === 'function' ? resolved : undefined;
        if (this._eventHandlers[event] !== handler) {
          if (this._editor && this._eventHandlers[event]) {
            this._editor.off(event, this._eventHandlers[event]);
          }
          if (handler) {
            if (this._editor) {
              this._editor.on(event, handler);
            }
            this._eventHandlers[event] = handler;
          } else {
            delete this._eventHandlers[event];
          }
        }
      }
      _updateForm() {
        if (this.isConnected) {
          const formId = this.getAttribute('form');
          const form = formId !== null ? this.ownerDocument.querySelector('form#' + formId) : closestRecursive('form', this);
          if (this._form !== form) {
            if (this._form !== null) {
              this._form.removeEventListener('formdata', this._formDataHandler);
            }
            this._form = form;
            if (this._form !== null) {
              this._form.addEventListener('formdata', this._formDataHandler);
            }
          }
        } else {
          if (this._form !== null) {
            this._form.removeEventListener('formdata', this._formDataHandler);
            this._form = null;
          }
        }
      }
      _getTinymce() {
        return Global.tinymce;
      }
      _getConfig() {
        var _a, _b;
        const config = (_b = parseGlobal((_a = this.getAttribute('config')) !== null && _a !== void 0 ? _a : '')) !== null && _b !== void 0 ? _b : {};
        for (let i = 0; i < this.attributes.length; i++) {
          const attr = this.attributes.item(i);
          if (attr !== null) {
            if (has(configAttributes, attr.name)) {
              const prop = has(configRenames, attr.name) ? configRenames[attr.name] : attr.name;
              config[prop] = configAttributes[attr.name](attr.value);
            }
          }
        }
        if (this.readonly) {
          config.readonly = true;
        }
        if (this.disabled) {
          config.disabled = true;
        }
        if (this.autofocus) {
          config.auto_focus = true;
        }
        delete config.target;
        delete config.selector;
        return config;
      }
      _getEventHandlers() {
        const handlers = {};
        for (let i = 0; i < this.attributes.length; i++) {
          const attr = this.attributes.item(i);
          if (attr !== null) {
            if (attr.name.toLowerCase().startsWith('on-')) {
              const event = attr.name.toLowerCase().substring('on-'.length);
              const handler = resolve(attr.value);
              if (typeof handler === 'function') {
                handlers[event] = handler;
              }
            }
          }
        }
        return handlers;
      }
      _doInit() {
        var _a, _b;
        this._status = Status.Initializing;
        const target = document.createElement('textarea');
        target.value = (_a = this.textContent) !== null && _a !== void 0 ? _a : '';
        const attrId = (_b = this.attributes.getNamedItem('id')) === null || _b === void 0 ? void 0 : _b.value;
        if (attrId) {
          target.id = attrId;
        }
        if (this.placeholder !== null) {
          target.placeholder = this.placeholder;
        }
        this._shadowDom.appendChild(target);
        const baseConfig = this._getConfig();
        const conf = Object.assign(Object.assign(Object.assign({}, baseConfig), {
          disabled: this.hasAttribute('disabled'),
          readonly: this.hasAttribute('readonly')
        }), {
          target,
          setup: editor => {
            this._editor = editor;
            editor.on('init', _e => {
              this._status = Status.Ready;
            });
            editor.on('SwitchMode', _e => {
              this.readonly = this.readonly;
            });
            editor.on('DisabledStateChange', _e => {
              this.disabled = this.disabled;
            });
            each(this._eventHandlers, (handler, event) => {
              if (handler !== undefined) {
                editor.on(event, handler);
              }
            });
            if (typeof baseConfig.setup === 'function') {
              baseConfig.setup(editor);
            }
          }
        });
        this._getTinymce().init(conf).catch(err => {
          console.error('TinyMCE init failed', err);
        });
      }
      _getTinymceSrc() {
        var _a;
        const src = this.getAttribute('src');
        if (src) {
          return src;
        }
        const channel = (_a = this.getAttribute('channel')) !== null && _a !== void 0 ? _a : '8';
        const apiKey = this.hasAttribute('api-key') ? this.getAttribute('api-key') : 'no-api-key';
        return `https://cdn.tiny.cloud/1/${ apiKey }/tinymce/${ channel }/tinymce.min.js`;
      }
      _loadTinyDoInit() {
        if (this._getTinymce()) {
          this._doInit();
        } else {
          ScriptLoader.load(this.ownerDocument, this._getTinymceSrc(), () => this._doInit());
        }
      }
      attributeChangedCallback(attribute, oldValue, newValue) {
        if (oldValue !== newValue) {
          if (attribute === 'form') {
            this._updateForm();
          } else if (attribute === 'disabled') {
            this.disabled = newValue !== null;
          } else if (attribute === 'readonly') {
            this.readonly = newValue !== null;
          } else if (attribute === 'autofocus') {
            this.autofocus = newValue !== null;
          } else if (attribute === 'placeholder') {
            this.placeholder = newValue;
          } else if (attribute.toLowerCase().startsWith('on-')) {
            this._updateEventAttr(attribute, newValue);
          }
        }
      }
      connectedCallback() {
        this._eventHandlers = this._getEventHandlers();
        this._mutationObserver.observe(this, {
          characterData: false,
          attributes: true,
          childList: true,
          subtree: false
        });
        this._updateForm();
        if (this._status === Status.Raw) {
          this._loadTinyDoInit();
        }
      }
      disconnectedCallback() {
        this._mutationObserver.disconnect();
        this._updateForm();
        if (this._editor) {
          this._getTinymce().remove(this._editor);
        }
      }
      get value() {
        var _a, _b;
        return (_b = this._status === Status.Ready ? (_a = this._editor) === null || _a === void 0 ? void 0 : _a.getContent() : undefined) !== null && _b !== void 0 ? _b : null;
      }
      set value(newValue) {
        var _a;
        if (this._status === Status.Ready && newValue != null) {
          (_a = this._editor) === null || _a === void 0 ? void 0 : _a.setContent(newValue);
        }
      }
      get readonly() {
        if (this._editor) {
          return this._editor.mode.get() === 'readonly';
        } else {
          return this.hasAttribute('readonly');
        }
      }
      set readonly(value) {
        if (value) {
          if (this._editor && this._editor.mode.get() !== 'readonly') {
            this._editor.mode.set('readonly');
          }
          if (!this.hasAttribute('readonly')) {
            this.setAttribute('readonly', '');
          }
        } else {
          if (this._editor && this._editor.mode.get() === 'readonly') {
            this._editor.mode.set('design');
          }
          if (this.hasAttribute('readonly')) {
            this.removeAttribute('readonly');
          }
        }
      }
      get disabled() {
        return this._editor ? this._editor.options.get('disabled') : this.hasAttribute('disabled');
      }
      set disabled(value) {
        if (this._editor && this._status === Status.Ready && isDisabledOptionSupported(this._editor)) {
          this._editor.options.set('disabled', value);
        }
        if (value && !this.hasAttribute('disabled')) {
          this.setAttribute('disabled', '');
        } else if (!value && this.hasAttribute('disabled')) {
          this.removeAttribute('disabled');
        }
      }
      get placeholder() {
        return this.getAttribute('placeholder');
      }
      set placeholder(value) {
        if (this._editor) {
          const target = this._editor.getElement();
          if (target !== null) {
            if (value !== null) {
              target.setAttribute('placeholder', value);
            } else {
              target.removeAttribute('placeholder');
            }
          }
        }
        if (value !== null) {
          if (this.getAttribute('placeholder') !== value) {
            this.setAttribute('placeholder', value);
          }
        } else {
          if (this.hasAttribute('placeholder')) {
            this.removeAttribute('placeholder');
          }
        }
      }
      get autofocus() {
        return this.hasAttribute('autofocus');
      }
      set autofocus(value) {
        if (value) {
          if (!this.hasAttribute('autofocus')) {
            this.setAttribute('autofocus', '');
          }
        } else {
          if (this.hasAttribute('autofocus')) {
            this.removeAttribute('autofocus');
          }
        }
      }
      get form() {
        return this._form;
      }
      get name() {
        return this.getAttribute('name');
      }
      get type() {
        return this.localName;
      }
    }
    var Editor = () => {
      window.customElements.define('tinymce-editor', TinyMceEditor);
    };

    Editor();

})();
