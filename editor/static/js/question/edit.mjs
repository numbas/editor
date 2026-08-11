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

class Extension {
    constructor(def) {
        this.def = def;
    }

    load() {
        if(!this.loaded) {
            const {promise: loaded, resolve, reject} = Promise.withResolvers();
            this.loaded = loaded;

            const {def} = this;

            this.def.stylesheets.forEach(function(name) {
                var link = document.createElement('link');
                link.setAttribute('href', def.script_url + name);
                link.setAttribute('rel','stylesheet');
                document.head.appendChild(link);
            });
            const script_promises = this.def.scripts.map(name => {
                const script = document.createElement('script');
                script.setAttribute('src', def.script_url + name);
                const {promise: script_loaded, resolve, reject} = Promise.withResolvers();
                script.addEventListener('load',function(e) {
                    resolve(e);
                });
                script.addEventListener('error',function(e) {
                    reject(e);
                });
                document.head.appendChild(script);
                return script_loaded;
            });
            Promise.all(script_promises).then(function() {
                Numbas.activateExtension(def.location);
                resolve(Numbas.extensions[def.location]);
            }).catch(function(err) {
                reject(err);
            });
        }
        return this.loaded;
    }
}

const extensions = Object.fromEntries(item_json.numbasExtensions.map(def => {
    return [def.location, new Extension(def)];
}));


window.default_settings = default_settings;

const tab_state = history_state.get('tabs');

const {jme} = Numbas;

function find_jme_types() {
    const types = [];
    const forbiddenJmeTypes = ['op','name','function'];
    for(const type in Numbas.jme.types) {
        const t = Numbas.jme.types[type].prototype.type;
        if(t && !types.includes(t) && !forbiddenJmeTypes.includes(t)) {
            types.push(t);
        }
    }
    types.sort();
    return types;
}

const flags = {
    item_json,
    tab_state,
    CSRFToken: getCSRFtoken(),
    Numbas,
    default_settings,
    docs_mapping,
    jme_types: find_jme_types()
};
console.log(flags);

const app = Elm.QuestionEditor.init({
    node: document.querySelector('main'), 
    flags
});

app.ports.save_tab_state.subscribe(state => {
    history_state.save('tabs', state);
});

let variable_generation_run_number = 0;

