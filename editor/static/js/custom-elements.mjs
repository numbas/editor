import './code-editor.js';

let mj_promise = MathJax.startup.promise;

/** Set the content of the given element to `html`, and then typeset it with MathJax.
 *
 * @param {Element} element
 * @param {string} html
 */
export function mathjax_typeset_element(element, html) {
    element.innerHTML = html;

    mj_promise = mj_promise.then(async () => {
        const root = element.getRootNode();
        MathJax.config.style_manager.register(root);
        MathJax.typesetClear([element]);
        await MathJax.typesetPromise([element]);
    })
    return mj_promise;
}

/**
 * A span which might contain LaTeX that should be typeset.
 *
 * The `value` attribute should be set to the text you want to display.
 */
export class MathjaxSpanElement extends HTMLElement {
    static observedAttributes = ['text'];
    
    attributeChangedCallback(name, oldValue, newValue) {
        mathjax_typeset_element(this, newValue);
    }
}
customElements.define('mathjax-span', MathjaxSpanElement);

/** Wrap substitutions in a JME expression in `subvar` function calls.
 * @param {JME} expr
 * @param {Numbas.jme.Notation} notation
 * @returns {JME}
 */
function wrap_subvar(expr, notation) {
    const [l,r] = notation.subvars_delimiters;
    var sbits = Numbas.util.splitbrackets(expr,l,r);
    var out = '';
    for(var j=0;j<sbits.length;j+=1) {
        out += j%2 ? ' subvar('+sbits[j]+')' : sbits[j]; //subvar here instead of \\color because we're still in JME
    }
    return out;
}

/** Convert a JME expression to LaTeX.
 *
 * @param {JME} expr
 * @param {string} rules - comma-separated list of simplification rules.
 * @param {Numbas.jme.Scope} scope
 * @param {Numbas.jme.Notation} notation
 * @returns {tex: string} | {tex: string, message: string, error: string|boolean}
 */
function texJMEBit(expr, rules, scope, notation) {
    rules = rules || 'basic';
    notation = notation || scope.notation || Numbas.jme.notations.standard;
    scope = new Numbas.jme.Scope(scope || Numbas.jme.builtinScope);
    try{
        expr = wrap_subvar(expr, notation);
        var tex = Numbas.jme.display.exprToLaTeX(expr,rules,scope,notation);
        return {tex: tex, error: false};
    } catch(e) {
        var tex = e.message.replace(/<\/?(code|em|strong)>/g,'');
        return {message: e.message, tex: '\\color{red}{\\text{'+tex+'}}', error: true};
    }
}

/**
 * Renders a JME expression using MathJax.
 *
 * Attributes:
 *
 * `expression` {JME}
 * `notation` {string} - the name of the notation to use.
 */
export class JMEPreviewElement extends HTMLElement {
    static observedAttributes = ['expression', 'notation'];

    connectedCallback() {
        this.attachShadow({mode: 'open'});
        this.output = this.ownerDocument.createElement('output');
        this.output.setAttribute('for', this.getAttribute('for'));
        this.shadowRoot.append(this.output);
        this.display();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.display();
    }

    display() {
        if(!this.output) {
            return;
        }
        const expr = this.getAttribute('expression');
        const rules = this.getAttribute('rules');
        const notation = Numbas.jme.notations[this.getAttribute('notation')];
        const scope = Numbas.jme.builtinScope; // TODO
        const res = texJMEBit(expr, rules, scope, notation);
        this.classList.toggle('warning', res.error);
        
        if(res.error) {
            this.output.innerHTML = res.message;
        } else if(res.tex.length > 0) {
            mathjax_typeset_element(this.output, `\\(${res.tex}\\)`);
        } else {
            this.output.innerHTML = '';
        }
    }
}

customElements.define('jme-preview', JMEPreviewElement);

