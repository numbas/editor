var viewModel;

$(document).ready(function() {
    var builtinRulesets = ['basic','unitFactor','unitPower','unitDenominator','zeroFactor','zeroTerm','zeroPower','noLeadingMinus','collectNumbers','simplifyFractions','zeroBase','constantsFirst','sqrtProduct','sqrtDivision','sqrtSquare','trig','otherNumbers']

    Editor.question = {};

    var vars_used_in_html = Editor.vars_used_in_html = function(html) {
        var element = document.createElement('div');
        element.innerHTML = html;
        try {
            var subber = new Numbas.jme.variables.DOMcontentsubber(Numbas.jme.builtinScope);
            return subber.findvars(element);
        } catch(e) {
            return [];
        }
    }
    var vars_used_in_string = Editor.vars_used_in_string = function(str) {
        var bits = Numbas.util.splitbrackets(str,'{','}');
        var vars = [];
        for(var i=1;i<bits.length;i+=2) {
            try {
                var tree = Numbas.jme.compile(bits[i]);
                vars = vars.merge(Numbas.jme.findvars(tree));
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
        jmeTypes(types);
    }
    find_jme_types();


    function AddPartTypeModal(question,useFn, filter) {
        var m = this;
        this.question = question;
        this.show = ko.observable(false);
        this.open = function() {
            m.show(true);
        }
        this.useFn = useFn;
        var part_types = Editor.part_types.models;
        if(filter) {
            part_types = part_types.filter(filter);
        }
        this.part_types = part_types.filter(function(pt) { return pt.is_custom_part_type; });
    }

    ko.bindingHandlers.showModal = {
        init: function(element, valueAccessor) {
            $(element).modal({show:false});

            var value = valueAccessor();
            if (ko.isObservable(value)) {
                $(element).on('hide.bs.modal', function() {
                   value(false);
                });
            }
        },
        update: function (element, valueAccessor) {
            var value = valueAccessor();
            if (ko.unwrap(value)) {
                $(element).modal('show');
            } else {
                $(element).modal('hide');
            }
        }
    };                 


    ko.components.register('part-type-modal', {
        viewModel: function(params) {
            var vm = this;
            this.show = params.data.show;
            this.part_types = params.data.part_types;
            this.search = ko.observable('');
            this.filtered_part_types = ko.computed(function() {
                var search = this.search();
                var words = search.toLowerCase().split(/\s+/g).map(function(w){ return w.trim() });
                return this.part_types.filter(function(pt) {
                    return words.every(function(word){ return pt.search_text.contains(word) || !word; });
                });
            },this);
            this.useFn = params.data.useFn;
            this.use = function(pt) {
                vm.show(false);
                vm.useFn(pt);
            }
        },
        template: '\
            <div class="modal fade part-type-modal" tabindex="-1" role="dialog" aria-hidden="true" data-bind="showModal: show">\
                <div class="modal-dialog">\
                    <div class="modal-content">\
                        <div class="modal-header">\
                            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
                            <h3 class="modal-title">Choose a part type</h3>\
                        </div>\
                        <div class="modal-body">\
                            <input type="text" class="form-control" data-bind="textInput: search" placeholder="Enter keywords to search for">\
                            <ul class="list-unstyled part-types" data-bind="foreach: filtered_part_types">\
                                <li class="part-type">\
                                    <button class="btn btn-sm btn-link use" title="Use this part type" data-bind="click: $parent.use"><span class="glyphicon glyphicon-plus" ></span></button>\
                                    <div class="details">\
                                        <h4>\
                                            <span role="button" class="name" data-bind="html: niceName, click: $parent.use"></span>\
                                            <br>\
                                            <small>by <span data-bind="text: source.author.name"></span></small>\
                                        </h4>\
                                        <div data-bind="html: description"></div>\
                                        <p><a target="_blank" data-bind="attr: {href: help_url}"><span class="glyphicon glyphicon-question-sign"></span> More information</a></p>\
                                    </div>\
                                </li>\
                            </ul>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        '
    });

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
        this.variables = ko.observableArray([]);
        this.questionScope = ko.observable();
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

        this.partsModes = [
            {name: 'Show all parts', value: 'all'},
            {name: 'Explore', value: 'explore'}
        ];
        this.partsMode = ko.observable(this.partsModes[0]);


        this.parts = ko.observableArray([]);

        // all parts in this question, including child parts such as gaps and steps
        this.allParts = ko.computed(function() {
            var o = [];
            this.parts().map(function(p) {
                o.push(p);
                if(p.type().name=='gapfill') {
                    o = o.concat(p.gaps());
                }
                o = o.concat(p.steps());
            });
            return o;
        },this);

        this.currentPart = ko.observable(null);
        this.addingPart = ko.observable(null);

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

        this.partTypes = ko.computed(function() {
            return Editor.part_types.models.filter(function(pt) {
                if(pt.is_custom_part_type) {
                    return q.allParts().some(function(p){ return p.type().name==pt.name });
                } else {
                    return true;
                }
            });
        }, this);
        this.gapTypes = ko.computed(function(){ return q.partTypes().filter(function(t){ return t.can_be_gap!==false }); });
        this.stepTypes = ko.computed(function(){ return q.partTypes().filter(function(t){ return t.can_be_step!==false }); });

        this.usedPartTypes = ko.computed(function() {
            return Editor.part_types.models.filter(function(pt) {
                return q.allParts().some(function(p){ return p.type().name==pt.name });
            })
        }, this);

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

        this.saveResources = ko.computed(function() {
            var resources = this.resources();
            var out = [];
            for(var i=0;i<resources.length;i++) {
                var res = resources[i];
                if(res.progress()==1) {
                    out.push({
                        pk: res.pk()
                    });
                }
            }
            return out;
        },this);

        function Extension(q,data) {
            var ext = this;
            ["location","name","edit_url","hasScript","url","scriptURL","author","pk"].forEach(function(k) {
                ext[k] = data[k];
            });
            this.used = ko.observable(false);
            this.required = ko.computed(function() {
                return q.usedPartTypes().some(function(p){ return p.required_extensions && p.required_extensions.indexOf(ext.location) != -1 });
            }, this);
            this.used_or_required = ko.computed({
                read: function() {
                    return this.used() || this.required();
                },
                write: function(v) {
                    return this.used(v);
                }
            }, ext);

            ko.computed(function() {
                if(this.used_or_required()) {
                    Numbas.activateExtension(this.location);
                    find_jme_types();
                }
            },this);
        }

        for(var i=0;i<item_json.numbasExtensions.length;i++) {
            this.extensions.push(new Extension(this,item_json.numbasExtensions[i]));
        }
        this.usedExtensions = ko.computed(function() {
            return this.extensions().filter(function(e){return e.used_or_required()});
        },this);

        this.allsets = ko.computed(function() {
            return builtinRulesets.concat(this.rulesets().map(function(r){return r.name()})).sort();
        },this);

        this.preamble = {
            css: ko.observable(''),
            js: ko.observable('')
        };

        var extensions_tab_in_use = ko.computed(function() {
            return this.usedExtensions().length>0 || this.functions().length>0 || this.preamble.css()!='' || this.preamble.js()!='';
        },this);

        this.mainTabs([
            new Editor.Tab('statement','Statement','blackboard',{in_use: ko.computed(function(){ return this.statement()!=''; },this)}),
            new Editor.Tab('parts','Parts','check',{in_use: ko.computed(function() { return this.parts().length>0; },this)}),
            new Editor.Tab('variables','Variables','list',{in_use: ko.computed(function() { return this.variables().length>0; },this)}),
            new Editor.Tab('variabletesting','Variable testing','dashboard',{in_use: ko.computed(function() { return this.variablesTest.condition()!=''; },this)}),
            new Editor.Tab('advice','Advice','blackboard',{in_use: ko.computed(function() { return this.advice()!=''; },this)}),
            new Editor.Tab('extensions','Extensions & scripts','wrench',{in_use: extensions_tab_in_use}),
            new Editor.Tab('resources','Resources','picture',{in_use: ko.computed(function() { return this.resources().length>0; },this)}),
            new Editor.Tab('settings','Settings','cog'),
            new Editor.Tab('exams','Exams using this question','book',{in_use:item_json.used_in_exams}),
            new Editor.Tab('network','Other versions','link',{in_use:item_json.other_versions_exist}),
            new Editor.Tab('history','Editing history','time',{in_use:item_json.editing_history_used})
        ]);
        if(item_json.editable) {
            var adviceTab = new Editor.Tab('access','Access','lock');
            this.mainTabs.splice(8,0,adviceTab);
        }
        this.currentTab(this.mainTabs()[0]);

        this.startAddingPart = function() {
            q.addingPart({kind:'part', parent:null, parentList: q.parts, availableTypes: q.partTypes});
        }

        this.addPart = function(type) {
            var adding = q.addingPart();
            var p = new Part(q,adding.parent,adding.parentList);
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

        this.addPartTypeModal = new AddPartTypeModal(this,function(pt){ q.addPart(pt) });

        this.goToPart = function(path) {
            var p = q.getPart(path);
            if(!p) {
                return;
            }
            q.currentPart(p);
            q.currentTab(q.getTab('parts'));
        }

        this.baseVariableGroup = new VariableGroup(this,{name:'Ungrouped variables'});
        this.baseVariableGroup.fixed = true;
        this.allVariableGroups = ko.computed(function() {
            var l = this.variableGroups();
            return l.concat(this.baseVariableGroup);
        },this);

        // this changes whenever there's a change to a variable name or definition, or a variables is added or removed (or similar to the functions)
        this.lastVariableChange = ko.computed(function() {
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

        this.variablesTest.time_remaining_display = ko.computed(function() {
            return this.time_remaining()+' '+Numbas.util.pluralise(this.time_remaining(),'second','seconds');
        },this.variablesTest);

        // reset the advice whenever the condition changes or there's a change to the variables
        ko.computed(function() {
            this.variablesTest.condition();
            this.lastVariableChange();
            this.variablesTest.advice('');
        },this);

        this.variableErrors = ko.computed(function() {
            var variables = this.variables();
            for(var i=0;i<variables.length;i++) {
                if(variables[i].name().trim()=='' || variables[i].definition().trim()=='' || variables[i].nameError() || variables[i].error()) {
                    return true;
                }
            }
            return false;
        },this);

        this.variablesReady = ko.computed(function() {
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
            q.currentTab(q.getTab('variables'));
        }

        ko.computed(function() {
            if(!this.autoCalculateVariables())
                return;
            //the ko dependency checker seems not to pay attention to what happens in the computeVariables method, so access the variable bits here to give it a prompt
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

        this.variable_references = ko.computed(function() {
            var o = [];
            o.push(new VariableReference({kind:'tab',tab:'statement',value:q.statement,type:'html',description:'Statement'}));
            o.push(new VariableReference({kind:'tab',tab:'advice',value:q.advice,type:'html',description:'Advice'}));
            o.push(new VariableReference({kind:'tab',tab:'variabletesting',value:q.variablesTest.condition,type:'jme',description:'Variable testing condition'}));
            q.allParts().forEach(function(p) {
                o = o.concat(p.variable_references());
            });
            return o;
        },this);

        ko.computed(function() {
            this.variables().forEach(function(v) {
                v.references([]);
            });
            this.variable_references().forEach(function(r) {
                var def = r.def;
                var description = r.description();
                r.vars().forEach(function(name) {
                    var icons;
                    var v = q.getVariable(name);
                    if(v) {
                        switch(def.kind) {
                            case 'tab':
                                icons = [q.getTab(def.tab).icon];
                                break;
                            case 'part':
                                icons = [q.getTab('parts').icon, def.part.getTab(def.tab).icon];
                                break;
                        }
                        function go() {
                            switch(def.kind) {
                                case 'tab':
                                    q.setTab(def.tab)();
                                    icon = q.getTab(def.tab).icon;
                                    break;
                                case 'part':
                                    q.setTab('parts')();
                                    q.currentPart(def.part);
                                    def.part.setTab(def.tab)();
                                    icon = def.part.getTab(def.tab).icon;
                                    break;
                            }
                        }
                        v.references.push({
                            description: description, 
                            icons: icons, 
                            go: go
                        });
                    }
                });
            });
        },this);

        if(data) {
            this.load(data);
        }

        if(item_json.editable) {
            this.deleteResource =  function(res) {
                q.resources.remove(res);
            }

            this.init_output();

            this.save = ko.computed(function() {
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
                    {text: 'Add one or more variables to randomise the question', done: ko.computed(function() { return this.variables().length>0 && !this.variableErrors(); },this), focus_on: '#add-variable-button'}
                ],
                'parts': [
                    {text: 'Create at least one part.', done: ko.computed(function(){ return this.parts().length>0 },this), focus_on: '#add-part-button'}
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
            Editor.computedReplaceState('currentVariable',ko.computed(function(){
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
                        part.setTab(tab)();
                    }
                });
            }
            if('currentPart' in state) {
                this.currentPart(this.getPart(state.currentPart));
            }
            Editor.computedReplaceState('currentPart',ko.computed(function() {
                var p = this.currentPart();
                if(p) {
                    return p.path();
                }
            },this));
            Editor.computedReplaceState('currentPartTabs',ko.computed(function() {
                var d = {};
                q.allParts().forEach(function(p) {
                    d[p.path()] = p.currentTab().id;
                });
                return d;
            },this));
            if('partsTabMode' in state) {
                this.partsTabMode(state.partsTabMode);
            }
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
            if(n!=undefined)
                this.functions.splice(n,0,f);
            else
                this.functions.push(f);
            return f;
        },

        addVariable: function(q,e,n) {
            var v = new Variable(this);
            if(n!=undefined)
                this.variables.splice(n,0,v);
            else
                this.variables.push(v);
            this.currentVariable(v);
            return v;
        },

        addVariableGroup: function() {
            var vg = new VariableGroup(this);
            this.variableGroups.push(vg);
            return vg;
        },

        getVariable: function(name) {
            name = name.toLowerCase();
            var variables = this.variables();
            for(var i = 0; i<variables.length;i++) {
                if(variables[i].name().toLowerCase() == name) {
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

        loadPart: function(data) {
            var p = new Part(this,null,this.parts,data);
            this.parts.push(p);
            return p;
        },

        getPart: function(path) {
            var re_path = /^p(\d+)(?:g(\d+)|s(\d+))?$/;
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
                var g = parseInt(m[2]);
                return p.gaps()[g];
            } else if(m[3]) {
                var s = parseInt(m[3]);
                return p.steps()[s];
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
                var results = this.computeVariables(prep);
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
            });

            var rulesetTodo = {};
            this.rulesets().forEach(function(r) {
                rulesetTodo[r.name()] = r.sets();
            });
            Numbas.jme.variables.makeRulesets(rulesetTodo,results.scope);

            this.questionScope(results.scope);
        },

        baseScope: function() {
            var jme = Numbas.jme;
            var scope = new jme.Scope(jme.builtinScope);
            var extensions = this.extensions().filter(function(e){return e.used_or_required()});
            for(var i=0;i<extensions.length;i++) {
                var extension = extensions[i].location;
                if(extension in Numbas.extensions && 'scope' in Numbas.extensions[extension]) {
                    scope = new jme.Scope([scope,Numbas.extensions[extension].scope]);
                }
            }
            return scope;
        },

        // get everything ready to compute variables - make functions, and work out dependency graph
        prepareVariables: function() {
            var jme = Numbas.jme;

            var scope = this.baseScope();

            //create functions
            this.functions().map(function(f) {
                try {
                    var fn = {
                        name: f.name().toLowerCase(),
                        definition: f.definition(),
                        language: f.language(),
                        outtype: f.type(),
                        parameters: f.parameters().map(function(p) {
                            if(!p.name()) {
                                throw(new Error('A parameter is unnamed.'));
                            }
                            return {
                                name: p.name(),
                                type: p.type()
                            }
                        })
                    };

                    var cfn = jme.variables.makeFunction(fn,scope);
                    scope.addFunction(cfn);
                }
                catch(e) {
                    f.error(e.message);
                }

            });

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
                    var vars = jme.findvars(tree);
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
            var result = {variables: {}};
            var jme = Numbas.jme;
            var scope = result.scope = new jme.Scope([prep.scope]);
            var todo = prep.todo;

            function computeVariable(name) {
                try {
                    var value = jme.variables.computeVariable(name,todo,scope);
                    result.variables[name] = {value: value};
                }
                catch(e) {
                    result.variables[name] = {error: e.message};
                    result.error = true;
                }
            }

            if(prep.condition) {
                var condition_vars = jme.findvars(prep.condition);
                condition_vars.map(function(name) {
                    computeVariable(name);
                });
                try {
                    result.conditionSatisfied = Numbas.jme.evaluate(prep.condition,scope).value;
                } catch(e) {
                    this.variablesTest.conditionError(e.message);
                    result.conditionSatisfied = false;
                    return result;
                }
            } else {
                result.conditionSatisfied = true;
            }

            if(result.conditionSatisfied) {
                //evaluate variables
                for(var x in todo)
                {
                    computeVariable(x);
                }
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

        toJSON: function() {
            var rulesets = {};
            this.rulesets().map(function(r){
                rulesets[r.name()] = r.sets();
            });

            var variables = {};
            this.variables().map(function(v) {
                variables[v.name()] = v.toJSON();
            });

            var ungrouped_variables = this.baseVariableGroup.variables().map(function(v){
                return v.name();
            });

            var groups = [];
            this.variableGroups().map(function(g) {
                groups.push({
                    name: g.name(),
                    variables: g.variables().map(function(v){return v.name()})
                });
            });

            var functions = {};
            this.functions().map(function(f) {
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
            this.realtags([]);
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

            if('variables' in contentData)
            {
                for(var x in contentData.variables)
                {
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
            if(this.parts().length) {
                this.currentPart(this.parts()[0]);
            }
            this.allParts().forEach(function(p) {
                p.nextParts().forEach(function(np) {
                    np.otherPart(np.part.parentList()[np.otherPartIndex]);
                });
            });

            try{
                this.tags(data.tags);
            }
            catch(e) {
                this.tags([]);
            }

        },

        /** Create an instance of this question as a Numbas.Question object.
         * Returns a promise which resolves once the question is ready to use
         */
        instance: function() {
            var q = Numbas.createQuestionFromJSON(this.toJSON(),1,null,null,this.baseScope());
            return q;
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
                html = '<img src="'+image.url()+'">';
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
        this.isEditing = ko.computed({
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
        this.displayName = ko.computed(function() {
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

    function Variable(q,data) {
        this.question = q;
        this._name = ko.observable('');
        this.name = ko.computed({
            read: function() {
                return this._name().trim();
            },
            write: function(v) {
                return this._name(v);
            }
        },this);
        this.group = ko.observable(null);
        this.random = ko.observable(null);
        this.nameError = ko.computed(function() {
            var name = this.name();
            if(name=='')
                return '';

            var variables = q.variables();
            for(var i=0;i<variables.length;i++) {
                var v = variables[i];
                if(v!=this && v.name().toLowerCase()==name.toLowerCase())
                    return 'There\'s already a variable with this name.';
            }

            if(!re_name.test(name)) {
                return 'This variable name is invalid.';
            }

            if(name.toLowerCase() in Numbas.jme.constants) {
                return 'This variable name is reserved.';
            }

            var tokens = Numbas.jme.tokenise(name);
            if(tokens.length != 1) {
                return 'This variable name is invalid.';
            }
            if(tokens[0].type != 'name') {
                return 'This variable name is reserved.';
            }

            if(typeof Numbas.jme.builtinScope.getVariable(name) !== 'undefined'){
                return 'This variable name is reserved.';
            }

            return '';
        },this);

        this.usedInTestCondition = ko.computed(function() {
            var name = this.name();
            try {
                var condition = Numbas.jme.compile(this.question.variablesTest.condition());
                var vars = Numbas.jme.findvars(condition);
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
                    var v = this.templateTypeValues.json.value();
                    try {
                        var data = JSON.parse(v);
                        this.templateTypeValues.json.value(JSON.stringify(data,null,4));
                    } catch(e) {
                    }
                }
            }
        };
        this.templateTypeValues['list of numbers'].floatValues = ko.computed(function() {
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
                    case 'long string':
                        var s = treeToJME({tok: wrapValue(val.value())});
                        if(val.isTemplate()) {
                            s = 'safe('+s+')';
                        }
                        return s;
                    case 'list of numbers':
                        var values = val.values().filter(function(n){return n!=''});
                        if(!values.every(function(n){return Numbas.util.isNumber(n,true)})) {
                            throw("One of the values is not a number");
                        }
                        return treeToJME(Numbas.jme.compile('['+values.join(',')+']'));
                    case 'list of strings':
                        return treeToJME({tok: wrapValue(val.values())});
                    case 'json':
                        JSON.parse(val.value() || '');
                        var json = treeToJME({tok: wrapValue(val.value())});
                        return 'json_decode('+json+')';
                    }
                } catch(e) {
                    this.definitionError(e);
                    return '';
                }
            }
        },this);

        this.dependencies = ko.observableArray([]);
        this.isDependency = ko.computed(function() {
            var currentVariable = q.currentVariable();
            if(!currentVariable)
                return false;
            return currentVariable.dependencies().contains(this.name().toLowerCase());
        },this);
        this.dependenciesObjects = ko.computed(function() {
            var deps = this.dependencies();
            return this.dependencies().map(function(name) {
                var obj = q.getVariable(name);
                if(obj) {
                    name = obj.name();
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
                            var v = q.addVariable();
                            v.name(name);
                            q.baseVariableGroup.variables.push(v);
                        }
                    }
                };
                return out;
            });
        },this);
        this.usedIn = ko.computed(function() {
            var v = this;
            return q.variables().filter(function(v2) {
                return v2.dependencies().contains(v.name().toLowerCase());
            });
        },this);
        this.references = ko.observableArray([]);
        this.unused = ko.computed(function() {
            return this.usedIn().length==0 && this.references().length==0;
        },this);
        this.value = ko.observable(null);
        this.error = ko.observable('');
        this.anyError = ko.computed(function() {
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

        this.type = ko.computed(function() {
            var v = this.value();
            if(!v || this.error()) {
                return '';
            }
            return v.type;
        },this);

        this.thisLocked = ko.observable(false);
        var lockedSeen = {};
        var lockedDepth = 0;
        this.locked = ko.computed(function() {
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

        this.display = ko.computed(function() {
            var v;
            if(this.anyError()) {
                return this.anyError();
            } else if(v = this.value()) {
                return Editor.displayJMEValue(v);
            } else {
                return '';
            }
        },this);
        this.remove = function() {
            q.variables.remove(this);
            this.group().variables.remove(this);
            if(this==q.currentVariable()) {
                q.selectFirstVariable();
            }
        };
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
            {id: 'long string', name: 'Long text string'},
            {id: 'list of numbers', name: 'List of numbers'},
            {id: 'list of strings', name: 'List of short text strings'},
            {id: 'json', name: 'JSON data'}
        ],

        load: function(data) {
            tryLoad(data,['name','description'],this);
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
            }
            return obj;
        },

        definitionToTemplate: function(definition) {
            var templateType = this.templateType().id;
            var templateTypeValues = this.templateTypeValues[templateType];

            try {
                var tree = Numbas.jme.compile(definition);
                switch(templateType) {
                case 'anything':
                    templateTypeValues.definition(definition);
                    break;
                case 'number':
                    templateTypeValues.value(Numbas.jme.evaluate(definition,Numbas.jme.builtinScope).value);
                    break;
                case 'range':
                    var rule = new Numbas.jme.display.Rule('?;a..?;b#?;c',[]);
                    var m = rule.match(tree);
                    templateTypeValues.min(Numbas.jme.evaluate(m.a,Numbas.jme.builtinScope).value);
                    templateTypeValues.max(Numbas.jme.evaluate(m.b,Numbas.jme.builtinScope).value);
                    templateTypeValues.step(Numbas.jme.evaluate(m.c,Numbas.jme.builtinScope).value);
                    break;
                case 'randrange':
                    var rule = new Numbas.jme.display.Rule('random(?;a..?;b#?;c)',[]);
                    var m = rule.match(tree);
                    templateTypeValues.min(Numbas.jme.evaluate(m.a,Numbas.jme.builtinScope).value);
                    templateTypeValues.max(Numbas.jme.evaluate(m.b,Numbas.jme.builtinScope).value);
                    templateTypeValues.step(Numbas.jme.evaluate(m.c,Numbas.jme.builtinScope).value);
                    break;
                case 'string':
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
                }
            }
            catch(e) {
                console.log(e);
            }
        },

        toggleLocked: function(v,e) {
            this.thisLocked(!this.thisLocked());
            if(e) {
                e.preventDefault();
            }
        }
    }

    function VariableReference(def) {
        this.def = def;
        this.description = Knockout.computed(function() {
            var desc = ko.unwrap(this.def.description);
            if(this.def.kind=='part') {
                var p = this.def.part;
                while(p) {
                    desc = p.name()+' '+desc;
                    p = p.parent();
                }
            }
            return desc;
        },this);
        var raw_vars = ko.computed(function() {
            try {
                var v = ko.unwrap(this.def.value);
                switch(this.def.type) {
                    case 'html':
                        return vars_used_in_html(v);
                    case 'string':
                        return vars_used_in_string(v);
                    case 'jme-sub':
                        return vars_used_in_string(v)
                    case 'jme':
                        try {
                            var tree = Numbas.jme.compile(v);
                        } catch(e) {
                            break;
                        }
                        if(tree) {
                            return Numbas.jme.findvars(tree);
                        } else {
                            return [];
                        }
                    case 'list':
                        return v;
                    default:
                        throw(new Error("Undefined variable reference data type "+this.def.type));
                }
            } catch(e) {
                return [];
            }
        },this);
        this.vars = ko.computed(function() {
            var v = raw_vars();
            if(!v) {
                return [];
            }
            if(this.def.ignore) {
                var ignore = ko.unwrap(this.def.ignore);
                v = v.filter(function(n) { return ignore.indexOf(n)==-1 });
            }
            return v;
        },this);
    }

    function CustomFunction(q,data) {
        this.name = ko.observable('');
        this.types = jmeTypes;
        this.parameters = ko.observableArray([])
        this.type = ko.observable('number');
        this.definition = ko.observable('');
        this.languages = ['jme','javascript'];
        this.language = ko.observable('jme');
        this.error = ko.observable('');

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
                return [p.name(), p.type()];
            });
            return {
                parameters: parameters,
                type: this.type(),
                language: this.language(),
                definition: this.definition()
            };
        },

        addParameter: function() {
            this.parameters.push(new FunctionParameter(this,'','number'));
        }
    };

    function FunctionParameter(f,name,type) {
        this.name = ko.observable(name);
        this.type = ko.observable(type);
        this.remove = function() {
            f.parameters.remove(this);
        }
    };

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

        this.active = ko.computed(function() {
            return this.script().trim().length>0;
        },this);
    }

    function ScoreBin(q,data) {
        this.q = q;
        this.name = ko.observable('');
        this.limit = ko.observable(0);
        this.modes = [
            {name: 'Sum', value: 'sum'},
            {name: 'Scale', value: 'scale'}
        ];
        this.mode = ko.observable(this.modes[0]); // sum or scale

        if(data) {
            this.load(data);
        }
    }
    ScoreBin.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                limit: this.limit(),
                mode: this.mode().value
            };
        },

        load: function(data) {
            tryLoad(data,['name','limit'],this);
            for(var i=0;i<this.modes.length;i++) {
                if(this.modes[i].value==data.mode) {
                    this.mode(this.modes[i]);
                    break;
                }
            }
        }
    };

    var Part = Editor.question.Part = function(q,parent,parentList,data) {
        var p = this;
        this.q = q;
        this.prompt = Editor.contentObservable('');
        this.parent = ko.observable(parent);
        this.parentList = parentList;
        this.customName = ko.observable('');
        this.useCustomName = ko.computed(function() {
            return this.customName().trim()!='';
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
        this.childrenDescription = ko.pureComputed(function() {
            var out = [];
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

        this.steps = ko.observableArray([]);
        this.stepsPenalty = ko.observable(0);

        this.gaps = ko.observableArray([]);

        this.types = Editor.part_types.models.map(function(data){return new PartType(p,data);});

        this.isRootPart = ko.computed(function() {
            return !this.parent();
        },this);

        this.isGap = ko.computed(function(){
            return this.parent() && this.parent().type().name=='gapfill' && !this.parent().steps().contains(this);
        },this);

        this.isStep = ko.computed(function() {
            return this.parent() && this.parent().steps().contains(this);
        },this);

        this.availableTypes = ko.computed(function() {
            if(this.isGap()) {
                return this.types.filter(function(t){return t.can_be_gap!==false});
            } else if(this.isStep()) {
                return this.types.filter(function(t){return t.can_be_step!==false});
            } else {
                return this.types;
            }
        },this);
        this.type = ko.observable(this.availableTypes()[0]);

        this.canBeReplacedWithGap = ko.computed(function() {
            return !(this.type().name=='gapfill' || this.isGap() || this.isStep() || this.type().can_be_gap===false);
        },this);

        this.isFirstPart = ko.computed(function() {
            return this==q.parts()[0];
        },this);

        this.indexLabel = ko.computed(function() {
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
            } else if(this.isGap() || this.isStep()) {
                i = i+'';
            } else {
                i = Numbas.util.letterOrdinal(i);
            }
            return i+'';
        },this);
        this.levelName = ko.computed(function() {
            return this.isGap() ? 'gap' : this.isStep() ? 'step' : 'part';
        },this);
        this.standardName = ko.computed(function() {
            if(this.indexLabel()) {
                var name = Numbas.util.capitalise(this.levelName() + " " + this.indexLabel());
                if(this.isGap() || this.isStep()) {
                    name += '.';
                } else {
                    name += ')';
                }
                return name;
            } else {
                return 'Unnamed '+this.levelName();
            }
        },this);
        this.name = ko.computed(function() {
            if(this.useCustomName()) {
                return this.customName() || "unnamed "+this.levelName()+" "+this.indexLabel();
            } else {
                return this.standardName();
            }
        },this);
        this.header = ko.computed(function() {
            var label = this.indexLabel();
            if(this.useCustomName()) {
                return this.customName();
            } else if(label==='') {
                return '';
            } else {
                return this.standardName();
            }
        },this);

        this.path = ko.computed(function() {
            var i = Math.max(this.parentList.indexOf(this),0);
            if(this.isGap()) {
                return this.parent().path()+'g'+i;
            } else if(this.isStep()) {
                return this.parent().path()+'s'+i;
            } else {
                return 'p'+i;
            }
        },this);

        this.marks = ko.observable(1);
        this.realMarks = ko.computed(function() {
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

        this.startAddingGap = function() {
            q.addingPart({kind:'gap',parent:p, parentList: p.gaps, availableTypes: q.gapTypes});
        }
        this.startAddingStep = function() {
            q.addingPart({kind:'step',parent:p, parentList: p.steps, availableTypes: q.stepTypes});
        }

        this.showCorrectAnswer = ko.observable(true);
        this.showFeedbackIcon = ko.observable(true);

        this.variableReplacements = ko.observableArray([]);
        this.addVariableReplacement = function() {
            p.variableReplacements.push(new VariableReplacement(p));
        }
        this.deleteVariableReplacement = function(vr) {
            p.variableReplacements.remove(vr);
        }
        this.canMakeVariableReplacement = ko.computed(function() {
            return q.variables().length>0 && q.allParts().length>1;
        },this);
        this.adaptiveMarkingPenalty = ko.observable(0);

        this.variableReplacementStrategies = [
            {name: 'originalfirst', niceName: 'Try without replacements first'},
            {name: 'alwaysreplace', niceName: 'Always replace variables'}
        ];
        this.variableReplacementStrategy = ko.observable(this.variableReplacementStrategies[0])

        this.replacementRandomDependencies = ko.computed(function() {
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
        this.availableNextParts = ko.computed(function() {
            return p.parentList();
        },this);
        this.suggestGoingBack = ko.observable(false);

        this.scripts = [
            new Script('constructor','When the part is created','after','question/reference.html#term-when-the-part-is-created'),
            new Script('mark','Mark student\'s answer','instead','question/reference.html#term-mark-student-s-answer'),
            new Script('validate','Validate student\'s answer','instead','question/reference.html#term-validate-student-s-answer')
        ];

        this.use_custom_algorithm = ko.observable(false);
        this.customMarkingAlgorithm = ko.observable('');
        this.extendBaseMarkingAlgorithm = ko.observable(true);
        this.baseMarkingAlgorithm = ko.computed(function() {
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
            var base = new Numbas.marking.MarkingScript(this.baseMarkingAlgorithm());
            if(!this.use_custom_algorithm()) {
                return base;
            } else {
                try {
                    var script = new Numbas.marking.MarkingScript(this.customMarkingAlgorithm(), this.extendBaseMarkingAlgorithm() ? base : undefined);
                    this.markingScriptError('');
                    return script;
                } catch(e) {
                    this.markingScriptError(e.message);
                }
            }
        },this);

        this.unit_tests = ko.observableArray([]);
        this.marking_test = ko.observable(new MarkingTest(this,this.q.questionScope()));
        function subscribe_to_answer(mt) {
            mt.answer.subscribe(function() {
                mt.run();
            });
        }
        subscribe_to_answer(this.marking_test());
        this.marking_test.subscribe(subscribe_to_answer);
        ko.computed(function() {
            var mt = this.marking_test();
            mt.make_question();
        },this).extend({throttle:1000});

        this.run_all_tests = function() {
            p.unit_tests().forEach(function(mt) {
                mt.run();
            });
        }

        this.addUnitTest = function(test) {
            test.editing(false);
            p.unit_tests.push(test);
            p.marking_test(new MarkingTest(p,p.q.questionScope()));
        }

        this.types.map(function(t){p[t.name] = t.model});

        this.variable_references = ko.computed(function() {
            var o = [];
            o.push(new VariableReference({kind:'part',part:this,tab:'prompt',value:this.prompt,type:'html',description:'prompt'}));
            if(this.use_custom_algorithm() && this.markingScript()) {
                var s = this.markingScript();
                for(var x in s.notes) {
                    o.push(new VariableReference({kind:'part',part:this,tab:'marking-algorithm',value:s.notes[x].vars,type:'list',description:'marking algorithm note '+x}));
                }
            }
            this.type().variable_references().forEach(function(def) {
                def.kind = 'part';
                def.part = p;
                o.push(new VariableReference(def));
            });
            return o;
        },this);

        this.tabs = ko.computed(function() {
            var tabs = [];
            if(!this.isGap()) {
                tabs.push(new Editor.Tab('prompt','Prompt','blackboard',{visible:true,more_important:true,in_use: ko.computed(function() { return this.prompt()!=''},this)}));
            }

            if(this.type().has_marking_settings) {
                tabs.push(new Editor.Tab('marking-settings','Marking settings','pencil',{visible:true,more_important:true,in_use:true}));
            }
            var marking_algorithm_tab_in_use = ko.computed(function() {
                return this.use_custom_algorithm();
            },this);
            if(this.type().has_marks) {
                tabs.push(new Editor.Tab('marking-algorithm','Marking algorithm','ok',{in_use: marking_algorithm_tab_in_use}));
            }

            tabs = tabs.concat(this.type().tabs);

            var scripts_tab_in_use = ko.computed(function() {
                return this.scripts.some(function(s) { return s.active(); });
            },this);

            tabs.push(new Editor.Tab('scripts','Scripts','wrench',{in_use: scripts_tab_in_use}));

            var adaptive_marking_tab_in_use = ko.computed(function() {
                return this.variableReplacements().length>0;
            },this);

            tabs.push(new Editor.Tab('adaptivemarking','Adaptive marking','transfer',{in_use: adaptive_marking_tab_in_use}));

            if(!this.parent()) {
                var next_parts_tab_in_use = ko.computed(function() {
                    return this.nextParts().length>0;
                },this);
                tabs.push(new Editor.Tab('nextparts','Next parts','arrow-right'));
            }

            tabs = tabs.sort(function(a,b) {
                var ia = ko.unwrap(a.more_important);
                var ib = ko.unwrap(b.more_important);
                return ia ? ib ? 0 : -1 : ib ? 1 : 0;
            });

            return tabs;
        },this);
        this.realCurrentTab = ko.observable(this.tabs()[0]);
        this.currentTab = ko.computed({
            read: function() {
                if(this.tabs().indexOf(this.realCurrentTab())==-1) {
                    this.realCurrentTab(this.tabs()[0]);
                    return this.tabs()[0];
                }
                else {
                    return this.realCurrentTab();
                }
            },
            write: this.realCurrentTab
        },this);

        this.getTab = function(id) {
            return p.tabs().find(function(t){return t.id==id});
        }

        this.setTab = function(id) {
            return function() {
                var tab = p.getTab(id);
                p.currentTab(tab);
            }
        }



        if(data)
            this.load(data);
    }
    Part.prototype = {

        copy: function() {
            var data = this.toJSON();
            var p = new Part(this.q,this.parent(),this.parentList,data);
            this.parentList.push(p);
            this.q.currentPart(p);
        },

        replaceWithGapfill: function() {
            var p = this;
            var gapFill = new Part(this.q,this.parent(),this.parentList);
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
                showCorrectAnswer: this.showCorrectAnswer(),
                showFeedbackIcon: this.showFeedbackIcon(),
                scripts: {},
                variableReplacements: this.variableReplacements().map(function(vr){return vr.toJSON()}),
                variableReplacementStrategy: this.variableReplacementStrategy().name,
                nextParts: this.nextParts().map(function(np){ return np.toJSON(); }),
                suggestGoingBack: !this.isFirstPart() && this.suggestGoingBack(),
                adaptiveMarkingPenalty: this.adaptiveMarkingPenalty(),
                customMarkingAlgorithm: this.use_custom_algorithm() ? this.customMarkingAlgorithm() : '',
                extendBaseMarkingAlgorithm: this.use_custom_algorithm() ? this.extendBaseMarkingAlgorithm() : true,
                unitTests: this.unit_tests().map(function(t){ return t.toJSON() }),
                exploreObjective: this.exploreObjective() ? this.exploreObjective().name() : null,
            };

            if(this.prompt())
                o.prompt = this.prompt();
            if(this.steps().length)
            {
                o.stepsPenalty = this.stepsPenalty(),
                o.steps = this.steps().map(function(s){return s.toJSON();});
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
            for(var i=0;i<this.types.length;i++)
            {
                if(this.types[i].name == data.type.toLowerCase())
                    this.type(this.types[i]);
            }
            tryLoad(data,['marks','customName','prompt','stepsPenalty','showCorrectAnswer','showFeedbackIcon','customMarkingAlgorithm','extendBaseMarkingAlgorithm','adaptiveMarkingPenalty','suggestGoingBack'],this);
            this.use_custom_algorithm(this.customMarkingAlgorithm()!='');

            this.exploreObjective(this.q.objectives().find(function(o) { return o.name()==data.exploreObjective; }));

            if(data.steps)
            {
                var parentPart = this.isGap() ? this.parent() : this;
                data.steps.map(function(s) {
                    this.steps.push(new Part(this.q,this,this.steps,s));
                },parentPart);
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

            if(data.unitTests) {
                data.unitTests.forEach(function(dt) {
                    var test = new MarkingTest(p,p.q.questionScope());
                    test.editing(false);
                    test.open(false);
                    test.variables(dt.variables.map(function(v) {
                        try {
                            var value = Numbas.jme.builtinScope.evaluate(v.value);
                        } catch(e) {
                            value = null;
                        }
                        return {
                            name: v.name,
                            valueString: v.value,
                            value: value
                        }
                    }));
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

            try{
                this.type().load(data);
            }catch(e){
                console.log(e);
                console.log(e.stack);
                throw(e);
            }
        }
    };

    function VariableReplacement(part,data) {
        this.part = part;
        this.variable = ko.observable('');
        this.variableDisplay = ko.computed(function(){
            return this.part.q.variables().map(function(v){
                return v.name();
            });
        },this);
        this.replacement = ko.observable(null);
        this.must_go_first = ko.observable(false);
        this.availableParts = ko.computed(function() {
            var p = this.part
            return p.q.allParts().filter(function(p2){
                return p!=p2 && p2.type().has_marks && p2.parent()!=p;
            });
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
        this.availability_conditions = [
            {name: 'Always', id: 'always', value: ''},
            {name: 'When answer submitted', id: 'when-submitted', value: 'answered'},
            {name: 'When incorrect', id: 'when-incorrect', value: 'answered and credit<1'},
            {name: 'When correct', id: 'when-correct', value: 'answered and credit=1'},
            {name: 'Depending on expression', id: 'expression', value: this.availabilityExpression}
        ];
        this.availabilityCondition = ko.observable(this.availability_conditions[0]);
        this.penalty = ko.observable(null);
        this.penaltyAmount = ko.observable(0);
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
                penaltyAmount: this.penaltyAmount()
            };
        },
        load: function(data) {
            var np = this;
            if(!data) {
                return;
            }
            tryLoad(data,['rawLabel','penaltyAmount'],this);
            tryLoad(data,'availabilityCondition',this,'availabilityExpression');
            for(var i=0;i<this.availability_conditions.length;i++) {
                var condition = this.availability_conditions[i];
                if(ko.unwrap(condition.value)==this.availabilityExpression()) {
                    this.availabilityCondition(condition);
                    break;
                }
            }
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
        this.variables = ko.computed(function(){
            return this.np.part.q.variables().map(function(v){
                return v.name();
            }).sort();
        },this);

        this.variable = ko.observable('');
        this.definition = ko.observable('interpreted_answer');

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
            this.definition(data.definition || '');
        }
    };

    Numbas.marking.ignore_note_errors = true;

    function MarkingTest(part,scope) {
        var mt = this;
        this.part = part;
        this.editing = ko.observable(true);
        this.open = ko.observable(true).toggleable();
        this.name = ko.observable();
        this.displayName = ko.pureComputed(function() {
            return this.name() || 'Unnamed test';
        }, this);

        // Values of variables used in this test
        this.variables = ko.observableArray([]);

        // If editing, set variables to the current values in the question's variable preview
        ko.computed(function() {
            if(this.editing()) {
                var vs = [];
                this.part.q.allVariableGroups().forEach(function(g) {
                    g.variables().forEach(function(v) {
                        var value = v.value();
                        vs.push({
                            name: v.name(),
                            value: value,
                            valueString: value ? Numbas.jme.display.treeToJME({tok:value},{bareExpression:false}) : '',
                            toggleLocked: function() { v.toggleLocked(); },
                            locked: v.locked
                        });
                    });
                });
                this.variables(vs);
            }
        },this);

        this.remove = function() {
            // Remove this test from the parent part
            mt.part.unit_tests.remove(mt);
        }

        // "Student's answer" in this test
        this.answer = ko.observable({valid: false, value: undefined});

        // set answer for gapfill parts
        ko.computed(function() {
            if(this.editing()) {
                if(this.part.type().name=='gapfill') {
                    this.answer({
                        valid: this.part.gaps().every(function(g){return g.marking_test().answer().valid}), 
                        value: this.part.gaps().map(function(g) {
                            return g.marking_test().answer().value;
                        })
                    });
                }
            }
        }, this);

        // Marking notes generated by this test
        this.notes = ko.observableArray([]);

        // Get the marking note with the given name
        this.getNote = function(name) {
            return this.notes().filter(function(n){return n.name==name})[0];
        }

        // JME scope in which this test is evaluated
        this.scope = ko.observable(scope);

        // The result of running the marking script
        this.last_run = ko.observable(null);

        this.part.type.subscribe(function() {
            mt.answer({valid: false, value: undefined});
            mt.last_run(null);
        });

        this.question = ko.observable(null);
        this.current_question_instance = null;
        this.last_question_json = null;
        this.last_variables = null;
        this.question_error = ko.observable(null);
        this.make_question = function() {
            if(!mt.part.q.variablesReady()) {
                return;
            }
            try {
                var json = mt.part.q.toJSON();
                var variables = mt.variables().map(function(v){ return {name: v.name, value: v.value} });
                if(Numbas.util.objects_equal(json,mt.last_question_json) && Numbas.util.objects_equal(variables, mt.last_variables)) {
                    return mt.question();
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
                var promise = q.signals.on('ready').then(function() {
                    if(q!=mt.current_question_instance) {
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
        this.runtime_part = ko.computed(function() {
            var q = this.question();
            if(!q) {
                return;
            }
            return q.getPart(mt.part.path());
        }, this);
        
        // When something changes, run the marking script and store the result in `this.result`
        this.mark = function() {
            mt.answer();
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
                var answer = mt.answer();
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
                part.submit();
                var res = part.mark_answer(part.rawStudentAnswerAsJME(),part.getScope());
                var out = {script: part.markingScript, result: res, marking_result: part.marking_result, marks: part.marks};
                if(!res.state_valid.mark) {
                    out.error = 'This answer is not valid.';
                    var feedback = compile_feedback(Numbas.marking.finalise_state(res.states.mark), part.marks);
                    out.warnings = feedback.warnings;
                }
                mt.last_run(out);
            } catch(e) {
                mt.last_run({error: 'Error marking: '+e.message});
            };
        }
        this.run = function() {
            var q = mt.make_question();
            if(q) {
                q.signals.on('ready').then(function() {
                    mt.mark();
                });
            }
        }

        this.last_run_error = ko.computed(function() {
            if(this.last_run()) {
                return this.last_run().error;
            }
        },this);

        // When the script is evaluated, add new notes to the list and update existing ones
        ko.computed(function() {
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
                return;
            }
            var result = last_run.result;
            var script = last_run.script;

            var states = [];
            var existing_notes = {};

            // Look at notes we already know about, and if they're present in this result
            var notes = this.notes().slice();
            notes.forEach(function(note) {
                var missing = !(note.name in result.states);
                if(missing) {
                    if(mt.editing()) {
                        mt.notes.remove(note);
                    } else {
                        note.missing(missing);
                    }
                } 
                existing_notes[note.name] = note;
            });

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

                // Compile feedback messages
                var feedback = compile_feedback(Numbas.marking.finalise_state(result.states[x]), last_run.marks);

                // Save the results for this note
                note.note(script.notes[x]);
                note.value(result.values[x]);
                note.messages(feedback.messages);
                note.warnings(feedback.warnings);
                note.credit(feedback.credit);
                note.error(result.state_errors[x] ? result.state_errors[x].message : '');
                note.valid(result.state_valid[x]);
                note.missing(false);
            }
            var mark_note = existing_notes.mark;
            var marking_result = last_run.marking_result;
            mark_note.credit(marking_result.credit);
            mark_note.messages(marking_result.markingFeedback.map(function(m){ return m.message }));
            mark_note.warnings(marking_result.warnings);
        },this);

        // If this test is being edited, keep the "expected" values up to date
        ko.computed(function() {
            if(this.editing()) {
                this.setExpected();
            }
        },this).extend({throttle:100});

        // The marking notes, in alphabetical order by name
        this.sortedNotes = ko.computed(function() {
            var notes = this.notes().slice();
            notes.sort(function(a,b) {
                a = a.name;
                b = b.name;
                return a<b ? -1 : a>b ? 1 : 0;
            })
            return notes;
        },this);

        // Non-hidden notes. Only these notes count towards the test passing or not.
        this.shownNotes = ko.computed(function() {
            return this.notes().filter(function(n){ return n.show(); });
        },this);

        // Can this be saved as a unit test?
        // Only if there's at least one shown note.
        this.canCreateUnitTest = ko.computed(function() {
            return this.shownNotes().length>0;
        },this);

        // Notes whose results don't match the expected values
        this.failingNotes = ko.computed(function() {
            return this.shownNotes().filter(function(n){return n.missing() || !n.matchesExpected()});
        },this);

        // Notes which have gone missing since the test was set up
        // These might have been removed from the marking script
        this.missingNotes = ko.computed(function() {
            return this.shownNotes().filter(function(n){return n.missing()});
        },this);

        // Is this test passing? No if any notes are failing.
        this.passes = ko.computed(function() {
            return this.failingNotes().length==0;
        },this);


        this.tabs = [
            new Editor.Tab('variables','Variable values','text-background'),
            new Editor.Tab('notes','Feedback notes','text-background')
        ];

        this.getTab = function(id) {
            return mt.tabs.find(function(t){return t.id==id});
        }

        this.setTab = function(id) {
            return function() {
                var tab = mt.getTab(id);
                mt.currentTab(tab);
            }
        }
        this.currentTab = ko.observable(null);

        this.setTab('notes')();

        this.header = ko.computed(function() {
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

    function MarkingNote(name, in_unit_test) {
        var mn = this;
        this.name = name;

        var default_show_names = ['mark','interpreted_answer'];
        this.show = ko.observable(in_unit_test && default_show_names.contains(this.name)).toggleable();

        this.note = ko.observable(null);
        this.description = ko.computed(function() {
            var note = this.note();
            return note ? note.description : '';
        },this);

        this.missing = ko.observable(false);

        this.value = ko.observable(null);
        this.messages = ko.observableArray([]);
        this.warnings = ko.observableArray([]);
        this.error = ko.observable('');
        this.valid = ko.observable(true);
        this.credit = ko.observable(0);

        this.valueType = ko.computed(function() {
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
        this.expected.computedValue = ko.computed(function() {
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
        this.noMatchReason = ko.computed(function() {
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
            var differentMessages = this.messages().join('\n') != this.expected.messages().join('\n');
            var differentWarnings = this.warnings().join('\n') != this.expected.warnings().join('\n');
            var differentError = this.error() != this.expected.error();
            var differentValidity = this.valid() != this.expected.valid();
            var differentCredit = this.credit() != this.expected.credit();

            if(differentValue) {
                return 'value';
            } else if(differentMessages) {
                return 'messages';
            } else if(differentWarnings) {
                return 'warnings';
            } else if(differentError) {
                return this.error() ? this.expected.error() ? 'different-error' : 'unexpected-error' : 'missing-error';
            } else if(differentValidity) {
                return this.expected.valid() ? 'unexpected-invalid' : 'unexpected-invalid';
            } else if(differentCredit) {
                return 'credit';
            } else {
                return null;
            }
        },this);
        this.noMatchDescription = ko.computed(function() {
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

        this.matchesExpected = ko.computed(function() {
            return !this.noMatchReason();
        },this);
    }

    function compile_feedback(feedback, maxMarks) {
        var valid = true;
        var part = this;
        var end = false;
        var states = feedback.states.slice();
        var i=0;
        var lifts = [];
        var scale = 1;
        maxMarks = maxMarks===undefined ? 0 : maxMarks;

        var messages = [];
        var warnings = [];
        var credit = 0;

        function addCredit(change,message) {
            if(change<-credit) {
                change = -credit;
            }
            credit += change;
            change *= maxMarks;

            var message = message || '';
            if(Numbas.util.isNonemptyHTML(message)) {
                var marks = Math.abs(change);

                if(change>0)
                    message+='\n\n'+R('feedback.you were awarded',{count:marks});
                else if(change<0)
                    message+='\n\n'+R('feedback.taken away',{count:marks});
            }
            if(Numbas.util.isNonemptyHTML(message)) {
                messages.push(message);
            }
        }

        while(i<states.length) {
            var state = states[i];
            switch(state.op) {
                case 'set_credit':
                    addCredit(scale*state.credit-credit,state.message);
                    break;
                case 'multiply_credit':
                    addCredit((scale*state.factor-1)*credit,state.message);
                    break;
                case 'add_credit':
                    addCredit(scale*state.credit, state.message);
                    break;
                case 'sub_credit':
                    addCredit(-scale*state.credit, state.message);
                    break;
                case 'warning':
                    warnings.push(state.message);
                    break;
                case 'feedback':
                    messages.push(state.message);
                    break;
                case 'end':
                    if(lifts.length) {
                        while(i+1<states.length && states[i+1].op!='end_lift') {
                            i += 1;
                        }
                    } else {
                        end = true;
                        if(state.invalid) {
                            valid = false;
                        }
                    }
                    break;
                case 'start_lift':
                    lifts.push({credit: this.credit,scale:scale});
                    this.credit = 0;
                    scale = state.scale;
                    break;
                case 'end_lift':
                    var last_lift = lifts.pop();
                    var lift_credit = credit;
                    credit = last_lift.credit;
                    addCredit(lift_credit*last_lift.scale);
                    scale = last_lift.scale;
                    break;
            }
            i += 1;
            if(end) {
                break;
            }
        }

        return {
            valid: valid,
            credit: credit,
            messages: messages,
            warnings: warnings
        }
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
        this.variable_references = ko.computed(function() {
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


    Numbas.queueScript('knockout',[], function() {});
    var deps = ['jme-display','jme-variables','jme','editor-extras','marking','json', 'answer-widgets'];
    for(var i=0;i<item_json.numbasExtensions.length;i++) {
        var extension = item_json.numbasExtensions[i];
        if(extension.hasScript) {
            deps.push('extensions/'+extension.location+'/'+extension.location+'.js');
        }
    }
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
            $('.page-loading').hide();
            $('.page-error')
                .show()
                .find('.trace')
                    .html(e.message)
            ;
            throw(e);
        }
    });

    Mousetrap.bind(['ctrl+b','command+b'],function() {
        window.open(item_json.previewURL,item_json.previewWindow);
    });
});
