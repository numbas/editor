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
//console.log(flags);

const app = Elm.QuestionEditor.init({
    node: document.querySelector('main'), 
    flags
});

app.ports.save_tab_state.subscribe(state => {
    history_state.save('tabs', state);
});

let variable_generation_run_number = 0;
async function computeVariables(prep) {
    const result = {variables: {}, conditionSatisfied: true, errors: []};
    
    const scope = new jme.Scope([prep.scope]);

    const {todo, condition} = prep;

    const random_int_string = () => new jme.types.TString(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)+'');
    Object.entries({
        'initial_seed': random_int_string,
        'student_id': random_int_string,
        'variable_generation_run_number': () => new jme.types.TString((variable_generation_run_number++).toString()),
    }).forEach(([name, value_generator]) => {
        scope.setVariable(name, value_generator());
    });

    async function computeVariable(name,todo,scope,path,computeFn) {
        scope.editor_evaluation_warnings = [];
        let value;
        try {
            value = await jme.variables.computeVariablePromise.apply(jme.variables, arguments);
        }
        catch(e) {
            name = todo[name]?.originalName || name;
            if(!result.variables[name]) {
                result.variables[name] = {error: e.message};
            }
            result.error = true;
            result.errors.push(e);
        }
        if(scope.editor_evaluation_warnings.length) {
            if(!result.variables[name]) {
                result.variables[name] = {};
            }
            result.variables[name].warnings = scope.editor_evaluation_warnings;
        }
        return value;
    }

    try {
        const vresult = await jme.variables.makeVariablesPromise(todo, scope, condition, computeVariable);
        result.conditionSatisfied = vresult.conditionSatisfied;
        Object.entries(vresult.variables).forEach(([name,value]) => {
            result.variables[name] = result.variables[name] || {};
            if(value) {
                result.variables[name].value = value;
            }
        });
    } catch(err) {
        const e = result.errors[0] || err;
        console.error(e);
        result.conditionError = e.message;
        result.conditionSatisfied = false;
    }

    return result;
}

const {wrapValue} = jme;
const {treeToJME} = jme.display;
function wrapExpression(expr) {
    return new jme.types.TExpression(jme.compile(expr));
}

const builtin_templateTypes = {
    anything: {
        load(definition) {
            return {
                code: definition
            };
        },
        toJME({code}) {
            return code;
        }
    },

    range: {
        load(definition) {
            const tree = jme.compile(definition);
            const rule = new jme.display.Rule('?;min..?;max#?;step',[]);
            const scope = jme.builtinScope;
            const m = rule.match(tree, scope);
            return {
                min: scope.evaluate(m.min).value,
                max: scope.evaluate(m.max).value,
                step: scope.evaluate(m.step).value,
            };
        },
        toJME({min,max,step}) {
            let tree = jme.compile('min..max#step');
            const s = new jme.Scope([{variables: {
                min: wrapExpression(min),
                max: wrapExpression(max),
                step: wrapExpression(step)
            }}]);
            tree = jme.substituteTree(tree, s);
            return treeToJME(tree);
        }
    },
    randrange: {
        load(definition) {
            const tree = jme.compile(definition);
            const rule = new jme.display.Rule('random(?;min..?;max#?;step)',[]);
            const scope = jme.builtinScope;
            const m = rule.match(tree, scope);
            return {
                min: scope.evaluate(m.min).value,
                max: scope.evaluate(m.max).value,
                step: scope.evaluate(m.step).value,
            };
        },
        toJME({min,max,step}) {
            let tree = jme.compile('random(min..max#step)');
            const s = new jme.Scope([{variables: {
                min: wrapExpression(min),
                max: wrapExpression(max),
                step: wrapExpression(step)
            }}]);
            tree = jme.substituteTree(tree, s);
            return treeToJME(tree);
        }
    },
    string: {
        load(definition) {
            var tree = jme.compile(definition);
            let isTemplate = false;
            while(jme.isFunction(tree.tok,'safe')) {
                isTemplate = true;
                tree = tree.args[0];
            }
            return {
                string: tree.tok.value,
                isTemplate
            };
        },
        toJME({string, isTemplate}) {
            var tok = wrapValue(string);
            tok.safe = isTemplate;
            var s = treeToJME({tok: tok});
            return s;
        }
    },
    'long plain string': {
        load(definition) {
            var tree = jme.compile(definition);
            let isTemplate = false;
            while(jme.isFunction(tree.tok,'safe')) {
                isTemplate = true;
                tree = tree.args[0];
            }
            return {
                string: tree.tok.value,
                isTemplate
            };
        },
        toJME({string, isTemplate}) {
            var tok = wrapValue(string);
            tok.safe = isTemplate;
            var s = treeToJME({tok: tok});
            return s;
        }
    },
    'long string': {
        load(definition) {
            var tree = jme.compile(definition);
            let isTemplate = false;
            while(jme.isFunction(tree.tok,'safe')) {
                isTemplate = true;
                tree = tree.args[0];
            }
            return {
                string: tree.tok.value,
                isTemplate
            };
        },
        toJME({string, isTemplate}) {
            var tok = wrapValue(string);
            tok.safe = isTemplate;
            var s = treeToJME({tok: tok});
            return s;
        }
    },
    'mathematical expression': {
        load(definition) {
            let tree = jme.compile(definition);
            tree = tree.args[0];
            while(jme.isFunction(tree.tok,'safe')) {
                tree = tree.args[0];
            }
            return {expression: tree.tok.value};
        },
        toJME({expression}) {
            const tok = wrapValue(expression);
            const tree = jme.compile('expression(x)');
            tree.args[0] = {tok: tok};
            return treeToJME(tree);
        }
    },
    'list of numbers': {
        load(definition) {
            var tree = jme.compile(definition);
            return {values: tree.args.map(function(t){return jme.display.treeToJME(t);})};
        },
        toJME({values}) {
            const numbers = values.filter(function(n){return n.trim() != ''});
            if(!numbers.every(function(n){return Numbas.util.isNumber(n,true)})) {
                throw("One of the values is not a number");
            }
            return treeToJME(jme.compile('['+numbers.join(',')+']'));
        }
    },
    'list of strings': {
        load(definition) {
            const tree = jme.compile(definition);
            const values = tree.args.map(function(t){
                while(jme.isFunction(t.tok,'safe')) {
                    t = t.args[0];
                }
                return t.tok.value + '';
            });
            return {values};
        },
        toJME({values}) {
            var strings = values.map(function(s) {
                var tok = wrapValue(s);
                tok.safe = false;
                return tok;
            });
            return treeToJME({tok: new jme.types.TList(strings)});
        }
    },
    'json': {
        load(definition) {
            let tree = jme.compile(definition);
            tree = tree.args[0];
            while(jme.isFunction(tree.tok,'safe')) {
                tree = tree.args[0];
            }
            return {json: tree.tok.value};
        },
        toJME({json}) {
            JSON.parse(json || '');
            var json = treeToJME({tok: wrapValue(json)});
            return 'json_decode('+json+')';
        }
    }
};

