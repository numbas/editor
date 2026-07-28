import {basicSetup} from "codemirror";
import {EditorView, keymap} from "@codemirror/view";
import {EditorState, Compartment} from "@codemirror/state";
import {python} from "@codemirror/lang-python";
import {r} from "codemirror-lang-r";
import {javascript} from "@codemirror/lang-javascript";
import {StreamLanguage, indentUnit} from "@codemirror/language"
import { Prec } from "@codemirror/state";

const languages = {
    'python': python,
    'r': r,
    'javascript': javascript,
}

export function codemirror_editor(language, options) {
    const language_plugin = languages[language];
    
    const readOnly = new Compartment();
    const editable = new Compartment();

    options = Object.assign({
        extensions: [
            basicSetup,
            indentUnit.of('    '),
            Prec.highest(keymap.of([
                {
                    key: 'Mod-Enter',
                    run: () => {
                        options.onSubmit();
                        return true;
                    }
                }
            ])),
            EditorView.updateListener.of(update => {
                if(!options?.onChange || update.changes.desc.empty) {
                    return;
                }
                options.onChange(update);
            }),
            readOnly.of(EditorState.readOnly.of(false)),
            editable.of(EditorView.editable.of(true)),
        ]
    }, options);
    if(language_plugin) {
        options.extensions.push(language_plugin());
    }

    let editor = new EditorView(options);

    editor.disable = (v) => {
        editor.dispatch({
            effects: [
                readOnly.reconfigure(EditorState.readOnly.of(v)),
                editable.reconfigure(EditorView.editable.of(!v)),
            ]
        });
    }

    return editor;
}


export class CodeEditorElement extends HTMLElement {
    static observedAttributes = ['disabled'];

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'open'});

        const {promise, resolve} = Promise.withResolvers();
        this.cmPromise = promise;
        this.resolveCM = resolve;
    }

    connectedCallback() {
        this.init_editor();
    }

    init_editor() {
        const code = this.textContent;
        const code_tag = this.shadowRoot;
        const language = this.getAttribute('language') || '';
        
        this.codeMirror = codemirror_editor(
            language,
            {
                doc: code,
                parent: code_tag,
                root: this.shadowRoot,
                onChange: this.onChange.bind(this),
                onSubmit: this.onSubmit.bind(this),
            }
        );

        this.resolveCM(this.codeMirror);
    }

    get value() {
        return this.codeMirror?.state.doc.toString() || '';
    }

    set value(value) {
        this.cmPromise.then(cm => {
            cm.dispatch(cm.state.update({
                changes: {
                    from: 0,
                    to: cm.state.doc.length,
                    insert: value
                },
                selection: {anchor: 0}
            }));
        });
    }

    get disabled() {
        return this.getAttribute('disabled') !== null;
    }

    set disabled(v) {
        if(v) {
            this.setAttribute('disabled','true');
        } else {
            this.removeAttribute('disabled');
        }
    }

    onChange() {
        this.dispatchEvent(new CustomEvent('input'));
    }

    onSubmit() {
        if(this.disabled) {
            return;
        }
        this.dispatchEvent(new CustomEvent('submit'));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.cmPromise.then(cm => {
            cm.disable(!!newValue);
        });
    }
}

customElements.define("code-editor", CodeEditorElement);
