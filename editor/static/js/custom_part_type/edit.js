var viewModel;

$(document).ready(function() {
    var tryLoad = Editor.tryLoad;
    var tryLoadMatchingId = Editor.tryLoadMatchingId;

    var reserved_names = ['path','studentanswer','settings','marks','parttype','gaps','steps'];

    ko.components.register('undefined-variable-warning', {
        viewModel: function(params) {
            this.expr = params.expr;
            this.other_vars = params.vars || [];
            this.error = ko.computed(function() {
                var expr = ko.unwrap(this.expr);
                try {
                    var vars = Numbas.jme.findvars(Numbas.jme.compile(expr));
                } catch(e) {
                    return '';
                }
                var defined_vars = reserved_names.concat(ko.unwrap(this.other_vars));
                var bad_vars = vars.filter(function(name) {
                    return !defined_vars.contains(name);
                });
                if(bad_vars.length==1) {
                    return 'The variable <code>'+bad_vars[0]+'</code> is not defined.';
                } else if(bad_vars.length>1) {
                    bad_vars.sort();
                    bad_vars = bad_vars.map(function(x) { return '<code>'+x+'</code>' });
                    var list = bad_vars.slice(0,bad_vars.length-1).join(', ')+' and '+bad_vars[bad_vars.length-1];
                    return 'The variables '+list+' are not defined.';
                } else {
                    return '';
                }
            },this);
        },
        template: '\
            <div data-bind="visible: error" class="alert alert-danger"><div data-bind="html: error"></div></div>\
        '
    });


    Editor.custom_part_type.input_widgets = [
        {
            'name': 'string', 
            'niceName': 'String',
            model: function() {
                return {};
            },
            load: function(data) {},
            toJSON: function() {}
        },
        {
            'name': 'number', 
            'niceName': 'Number',
            model: function() {
                return {};
            },
            load: function(data) {},
            toJSON: function() {}
        },
        {
            'name': 'jme', 
            'niceName': 'Mathematical expression',
            model: function() {
                return {};
            },
            load: function(data) {},
            toJSON: function() {}
        },
        {
            'name': 'matrix', 
            'niceName': 'Matrix',
            model: function() {
                return {};
            },
            load: function(data) {},
            toJSON: function() {}
        },
        {
            'name': 'radios', 
            'niceName': 'Radio buttons',
            model: function() {
                return {choices: ko.observable('')};
            },
            load: function(data) {
                tryLoad(data,['choices'],this);
            },
            toJSON: function(data) {
                data.choices = this.choices();
            }
        },
        {
            'name': 'checkboxes', 
            'niceName': 'Choose several from a list',
            model: function() {
                return {choices: ko.observable('')};
            },
            load: function(data) {
                tryLoad(data,['choices'],this);
            },
            toJSON: function(data) {
                data.choices = this.choices();
            }
        },
        {
            'name': 'dropdown', 
            'niceName': 'Drop-down box',
            model: function() {
                return {choices: ko.observable('')};
            },
            load: function(data) {
                tryLoad(data,['choices'],this);
            },
            toJSON: function(data) {
                data.choices = this.choices();
            }
        }
    ];

    function InputWidget(pt,data) {
        this.name = data.name;
        this.niceName = data.niceName;
        this.pt = pt;
        this.model = data.model ? data.model(pt) : {};
        this.toJSONFn = data.toJSON || function(data) {};
        this.loadFn = data.load || function() {};
    }
    InputWidget.prototype = {
        toJSON: function(data) {
            return this.toJSONFn.apply(this.model,[data,this.pt]);
        },
        load: function(data) {
            return this.loadFn.apply(this.model,[data,this.pt]);
        }
    };


    var CustomPartType = Editor.custom_part_type.CustomPartType = function(data, save_url) {
        var pt = this;

        this.save_url = save_url;

        this.name = ko.observable('');
        this.short_name = ko.observable('');
        this.description = ko.observable('');

        this.tabs = [
            new Editor.Tab('description','Description','cog'),
            new Editor.Tab('settings','Part settings','wrench'),
            new Editor.Tab('input','Answer input','pencil'),
            new Editor.Tab('marking','Marking','check')
        ];
        this.getTab = function(id) {
            return pt.tabs.find(function(t){return t.id==id});
        }
        this.setTab = function(id) {
            return function() {
                var tab = pt.getTab(id);
                pt.currentTab(tab);
            }
        }

        this.currentTab = ko.observable(this.tabs[0]);

        this.edit_name = function() {
            pt.setTab('description')();
        }
        
        this.input_widgets = Editor.custom_part_type.input_widgets.map(function(data) {
            return new InputWidget(pt,data);
        });
        this.input_widget = ko.observable(Editor.custom_part_type.input_widgets[0]);
        this.input_options = {
            correctAnswer: ko.observable(''),
            hint: ko.observable('""')
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

        this.marking_script = ko.computed(function() {
            return this.marking_notes().map(function(note) {
                return note.name()+':\n'+note.definition();
            }).join('\n\n');
        },this);

        if(data) {
            this.load(data);
        }
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

        this.init_save();
    }
    CustomPartType.prototype = {

        load_state: function() {
            if(window.history !== undefined) {
                var state = window.history.state || {};
                if('currentTab' in state) {
                    this.setTab(state.currentTab)();
                }
            }
            Editor.computedReplaceState('currentTab',ko.computed(function() {
                var tab = this.currentTab();
                return tab ? tab.id : '';
            },this));
        },

        load: function(data) {
            var pt = this;
            tryLoad(data,['name','short_name','description'],this);
            tryLoadMatchingId(data,'input_widget','name',this.input_widgets,this);
            if('input_options' in data) {
                tryLoad(data.input_options,['correctAnswer','hint'],this.input_options);
                this.input_widget().load(data.input_options);
            }
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
            this.autoSave = Editor.saver(
                function() {
                    return pt.toJSON();
                },
                function(data) {
                    var promise = $.post(pt.save_url, {json: JSON.stringify(data), csrfmiddlewaretoken: getCookie('csrftoken')})
                        .success(function(data) {
                        })
                        .error(function(response,type,message) {
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
                hint: ''+this.input_options.hint()+''
            };
            this.input_widget().toJSON(input_options);

            return {
                'name': this.name(),
                'short_name': this.short_name(),
                'description': this.description(),
                'input_widget': this.input_widget().name,
                'input_options': JSON.stringify(input_options),
                'can_be_gap': this.can_be_gap(),
                'can_be_step': this.can_be_step(),
                'settings': JSON.stringify(this.settings().map(function(s){ return s.toJSON() })),
                'marking_script': this.marking_script(),
                'marking_notes': JSON.stringify(this.marking_notes().map(function(n){ return n.toJSON() })),
                'ready_to_use': this.ready_to_use()
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
                    choices: ko.observableArray([])
                };
                model.valid_choices = ko.computed(function() {
                    return model.choices().filter(function(c) { return c.valid(); });
                })
                model.add_choice = function() {
                    var choice = {value: ko.observable(''), label: ko.observable('')};
                    choice.valid = ko.computed(function() {
                        return choice.value()!='' && choice.label();
                    });
                    model.choices.push(choice);
                    return choice;
                }
                return model;
            },
            toJSON: function(data) {
                var def = this.default_value();
                data.default_value = def ? def.value() : null;
                data.choices = this.choices().map(function(c) {
                    return {value: c.value(), label: c.label()}
                });
            },
            load: function(data) {
                var m = this;
                data.choices.map(function(c) {
                    var choice = m.add_choice();
                    tryLoad(c,['value','label'],choice);
                });
                tryLoadMatchingId(data,'default_value','value',this.choices(),this);
            },
            valid: function() {
                return this.choices().length>0 && this.choices().every(function(c) {return c.valid()});
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

			if(name in Numbas.jme.constants || reserved_names.contains(name)) {
				return 'This name is reserved.';
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
            var vars = Numbas.jme.findvars(this.definition_tree());
            var note_names = pt.marking_notes().map(function(n) { return n.name() });
            return vars
                .filter(function(name) { return !reserved_names.contains(name.toLowerCase()) })
                .map(function(name) {
                    note = pt.getNote(name);
                    return {name:name, exists: note_names.contains(name), note: note, title: name, go_to: function() {
                        if(note) {
                            pt.current_marking_note(note);
                        }
                    }};
                })
            ;
        },this);

        this.valid = ko.computed(function() {
            return !this.nameError() && this.definition_tree();
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

    Numbas.queueScript('start-editor',['jme-display','jme'],function() {
        try {
            viewModel = new CustomPartType(window.item_json.data, window.item_json.save_url);
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