function get_variable_template(templateType) {
    const handler = builtin_templateTypes[templateType || 'anything'];
    if(!handler) {
        throw(new Error(`Unknown variable data type ${templateType}`));
    }
    return handler;
}

const ask_numbas_handlers = {
    is_equation({expression, notation}) { // -> boolean
        notation = jme.notations[notation];
        try {
            var answer = notation.compile(expression);
            return jme.isOp(answer.tok,'=');
        } catch(e) {
            return false;
        }
    },
    findvars({expression, notation, expandJuxtapositionsSettings}) { // -> list of {name: string, inferredType: string}
        try {
            notation = jme.notations[notation];
            var scope = jme.builtinScope; //this.scope(); TODO
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
    },
    parse_templateType({variable: {definition, templateType}}) {
        templateType = templateType || 'anything';
        try {
            const handler = get_variable_template(templateType);

            return handler.load(definition);
        } catch(e) {
            return {};
        }

    },
    variable_template_to_definition({template, templateType}) {
        const handler = get_variable_template(templateType);

        const definition = handler.toJME(template);
        return {definition};
    },
    async generateVariables({question}) {
        const scope = new jme.Scope([jme.builtinScope]); // TODO extensions etc.

        const scope_variable_names = Object.keys(scope.allVariables());

        const variable_definitions = Object.values(question.variables);

        const result = {variables: Object.fromEntries(variable_definitions.map(v => [v.name, {}]))};

        const todo = {};

        variable_definitions.forEach(v => {
            if(!v.name) {
                return;
            }
            try {
                const tree = jme.compile(v.definition);
                const vars = jme.findvars(tree, scope_variable_names, scope);
                todo[v.name] = {tree, vars};
                Object.assign(result.variables[v.name],
                    {
                        dependencies: vars,
                        names: jme.variables.splitVariableNames(v.name),
                    }
                );
            } catch(error) {
                console.error(error);
                result.variables[v.name].error = error.message || error.toString();
            }
        });

        variable_definitions.forEach(v => {
            const {tree} = todo[v.name];
            if(tree) {
                result.variables[v.name].isDeterministic = jme.isDeterministic(tree, scope);
                result.variables[v.name].isRandom = jme.isRandom(tree, scope);
            }
        });

        const condition = null; // TODO

        const prep = {scope, todo, condition};

        const compute_result = await computeVariables(prep);

        Object.entries(compute_result.variables).forEach(([name, res]) => {
            if(!result.variables[name]) {
                return;
            }
            Object.assign(result.variables[name], res);
        });

        result.conditionSatisfied = compute_result.conditionSatisfied;

        console.log(result);

        return result;
    }
};


app.ports.ask_numbas.subscribe(async ({command, key, param}) => {
    const handler = ask_numbas_handlers[command];

    if(!handler) {
        console.error(`No ask_numbas handler for ${command}`);
    }

    const result = await handler(param);
    app.ports.answer_numbas.send({command, key, result});
});
