var viewModel;

$(document).ready(function() {
    var builtinRulesets = ['basic','unitFactor','unitPower','unitDenominator','zeroFactor','zeroTerm','zeroPower','noLeadingMinus','collectNumbers','simplifyFractions','zeroBase','constantsFirst','sqrtProduct','sqrtDivision','sqrtSquare','trig','otherNumbers']

    Editor.question = {};

    var vars_used_in_html = Editor.vars_used_in_html = function(html,scope) {
        var element = document.createElement('div');
        element.innerHTML = html;
        try {
            var subber = new Numbas.jme.variables.DOMcontentsubber(scope);
            return subber.findvars(element);
        } catch(e) {
            return [];
        }
    }
    var vars_used_in_string = Editor.vars_used_in_string = function(str,scope) {
        var bits = Numbas.util.splitbrackets(str,'{','}');
        var vars = [];
        for(var i=1;i<bits.length;i+=2) {
            try {
                var tree = Numbas.jme.compile(bits[i]);
                vars = vars.merge(Numbas.jme.findvars(tree,[],scope));
            } catch(e) {
                continue;
            }
        }
        return vars;
    }

    var jmeTypes = ko.observableArray([]);
    function find_jme_types() {
        var types = [];
        var forbiddenJmeTypes = ['op','name','function'];
        for(var type in Numbas.jme.types) {
            var t = Numbas.jme.types[type].prototype.type;
            if(t && types.indexOf(t)==-1 && forbiddenJmeTypes.indexOf(t)==-1) {
                types.push(t);
            }
        }
        types.sort();
        types.splice(0,0,'anything');
        jmeTypes(types);
    }
    find_jme_types();
    var jmeParameterTypes = ko.computed(function() {
        return jmeTypes().concat('custom');
    },this);


    var Question = Editor.question.Question = function(data)
    {
        var q = this;

        Editor.EditorItem.apply(this);

        this.resources = ko.observableArray([]);
        this.extensions = ko.observableArray([]);
        this.statement = Editor.contentObservable('');
        this.advice = Editor.contentObservable('');
        var rulesets = this.rulesets = ko.observableArray([]);
        this.functions = ko.observableArray([]);
        this.currentFunction = ko.observable(null);
        this.variables = ko.observableArray([]);
        this.builtin_constants = [
            {name: 'e', description: 'Base of the natural logarithm'},
            {name: 'pi,π', description: 'Ratio of a circle\'s perimeter to its diameter'},
            {name: 'i', description: '$\\sqrt{-1}$'}
        ];
        this.builtin_constants.forEach(function(c) {
            c.enabled = ko.observable(true);
        });
        this.constants = ko.observableArray([]);
        this.allConstants = ko.computed(function() {
            var out = [];
            this.constants().forEach(function(c) {
                out = out.concat(c.name().split(','));
            });
            this.builtin_constants.forEach(function(c) {
                out = out.concat(c.name.split(','));
            });
            return out.map(function(c) { return c.trim(); });
        },this);
        this.questionScope = ko.observable();
        this.markingScope = ko.computed(function() {
            var s = this.questionScope();
            if(!s) {
                return;
            }
            return new Numbas.marking.StatefulScope([s]);
        },this);
        this.variableGroups = ko.observableArray([]);
        this.editVariableGroup = ko.observable(null);
        this.autoCalculateVariables = ko.observable(true);
        this.currentVariable = ko.observable(null);
        this.variablesTest = {
            condition: ko.observable(''),
            conditionError: ko.observable(false),
            conditionSatisfied: ko.observable(true), // was the condition satisfied when generating a preview set of values?
            maxRuns: ko.observable(100),
            totalRuns: ko.observable(0),
            totalErrors: ko.observable(0),
            totalCorrect: ko.observable(0),
            advice: ko.observable(''),
            running_time: ko.observable(3),
            running: ko.observable(false),
            time_remaining: ko.observable(0)
        };
        this.variablesTabMode = ko.observable('edit variables');
        this.showVariableTesting = function() {
            this.variablesTabMode('testing');
        };
        this.currentVariable.subscribe(function(v) {
            if(v) {
                q.variablesTabMode('edit variables');
            }
        });

        this.partsModes = [
            {name: 'Show all parts', value: 'all'},
            {name: 'Explore', value: 'explore'}
        ];
        this.partsMode = ko.observable(this.partsModes[0]);


        this.parts = ko.observableArray([]);
        ko.computed(function() {
            if(this.partsMode().value=='all') {
                this.parts().forEach(function(p) {
                    p.reachable(true);
                });
                return;
            }
            if(!this.parts().length) {
                return;
            }
            var p = this.parts()[0];
            var seen = [p];
            var queue = [p];
            while(queue.length>0) {
                p = queue.pop();
                p.reachable(true);
                p.nextParts().forEach(function(np) {
                    var p2 = np.otherPart();
                    if(p2) {
                        if(seen.indexOf(p2)==-1) {
                            queue.push(p2);
                            seen.push(p2);
                        }
                    }
                });
            }
            this.parts().forEach(function(p) {
                p.reachable(seen.indexOf(p)>=0);
            });
        },this);

        // all parts in this question, including child parts such as gaps and steps
        this.allParts = ko.pureComputed(function() {
            var o = [];
            this.parts().map(function(p) {
                o.push(p);
                if(p.type().name=='gapfill') {
                    o = o.concat(p.gaps());
                }
                o = o.concat(p.steps());
                o = o.concat(p.alternatives());
            });
            return o;
        },this);

        this.currentPart = ko.observable(null);

        this.partsTabMode = ko.observable('edit part');
        this.showPartOptions = function() {
            this.partsTabMode('options');
        };
        this.partsTabMode.subscribe(function(mode) {
            switch(mode) {
                case 'edit part':
                    q.addingPart(null);
                    break;
                case 'options':
                    q.currentPart(null);
                    q.addingPart(null);
                    break;
                case 'add part':
                    q.currentPart(null);
                    break;
            }
        });

        this.partTypes = ko.pureComputed(function() {
            return Editor.part_types.models;
        }, this);
        this.gapTypes = ko.pureComputed(function(){ return q.partTypes().filter(function(t){ return t.can_be_gap!==false }); });
        this.stepTypes = ko.pureComputed(function(){ return q.partTypes().filter(function(t){ return t.can_be_step!==false }); });

        this.addingPart = ko.observable(null);
        this.part_search = ko.observable('');
        this.filtered_part_types = ko.pureComputed(function() {
            var search = this.part_search().trim();
            var part_types = this.addingPart() ? this.addingPart().availableTypes() : this.partTypes();

            if(!search) {
                return part_types;
            }
            var words = search.toLowerCase().split(/\s+/g).map(function(w){ return w.trim() });
            return part_types.filter(function(pt) {
                return words.every(function(word){ return pt.search_text.contains(word) || !word; });
            });
        },this);

        this.usedPartTypes = ko.pureComputed(function() {
            return Editor.part_types.models.filter(function(pt) {
                return q.allParts().some(function(p){ return p.type().name==pt.name });
            })
        }, this);

        this.run_all_unit_tests = async function() {
            for(let p of q.allParts()) {
                for(let mt of p.all_unit_tests()) {
                    mt.running(true);
                }
            }
            setTimeout(async () => {
                for(let p of q.allParts()) {
                    await p.run_all_tests(true);
                }
            },100);
        }

        this.maxMarks = ko.observable(0);
        this.penalties = ko.observableArray([]);
        this.objectives = ko.observableArray([]);

        this.objective_visibility_options = [
            {name: 'Always', id: 'always'},
            {name: 'When active', id: 'when-active'}
        ];

        this.penaltyVisibility = ko.observable(this.objective_visibility_options[0]);
        this.objectiveVisibility = ko.observable(this.objective_visibility_options[0]);

        this.addObjective = function() {
            q.objectives.push(new ScoreBin(q));
        }
        this.removeObjective = function(objective) {
            q.objectives.remove(objective);
        }

        this.addPenalty = function() {
            q.penalties.push(new ScoreBin(q));
        }
        this.removePenalty = function(penalty) {
            q.penalties.remove(penalty);
        }

        //for image attribute modal
        this.imageModal = {
            width: ko.observable(0),
            height: ko.observable(0),
            title: ko.observable(''),
            alt: ko.observable('')
        }
        //for iframe attribute modal
        this.iframeModal = {
            width: ko.observable(0),
            height: ko.observable(0)
        }

        this.add_to_basket = function() {
            Editor.add_question_to_basket(item_json.itemJSON.id);
        }

        this.saveResources = ko.pureComputed(function() {
            var resources = this.resources();
            var out = [];
            for(var i=0;i<resources.length;i++) {
                var res = resources[i];
                if(res.progress()==1) {
                    out.push({
                        pk: res.pk(),
                        alt_text: res.alt_text()
                    });
                }
            }
            return out;
        },this);

        for(var i=0;i<item_json.numbasExtensions.length;i++) {
            this.extensions.push(new Extension(this,item_json.numbasExtensions[i]));
        }
        this.usedExtensions = ko.pureComputed(function() {
            return this.extensions().filter(function(e){return e.used_or_required()});
        },this);

        this.allsets = ko.pureComputed(function() {
            return builtinRulesets.concat(this.rulesets().map(function(r){return r.name()})).sort();
        },this);

        this.preamble = {
            css: ko.observable(''),
            js: ko.observable('')
        };

        this.extensionTabs = new Editor.Tabber([
            new Editor.Tab('extensions','Extensions','wrench',{in_use: ko.pureComputed(function() { return this.usedExtensions().length>0 },this)}),
            new Editor.Tab('constants','Constants','pencil',{in_use: ko.pureComputed(function() { return this.constants().length>0 || this.builtin_constants.some(function(c) { return !c.enabled(); }) },this)}),
            new Editor.Tab('rulesets','Rulesets','list-alt',{in_use: ko.pureComputed(function() { return this.rulesets().length > 0 },this)}),
            new Editor.Tab('functions','Functions','education',{in_use: ko.pureComputed(function() { return this.functions().length>0 },this)}),
            new Editor.Tab('preamble','Preamble','console',{in_use: ko.pureComputed(function() { return this.preamble.css()!='' || this.preamble.js()!='' },this)})
        ]);

        var extensions_tab_in_use = ko.pureComputed(function() {
            return this.extensionTabs.tabs.some(function(tab) { return tab.in_use(); });
        },this);

        var testing_tab_in_use = ko.pureComputed(function() {
            return this.allParts().some(function(p) { return p.unit_tests().length>0; });
        },this);

        this.mainTabber.tabs([
            new Editor.Tab('statement','Statement','blackboard',{in_use: ko.pureComputed(function(){ return this.statement()!=''; },this)}),
            new Editor.Tab('parts','Parts','check',{in_use: ko.pureComputed(function() { return this.parts().length>0; },this)}),
            new Editor.Tab('variables','Variables','list',{in_use: ko.pureComputed(function() { return this.variables().length>0; },this), warning: ko.pureComputed(function() { return this.variableErrors(); },this)}),
            new Editor.Tab('advice','Advice','blackboard',{in_use: ko.pureComputed(function() { return this.advice()!=''; },this)}),
            new Editor.Tab('extensions','Extensions & scripts','wrench',{in_use: extensions_tab_in_use}),
            new Editor.Tab('resources','Resources','picture',{in_use: ko.pureComputed(function() { return this.resources().length>0; },this)}),
            new Editor.Tab('settings','Settings','cog'),
            new Editor.Tab('exams','Exams using this question','book',{in_use:item_json.used_in_exams}),
            new Editor.Tab('testing','Testing','check',{in_use: testing_tab_in_use}),
            new Editor.Tab('network','Other versions','link',{in_use:item_json.other_versions_exist}),
            new Editor.Tab('history','Editing history','time',{in_use:item_json.editing_history_used})
        ]);
        if(item_json.editable) {
            var adviceTab = new Editor.Tab('access','Access','lock');
            this.mainTabber.tabs.splice(8,0,adviceTab);
        }
        this.mainTabber.currentTab(this.mainTabber.tabs()[0]);

        this.baseScopeWithoutConstants= ko.pureComputed(function() {
            var jme = Numbas.jme;
            var scope = new jme.Scope(jme.builtinScope);
            var extensions = this.extensions().filter(function(e){return e.used_or_required() && e.loaded()});
            for(var i=0;i<extensions.length;i++) {
                var extension = extensions[i].location;
                if(extension in Numbas.extensions && 'scope' in Numbas.extensions[extension]) {
                    scope = new jme.Scope([scope,Numbas.extensions[extension].scope]);
                }
            }

            this.functions().map(function(f) {
                try {
                    var fn = {
                        name: f.name().toLowerCase(),
                        definition: f.definition(),
                        language: f.language().name,
                        outtype: f.type(),
                        parameters: f.parameters().map(function(p) {
                            if(!p.name()) {
                                throw(new Error('A parameter is unnamed.'));
                            }
                            return {
                                name: p.name(),
                                type: p.signature(),
                            }
                        })
                    };

                    var cfn = jme.variables.makeFunction(fn,scope);
                    var oevaluate = cfn.evaluate;
                    cfn.evaluate = function(args,scope) {
                        function warning(message) {
                            var wscope = scope;
                            while(wscope.editor_evaluation_warnings === undefined) {
                                wscope = wscope.parent;
                                if(!wscope) {
                                    return;
                                }
                            }

                            var suggestions = [];
                            function parameter_signature_suggestion(tok) {
                                if(jme.isType(tok,'number')) {
                                    return 'number';
                                }
                                if(tok.type=='list') {
                                    if(tok.value.length>0) {
                                        var item_sigs = tok.value.map(parameter_signature_suggestion);
                                        if(item_sigs.every(function(s) { return s==item_sigs[0]; })) {
                                            return 'list of '+item_sigs[0];
                                        }
                                    }
                                    return 'list';
                                }
                                if(tok.type=='dict') {
                                    var item_sigs = [];
                                    for(var name in tok.value) {
                                        var sig = parameter_signature_suggestion(tok.value[name]);
                                    }
                                    if(item_sigs.length>0 && item_sigs.every(function(s) { return s==item_sigs[0]; })) {
                                        return 'dict of '+item_sigs[0];
                                    }
                                }
                                return tok.type;
                            }
                            var parameter_signature_suggestions = args.map(parameter_signature_suggestion);
                            f.parameters().forEach(function(p,i) {
                                var current_sig = p.signature().replace('?','anything');
                                var suggested_sig = parameter_signature_suggestions[i];
                                if(current_sig != suggested_sig) {
                                    suggestions.push({
                                        kind:'change signature', 
                                        parameter: p, 
                                        from:current_sig, 
                                        to: suggested_sig, 
                                        apply: function() {
                                            p.set_signature(suggested_sig);
                                        }
                                    });
                                }
                            });

                            wscope.editor_evaluation_warnings.push({fn: f, message: message, suggestions: suggestions, args: args.slice()});
                        }
                        function check_value(tok) {
                            switch(tok.type) {
                                case 'number':
                                    if(!(Numbas.util.isNumber(tok.value) || tok.value.complex)) {
                                        warning("a value of <code>NaN</code> was returned.",['explicit number parameters']);
                                    }
                                    break;
                                case 'list':
                                    tok.value.forEach(check_value);
                                    break;
                                case 'dict':
                                    for(var name in tok.value) {
                                        check_value(tok.value[name]);
                                    }
                                    break;
                            }
                        }
                        var result = oevaluate.apply(this,arguments);
                        if(cfn.outtype!='?' && !jme.isType(result,cfn.outtype)) {
                            warning("this function is supposed to return a <code>"+cfn.outtype+"</code> but instead returned a <code>"+result.type+"</code>.",['explicit number parameters']);
                        }
                        check_value(result);
                        return result;
                    }
                    scope.addFunction(cfn);
                }
                catch(e) {
                    f.error(e.message);
                }

            });



            return scope;
        },this);
        
        this.baseScope = ko.pureComputed(function() {
            var jme = Numbas.jme;
            var scope = this.baseScopeWithoutConstants();

            var constants = this.constants().filter(function(c) { return !c.error(); }).map(function(c) {
                return {
                    name: c.name(),
                    value: c.value(),
                    tex: c.tex()
                }
            });
            var defined_constants = Numbas.jme.variables.makeConstants(constants,scope);

            this.builtin_constants.forEach(function(c) {
                if(!c.enabled()) {
                    c.name.split(',').forEach(function(name) {
                        if(defined_constants.indexOf(jme.normaliseName(name,scope))==-1) {
                            scope.deleteConstant(name);
                        }
                    });
                }
            });

            document.body.classList.add('jme-scope');
            $(document.body).data('jme-scope',scope);
            $(document.body).data('jme-show-substitutions',true);

            return scope;
        },this);

        this.startAddingPart = function() {
            q.addingPart({kind:'part', parent:null, parentList: q.parts, availableTypes: q.partTypes});
        }
        this.addingPartHere = ko.pureComputed(function() {
            var a = q.addingPart();
            if(!a) {
                return false;
            }
            return a.kind == 'part' && a.parent == null;
        },this);

        this.addPart = function(type) {
            var adding = q.addingPart();
            var p = new Part(adding.kind,q,adding.parent,adding.parentList);
            p.setType(type.name);
            adding.parentList.push(p);
            q.currentPart(p);
            q.addingPart(null);
            return p;
        }
        this.currentPart.subscribe(function(p) {
            if(p) {
                q.partsTabMode('edit part');
            }
        });
        this.addingPart.subscribe(function(adding) {
            if(adding) {
                q.partsTabMode('add part');
            }
        });
        ko.computed(function() {
            if(this.parts().length==0 && !this.addingPart()) {
                this.startAddingPart();
            }
        },this);

        this.baseVariableGroup = new VariableGroup(this,{name:'Ungrouped variables'});
        this.baseVariableGroup.fixed = true;
        this.allVariableGroups = ko.pureComputed(function() {
            var l = this.variableGroups();
            return l.concat(this.baseVariableGroup);
        },this);

        // this changes whenever there's a change to a variable name or definition, or a variables is added or removed (or similar to the functions)
        this.lastVariableChange = ko.pureComputed(function() {
            this.variables().map(function(v) {
                v.definition();
                v.name();
            });
            this.functions().map(function(f) {
                f.name();
            f.definition();
                f.parameters();
                f.type();
                f.language();
            });
            return new Date();
        },this);

        this.variablesTest.time_remaining_display = ko.pureComputed(function() {
            return this.time_remaining()+' '+Numbas.util.pluralise(this.time_remaining(),'second','seconds');
        },this.variablesTest);

        // reset the advice whenever the condition changes or there's a change to the variables
        ko.computed(function() {
            this.variablesTest.condition();
            this.lastVariableChange();
            this.variablesTest.advice('');
        },this);

        this.variableErrors = ko.pureComputed(function() {
            var variables = this.variables();
            for(var i=0;i<variables.length;i++) {
                if(variables[i].name().trim()=='' || variables[i].definition().trim()=='' || variables[i].nameError() || variables[i].error()) {
                    return true;
                }
            }
            return false;
        },this);

        this.variablesReady = ko.pureComputed(function() {
            if(this.variableErrors()) {
                return false;
            }
            var variables = this.variables();
            for(var i=0;i<variables.length;i++) {
                if(variables[i].value()===null) {
                    return false;
                }
            }
            return true;
        },this);

        this.addVariableBefore = function() {
            var n = q.variables.indexOf(this);
            var v = new Variable(q);
            q.variables.splice(n,0,v);
        }

        this.goToVariable = function(name) {
            var v = q.getVariable(name);
            if(!v) {
                return;
            }
            q.currentVariable(v);
            q.mainTabber.setTab('variables')();
        }

        ko.computed(function() {
            if(!this.autoCalculateVariables())
                return;
            //the ko dependency checker seems not to pay attention to what happens in the computeVariables method, so access the variable bits here to give it a prompt
            if(this.extensions().some(function(ext) { return ext.loading(); })) {
                return;
            }
            this.functions().map(function(v) {
                v.name();
                v.definition();
                v.parameters();
            });
            this.variables().map(function(v) {
                v.name();
                v.definition();
            });
            this.generateVariablePreview();
        },this).extend({throttle:300});

        this.regenerateVariables = function() {
            q.generateVariablePreview();
        }

        this.variable_references = ko.pureComputed(function() {
            var o = [];
            o.push(new VariableReference({kind:'tab',tab:'statement',value:q.statement,type:'html',description:'Statement', scope:q.baseScope}));
            o.push(new VariableReference({kind:'tab',tab:'advice',value:q.advice,type:'html',description:'Advice', scope:q.baseScope}));
            o.push(new VariableReference({kind:'tab',tab:'variables',value:q.variablesTest.condition,type:'jme',description:'Variable testing condition', scope:q.baseScope}));
            q.allParts().forEach(function(p) {
                o = o.concat(p.variable_references());
            });
            return o;
        },this);

        this.toJSON = ko.pureComputed(function() {
            return this.remake_json();
        },this);

        if(data) {
            this.load(data);
        }

        ko.computed(function() {
            var undefined_variables = [];
            var all_references = new Set();

            // Find references to variable names

            // First: references in variable definitions
            this.variables().forEach(function(v) {
                v.references([]);
                v.dependencies().forEach(function(name) {
                    all_references.add(name);
                    if(!q.getVariable(name)) {
                        undefined_variables.push(name);
                    }
                });
            });

            // Then: references elsewhere in the question
            this.variable_references().forEach(function(r) {
                var def = r.def;
                var description = r.description();
                var icons;
                switch(def.kind) {
                    case 'tab':
                        icons = [q.mainTabber.getTab(def.tab).icon];
                        break;
                    case 'part':
                        icons = [q.mainTabber.getTab('parts').icon];
                        var tab = def.part.tabber.getTab(def.tab);
                        if(tab) {
                            icons.push(tab.icon);
                        }
                        break;
                }
                function go() {
                    switch(def.kind) {
                        case 'tab':
                            q.mainTabber.setTab(def.tab)();
                            break;
                        case 'part':
                            q.mainTabber.setTab('parts')();
                            q.currentPart(def.part);
                            def.part.tabber.setTab(def.tab)();
                            break;
                    }
                }
                var ref = {
                    description: description, 
                    icons: icons, 
                    go: go
                };
                r.vars().forEach(function(name) {
                    var v = q.getVariable(name);
                    all_references.add(name);
                    if(v) {
                        v.references.push(ref);
                    } else {
                        undefined_variables.push(name);
                    }
                });
            });

            // For each unique variable name with no corresponding definition, make a new Variable object
            undefined_variables = new Set(undefined_variables);
            undefined_variables.forEach(function(name) {
                var v = q.baseVariableGroup.justAddVariable(true);
                v.name(name);
                v.added_because_missing = true;
            });

            // Remove unneeded automatically-added Variable objects.
            // plan:
            //  progressively mark Variable objects as 'kept', for these reasons:
            //  * added manually
            //  * non-empty definition
            //  * for each name referred to, one Variable object defining that name, ideally one already kept
            //
            //  then remove any remaining variables, which must be added automatically, have empty definitions, and have no references to them
            
            var keeping = new Set();

            this.variables().forEach(function(v) {
                if(!v.added_because_missing || v.definition().trim()!='') {
                    keeping.add(v);
                }
            });

            all_references.forEach(function(name) {
                var variables = q.variables().filter(function(v) {
                    return v.names().map(function(n) { return Numbas.jme.normaliseName(n.name); }).contains(name);
                });
                if(!variables.find(function(v) { return keeping.has(v); })) {
                    keeping.add(variables[0]);
                }
            });

            var not_keeping = q.variables().filter(function(v) { return !keeping.has(v); });
            not_keeping.forEach(function(v) {
                v.remove();
            });

            var names = [];
            this.variables().forEach(function(v) {
                v.names().forEach(function(name) {
                    names.push({v:v, name:Numbas.jme.normaliseName(name.name)});
                })
            });
            this.constants().forEach(function(c) {
                c.names().forEach(function(name) {
                    names.push({v:c, name:Numbas.jme.normaliseName(name.name)});
                })
            });

            //  Finally, mark duplicate names
            names.sort(Numbas.util.sortBy('name'));
            function handle_group(group) {
                group.forEach(function(n) {
                    n.v.duplicateNameError(group.length > 1 ? n.name : null);
                });
            }

            var start = 0;
            names.forEach(function(n,i) {
                if(n.name!=names[start].name) {
                    handle_group(names.slice(start,i));
                    start = i;
                }
            });
            handle_group(names.slice(start));
        },this).extend({throttle: 2000});

        /** Create an instance of this question as a Numbas.Question object.
         */
        this.should_remake_instance = true;
        ko.computed(function() {
            this.toJSON();
            this.baseScope();
            this.should_remake_instance = true;
        },this);
        this.instance_error = ko.observable(null);
        this.instance = function() {
            if(this.should_remake_instance) {
                this.instance_error(null);
                var qq = Numbas.createQuestionFromJSON(this.toJSON(),1,null,null,this.baseScope());
                var vm = this;
                qq.signals.on('ready',function() {
                    if(qq.partsMode=='explore') {
                        vm.parts().slice(1).forEach(function(p,i) {
                            var p = qq.addExtraPart(i+1);
                        });
                    }
                }).catch(function(e) {
                    q.instance_error(e);
                });
                this._instance = qq;
                this.should_remake_instance = false;
            }
            return this._instance;
        };


        if(item_json.editable) {
            this.deleteResource =  function(res) {
                q.resources.remove(res);
            }

            this.init_output();

            this.save = ko.pureComputed(function() {
                var used_nodes = [];
                function node_used(n) {
                    if(n.used()) {
                        used_nodes.push(n.pk);
                        n.children.forEach(node_used);
                    }
                }
                this.taxonomies.forEach(function(t) {
                    t.trees.forEach(node_used);
                });
                return {
                    content: this.output(),
                    extensions: this.usedExtensions().map(function(e){return e.pk}),
                    tags: this.tags(),
                    taxonomy_nodes: used_nodes,
                    ability_levels: this.used_ability_levels().map(function(al){return al.pk}),
                    resources: this.saveResources(),
                    metadata: this.metadata()
                };
            },this);

            this.init_save();


            this.section_tasks = {
                'settings': [
                    Editor.nonempty_task('Give the question a name.',this.name, '#name-input'),
                    Editor.nonempty_task('Fill out the question description.',this.description,'#description-input .wmTextArea'),
                    Editor.nonempty_task('Select a licence defining usage rights.',this.licence, '#licence-select')
                ],
                'statement': [
                    Editor.nonempty_task('Write a question statement.',this.statement,'#statement-input .wmTextArea')
                ],
                'variables': [
                    {text: 'Add one or more variables to randomise the question', done: ko.pureComputed(function() { return this.variables().length>0 && !this.variableErrors(); },this), focus_on: '#add-variable-button'}
                ],
                'parts': [
                    {text: 'Create at least one part.', done: ko.pureComputed(function(){ return this.parts().length>0 },this), focus_on: '#add-part-button'}
                ],
                'advice': [
                    Editor.nonempty_task('Write a worked solution to the question.',this.advice, '#advice-input .wmTextArea')
                ]
            }

            this.init_tasks();
        }

        if(window.history !== undefined) {
            this.load_state();
            var state = window.history.state || {};
            if('currentVariable' in state) {
                var variables = this.variables();
                for(var i=0;i<variables.length;i++) {
                    var variable = variables[i];
                    if(variable.name().toLowerCase()==state.currentVariable) {
                        this.currentVariable(variable);
                        break;
                    }
                }
            }
            Editor.computedReplaceState('currentVariable',ko.pureComputed(function(){
                var v = this.currentVariable();
                if(v) {
                    return v.name().toLowerCase();
                } else {
                    return undefined;
                }
            },this));
            if('currentPartTabs' in state) {
                Object.keys(state.currentPartTabs).forEach(function(path) {
                    var tab = state.currentPartTabs[path];
                    var part = q.getPart(path);
                    if(part) {
                        part.tabber.setTab(tab)();
                    }
                });
            }
            if('currentPart' in state) {
                this.currentPart(this.getPart(state.currentPart));
            }
            if('currentExtensionTab' in state) {
                this.extensionTabs.setTab(state.currentExtensionTab)();
            }
            if('currentFunction' in state) {
                this.currentFunction(this.getFunction(state.currentFunction));
            }
            if('partsTabMode' in state) {
                this.partsTabMode(state.partsTabMode);
            }
            Editor.computedReplaceState('currentPart',ko.pureComputed(function() {
                var p = this.currentPart();
                if(p) {
                    return p.path();
                }
            },this));
            Editor.computedReplaceState('currentPartTabs',ko.pureComputed(function() {
                var d = {};
                q.allParts().forEach(function(p) {
                    d[p.path()] = p.tabber.currentTab().id;
                });
                return d;
            },this));
            Editor.computedReplaceState('currentExtensionTab',ko.pureComputed(function() {
                return q.extensionTabs.currentTab().id;
            }));
            Editor.computedReplaceState('currentFunction', ko.pureComputed(function() {
                var f = q.currentFunction();
                if(f) {
                    return f.name();
                }
            }));
            Editor.computedReplaceState('partsTabMode',this.partsTabMode);
        }

    }
    Question.prototype = {
        deleteItem: function(q,e) {
            if(window.confirm('Really delete this question?')) {
                $(e.target).find('form').submit();
            }
        },

        addRuleset: function() {
            this.rulesets.push(new Ruleset(this));
        },

        addFunction: function(q,e,n) {
            var f = new CustomFunction(this);
            if(n!=undefined) {
                this.functions.splice(n,0,f);
            } else {
                this.functions.push(f);
                this.currentFunction(f);
            }
            return f;
        },

        justAddVariable: function(q,e,n) {
            var v = new Variable(this);
            if(n!=undefined) {
                this.variables.splice(n,0,v);
            } else {
                this.variables.push(v);
            }
            return v;
        },

        addVariable: function(q,e,n) {
            var v = this.justAddVariable(q,e,n);
            this.currentVariable(v);
            return v;
        },

        addVariableGroup: function() {
            var vg = new VariableGroup(this);
            this.variableGroups.push(vg);
            return vg;
        },

        getVariable: function(name) {
            name = Numbas.jme.normaliseName(name);
            var variables = this.variables();
            for(var i = 0; i<variables.length;i++) {
                if(variables[i].names().find(function(x) { return Numbas.jme.normaliseName(x.name)==name; })) {
                    return variables[i];
                }
            }
        },

        getVariableGroup: function(name) {
            var groups = this.allVariableGroups();
            for(var i=0;i<groups.length;i++) {
                if(groups[i].name()==name) {
                    return groups[i];
                }
            }
            var vg = new VariableGroup(this,{name:name});
            this.variableGroups.push(vg);
            return vg;
        },

        getFunction: function(name) {
            name = Numbas.jme.normaliseName(name || '');
            var functions = this.functions();
            for(var i=0;i<functions.length;i++) {
                if(Numbas.jme.normaliseName(functions[i].name())==name) {
                    return functions[i];
                }
            }
        },

        getObjectHint: function(kind, name) {
            var q = this;
            switch(kind) {
                case 'variable':
                    var v = this.getVariable(name);
                    if(v) {
                        return {
                            go: function() {
                                q.goToVariable(name);
                            },
                            description: v.description()
                        }
                    }
                case 'function':
                case 'operator':
                    if(this.getFunction(name)) {
                        return {
                            go: function() {
                                q.mainTabber.setTab('extensions')();
                                q.extensionTabs.setTab('functions')();
                            }
                        }
                    }
                case 'constant':
                    if(this.allConstants().contains(name)) {
                        return {
                            go: function() {
                                q.mainTabber.setTab('extensions')();
                                q.extensionTabs.setTab('constants')();
                            }
                        }
                    }
            }
        },

        addConstant: function() {
            var c = new Constant(this);
            this.constants.push(c);
        },

        loadPart: function(data) {
            var p = new Part('part',this,null,this.parts,data);
            this.parts.push(p);
            return p;
        },

        getPart: function(path) {
            var re_path = /^p(\d+)(?:([gsa])(\d+))?$/;
            var m = re_path.exec(path);
            if(!m) {
                return;
            }
            var i = parseInt(m[1]);
            var p = this.parts()[i];
            if(!p) {
                return;
            }
            if(m[2]) {
                var l = m[2];
                var lists = {
                    'g': p.gaps,
                    's': p.steps,
                    'a': p.alternatives
                }
                var j = parseInt(m[3]);
                return lists[l]()[j];
            } else {
                return p;
            }
        },

        generateVariablePreview: function() {
            if(!Numbas.jme)
            {
                var q = this;
                Numbas.init = function() {
                    q.generateVariablePreview();
                };
                return;
            }

            this.functions().map(function(f) {
                f.error('');
            });
            this.variables().map(function(v) {
                if(!v.locked.peek()) {
                    v.error('');
                    v.warnings([]);
                    v.value(null);
                }
            });

            var prep = this.prepareVariables();

            this.variables().map(function(v) {
                var name = v.name().toLowerCase();
                if(prep.todo[name]) {
                    v.dependencies(prep.todo[name].vars);
                } else {
                    v.dependencies([]);
                }

                try {
                    var tree = Numbas.jme.compile(v.definition());
                    if(!tree) {
                        throw("no tree");
                    }
                    var is_random = Numbas.jme.isRandom(tree,prep.scope);
                    v.random(is_random);
                } catch(e) {
                    v.random(false);
                }
            });

            var conditionSatisfied = false;
            var results;
            var runs = 0;
            var maxRuns = this.variablesTest.maxRuns();
            while(runs<maxRuns && !conditionSatisfied) {
                results = this.computeVariables(prep);
                conditionSatisfied = results.conditionSatisfied;
                runs += 1;
            }
            this.variablesTest.conditionSatisfied(conditionSatisfied);

            // fill in observables
            this.variables().map(function(v) {
                if(v.locked.peek()) {
                    return;
                }
                var name = v.name().toLowerCase();
                var result = results.variables[name];
                if(!result) {
                    v.value(null);
                    return;
                }
                if(conditionSatisfied) {
                    if('value' in result) {
                        v.value(result.value);
                    }
                }
                if('error' in result) {
                    v.error(result.error);
                }
                if('warnings' in result) {
                    v.warnings(result.warnings);
                }
            });

            var rulesetTodo = {};
            this.rulesets().forEach(function(r) {
                rulesetTodo[r.name()] = r.sets();
            });
            Numbas.jme.variables.makeRulesets(rulesetTodo,results.scope);

            this.questionScope(results.scope);
        },

        // get everything ready to compute variables - make functions, and work out dependency graph
        prepareVariables: function() {
            var jme = Numbas.jme;

            var scope = new jme.Scope([this.baseScope()]);

            //make structure of variables to evaluate
            var todo = {}
            this.variables().map(function(v) {
                var name = v.name().toLowerCase();
                if(!v.name()) {
                    return;
                }
                if(v.definitionError()) {
                    v.error(v.definitionError().message);
                    return;
                }
                if(!v.definition()) {
                    todo[name] = {
                        v: v,
                        tree: null,
                        vars: []
                    };
                    return;
                }
                if(v.locked.peek()) {
                    scope.variables[v.name()] = v.value();
                } 
                try {
                    var tree = jme.compile(v.definition());
                    if(!tree) {
                        throw(new Numbas.Error('jme.variables.empty definition',{name:name}));
                    }
                    var vars = jme.findvars(tree,[],scope);
                    v.error('');
                }
                catch(e) {
                    v.error(e.message);
                    return;
                }
                todo[name] = {
                    v: v,
                    tree: tree,
                    vars: vars
                }
            });

            var condition;
            try {
                condition = Numbas.jme.compile(this.variablesTest.condition());
                this.variablesTest.conditionError(false);
            } catch(e) {
                this.variablesTest.conditionError(e.message);
                condition = null;
            }

            return {
                    scope: scope,
                    todo: todo,
                    condition: condition
            };
        },

        /* Given a list of variable names, return a list of names of the dependencies of those variables which have some random element */
        randomDependencies: function(vars) {
            var d = this.prepareVariables();
            var scope = d.scope;
            var todo = d.todo;
            var deps = Numbas.jme.variables.variableDependants(todo,vars);
            var randoms = [];
            for(var name in deps) {
                if(Numbas.jme.isRandom(deps[name].tree,scope)) {
                    randoms.push(name);
                }
            }
            return randoms;
        },

        computeVariables: function(prep) {
            var result = {variables: {}, conditionSatisfied: true};
            var jme = Numbas.jme;
            var scope = result.scope = new jme.Scope([prep.scope]);
            var todo = prep.todo;

            function computeVariable(name,todo,scope,path,computeFn) {
                scope.editor_evaluation_warnings = [];
                var value;
                try {
                    value = jme.variables.computeVariable.apply(jme.variables, arguments);
                }
                catch(e) {
                    name = todo[name].originalName || name;
                    if(!result.variables[name]) {
                        result.variables[name] = {error: e.message};
                    }
                    result.error = true;
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
                var vresult = Numbas.jme.variables.makeVariables(todo,scope,prep.condition,computeVariable)
                result.conditionSatisfied = vresult.conditionSatisfied;
                Object.keys(vresult.variables).forEach(function(name) {
                    result.variables[name] = result.variables[name] || {};
                    if(vresult.variables[name]) {
                        result.variables[name].value = vresult.variables[name];
                    }
                });
            } catch(e) {
                console.error(e);
                this.variablesTest.conditionError(e.message);
                result.conditionSatisfied = false;
            }

            return result;
        },

        cancelVariablesTest: function() {
            this.variablesTest.cancel = true;
        },

        testVariables: function() {
            var running_time = parseFloat(this.variablesTest.running_time());
            var start = new Date()
            var end = start.getTime()+running_time*1000;
            var runs = 0;
            var errors = 0;
            var correct = 0;
            var q = this;
            var prep = this.prepareVariables();

            this.variablesTest.time_remaining(running_time);
            this.variablesTest.cancel = false;
            this.variablesTest.running(true);

            function finish() {
                q.variablesTest.running(false);
                var timeTaken = ((new Date())-start)/1000;
                var timePerRun = timeTaken/runs;

                q.variablesTest.totalRuns(runs);
                q.variablesTest.totalErrors(errors);
                q.variablesTest.totalCorrect(correct);

                var probPass = correct/runs;
                var probFail = 1-probPass;
                var probError = errors/runs;

                // calculate 95% confidence interval for probPass
                var z = 1.9599639845400545;
                var n = runs;
                var p = probPass;
                var confidence = {
                    lower: (1/(1+z*z/n))*(p+z*z/(2*n)-z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))),
                    upper: (1/(1+z*z/n))*(p+z*z/(2*n)+z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n)))
                };

                var suggestedRuns = Math.ceil(Math.log(1/1000)/Math.log(probFail));
                if(suggestedRuns<1) {
                    suggestedRuns = 1;
                }
                var probSucceedInTime = 1-Math.pow(probFail,1/timePerRun);

                function round(n,precision) {
                    precision = precision || 2;
                    return Numbas.math.niceNumber(n,{precisionType:'sigfig',precision:3});
                }

                if(correct==0) {
                    q.variablesTest.advice('The condition was never satisfied. That means it\'s either really unlikely or impossible.');
                } else {
                    q.variablesTest.advice(
                        '<p>The condition was satisfied <strong>'+round(probPass*100)+'%</strong> of the time, over <strong>'+runs+'</strong> runs, with <strong>'+round(probError*100)+'%</strong> of runs aborted due to errors. The mean computation time for one run was <strong>'+round(timePerRun)+'</strong> seconds.</p>'+
                        '<p>Successfully generating a set of variables will take on average <strong>'+round(timePerRun*(1/probPass))+'</strong> seconds on this device.</p>'+
                        '<p>In order to fail at most 1 in every 1000 times the question is run, you should set the max. runs to <strong>'+suggestedRuns+'</strong>, taking at most <strong>'+round(timePerRun*suggestedRuns)+'</strong> seconds on this device.</p>'+
                        '<p>If you want to allow at most <strong>1 second</strong> to generate a set of variables, i.e. set max. runs to <strong>'+round(1/timePerRun)+'</strong>, this device\'s chance of succeeding is <strong>'+round(probSucceedInTime*100)+'%</strong>.</p>'
                    );
                }
            }

            var ot = Math.ceil(running_time);
            function test() {
                var t = new Date();
                if(q.variablesTest.cancel || t>end) {
                    finish();
                } else {
                    var diff = Math.ceil((end-t)/1000);
                    if(diff!=ot) {
                        ot = diff;
                        q.variablesTest.time_remaining(diff);
                    }
                    try {
                        runs += 1;
                        var run = q.computeVariables(prep);
                    } catch(e) {
                        q.variablesTest.running(false);
                        return;
                    }

                    if(run.conditionSatisfied) {
                        correct += 1;
                    }
                    if(run.error) {
                        errors += 1;
                    }
                    setTimeout(test,1);
                }
            }
            test();
        },

        remake_json: function() {
            var rulesets = {};
            this.rulesets().forEach(function(r){
                rulesets[r.name()] = r.sets();
            });

            var builtin_constants = {};
            this.builtin_constants.forEach(function(c) {
                builtin_constants[c.name] = c.enabled();
            });

            var constants = this.constants().map(function(c) {
                return c.toJSON();
            });

            var variables = {};
            this.variables().forEach(function(v) {
                variables[v.name()] = v.toJSON();
            });

            var ungrouped_variables = this.baseVariableGroup.variables().map(function(v){
                return v.name();
            });

            var groups = [];
            this.variableGroups().forEach(function(g) {
                groups.push({
                    name: g.name(),
                    variables: g.variables().map(function(v){return v.name()})
                });
            });

            var functions = {};
            this.functions().forEach(function(f) {
                functions[f.name()] = f.toJSON();
            });

            return {
                name: this.realName(),
                tags: this.tags(),
                metadata: this.metadata(),
                statement: this.statement(),
                advice: this.advice(),
                rulesets: rulesets,
                extensions: this.extensions().filter(function(e){return e.used()}).map(function(e){return e.location}),
                builtin_constants: builtin_constants,
                constants: constants,
                variables: variables,
                variablesTest: {
                    condition: this.variablesTest.condition(),
                    maxRuns: this.variablesTest.maxRuns()
                },
                ungrouped_variables: ungrouped_variables,
                variable_groups: groups,
                functions: functions,
                preamble: {
                    js: this.preamble.js(),
                    css: this.preamble.css()
                },
                parts: this.parts().map(function(p){return p.toJSON();}),
                partsMode: this.partsMode().value,

                maxMarks: this.maxMarks(),
                objectives: this.objectives().map(function(o){return o.toJSON();}),
                penalties: this.penalties().map(function(p){return p.toJSON();}),
                objectiveVisibility: this.objectiveVisibility().id,
                penaltyVisibility: this.penaltyVisibility().id
            }
        },

        reset: function() {
            this.resources([]);
            this.tags([]);
            this.rulesets([]);
            this.functions([]);
            this.variables([]);
            this.variableGroups([]);
            this.baseVariableGroup.variables([]);
            this.parts([]);
            this.extensions().map(function(e){
                e.used(false);
            });

        },

        load: function(data) {
            Editor.EditorItem.prototype.load.apply(this,[data]);

            var q = this;

            if('extensions' in data) {
                this.extensions().map(function(e) {
                    if(data.extensions.indexOf(e.location)>=0)
                        e.used(true);
                });
            }

            if('resources' in data) {
                data.resources.map(function(rd) {
                    this.resources.push(new Editor.Resource(rd));
                },this);
            }

            contentData = data.JSONContent;

            tryLoad(contentData,['name','statement','advice','maxMarks'],this);

            if('builtin_constants' in contentData) {
                this.builtin_constants.forEach(function(c) {
                    c.enabled(contentData.builtin_constants[c.name] || false);
                });
            }

            if('constants' in contentData) {
                contentData.constants.forEach(function(def) {
                    var c = new Constant(q,def);
                    q.constants.push(c);
                });
            }

            if('variables' in contentData) {
                for(var x in contentData.variables) {
                    var v = new Variable(this,contentData.variables[x]);
                    this.variables.push(v);
                }
            }
            if('variable_groups' in contentData) {
                contentData.variable_groups.map(function(gdata) {
                    var vg = q.getVariableGroup(gdata.name);
                    gdata.variables.map(function(variable_name) {
                        var v = q.getVariable(variable_name);
                        if(v) {
                            vg.variables.push(v);
                            q.baseVariableGroup.variables.remove(v);
                        }
                    });
                });
            }
            if('ungrouped_variables' in contentData) {
                contentData.ungrouped_variables.map(function(variable_name) {
                    var v = q.getVariable(variable_name);
                    if(v) {
                        q.baseVariableGroup.variables.remove(v);
                        q.baseVariableGroup.variables.push(v);
                    }
                });
            }

            this.selectFirstVariable();

            if('variablesTest' in contentData) {
                tryLoad(contentData.variablesTest,['condition','maxRuns'],this.variablesTest);
            }

            if('functions' in contentData)
            {
                for(var x in contentData.functions)
                {
                    contentData.functions[x].name = x;
                    this.functions.push(new CustomFunction(this,contentData.functions[x]));
                }
            }

            if('preamble' in contentData)
            {
                tryLoad(contentData.preamble,['css','js'],this.preamble);
            }

            if('rulesets' in contentData)
            {
                for(var x in contentData.rulesets)
                {
                    this.rulesets.push(new Ruleset(this,{name: x, sets:contentData.rulesets[x]}));
                }
            }

            var partsMode = Editor.tryGetAttribute(contentData,'partsMode');
            for(var i=0;i<this.partsModes.length;i++) {
                var mode = this.partsModes[i];
                if(mode.value==partsMode) {
                    this.partsMode(mode);
                    break;
                }
            }

            if('objectives' in contentData) {
                contentData.objectives.forEach(function(odata) {
                    q.objectives.push(new ScoreBin(q,odata));
                });
            }
            if('penalties' in contentData) {
                contentData.penalties.forEach(function(pdata) {
                    q.penalties.push(new ScoreBin(q,pdata));
                });
            }
            Editor.tryLoadMatchingId(contentData, 'objectiveVisibility', 'id', this.objective_visibility_options, this);
            Editor.tryLoadMatchingId(contentData, 'penaltyVisibility', 'id', this.objective_visibility_options, this);

            if('parts' in contentData)
            {
                contentData.parts.map(function(pd) {
                    this.loadPart(pd);
                },this);
            }
            switch(this.partsMode().value) {
                case 'all':
                    if(this.parts().length) {
                        this.currentPart(this.parts()[0]);
                    }
                    break;
                case 'explore':
                    this.partsTabMode('options');
                    break;
            }
            this.allParts().forEach(function(p) {
                p.nextParts().forEach(function(np) {
                    np.otherPart(np.part.parentList()[np.otherPartIndex]);
                    np.variableReplacements().forEach(function(vr) {
                        vr.value_options().find(function(vo,i) {
                            if(vr.custom_definition()==ko.unwrap(vo.definition)) {
                                vr.value_option(vo);
                                return true;
                            }
                        });
                    });
                });
            });

            try{
                this.tags(data.tags);
            }
            catch(e) {
                this.tags([]);
            }

        },

        selectFirstVariable: function() {
            if(this.variables().length) {
                var groups = this.allVariableGroups();
                for(var i=0;i<groups.length;i++) {
                    if(groups[i].variables().length) {
                        this.currentVariable(groups[i].variables()[0]);
                        return;
                    }
                }
            }
            this.currentVariable(null);
        },

        insertImage: function(image) {
            $('#imagePickModal').modal('hide');

            var ed = viewModel.currentTinyMCE;
            if(!ed) {
                return;
            }

            var name = image.name();
            var html;

            switch(image.filetype()) {
            case 'html':
                html = '<div><iframe src="'+image.url()+'"></div>';
                break;
            default:
                var alt = '';
                if(image.alt_text()) {
                    alt = ' alt="'+image.alt_text()+'"';
                }
                html = '<img src="'+image.url()+'"'+alt+'>';
            }
            ed.execCommand('mceInsertContent',false,html);
        },

        changeImageAttributes: function() {
            $(this.imageModal.selectedNode)
                .css({
                    width: this.imageModal.width(), 
                    height: this.imageModal.height()
                });
            
            $(this.imageModal.selectedNode)
                .removeAttr('data-mce-style')
            $(this.imageModal.selectedNode)
                .attr('alt',this.imageModal.alt())
            $(this.imageModal.selectedNode)
                .attr('title',this.imageModal.title())
            ;

            $('#imageAttributeModal').modal('hide');

            var ed = viewModel.currentTinyMCE;
            ed.fire('change');
        },

        changeIframeAttributes: function() {
            $(this.iframeModal.selectedNode)
                .css({
                    width: this.iframeModal.width(), 
                    height: this.iframeModal.height()
                })
                .removeAttr('data-mce-style')
            ;

            $('#iframeAttributeModal').modal('hide');

            var ed = viewModel.currentTinyMCE;
            ed.onChange.dispatch();
        }
    };
    Question.prototype.__proto__ = Editor.EditorItem.prototype;

    function Extension(q,data) {
        var ext = this;
        ["location","name","edit_url","hasScript","url","scriptURL","author","pk","script_url","scripts"].forEach(function(k) {
            ext[k] = data[k];
        });
        this.used = ko.observable(false);
        this.required = ko.pureComputed(function() {
            return q.usedPartTypes().some(function(p){ return p.required_extensions && p.required_extensions.indexOf(ext.location) != -1 });
        }, this);
        this.loading = ko.observable(false);
        this.loaded = ko.observable(false);
        this.error = ko.observable(false);
        this.used_or_required = ko.computed({
            read: function() {
                return (this.used() || this.required()) && !this.error();
            },
            write: function(v) {
                return this.used(v);
            }
        }, ext);

        ko.computed(function() {
            try {
                if(this.used_or_required()) {
                    if(!this.loaded()) {
                        try {
                            ext.load();
                        } catch(e) {
                            console.error(e);
                            setTimeout(function() {
                                ext.error(true);
                            },1);
                        }
                    }
                    find_jme_types();
                }
            } catch(e) {
                console.error(e);
            }
        },this);
    }
    Extension.prototype = {
        load: function() {
            this.loading(true);
            var ext = this;
            if(this.loaded()) {
                return;
            }
            var script_promises = [];
            this.scripts.forEach(function(name) {
                var script = document.createElement('script');
                script.setAttribute('src', ext.script_url+name);
                var promise = new Promise(function(resolve,reject) {
                    script.addEventListener('load',function(e) {
                        resolve(e);
                    });
                    script.addEventListener('error',function(e) {
                        reject(e);
                    });
                });
                script_promises.push(promise);
                document.head.appendChild(script);
            });
            Promise.all(script_promises).then(function() {
                Numbas.activateExtension(ext.location);
                ext.loaded(true);
                viewModel.regenerateVariables();
            }).catch(function(err) {
                console.error(err);
            }).finally(function() {
                ext.loading(false);
            });
        }
    }

    function Ruleset(exam,data)
    {
        this.name = ko.observable('');
        this.sets = ko.observableArray([]);
        this.allsets = exam.allsets;
        this.remove = function() {
            exam.rulesets.remove(this);
        };
        if(data)
            this.load(data);
    }
    Ruleset.prototype = {
        load: function(data) {
            var ruleset = this;
            this.name(data.name);
            data.sets.map(function(set){ ruleset.sets.push(set); });
        }
    };

    var re_name = /^{?((?:(?:[a-zA-Z]+):)*)((?:\$?[a-zA-Z_][a-zA-Z0-9_]*'*)|\?)}?$/i;

    function VariableGroup(q,data) {
        var vg = this;
        this.fixed = false;
        this.name = ko.observable('Unnamed group');
        this.isEditing = ko.pureComputed({
            write: function(v) {
                if(v) {
                    q.editVariableGroup(vg);
                } else if(q.editVariableGroup()==vg) {
                    q.editVariableGroup(null);
                }
            },
            read: function() {
                return q.editVariableGroup()==vg;
            }
        },this);
        this.endEdit = function() {
            vg.isEditing(false);
        }
        this.displayName = ko.pureComputed(function() {
            return this.name() ? this.name() : 'Unnamed group'
        },this);

        this.variables = ko.observableArray([]);
        ko.computed(function() {
            vg.variables().map(function(v) {
                v.group(vg);
            });
        },this);

        this.receivedVariables = ko.observableArray([]);
        ko.computed(function() {
            var received = this.receivedVariables();
            if(received.length) {
                this.variables(this.variables().concat(received));
                this.receivedVariables([]);
            }
        },this);

        /** Add a variable to this group but don't set it as the current variable
         */
        this.justAddVariable = function() {
            var v = q.justAddVariable();
            this.variables.push(v);
            return v;
        }

        this.addVariable = function() {
            var v = q.addVariable();
            this.variables.push(v);
            return v;
        }
        if(data) {
            tryLoad(data,['name'],this);
        }
        this.remove = function() {
            q.variableGroups.remove(this);
            this.variables().map(function(v) {
                q.baseVariableGroup.variables.push(v);
            });
            this.variables([]);
        }
    }
    VariableGroup.prototype = {
        sort: function() {
            this.variables(this.variables().sort(function(a,b){
                a = a.name().toLowerCase();
                b = b.name().toLowerCase();
                return a>b ? 1 : a==b ? 0 : -1;
            }));
        }
    }

    function parse_names(v, variablesAccessor,kind) {
        kind = kind || 'variable';
        var names = ko.pureComputed(function() {
            var jme = Numbas.jme;
            var names = v.name().split(/\s*,\s*/);
            var val = v.value && v.value();
            if(names.length>1) {
                if(val && jme.isType(val,'list')) {
                    var values_list = jme.castToType(val,'list');
                } 
            }
            return names.map(function(name,i) {
                var d = {
                    name: name,
                    type: '',
                    value: null
                }

                d.nameError = (function() {
                    if(!re_name.test(name)) {
                        return 'The '+kind+' name <code>'+name+'</code> is invalid.';
                    }

                    var tokens = Numbas.jme.tokenise(name);
                    if(tokens.length != 1) {
                        return 'The '+kind+' name <code>'+name+'</code> is invalid.';
                    }
                    if(tokens[0].type != 'name') {
                        return 'The '+kind+' name <code>'+name+'</code> is reserved.';
                    }

                    if(typeof Numbas.jme.builtinScope.getVariable(name) !== 'undefined'){
                        return 'The '+kind+' name <code>'+name+'</code> is reserved.';
                    }
                })();

                var item;
                if(names.length==1) {
                    var item = val;
                } else if(values_list) {
                    item = values_list.value[i]; 
                }
                if(item) {
                    d.value = item;
                    d.type = item.type;
                }

                return d;
            });
        },v);

        var nameError = ko.pureComputed(function() {
            var duplicateNameError = v.duplicateNameError();
            var name_errors = names().map(function(nd) {
                var name = nd.name;
                if(name.toLowerCase() == duplicateNameError) {
                    return 'There\'s another variable or constant with the name '+name+'.';
                }
                if(name=='') {
                    return '';
                }
                return nd.nameError || '';
            });
            return name_errors.find(function(x) { return x; }) || '';
        },v);

        return {names: names, nameError: nameError};
    }

    function Variable(q,data) {
        var v = this;
        this.question = q;
        this._name = ko.observable('');
        this.name = ko.pureComputed({
            read: function() {
                return this._name().trim();
            },
            write: function(v) {
                return this._name(v);
            }
        },this);
        this.group = ko.observable(null);
        this.random = ko.observable(null);
        this.duplicateNameError = ko.observable(null);
        var names = parse_names(this,q.variables,'variable');
        this.names = names.names;
        this.nameError = names.nameError;

        this.usedInTestCondition = ko.pureComputed(function() {
            var name = this.name();
            var scope = this.question.baseScope();
            try {
                var condition = Numbas.jme.compile(this.question.variablesTest.condition());
                var vars = Numbas.jme.findvars(condition,[],scope);
                return vars.contains(name);
            }
            catch(e) {
                return false;
            }
        },this);

        this.description = ko.observable('');
        this.templateType = ko.observable(this.templateTypes[0]);

        function InexhaustibleList() {
            var _arr = ko.observableArray([]);
            function addValue(v) {
                v = v || '';
                var _obs = ko.observable(v);
                var obj;
                var obs = ko.computed({
                    read: function() {
                        return _obs();
                    },
                    write: function(v) {
                        var arr = _arr();
                        if(v && obj==arr[arr.length-1]) {
                            addValue('');
                        }
                        return _obs(v);
                    }
                });
                function onBlur() {
                    var arr = _arr();
                    if(arr.indexOf(this)<arr.length-1 && !this.value())
                        _arr.remove(obj);
                }
                obj = {value: obs, onBlur: onBlur};
                _arr.push(obj);
                return obs;
            }
            addValue();
            var arr = ko.computed({
                read: function() {
                    return _arr().slice(0,-1).map(function(v){return v.value()});
                },
                write: function(a) {
                    _arr([]);
                    for(var i=0;i<a.length;i++) {
                        addValue(a[i]);
                    }
                    addValue();
                }
            });
            arr.edit = _arr;
            return arr;
        }

        this.templateTypeValues = {
            'anything': {
                definition: ko.observable('')
            },
            'number': {
                value: ko.observable(0)
            },
            'range': {
                min: ko.observable(0),
                max: ko.observable(1),
                step: ko.observable(1)
            },
            'randrange': {
                min: ko.observable(0),
                max: ko.observable(1),
                step: ko.observable(1)
            },
            'string': {
                value: ko.observable(''),
                isTemplate: ko.observable(false)
            },
            'long plain string': {
                value: ko.observable(''),
                isTemplate: ko.observable(true)
            },
            'long string': {
                value: ko.observable(''),
                isTemplate: ko.observable(false)
            },
            'list of numbers': {
                values: InexhaustibleList(),
            },
            'list of strings': {
                values: InexhaustibleList()
            },
            'json': {
                value: ko.observable(''),
                prettyPrint: function() {
                    var val = this.templateTypeValues.json.value();
                    try {
                        var data = JSON.parse(val);
                        this.templateTypeValues.json.value(JSON.stringify(data,null,4));
                    } catch(e) {
                    }
                }
            },
            'mathematical expression': {
                value: ko.observable(''),
            }
        };
        this.templateTypeValues['list of numbers'].floatValues = ko.pureComputed(function() {
            return this.values().map(function(n){return parseFloat(n)});
        },this.templateTypeValues['list of numbers']);
        this.editDefinition = this.templateTypeValues['anything'].definition;
        this.definitionError = ko.observable(null);
        this.definition = ko.computed({
            read: function() {
                this.definitionError(null);
                var templateType = this.templateType().id;
                var val = this.templateTypeValues[templateType];
                var treeToJME = Numbas.jme.display.treeToJME;
                var wrapValue = Numbas.jme.wrapValue;
                try {
                    switch(templateType) {
                    case 'anything':
                        var tokens = Numbas.jme.tokenise(val.definition());
                        if(tokens.length > 2) {
                            if(Numbas.jme.isName(tokens[0],this.name()) && Numbas.jme.isOp(tokens[1],'=')) {
                                throw("You don't need to include <code>"+this.name()+" =</code> at the start of your definition.");
                            }
                        }
                        return val.definition()+'';
                    case 'number':
                        var n = parseFloat(val.value());
                        if(isNaN(n)) {
                            throw("Value is not a number");
                        }
                        return treeToJME({tok: wrapValue(parseFloat(val.value()))});
                    case 'range':
                        var min = parseFloat(val.min());
                        var max = parseFloat(val.max());
                        var step = parseFloat(val.step());
                        if(isNaN(min)) {
                            throw('Minimum value is not a number');
                        } else if(isNaN(max)) {
                            throw('Maximum value is not a number');
                        } else if(isNaN(step)) {
                            throw("Step value is not a number");
                        }

                        var tree = Numbas.jme.compile('a..b#c');
                        tree.args[0].args[0] = {tok: wrapValue(parseFloat(val.min()))};
                        tree.args[0].args[1] = {tok: wrapValue(parseFloat(val.max()))};
                        tree.args[1] = {tok: wrapValue(parseFloat(val.step()))};
                        return treeToJME(tree);
                    case 'randrange':
                        var min = parseFloat(val.min());
                        var max = parseFloat(val.max());
                        var step = parseFloat(val.step());
                        if(isNaN(min)) {
                            throw('Minimum value is not a number');
                        } else if(isNaN(max)) {
                            throw('Maximum value is not a number');
                        } else if(isNaN(step)) {
                            throw("Step value is not a number");
                        }

                        var tree = Numbas.jme.compile('random(a..b#c)');
                        tree.args[0].args[0].args[0] = {tok: wrapValue(parseFloat(val.min()))};
                        tree.args[0].args[0].args[1] = {tok: wrapValue(parseFloat(val.max()))};
                        tree.args[0].args[1] = {tok: wrapValue(parseFloat(val.step()))};
                        return treeToJME(tree);
                    case 'string':
                    case 'long plain string':
                    case 'long string':
                        var tok = wrapValue(val.value());
                        tok.safe = val.isTemplate();
                        var s = treeToJME({tok: tok});
                        return s;
                    case 'list of numbers':
                        var values = val.values().filter(function(n){return n!=''});
                        if(!values.every(function(n){return Numbas.util.isNumber(n,true)})) {
                            throw("One of the values is not a number");
                        }
                        return treeToJME(Numbas.jme.compile('['+values.join(',')+']'));
                    case 'list of strings':
                        var strings = val.values().map(function(s){ 
                            var tok = wrapValue(s);
                            tok.safe = false;
                            return tok;
                        });
                        return treeToJME({tok: new Numbas.jme.types.TList(strings)});
                    case 'json':
                        JSON.parse(val.value() || '');
                        var json = treeToJME({tok: wrapValue(val.value())});
                        return 'json_decode('+json+')';
                    case 'mathematical expression':
                        var tok = wrapValue(val.value());
                        var tree = Numbas.jme.compile('expression(x)');
                        tree.args[0] = {tok: tok};
                        return treeToJME(tree);
                    }
                } catch(e) {
                    this.definitionError(e);
                    return '';
                }
            }
        },this);

        this.dependencies = ko.observableArray([]);
        this.isDependency = ko.pureComputed(function() {
            var currentVariable = q.currentVariable();
            if(!currentVariable)
                return false;
            return currentVariable.dependencies().contains(this.name().toLowerCase());
        },this);
        this.dependenciesObjects = ko.pureComputed(function() {
            var deps = this.dependencies();
            return this.dependencies().sort().map(function(name) {
                var obj = q.getVariable(name);
                if(obj) {
                    name = obj.names().find(function(n) { return n.name.toLowerCase()==name.toLowerCase() }).name;
                }
                var out = {
                    name: name,
                    obj: obj, 
                    notdefined: !obj, 
                    title: !obj ? 'Not defined. Click to add this variable.' : '',
                    setCurrent: function() {
                        if(obj) {
                            q.currentVariable(obj);
                        } else {
                            var nv = q.addVariable();
                            nv.name(name);
                            q.baseVariableGroup.variables.push(nv);
                        }
                    }
                };
                return out;
            });
        },this).extend({throttle: 1000});
        this.usedIn = ko.pureComputed(function() {
            return q.variables().filter(function(v2) {
                return v.names().some(function(n) {
                    return v2.dependencies().contains(n.name.toLowerCase());
                });
            }).sort(function(a,b) {
                a = a.name();
                b = b.name();
                return a<b ? -1 : a>b ? 1 : 0;
            });
        },this).extend({throttle: 1000});
        this.references = ko.observableArray([]);
        this.unique_references = ko.pureComputed(function() {
            var references = [];
            this.references().forEach(function(ref) {
                if(references.indexOf(ref)==-1) {
                    references.push(ref);
                }
            });
            return references;
        },this).extend({throttle: 1000});
        this.unused = ko.pureComputed(function() {
            return this.usedIn().length==0 && this.references().length==0;
        },this).extend({throttle: 1000});

        this.can_override = ko.observable(false);

        this.value = ko.observable(null);
        this.error = ko.observable('');
        this.anyError = ko.pureComputed(function() {
            if(this.error()) {
                return this.error();
            } else if(this.nameError()) {
                return this.nameError();
            } else if(this.question.variablesTest.conditionError()) {
                return "Error in testing condition";
            } else if(!(this.question.variablesTest.conditionSatisfied())) {
                return "Testing condition not satisfied";
            }
            return false;
        },this);
        this.warnings = ko.observableArray([]);

        this.type = ko.pureComputed(function() {
            var val = this.value();
            if(!val || this.error()) {
                return '';
            }
            return val.type;
        },this);

        this.thisLocked = ko.observable(false);
        var lockedSeen = {};
        var lockedDepth = 0;
        this.locked = ko.pureComputed(function() {
            if(lockedDepth==0) {
                lockedSeen = {};
            }
            lockedDepth += 1;
            lockedSeen[this.name()] = true;

            if(this.error()) {
                return false;
            }
            if(this.thisLocked()) {
                return true;
            }
            var lockedUsed = this.usedIn().some(function(v){
                if(lockedSeen[v.name()]) {
                    return false;
                }
                return v.locked();
            });
            lockedDepth -= 1;
            return lockedUsed;
        },this);

        this.toggleLocked = function(_,e) {
            v.thisLocked(!v.thisLocked());
            if(e) {
                e.preventDefault();
            }
        };

        this.display = ko.pureComputed(function() {
            var val;
            if(this.anyError()) {
                return this.anyError();
            } else if(val = this.value()) {
                return Editor.displayJMEValue(val);
            } else {
                return '';
            }
        },this);
        this.remove = function() {
            q.variables.remove(v);
            v.group().variables.remove(v);
            if(v==q.currentVariable()) {
                q.selectFirstVariable();
            }
        };
        this.makeCurrentVariable = function() {
            q.currentVariable(v);
        }
        if(data)
            this.load(data);
    }
    Variable.prototype = {
        templateTypes: [
            {id: 'anything', name: 'JME code'},
            {id: 'number', name: 'Number'},
            {id: 'range', name: 'Range of numbers'},
            {id: 'randrange', name: 'Random number from a range'},
            {id: 'string', name: 'Short text string'},
            {id: 'long plain string', name: 'Long plain text string'},
            {id: 'long string', name: 'Formatted text'},
            {id: 'mathematical expression', name: 'Abstract mathematical expression'},
            {id: 'list of numbers', name: 'List of numbers'},
            {id: 'list of strings', name: 'List of short text strings'},
            {id: 'json', name: 'JSON data'}
        ],

        load: function(data) {
            tryLoad(data,['name','description','can_override'],this);
            if('templateType' in data) {
                for(var i=0;i<this.templateTypes.length;i++) {
                    if(this.templateTypes[i].id==data.templateType) {
                        this.templateType(this.templateTypes[i]);
                        break;
                    }
                }
            }
            if('definition' in data) {
                this.definitionToTemplate(data.definition);
            }
            this.question.baseVariableGroup.variables.push(this);
        },

        toJSON: function() {
            var obj = {
                name: this.name(),
                group: this.group() ? this.group().name() : null,
                definition: this.definition(),
                description: this.description(),
                templateType: this.templateType().id,
                can_override: this.can_override()
            }
            return obj;
        },

        definitionToTemplate: function(definition) {
            var templateType = this.templateType().id;
            var templateTypeValues = this.templateTypeValues[templateType];

            try {
                var tree = Numbas.jme.compile(definition);
                var scope = Numbas.jme.builtinScope;
                switch(templateType) {
                case 'anything':
                    templateTypeValues.definition(definition);
                    break;
                case 'number':
                    templateTypeValues.value(Numbas.jme.evaluate(definition,Numbas.jme.builtinScope).value);
                    break;
                case 'range':
                    var rule = new Numbas.jme.display.Rule('?;a..?;b#?;c',[]);
                    var m = rule.match(tree,scope);
                    templateTypeValues.min(Numbas.jme.evaluate(m.a,Numbas.jme.builtinScope).value);
                    templateTypeValues.max(Numbas.jme.evaluate(m.b,Numbas.jme.builtinScope).value);
                    templateTypeValues.step(Numbas.jme.evaluate(m.c,Numbas.jme.builtinScope).value);
                    break;
                case 'randrange':
                    var rule = new Numbas.jme.display.Rule('random(?;a..?;b#?;c)',[]);
                    var m = rule.match(tree,scope);
                    templateTypeValues.min(Numbas.jme.evaluate(m.a,Numbas.jme.builtinScope).value);
                    templateTypeValues.max(Numbas.jme.evaluate(m.b,Numbas.jme.builtinScope).value);
                    templateTypeValues.step(Numbas.jme.evaluate(m.c,Numbas.jme.builtinScope).value);
                    break;
                case 'string':
                case 'long plain string':
                case 'long string':
                    while(Numbas.jme.isFunction(tree.tok,'safe')) {
                        templateTypeValues.isTemplate(true);
                        tree = tree.args[0];
                    }
                    templateTypeValues.value(tree.tok.value);
                    break;
                case 'list of numbers':
                    templateTypeValues.values(tree.args.map(function(t){return Numbas.jme.display.treeToJME(t);}));
                    break;
                case 'list of strings':
                    templateTypeValues.values(tree.args.map(function(t){
                        while(Numbas.jme.isFunction(t.tok,'safe')) {
                            t = t.args[0];
                        }
                        return t.tok.value;
                    }));
                    break;
                case 'json':
                    tree = tree.args[0];
                    while(Numbas.jme.isFunction(tree.tok,'safe')) {
                        tree = tree.args[0];
                    }
                    templateTypeValues.value(tree.tok.value);
                    break;
                case 'mathematical expression':
                    tree = tree.args[0];
                    while(Numbas.jme.isFunction(tree.tok,'safe')) {
                        tree = tree.args[0];
                    }
                    templateTypeValues.value(tree.tok.value);
                    break;
                }
            } catch(e) {
                console.log(e);
            }
        }
    }

    function VariableReference(def) {
        this.def = def;
        this.description = Knockout.computed(function() {
            var desc = ko.unwrap(this.def.description);
            if(this.def.kind=='part') {
                var names = [];
                var p = this.def.part;
                while(p) {
                    names.splice(0,0,'"'+p.name()+'"');
                    p = p.parent();
                }
                desc = names.join(' → ') + ' - ' + desc;
            }
            return desc;
        },this);
        var raw_vars = ko.pureComputed(function() {
            var def = this.def;
            var scope = def.scope();
            try {
                var v = ko.unwrap(def.value);
                switch(def.type) {
                    case 'html':
                        return vars_used_in_html(v, scope);
                    case 'string':
                        return vars_used_in_string(v, scope);
                    case 'jme-sub':
                        return vars_used_in_string(v, scope)
                    case 'jme':
                        try {
                            var tree = Numbas.jme.compile(v);
                        } catch(e) {
                            break;
                        }
                        if(tree) {
                            var vars = Numbas.jme.findvars(tree,[],scope);
                            if(def.defined_names) {
                                vars = vars.filter(function(name) { return def.defined_names.indexOf(name)==-1; });
                            }
                            return vars;
                        } else {
                            return [];
                        }
                    case 'list':
                        return v;
                    default:
                        throw(new Error("Undefined variable reference data type "+def.type));
                }
            } catch(e) {
                return [];
            }
        },this);
        this.vars = ko.pureComputed(function() {
            var scope = def.scope();
            var v = raw_vars();
            if(!v) {
                return [];
            }
            if(this.def.ignore) {
                var ignore = ko.unwrap(this.def.ignore);
                v = v.filter(function(n) { return ignore.indexOf(n)==-1 });
            }
            v = v.filter(function(name) {
                return !(scope.getVariable(name) || scope.getConstant(name));
            });
            return v;
        },this);
    }

    function Constant(q,data) {
        var c = this;
        this.name = ko.observable('');
        this.value = ko.observable('');
        this.tex = ko.observable('');

        this.duplicateNameError = ko.observable(null);
        var names = parse_names(this,q.variables,'constant');
        this.names = names.names;
        this.nameError = names.nameError;

        this.valueError = ko.pureComputed(function() {
            try {
                q.baseScopeWithoutConstants().evaluate(this.value());
            } catch(e) {
                return e;
            }
        },this);

        this.error = ko.pureComputed(function() {
            return this.nameError() || this.valueError();
        },this);

        this.remove = function() {
            q.constants.remove(c);
        };

        if(data) {
            this.load(data);
        }
    }
    Constant.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                value: this.value(),
                tex: this.tex()
            }
        },

        load: function(data) {
            tryLoad(data,['name','value','tex'],this);
        }
    };

    function CustomFunction(q,data) {
        this.name = ko.observable('');
        this.nameError = ko.computed(function() {
        }, this);
        this.outputTypes = jmeTypes;
        this.parameterTypes = jmeParameterTypes;
        this.parameters = ko.observableArray([])
        this.type = ko.observable('anything');
        this.definition = ko.observable('');
        this.language = Editor.optionObservable([
            {name: 'jme', niceName: 'JME'},
            {name: 'javascript', niceName: 'JavaScript'}
        ]);
        this.error = ko.observable('');
        this.displayName = ko.pureComputed(function() {
            return this.name().trim() || 'Unnamed function';
        },this);

        this.remove = function() {
            if(confirm("Remove this function?"))
                q.functions.remove(this);
        };
        if(data)
            this.load(data);
    }
    CustomFunction.prototype = {
        load: function(data) {
            var f = this;
            tryLoad(data,['name','type','definition','language'],this);
            if('parameters' in data) {
                data.parameters.map(function(p) {
                    f.parameters.push(new FunctionParameter(f,p[0],p[1]));
                });
            }
        },

        toJSON: function() {
            var parameters = this.parameters().map(function(p) {
                return [p.name(), p.signature()];
            });
            return {
                parameters: parameters,
                type: this.type(),
                language: this.language().name,
                definition: this.definition()
            };
        },

        addParameter: function() {
            this.parameters.push(new FunctionParameter(this,'','number','anything'));
        }
    };

    function FunctionParameter(f,name,type) {
        this.name = ko.observable(name);
        this.type = ko.observable('custom');
        this.of_type = ko.observable('anything');
        this.custom_type = ko.observable(type);
        this.set_signature(type);

        this.show_of = ko.computed(function() {
            return ['list','dict'].contains(this.type());
        },this);
        this.show_custom_type = ko.computed(function() {
            return this.type()=='custom';
        },this);

        this.signature = ko.computed(function() {
            var type = this.type();
            var of_type = this.of_type();
            switch(type) {
                case 'list':
                    if(of_type!='anything') {
                        return 'list of '+of_type;
                    }
                    break;
                case 'dict':
                    if(of_type!='anything') {
                        return 'dict of '+of_type;
                    }
                    break;
                case 'anything':
                    return '?';
                case 'custom':
                    return this.custom_type();
            }
            return this.type();
        },this);

        this.remove = function() {
            f.parameters.remove(this);
        }
    };
    FunctionParameter.prototype = {
        set_signature: function(type) {
            this.type('custom');
            this.of_type('anything');
            this.custom_type(type);
            var sig = Numbas.jme.parse_signature(type);
            switch(sig.kind) {
                case 'type':
                    this.type(sig.type);
                    break;
                case 'list':
                    if(sig.signatures.length==1 && sig.signatures[0].kind=='multiple' && sig.signatures[0].signature.kind=='type') {
                        this.type('list');
                        this.of_type(sig.signatures[0].signature.type);
                    }
                    break;
                case 'dict':
                    this.type('dict');
                    if(sig.signature.kind=='type') {
                        this.of_type(sig.signature.type);
                    }
                    break;
                case 'anything':
                    this.type('anything');
                    break;
            }
        }
    }

    function Script(name,displayName,defaultOrder,helpURL) {
        this.name = name;
        this.orderOptions = [
            {niceName: 'instead of', value: 'instead'},
            {niceName: 'after', value: 'after'},
            {niceName: 'before', value: 'before'}
        ];
        this.orderItem = ko.observable(this.orderOptions[0]);
        this.order = ko.computed({
            read: function() {
                return this.orderItem().value;
            },
            write: function(value) {
                for(var i=0;i<this.orderOptions.length;i++) {
                    if(this.orderOptions[i].value==value) {
                        return this.orderItem(this.orderOptions[i]);
                    }
                }
            }
        },this);
        this.order(defaultOrder);

        this.displayName = displayName;
        this.script = ko.observable('');
        this.helpURL = helpURL;

        this.active = ko.pureComputed(function() {
            return this.script().trim().length>0;
        },this);
    }

    function ScoreBin(q,data) {
        this.q = q;
        this.name = ko.observable('');
        this.limit = ko.observable(0);

        if(data) {
            this.load(data);
        }
    }
    ScoreBin.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                limit: this.limit()
            };
        },

        load: function(data) {
            tryLoad(data,['name','limit'],this);
        }
    };

    var Part = Editor.question.Part = function(levelName,q,parent,parentList,data) {
        var p = this;
        this.levelName = ko.observable(levelName);
        this.q = q;
        this.prompt = Editor.contentObservable('');
        this.alternativeFeedbackMessage = Editor.contentObservable('');
        this.useAlternativeFeedback = ko.observable(false);
        this.parent = ko.observable(parent);
        this.parentList = parentList;
        this.customName = ko.observable('');
        this.useCustomName = ko.pureComputed(function() {
            return this.customName().trim()!='';
        },this);

        this.goTo = function() {
            q.currentPart(p);
            q.mainTabber.setTab('parts')();
        }

        this.scope = ko.pureComputed(function() {
            return this.q.baseScope();
        },this);

        this.showChildren = ko.pureComputed(function() {
            var currentPart = q.currentPart();
            if(!currentPart) {
                var a = q.addingPart();
                if(a) {
                    currentPart = a.parent;
                }
            }
            while(currentPart) {
                if(currentPart==this) {
                    return true;
                }
                currentPart = currentPart.parent();
            }
            return false;
        },this);
        this.steps = ko.observableArray([]);
        this.stepsPenalty = ko.observable(0);

        this.gaps = ko.observableArray([]);

        this.alternatives = ko.observableArray([]);

        this.addAlternative = function() {
            if(this.isAlternative()) {
                return this.parent().addAlternative();
            }
            var alt = new Part('alternative',q,p,p.alternatives,this.toJSON());
            alt.setType(p.type().name);
            alt.marks(0);
            alt.customName('');
            p.alternatives.push(alt);
            q.currentPart(alt);
        }

        this.childrenDescription = ko.pureComputed(function() {
            var out = [];
            if(this.alternatives().length>0) {
                var numAlternatives = this.alternatives().length;
                out.push(numAlternatives+' alternative'+(numAlternatives==1 ? '' : 's'));
            }
            if(this.type().name=='gapfill') {
                var numGaps = this.gaps().length;
                out.push(numGaps+' gap'+(numGaps==1 ? '' : 's'));
            }
            if(this.steps().length>0) {
                var numSteps = this.steps().length;
                out.push(numSteps+' step'+(numSteps==1 ? '' : 's'));
            }
            return out.join(', ');
        },this);

        this.types = Editor.part_types.models.map(function(data){return new PartType(p,data);});

        this.isRootPart = ko.pureComputed(function() {
            return !this.parent();
        },this);

        this.isGap = ko.pureComputed(function(){ return this.levelName()=='gap'; },this);
        this.unusedGap = ko.pureComputed(function() {
            if(!this.isGap()) {
                return;
            }
            var p = this.parent();
            var n = this.parentList.indexOf(this);
            return p.prompt().indexOf('[['+n+']]')==-1;
        },this);
        this.isStep = ko.pureComputed(function(){ return this.levelName()=='step'; },this);
        this.isAlternative = ko.pureComputed(function(){ return this.levelName()=='alternative'; },this);

        this.availableTypes = ko.pureComputed(function() {
            if(this.isGap()) {
                return this.types.filter(function(t){return t.can_be_gap!==false});
            } else if(this.isStep()) {
                return this.types.filter(function(t){return t.can_be_step!==false});
            } else {
                return this.types;
            }
        },this);
        this.type = ko.observable(this.availableTypes()[0]);

        this.canBeReplacedWithGap = ko.pureComputed(function() {
            return !(this.type().name=='gapfill' || this.isGap() || this.isStep() || this.isAlternative() || this.type().can_be_gap===false);
        },this);

        this.isFirstPart = ko.pureComputed(function() {
            return this==q.parts()[0];
        },this);

        this.indexLabel = ko.pureComputed(function() {
            var index = this.parentList.indexOf(this);
            var i = 0;
            for(var j=0;j<index;j++) {
                var op = ko.unwrap(this.parentList)[j];
                if(!(op.type().name=='information' || op.useCustomName() && op.customName()=='')) {
                    i += 1;
                }
            }
            if(ko.unwrap(this.parentList).length<=1) {
                return '';
            } else if(this.type().name=='information') {
                return '';
            } else if(this.isGap() || this.isStep() || this.isAlternative()) {
                i = i+'';
            } else {
                i = Numbas.util.letterOrdinal(i);
            }
            return i+'';
        },this);
        this.standardName = ko.pureComputed(function() {
            if((this.q.partsMode().value=='explore' && this.levelName()=='part') || !this.indexLabel()) {
                return 'Unnamed '+this.levelName();
            } else if(this.indexLabel()) {
                var name = Numbas.util.capitalise(this.levelName() + " " + this.indexLabel());
                if(this.isGap() || this.isStep() || this.isAlternative()) {
                    name += '.';
                } else {
                    name += ')';
                }
                return name;
            }
        },this);
        this.name = ko.pureComputed(function() {
            if(this.useCustomName()) {
                return this.customName() || "unnamed "+this.levelName()+" "+this.indexLabel();
            } else {
                return this.standardName();
            }
        },this);
        this.header = ko.pureComputed(function() {
            var label = this.indexLabel();
            if(this.useCustomName()) {
                return this.customName();
            } else if(label==='') {
                return '';
            } else {
                return this.standardName();
            }
        },this);

        this.path = ko.pureComputed(function() {
            var i = Math.max(this.parentList.indexOf(this),0);
            if(this.isGap()) {
                return this.parent().path()+'g'+i;
            } else if(this.isStep()) {
                return this.parent().path()+'s'+i;
            } else if(this.isAlternative()) {
                return this.parent().path()+'a'+i;
            } else {
                return 'p'+i;
            }
        },this);

        this.marks = ko.observable(1);
        this.realMarks = ko.pureComputed(function() {
            switch(this.type().name) {
            case 'information':
            case 'gapfill':
            case 'm_n_x':
            case 'm_n_2':
            case '1_n_2':
                return 0;
            default:
                return this.marks();
            }
        },this);

        this.exploreObjective = ko.observable(null);

        this.addObjective = function() {
            var o = new ScoreBin(q);
            var name;
            if(!p.useCustomName() && p.parent()) {
                name = p.parent().name();
            } else {
                name = p.name();
            }
            o.name(name);
            o.limit(p.realMarks());
            q.objectives.push(o);
            p.exploreObjective(o);
        }

        this.canAddGap = ko.pureComputed(function() {
            return this.type().name=='gapfill';
        },this);

        this.canAddStep = ko.pureComputed(function() {
            return this.q.partsMode().value=='all' && this.isRootPart() && this.type().has_marks;
        },this);

        this.canAddAlternative = ko.pureComputed(function() {
            return this.type().has_marks && !this.isAlternative();
        },this);

        this.showAddAlternative = ko.pureComputed(function() {
            return this.canAddAlternative() && (this==q.currentPart() || (q.currentPart() && this==q.currentPart().parent()));
        },this);

        this.startAddingGap = function() {
            q.addingPart({kind:'gap',parent:p, parentList: p.gaps, availableTypes: q.gapTypes});
        }
        this.addingGapHere = ko.pureComputed(function() {
            var a = q.addingPart();
            if(!a) {
                return false;
            }
            return a.kind == 'gap' && a.parent == p;
        },this);
        this.showAddGap = ko.pureComputed(function() {
            return this.canAddGap() && (this==q.currentPart() || (q.currentPart() && q.currentPart().isGap() && this==q.currentPart().parent()));
        },this);

        this.startAddingStep = function() {
            q.addingPart({kind:'step',parent:p, parentList: p.steps, availableTypes: q.stepTypes});
        }
        this.addingStepHere = ko.pureComputed(function() {
            var a = q.addingPart();
            if(!a) {
                return false;
            }
            return a.kind == 'step' && a.parent == p;
        },this);
        this.showAddStep = ko.pureComputed(function() {
            return this.canAddStep() && (this==q.currentPart() || (q.currentPart() && this==q.currentPart().parent()));
        },this);

        this.showCorrectAnswer = ko.observable(true);
        this.showFeedbackIcon = ko.observable(true);

        this.variableReplacements = ko.observableArray([]);
        this.addVariableReplacement = function() {
            p.variableReplacements.push(new VariableReplacement(p));
        }
        this.deleteVariableReplacement = function(vr) {
            p.variableReplacements.remove(vr);
        }
        this.canMakeVariableReplacement = ko.pureComputed(function() {
            return q.variables().length>0 && q.allParts().length>1;
        },this);
        this.adaptiveMarkingPenalty = ko.observable(0);

        this.variableReplacementStrategies = [
            {name: 'originalfirst', niceName: 'Try without replacements first'},
            {name: 'alwaysreplace', niceName: 'Always replace variables'}
        ];
        this.variableReplacementStrategy = ko.observable(this.variableReplacementStrategies[0])

        this.replacementRandomDependencies = ko.pureComputed(function() {
            var names = this.variableReplacements().map(function(vr) {return vr.variable()});
            var randomDependencies = this.q.randomDependencies(names);
            return randomDependencies;
        },this);

        this.nextParts = ko.observableArray([]);
        this.addNextPart = function(otherPart) {
            var np = new NextPart(p);
            np.otherPart(otherPart);
            p.nextParts.push(np);
        };
        this.deleteNextPart = function(np) {
            p.nextParts.remove(np);
        }
        this.availableNextParts = ko.pureComputed(function() {
            return p.parentList();
        },this);
        this.suggestGoingBack = ko.observable(false);
        this.nextPartReferences = ko.pureComputed(function() {
            return this.q.allParts().filter(function(p2) {
                return p2.nextParts().some(function(np) {
                    return np.otherPart()==p;
                });
            });
        },this);
        this.reachable = ko.observable(true);

        this.scripts = [
            new Script('constructor','When the part is created','after','question/reference.html#term-when-the-part-is-created'),
            new Script('mark','Mark student\'s answer','instead','question/reference.html#term-mark-student-s-answer'),
            new Script('validate','Validate student\'s answer','instead','question/reference.html#term-validate-student-s-answer')
        ];

        var _use_custom_algorithm = ko.observable(false);
        this.use_custom_algorithm = ko.computed({
            read: function() {
                return this.type().name=='extension' || _use_custom_algorithm();
            },
            write: _use_custom_algorithm
        },this);
        this.customMarkingAlgorithm = ko.observable('');
        this.extendBaseMarkingAlgorithm = ko.observable(true);
        this.baseMarkingAlgorithm = ko.pureComputed(function() {
            var type = this.type();
            if(type.is_custom_part_type) {
                return Numbas.custom_part_types[type.name].marking_script;
            } else {
                var script = Numbas.partConstructors[type.name].prototype.baseMarkingScript();
                return script ? script.source : '';
            }
        },this);

        this.markingScriptError = ko.observable('');
        this.markingScript = ko.computed(function() {
            var base = new Numbas.marking.MarkingScript(this.baseMarkingAlgorithm(),undefined,this.scope());
            if(!this.use_custom_algorithm()) {
                return base;
            } else {
                try {
                    var script = new Numbas.marking.MarkingScript(this.customMarkingAlgorithm(), this.extendBaseMarkingAlgorithm() ? base : undefined, this.scope());
                    this.markingScriptError('');
                    return script;
                } catch(e) {
                    this.markingScriptError(e.message);
                }
            }
        },this).extend({throttle: 1000});

        this.unit_tests = ko.observableArray([]);

        var correct_answer_test = this.correct_answer_test = new MarkingTest(this,this.q.questionScope(), false);
        var correct_mark_note = correct_answer_test.getNote('mark');
        correct_mark_note.show(true);
        correct_mark_note.expected.credit(1);
        correct_mark_note.compare.messages = false;
        correct_answer_test.answer = correct_answer_test.correctAnswer;
        correct_answer_test.name('Expected answer is marked correct');

        this.builtin_unit_tests = ko.pureComputed(function() {
            if(!this.type().has_marks) {
                return [];
            }
            return [this.correct_answer_test];
        },this);

        this.all_unit_tests = ko.pureComputed(function() {
            return this.builtin_unit_tests().concat(this.unit_tests());
        },this);

        this.marking_test = ko.observable(new MarkingTest(this,this.q.questionScope()));
        ko.computed(function() {
            var mt = this.marking_test();
            mt.make_question();
        },this).extend({throttle:1000});
        this.submit_test = function() {
            p.marking_test().run();
        }

        this.run_all_tests = async function(force) {
            for(let mt of p.all_unit_tests()) {
                await mt.run(force);
            }
        }

        this.addUnitTest = function(test) {
            test.editing(false);
            test.last_variables = null;
            p.unit_tests.push(test);
            p.marking_test(new MarkingTest(p,p.q.questionScope()));
        }

        this.types.map(function(t){p[t.name] = t.model});

        this.variable_references = ko.pureComputed(function() {
            var o = [];
            o.push(new VariableReference({kind:'part',part:this,tab:'prompt',value:this.prompt,type:'html',description:'prompt', scope:this.scope}));
            if(this.use_custom_algorithm() && this.markingScript() && this.marking_test() && this.marking_test().last_run() && !this.marking_test().last_run().error) {
                var s = this.markingScript();
                var note_names = Object.keys(s.notes).map(function(name) { return Numbas.jme.normaliseName(name); });
                var parameters = this.marking_test().marking_parameters().map(function(p) { return Numbas.jme.normaliseName(p.name); });
                var defined_names = note_names.concat(parameters);
                for(var x in s.notes) {
                    var vars = s.notes[x].vars.filter(function(y) { return !defined_names.contains(Numbas.jme.normaliseName(y)); });
                    o.push(new VariableReference({kind:'part',part:this,tab:'marking-algorithm',value:vars,type:'list',description:'marking algorithm note '+x, scope:this.scope}));
                }
            }
            this.nextParts().forEach(function(np) {
                o = o.concat(np.variable_references());
            });
            this.type().variable_references().forEach(function(def) {
                def.kind = 'part';
                def.part = p;
                def.scope = p.scope;
                o.push(new VariableReference(def));
            });
            return o;
        },this);

        var tabs = ko.pureComputed(function() {
            var tabs = [];
            if(!this.isGap() && !this.isAlternative()) {
                tabs.push(new Editor.Tab('prompt','Prompt','blackboard',{visible:true,more_important:true,in_use: ko.pureComputed(function() { return this.prompt()!=''},this)}));
            }
            if(this.isAlternative()) {
                tabs.push(new Editor.Tab('alternative-feedback-message','Feedback message','blackboard',{visible:true,more_important:true,in_use: ko.pureComputed(function() { return this.alternativeFeedbackMessage()!=''},this)}));
            }

            if(this.type().has_marking_settings) {
                tabs.push(new Editor.Tab('marking-settings','Marking settings','pencil',{visible:true,more_important:true,in_use:true}));
            }
            var marking_algorithm_tab_in_use = ko.pureComputed(function() {
                return this.use_custom_algorithm();
            },this);
            var testing_tab_in_use = ko.pureComputed(function() {
                return this.unit_tests().length > 0;
            },this);
            if(this.type().has_marks) {
                tabs.push(new Editor.Tab('marking-algorithm','Marking algorithm','ok',{in_use: marking_algorithm_tab_in_use}));
                tabs.push(new Editor.Tab('testing','Testing','check',{in_use: testing_tab_in_use}));
            }

            tabs = tabs.concat(this.type().tabs);

            var scripts_tab_in_use = ko.pureComputed(function() {
                return this.scripts.some(function(s) { return s.active(); });
            },this);

            tabs.push(new Editor.Tab('scripts','Scripts','wrench',{in_use: scripts_tab_in_use}));

            if(!this.isAlternative() && q.partsMode().value=='all') {
                var adaptive_marking_tab_in_use = ko.pureComputed(function() {
                    return this.variableReplacements().length>0;
                },this);

                tabs.push(new Editor.Tab('adaptivemarking','Adaptive marking','transfer',{in_use: adaptive_marking_tab_in_use}));
            }

            if(!this.parent() && q.partsMode().value=='explore') {
                var next_parts_tab_in_use = ko.pureComputed(function() {
                    return this.nextParts().length>0;
                },this);
                tabs.push(new Editor.Tab('nextparts','Next parts','arrow-right',{in_use: next_parts_tab_in_use}));
            }

            tabs = tabs.sort(function(a,b) {
                var ia = ko.unwrap(a.more_important);
                var ib = ko.unwrap(b.more_important);
                return ia ? ib ? 0 : -1 : ib ? 1 : 0;
            });

            return tabs;
        },this);
        this.tabber = new Editor.Tabber(tabs);

        if(data)
            this.load(data);
    }
    Part.prototype = {

        copy: function() {
            var data = this.toJSON();
            var p = new Part(this.levelName(),this.q,this.parent(),this.parentList,data);
            this.parentList.push(p);
            this.q.currentPart(p);
        },

        replaceWithGapfill: function() {
            var p = this;
            var gapFill = new Part('part',this.q,this.parent(),this.parentList);
            gapFill.customName(this.customName());
            this.customName('');
            gapFill.setType('gapfill');

            this.parentList.splice(this.parentList.indexOf(this),1,gapFill);
            
            gapFill.prompt(this.prompt()+'\n<p>[[0]]</p>');
            this.prompt('');

            gapFill.steps(this.steps());
            gapFill.steps().map(function(step){ 
                step.parent(gapFill);
                step.parentList = gapFill.steps;
            });
            this.steps([]);

            gapFill.gaps.push(this);
            this.parentList = gapFill.gaps;
            this.parent(gapFill);

            gapFill.nextParts(this.nextParts());
            this.nextParts([]);

            this.levelName('gap');

            viewModel.allParts().forEach(function(p2) {
                p2.nextParts().forEach(function(np) {
                    if(np.otherPart()==p) {
                        np.otherPart(gapFill);
                    }
                });
            });
        },

        canMove: function(direction) {
            var parentList = ko.utils.unwrapObservable(this.parentList);
            switch(direction) {
                case 'up':
                    return parentList.indexOf(this)>0;
                case 'down':
                    return parentList.indexOf(this)<parentList.length-1;
            }
        },

        remove: function() {
            var p = this;
            if(confirm("Remove "+this.name()+"?"))
            {
                this.parentList.remove(this);
                if(this.q.currentPart()==this) {
                    this.q.currentPart(this.parent() || null);
                }
                viewModel.allParts().forEach(function(p2) {
                    p2.nextParts().forEach(function(np) {
                        if(np.otherPart()==p) {
                            p2.nextParts.remove(np);
                        }
                    });
                });
            }
        },

        moveUp: function() {
            var i = this.parentList.indexOf(this);
            if(i>0) {
                this.parentList.remove(this);
                ko.tasks.runEarly();
                this.parentList.splice(i-1,0,this);
            }
        },

        moveDown: function() {
            var i = this.parentList.indexOf(this);
            this.parentList.remove(this);
            ko.tasks.runEarly();
            this.parentList.splice(i+1,0,this);
        },

        setType: function(name) {
            name = name.toLowerCase();
            for(var i=0;i<this.types.length;i++)
            {
                if(this.types[i].name == name) {
                    this.type(this.types[i]);
                    return;
                }
            }
        },

        toJSON: function() {
            var o = {
                type: this.type().name,
                useCustomName: this.useCustomName(),
                customName: this.useCustomName() ? this.customName() : '',
                marks: this.realMarks(),
                scripts: {},
                customMarkingAlgorithm: this.use_custom_algorithm() ? this.customMarkingAlgorithm() : '',
                extendBaseMarkingAlgorithm: this.use_custom_algorithm() ? this.extendBaseMarkingAlgorithm() : true,
                unitTests: this.unit_tests().map(function(t){ return t.toJSON() }),
            };

            if(!this.isAlternative()) {
                Object.assign(o,{
                    showCorrectAnswer: this.showCorrectAnswer(),
                    showFeedbackIcon: this.showFeedbackIcon(),
                    variableReplacements: this.variableReplacements().map(function(vr){return vr.toJSON()}),
                    variableReplacementStrategy: this.variableReplacementStrategy().name,
                    nextParts: this.nextParts().map(function(np){ return np.toJSON(); }),
                    suggestGoingBack: !this.isFirstPart() && this.suggestGoingBack(),
                    adaptiveMarkingPenalty: this.adaptiveMarkingPenalty(),
                    exploreObjective: this.exploreObjective() ? this.exploreObjective().name() : null,
                });
                if(this.prompt()) {
                    o.prompt = this.prompt();
                }
                if(this.steps().length) {
                    o.stepsPenalty = this.stepsPenalty(),
                    o.steps = this.steps().map(function(s){return s.toJSON();});
                }

                if(this.alternatives().length) {
                    o.alternatives = this.alternatives().map(function(a){return a.toJSON();});
                }

            } else {
                o.alternativeFeedbackMessage = this.alternativeFeedbackMessage();
                o.useAlternativeFeedback = this.useAlternativeFeedback();
            }

            this.scripts.map(function(s) {
                if(s.active()) {
                    o.scripts[s.name] = {
                        script: s.script(),
                        order: s.order()
                    };
                }
            });

            try{
                this.type().toJSON(o);
            }catch(e) {
                console.log(e);
                console.log(e.stack);
                throw(e);
            }
            return o;
        },

        load: function(data) {
            var p = this;
            for(var i=0;i<this.types.length;i++) {
                if(this.types[i].name == data.type.toLowerCase())
                    this.type(this.types[i]);
            }
            tryLoad(data,[
                'marks',
                'customName',
                'customMarkingAlgorithm',
                'extendBaseMarkingAlgorithm',
            ],this);
            this.use_custom_algorithm(this.customMarkingAlgorithm()!='');

            if(!this.isAlternative()) {
                tryLoad(data,[
                    'prompt',
                    'stepsPenalty',
                    'showCorrectAnswer',
                    'showFeedbackIcon',
                    'adaptiveMarkingPenalty',
                    'suggestGoingBack'
                ],this);
                this.exploreObjective(this.q.objectives().find(function(o) { return o.name()==data.exploreObjective; }));
                if(data.steps) {
                    var parentPart = this.isGap() ? this.parent() : this;
                    data.steps.map(function(s) {
                        this.steps.push(new Part('step',this.q,this,this.steps,s));
                    },parentPart);
                }

                if(data.alternatives) {
                    data.alternatives.map(function(a) {
                        p.alternatives.push(new Part('alternative',p.q,p,p.alternatives,a));
                    });
                }

                p.variableReplacementStrategies.map(function(s) {
                    if(s.name==data.variableReplacementStrategy) {
                        p.variableReplacementStrategy(s);
                    }
                });

                if(data.variableReplacements) {
                    data.variableReplacements.map(function(d) {
                        var vr = new VariableReplacement(p,d);
                        p.variableReplacements.push(vr);
                    });
                }
                
                if(data.nextParts) {
                    data.nextParts.map(function(d) {
                        var np = new NextPart(p,d);
                        p.nextParts.push(np);
                    });
                }

            } else {
                tryLoad(data,['alternativeFeedbackMessage','useAlternativeFeedback'],this);
            }

            if(data.scripts) {
                for(var name in data.scripts) {
                    for(var i=0;i<this.scripts.length;i++) {
                        if(this.scripts[i].name==name) {
                            tryLoad(data.scripts[name],['script','order'],this.scripts[i]);
                            break;
                        }
                    }
                }
            }

            if(data.unitTests) {
                data.unitTests.forEach(function(dt) {
                    var scope = p.q.baseScope();
                    var test = new MarkingTest(p,scope);
                    test.editing(false);
                    test.open(false);
                    test.variables(dt.variables.map(function(v) {
                        try {
                            var value = scope.evaluate(v.value);
                        } catch(e) {
                            value = null;
                        }
                        return {
                            name: v.name,
                            valueString: v.value,
                            value: value
                        }
                    }));
                    test.variablesReady(true);
                    test.name(dt.name);
                    test.answer(dt.answer);
                    test.notes().forEach(function(n) {
                        n.show(false);
                    });
                    dt.notes.forEach(function(dn) {
                        var note = test.getNote(dn.name);
                        if(!note) {
                            note = new MarkingNote(dn.name, true);
                            test.notes.push(note);
                        }
                        note.show(true);
                        note.expected.value(dn.expected.value);
                        note.expected.messages(dn.expected.messages);
                        note.expected.warnings(dn.expected.warnings);
                        note.expected.error(dn.expected.error);
                        note.expected.valid(dn.expected.valid);
                        note.expected.credit(dn.expected.credit);
                    });
                    p.unit_tests.push(test);
                });
            }

            this.type().load(data);
        }
    };

    function VariableReplacement(part,data) {
        this.part = part;
        this.variable = ko.observable('');
        this.variableDisplay = ko.pureComputed(function(){
            return this.part.q.variables().map(function(v){
                return v.name();
            });
        },this);
        this.replacement = ko.observable(null);
        this.must_go_first = ko.observable(false);
        this.availableParts = ko.pureComputed(function() {
            var p = this.part
            return p.q.allParts().filter(function(p2){
                return p!=p2 && p2.type().has_marks && p2.parent()!=p && !p2.isAlternative();
            });
        },this);
        this.variableWarning = ko.computed(function() {
            var name = this.variable();
            if(!name) {
                return;
            }
            var variable = this.part.q.getVariable(name);
            if(!variable) {
                return;
            }
            var v = variable.value();
            if(!v) {
                return;
            }
            var rep_path = this.replacement();
            if(!rep_path) {
                return;
            }
            var rep = this.part.q.getPart(rep_path);
            if(!rep) {
                return;
            }
            if(rep.type().name=='gapfill' && !Numbas.jme.isTypeCompatible(v.type,'list')) {
                return 'This replacement refers to a gap-fill part, but the replaced variable is not a list. Did you mean to use one of the gaps?';
            }
        },this);
        if(data) {
            this.load(data);
        }
    }
    VariableReplacement.prototype = {
        toJSON: function() {
            return {
                variable: this.variable(),
                part: this.replacement(),
                must_go_first: this.must_go_first()
            }
        },
        load: function(data) {
            tryLoad(data,['variable','must_go_first'],this);
            var path = data.part;
            this.replacement(data.part);
        }
    }

    function NextPart(part,data) {
        var np = this;
        this.part = part;
        this.otherPart = ko.observable();
        this.rawLabel = ko.observable('');
        this.label = ko.computed({
            read: function() {
                return this.rawLabel() || (this.otherPart() ? this.otherPart().header() : '');
            },
            write: function(label) {
                return this.rawLabel(label);
            }
        },this);
        this.variableReplacements = ko.observableArray([]);
        this.addVariableReplacement = function() {
            var vr = new NextPartVariableReplacement(np);
            np.variableReplacements.push(vr);
        }
        this.removeVariableReplacement = function(vr) {
            np.variableReplacements.remove(vr);
        }
        this.availabilityExpression = ko.observable('');
        this.availability_conditions = ko.pureComputed(function() {
            var conditions = [
                {name: 'Always', id: 'always', value: ''},
                {name: 'When answer submitted', id: 'when-submitted', value: 'answered'},
                {name: 'When unanswered or incorrect', id: 'when-unanswered-or-incorrect', value: 'not (answered and credit=1)'},
                {name: 'When incorrect', id: 'when-incorrect', value: 'answered and credit<1'},
                {name: 'When correct', id: 'when-correct', value: 'answered and credit=1'},
                {name: 'Depending on expression', id: 'expression', value: np.availabilityExpression}
            ];
            conditions = conditions.concat(np.part.alternatives().map(function(a,i) {
                return {name: "When alternative \""+a.name()+"\" used", id: 'used-alternative-'+i, value: 'answered and used_alternative='+i};
            }));
            return conditions;
        });
        this.availabilityCondition = ko.observable(this.availability_conditions()[0]);
        this.penalty = ko.observable(null);
        this.penaltyAmount = ko.observable(0);
        this.showPenaltyHint = ko.observable(true);
        this.lockAfterLeaving = ko.observable(false);

        this.variable_references = ko.pureComputed(function() {
            var s = part.markingScript();
            var note_names = [];
            if(s) {
                note_names = Object.keys(s.notes).map(function(name) { return Numbas.jme.normaliseName(name); });
            }
            var o = [];
            if(this.availabilityCondition().id=='expression') {
                o.push(new VariableReference({kind:'part',part:this.part,tab:'nextparts',value:this.availabilityExpression,type:'jme',description:'next part availability condition', defined_names: note_names.concat(['credit','answered', 'used_alternative']), scope:this.part.scope}));
            }
            this.variableReplacements().forEach(function(vr) {
                o.push(new VariableReference({kind:'part',part:part,tab:'nextparts',value:vr.definition,type:'jme',description:'variable replacement', defined_names: note_names.concat(['credit', 'used_alternative']), scope:this.part.scope}));
                o.push(new VariableReference({kind:'part',part:part,tab:'nextparts',value:vr.variable,type:'jme',description:'variable replacement', defined_names: note_names.concat(['credit', 'used_alternative']), scope:this.part.scope}));
            });
            return o;
        },this);

        if(data) {
            this.load(data);
        }
    }
    NextPart.prototype = {
        toJSON: function() {
            return {
                label: this.label(),
                rawLabel: this.rawLabel(),
                otherPart: this.otherPart() ? this.part.parentList().indexOf(this.otherPart()) : '',
                variableReplacements: this.variableReplacements().map(function(vr) { return vr.toJSON(); }),
                availabilityCondition: ko.unwrap(this.availabilityCondition().value),
                penalty: this.penalty() ? this.penalty().name() : '',
                penaltyAmount: this.penaltyAmount(),
                showPenaltyHint: this.showPenaltyHint(),
                lockAfterLeaving: this.lockAfterLeaving()
            };
        },
        load: function(data) {
            var np = this;
            if(!data) {
                return;
            }
            tryLoad(data,['rawLabel','penaltyAmount','showPenaltyHint','lockAfterLeaving'],this);
            tryLoad(data,'availabilityCondition',this,'availabilityExpression');
            this.availability_conditions().find(function(condition) {
                if(ko.unwrap(condition.value)==np.availabilityExpression()) {
                    np.availabilityCondition(condition);
                    return true;
                }
            });
            this.otherPartIndex = data.otherPart;
            this.penalty(this.part.q.penalties().find(function(p) { return p.name()==data.penalty; }));
            if(data.variableReplacements) {
                this.variableReplacements(data.variableReplacements.map(function(vrd) {
                    return new NextPartVariableReplacement(np,vrd);
                }));
            }
        }
    }

    function NextPartVariableReplacement(np,data) {
        this.np = np;
        this.variables = ko.pureComputed(function(){
            return this.np.part.q.variables().map(function(v){
                return v.name();
            }).sort();
        },this);

        this.variable = ko.observable('');

        this.custom_definition = ko.observable('interpreted_answer');
        this.value_options = ko.pureComputed(function() {
            var options = [
                {definition: 'interpreted_answer', name: "Student's answer to this part"}
            ];
            options = options.concat(np.part.gaps().map(function(g,i) {
                return {definition: 'interpreted_answer['+i+']', name: "Student's answer to \""+g.name()+"\""};
            }));
            options = options.concat([
                {definition: 'credit', name: 'Credit awarded'},
                {definition: this.custom_definition, name: 'JME expression', custom: true}
            ])
            return options;
        },this);
        this.value_option = ko.observable(this.value_options()[0]);
        this.definition = ko.pureComputed(function() {
            return ko.unwrap(this.value_option().definition);
        },this);

        if(data) {
            this.load(data);
        }
    }
    NextPartVariableReplacement.prototype = {
        toJSON: function() {
            return {
                variable: this.variable(),
                definition: this.definition()
            }
        },
        load: function(data) {
            if(!data) {
                return;
            }
            this.variable(data.variable || '');
            this.custom_definition(data.definition || '');
        }
    };

    Numbas.marking.ignore_note_errors = true;

    function MarkingTest(part, scope, editable) {
        var mt = this;
        this.part = part;
        this.editable = editable === undefined || editable;
        this.editing = ko.observable(true);
        this.open = ko.observable(true).toggleable();
        this.name = ko.observable();
        this.displayName = ko.pureComputed(function() {
            return this.name() || 'Unnamed test';
        }, this);

        this.goTo = function() {
            part.goTo();
            part.tabber.setTab('testing')();
        }

        // JME scope in which this test is evaluated
        this.scope = ko.observable(scope);

        // Values of variables used in this test
        this.variables = ko.observableArray([]);
        this.variablesReady = ko.observable(false);

        // Marking parameters generated by this part
        this.marking_parameters = ko.observableArray([]);
        this.part_settings = ko.observableArray([]);

        // If editing, set variables to the current values in the question's variable preview
        ko.computed(function() {
            if(this.editing()) {
                var vs = [];
                this.part.q.allVariableGroups().forEach(function(g) {
                    g.variables().forEach(function(mv) {
                        mv.names().forEach(function(v) {
                            vs.push({
                                name: v.name,
                                value: v.value,
                                valueString: v.value ? Numbas.jme.display.treeToJME({tok:v.value},{bareExpression:false}) : '',
                                toggleLocked: function() { mv.toggleLocked(); },
                                locked: mv.locked
                            });
                        });
                    });
                });
                this.variables(vs);
                this.variablesReady(this.part.q.variablesReady());
            }
        },this).extend({throttle:500});

        this.remove = function() {
            // Remove this test from the parent part
            mt.part.unit_tests.remove(mt);
        }

        // "Student's answer" in this test
        this.answer = ko.observable({valid: false, value: undefined});

        this.answerDirty = ko.observable(false);
        this.answer.subscribe(function() {
            mt.answerDirty(true);
        });

        // set answer for gapfill parts
        ko.computed(function() {
            if(this.editing() && this.editable) {
                if(this.part.type().name=='gapfill') {
                    this.answer({
                        valid: this.part.gaps().some(function(g){return g.marking_test().answer().valid}), 
                        value: this.part.gaps().map(function(g) {
                            return g.marking_test().answer().value;
                        })
                    });
                }
            }
        }, this);

        // Marking notes generated by this test
        this.notes = ko.observableArray([]);

        for(let note of ['mark', 'interpreted_answer']) {
            this.notes.push(new MarkingNote(note));
        }

        // Get the marking note with the given name
        this.getNote = function(name) {
            return this.notes().filter(function(n){return n.name==name})[0];
        }

        // The result of running the marking script
        this.last_run = ko.observable(null);

        this.alternative_used = ko.observable(null);

        this.question = ko.observable(null);
        this.current_question_instance = null;
        this.last_question_json = null;
        this.last_variables = null;
        this.question_error = ko.observable(null);
        this.make_question = function(force) {
            if(!force && mt.part.q.currentPart()!=mt.part) {
                return;
            }
            if(!mt.variablesReady()) {
                return;
            }
            try {
                var json = mt.part.q.toJSON();
                var variables = mt.variables().map(function(v){ return {name: v.name, value: v.value} });
                try {
                    var same_question = Numbas.util.objects_equal(json,mt.last_question_json);
                    var same_variables = mt.last_variables && variables.length==mt.last_variables.length && variables.every(function(v,i) {
                        var lv = mt.last_variables[i];
                        return lv.name==v.name && lv.value!==null && Numbas.util.eq(v.value,lv.value);
                    });
                    if(same_question && same_variables) {
                        return mt.question();
                    }
                } catch(e) {
                    console.error(e);
                    throw(e);
                }
                mt.question(null);
                mt.last_question_json = json;
                mt.last_variables = variables;
                var q = mt.part.q.instance();
                mt.current_question_instance = q;
                mt.variables().forEach(function(v) {
                    q.scope.setVariable(v.name, v.value);
                });
                q.signals.trigger('variablesSet');
                q.signals.on('ready').then(function() {
                    if(q != mt.current_question_instance) {
                        return;
                    }
                    mt.question_error(null);
                    mt.question(q);
                }).catch(function(e) {
                    mt.question_error(e);
                });
                return q;
            } catch(e) {
                mt.question_error(e);
            }
        }
        this.runtime_part = ko.pureComputed(function() {
            var q = this.question();
            if(!q) {
                return;
            }
            return q.getPart(mt.part.path());
        }, this);

        this.correctAnswer = ko.pureComputed(function() {
            if(!this.runtime_part()) {
                return;
            }
            var p = this.runtime_part();
            return {valid: true, value: p.getCorrectAnswer(p.getScope())};
        },this);

        this.waiting_for_pre_submit = ko.observable(false);
        
        // When something changes, run the marking script and store the result in `this.result`
        this.mark = async function() {
            var answer = mt.answer();
            mt.answerDirty(false);
            var q = mt.question();
            if(mt.question_error()) {
                mt.last_run({error: 'Error creating question: '+mt.question_error().message});
                return;
            }
            if(!q) {
                mt.last_run({error: 'Question object not created yet.'});
                return;
            }
            try {
                var part =  mt.runtime_part();
                if(!part) {
                    throw(new Error("Part not found"));
                }
                if(!answer) {
                    throw(new Numbas.Error("Student's answer not set. There may be an error in the input widget."));
                }
                if(!answer.valid) {
                    if(answer.empty) {
                        mt.last_run({error: ''})
                    } else {
                        mt.last_run({error: "This answer is not valid.", warnings: answer.warnings});
                    }
                    return;
                }
                part.storeAnswer(answer.value);
                part.setStudentAnswer();
                var marking_parameters = part.marking_parameters(part.rawStudentAnswerAsJME());
                mt.marking_parameters(Object.entries(marking_parameters).map(function(p){ 
                    return {
                        name: p[0],
                        value: p[1]
                    }
                }));
                mt.part_settings(Object.entries(marking_parameters['settings'].value).map(function(s) {
                    return {
                        name: s[0],
                        value: s[1]
                    }
                }));
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
                mt.waiting_for_pre_submit(false);
                try {
                    var alternatives_result = part.markAlternatives(part.getScope(), undefined, '');
                    var res = alternatives_result.result.script_result;
                    if(!res) {
                        var out = {script: part.markingScript, error: 'The marking algorithm did not return a result.'};
                    } else {
                        var alternative_used = alternatives_result.best_alternative ? alternatives_result.best_alternative.path : null;
                        var out = {script: part.markingScript, result: res, marking_result: part.marking_result, message_displays: make_message_displays(part.markingFeedback.slice()), marks: part.marks, alternative_used: alternative_used};
                        if(res.state_errors.mark) {
                            out.error = 'Error when computing the <code>mark</code> note: '+res.state_errors.mark.message;
                        } else if(!res.state_valid.mark) {
                            out.error = 'This answer is not valid.';
                            out.warnings = part.warnings;
                        }
                    }
                    mt.last_run(out);
                } catch(e) {
                    console.error(e);
                    mt.last_run({error: 'Error marking: '+e.message});
                }
            } catch(e) {
                console.error(e);
                mt.last_run({error: 'Error marking: '+e.message});
            } finally {
                mt.running(false);
                mt.finish_run();
            }
        }

        this.running = ko.observable(false);
        this.run = async function(force) {
            mt.running(true);
            var q = mt.make_question(force);
            if(q) {
                try {
                    await q.signals.on('ready');
                } catch(e) {
                    mt.running(false);
                    mt.last_run({error: 'Error initialising the question: '+e.message});
                    return;
                }
                await mt.mark();
            }
        }

        this.last_run_error = ko.pureComputed(function() {
            if(this.last_run()) {
                return this.last_run().error;
            }
        },this);

        this.last_run_warnings = ko.pureComputed(function() {
            if(!this.last_run()) {
                return [];
            }
            var last_run = this.last_run();
            if(last_run.warnings !== undefined) {
                return last_run.warnings;
            }
            var marking_result = last_run.marking_result;
            if(!marking_result) {
                return [];
            }
            return marking_result.warnings;
        }, this);

        // When the script is evaluated, add new notes to the list and update existing ones
        this.finish_run = function() {
            var last_run = this.last_run();
            var editing = this.editing();

            // If either the script or result aren't there, or the script produced an error,
            // set every note as missing and reset its value
            if(!last_run || last_run.error !== undefined) {
                this.notes().forEach(function(n) {
                    n.missing(true);
                    n.value(null);
                    n.messages([]);
                    n.warnings([]);
                    n.error('');
                    n.valid(false);
                });
                if(!last_run) {
                    return;
                }
            }
            var result = last_run.result;
            var script = last_run.script;

            var states = [];
            var existing_notes = {};

            this.alternative_used(last_run.alternative_used ? part.q.getPart(last_run.alternative_used) : null);

            // Look at notes we already know about, and if they're present in this result
            var notes = this.notes().slice();
            notes.forEach(function(note) {
                var missing = !(result && result.states && (note.name in result.states));
                if(missing) {
                    if(mt.editing()) {
                        mt.notes.remove(note);
                    } else {
                        note.missing(missing);
                    }
                } 
                existing_notes[note.name] = note;
            });

            if(result) {
                // Save the results for each note
                for(var x in result.states) {
                    var name = x.toLowerCase();
                    var note = existing_notes[name];
                    // If this note is new, add it to the list
                    if(!note) {
                        note = new MarkingNote(name);
                        existing_notes[name] = note;
                        this.notes.push(note);
                    }

                    var p = part.marking_test().runtime_part();
                    // Compile feedback messages
                    var messages = [];
                    var warnings = [];
                    var credit = 0;
                    if(p) {
                        p.restore_feedback();
                        p.apply_feedback(Numbas.marking.finalise_state(result.states[x]));
                        messages = p.markingFeedback;
                        warnings = p.warnings;
                        credit = p.credit;
                    }

                    // Save the results for this note
                    note.note(script.notes[x]);
                    note.value(result.values[x]);
                    note.messages(messages);
                    note.warnings(warnings);
                    note.credit(credit);
                    note.error(result.state_errors[x] ? result.state_errors[x].message : '');
                    note.valid(result.state_valid[x]);
                    note.missing(false);
                }
            }
            var mark_note = existing_notes.mark;
            var marking_result = last_run.marking_result;
            if(mark_note) {
                if(marking_result) {
                    mark_note.credit(marking_result.credit);
                    mark_note.messages(marking_result.markingFeedback);
                    mark_note.warnings(marking_result.warnings);
                } else {
                    mark_note.credit(0);
                    mark_note.messages([]);
                    mark_note.warnings([]);
                }
            }
        };

        // If this test is being edited, keep the "expected" values up to date
        ko.computed(function() {
            if(this.editing() && this.editable) {
                this.setExpected();
            }
        },this).extend({throttle:100});

        // The marking notes, in alphabetical order by name
        this.sortedNotes = ko.pureComputed(function() {
            var notes = this.notes().slice();
            notes.sort(function(a,b) {
                a = a.name;
                b = b.name;
                return a<b ? -1 : a>b ? 1 : 0;
            })
            return notes;
        },this);

        // Non-hidden notes. Only these notes count towards the test passing or not.
        this.shownNotes = ko.pureComputed(function() {
            return this.notes().filter(function(n){ return n.show(); });
        },this);

        // Can this be saved as a unit test?
        // Only if there's at least one shown note.
        this.canCreateUnitTest = ko.pureComputed(function() {
            return this.shownNotes().length>0;
        },this);

        // Notes whose results don't match the expected values
        this.failingNotes = ko.pureComputed(function() {
            return this.shownNotes().filter(function(n){return n.missing() || !n.matchesExpected()});
        },this);

        // Notes which have gone missing since the test was set up
        // These might have been removed from the marking script
        this.missingNotes = ko.pureComputed(function() {
            return this.shownNotes().filter(function(n){return n.missing()});
        },this);

        // Is this test passing? No if any notes are failing.
        this.passes = ko.pureComputed(function() {
            return this.failingNotes().length==0;
        },this);

        this.state = ko.pureComputed(function() {
            if(this.running()) {
                return 'running';
            }
            if(!this.last_run()) {
                return 'not run';
            }
            if(this.passes()) {
                return 'passed';
            }
            return 'failed';
        },this);


        var tabs = [
            new Editor.Tab('variables','Variable values','text-background'),
            new Editor.Tab('notes','Feedback notes','text-background')
        ];
        this.tabber = new Editor.Tabber(tabs);

        this.tabber.setTab('notes')();

        this.header = ko.pureComputed(function() {
            // Prefix for the the header of this test in the list of tests
            var i = this.part.unit_tests().indexOf(this)+1;
            return i+'. ';
        },this);
    }
    MarkingTest.prototype = {
        toJSON: function() {
            return {
                variables: this.variables().map(function(v) {
                    return {
                        name: v.name,
                        value: v.valueString
                    }
                }),
                name: this.name(),
                answer: this.answer(),
                notes: this.shownNotes().map(function(note) {
                    return {
                        name: note.name,
                        expected: {
                            value: note.expected.value(),
                            messages: note.expected.messages(),
                            warnings: note.expected.warnings(),
                            error: note.expected.error(),
                            valid: note.expected.valid(),
                            credit: note.expected.credit()
                        }
                    }
                }),
            }
        },

        // Update the "expected values" for each note with the values 
        // from the last time the script was run
        setExpected: function() {
            this.notes().forEach(function(note) {
                note.setExpected();
            });
        },

        // Show all the notes
        showAllNotes: function() {
            this.notes().forEach(function(n){ n.show(true); });
        },

        // Hide all the notes
        hideAllNotes: function() {
            this.notes().forEach(function(n){ n.show(false); });
        }

    }

    function make_message_displays(messages) {
        return messages.filter(function(action) { return Numbas.util.isNonemptyHTML(action.message) || action.credit!=0; }).map(function(action) {
            var icons = {
                'positive': 'glyphicon-ok text-success',
                'negative': 'glyphicon-remove text-danger',
                'neutral': '',
                'invalid': 'glyphicon-exclamation-sign text-warning'
            }
            return {credit_change: action.credit_change, message: action.message, icon: icons[action.credit_change], format: action.format || 'string'};
        });
    }


    function MarkingNote(name, in_unit_test) {
        var mn = this;
        this.name = name;

        this.compare = {
            value: true,
            messages: true,
            warnings: true,
            error: true,
            validity: true,
            credit: true
        }

        var default_show_names = ['mark','interpreted_answer'];
        this.show = ko.observable(in_unit_test && default_show_names.contains(this.name)).toggleable();

        this.note = ko.observable(null);
        this.description = ko.pureComputed(function() {
            var note = this.note();
            return note ? note.description : '';
        },this);

        this.missing = ko.observable(false);

        this.value = ko.observable(null);
        this.messages = ko.observableArray([]);
        
        this.message_displays = ko.pureComputed(function() {
            return make_message_displays(this.messages());
        },this);

        this.warnings = ko.observableArray([]);
        this.error = ko.observable('');
        this.valid = ko.observable(true);
        this.credit = ko.observable(0);

        this.valueType = ko.pureComputed(function() {
            var v = this.value();
            return v ? v.type : 'none';
        },this);

        this.expected = {
            value: ko.observable(''),
            messages: ko.observableArray([]),
            warnings: ko.observableArray([]),
            error: ko.observable(''),
            valid: ko.observable(true),
            credit: ko.observable(0)
        };
        this.expected.message_displays = ko.pureComputed(function() {
            return make_message_displays(this.expected.messages());
        },this);
        this.expected.computedValue = ko.pureComputed(function() {
            try {
                return Numbas.jme.builtinScope.evaluate(this.expected.value());
            } catch(e) {
                return null;
            }
        },this);
        this.setExpected = function() {
            var value = mn.value()
            mn.expected.value(value ? Numbas.jme.display.treeToJME({tok:value},{bareExpression:false}) : '');
            mn.expected.messages(mn.messages());
            mn.expected.warnings(mn.warnings());
            mn.expected.error(mn.error());
            mn.expected.valid(mn.valid());
            mn.expected.credit(mn.credit());
        }
        this.noMatchReason = ko.pureComputed(function() {
            if(this.missing()) {
                return 'missing';
            }
            try {
                var value = this.value();
                var expectedValue = this.expected.computedValue();
                var bothValues = expectedValue && value;
                var differentValue;
                if(bothValues) {
                    if(Numbas.util.equalityTests[expectedValue.type] && Numbas.util.equalityTests[value.type]) {
                        differentValue = !Numbas.util.eq(expectedValue,value);
                    } else {
                        differentValue = expectedValue.type != value.type;
                    }
                } else {
                    differentValue = expectedValue==value;
                }
            } catch(e) {
                differentValue = false;
            }
            var expected_messages = this.expected.messages();
            var differentMessages = this.messages().find(function(action,i) { 
                var expected_action = expected_messages[i];
                return !expected_action || expected_action.credit_change != action.credit_change || expected_action.message != action.message;
            });
            var differentWarnings = this.warnings().join('\n') != this.expected.warnings().join('\n');
            var differentError = this.error() != this.expected.error();
            var differentValidity = this.valid() != this.expected.valid();
            var differentCredit = this.credit() != this.expected.credit();

            if(this.compare.value && differentValue) {
                return 'value';
            } else if(this.compare.messages && differentMessages) {
                return 'messages';
            } else if(this.compare.warnings && differentWarnings) {
                return 'warnings';
            } else if(this.compare.error && differentError) {
                return this.error() ? this.expected.error() ? 'different-error' : 'unexpected-error' : 'missing-error';
            } else if(this.compare.validity && differentValidity) {
                return this.expected.valid() ? 'unexpected-invalid' : 'unexpected-invalid';
            } else if(this.compare.credit && differentCredit) {
                return 'credit';
            } else {
                return null;
            }
        },this);
        this.noMatchDescription = ko.pureComputed(function() {
            var reason = this.noMatchReason();
            var d = {
                'missing': 'This note is no longer defined.',
                'value': 'The value of this note differs from the expected value.',
                'messages': 'The feedback messages differ from those expected.',
                'warnings': 'The warning messages differ from those expected.',
                'different-error': 'A different error message has been thrown.',
                'unexpected-error': 'An unexpected error has been thrown.',
                'missing-error': 'An error was expected.',
                'unexpected-valid': 'This note was expected to be invalid.',
                'unexpected-invalid': 'This note was expected to be valid.',
                'credit': 'Credit awarded differs from that expected.'
            }
            return d[reason];
        },this);

        this.matchesExpected = ko.pureComputed(function() {
            return !this.noMatchReason();
        },this);
    }

    function PartType(part,data) {
        this.name = data.name;
        this.widget = data.widget;
        this.part = part;
        this.help_url = data.help_url;
        this.niceName = data.niceName;
        this.has_marks = data.has_marks || false;
        this.has_correct_answer = data.has_correct_answer || false;
        this.has_feedback_icon = data.has_feedback_icon || false;
        this.has_marking_settings = data.has_marking_settings || false;
        this.model = data.model ? data.model(part) : {};
        this.tabs = data.tabs ? data.tabs(part,this.model) : [];
        this.required_extensions = data.required_extensions || [];
        this.is_custom_part_type = data.is_custom_part_type;
        this.toJSONFn = data.toJSON || function() {};
        this.loadFn = data.load || function() {};
        this.variable_references = ko.pureComputed(function() {
            if(!data.variable_references) {
                return [];
            }
            return data.variable_references.apply(data,[this.part,this.model]);
        },this);
    }
    PartType.prototype = {
        toJSON: function(data) {
            this.toJSONFn.apply(this.model,[data,this.part]);
        },
        load: function(data) {
            this.loadFn.apply(this.model,[data,this.part]);
        }
    };


    function loading_error(message) {
        $('.page-loading').hide();
        $('.page-error')
            .show()
            .find('.trace')
                .html(message)
        ;
    }


    Numbas.queueScript('knockout',[], function() {});

    var deps = ['jme-display','jme-variables','jme','editor-extras','marking','json', 'answer-widgets'];
    Numbas.queueScript('start-editor',deps,function() {
        try {
            viewModel = new Question(item_json.itemJSON);
            viewModel.set_tab_from_hash();
            ko.options.deferUpdates = true;
            ko.applyBindings(viewModel);
            try {
                document.body.classList.add('loaded');
            } catch(e) {
                document.body.className += ' loaded';
            }
            $('.timeline').mathjax();
        }
        catch(e) {
            loading_error(e.message);
            throw(e);
        }
    });
    var missing = Numbas.checkAllScriptsLoaded();
    if(missing.length>0) {
        loading_error('The following scripts did not load: \n\n'+missing.map(function(r) { return '* '+r.file; }).join('\n'));
    }

    Mousetrap.bind(['ctrl+b','command+b'],function() {
        window.open(item_json.previewURL,item_json.previewWindow);
    });
});
