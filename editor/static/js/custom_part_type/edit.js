var viewModel;

$(document).ready(function() {
    var tryLoad = Editor.tryLoad;
    var tryLoadMatchingId = Editor.tryLoadMatchingId;


    Editor.custom_part_type.input_widgets = [
        {'name': 'string', 'niceName': 'String'},
        {'name': 'number', 'niceName': 'Number'},
        {'name': 'jme', 'niceName': 'Mathematical expression'},
        {'name': 'matrix', 'niceName': 'Matrix'},
        {'name': 'radios', 'niceName': 'Radio buttons'},
        {'name': 'checkboxes', 'niceName': 'Choose several from a list'},
        {'name': 'dropdown', 'niceName': 'Drop-down box'}
    ];



    var CustomPartType = Editor.custom_part_type.CustomPartType = function(data, save_url) {
        var pt = this;

        this.save_url = save_url;

        this.name = ko.observable('');
        this.short_name = ko.observable('');
        this.description = ko.observable('');

        this.tabs = [
            new Editor.Tab('description','Description','cog'),
            new Editor.Tab('input','Answer input','pencil'),
            new Editor.Tab('settings','Part settings','wrench'),
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

        this.input_widget = ko.observable(Editor.custom_part_type.input_widgets[0]);
        this.input_options = {
            correctAnswer: ko.observable(''),
            hint: ko.observable('')
        }

        this.can_be_gap = ko.observable(true);
        this.can_be_step = ko.observable(true);

        this.settings = ko.observableArray([]);

        this.add_setting = function(type) {
            var setting = new Setting();
            setting.set_type(type.name);
            pt.settings.push(setting);
            return setting;
        };

        this.marking_script = ko.observable('');
        this.marking_notes = ko.observableArray([]);

        this.edit_name = function() {
            pt.setTab('description')();
        }
        
        if(data) {
            this.load(data);
        }
        this.load_state();

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
            tryLoad(data,['name','short_name','description'],this);
            tryLoadMatchingId(data,'input_widget','name',Editor.custom_part_type.input_widgets,this);
            
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
            return {
                'name': this.name(),
                'short_name': this.short_name(),
                'description': this.description(),
                'input_widget': this.input_widget().name,
                'input_options': JSON.stringify({
                    correctAnswer: this.input_options.correctAnswer(),
                    hint: this.input_options.hint()
                }),
                'can_be_gap': this.can_be_gap(),
                'can_be_step': this.can_be_step(),
                'settings': JSON.stringify(this.settings().map(function(s){ return s.toJSON() })),
                'marking_script': this.marking_script()
            }
        }
    }

    Editor.custom_part_type.setting_types = [
        {
            name: 'string',
            niceName: 'String',
            model: function() {
                return {
                    'default': ko.observable(''),
                    subvars: ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default = this.default();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default','subvars'],this);
            }
        },
        {
            name: 'mathematical_expression',
            niceName: 'Mathematical expression',
            model: function() {
                return {
                    'default': ko.observable(''),
                    subvars: ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default = this.default();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default','subvars'],this);
            }
        },
        {
            name: 'checkbox',
            niceName: 'Checkbox',
            model: function() {
                return {
                    'default': ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default = this.default();
            },
            load: function(data) {
                tryLoad(data,'default',this);
            }
        },
        {
            name: 'dropdown',
            niceName: 'Drop-down box',
            model: function() {
                var model = {
                    default: ko.observable(''),
                    choices: ko.observableArray([])
                };
                model.add_choice = function() {
                    var choice = {value: ko.observable(''), label: ko.observable('')};
                    model.choices.push(choice);
                    return choice;
                }
            },
            toJSON: function(data) {
                var def = this.default();
                data.default = def ? def.value() : null;
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
                tryLoadMatchingId(data,'default','value',this.choices(),this);
            }
        },
        {
            name: 'code',
            niceName: 'JME code',
            model: function() {
                return {
                    default: ko.observable(''),
                    evaluate: ko.observable(false)
                }
            },
            toJSON: function(data) {
                data.default = this.default();
                data.evaluate = this.evaluate();
            },
            load: function(data) {
                tryLoad(data,['default','evaluate'],this);
            }
        },
        {
            name: 'percent',
            niceName: 'Percentage',
            model: function() {
                return {
                    default: ko.observable(0)
                }
            },
            toJSON: function(data) {
                data.default = this.default();
            },
            load: function(data) {
                tryLoad(data,'default',this);
            }
        },
        {
            name: 'html',
            niceName: 'HTML content',
            model: function() {
                return {
                    default: ko.observable(''),
                    subvars: ko.observable(false)
                };
            },
            toJSON: function(data) {
                data.default = this.default();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default','subvars'],this);
            }
        },
        {
            name: 'list_of_strings',
            niceName: 'List of strings',
            model: function() {
                return {
                    default: ko.observableArray([]),
                    subvars: ko.observable(false)
                }
            },
            toJSON: function(data) {
                data.default = this.default();
                data.subvars = this.subvars();
            },
            load: function(data) {
                tryLoad(data,['default','subvars'],this);
            }
        },
        {
            name: 'choose_several',
            niceName: 'Choose one or more',
            model: function() {
                var model = {
                    choices: ko.observableArray([])
                };
                model.add_choice = function() {
                    var choice = {value: ko.observable(''), label: ko.observable(''), default: ko.observable(false)};
                    model.choices.push(choice);
                    return choice;
                }
            },
            toJSON: function(data) {
                var def = this.default();
                data.choices = this.choices().map(function(c) {
                    return {value: c.value(), label: c.label(), default: c.default()}
                });
            },
            load: function(data) {
                var m = this;
                data.choices.map(function(c) {
                    var choice = m.add_choice();
                    tryLoad(c,['value','label','default'],choice);
                });
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
    }
    SettingType.prototype = {
        toJSON: function(data) {
            return this.toJSONFn.apply(this.model,[data,this.setting]);
        },
        load: function(data) {
            return this.loadFn.apply(this.model,[data,this.setting]);
        }
    };

    var Setting = Editor.custom_part_type.Setting = function(data) {
        data = data || {};
        var s = this;
        this.name = ko.observable('');
        this.label = ko.observable('');
        this.input_types = Editor.custom_part_type.setting_types.map(function(data) {
            return new SettingType(s,data);
        });
        this.input_type = ko.observable(this.input_types[0]);

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
                input_type: this.input_type().name
            }
        },
        load: function(data) {
        }
    };

    var Note = Editor.custom_part_type.Note = function(data) {
        this.name = ko.observable('');
        this.description = ko.observable('');
        this.code = ko.observable('');
    }

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
