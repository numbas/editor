var tryLoad,slugify;
if(!window.Editor)
    window.Editor = {};

$(document).ready(function() {

    function CSRFFormData(entries) {
        const f = new FormData();
        f.set('csrfmiddlewaretoken', getCSRFtoken());
        for(let [k,v] of Object.entries(entries || {})) {
            f.set(k,v);
        }
        return f;
    }

    function copy_text_to_clipboard(text) {
        var ta = document.createElement("textarea");
        ta.value = text;

        ta.style = 'position: fixed; top: 0; left: 0;';

        document.body.appendChild(ta);

        var active = document.activeElement;
        ta.focus();
        ta.select();

        document.execCommand('copy');

        document.body.removeChild(ta);

        if(active) {
            active.focus();
        }
    }

    var wrap_subvar = Editor.wrap_subvar = function(expr) {
        var sbits = Numbas.util.splitbrackets(expr,'{','}');
        var out = '';
        for(var j=0;j<sbits.length;j+=1) {
            out += j%2 ? ' subvar('+sbits[j]+')' : sbits[j]; //subvar here instead of \\color because we're still in JME
        }
        return out;
    }

    Editor.texJMEBit = function(expr,rules,parser,scope) {
        rules = rules || 'basic';
        parser = parser || scope.parser || Numbas.jme.standardParser;
        scope = new Numbas.jme.Scope(scope || Numbas.jme.builtinScope);
        try{
            if(viewModel && viewModel.rulesets) {
                viewModel.rulesets().map(function(r) {
                    scope.setRuleset(r.name(), Numbas.jme.collectRuleset(r.sets(),scope.allRulesets()));
                });
            }
            expr = wrap_subvar(expr);
            var tex = Numbas.jme.display.exprToLaTeX(expr,rules,scope,parser);
            return {tex: tex, error: false};
        } catch(e) {
            var tex = e.message.replace(/<\/?(code|em|strong)>/g,'');
            return {message: e.message, tex: '\\color{red}{\\text{'+tex+'}}', error: true};
        }
    }

    var currentScope = null;
    var showSubstitutions = true;

    function find_jme_scope(element) {
        var p = $(element).parents('.jme-scope').first();
        if(!p) {
            return {
                scope: Numbas.jme.builtinScope,
                showSubstitutions: false
            }
        }
        return {
            scope: p.data('jme-scope'),
            showSubstitutions: p.data('jme-show-substitutions') || false
        };
    }

    var post_json = Editor.post_json = function(url, data, extra_options) {
        const options = {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFtoken()
            },
            body: JSON.stringify(data)
        };
        if(extra_options) {
            Object.assign(options, extra_options);
        }
        return fetch(url, options);
    }

    $.noty.defaultOptions.theme = 'noty_theme_twitter';

    slugify = function(s) {
        return s.trim().replace(/[^\w\s]/g,'').toLowerCase().replace(/\s/g,'-') || 'empty-slug';
    };

    var tryGetAttribute = Editor.tryGetAttribute = function(data,name) {
        if(name in data) {
            return data[name];
        } else {
            name = name.toLowerCase();
            for(var x in data) {
                if(x.toLowerCase()==name) {
                    return data[x];
                }
            }
        }
    }

    /** Try to load the given attribute(s) from data into obj
     * @param {Object} data
     * @param {String|Array.<String>} attr - the name of the attribute to load, or a list of names
     * @param {Object} obj - the object to load the attribute into
     * @param {String|Array.<String>} [altname] - the name(s) of the attribute to set in the destination object
     */
    tryLoad = Editor.tryLoad = function(data,attr,obj,altname) {
        if(!data)
            return;

        if(attr instanceof Array)
        {
            if(!altname)
                altname=[];
            for(var i=0;i<attr.length;i++)
            {
                tryLoad(data,attr[i],obj,altname[i] || attr[i]);
            }
            return;
        }
        altname = altname || attr;

        var value = tryGetAttribute(data,attr);
        if(value!==undefined) {
            if(altname in obj && typeof obj[altname]() == 'string') {
                value += '';
            }
            obj[altname](value);
        }
    }

    /** Given a source object `data` with string attribute `attr`, find the object in `options` with `id_key` equal to the value of `data[attr]`,
     * and set `obj[attr]` to that object
     */
    tryLoadMatchingId = Editor.tryLoadMatchingId = function(data,attr,id_key,options,obj,altname) {
        if(!data) {
            return;
        }

        var val;
        if(attr in data) {
            val = data[attr];
        } else if(attr.toLowerCase() in data) {
            val = data[attr.toLowerCase()];
        } else {
            return;
        }
        altname = altname || attr;
        for(var i=0;i<options.length;i++) {
            if(ko.unwrap(options[i][id_key]) == val) {
                obj[altname](options[i]);
            }
        }
    }

    Editor.numbasVersion = 'finer_feedback_settings';

    Editor.parseExam = function(source) {
        var content = /\/\/(.*?)\n(.*)/.exec(source)[2]
        return JSON.parse(content);
    }

    // save the value of a computed observable in history.state
    Editor.computedReplaceState = function(key,observable) {
        if(window.history === undefined) {
            return;
        }
        ko.computed(function() {
            var state = history.state || {};
            state[key] = observable();
            if(history.replaceState) {
                history.replaceState(state,window.title);
            }
        });
    }

    Editor.Tab = function(id,title,icon,options) {
        this.id = id;
        this.title = title;
        this.icon = icon;
        options = options || {};
        this.visible = options.visible === undefined ? true : options.visible;
        this.more_important = options.more_important;
        this.in_use = options.in_use === undefined ? false : options.in_use;
        this.warning = options.warning === undefined ? false : options.warning;
    }

    Editor.Tabber = function(tabs) {
        this.tabs = tabs;
        this.realCurrentTab = ko.observable(ko.unwrap(this.tabs)[0]);
        this.currentTab = ko.computed({
            read: function() {
                var tabs = ko.unwrap(this.tabs);
                if(tabs.indexOf(this.realCurrentTab())==-1) {
                    this.realCurrentTab(tabs[0]);
                    return tabs[0];
                } else {
                    return this.realCurrentTab();
                }
            },
            write: this.realCurrentTab
        },this);
    }
    Editor.Tabber.prototype = {
        getTab: function(id) {
            return ko.unwrap(this.tabs).find(function(t){return t.id==id});
        },
        setTab: function(id) {
            var tabber = this;
            return function() {
                var tab = tabber.getTab(id);
                tabber.currentTab(tab);
            }
        }
    };


    Editor.contentObservable = function(val) {
        var obs = ko.observable(val);
        return ko.computed({
            read: obs,
            write: function(v) {
                try {
                    obs(HTMLtoXML(v+''));
                }
                catch(e) {
                }
            }
        });
    };

    Editor.choiceObservable = function(choices) {
        var obs = ko.observable(choices[0]);
        obs.choices = choices;
        return obs;
    }


    // A task to make a string observable non-empty, e.g. give something a name.
    Editor.nonempty_task = function(text,observable,focus_on) {
        return {
            text: text, 
            done: ko.pureComputed(function() {return observable() && true}),
            focus_on: focus_on
        };
    }

    // A task to make an observable a valid JME expression
    Editor.valid_jme_task = function(text,observable,focus_on) {
        return {
            text: text, 
            done: ko.pureComputed(function() {
                var expr = ko.unwrap(observable);
                try {
                    var tree = Numbas.jme.compile(expr);
                    return tree != null;
                } catch(e) {
                    return false;
                }
            }),
            focus_on: focus_on
        };
    }


    Editor.mappedObservableArray = function(map) {
        var obj = {list: ko.observableArray([])};
        var obs = ko.computed({
            owner: obj,
            read: obj.list,
            write: function(l) {
                var mapped_ids = {};
                var current_mapped = obj.list();
                current_mapped.forEach(function(o) {
                    mapped_ids[o.id] = o;
                });
                l.forEach(function(d) {
                    if(mapped_ids[d.id]) {
                        mapped_ids[d.id].load(d);
                    } else {
                        mapped_ids[d.id] = map(d);
                    }
                });
                var out = l.map(function(d) { return mapped_ids[d.id]; });
                this.list(out);
            }
        });
        obs.remove = function(o) {
            return obj.list.remove(o);
        }
        obs.push = function(o) {
            return obj.list.push(map(o));
        }
        obs.indexOf = function(o) {
            return obj.list.indexOf(o);
        }
        return obs;
    }

    Editor.optionObservable = function(options) {
        var _obs = ko.observable(options[0]);
        var obs = ko.computed({
            read: _obs,
            write: function(v) {
                v = typeof(v)=='string' ? options.find(function(o) {return o.name==v}) || options[0] : v;
                return _obs(v);
            }
        })
        obs.options = options;
        return obs;
    }

    Editor.beforeRemove = function(elem) {
        if(elem.nodeType==elem.ELEMENT_NODE) {
            $(elem).stop().slideUp(150,function(){$(this).remove()});
        }
        else {
            $(elem).remove();
        }
    };

    Editor.afterAdd = function(elem) {
        if(elem.nodeType==elem.ELEMENT_NODE) {
            $(elem).stop().hide().slideDown(150);
        }
    }

    Editor.savers = 0;
    //fn should do the save and return a promise which resolves when the save is done
    Editor.startSave = function() {
        Editor.savers += 1;

        if(Editor.savers==1) {
            window.onbeforeunload = function() {
                return 'There are still unsaved changes.';
            }
        }
    }
    Editor.endSave = function() {
        Editor.savers = Math.max(Editor.savers-1,0);
        if(Editor.savers==0) {
            window.onbeforeunload = null;
        }
    }
    Editor.abortSave = function(reason) {
        Editor.savers = Math.max(Editor.savers-1,0);
        window.onbeforeunload = function() {
            return reason;
        }
    }

    //obs is an observable on the data to be saved
    //savefn is a function which does the save, and returns a Promise which resolves when the save is done, or rejects when the save fails.
    Editor.Saver = function(obs,savefn) {
        var saver = this;
        this.firstSave = true;
        this.firstData = null;
        this.obs = obs;
        this.savefn = savefn;
        this.status = ko.observable('saved');
        this.error_message = ko.observable('');
        this.status_info = ko.pureComputed(function() {
            return {
                'saved': {message: 'Saved', class: 'alert-success', icon: 'glyphicon-ok'},
                'unsaved': {message: 'Unsaved changes', class: 'alert-info', icon: 'glyphicon-pencil'},
                'saving': {message: 'Saving…', class: 'alert-info', icon: 'glyphicon-upload'},
                'error': {message: 'Error saving: '+this.error_message(), class: 'alert-warning', icon: 'glyphicon-exclamation-sign'}
            }[this.status()];
        },this);

        this.changed_data = ko.computed(function() {
            var data = saver.obs();
            if(data===undefined) {
                return;
            }
            if(!saver.firstSave) {
                saver.status('unsaved');
            }
            return data;
        },this).extend({rateLimit: 100});

        ko.computed(function() {
            var data = saver.changed_data();
            if(saver.firstSave) {
                var json = JSON.stringify(data);
                if(saver.firstData===null || saver.firstData==json) {
                    saver.firstData = json;
                    return;
                } else {
                    saver.firstSave = false;
                }
            }
            saver.save();
        }).extend({rateLimit: {timeout: 1000, method: "notifyWhenChangesStop"}});
    }
    Editor.Saver.prototype = {
        save: function() {
            var saver = this;
            var data = this.obs();
            Editor.startSave();
            data.csrfmiddlewaretoken = getCSRFtoken();
            try {
                saver.status('saving');
                var def = this.savefn(data);
                window.def = def;
                def
                    .then(function() {
                        saver.status('saved');
                    })
                    .catch(function(e) {
                        saver.error_message(e.message);
                        saver.status('error');
                    })
                    .finally(Editor.endSave)
                ;
            } catch(e) {
                Editor.abortSave(e.message);
            }
        }
    }

    var Taxonomy = Editor.Taxonomy = function(data) {
        var t = this;
        this.name = data.name;
        this.pk = data.pk;
        this.description = data.description;
        this.open = ko.observable(true);
        this.trees = data.nodes.map(function(t) { return new TaxonomyNode(t) })
        this.toggleOpen = function() {
            t.open(!t.open());
        }
        this.any_used = ko.pureComputed(function() {
            return this.trees.some(function(n){ return n.used() || n.children_used(); });
        },this);

        this.search = ko.observable('');
        var all_nodes = this.all_nodes = [];
        function list_nodes(n) {
            all_nodes.push(n);
            n.children.forEach(list_nodes);
        }
        this.trees.forEach(list_nodes);

        this.use_node = function(code) {
            var n = t.all_nodes.find(function(n){return n.code==code});
            while(n) {
                n.used(true);
                n = n.parent;
            }
        }

        this.search_nodes = function(query, response) {
            query = query.term.toLowerCase();
            var result = t.all_nodes
                .filter(function(n){ return n.name.toLowerCase().contains(query) })
                .map(function(n){ return {label: n.code+' - '+n.name, value: n.code} })
            ;
            response(result);
        }
    }

    function TaxonomyNode(data,parent) {
        var n = this;
        this.parent = parent;
        this.pk = data.pk;
        this.code = data.code;
        this.name = data.name;
        this.children = data.children.map(function(d){ return new TaxonomyNode(d,n); });
        this.children_used = ko.pureComputed(function() {
            return this.children.some(function(n){ return n.used() || n.children_used() });
        },this);
        this.used = ko.observable(false);
        ko.computed(function() {
            if(!this.used()) {
                this.children.forEach(function(n){ n.used(false); });
            }
        },this);
    }

    Editor.TaskList = function(section_tasks) {
        var ei = this;

        this.section_tasks = section_tasks;
        this.section_completed = {};
        this.section_still_to_do = {};

        function section_completed(tasks) {
            return ko.pureComputed(function() {
                return tasks.every(function(t){return ko.unwrap(t.done)});
            })
        }

        function section_still_to_do(tasks) {
            return ko.pureComputed(function() {
                var task = tasks.filter(function(t){return !ko.unwrap(t.done)})[0];
                function uncapitalise(str){ 
                    return str.slice(0,1).toLowerCase()+str.slice(1);
                }
                return task ? uncapitalise(ko.unwrap(task.text)) : '';
            });
        }

        for(var section in this.section_tasks) {
            this.section_completed[section] = section_completed(this.section_tasks[section]);
            this.section_still_to_do[section] = section_still_to_do(this.section_tasks[section]);
        }
        
        this.all_sections_completed = ko.pureComputed(function() {
            for(var key in this.section_completed) {
                if(!this.section_completed[key]()) {
                    return false;
                }
            }
            return true;
        },this);
    }

    if(window.Numbas) {
        Numbas.editor = Editor;
        Numbas.getStandaloneFileURL = function(extension, path) {
            var e = (item_json.numbasExtensions || []).find(function(e) {
                return e.location == extension;
            });
            if(e) {
                return e.script_url + 'standalone_scripts/' + path;
            }
        }
    }

    Editor.EditorItem = function() {
        if(this.__proto__.__proto__!==Editor.EditorItem.prototype) {
            for(var x in Editor.EditorItem.prototype) {
                if(!(this[x])) {
                    this[x] = Editor.EditorItem.prototype[x];
                }
            }
        }
        var ei = this;

        this.item_type = item_json.item_type;

        this.published = ko.observable(false);
        this.name = ko.observable('Loading');
        this.current_stamp = ko.observable(item_json.current_stamp);
        this.licence = ko.observable();
        this.ability_frameworks = ko.observableArray([]);
        this.tags = ko.observableArray([]);
        this.tag_input = ko.observable('');
        this.description = ko.observable('');
        this.ignored_publishing_criteria = ko.observable(false);

        this.mainTabber = new Editor.Tabber(ko.observableArray([]));

        this.ready_to_download_checks = ko.observableArray([
            function() {
                if(ei.current_stamp().status!='ok') {
                    return {ready:false, reason: 'it isn\'t labelled "ready to use"'}
                }
            }
        ]);
        this.ready_to_download_obj = ko.pureComputed(function() {
            var checks = this.ready_to_download_checks();
            for(var i=0;i<checks.length;i++) {
                var obj = checks[i]();
                if(obj) {
                    return obj;
                }
            }
            return {ready:true};
        },this);
        this.ready_to_download = ko.pureComputed(function() {
            return this.ready_to_download_obj().ready;
        },this);
        this.ready_to_download_reason = ko.pureComputed(function() {
            return this.ready_to_download_obj().reason;
        },this);


        this.ability_frameworks(item_json.ability_frameworks.map(function(d) {
            return new Editor.AbilityFramework(d);
        }));

        this.ability_levels = ko.pureComputed(function() {
            var o = [];
            this.ability_frameworks().map(function(af) {
                o = o.concat(af.levels);
            });
            return o;
        },this);

        this.used_ability_levels = ko.pureComputed(function() {
            return this.ability_levels().filter(function(al){return al.used()});
        },this);

        item_json.licences.sort(function(a,b){a=a.short_name;b=b.short_name; return a<b ? -1 : a>b ? 1 : 0 });
        this.licence_name = ko.pureComputed(function() {
            if(this.licence()) {
                return this.licence().name;
            } else {
                return 'None specified';
            }
        },this);

        this.taxonomies = item_json.taxonomies.map(function(t) {
            return new Taxonomy(t);
        });

        this.realName = ko.pureComputed(function() {
            var name = this.name()
            return name.length>0 ? name : 'Untitled Question';
        },this);

        this.has_tag = function(tag) {
            return ei.tags().find(function(t) { return t.toLowerCase() == tag.toLowerCase(); })
        }

        this.add_tag = function() {
            var tag = ei.tag_input();
            if(!ei.has_tag(tag)) {
                ei.tags.push(tag);
            }
            ei.tag_input('');
        }

        this.sorted_tags = ko.computed(function() {
            return this.tags().sort(function(a,b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return a>b ? 1 : a<b ? -1 : 0;
            });
        },this);

        this.remove_tag = function(tag) {
            ei.tags.remove(tag);
        }

        this.metadata = ko.pureComputed(function() {
            return {
                description: this.description(),
                licence: this.licence_name()
            };
        },this);

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - '+Editor.SITE_TITLE : Editor.SITE_TITLE;
        },this);

        if(item_json.editable) {
            this.access_rights = ko.observableArray(item_json.access_rights.map(function(d){
                var access = new UserAccess(ei,d.user)
                access.access_level(d.access_level);
                return access;
            }));

            this.access_data = ko.pureComputed(function() {
                return {
                    access_rights: Object.fromEntries(ei.access_rights().map(u => { 
                        return [u.id, u.access_level()];
                    }))
                }
            });
            this.saveAccess = new Editor.Saver(this.access_data, function(data) {
                if(ei.editoritem_id === undefined) {
                    return;
                }
                return post_json(Editor.url_prefix+'item/'+ei.editoritem_id+'/set-access',data);
            });

            this.userAccessSearch = ko.observable('');

            this.add_user_access_error = ko.observable(null);
            this.userAccessSearch.subscribe(function() {
                ei.add_user_access_error(null);
            });

            this.addUserAccess = function(data) {
                ei.add_user_access_error(null);
                var access_rights = ei.access_rights();
                if(ei.access_rights().some(a => a.id == data.id)) {
                    ei.add_user_access_error(data);
                    return;
                }
                var access = new UserAccess(ei,data);
                ei.access_rights.push(access);
            };
        }

        this.addStamp = function(status_code) {
            return function() {
                fetch('stamp', {method: 'POST', body: CSRFFormData({'status': status_code})})
                    .then(response => response.json()).then(response => {
                        const timeline = document.querySelector('.timeline');
                        timeline.innerHTML = response.html + timeline.innerHTML;
                        mathjax_typeset_element(timeline);
                        ei.current_stamp(response.object_json);
                    })
                ;
                noty({
                    text: 'Thanks for your feedback!',
                    type: 'success',
                    layout: 'topCenter'
                });
            }
        }

        this.commentwriter = new Editor.CommentWriter();
        this.restorepointwriter = new Editor.CommentWriter();

        this.edit_name = function() {
            ei.mainTabber.setTab('settings')();
            ko.tasks.runEarly();
            $('#name-input').focus();
        }

        this.autoSave = ko.observable(null);
    }
    Editor.EditorItem.prototype = {
        init_tasks: function() {
            this.task_list = new Editor.TaskList(this.section_tasks);
            this.canPublish = ko.pureComputed(function() {
                return !this.published() && this.task_list.all_sections_completed();
            },this);
        },

        set_ignored_publishing_criteria: function() {
                this.ignored_publishing_criteria(true);
        },

        init_output: function() {
            this.output = ko.pureComputed(function() {
                var data = JSON.stringify(this.toJSON());
                return '// Numbas version: '+Editor.numbasVersion+'\n'+data;
            },this);
        },

        init_save: function(callback) {
            var ei = this;
            this.autoSave(new Editor.Saver(
                function() {
                    var data = ei.save();

                    return data;
                },
                function(data) {
                    if(!ei.name()) {
                        throw(new Error("We can't save changes while the name field is empty."));
                    }

                    var request = post_json(
                        Editor.url_prefix+ei.item_type+'/'+ei.id+'/'+slugify(ei.realName())+'/',
                        data
                    );

                    request.then(function(data) {
                        var address = location.protocol+'//'+location.host+data.url;
                        if(history.replaceState) {
                            history.replaceState(history.state,ei.realName(),address);
                        }
                    }).catch(function() {});

                    if(callback) {
                        try {
                            callback(request);
                        } catch(e) {
                            return Promise.reject(e);
                        }
                    }

                    return request;
                }
            ));
            if(item_json.is_new) {
                this.autoSave().save();
                if(history.replaceState) {
                    history.replaceState(history.state,window.title,window.location.href.replace(/\?.*$/,''));
                }
            }
        },

        load_state: function() {
            if(window.history !== undefined) {
                var state = window.history.state || {};
                if('currentTab' in state) {
                    this.mainTabber.setTab(state.currentTab)();
                }
                Editor.computedReplaceState('currentTab',ko.pureComputed(function() {
                    var tab = this.mainTabber.currentTab();
                    return tab ? tab.id : '';
                },this));
            }
        },

        load: function(data) {
            this.reset();

            this.id = data.id;
            this.editoritem_id = data.editoritem_id;

            if('metadata' in data) {
                tryLoad(data.metadata,['description'],this);
                var licence_name = data.metadata.licence;
                for(var i=0;i<item_json.licences.length;i++) {
                    if(item_json.licences[i].name==licence_name) {
                        this.licence(item_json.licences[i]);
                        break;
                    }
                }
            }

            if('ability_levels' in data) {
                data.ability_levels.map(function(pk) {
                    this.get_ability_level(pk).used(true);
                },this);
            }

            if('taxonomy_nodes' in data) {
                var used_nodes = {}
                data.taxonomy_nodes.map(function(pk){used_nodes[pk] = true});
                function node_used(any,n) {
                    var used = used_nodes[n.pk]===true;
                    n.used(used);
                    any = any || used;
                    return n.children.reduce(node_used,any);
                }
                this.taxonomies.map(function(t) {
                     var any_used = t.trees.reduce(node_used, false);
                });
            }

            var content = data.JSONContent;

            this.published(data.published);
        },

        set_tab_from_hash: function() {
            switch(window.location.hash.slice(1)) {
                case 'editing-history':
                    this.mainTabber.setTab('history')();
                    break;
                case 'network':
                    this.mainTabber.setTab('network')();
                    break;
            } 
        },

        applyDiff: function(version) {
            viewModel.currentChange(version);
            viewModel.load(version.data);
        },

        get_ability_level: function(pk) {
            return this.ability_levels().find(function(l){return l.pk==pk});
        }

    }

    var UserAccess = Editor.UserAccess = function(object,data) {
        var ua = this;
        this.id = data.id;
        this.link = data.link;
        this.name = data.name;
        this.access_level = ko.observable(data.access_level || 'view');
        this.profile = data.profile;
        this.remove = function() {
            object.access_rights.remove(ua);
        }
    }
    UserAccess.prototype = {
        access_options: [{value:'view',text:'Can view this'},{value:'edit',text:'Can edit this'}]
    }

    Editor.Comment = function(data) {
        this.text = data.text;
        this.user = data.user;
        this.date = data.date;
        this.delete_url = data.delete_url;
    }

    /** Make a block of CSS declarations more specific by prepending the given selector to every rule
     * @param {string} css
     * @param {string} selector
     * @returns {string}
     */
    Editor.makeCSSMoreSpecific = function(css,selector) {
        var doc = document.implementation.createHTMLDocument(""),
        styleElement = document.createElement("style");

        styleElement.textContent = css;
        doc.body.appendChild(styleElement);

        var rules = styleElement.sheet.cssRules;
        var new_rules = [];

        function fix_rule(rule) {
            switch(rule.constructor.name) {
                case 'CSSStyleRule':
                    return selector+' '+rule.cssText;
                case 'CSSMediaRule':
                    var subrules = Array.from(rule.cssRules).map(fix_rule);
                    return '@media '+rule.media.mediaText+' {\n'+subrules.join('\n')+'\n}';
                case 'CSSSupportsRule':
                    var subrules = Array.from(rule.cssRules).map(fix_rule);
                    return '@supports '+rule.conditionText+' {\n'+subrules.join('\n')+'\n}';
                case 'CSSImportRule':
                case 'CSSFontFaceRule':
                case 'CSSPageRule':
                case 'CSSNamespaceRule':
                case 'CSSCounterStyleRule':
                case 'CSSDocumentRule':
                case 'CSSFontFeatureValuesRule':
                case 'CSSViewportRule':
                    return rule.cssText;
                default:
                    throw(new Error("While rewriting CSS, an unrecognised rule type was encountered: "+rule.constructor.name));
            }
        }

        return Array.from(rules).map(fix_rule).join('\n');
    };


    /* Resizable 2d grid of observables.
     * Returns a 2d array of objects, each created by calling cell(row,column)
     */
    Editor.editableGrid = function(rows,cols,cell) {
        var grid = [];
        var outGrid = ko.computed(function() {
            var numRows = parseInt(rows());
            var numCols = parseInt(cols());
            if(numRows==0 || numCols==0) {
                grid = [];
                return grid;
            }
            var rowsNow = grid.length;
            var colsNow = rowsNow>0 ? grid[0]().length : 0;
            if(numCols<colsNow) {
                for(var i=0;i<rowsNow;i++) {
                    grid[i](grid[i]().slice(0,numCols));
                }
            } else if(numCols>colsNow) {
                for(var i=0;i<rowsNow;i++) {
                    for(var j=colsNow;j<numCols;j++) {
                        grid[i].push(cell(i,j));
                    }
                }
            }
            if(numRows<rowsNow) {
                grid = grid.slice(0,numRows);
            } else if(numRows>rowsNow) {
                for(var i=rowsNow;i<numRows;i++) {
                    var row = ko.observableArray([]);
                    for(var j=0;j<numCols;j++) {
                        row.push(cell(i,j));
                    }
                    grid.push(row);
                }
            }

            return grid;
        })
        
        return outGrid;
    }



    Editor.jme_autocompleters = [
        function(cm,options) {
            var scope = options.jmeScope();
            var hintGetter = options.getHintGetter();
            var hints = [];

            function make_hint(kind, name, definitions) {
                var doc_hints = window.jme_function_hints;
                var doc_hint;
                if(doc_hints) {
                    doc_hint = doc_hints.find(function(h) { return h.name==name; });
                }
                return {
                    text: name,
                    keywords: doc_hint ? doc_hint.keywords : [],
                    displayText: name,
                    className: 'with-link '+kind,
                    render: function(elt, data, cur) {
                        var ownerDocument = cm.getInputField().ownerDocument;

                        var name_span = ownerDocument.createElement('span');
                        name_span.setAttribute('class','name');
                        name_span.textContent = name;
                        elt.appendChild(name_span);

                        if(definitions) {
                            var signatures = ownerDocument.createElement('ul');
                            signatures.className = 'signatures';
                            var lines;
                            if(doc_hint && doc_hint.calling_patterns) {
                                lines = doc_hint.calling_patterns;
                            } else {
                                lines = definitions.map(function(fn) { return name+'('+Numbas.jme.describe_signature(fn.intype)+')'; });
                            }
                            lines.forEach(function(line) {
                                var li = ownerDocument.createElement('li');
                                li.textContent = line;
                                signatures.appendChild(li);
                            });
                            elt.appendChild(signatures);
                        }

                        var kind_span = ownerDocument.createElement('span');
                        kind_span.className = 'kind';
                        kind_span.textContent = kind;
                        elt.appendChild(kind_span);

                        var a = ownerDocument.createElement('a');
                        a.className = 'help';
                        a.innerHTML = '<span class="glyphicon glyphicon-question-sign"></span><span class="sr-only">documentation</span>';

                        var desc = ownerDocument.createElement('div');
                        desc.className = 'description';

                        var help = hintGetter(kind,name);
                        if(help) {
                            a.addEventListener('click',function(e) {
                                e.preventDefault();
                                help.go();
                            });
                            elt.appendChild(a);
                            if(help.description) {
                                desc.innerHTML = help.description;
                                elt.appendChild(desc);
                            }
                        } else if(kind=='operator' || kind=='function') {
                            if(doc_hint) {
                                a.setAttribute('target','jme-docs');
                                a.setAttribute('href',HELP_URL+doc_hint.doc+'.html#jme-fn-'+name);
                                elt.appendChild(a);
                                desc.innerHTML = doc_hint.description;
                                elt.appendChild(desc);
                            }
                        }
                    }
                };
            }

            Object.keys(scope.allFunctions()).forEach(function(name) {
                var defs = scope.getFunction(name);
                var isop = scope.parser.re.re_op.exec(name);
                hints.push(make_hint(isop ? 'operator' : 'function', name, defs));
            });
            Object.keys(scope.allVariables()).filter(function(name) { return !name.match(/,/); }).forEach(function(name) {
                hints.push(make_hint('variable', name));
            });
            Object.keys(scope.allConstants()).forEach(function(name) {
                hints.push(make_hint('constant',name));
            });
            return hints;
        },
    ];
    if(window.CodeMirror) {
        CodeMirror.registerHelper('hint','jme', function(cm,options) {
            var cur = cm.getCursor();
            var token = cm.getTokenAt(cur);
            var term = token.string;
            var from = CodeMirror.Pos(cur.line, token.start);
            var to = CodeMirror.Pos(cur.line, token.end);
            if (!(token.start < cur.ch && /\w/.test(token.string.charAt(cur.ch - token.start - 1)) && token.string.length)) {
                return;
            }
            var hints = {list: [], from: from, to: to};
            Editor.jme_autocompleters.forEach(function(fn) {
                var words = fn(cm,options);
                words = words.filter(function(w) {
                    if(w.text.slice(0,term.length).toLowerCase()==term.toLowerCase()) {
                        w.goodness = 1;
                    } else if(term.length>=2 && w.keywords && w.keywords.find(function(keyword) { return keyword.slice(0,term.length).toLowerCase()==term.toLowerCase(); })) {
                        w.goodness = 2;
                    } else if(term.length>=3 && w.text.toLowerCase().indexOf(term.toLowerCase())>=0) {
                        w.goodness = 3;
                    }
                    return w.goodness && w.goodness>0;
                });
                hints.list = hints.list.concat(words)
            });
            hints.list.sort(Numbas.util.sortBy(['goodness','text']));

            CodeMirror.on(hints,'shown',function(completion) {
                var completion = cm.state.completionActive;
                MathJax.typesetPromise([completion.widget.hints]);
            });

            return hints;
        });
    }

    ko.bindingHandlers.codemirror = {
        init: function(element,valueAccessor,allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor();
            var allBindings = allBindingsAccessor();

            $(element).val(ko.utils.unwrapObservable(value));
            
            var mode = ko.utils.unwrapObservable(allBindings.codemirrorMode) || 'javascript';
            var readOnly = ko.utils.unwrapObservable(allBindings.readOnly) || element.hasAttribute('disabled') || false;

            function onChange(editor,change) {
                if(typeof value=='function') {
                    value(editor.getValue());
                }
            }

            //from https://github.com/marijnh/CodeMirror/issues/988
            function betterTab(cm) {
              if (cm.somethingSelected()) {
                cm.indentSelection("add");
              } else {
                cm.replaceSelection(cm.getOption("indentWithTabs")? "\t":
                  Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
              }
            }

            function getScope() {
                var scope = Numbas.jme.builtinScope;
                if(allBindings.jmeScope) {
                    var oscope = ko.unwrap(allBindings.jmeScope);
                    if(oscope) {
                        return oscope;
                    }
                }
                var vms = [bindingContext.$data].concat(bindingContext.$parents);
                for(var i=0;i<vms.length;i++) {
                    if(vms[i].questionScope) {
                        scope = vms[i].questionScope() || scope;
                        break;
                    }
                }
                return scope;
            }
            function getHintGetter() {
                if(allBindings.hintGetter) {
                    var getter = ko.unwrap(allBindings.hintGetter);
                    if(getter) {
                        return getter;
                    }
                }
                var vms = [bindingContext.$data].concat(bindingContext.$parents);
                for(var i=0;i<vms.length;i++) {
                    if(vms[i].getObjectHint) {
                        var vm = vms[i];
                        return function() {
                            return vm.getObjectHint.apply(vm,arguments);
                        }
                    }
                }
                return function() {
                }
            }

            var mc = CodeMirror.fromTextArea(element, {
                lineNumbers: true,
                styleActiveLine: true,
                matchBrackets: true,
                mode: mode,
                indentWithTabs: false,
                indentUnit: 2,
                extraKeys: { 
                    'Tab': false,
                    'Shift-Tab': false,
                    'Ctrl-Space': "autocomplete"
                },
                readOnly: readOnly,
                lineWrapping: Editor.wrapLines,
                hintOptions: {
                    jmeScope: getScope,
                    getHintGetter: getHintGetter,
                    completeSingle: false
                }
            });
            mc.on('change',onChange);
            ko.utils.domData.set(element,'codemirror',mc);

            if(mode=='jme') {
                mc.on("keyup", function (mc, event) {
                    if (!mc.state.completionActive && event.key && event.key.length==1) {
                        mc.showHint();
                    }
                });
            }

            setInterval(function() {
                var visible = $(element).parents('.tab-pane:not(.active)').length==0;
                ko.utils.domData.set(element,'cm-visible',visible);
                if(visible) {
                    if(!ko.utils.domData.get(element,'cm-visible-refresh')) {
                        mc.refresh();
                        ko.utils.domData.set(element,'cm-visible-refresh',true);
                    }
                } else {
                    ko.utils.domData.set(element,'cm-visible-refresh',false);
                }
            },100);
        },
        update: function(element,valueAccessor,allBindingsAccessor) {
            var mc = ko.utils.domData.get(element,'codemirror');
            var value = ko.unwrap(valueAccessor());
            if(value!=mc.getValue()) {
                mc.setValue(value || '');
            }
            var allBindings = allBindingsAccessor();
            var mode = ko.unwrap(allBindings.codemirrorMode) || 'javascript';
            mc.setOption('mode',mode);
        }
    }

    function name_for_gap(n,gaps) {
        if(gaps && gaps[n] && gaps[n].name()) {
            return gaps[n].name();
        } else {
            return 'Gap '+n;
        }
    }

    function display_gaps(element,gaps) {
        function node_display_gaps(t) {
            var m = t.textContent.split(/\[\[(\d+)\]\]/);
            var nodes = [];
            for(var i=0;i<m.length;i++) {
                if(i%2) {
                    var gap = document.createElement('gapfill');
                    var n = parseInt(m[i]);
                    gap.setAttribute('data-number',n);
                    gap.textContent = name_for_gap(n,gaps);
                    nodes.push(gap);
                } else {
                    nodes.push(document.createTextNode(m[i]))
                }
            }
            nodes.forEach(function(n) {
                t.parentNode.insertBefore(n,t);
            })
            return nodes;
        }

        var treeWalker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT
        );

        var node = treeWalker.nextNode();
        var replaced = [];
        while(node) {
            var onode = node;
            node = treeWalker.nextNode();
            if(onode.textContent.match(/\[\[\d+\]\]/)) {
                node_display_gaps(onode);
                onode.parentNode.removeChild(onode);
            }
        }
    }

    ko.bindingHandlers.writemaths = {
        init: function(element,valueAccessor,allBindingsAccessor) {
            valueAccessor = valueAccessor();
            allBindingsAccessor = allBindingsAccessor();

            var editImmediately = allBindingsAccessor.hasOwnProperty('editImmediately') ? ko.unwrap(allBindingsAccessor.editImmediately) : false;

            var well;

            function make_tinymce() {
                if(well) {
                    element.removeChild(well);
                }
                element.classList.add('has-tinymce');
                var height = allBindingsAccessor.hasOwnProperty('wmHeight') ? allBindingsAccessor.wmHeight : 200;
                var width = allBindingsAccessor.hasOwnProperty('wmWidth') ? allBindingsAccessor.wmWidth : '';
                var para = allBindingsAccessor.hasOwnProperty('wmPara') ? allBindingsAccessor.wmPara : true;

                var preambleCSSAccessor = allBindingsAccessor.preambleCSS;

                var tinymce_plugins = ko.utils.unwrapObservable(allBindingsAccessor.tinymce_plugins) || [];

                var t = $('<div class="wmTextArea" style="width:100%"/>');

                $(element)
                    .css('width',width)
                    .append(t)
                ;

                function remove_empty_spans(node) {
                    if(node.nodeType==1) {
                        for(var i=0;i<node.childNodes.length;i++) {
                            var child = node.childNodes[i];
                            if(child.nodeType==1) {
                                remove_empty_spans(child);
                                if(child.nodeName=='SPAN' && child.attributes.length==0) {
                                    for(var j=0;j<child.childNodes.length;j++) {
                                        node.insertBefore(child.childNodes[j],child);
                                    }
                                    node.removeChild(child);
                                }
                            }
                        }
                    }
                }
                
                var plugins = [
                    'anchor',
                    'autoresize',
                    'code',
                    'codesample',
                    'colorpicker',
                    'directionality',
                    'fullscreen',
                    'hr',
                    'numbasimage',
                    'link',
                    'lists',
                    'media',
                    'noneditable',
                    'paste',
                    'searchreplace',
                    'table',
                    'textcolor'
                ]
                .concat(tinymce_plugins);

                //tinyMCE
                t
                    .tinymce({
                        theme: 'modern',
                        skin: 'lightgray',
                        plugins: plugins,

                        menu: {
                            edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall | searchreplace'},
                            insert: {title: 'Insert', items: 'image media link | anchor hr'},
                            view: {title: 'View', items: 'visualaid | fullscreen preview'},
                            format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
                            table: {title: 'Table', items: 'inserttable tableprops deletetable | cell row column'},
                            tools: {title: 'Tools', items: 'code'}
                        },
                        
                        toolbar: "undo redo | styleselect | bullist numlist | bold italic removeformat | alignleft aligncenter alignright | bullist numlist outdent indent | link image media gapfill jmevisible | fullscreen preview code",

                        statusbar: false,
                        media_strict: false,
                        media_dimensions: false,
                        width: width,
                        verify_html: false,
                        autoresize_bottom_margin: 0,
                        autoresize_min_height: 30,
                        table_responsive_width: true,
                        table_default_attributes: {},
                        table_default_styles: {},
                        convert_urls: false,
                        verify_html: false,

                        forced_root_block: para ? 'p' : false,

                        paste_postprocess: function(ed,args) {
                            remove_empty_spans(args.node);
                        },

                        setup: function(ed) {
                            ed.on('keydown', function(oe) {
                                // when inside a math environment, pressing the enter key adds a <br> instead of a paragraph break.
                                if(oe.key != 'Enter' || oe.shiftKey || oe.ctrlKey || oe.altKey || oe.metaKey || !ed.getBody().classList.contains('in-maths')) {
                                    return;
                                }
                                oe.preventDefault();
                                ed.insertContent('<br data-math-br-hack="true"/>');
                                ed.dom.fire(ed.selection.getNode(),'keydown',{keyCode:37,key:'ArrowDown'});
                                var br = ed.getBody().querySelector('[data-math-br-hack="true"]');
                                ed.selection.select(br);
                                ed.selection.getRng(1).collapse(0);
                                br.removeAttribute('data-math-br-hack');
                            });

                        },

                        init_instance_callback: function(ed) { 
                            writemaths(element);
                            function onMCEChange() {
                                valueAccessor(ed.getContent());
                            }
                            ed.on('change',onMCEChange);
                            ed.on('keyup',onMCEChange);
                            ed.on('paste',onMCEChange);
                            if(preambleCSSAccessor !== undefined) {
                                var s = ed.dom.create('style',{type:'text/css',id:'preamblecss'});
                                ed.dom.doc.head.appendChild(s);
                                ko.computed(function() {
                                    s.textContent = ko.utils.unwrapObservable(preambleCSSAccessor);
                                });
                            }
                            ed.on('keyup',function(e) {
                                if(e.which==27 && ed.plugins.fullscreen.isFullscreen()) {
                                    ed.execCommand('mceFullScreen');
                                }
                            });

                            ed.setContent(ko.unwrap(valueAccessor));
                            ed.undoManager.clear();
                            ed.on('focus',function() {
                                $(ed.getContainer()).addClass('wm-focus');
                            });
                            ed.on('blur',function() {
                                $(ed.getContainer()).removeClass('wm-focus');
                            });

                            var resizer = setInterval(function() {
                                if($(ed.getContainer()).parents('.tab-pane:not(.active)').length==0) {
                                    ed.execCommand('mceAutoResize');
                                    clearInterval(resizer);
                                }
                            }, 100);

                            if(allBindingsAccessor.showButtons) {
                                ko.computed(function() {
                                    var showButtons = ko.unwrap(allBindingsAccessor.showButtons);
                                    var show = showButtons.gapfill();
                                    ed.fire('toggle_gapfill_button',{show:show});
                                },this);
                            }

                            if(allBindingsAccessor.gaps) {
                                ko.computed(function() {
                                    var gaps = ko.unwrap(allBindingsAccessor.gaps);
                                    var part = ko.unwrap(allBindingsAccessor.part);
                                    ed.fire('gaps_changed',gaps);
                                }).extend({rateLimit: 50});
                            }

                        }
                    })
                ;
            }


            if(!editImmediately) {
                well = document.createElement('div');
                well.classList.add('well','not-editing');

                var content_area = document.createElement('div');
                content_area.classList.add('content-area');
                well.appendChild(content_area);

                if (!element.hasAttribute('disabled')){
                    var click_to_edit = document.createElement('p');
                    click_to_edit.classList.add('click-to-edit');
                    click_to_edit.textContent = 'Click to edit';
                    well.appendChild(click_to_edit);
                }

                well.setAttribute('tabindex',0);
                well.setAttribute('role','button');
                element.appendChild(well);

                function activate_editor(e) {
                    e.stopPropagation();
                    if(!element.hasAttribute('disabled')) {
                        make_tinymce();
                    }
                }

                well.addEventListener('click', activate_editor);
                well.addEventListener('keypress',function(e) {
                    if(e.key == 'Enter') {
                        activate_editor(e);
                    }
                });
            } else {
                make_tinymce();
            }
        },
        update: function(element, valueAccessor, allBindingsAccessor) {
            var value = ko.unwrap(valueAccessor()) || '';
            allBindingsAccessor = allBindingsAccessor();

            var well = element.querySelector('.well.not-editing > .content-area');
            if(well) {
                $(well).html(value);
                mathjax_typeset_element(well);
                $(well).find('[data-bind]').each(function() {
                    this.removeAttribute('data-bind');
                });
                if(allBindingsAccessor.gaps) {
                    display_gaps(well);
                    ko.computed(function() {
                        var gaps = ko.unwrap(allBindingsAccessor.gaps);
                        var displayed_gaps = well.querySelectorAll('gapfill');
                        for(var i=0;i<displayed_gaps.length;i++) {
                            var dg = displayed_gaps[i];
                            var n = parseInt(dg.getAttribute('data-number'));
                            dg.textContent = name_for_gap(n,gaps);
                        }
                    }).extend({rateLimit: 50});
                }
            }

            if(element.classList.contains('has-tinymce')) {
                var tinymce = $(element).find('iframe');

                if (!tinymce.is(':focus')) {
                    var ed = $(element).children('.wmTextArea').tinymce();
                    if(ed && ed.initialized) {
                        if(ed.getContent()!=value) {
                            ed.setContent(value);
                        }
                    }
                }
            }
        }
    };

    ko.bindingHandlers.debug = {
        update: function(element,valueAccessor) {
            var value = valueAccessor();
            console.log(value,ko.utils.unwrapObservable(value));
        }
    }

    ko.bindingHandlers.restrictedClick = {
        init: function(element,valueAccessor, allBindings, viewModel, bindingContext) {
            var fn = valueAccessor();
            $(element).click(function(e) {
                if(e.target.hasAttribute('clickable')) {
                    // Take all the event args, and prefix with the viewmodel
                    viewModel = bindingContext['$data'];
                    var argsForHandler = [viewModel].concat(arguments);
                    fn.apply(viewModel, argsForHandler);
                }
            });
        }
    }

    ko.bindingHandlers.foldlist = {
        init: function(element,valueAccessor,allBindingsAccessor,viewModel)
        {
            var value = valueAccessor(), allBindings = allBindingsAccessor();
            var show = allBindings.show;

            element=$(element);
            var b = $('<button type="button" class="delete" data-bind="click:remove" value="Delete"></button>');
            b.click(function(){viewModel.remove()});
            element.append(b);
        }
    };

    function truncate_string(str,maxlength) {
        if(str.length>maxlength) {
            return str.slice(0,maxlength-3)+'...';
        } else {
            return str;
        }
    }

    var displayJMEValue = Editor.displayJMEValue = function(v, abbreviate, scope) {
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
                        lowest_depth = Infinity;

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

                            next_layer_depth = get_deepest_layer(item, depth + 1);
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
                description = 'Dictionary with '+Object.keys(v.value).length+" entries";
                break;
            case 'html':
                if(v.value.length==1 && v.value[0].tagName=='IMG') {
                    var src = v.value[0].getAttribute('src');
                    return {value: '<img src="'+src+'" title="'+src+'">'};
                }
                description = 'HTML node';
                if(!abbreviate) {
                    code = v.value
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

    ko.bindingHandlers.jmevalue = {
        update: function(element, valueAccessor,allBindingsAccessor) {
            var value = ko.unwrap(valueAccessor());
            var allBindings = allBindingsAccessor();
            var error = ko.unwrap(allBindings.error);
            var abbreviate = ko.unwrap(allBindings.abbreviate) !== false;
            var scope = ko.unwrap(allBindings.scope);
            var display = '';
            var type = '';
            if(error) {
                display = {description: error};
                type = 'error';
            } else if(value) {
                try {
                    display = displayJMEValue(value, abbreviate, scope);
                    type = value.type;
                } catch(e) {
                    display = {description: e.message};
                    type = 'error';
                }
            } else {
                display = '';
            }
            element.setAttribute('data-jme-value-type',type);
            if(display.value !== undefined) {
                $(element).html(display.value);
                element.setAttribute('data-jme-value-display','value');
            } else if(display.description !== undefined) {
                $(element).html(display.description);
                element.setAttribute('data-jme-value-display','description');
            }
        }
    }

    ko.bindingHandlers.activeIf = {
        init: function() {
            return ko.bindingHandlers['if'].init.apply(this,arguments);
        },
        update: function(element, valueAccessor) {
            var active = ko.unwrap(valueAccessor());
            element.classList.toggle('active',active);
        }
    }


    ko.bindingHandlers.fadeVisible = {
        init: function (element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function (element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).slideDown(150) : $(element).slideUp(150);
        }
    };

    ko.components.register('undefined-variable-warning', {
        viewModel: function(params) {
            this.expr = params.expr;
            this.vars = params.vars || [];
            this.scope = params.scope || Numbas.jme.builtinScope;
            this.show_syntax_errors = params.show_syntax_errors===undefined ? true : params.show_syntax_errors;
            this.error = ko.pureComputed(function() {
                var expr = ko.unwrap(this.expr);
                try {
                    var tree = Numbas.jme.compile(expr);
                } catch(e) {
                    return this.show_syntax_errors ? e.message : '';
                }
                try {
                    var vars = Numbas.jme.findvars(tree, [], scope);
                } catch(e) {
                    return '';
                }
                var defined_vars = ko.unwrap(this.vars).map(function(n){ return n.toLowerCase() });
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


    ko.components.register('static-dynamic-setting', {
        viewModel: function(params) {
            this.static = params.option.static;
            this.static_value = params.option.static_value;
            this.dynamic_value = params.option.dynamic_value;
            this.disable = params.disable;
            this.type_hint = params.type_hint;
        },
        template: '\
            <div class="control">\
            <!-- ko if: static -->\
                <div>\
                    <!-- ko template: { nodes: $componentTemplateNodes} --><!-- /ko -->\
                </div>\
            <!-- /ko -->\
            <!-- ko if: !static() -->\
                <textarea data-bind="disable: disable, codemirror: dynamic_value, codemirrorMode: \'jme\'"></textarea>\
                <undefined-variable-warning params="expr: dynamic_value, vars: [\'settings\']"></undefined-variable-warning>\
                <p class="help-block" data-bind="if: type_hint">This should evaluate to a <code data-bind="text: type_hint"></code>.</p>\
            <!-- /ko -->\
            </div>\
            <label class="static-switch"><input type="checkbox" data-bind="checked: static, disable: disable"> Static?</label>\
        '
    });

    ko.components.register('editor-pager', {
        viewModel: function(params) {
            var p = this;

            var editor = this.editor = params.editor;
            this.previousTab = params.previousTab ? editor.mainTabber.getTab(params.previousTab) : null;
            this.nextTab = params.nextTab ? editor.mainTabber.getTab(params.nextTab) : null;
            this.task_group = params.task_group;
            this.has_task = editor.section_tasks[this.task_group] !== undefined;
            this.completed = this.has_task ? editor.task_list.section_completed[this.task_group] : true;
            this.still_to_do = this.has_task ? editor.task_list.section_still_to_do[this.task_group] : false;
            this.current_task = ko.pureComputed(function() {
                if(!editor.task_list.section_tasks[this.task_group]) {
                    return null;
                } else {
                    return editor.task_list.section_tasks[this.task_group].filter(function(t){return !t.done()})[0];
                }
            },this);

            this.focus = function() {
                var task = p.current_task();
                if(task) {
                    if(task.focus_on) {
                        var s = $(task.focus_on);
                        if(s.hasClass('wmTextArea')) {
                            s.tinymce().focus();
                        } else {
                            s.focus();
                        }
                    }
                    if(task.switch_action) {
                        task.switch_action();
                    }
                }
            }
            this.visible = params.visible || true;
        },
        template: '\
            <nav data-bind="visible: visible">\
                <ul class="pager">\
                    <li class="previous" data-bind="if: previousTab">\
                        <a title="Back to the previous section" href="#" data-bind="click: editor.mainTabber.setTab(previousTab.id)">← <span data-bind="text: previousTab.title"></span></a>\
                    </li>\
                    <span role="button" tabindex="0" class="still-to-do text-warning" data-bind="if: has_task, visible: !ko.unwrap(completed), click: focus">Before moving on, you should <span data-bind="html: still_to_do"></span></span>\
                    <span data-bind="if: nextTab, visible: ko.unwrap(completed)" class="text-success">Move on when you\'re ready!</span>\
                    <li class="next" data-bind="if: nextTab, css: {ready: completed}">\
                        <a title="Proceed to the next section" href="#" data-bind="click: editor.mainTabber.setTab(nextTab.id)"><span data-bind="text: nextTab.title"></span> →</a>\
                    </li>\
                </ul>\
            </nav>\
        '
    });
    ko.components.register('listbox', {
        viewModel: function(params) {
            var lb = this;
            this.disabled = params.disabled;
            this.value = ko.observable('');
            this.items = params.items;
            this.id = params.id;
            this.edit_item = function(item,e) {
                var input = e.target.parentElement.nextElementSibling;
                var i = $(e.target).index();
                lb.items.splice(i,1);
                if(input.value) {
                    lb.items.push(input.value);
                }
                input.value = item;
                input.focus();
            }
            this.blur = function(lb,e) {
                var item = e.target.value.trim();
                if(item) {
                    lb.items.push(item);
                }
                e.target.value = '';
            }
            this.keydown = function(lb,e) {
                var input = e.target;
                switch(e.which) {
                    case 13:
                    case 188:
                        // enter or comma
                        var val = input.value.slice(0,input.selectionStart).trim();
                        if(val.length) {
                            lb.items.push(val);
                        }
                        input.value = input.value.slice(val.length);
                        break;
                    case 8:
                        // backspace
                        if(input.selectionStart==0 && input.selectionEnd==0) {
                            var oval = input.value;
                            var val = (lb.items.pop() || '');
                            input.value = val+oval;
                            input.setSelectionRange(val.length,val.length);
                        } else {
                            return true;
                        }
                        break;
                    default:
                        return true;
                }
            }
        },
        template: '\
            <ul class="list-inline" data-bind="foreach: items">\
                <button type="button" class="btn btn-default btn-sm" data-bind="click: $parent.edit_item, text: $data, attr: {disabled: $parent.disabled}"></button>\
            </ul>\
            <input type="text" class="form-control" data-bind="visible: !disabled, textInput: value, event: {blur: blur, keydown: keydown}, attr: {id: id}">\
        '
    });

    ko.components.register('multi-select-checkboxes',{
        viewModel: function(params) {
            var labelProperty = ko.unwrap(params.labelProperty);
            var helpProperty = ko.unwrap(params.helpProperty);
            var selectedOptions = ko.unwrap(params.selectedOptions);
            var valueName = ko.unwrap(params.valueName);
            this.disable = ko.unwrap(params.disabled) || false;
            this.options = ko.pureComputed(function() {
                return ko.unwrap(params.options).map(function(option) {
                    var value = valueName ? ko.unwrap(option[valueName]) : option
                    return {
                        checked: ko.observable(selectedOptions.indexOf(value)!=-1),
                        label: option[labelProperty],
                        help: option[helpProperty],
                        value: value
                    }
                })
            });
            ko.computed(function() {
                params.selectedOptions(this.options().filter(function(p){return p.checked()}).map(function(p){return p.value}));
            },this)
        },
        template: '\
            <ul class="list-unstyled" data-bind="foreach: options"> \
                <li>\
                    <label>\
                        <input type="checkbox" data-bind="checked:checked, disable: $parent.disable">\
                        <span data-bind="text:label"></span>\
                    </label>\
                    <span class="help-block help-block-inline" data-bind="text: help"></span>\
                </li>\
            </ul>\
            '
    });

    ko.components.register('taxonomy-node',{
        viewModel: function(params) {
            var n = this.node = params.node;
            this.disable = params.disable || false;
        },
        template: '\
        <li class="taxonomy-node" data-bind="css: {used:node.used}">\
            <label class="description">\
                <input type="checkbox" name="taxonomy_nodes" data-bind="checked: node.used, disable: disable, attr: {value: node.pk}"> \
                <span class="code" data-bind="text: node.code + (node.code ? \' - \' : \'\')"></span>\
                <span class="name" data-bind="text: node.name"></span>\
            </label>\
            <ul data-bind="fadeVisible: node.used, foreach: node.children">\
                <taxonomy-node params="node: $data, disable: $parent.disable"></taxonomy-node>\
            </ul>\
        </li>\
        '
    });

    ko.bindingHandlers.dragOut = {
        init: function(element, valueAccessor) {
            var obj = {
                data: null,
                sortable: ''
            };
            obj = Object.assign(obj,valueAccessor());
            $(element)
                .draggable({
                    handle: '.handle',
                    revert: true, 
                    revertDuration: 100,
                    helper: 'clone',
                    connectToSortable: obj.sortable
                })
            ;
        }
    };

    ko.bindingHandlers.JME = {
        update: function(element,valueAccessor,allBindingsAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            var allBindings = allBindingsAccessor();
            var parser = allBindings.parser || Numbas.jme.standardParser;
            var scope = find_jme_scope(element).scope || Numbas.jme.builtinScope;
            var rules = ko.unwrap(allBindings.rules);
            var res = Editor.texJMEBit(value,rules,parser,scope);
            $(element).toggleClass('jme-error',res.error);
            if(res.error) {
                $(element).html(res.message);
            } else {
                var tex = res.tex;
                if(tex.length>0) {
                    element.innerHTML = '$'+tex+'$';
                    mathjax_typeset_element(element);
                } else {
                    $(element).html('');
                }
            }
        }
    };

    ko.bindingHandlers.DOMsubvars = {
        update: function(element,valueAccessor) {
            const html_string = ko.unwrap(valueAccessor());
            var d = document.createElement('div');
            d.innerHTML = html_string;
            let html = d.firstElementChild;
            element.appendChild(d);
            const scope = find_jme_scope(d).scope;
            html = Numbas.jme.variables.DOMcontentsubvars(d,scope);
            element.innerHTML = '';
            element.appendChild(html);
            mathjax_typeset_element(element);
        }
    }

    ko.bindingHandlers.jme_scope = {
        update: function(element, valueAccessor) {
            const scope = ko.unwrap(valueAccessor());
            if(scope) {
                element.classList.add('jme-scope');
                $(element).data('jme-scope',scope);
            } else {
                element.classList.remove('jme-scope');
            }
        }
    }

    ko.bindingHandlers.latex = {
        update: function(element,valueAccessor) {
            ko.bindingHandlers.html.update.apply(this,arguments);
            mathjax_typeset_element(element);
        }
    }

    ko.bindingHandlers.inline_latex = {
        update: function(element,valueAccessor) {
            element.innerHTML = '';
            var script = document.createElement('script');
            script.setAttribute('type','math/tex');
            script.textContent = ko.unwrap(valueAccessor());
            element.appendChild(script);
            mathjax_typeset_element(element);
        }
    }

    ko.bindingHandlers.fromNow = {
        init: function(element,valueAccessor) {
            var value = valueAccessor();
            function update() {
                $(element).text(moment(ko.utils.unwrapObservable(value)).fromNow());
            }
            update();
            ko.utils.domData.set(element,'fromNow',setInterval(update,30000));
        },
        update: function(element,valueAccessor) {
            clearInterval(ko.utils.domData.get(element,'fromNow'));
            ko.bindingHandlers.fromNow.init(element,valueAccessor);
        }
    }
    ko.bindingHandlers.calendarTime = {
        init: function(element,valueAccessor) {
            var value = valueAccessor();
            function update() {
                $(element).text(moment(ko.utils.unwrapObservable(value)).format('DD/MM/YYYY'));
            }
            update();
            ko.utils.domData.set(element,'calendarTime',setInterval(update,30000));
        },
        update: function(element,valueAccessor) {
            clearInterval(ko.utils.domData.get(element,'calendarTime'));
            ko.bindingHandlers.calendarTime.init(element,valueAccessor);
        }
    }

    /** update the value of an observable when the input event is triggered
     * augments the value binding
     */
    ko.bindingHandlers.inputValue = {
        init: function(element,valueAccessor) {
            var value = valueAccessor();
            $(element).on('input',function() {
                value($(element).val());
            });
            ko.applyBindingsToNode(element,{value:value});
        }
    }

    ko.bindingHandlers.scrollIntoView = {
        init: function() {
        },
        update: function(element, valueAccessor, allBindings, bindingContext) {
            var value = ko.unwrap(valueAccessor());
            if(value) {
                element.scrollIntoView({block: 'nearest'});
            }
        }
    }

    var AbilityFramework = Editor.AbilityFramework = function(data) {
        this.name = data.name;
        this.description = data.description;
        this.pk = data.pk;
        this.levels = data.levels.map(function(ld) {return new AbilityLevel(ld)});
    }

    var AbilityLevel = Editor.AbilityLevel = function(data) {
        this.name = data.name;
        this.description = data.description;
        this.pk = data.pk;
        this.start = data.start;
        this.end = data.end;
        this.used = ko.observable(false);
    }

    var Resource = Editor.Resource = function(data) {
        this.progress = ko.observable(0);
        this.url = ko.observable('');
        this.filename = ko.observable('');
        var prefix = 'resources/question-resources/';
        this.name = ko.computed({
            read: function() {
                return prefix+this.filename();
            },
            write: function(v) {
                if(v.startsWith(prefix)) {
                    v = v.slice(prefix.length);
                }
                return this.filename(v);
            }
        }, this);
        this.pk = ko.observable(0);
        this.alt_text = ko.observable('');

        if(data) {
            this.load(data);
            this.progress(1);
        }
    }
    Resource.prototype = {
        load: function(data) {
            this.url(data.url);
            this.name(data.name);
            this.pk(data.pk);
            this.alt_text(data.alt_text);
            this.deleteURL = data.delete_url;
        },

        toJSON: function() {
            return {
                pk: this.pk(),
                name: this.filename()
            }
        },

        filePatterns: {
            'html': /\.html?$/i,
            'img': /\.(png|jpg|gif|bmp|jpeg|webp|tiff|tif|raw|svg)$/i,
            'video': /\.(mp4|m4v)$/i,
        },

        filetype: function() {
            var name = this.name();
            for(var type in this.filePatterns) {
                if(this.filePatterns[type].test(name))
                    return type;
            }
        },

        copy_url: function() {
            copy_text_to_clipboard(this.name());
        },

        can_embed: function() {
            var type = this.filetype();
            return type=='img' || type=='html' || type=='video';
        }
    };

    var CommentWriter = Editor.CommentWriter = function() {
        this.writingComment = ko.observable(false);
        this.commentText = ko.observable('');
        this.commentIsEmpty = ko.pureComputed(function() {
            return $(this.commentText()).text().trim()=='';
        },this);
        this.submitComment = function(form) {
            if(this.commentIsEmpty()) {
                return;
            }

            fetch(form.getAttribute('action'), {method: 'POST', body: CSRFFormData({text: this.commentText()})}).then(async response => {
                const {html} = await response.json();
                const timeline = document.querySelector('.timeline');
                timeline.innerHTML = html + timeline.innerHTML;
                mathjax_typeset_element(timeline);

            });

            this.commentText('');
            this.writingComment(false);
        }
        this.cancelComment = function() {
            this.commentText('');
            this.writingComment(false);
        }

        this.add_text = function(text) {
            this.commentText(this.commentText()+'\n'+text);
        }
    }

    $('body').on('click','.timeline-item .hide-item',function(e) {
        var element = this;
        e.preventDefault();
        e.stopPropagation();
        fetch(element.getAttribute('href'), {method: 'POST', body: CSRFFormData()}) 
            .then(async response => {
                if(!response.ok) {
                    throw(new Error(response.statusText));
                }
                let p = element;
                while(!p.classList.contains('timeline-item')) {
                    p = p.parentElement;
                    if(!p) {
                        return;
                    }
                }
                p.parentElement.removeChild(p);
            })
            .catch(err => {
                noty({
                    text: `Error hiding timeline item: ${err}`,
                    layout: "topLeft",
                    type: "error",
                    textAlign: "center",
                    animateOpen: {"height":"toggle"},
                    animateClose: {"height":"toggle"},
                    speed: 200,
                    timeout: 5000,
                    closable:true,
                    closeOnSelfClick: true
                });
            })
        ;
    });

    $('body').on('click','.timeline-item .delete',function(e) {
        var element = this;
        e.preventDefault();
        e.stopPropagation();
        fetch(element.getAttribute('href'), {method: 'POST', body: CSRFFormData()})
            .then(response => {
                if(!response.ok) {
                    throw(new Error(response.statusText));
                }
                let p = element;
                while(!p.classList.contains('timeline-item')) {
                    p = p.parentElement;
                    if(!p) {
                        return;
                    }
                }
                p.parentElement.removeChild(p);

                response.json().then(data => {
                    if(window.viewModel && data.current_stamp!==undefined) {
                        viewModel.current_stamp(data.current_stamp);
                    }
                }).catch(() => {});
            })
            .catch(err => {
                noty({
                    text: `Error deleting timeline item: ${err}`,
                    layout: "topLeft",
                    type: "error",
                    textAlign: "center",
                    animateOpen: {"height":"toggle"},
                    animateClose: {"height":"toggle"},
                    speed: 200,
                    timeout: 5000,
                    closable:true,
                    closeOnSelfClick: true
                });
            })
        ;
    });

    ko.bindingHandlers.jmescope = {
        update: function(element, valueAccessor) {
            const scope = Knockout.unwrap(valueAccessor());
            Numbas.display_util.set_jme_scope(element, scope);
        }
    };

    ko.bindingHandlers.fileupload = {
        init: function(element, valueAccessor, allBindingsAccessor) {
            var fileArray = valueAccessor();
            var allBindings = allBindingsAccessor();
            var afterUpload = allBindings.afterupload;

            $(element).fileupload({
                dataType: 'json',
                dropZone: $(element),

                done: function (e, data) {
                    data.res.load(data.result);
                    if(afterUpload)
                        afterUpload(data.res);
                },
                add: function(e, data) {
                    data.res = new Resource();
                    fileArray.splice(0,0,data.res);
                    data.process().done(function() {
                        data.submit();
                    });
                },

                progress: function(e,data) {
                    data.res.progress(data.loaded/data.total);
                },

                fail: function(e, data) {
                    fileArray.remove(data.res);
                    noty({text:'There was an error uploading the resource: '+data.errorThrown, type:'error',timeout: 5000, layout: 'topCenter'})
                }

            });
        }
    }

    function update_notifications(response) {
        $('#notifications .dropdown-menu').html(response.html);
        var description = response.num_unread+' unread '+(response.num_unread==1 ? 'notification' : 'notifications')
        $('#notifications .dropdown-toggle').attr('title',description);
        $('#notifications .badge').text(response.num_unread>0 ? response.num_unread : '');
        $('#notifications .sr-description').text(description);
        if(response.num_unread) {
            $('#notifications').addClass('active');
            $('#notifications .dropdown-toggle').removeClass('disabled');
        } else {
            $('#notifications').removeClass('active open');
            $('#notifications .dropdown-toggle').addClass('disabled');
        }
    }

    document.getElementById('notifications').addEventListener('click', ({target}) => {
        if(!target.classList.contains('mark-all-as-read')) {
            return;
        }

        update_notifications({html:'', num_unread: 0});

        e.stopPropagation();
        e.preventDefault();

        var url = target.getAttribute('href');
        fetch(url, {method: 'POST', body: CSRFFormData()}).then(response => response.json()).then(update_notifications);
    });

    var last_notification = null;

    async function fetch_notifications() {
        if(!document.hasFocus()) {
            return;
        }
        if(!is_logged_in) {
            return;
        }
        const response = await (await fetch(Editor.url_prefix+'notifications/unread_json/')).json();
        if(response.last_notification != last_notification) {
            last_notification = response.last_notification;
            update_notifications(response);
        }
    }

    setInterval(fetch_notifications,15000);

    fetch_notifications();

    var questions_in_basket = Editor.questions_in_basket = function() {
        return $('#question_basket .dropdown-menu .question').map(function(){return parseInt($(this).attr('data-id'))}).toArray();
    }

    var update_basket = Editor.update_basket = function(response) {
        var num_questions = $('#question_basket .dropdown-menu .question').length;
        $('#question_basket .dropdown-toggle').attr('title',num_questions+' '+(num_questions==1 ? 'question' : 'questions')+' in your basket');
        $('#question_basket .badge').text(num_questions>0 ? num_questions : '');
        if(num_questions) {
            $('#question_basket .dropdown-toggle').removeClass('disabled');
        } else {
            $('#question_basket').removeClass('active open');
            $('#question_basket .dropdown-toggle').addClass('disabled');
        }
        var ids = questions_in_basket();
        $('.add-to-basket[data-question-id]').each(function() {
            var id = parseInt($(this).attr('data-question-id'));
            var inBasket = ids.indexOf(id)>=0;
            $(this).toggleClass('in-basket',inBasket);
            $(this).attr('title',inBasket ? 'This is in your basket' : 'Add this to your basket');
        });
    }

    update_basket();

    Editor.add_question_to_basket = function(id) {
        fetch(Editor.url_prefix+'question_basket/add/',{method: 'POST', body: CSRFFormData({id: id})})
            .then(response => response.text()).then(response => {
                document.querySelector('#question_basket .dropdown-menu').innerHTML = response;
                update_basket();
            })
        ;
    }
    Editor.remove_question_from_basket = function(id) {
        fetch(Editor.url_prefix+'question_basket/remove/',{method: 'POST', body: CSRFFormData({id: id})})
            .then(response => response.text()).then(response => {
                document.querySelector('#question_basket .dropdown-menu').innerHTML = response;
                update_basket();
            })
        ;
    }
    Editor.empty_basket = function() {
        fetch(Editor.url_prefix+'question_basket/empty/',{method: 'POST', body: CSRFFormData({id: id})})
            .then(response => response.text()).then(response => {
                document.querySelector('#question_basket .dropdown-menu').innerHTML = response;
                update_basket();
            })
        ;
    }

    const question_basket = document.getElementById('question_basket');

    question_basket.querySelector('.empty-basket').addEventListener('click', e => {
        e.preventDefault();

        Editor.empty_basket();
    })

    question_basket.addEventListener('click', e => {
        if(e.target.classList.contains('btn-remove')) {
            e.preventDefault();
            Editor.remove_question_from_basket(e.target.dataset.id);
            return;
        }
    });

    document.body.addEventListener('click', e => {
        if(e.target.classList.contains('add-to-basket')) {
            e.preventDefault();

            const id = parseInt(e.target.dataset.questionId);
            if(questions_in_basket().indexOf(id) >= 0) {
                Editor.remove_question_from_basket(id);
            } else {
                Editor.add_question_to_basket(id);
            }
        } else if(e.target.classList.contains('add-to-queue')) {
            e.preventDefault();
            
            const id = e.target.dataset.itemId;
            const name = e.target.dataset.itemName;
            document.querySelector('#add-to-queue-modal .item-name').textContent = name;
            for(let a of document.querySelectorAll('#add-to-queue-modal .queues a.pick')) {
                if(!a.dataset.originalHref) {
                    a.setAttribute('data-original-href', a.getAttribute('href'));
                }
                a.setAttribute('href', a.getAttribute('data-original-href')+'?item='+id);
            }
            $('#add-to-queue-modal').modal('show');
        }
    });

    Editor.autocomplete_source = function(obj,from,to) {
        return function(s,callback) {
            var result = ko.unwrap(from).filter(function(o2) {
                if(o2 == obj || ko.unwrap(to).contains(o2)) {
                    return false;
                }
                return ko.unwrap(o2.name).toLowerCase().indexOf(s.term.toLowerCase())>=0;
            }).map(function(o2) { return { label: ko.unwrap(o2.name), value: o2 } })
            callback(result);
        }
    }

    Editor.user_search_autocomplete = function(elements,options,jquery_options) {
        options = Object.assign({url: '/accounts/search'}, options);
        var url = options.url;
        source = function(req,callback) {
            this.element.addClass('loading');
            const url = new URL(options.url, location);
            url.searchParams.set('q', req.term);
            fetch(url, {headers: {'accept': 'application/json'}})
                .then(response => response.json()).then(data => {
                    var things = [];
                    var things = data.map(function(d) {
                        return {label: d.autocomplete_entry, value: d.name, id: d.id, profile: d.profile}
                    });
                    callback(things);
                    this.element.removeClass('loading');
                })
            ;
        }
        function set_user(e,ui) {
            console.log('set_user');
            var id = ui.item.id;
            $(this).parents('form').find('[name="selected_user"]').val(id);
        }

        $(elements).autocomplete(Object.assign({source: source, select: set_user, html: true},jquery_options));
    }

    Editor.user_search_autocomplete([document.getElementById('top-search-bar')],{url:'/top-search/'},{select: function(e,ui) {
        window.location.href = ui.item.profile;
    }});

    Editor.tinymce = function(extra_options) {
        var options = {
            theme: 'modern',
            skin: 'lightgray',
            statusbar: false,
            autoresize_bottom_margin: 0,
            relative_urls: false,
            theme_advanced_resizing: true,
            theme_advanced_resize_horizontal: false,
            plugins: ['link','fullscreen','autoresize','anchor','code','codesample','colorpicker','directionality','fullscreen','hr','link','paste','searchreplace','table','textcolor','textpattern']
        }
        options = Object.assign(options,extra_options);

        return tinymce.init(options);
    }

    Editor.codemirror = function(element, extra_options) {
        var options = {
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            mode: 'javascript',
            indentWithTabs: false,
            indentUnit: 2,
            lineWrapping: Editor.wrapLines
        }
        options = Object.assign(options, extra_options);
        return CodeMirror.fromTextArea(element,options);
    }

    Editor.noop = function() {}

    Editor.numberNotationStyles = [
        {
            code: 'plain',
            name: 'English (Plain)',
            description: 'No thousands separator; dot for decimal point.'
        },
        {
            code: 'en',
            name:'English',
            description:'Commas separate thousands; dot for decimal point.'
        },
        {
            code: 'si-en',
            name:'SI (English)',
            description:'Spaces separate thousands; dot for decimal point.'
        },
        {
            code: 'si-fr',
            name:'SI (French)',
            description:'Spaces separate thousands; comma for decimal point.'
        },
        {
            code: 'eu',
            name: 'Continental',
            description:'Dots separate thousands; comma for decimal point.'
        },
        {
            code: 'plain-eu',
            name:'Continental (Plain)',
            description:'No thousands separator; comma for decimal point.'
        },
        {
            code: 'ch',
            name:'Swiss',
            description:'Apostrophes separate thousands; dot for decimal point.'
        },
        {
            code: 'in',
            name:'Indian',
            description:'Commas separate groups; rightmost group is 3 digits, other groups 2 digits; dot for decimal point.'
        },
        {
            code: 'scientific',
            name: 'Scientific',
            description:'A significand followed by the letter \'e\' and an integer exponent.'
        }
    ];

    Editor.receive_file_drops = function(element, drop_handler) {
        element.addEventListener('dragover', e => {
            e.preventDefault();
            element.classList.add('dragging');
        });
        element.addEventListener('dragleave', e => {
            element.classList.remove('dragging');
        });
        element.addEventListener('drop', e => {
            e.stopPropagation();
            e.preventDefault();

            drop_handler(e);
        });
    }
});
