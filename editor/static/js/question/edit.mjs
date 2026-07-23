import * as history_state from '../history_state.mjs';
import '../custom-elements.mjs';
import {getCSRFtoken} from '../csrf-token.mjs';
import exam_schema from 'static/js/numbas/exam_schema.json' with {type: 'json'};
import docs_mapping from 'static/js/numbas/docs_mapping.json' with {type: 'json'};

const defs = Object.assign({exam: exam_schema}, exam_schema['$defs']);

window.docs_mapping = docs_mapping;

window.defs = defs;

class DefaultsArray extends Array {
    constructor(contents, items) {
        super(...contents);
        this.items = items;
    }
}

function make_default(obj) {
    if(obj.default !== undefined) {
        return obj.default;
    }
    if(obj.const) {
        return obj.const;
    }

    const o = {};

    if(obj.properties) {
        Object.assign(o, Object.fromEntries(Object.entries(obj.properties).map(([k,v]) => [k, make_default(v)])));
        return o;
    }
    if(obj.additionalProperties) {
        return {additionalProperties: make_default(obj.additionalProperties)};
    }
    if(obj.oneOf) {
        return make_default(obj.oneOf[0]);
    }
    switch(obj.type) {
        case 'array':
            const arr = obj.prefixItems ? obj.prefixItems.map(make_default) : [];
            const items = obj.items ? make_default(obj.items) : [];
            return new DefaultsArray(arr, items);

        case 'string':
            return '';
    }
}
window.make_default = make_default;

const default_settings = Object.fromEntries(['question', 'part'].map(k => [k, make_default(defs[k])]));

default_settings.part_types = Object.fromEntries(defs.part.anyOf.map(d => [d.properties.type.const, make_default(d)]));

default_settings.part_types.numberentry.notationStyles = Numbas.locale.default_number_notation;

default_settings.marking_algorithms = Object.fromEntries(Object.entries(Numbas.partConstructors).map(([type,v]) => {
    let script = v.prototype.baseMarkingScript();
    if(!script) {
        return [type, null];
    }
    return [
        type,
        Object.entries(script.notes).map(([name,note]) => {
            return {
                name: note.name,
                definition: note.expr,
                description: note.description
            }
        })
    ]
}));



window.default_settings = default_settings;

const tab_state = history_state.get('tabs');

const {jme} = Numbas;

const flags = {
    item_json,
    tab_state,
    CSRFToken: getCSRFtoken(),
    Numbas,
    default_settings,
    docs_mapping,
};
console.log(flags);

const app = Elm.QuestionEditor.init({
    node: document.querySelector('main'), 
    flags
});

app.ports.save_tab_state.subscribe(state => {
    history_state.save('tabs', state);
});

const ask_numbas_handlers = {
    is_equation({expression, notation}) { // -> boolean
        notation = Numbas.jme.notations[notation];
        try {
            var answer = notation.compile(expression);
            return Numbas.jme.isOp(answer.tok,'=');
        } catch(e) {
            return false;
        }
    },
    findvars({expression, notation, expandJuxtapositionsSettings}) { // -> list of {name: string, inferredType: string}
        try {
            notation = Numbas.jme.notations[notation];
            var scope = Numbas.jme.builtinScope; //this.scope(); TODO
            var bits = Numbas.util.splitbrackets(expression,'{','}','(',')');
            for(var i=1;i<bits.length;i+=2) {
                bits[i] = '1';
            }
            var correctAnswer = bits.join('');
            var answer = scope.expandJuxtapositions(notation.compile(correctAnswer), expandJuxtapositionsSettings);
            var names = jme.findvars(answer,[],scope);
            var inferredTypes = jme.inferVariableTypes(answer,jme.builtinScope);
            return names.sort().map(name => {
                return {name, inferredType: inferredTypes[name]};
            });
        } catch(e) {
            return [];
        }
    },
    capturedNames({pattern}) { // -> list of string
        try {
            var expr = jme.rules.patternParser.compile(pattern);
        } catch(e) {
            return [];
        }
        if(!expr) {
            return [];
        }
        return jme.rules.findCapturedNames(expr);
    }
};


app.ports.ask_numbas.subscribe(({command, key, param}) => {
    const handler = ask_numbas_handlers[command];

    if(!handler) {
        console.error(`No ask_numbas handler for ${command}`);
    }

    const result = handler(param);
    app.ports.answer_numbas.send({command, key, result});
});