async function computeVariables(prep) {
    const scope = new jme.Scope([prep.scope]);

    const result = {variables: {}, conditionSatisfied: true, errors: [], scope};
    
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

function activateExtension(extension) {
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
        let scope = new jme.Scope([jme.builtinScope]); // TODO extensions etc.

        await Promise.all((question.extensions || []).map(async (location) => {
            const extension = extensions[location];
            if(!extension) {
                throw(new Error(`Unknown extension ${location}`));
            }
            const ext = await extension.load();
            if(ext.scope) {
                scope = new jme.Scope([scope, ext.scope]);
            }
        }));

        const functionsTodo = question.functions;

        const made_functions = jme.variables.makeFunctions(functionsTodo, scope);
        
        const seen_functions = {}

        functionsTodo.map(function(f) {
            try {
                const name = jme.normaliseName(f.name, scope);
                if(!name) {
                    return;
                }
                const i = seen_functions[name] || 0;
                seen_functions[name] = i + 1;
                const cfn = made_functions[name][i];

                const oevaluate = cfn.evaluate;
                cfn.evaluate = function(args,scope) {
                    function warning(message) {
                        let wscope = scope;
                        while(wscope.editor_evaluation_warnings === undefined) {
                            wscope = wscope.parent;
                            if(!wscope) {
                                return;
                            }
                        }

                        const suggestions = [];
                        function parameter_signature_suggestion(tok) {
                            if(jme.isType(tok,'number')) {
                                return 'number';
                            }
                            if(tok.type == 'list') {
                                if(tok.value.length > 0) {
                                    const item_sigs = tok.value.map(parameter_signature_suggestion);
                                    if(item_sigs.length > 0 && item_sigs.every(s => s == item_sigs[0])) {
                                        return 'list of ' + item_sigs[0];
                                    }
                                }
                                return 'list';
                            }
                            if(tok.type == 'dict') {
                                const item_sigs = Object.values(tok.value).map(parameter_signature_suggestion);
                                if(item_sigs.length > 0 && item_sigs.every(s => s == item_sigs[0])) {
                                    return 'dict of '+item_sigs[0];
                                }
                            }
                            return tok.type;
                        }
                        const parameter_signature_suggestions = args.map(parameter_signature_suggestion);
                        f.parameters.forEach(function(p,i) {
                            const current_sig = p.type.replace('?','anything');
                            const suggested_sig = parameter_signature_suggestion(args[i]);
                            if(current_sig != suggested_sig) {
                                suggestions.push({
                                    kind: 'change signature', 
                                    parameter: p, 
                                    from: current_sig, 
                                    to: suggested_sig
                                });
                            }
                        });

                        wscope.editor_evaluation_warnings.push({fn: f, message: message, suggestions: suggestions, args: args.slice()});
                    }
                    function check_value(tok) {
                        switch(tok.type) {
                            case 'number':
                                if(!(Numbas.util.isNumber(tok.value) || tok.value.complex)) {
                                    warning("A value of <code>NaN</code> was returned.");
                                }
                                break;
                            case 'list':
                                tok.value.forEach(check_value);
                                break;
                            case 'dict':
                                Object.values(tok.value).forEach(check_value);
                                break;
                        }
                    }
                    const result = oevaluate.apply(this, arguments);
                    if(cfn.outtype != '?' && !jme.isType(result,cfn.outtype)) {
                        warning("This function is supposed to return a <code>"+cfn.outtype+"</code> but instead returned a <code>"+result.type+"</code>.");
                    }
                    check_value(result);
                    return result;
                }
                console.log('add function', cfn.name);
                scope.addFunction(cfn);
                return {fn: cfn};
            }
            catch(e) {
                console.error(e);
                return {error: e};
            }
        });

        const scope_variable_names = Object.keys(scope.allVariables());

        const variable_definitions = Object.values(question.variables);

        const result = {
            variables: Object.fromEntries(variable_definitions.map(v => [v.name, {}])),
            scope
        };

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

        result.scope = compute_result.scope;

        return result;
    },

    async generateQuestion({question: question_def, scope}) {
        const question = Numbas.createQuestionFromJSON(question_def, 1, null, null, scope);

        question.generateVariables();

        await question.signals.on('ready');

        if(question_def.partsMode == 'explore') {
            question_def.parts.slice(1).forEach(function(_, i) {
                const p = question.addExtraPart(i+1);
            });
        }

        const part_info = Object.fromEntries(question.allParts().map(p => {
            const scope = p.getScope();
            const answer = p.getCorrectAnswer(scope);
            return [p.path, {answer}];
        }));

        return {question, part_info};
    },

    async submit_answer({answer, path, question}) {
        await promise;

        const result = {};

        try {
            const part = question.getPart(path);
            if(!part) {
                throw(new Error("Part not found"));
            }
            if(!answer) {
                throw(new Error("Student's answer not set. There may be an error in the input widget."));
            }
            part.storeAnswer(answer);
            part.setStudentAnswer();

            var marking_parameters = part.marking_parameters(part.rawStudentAnswerAsJME());
            result.marking_parameters = Object.entries(marking_parameters).map(function(p){ 
                return {
                    name: p[0],
                    value: p[1]
                }
            });
            result.settings = Object.entries(marking_parameters['settings'].value).map(function(s) {
                return {
                    name: s[0],
                    value: s[1]
                }
            });

            part.submit();

            var promise;
            if(part.waiting_for_pre_submit) {
                this.waiting_for_pre_submit(true);
                promise = part.waiting_for_pre_submit.then(function() {
                    part.submit();
                });
            } else {
                promise = Promise.resolve(true);
            }
            await promise;

            var res = part.script_result;
            let out;
            if(!res) {
                out = {script: part.markingScript, error: 'The marking algorithm did not return a result.'};
            } else {
                var alternative_used = part.best_alternative ? part.best_alternative.path : null;
                out = {
                    script: part.markingScript,
                    result: res,
                    marking_result: part.marking_result,
                    markingFeedback: part.markingFeedback,
                    marks: part.marks,
                    credit: part.credit,
                    score: part.score,
                    alternative_used: alternative_used
                };
                if(res.state_errors.mark) {
                    out.error = 'Error when computing the <code>mark</code> note: '+res.state_errors.mark.message;
                } else if(!res.state_valid.mark) {
                    out.error = 'This answer is not valid.';
                    out.warnings = part.warnings;
                }
            }
            Object.assign(result, out);
        } catch(e) {
            result.error = 'Error marking: '+e.message;
        }
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