function displayJMEValue(v, abbreviate, scope) {
    var code = Numbas.jme.display.treeToJME({tok:v}, undefined, scope);
    var description;
    switch(v.type) {
        case 'nothing':
            return {description: 'Nothing'};
        case 'string':
            code = Numbas.util.escapeHTML(v.value);
            description = Numbas.util.escapeHTML(v.value.slice(0,30));
            break;
        case 'set':
            description = 'Set of '+v.value.length+' '+Numbas.util.pluralise(v.value.length,'item','items');
            break;
        case 'matrix':
            description = 'Matrix of size '+v.value.rows+'×'+v.value.columns;
            break;
        case 'vector':
            description = 'Vector with '+v.value.length+' '+Numbas.util.pluralise(v.value.length,'component','components');
            break;
        case 'range':
            if(v.step == 0) {
                description = `Continuous interval between ${v.start} and ${v.end}`;
            } else {
                description = `Numbers between ${v.start} and ${v.end}, with step size ${v.step}`;
            }
            break;
        case 'list':
            function get_nested_layers() {
                const layer_lengths = [];

                function get_deepest_layer(v, depth) {
                    // depth is the current layer depth, lowest_depth is the lowest depth
                    // achieved so far through recursive calls.
                    let lowest_depth = Infinity;

                    if (v.type !== "list") {
                        return depth - 1;
                    } else if (v.value.length === 0) {
                        layer_lengths[depth - 1] = 0;
                        return depth - 1;
                    } else if (layer_lengths[depth - 1] === undefined && v.value[0].type === "list") {
                        layer_lengths[depth - 1] = v.value[0].value.length;
                    }

                    for (const item of v.value) {
                        if (item.type !== 'list' || item.value.length !== layer_lengths[depth - 1]) {
                            return depth - 1;
                        }

                        const next_layer_depth = get_deepest_layer(item, depth + 1);
                        if (next_layer_depth < lowest_depth) {
                            lowest_depth = next_layer_depth;
                        } 
                    }
                    return lowest_depth;
                }
                return layer_lengths.slice(0, get_deepest_layer(v, 1));
            }

            const nested_layers = get_nested_layers();
            if (nested_layers.length > 0) {
                nested_layers.unshift(v.value.length);
                description = `Nested ${nested_layers.join("×")} list`;
            } else {
                description = 'List of '+v.value.length+' '+Numbas.util.pluralise(v.value.length,'item','items');
            }
            break;
        case 'dict':
            const num_keys = Object.keys(v.value).length;
            description = 'Dictionary with '+num_keys+" "+Numbas.util.pluralise(num_keys, 'entry', 'entries');
            break;
        case 'html':
            if(v.value.length==1 && v.value[0].tagName=='IMG') {
                var src = v.value[0].getAttribute('src');
                return {value: '<img src="'+src+'" title="'+src+'">'};
            }
            description = 'HTML node';
            if(!abbreviate) {
                code = v.value;
            }
            break;
        default:
            var preferred_types = ['html', 'dict', 'list'];
            for(let type of preferred_types) {
                if(Numbas.jme.isType(v, type)) {
                    return displayJMEValue(Numbas.jme.castToType(v,type), abbreviate);
                }
            }
    }
    if(abbreviate && code.length > 30 && description) {
        return {description: description};
    }
    return {value: code};
}
/**
 * Show a JME token value.
 *
 * Attributes:
 *
 * `abbreviate` {true|false} - Should long values be abbreviated?
 *
 * Properties:
 *
 * `value` {Numbas.jme.token}
 */
export class JMEValueElement extends HTMLElement {
    static observedAttributes = ['abbreviate'];

    connectedCallback() {
        this.attachShadow({mode: 'open'});
        this.display();
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
        this.display();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.display();
    }

    display() {
        if(!this.shadowRoot) {
            return;
        }
        const abbreviate = this.getAttribute('abbreviate') == 'true';

        const value = this.value;

        if(!value) {
            this.shadowRoot.innerHTML = '';
            return;
        }

        const scope = Numbas.jme.builtinScope; // TODO - scope property

        // TODO show errors

        let display = '';
        let type = '';
        try {
            display = displayJMEValue(value, abbreviate, scope);
            type = value.type;
        } catch(e) {
            display = {description: e.message};
            type = 'error';
        }

        this.setAttribute('data-jme-value-type',type);
        if(display.value !== undefined) {
            this.shadowRoot.innerHTML = '';
            if(Array.isArray(display.value)) {
                for(let el of display.value) {
                    this.shadowRoot.append(el);
                }
            } else {
                this.shadowRoot.innerHTML = display.value;
            }
            this.setAttribute('data-jme-value-display','value');
        } else if(display.description !== undefined) {
            this.shadowRoot.innerHTML = display.description;
            this.setAttribute('data-jme-value-display','description');
        }
    }
}
customElements.define('jme-value', JMEValueElement);

/**
 * A way of displaying raw HTML inside an Elm app.
 * 
 * The `value` attribute should be the HTML code you want to display.
 */
export class RawHTMLElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode:'open'});
    }
    static get observedAttributes() { return ['html'] };

    attributeChangedCallback(name, oldValue, newValue) {
        if(name == 'html') {
            this.html = newValue;
        }
    }

    set html(value) {
        if(typeof value == 'string') {
            this.shadowRoot.innerHTML = value;
        } else {
            this.shadowRoot.innerHTML = '';
            this.shadowRoot.append(value);
        }
    }
}
customElements.define('raw-html', RawHTMLElement);


class ChangeEvent extends Event {
    constructor(target) {
        super('change');
        this.target = target;
    }
}
