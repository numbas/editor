var viewModel;

$(document).ready(function() {
    var tryLoad = Editor.tryLoad;
    var tryLoadMatchingId = Editor.tryLoadMatchingId;

    var marking_reserved_names = Editor.custom_part_type.marking_reserved_names = ['path','studentanswer','settings','marks','parttype','gaps','steps','input_options'];

    function ChoiceMaker(useValues) {
        var cm = this;
        this.useValues = useValues;
        this.choices = ko.observableArray([]);
        this.valid_choices = ko.computed(function() {
            return this.choices().filter(function(c) { return c.valid(); });
        },this)
        this.add_choice = function() {
            var choice = {value: ko.observable(''), label: ko.observable('')};
            choice.valid = ko.computed(function() {
                return !(choice.value()=='' && this.useValues) && choice.label()!='';
            },this);
            cm.choices.push(choice);
            return choice;
        }
        this.delete_choice = function(choice) {
            cm.choices.remove(choice);
        }
    }
    ChoiceMaker.prototype = {
        load: function(data) {
            var m = this;
            data.map(function(c) {
                var choice = m.add_choice();
                if(m.useValues) {
                    tryLoad(c,['value','label'],choice);
                } else {
                    choice.label(c);
                }
            });
        },
        toJSON: function(out) {
            var cm = this;
            out.choices = this.choices().map(function(c) {
                if(cm.useValues) {
                    return {value: c.value(), label: c.label()}
                } else {
                    return c.label();
                }
            });
        },
        valid: function() {
            return this.choices().length>0 && this.choices().every(function(c) {return c.valid()});
        }
    };

    ko.components.register('choice-maker',{
        viewModel: function(params) {
            var vm = this;
            this.model = params.model;
            this.useValues = this.model.useValues || false;
            this.disable = params.disable;
            this.valid = function() {
                return vm.model.valid();
            }
        },
        template: {element: 'choice-maker-template'}
    });

    Editor.custom_part_type.input_widgets = [
        {
            'name': 'string', 
            'niceName': 'String',
            definition: [
                {
                    name: 'allowEmpty',
                    label: 'Allow student to submit an empty string?',
                    input_type: 'checkbox',
                    default_value: false
                }
            ]
        },
        {
            'name': 'number', 
            'niceName': 'Number',
            definition: [
                {
                    name: 'allowedNotationStyles',
                    label: 'Allowed notation styles',
                    input_type: 'number_notation_styles',
                    default_value: ['plain','en','si-en']
                },
                {
                    name: 'allowFractions',
                    label: 'Allow fractions?',
                    input_type: 'checkbox',
                    default_value: true
                }
            ]
        },
        {
            'name': 'jme', 
            'niceName': 'Mathematical expression',
            definition: [
                {
                    name: 'showPreview',
                    label: 'Show preview of student\'s answer?',
                    input_type: 'checkbox',
                    default_value: true
                }
            ]
        },
        {
            'name': 'matrix', 
            'niceName': 'Matrix',
            definition: [
                {
                    name: 'allowResize',
                    label: 'Allow student to change size of matrix??',
                    input_type: 'checkbox',
                    default_value: true
                },
                {
                    name: 'numRows',
                    label: 'Number of rows',
                    input_type: 'string',
                    default_value: 1
                },
                {
                    name: 'numColumns',
                    label: 'Number of columns',
                    input_type: 'string',
                    default_value: 1
                },
                {
                    name: 'parseCells',
                    label: 'Parse cell values?',
                    input_type: 'checkbox',
                    default_value: true
                },
                {
                    name: 'allowedNotationStyles',
                    label: 'Allowed notation styles',
                    input_type: 'number_notation_styles',
                    default_value: ['plain','en','si-en']
                },
                {
                    name: 'allowFractions',
                    label: 'Allow fractions?',
                    input_type: 'checkbox',
                    default_value: true
                },
                {
                    name: 'showBrackets',
                    label: 'Show brackets?',
                    input_type: 'checkbox',
                    default_value: true
                },
                {
                    name: 'rowHeaders',
                    label: 'Row headers',
                    input_type: 'mathematical_expression',
                    default_value: []
                },
                {
                    name: 'columnHeaders',
                    label: 'Column headers',
                    input_type: 'mathematical_expression',
                    default_value: []
                }
            ]
        },
        {
            'name': 'radios', 
            'niceName': 'Radio buttons',
            definition: [
                {
                    name: 'choices',
                    label: 'Choices',
                    input_type: 'choice_maker',
                    default_value: []
                }
            ]
        },
        {
            'name': 'checkboxes', 
            'niceName': 'Choose several from a list',
            definition: [
                {
                    name: 'choices',
                    label: 'Choices',
                    input_type: 'choice_maker',
                    default_value: []
                }
            ]
        },
        {
            'name': 'dropdown', 
            'niceName': 'Drop-down box',
            definition: [
                {
                    name: 'choices',
                    label: 'Choices',
                    input_type: 'choice_maker',
                    default_value: []
                }
            ]
        }
    ];

    function InputWidget(pt,data) {
        this.name = data.name;
        this.niceName = data.niceName;
        this.pt = pt;
        this.make_settings(data.definition);
    }
    InputWidget.prototype = {
        make_settings: function(definition) {
            var settings = this.settings = [];
            definition.forEach(function(def) {
                var value;

                var jme_default_value = Numbas.jme.display.treeToJME({tok:Numbas.jme.wrapValue(def.default_value)},{ignorestringattributes: true});
                var type_hints = {
                    'choose_several': 'list of booleans',
                    'list_of_strings': 'list of strings',
                    'choice_maker': 'list of strings',
                    'number_notation_styles': 'list of number notation styles',
                    'string': 'string',
                    'mathematical_expression': 'string',
                    'checkbox': 'boolean',
                    'dropdown': 'string',
                    'code': 'string',
                    'percent': 'number',
                    'html': 'string'
                }
                var type_hint = type_hints[def.input_type];

                switch(def.input_type) {
                    case 'choose_several':
                        value = new MaybeStaticOption(
                            ko.observableArray(def.data.choices.filter(function(c,i){return def.default_value[i]}).map(function(c){return c.value})),
                            jme_default_value
                        );
                        break;
                    case 'list_of_strings':
                        value = new MaybeStaticOption(
                            ko.observableArray(def.default_value),
                            jme_default_value
                        );
                        break;
                    case 'choice_maker':
                        var cm = new ChoiceMaker();
                        value = new MaybeStaticOption(
                            cm,
                            jme_default_value,
                            function(v) {
                                var o = {};
                                v.toJSON(o);
                                return o.choices;
                            },
                            function(data) {
                                cm.load(data);
                            }
                        );
                        break;
                    case 'number_notation_styles':
                        var static_allowedNotationStyles = ko.observableArray(Editor.numberNotationStyles.filter(function(s){return def.default_value.contains(s.code)}));
                        value = new MaybeStaticOption(
                            static_allowedNotationStyles,
                            jme_default_value,
                            function(v) {
                                return v.map(function(s){return s.code});
                            },
                            function(d) {
                                return Editor.numberNotationStyles.filter(function(s){return d.contains(s.code)});
                            }
                        );
                        break;
                    default:
                        value = new MaybeStaticOption(def.default_value, jme_default_value);
                }

                settings.push({
                    name: def.name,
                    input_type: def.input_type,
                    type_hint: type_hint,
                    label: def.label,
                    data: def.data || {},
                    value: value,
                    help_url: def.help_url || '',
                    hint: def.hint || ''
                });
            });

        },
        toJSON: function(data) {
            this.settings.forEach(function(s) {
                data[s.name] = s.value.toJSON();
            });
            return data;
        },
        load: function(data) {
            this.settings.forEach(function(s) {
                s.value.load(data[s.name]);
            });
        }
    };

    function MaybeStaticOption(static_value, dynamic_value, save_staticFn, load_staticFn) {
        this.static = ko.observable(true);
        this.static_value = ko.isObservable(static_value) || typeof(static_value)=='object' ? static_value : ko.observable(static_value);
        this.isNumber = typeof(ko.unwrap(static_value))=='number';
        this.dynamic_value = ko.isObservable(dynamic_value) ? dynamic_value : ko.observable(dynamic_value);
        this.save_staticFn = save_staticFn;
        this.load_staticFn = load_staticFn;
    }
    MaybeStaticOption.prototype = {
        load: function(data) {
            if(!data) {
                return;
            }
            if(typeof data == 'string') {
                data = {static: false, value: data};
            }
            tryLoad(data,['static'],this);
            if(this.static()) {
                var value = data.value;
                if(this.load_staticFn && value!==undefined) {
                    value = this.load_staticFn(value);
                }
                if(ko.isObservable(this.static_value)) {
                    this.static_value(value);
                }
            } else {
                this.dynamic_value(data.value);
            }
        },
        toJSON: function() {
            var static = this.static();
            var value = static ? ko.unwrap(this.static_value) : this.dynamic_value();
            if(static && this.isNumber) {
                value = parseFloat(value);
            }
            if(static && this.save_staticFn) {
                value = this.save_staticFn(value);
            }
            return {
                static: static,
                value: value
            }
        }
    };

    function Extension(cpt, data) {
        var ext = this;

        this.cpt = cpt;

        ["location","name","edit_url","hasScript","url","script_url","author","pk","scripts"].forEach(function(k) {
            ext[k] = data[k];
        });

        this.used = ko.observable(false);
        this.loading = ko.observable(false);
        this.loaded = ko.observable(false);
        this.error = ko.observable(false);

        ko.computed(function() {
            try {
                if(this.used()) {
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
                    this.cpt.find_input_widgets();
                }
            } catch(e) {
                console.error(e);
            }
        },this);
    }
    Extension.prototype = {
        load: function() {
            this.error(false);
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
            return Promise.all(script_promises).then(function() {
                Numbas.activateExtension(ext.location);
                ext.loaded(true);
            }).catch(function(err) {
                console.error(err);
                ext.error(true);
            }).finally(function() {
                ext.loading(false);
            });
        }
    };


    var CustomPartType = Editor.custom_part_type.CustomPartType = function(data, save_url, set_access_url) {
        var pt = this;

        this.marking_scope = new Numbas.marking.StatefulScope([Numbas.jme.builtinScope]);

        this.save_url = save_url;
        this.set_access_url = set_access_url;

        this.pk = data.source.pk;
        this.name = ko.observable('');
        this.short_name = ko.observable('');
        this.description = ko.observable('');
        this.help_url = ko.observable('');
        this.extensions = ko.observableArray([]);

        this.mainTabber = new Editor.Tabber([
            new Editor.Tab('description','Description','cog'),
            new Editor.Tab('extensions','Required extensions','transfer'),
            new Editor.Tab('settings','Part settings','wrench'),
            new Editor.Tab('input','Answer input','pencil'),
            new Editor.Tab('marking','Marking','check'),
            new Editor.Tab('access','Access','lock')
        ]);
        for(var i=0;i<item_json.numbasExtensions.length;i++) {
            var ext = item_json.numbasExtensions[i];
            this.extensions.push(new Extension(this,ext));
        }
        this.usedExtensions = ko.computed(function() {
            return this.extensions().filter(function(e){return e.used()});
        },this);

        this.edit_name = pt.mainTabber.setTab('description');
        
        this.input_widgets = ko.observableArray(Editor.custom_part_type.input_widgets.map(function(data) {
            return new InputWidget(pt,data);
        }));
        this.find_input_widgets();
        this.input_widget = ko.observable(this.input_widgets()[0])
        this.input_options = {
            correctAnswer: ko.observable(''),
            hint: new MaybeStaticOption('','""')
        }

        this.can_be_gap = ko.observable(true);
        this.can_be_step = ko.observable(true);

        this.settings = ko.observableArray([]);

        this.add_setting = function(type) {
            var setting = new Setting(pt);
            setting.set_type(type.name);
            pt.settings.push(setting);
            return setting;
        };

        this.remove_setting = function(setting) {
            pt.settings.remove(setting);
        };

        this.marking_notes = ko.observableArray([]);
        var _current_marking_note = ko.observable(null);
        this.current_marking_note = ko.computed({
            read: function() {
                var n = _current_marking_note();
                if(!pt.marking_notes().contains(n)) {
                    return pt.marking_notes()[0];
                } else {
                    return n;
                }
            },
            write: function(v) {
                return _current_marking_note(v);
            }
        },this);
        this.getNote = function(name) {
            var notes = this.marking_notes();
            for(var i=0;i<notes.length;i++) {
                if(notes[i].name().toLowerCase().trim()==name.toLowerCase().trim()) {
                    return notes[i];
                }
            }
        }
        this.add_marking_note = function() {
            var note = new Note(pt);
            pt.marking_notes.push(note);
            pt.current_marking_note(note);
            return note;
        };
        this.remove_marking_note = function(note) {
            if(!note.required()) {
                pt.marking_notes.remove(note);
            }
        }

        this.marking_note_names = ko.computed(function() {
            return this.marking_notes().map(function(note) {
                return note.name();
            });
        },this);
        
        this.marking_defined_names = ko.computed(function() {
            return this.marking_note_names().concat(Editor.custom_part_type.marking_reserved_names);
        }, this);

        this.marking_script = ko.computed(function() {
            return this.marking_notes().map(function(note) {
                return note.name()+':\n'+note.definition();
            }).join('\n\n');
        },this);

        this.published = ko.observable(false);

        if(data) {
            this.load_promise = this.load(data);
        } else {
            this.load_promise = Promise.succeed(true);
        }

        this.load_promise.then(() => {
            this.load_state();

            var required_notes = [{name: 'mark', description: 'This is the main marking note. It should award credit and provide feedback based on the student\'s answer.'},{name: 'interpreted_answer', description: 'A value representing the student\'s answer to this part.'}];
            required_notes.forEach(function(def) {
                var note = pt.getNote(def.name);
                if(!note) {
                    var note = new Note(pt);
                    note.name(def.name);
                    pt.marking_notes.push(note);
                }
                note.description(def.description);
                note.required(true);
            });

            this.init_tasks();

            this.ready_to_use = ko.computed(function() {
                return this.task_list.all_sections_completed();
            }, this);

            this.canPublish = ko.computed(function() {
                return !this.published() && this.ready_to_use();
            }, this);

            if(item_json.editable) {
                //access control stuff
                this.access_rights = ko.observableArray(item_json.access_rights.map(function(d){
                    var access = new Editor.UserAccess(pt,d.user)
                    access.access_level(d.access_level);
                    return access;
                }));

                this.access_data = ko.pureComputed(function() {
                    return {
                        user_ids: pt.access_rights().map(function(u){return u.id}),
                        access_levels: pt.access_rights().map(function(u){return u.access_level()})
                    }
                });
                this.saveAccess = new Editor.Saver(this.access_data,function(data) {
                    return Editor.post_json(pt.set_access_url, data);
                });
                this.userAccessSearch = ko.observable('');

                this.addUserAccess = function(data) {
                    var access_rights = pt.access_rights();
                    for(var i=0; i<access_rights.length; i++) {
                        if(access_rights[i].id == data.id) {
                            noty({
                                text: "That user is already in the access list.",
                                type: 'error',
                            });
                            return;
                        }
                    }
                    var access = new Editor.UserAccess(pt,data);
                    pt.access_rights.push(access);
                };
            }


            this.init_save();
        });
    }
    CustomPartType.prototype = {
        find_input_widgets: function() {
            var cpt = this;
            Object.values(Numbas.answer_widgets.custom_widgets).forEach(function(w) {
                if(!cpt.input_widgets().find(function(iw) { return w.name==iw.name; })) {
                    cpt.input_widgets.push(new InputWidget(cpt, {
                        name: w.name,
                        niceName: w.niceName,
                        definition: w.options_definition
                    }));
                }
            });
        },

        load_state: function() {
            if(window.history !== undefined) {
                var state = window.history.state || {};
                if('currentTab' in state) {
                    this.mainTabber.setTab(state.currentTab)();
                }
            }
            Editor.computedReplaceState('currentTab',ko.computed(function() {
                var tab = this.mainTabber.currentTab();
                return tab ? tab.id : '';
            },this));
        },

        load: async function(data) {
            var pt = this;
            tryLoad(data,['name','short_name','description','help_url','published'],this);

            var extensionPromises = [];
            if('extensions' in data) {
                this.extensions().map(function(e) {
                    if(data.extensions.indexOf(e.location)>=0) {
                        e.used(true);
                        extensionPromises.push(e.load());
                    }
                });
            }
            await Promise.all(extensionPromises);
            if('settings' in data && data.settings.forEach) {
                data.settings.forEach(function(sd) {
                    var setting = new Setting(pt, sd);
                    pt.settings.push(setting);
                });
            }
            if('marking_notes' in data) {
                data.marking_notes.forEach(function(d) {
                    var note = new Note(pt,d);
                    pt.marking_notes.push(note);
                });
                pt.current_marking_note(pt.marking_notes()[0]);
            }

            tryLoadMatchingId(data,'input_widget','name',this.input_widgets(),this);
            if('input_options' in data) {
                tryLoad(data.input_options,['correctAnswer'],this.input_options);
                this.input_options.hint.load(data.input_options.hint);
                var widget = this.input_widget();
                this.input_widget().load(data.input_options);
            }
        },

        init_tasks: function() {
            this.section_tasks = {
                'description': [
                    Editor.nonempty_task('Give the part type a name.',this.name, '#name-input'),
                    Editor.nonempty_task('Fill out the description.',this.description,'#description-input .wmTextArea'),
                ],
                'settings': [
                    {text: 'Add at least one part setting.', done: ko.computed(function() {return this.settings().length>0},this)},
                    {
                        text: 'Complete every setting.',
                        done: ko.computed(function() {
                            return this.settings().every(function(s) {return s.valid()});
                        }, this)
                    }
                ],
                'input': [
                    Editor.valid_jme_task('Set the expected answer.', this.input_options.correctAnswer),
                    Editor.valid_jme_task('Set the input hint.', this.input_options.hint),
                ],
                'marking': [
                    {text: 'Set up the <code>mark</code> note.', done: ko.computed(function(){ return this.getNote('mark').valid() },this), switch_action: function() {pt.current_marking_note(pt.getNote('mark'))}},
                    {text: 'Set up the <code>interpreted_answer</code> note.', done: ko.computed(function(){ return this.getNote('interpreted_answer').valid() },this), switch_action: function() {pt.current_marking_note(pt.getNote('interpreted_answer'))}}
                ]
            }

            this.task_list = new Editor.TaskList(this.section_tasks);
        },

        init_save: function() {
            var pt = this;
            this.autoSave = new Editor.Saver(
                function() {
                    return pt.toJSON();
                },
                function(data) {
                    var promise = Editor.post_json(pt.save_url, data)
                        .catch(function(response,type,message) {
                            console.error('Error saving:',message);
                        })
                    ;
                    return promise;
                }
            );
        },

        toJSON: function() {
            var input_options = {
                correctAnswer: this.input_options.correctAnswer(),
                hint: this.input_options.hint.toJSON()
            };
            this.input_widget().toJSON(input_options);

            return {
                'name': this.name(),
                'short_name': this.short_name(),
                'description': this.description(),
                'help_url': this.help_url(),
                'input_widget': this.input_widget().name,
                'input_options': JSON.stringify(input_options),
                'can_be_gap': this.can_be_gap(),
                'can_be_step': this.can_be_step(),
                'settings': JSON.stringify(this.settings().map(function(s){ return s.toJSON() })),
                'marking_script': this.marking_script(),
                'marking_notes': JSON.stringify(this.marking_notes().map(function(n){ return n.toJSON() })),
                'ready_to_use': this.ready_to_use(),
                'extensions': this.usedExtensions().map(function(e){return e.pk})
            }
        }
    }

    Editor.custom_part_type.setting_types = [
        {
            name: 'string',
            niceName: 'String',
            model: function() {
                return {
                    'default_value': ko.observable(''),
                    subvars: ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default_value','subvars'],this);
            }
        },
        {
            name: 'mathematical_expression',
            niceName: 'Mathematical expression',
            model: function() {
                return {
                    'default_value': ko.observable(''),
                    subvars: ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default_value','subvars'],this);
            }
        },
        {
            name: 'checkbox',
            niceName: 'Checkbox',
            model: function() {
                return {
                    'default_value': ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
            },
            load: function(data) {
                tryLoad(data,'default_value',this);
            }
        },
        {
            name: 'dropdown',
            niceName: 'Drop-down box',
            model: function() {
                var model = {
                    default_value: ko.observable(''),
                    choice_maker: new ChoiceMaker(true)
                };
                return model;
            },
            toJSON: function(data) {
                var def = this.default_value();
                data.default_value = def ? def.value() : null;
                this.choice_maker.toJSON(data);
            },
            load: function(data) {
                var m = this;
                this.choice_maker.load(data.choices);
                tryLoadMatchingId(data,'default_value','value',this.choice_maker.choices(),this);
            },
            valid: function() {
                return this.choice_maker.valid();
            }
        },
        {
            name: 'choose_several',
            niceName: 'Choose one or more',
            model: function() {
                var model = {
                    choices: ko.observableArray([])
                };
                model.valid_choices = ko.computed(function() {
                    return model.choices().filter(function(c) { return c.valid(); });
                })
                model.add_choice = function() {
                    var choice = {value: ko.observable(''), label: ko.observable(''), default_value: ko.observable(false)};
                    choice.valid = ko.computed(function() {
                        return choice.value()!='' && choice.label();
                    });
                    model.choices.push(choice);
                    return choice;
                }
                return model;
            },
            toJSON: function(data) {
                data.choices = this.choices().map(function(c) {
                    return {value: c.value(), label: c.label(), default_value: c.default_value()}
                });
            },
            load: function(data) {
                var m = this;
                data.choices.map(function(c) {
                    var choice = m.add_choice();
                    tryLoad(c,['value','label','default_value'],choice);
                });
            },
            valid: function() {
                return this.choices().length>0 && this.choices().every(function(c) {return c.valid()});
            }
        },
        {
            name: 'code',
            niceName: 'JME code',
            model: function() {
                return {
                    default_value: ko.observable(''),
                    evaluate: ko.observable(false)
                }
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
                data.evaluate = this.evaluate();
            },
            load: function(data) {
                tryLoad(data,['default_value','evaluate'],this);
            }
        },
        {
            name: 'percent',
            niceName: 'Percentage',
            model: function() {
                return {
                    default_value: ko.observable(0)
                }
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
            },
            load: function(data) {
                tryLoad(data,'default_value',this);
            }
        },
        {
            name: 'html',
            niceName: 'HTML content',
            model: function() {
                return {
                    default_value: ko.observable(''),
                    subvars: ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default_value','subvars'],this);
            }
        },
        {
            name: 'list_of_strings',
            niceName: 'List of strings',
            model: function() {
                return {
                    default_value: ko.observableArray([]),
                    subvars: ko.observable(false)
                }
            },
            toJSON: function(data) {
                data.default_value = this.default_value();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default_value','subvars'],this);
            }
        }
    ];

    function SettingType(setting,data) {
        this.name = data.name;
        this.niceName = data.niceName;
        this.setting = setting;
        this.model = data.model ? data.model(setting) : {};
        this.toJSONFn = data.toJSON || function() {return {}};
        this.loadFn = data.load || function() {};
        this.validFn = data.valid || function() { return true };
    }
    SettingType.prototype = {
        toJSON: function(data) {
            return this.toJSONFn.apply(this.model,[data,this.setting]);
        },
        load: function(data) {
            return this.loadFn.apply(this.model,[data,this.setting]);
        },
        valid: function() {
            return this.validFn.apply(this.model);
        }
    };

    var Setting = Editor.custom_part_type.Setting = function(pt, data) {
        this.pt = pt;
        data = data || {};
        var s = this;

        this.name = ko.observable('');

        this.nameError = ko.computed(function() {
            var name = this.name().toLowerCase();
            if(name=='')
                return 'A name is required';

            var settings = pt.settings();
            for(var i=0;i<settings.length;i++) {
                var setting = settings[i];
                if(setting!=this && setting.name().toLowerCase()==name)
                    return 'There\'s more than one setting with this name.';
            }

            return '';
        },this);

        this.label = ko.observable('');
        this.help_url = ko.observable('');
        this.hint = ko.observable('');
        this.input_types = Editor.custom_part_type.setting_types.map(function(data) {
            return new SettingType(s,data);
        });
        this.input_type = ko.observable(this.input_types[0]);

        this.valid = ko.computed(function() {
            return !this.nameError() && this.label() && this.input_type().valid();
        }, this);

        this.load(data);
    };
    Setting.prototype = {
        set_type: function(name) {
            for(var i=0;i<this.input_types.length;i++) {
                if(this.input_types[i].name == name) {
                    this.input_type(this.input_types[i]);
                    return;
                }
            }
        },

        canMove: function(direction) {
            var parentList = this.pt.settings();
            switch(direction) {
                case 'up':
                    return parentList.indexOf(this)>0;
                case 'down':
                    return parentList.indexOf(this)<parentList.length-1;
            }
        },

        moveUp: function() {
            var parentList = this.pt.settings;
            var i = parentList.indexOf(this);
            if(i>0) {
                parentList.remove(this);
                ko.tasks.runEarly();
                parentList.splice(i-1,0,this);
            }
        },

        moveDown: function() {
            var parentList = this.pt.settings;
            var i = parentList.indexOf(this);
            parentList.remove(this);
            ko.tasks.runEarly();
            parentList.splice(i+1,0,this);
        },

        toJSON: function() {
            var out = {
                name: this.name(),
                label: this.label(),
                help_url: this.help_url(),
                hint: this.hint(),
                input_type: this.input_type().name
            }
            this.input_type().toJSON(out);
            return out;
        },
        load: function(data) {
            tryLoad(data,['name','label','help_url','hint'],this);
            this.set_type(data.input_type);
            this.input_type().load(data);
        }
    };

    var re_note_name = /^\$?[a-zA-Z_][a-zA-Z0-9_]*'*/i;

    var Note = Editor.custom_part_type.Note = function(pt,data) {
        this.pt = pt;

        this.required = ko.observable(false);

        this._name = ko.observable('');
        this.name = ko.computed({
            read: function() {
                return this._name().trim();
            },
            write: function(v) {
                return this._name(v);
            }
        },this);

        this.nameError = ko.computed(function() {
            var name = this.name().toLowerCase();
            if(name=='')
                return '';

            var notes = pt.marking_notes();
            for(var i=0;i<notes.length;i++) {
                var note = notes[i];
                if(note!=this && note.name().toLowerCase()==name)
                    return 'There\'s already a marking note with this name.';
            }

            if(!re_note_name.test(name)) {
                return 'This name is invalid.';
            }


            var tokens = Numbas.jme.tokenise(name);
            if(tokens.length != 1) {
                return 'The name <code>'+name+'</code> is invalid.';
            }
            if(tokens[0].type != 'name') {
                return 'The name <code>'+name+'</code> is reserved.';
            }

            if(typeof Numbas.jme.builtinScope.getVariable(name) !== 'undefined'){
                return 'The name <code>'+name+'</code> is reserved.';
            }

            return '';
        },this);

        this.description = ko.observable('');

        this.definition = ko.observable('');
        this.definitionError = ko.observable('');

        this.definition_tree = ko.computed(function() {
            try {
                var tree = Numbas.jme.compile(this.definition());
                this.definitionError('');
                return tree;
            } catch(e) {
                this.definitionError(e.message);
                return null;
            }
        },this);

        this.dependencies = ko.computed(function() {
            if(this.definitionError() || !this.definition_tree()) {
                return [];
            }
            var vars = Numbas.jme.findvars(this.definition_tree(), [], pt.marking_scope);
            var note_names = pt.marking_notes().map(function(n) { return n.name().toLowerCase() });
            return vars
                .filter(function(name) { return !marking_reserved_names.contains(name.toLowerCase()) })
                .map(function(name) {
                    note = pt.getNote(name);
                    return {name:name, exists: note_names.contains(name), note: note, title: name, go_to: function() {
                        var note = this.note;
                        if(!note) {
                            note = pt.add_marking_note();
                            note.name(this.name);
                        }
                        pt.current_marking_note(note);
                    }};
                })
            ;
        },this);

        this.dependencyError = ko.computed(function() {
            return !this.dependencies().every(function(d){ return d.exists; });
        }, this);

        this.valid = ko.computed(function() {
            return !this.nameError() && this.definition_tree() && !this.dependencyError();
        }, this);

        this.used_by = ko.computed(function() {
            var n = this;
            return pt.marking_notes().filter(function(note) {
                var deps = note.dependencies();
                for(var i=0;i<deps.length;i++) {
                    if(deps[i].name.toLowerCase() == n.name().toLowerCase()) {
                        return true;
                    }
                }
            });
        },this);

        if(data) {
            this.load(data);
        }
    }
    Note.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                description: this.description(),
                definition: this.definition()
            }
        },
        load: function(data) {
            tryLoad(data,['name','description','definition'],this);
        }
    }

    Numbas.queueScript('knockout',[],function() {});
    var deps = ['jme-display','jme','answer-widgets'];
    Numbas.queueScript('start-editor',deps, async function() {
        Numbas.display_util.set_jme_scope(document.body, Numbas.jme.builtinScope);
        try {
            var item_json = window.item_json;
            viewModel = new CustomPartType(item_json.data, item_json.save_url, item_json.set_access_url);
            await viewModel.load_promise;
            ko.options.deferUpdates = true;
            ko.applyBindings(viewModel);
            try {
                document.body.classList.add('loaded');
            } catch(e) {
                document.body.className += ' loaded';
            }
        } catch(e) {
            $('.page-loading').hide();
            $('.page-error')
                .show()
                .find('.trace')
                    .html(e.message)
            ;
            throw(e);
        }
    });
});
