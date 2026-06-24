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
 * `expresssion` {JME}
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

/**
 * A way of displaying raw HTML inside an Elm app.
 * 
 * The `value` attribute should be the HTML code you want to display.
 */
export class RawHTMLElement extends HTMLElement {
}
customElements.define('raw-html', RawHTMLElement);
