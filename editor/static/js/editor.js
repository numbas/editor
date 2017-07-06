var prettyData,tryLoad,slugify;
if(!window.Editor)
	window.Editor = {};

$(document).ready(function() {

	function texJMEBit(expr,rules) {
		rules = rules || [];
		var scope = new Numbas.jme.Scope(Numbas.jme.builtinScope,{rulesets: Numbas.jme.display.simplificationRules});
		try{
			if(viewModel && viewModel.rulesets) {
				viewModel.rulesets().map(function(r) {
					scope.rulesets[r.name()] = Numbas.jme.collectRuleset(r.sets(),scope.rulesets);
				});
			}
			var sbits = Numbas.util.splitbrackets(expr,'{','}');
			var expr = '';
			for(var j=0;j<sbits.length;j+=1)
			{
				expr += j%2 ? ' subvar('+sbits[j]+')' : sbits[j]; //subvar here instead of \\color because we're still in JME
			}
			expr = {tex: Numbas.jme.display.exprToLaTeX(expr,rules,scope), error: false};
			return expr;
		} catch(e) {
            var tex = e.message.replace(/<\/?(code|em|strong)>/g,'');
			return {message: e.message, tex: '\\color{red}{\\text{'+tex+'}}', error: true};
		}
	}

    var currentScope = null;

    MathJax.Hub.Register.MessageHook("End Math Input",function() {
        currentScope = null;
    });

	MathJax.Hub.Register.StartupHook("TeX Jax Ready",function () {

		var TEX = MathJax.InputJax.TeX;

		TEX.prefilterHooks.Add(function(data) {
			currentScope = $(data.script).parents('.jme-scope').first().data('jme-scope');
		});

		TEX.Definitions.Add({macros: {
			'var': 'JMEvar', 
			'simplify': 'JMEsimplify'
		}});

        function JMEvarsub(name) {
            var settings_string = this.GetBrackets(name);
            var settings = {};
            if(settings_string!==undefined) {
                settings_string.split(/\s*,\s*/g).forEach(function(v) {
                    var setting = v.trim().toLowerCase();
                    settings[setting] = true;
                });
            }
            var expr = this.GetArgument(name);

            var scope = currentScope;

            try {
                var v = Numbas.jme.evaluate(Numbas.jme.compile(expr,scope),scope);

                var tex = Numbas.jme.display.texify({tok: v},settings);
            }catch(e) {
                throw(new Numbas.Error('mathjax.math processing error',{message:e.message,expression:expr}));
            }
            var mml = TEX.Parse(tex,this.stack.env).mml();

            this.Push(mml);
        }
        function JMEsimplifysub(name) {
            var rules = this.GetBrackets(name);
            if(rules===undefined) {
                rules = 'all';
            }
            var expr = this.GetArgument(name);

            var scope = currentScope;
            expr = Numbas.jme.subvars(expr,scope);

            var tex = Numbas.jme.display.exprToLaTeX(expr,rules,scope);
            var mml = TEX.Parse(tex,this.stack.env).mml();

            this.Push(mml);
        }

		TEX.Parse.Augment({
			JMEvar: function(name) {
                if(currentScope) {
                    JMEvarsub.apply(this,[name]);
                    return;
                }
				var rules = this.GetBrackets(name);
				var expr = this.GetArgument(name);

				var res = texJMEBit(expr,rules);
                expr = res.tex || res.message;
				var tex = '\\class{jme-var}{\\left\\{'+expr+'\\right\\}}';
				var mml = TEX.Parse(tex,this.stack.env).mml();
				this.Push(mml);
			},

			JMEsimplify: function(name) {
                if(currentScope) {
                    JMEsimplifysub.apply(this,[name]);
                    return;
                }
				var rules = this.GetBrackets(name);
				var expr = this.GetArgument(name);
				var res = texJMEBit(expr,rules);
                expr = res.tex || res.message;
				var tex = ' \\class{jme-simplify}{\\left\\{'+expr+'\\right\\}}'
				var mml = TEX.Parse(tex,this.stack.env).mml();
				this.Push(mml);
			}
		})
	});

	$.noty.defaultOptions.theme = 'noty_theme_twitter';

	slugify = function(s) {
		return s.trim().replace(/[^\w\s]/g,'').toLowerCase().replace(/\s/g,'-');
	};

	tryLoad = function(data,attr,obj,altname) {
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

		function set(value) {
			if(altname in obj && typeof obj[altname]() == 'string')
				value+='';
			obj[altname](value);
		}

		if(attr in data)
			set(data[attr]);
		else if(attr.toLowerCase() in data)
			set(data[attr.toLowerCase()]);
	}

    Editor.numbasVersion = 'exam_question_groups';

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

	Editor.Tab = function(id,title,icon,visible,more_important) {
		this.id = id;
		this.title = title;
        this.icon = icon;
		this.visible = visible === undefined ? true : visible;
        this.more_important = more_important;
	}

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


    Editor.nonempty_task = function(text,observable,focus_on) {
        return {
            text: text, 
            done: ko.computed(function() {return observable() && true}),
            focus_on: focus_on
        };
    }


    Editor.searchBinding = function(search,url,makeQuery) {
		search.results.error = ko.observable('');
		search.searching = ko.observable(false);

        if('page' in search.results) {
            search.results.pages = ko.computed(function() {
                var results = this.all();
                var pages = [];
                for(var i=0;i<results.length;i+=10) {
                    pages.push(results.slice(i,i+10));
                }

                return pages;
            },search.results);

            search.results.pageText = ko.computed(function() {
                return this.page()+'/'+this.pages().length;
            },search.results);
        }

		search.submit = function() {
            var data = makeQuery();
			if(!data) {
				search.results.raw([]);
				search.lastID = null;
				return;
			}

            data.id = search.lastID = Math.random()+'';
            if(search.restorePage)
                data.page = search.restorePage;
            else
                data.page = 1;

			search.results.error('');
            search.searching(true);

            $.getJSON(url,data)
                .success(function(response) {
					if(response.id != search.lastID)
						return;
					search.results.raw(response.object_list);
                    if('page' in search.results)
                        search.results.page(parseInt(response.page) || 1);
                })
                .error(function() {
					if('console' in window)
	                    console.log(arguments);
					search.results.raw([]);
					search.results.error('Error fetching results: '+arguments[2]);
                })
                .complete(function() {
                    search.searching(false);
                });
            ;

		};
		search.submit();
    }

	Editor.mappedObservableArray = function(map) {
		var obj = {list: ko.observableArray([]), lastData: []};
		var obs = ko.computed({
			owner: obj,
			read: obj.list,
			write: function(l) {
                var current_mapped = obj.list();
                var out = [];
                for(var i=0;i<l.length;i++) {
                    if(i<obj.lastData.length && l[i]==obj.lastData[i]) {
                        out.push(current_mapped[i]);
                    } else {
                        out.push(map(l[i]));
                    }
                }
                obj.lastData = l;
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
        obs.getLastData = function() {
            return obj.lastData;
        }
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
            if(!Editor.save_noty)
            {
                Editor.save_noty = noty({
                    text: 'Saving...', 
                    layout: 'topCenter', 
                    type: 'information',
                    timeout: 0, 
                    speed: 150,
                    closeOnSelfClick: false, 
                    closeButton: false
                });
            }
                
            window.onbeforeunload = function() {
                return 'There are still unsaved changes.';
            }
        }
    }
    Editor.endSave = function() {
        Editor.savers = Math.max(Editor.savers-1,0);
        if(Editor.savers==0) {
            window.onbeforeunload = null;
            $.noty.close(Editor.save_noty);
            Editor.save_noty = null;
        }
    }
    Editor.abortSave = function(reason) {
        Editor.savers = Math.max(Editor.savers-1,0);
        $.noty.close(Editor.save_noty);
        Editor.save_noty = null;
        window.onbeforeunload = function() {
            return reason;
        }
    }

    //obs is an observable on the data to be saved
    //savefn is a function which does the save, and returns a deferred object which resolves when the save is done
    Editor.saver = function(obs,savefn) {
        var firstSave = true;

        return ko.computed(function() {
            var data = obs();
			if(data===undefined) {
				return;
			}
            if(firstSave) {
                firstSave = false;
                return;
            }
            Editor.startSave();
            data.csrfmiddlewaretoken = getCookie('csrftoken');
            try {
                var def = savefn(data);
                def
                    .always(Editor.endSave)
                    .done(function() {
                        noty({text:'Saved.',type:'success',timeout: 1000, layout: 'topCenter'})
                    })
                ;
            } catch(e) {
                Editor.abortSave(e.message);
            }
        }).extend({throttle:1000});
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
        this.subjects = ko.observableArray([]);
        this.topics = ko.observableArray([]);
        this.ability_frameworks = ko.observableArray([]);
		this.realtags = ko.observableArray([]);
		this.description = ko.observable('');
        this.ignored_publishing_criteria = ko.observable(false);

		this.mainTabs = ko.observableArray([]);

		this.currentTab = ko.observable();

        this.setTab = function(id) {
            return function() {
                var tab = ei.getTab(id);
                ei.currentTab(tab);
                ei.ignored_publishing_criteria(false);
            }
        }

        this.subjects(item_json.subjects.map(function(d) {
            return new Editor.Subject(d);
        }));

        this.topics(item_json.topics.map(function(d) {
            return new Editor.Topic(d,ei.subjects);
        }));

        this.any_subjects_selected = ko.computed(function() {
            return this.subjects().some(function(s){return s.used()});
        },this);

        this.ability_frameworks(item_json.ability_frameworks.map(function(d) {
            return new Editor.AbilityFramework(d);
        }));

        this.ability_levels = ko.computed(function() {
            var o = [];
            this.ability_frameworks().map(function(af) {
                o = o.concat(af.levels);
            });
            return o;
        },this);

        this.used_ability_levels = ko.computed(function() {
            return this.ability_levels().filter(function(al){return al.used()});
        },this);

        item_json.licences.sort(function(a,b){a=a.short_name;b=b.short_name; return a<b ? -1 : a>b ? 1 : 0 });
        this.licence_name = ko.computed(function() {
            if(this.licence()) {
                return this.licence().name;
            } else {
                return 'None specified';
            }
        },this);

		this.realName = ko.computed(function() {
			var name = this.name()
			return name.length>0 ? name : 'Untitled Question';
		},this);

        this.tags = ko.computed({
            read: function() {
				return this.realtags().sort(function(a,b) {
					a = a.toLowerCase();
					b = b.toLowerCase();
					return a>b ? 1 : a<b ? -1 : 0;
				});
			},
            write: function(newtags) {
				newtags = newtags.slice();
                for(var i=newtags.length-1;i>=0;i--)
                {
                    if(newtags.indexOf(newtags[i])<i)
                        newtags.splice(i,1);
                }
                this.realtags(newtags);
            }
        },this);

        this.tags.push = function(thing) {
            thing = thing.trim();
			if(thing.length==0)
				return;
            if(ei.realtags().indexOf(thing)==-1) {
                ei.realtags.push(thing);
            }
        }
        this.tags.pop = function(thing) {
            return ei.realtags.pop();
        }
        this.tags.splice = function(i,n) {
            return ei.realtags.splice(i,n);
        }
		this.tags.remove = function(q) {
			return ei.realtags.remove(q);
		}

		this.metadata = ko.computed(function() {
			return {
				description: this.description(),
                licence: this.licence_name()
			};
		},this);

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);

        if(item_json.editable) {
            //access control stuff
            this.public_access = ko.observable(item_json.public_access);
            this.access_options = [
                {value:'hidden',text:'Hidden'},
                {value:'view',text:'Anyone can view this'},
                {value:'edit',text:'Anyone can edit this'}
            ];
            this.public_access_text = ko.computed(function() {
                var public_access = this.public_access();
                return this.access_options.filter(function(t){return t.value==public_access})[0].text;
            },this);
            this.access_rights = ko.observableArray(item_json.access_rights.map(function(d){
                var access = new UserAccess(ei,d.user)
                access.access_level(d.access_level);
                return access;
            }));

            this.access_data = ko.computed(function() {
                return {
                    public_access: ei.public_access(),
                    user_ids: ei.access_rights().map(function(u){return u.id}),
                    access_levels: ei.access_rights().map(function(u){return u.access_level()})
                }
            });
            this.saveAccess = Editor.saver(this.access_data,function(data) {
                return $.post('/item/'+ei.editoritem_id+'/set-access',data);
            });
            this.userAccessSearch=ko.observable('');

            this.addUserAccess = function(data) {
                var access_rights = ei.access_rights();
                for(var i=0;i<access_rights.length;i++) {
                    if(access_rights[i].id==data.id) {
                        noty({
                            text: "That user is already in the access list.",
                            layout: "center",
                            speed: 100,
                            type: 'error',
                            timeout: 2000,
                            closable: true,
                            animateOpen: {"height":"toggle"},
                            animateClose: {"height":"toggle"},
                            closeOnSelfClick: true
                        });
                        return;
                    }
                }
                var access = new UserAccess(ei,data);
                ei.access_rights.push(access);
            };
        }

        this.addStamp = function(status_code) {
            return function() {
                $.post('stamp',{'status': status_code, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(response) {
                    $('.timeline').prepend(response.html).mathjax();
                    ei.current_stamp(response.object_json);
                });
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
            ei.setTab('settings')();
            ko.tasks.runEarly();
            $('#name-input').focus();
        }
    }
    Editor.EditorItem.prototype = {
        init_tasks: function() {
            var ei = this;

            this.section_completed = {};
            this.section_still_to_do = {};

            function section_completed(tasks) {
                return ko.computed(function() {
                    return tasks.every(function(t){return ko.unwrap(t.done)});
                })
            }

            function section_still_to_do(tasks) {
                return ko.computed(function() {
                    var task = tasks.filter(function(t){return !ko.unwrap(t.done)})[0];
                    function uncapitalise(str){ 
                        return str.slice(0,1).toLowerCase()+str.slice(1);
                    }
                    return task ? uncapitalise(task.text) : '';
                });
            }

            for(var section in this.section_tasks) {
                this.section_completed[section] = section_completed(this.section_tasks[section]);
                this.section_still_to_do[section] = section_still_to_do(this.section_tasks[section]);
            }
            
            this.all_sections_completed = ko.computed(function() {
                for(var key in this.section_completed) {
                    if(!this.section_completed[key]()) {
                        return false;
                    }
                }
                return true;
            },this);

            this.canPublish = ko.computed(function() {
                return !this.published() && (this.all_sections_completed() || this.ignored_publishing_criteria());
            },this);
        },

        set_ignored_publishing_criteria: function() {
                this.ignored_publishing_criteria(true);
        },

        init_output: function() {
            this.output = ko.computed(function() {
                var data = JSON.stringify(this.toJSON());
                return '// Numbas version: '+Editor.numbasVersion+'\n'+data;
            },this);
        },

        init_save: function(callback) {
            var ei = this;
			this.firstSave = true;
            this.autoSave = Editor.saver(
                function() {
                    var data = ei.save();

                    return data;
                },
                function(data) {
                    if(!ei.name()) {
                        throw(new Error("We can't save changes while the name field is empty."));
                    }
                    var promise = $.post(
                        '/'+ei.item_type+'/'+ei.id+'/'+slugify(ei.realName())+'/',
                        {json: JSON.stringify(data), csrfmiddlewaretoken: getCookie('csrftoken')}
                    )
                        .success(function(data){
                            var address = location.protocol+'//'+location.host+data.url;
                            if(history.replaceState)
                                history.replaceState(history.state,ei.realName(),address);
                        })
                        .error(function(response,type,message) {
                            if(message=='')
                                message = 'Server did not respond.';

                            noty({
                                text: 'Error saving item:\n\n'+message,
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
                    if(callback) {
                        callback(promise);
                    }
                    return promise;
                }
            );

            this.currentChange = ko.observable(new Editor.Change(this.versionJSON(),item_json.itemJSON.author));

            // create a new version when the JSON changes
            ko.computed(function() {
                var currentChange = this.currentChange.peek();
                var v = new Editor.Change(this.versionJSON(),item_json.itemJSON.author, currentChange);

                //if the new version is different to the old one, keep the diff
                if(!currentChange || v.diff.length!=0) {
                    currentChange.next_version(v);
                    this.currentChange(v);
                }
            },this).extend({throttle:1000});


            this.rewindChange = function() {
                var currentChange = ei.currentChange();
                var prev_version = currentChange.prev_version();
                if(!prev_version) {
                    throw(new Error("Can't rewind - this is the first version"));
                }
                var data = ei.versionJSON();
                data = jiff.patch(jiff.inverse(currentChange.diff),data);
                ei.currentChange(prev_version);
                ei.load(data);
            };

            this.forwardChange = function() {
                var currentChange = ei.currentChange();
                var next_version = currentChange.next_version();
                if(!currentChange.next_version()) {
                    throw(new Error("Can't go forward - this is the latest version"));
                }
                var data = ei.versionJSON();
                data = jiff.patch(next_version.diff,data);
                ei.currentChange(next_version);
                ei.load(data);
            };

        },

        load_state: function() {
            if(window.history !== undefined) {
                var state = window.history.state || {};
                if('currentTab' in state) {
                    var tabs = this.mainTabs();
                    for(var i=0;i<tabs.length;i++) {
                        var tab = tabs[i];
                        if(tab.id==state.currentTab) {
                            this.currentTab(tab);
                            break;
                        }
                    }
                }
                Editor.computedReplaceState('currentTab',ko.computed(function() {
                    var tab = this.currentTab();
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

            if('topics' in data) {
                data.topics.map(function(pk) {
                    this.get_topic(pk).used(true);
                },this);
            }

            if('subjects' in data) {
                data.subjects.map(function(pk) {
                    this.get_subject(pk).used(true);
                },this);
            }

            if('ability_levels' in data) {
                data.ability_levels.map(function(pk) {
                    this.get_ability_level(pk).used(true);
                },this);
            }

            var content = data.JSONContent;

            this.published(data.published);
        },

        set_tab_from_hash: function() {
            switch(window.location.hash.slice(1)) {
                case 'editing-history':
                    this.currentTab(this.getTab('history'));
                    break;
                case 'network':
                    this.currentTab(this.getTab('network'));
                    break;
            } 
        },

		applyDiff: function(version) {
			viewModel.currentChange(version);
			viewModel.load(version.data);
		},

        getTab: function(id) {
            return this.mainTabs().find(function(t){return t.id==id});
        },

        get_topic: function(pk) {
            return this.topics().find(function(t){return t.pk==pk});
        },

        get_subject: function(pk) {
            return this.subjects().find(function(s){return s.pk==pk});
        },

        get_ability_level: function(pk) {
            return this.ability_levels().find(function(l){return l.pk==pk});
        }

    }

    var UserAccess = Editor.UserAccess = function(question,data) {
        var ua = this;
        this.id = data.id;
        this.link = data.link;
        this.name = data.name;
        this.access_level = ko.observable(data.access_level || 'view');
        this.profile = data.profile;
        this.remove = function() {
            question.access_rights.remove(ua);
        }
    }
    UserAccess.prototype = {
        access_options: [{value:'view',text:'Can view this'},{value:'edit',text:'Can edit this'}]
    }

    // change applied in the editor
	Editor.Change = function(data,author,prev_version) {
		this.data = data;
		this.author = author;

		this.prev_version = ko.observable(prev_version);
		this.next_version = ko.observable(null);

		var old_data = {};

		if(prev_version) {
			old_data = prev_version.data;
		}

		this.diff = jiff.diff(old_data,data);

		this.time = new Date();
		this.timeSince = ko.observable(moment(this.time).fromNow());

		this.hasPrevious = ko.computed(function() {
			return this.prev_version() != null;
		},this);
		this.hasNext = ko.computed(function() {
			return this.next_version() != null;
		},this);
	}

    Editor.Comment = function(data) {
        this.text = data.text;
        this.user = data.user;
        this.date = data.date;
        this.delete_url = data.delete_url;
    }

    // version saved to the database, ie a reversion.models.Version instance
    Editor.Version = function(data) {
        this.date_created = data.date_created;
        this.user = data.user;
        this.version_pk = data.version_pk;
        this.revision_pk = data.revision_pk;
        this.comment = ko.observable(data.comment);
        this.editable = data.editable;
        this.update_url = data.update_url;

        this.editingComment = ko.observable(false);
        this.editComment = function(v,e) { 
            if(this.editable) {
                this.editingComment(true); 
            }
        };

        this.firstGo = true;
        if(this.editable) {
            ko.computed(function() {
                var comment = this.comment();
                if(this.firstGo) {
                    this.firstGo = false;
                    return;
                }
                $.post(this.update_url,{csrfmiddlewaretoken: getCookie('csrftoken'), comment: comment});
            },this);
        }
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
        Array.prototype.map.apply(rules,[function(rule) {
          var selectorText = '.preview '+rule.selectorText;
          for(var i=0;i<rule.style.length;i++) {
            var name = rule.style.item(i);
            var value = rule.style.getPropertyValue(name);
            if(value) {
            }
          }
          new_rules.push(selector+' '+rule.cssText);
        }]);
        return new_rules.join('\n');
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



	//represent a JSON-esque object in the Numbas .exam format
	prettyData = function(data){
		switch(typeof(data))
		{
		case 'number':
			return data+'';
		case 'string':
			//this tries to use as little extra syntax as possible. Quotes or triple-quotes are only used if necessary.
			if(data.toLowerCase()=='infinity')
				return '"infinity"';
			else if(data.contains('"') || data.contains("'"))
				return '"""'+data+'"""';
			else if(data.search(/[:\n,\{\}\[\] ]|\/\//)>=0)
				return '"'+data+'"';
			else if(!data.trim())
				return '""';
			else
				return data;
		case 'boolean':
			return data ? 'true' : 'false';
		case 'object':
			if($.isArray(data))	//data is an array
			{
				if(!data.length)
					return '[]';	//empty array

				data = data.map(prettyData);	//pretty-print each of the elements

				//decide if the array can be rendered on a single line
				//if any element contains a linebreak, render array over several lines
				var multiline=false;
				for(var i=0;i<data.length;i++)
				{
					if(data[i].contains('\n'))
						multiline = true;
				}
				if(multiline)
				{
					return '[\n'+data.join('\n')+'\n]';
				}
				else
				{
					return '[ '+data.join(', ')+' ]';
				}
			}
			else	//data is an object
			{
				if(!Object.keys(data).filter(function(x){return x}).length)
					return '{}';
				var o='{\n';
				for(var x in data)
				{
					if(x)
						o += x+': '+prettyData(data[x])+'\n';
				}
				o+='}';
				return o;
			}
		}
	};

	ko.bindingHandlers.codemirror = {
		init: function(element,valueAccessor,allBindingsAccessor) {
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

			var mc = CodeMirror.fromTextArea(element,{
				lineNumbers: true,
				styleActiveLine: true,
				matchBrackets: true,
                mode: mode,
				indentWithTabs: false,
				indentUnit: 2,
				extraKeys: { Tab: betterTab },
				readOnly: readOnly,
                lineWrapping: Editor.wrapLines
			});
			mc.on('change',onChange);
			ko.utils.domData.set(element,'codemirror',mc);

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
			var value = ko.utils.unwrapObservable(valueAccessor());
			if(value!=mc.getValue()) {
				mc.setValue(value);
			}
			var allBindings = allBindingsAccessor();
			var mode = ko.utils.unwrapObservable(allBindings.codemirrorMode) || 'javascript';
			mc.setOption('mode',mode);
		}
	}

	ko.bindingHandlers.writemaths = {
		init: function(element,valueAccessor,allBindingsAccessor) {
            valueAccessor = valueAccessor();
			allBindingsAccessor = allBindingsAccessor();

            if(element.hasAttribute('disabled')) {
                try {
                    element.classList.add('well');
                    element.classList.add('content-area');
                } catch(e) {
                    element.className += ' well content-area';
                }
                return;
            }

			var height = allBindingsAccessor.hasOwnProperty('wmHeight') ? allBindingsAccessor.wmHeight : 200;
			var width = allBindingsAccessor.hasOwnProperty('wmWidth') ? allBindingsAccessor.wmWidth : '';

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
                'image',
                'link',
                'lists',
                'media',
                'noneditable',
                'paste',
                'searchreplace',
                'table',
                'textcolor',
                'textpattern'
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
                    
                    toolbar: "undo redo | styleselect | bullist numlist | bold italic removeformat | alignleft aligncenter alignright | bullist numlist outdent indent | link image gapfill jmevisible | fullscreen preview code",

					statusbar: false,
					media_strict: false,
					width: width,
					verify_html: false,
					autoresize_bottom_margin: 0,
					convert_urls: false,
					verify_html: false,

					paste_postprocess: function(ed,args) {
						remove_empty_spans(args.node);
					},

					init_instance_callback: function(ed) { 
						$(element).writemaths({iFrame: true, position: 'center top', previewPosition: 'center bottom'}); 
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

					}
                })
            ;

		},
		update: function(element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor()) || '';

            if(element.hasAttribute('disabled')) {
                $(element).html(value).mathjax();
                $(element).find('[data-bind]').each(function() {
                    this.removeAttribute('data-bind');
                });
                return;
            }

			var tinymce = $(element).find('iframe').contents().find('body');

            if (!tinymce.is(':focus')) {
				var ed = $(element).children('.wmTextArea').tinymce();
				if(ed && ed.initialized) {
					ed.setContent(value);
                }
			}
		}
	};

	$.fn.unselectable = function() {
		$(this).on('mousedown',function(e){ e.preventDefault(); });
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

    ko.components.register('editor-pager', {
        viewModel: function(params) {
            var p = this;

            var editor = this.editor = params.editor;
            this.previousTab = params.previousTab ? editor.getTab(params.previousTab) : null;
            this.nextTab = params.nextTab ? editor.getTab(params.nextTab) : null;
            this.task_group = params.task_group;
            this.has_task = editor.section_tasks[this.task_group] !== undefined;
            this.completed = this.has_task ? editor.section_completed[this.task_group] : true;
            this.still_to_do = this.has_task ? editor.section_still_to_do[this.task_group] : false;
            this.current_task = ko.computed(function() {
                if(!editor.section_tasks[this.task_group]) {
                    return null;
                } else {
                    return editor.section_tasks[this.task_group].filter(function(t){return !t.done()})[0];
                }
            },this);

            this.focus = function() {
                var task = p.current_task();
                if(task && task.focus_on) {
                    var s = $(task.focus_on);
                    if(s.hasClass('wmTextArea')) {
                        s.tinymce().focus();
                    } else {
                        s.focus();
                    }
                }
            }
        },
        template: '\
            <nav data-bind="visible: !editor.published()">\
                <ul class="pager">\
                    <li class="previous" data-bind="if: previousTab">\
                        <a title="Back to the previous section" href="#" data-bind="click: editor.setTab(previousTab.id)">← <span data-bind="text: previousTab.title"></span></a>\
                    </li>\
                    <span class="still-to-do text-warning" data-bind="if: has_task, visible: !ko.unwrap(completed), click: focus">Before moving on, you should <span data-bind="text: still_to_do"></span></span>\
                    <span data-bind="if: nextTab, visible: ko.unwrap(completed)" class="text-success">Move on when you\'re ready!</span>\
                    <li class="next" data-bind="if: nextTab, css: {ready: completed}">\
                        <a title="Proceed to the next section" href="#" data-bind="click: editor.setTab(nextTab.id)"><span data-bind="text: nextTab.title"></span> →</a>\
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
                <button type="button" class="btn btn-default btn-sm" data-bind="click: $parent.edit_item, text: $data"></button>\
            </ul>\
            <input type="text" class="form-control" data-bind="visible: !disabled, textInput: value, event: {blur: blur, keydown: keydown}">\
        '
    });

    ko.components.register('multi-select-checkboxes',{
        viewModel: function(params) {
            var labelProperty = ko.unwrap(params.labelProperty);
            var helpProperty = ko.unwrap(params.helpProperty);
            var selectedOptions = ko.unwrap(params.selectedOptions);
            this.options = ko.pureComputed(function() {
                return ko.unwrap(params.options).map(function(option) {
                    return {
                        checked: ko.observable(selectedOptions.indexOf(option)!=-1),
                        label: option[labelProperty],
                        help: option[helpProperty],
                        value: option
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
                        <input type="checkbox" data-bind="checked:checked">\
                        <span data-bind="text:label"></span>\
                    </label>\
                    <span class="help-block help-block-inline" data-bind="text: help"></span>\
                </li>\
            </ul>\
            '
    })

	ko.bindingHandlers.dragOut = {
		init: function(element, valueAccessor) {
			var obj = {
				data: null,
				sortable: ''
			};
			obj = $.extend(obj,valueAccessor());
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
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			var res = texJMEBit(value);
            $(element).toggleClass('jme-error',res.error);
            if(res.error) {
                $(element).html(res.message);
            } else {
				var tex = res.tex;
                if(tex.length>0)
                    $(element).html('$'+tex+'$').mathjax();
                else
                    $(element).html('');
            }
		}
	};

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

    var Subject = Editor.Subject = function(data) {
        this.pk = data.pk;
        this.name = data.name;
        this.description = data.description;
        this.used = ko.observable(false);
    }

    var Topic = Editor.Topic = function(data,subject_list) {
        this.pk = data.pk;
        this.name = data.name;
        this.description = data.description;
        this.subjects = ko.computed(function() {
            return subject_list().filter(function(s){ return data.subjects.contains(s.pk) });
        },this);
        this.visible = ko.computed(function() {
            var subjects = this.subjects();
            for(var i=0;i<subjects.length;i++) {
                if(subjects[i].used()) {
                    return true;
                }
            }
        },this);
        var _used = ko.observable(false);
        this.used = ko.computed({
            read: function() { return this.visible() && _used(); },
            write: function(v) { return _used(v); }
        },this);
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
		this.name = ko.observable('');
		this.pk = ko.observable(0);

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
			this.deleteURL = data.delete_url;
		},
		filePatterns: {
			'html': /\.html?$/i,
			'img': /\.(png|jpg|gif|bmp|jpeg|webp|tiff|tif|raw|svg)$/i
		},
		filetype: function() {
			var name = this.name();
			for(var type in this.filePatterns) {
				if(this.filePatterns[type].test(name))
					return type;
			}
		},
        can_embed: function() {
            var type = this.filetype();
            return type=='img' || type=='html';
        }
	};

    var CommentWriter = Editor.CommentWriter = function() {
        this.writingComment = ko.observable(false);
        this.commentText = ko.observable('');
        this.commentIsEmpty = ko.computed(function() {
            return $(this.commentText()).text().trim()=='';
        },this);
        this.submitComment = function(form) {
            if(this.commentIsEmpty()) {
                return;
            }

            var text = this.commentText();
            $.post(form.getAttribute('action'),{'text': text, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(response) {
                $('.timeline').prepend(response.html).mathjax();
            });

            this.commentText('');
            this.writingComment(false);
        }
        this.cancelComment = function() {
            this.commentText('');
            this.writingComment(false);
        }

    }

    $('body').on('click','.timeline-item .hide-item',function(e) {
        var element = this;
        e.preventDefault();
        e.stopPropagation();
        $.post(element.getAttribute('href'),{csrfmiddlewaretoken: getCookie('csrftoken')})
            .success(function(data) {
                $(element).parents('.timeline-item').first().slideUp(150,function(){$(this).remove()});
            })
            .error(function(response,type,message) {
                if(message=='')
                    message = 'Server did not respond.';

                noty({
                    text: 'Error hiding timeline item:\n\n'+message,
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
        $.post(element.getAttribute('href'),{csrfmiddlewaretoken: getCookie('csrftoken')})
            .success(function(data) {
                $(element).parents('.timeline-item').first().slideUp(150,function(){$(this).remove()});
                if(window.viewModel && data.current_stamp!==undefined) {
                    viewModel.current_stamp(data.current_stamp);
                }
            })
            .error(function(response,type,message) {
                if(message=='')
                    message = 'Server did not respond.';

                noty({
                    text: 'Error deleting timeline item:\n\n'+message,
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
				}

			});
		}
	}

	function update_notifications() {
		var num_notifications = $('#notifications .dropdown-menu .notification').length;
		$('#notifications .dropdown-toggle').attr('title',num_notifications+' unread '+(num_notifications==1 ? 'notification' : 'notifications'));
		$('#notifications .badge').text(num_notifications>0 ? num_notifications : '');
		if(num_notifications) {
			$('#notifications').addClass('active');
			$('#notifications .dropdown-toggle').removeClass('disabled');
		} else {
			$('#notifications').removeClass('active open');
			$('#notifications .dropdown-toggle').addClass('disabled');
		}
	}

    $('#notifications').on('click','.mark-all-as-read',function(e) {
		$('#notifications .dropdown-menu').html('');
		update_notifications();

        var url = $(this).attr('href');
        $.post(url,{csrfmiddlewaretoken: getCookie('csrftoken')});
        e.stopPropagation();
        return false;
    });

	var old_notifications = $('#notifications .dropdown-menu').html()
	setInterval(function() {
		if(!document.hasFocus()) {
			return;
		}
		$.get('/notifications/unread/').success(function(response) {
			if(response!=old_notifications) {
				old_notifications = response;
				$('#notifications .dropdown-menu').html(response);
				update_notifications();
			}
		});
	},5000);

	update_notifications();

    function update_basket(response) {
		var num_questions = $('#question_basket .dropdown-menu .question').length;
		$('#question_basket .dropdown-toggle').attr('title',num_questions+' '+(num_questions==1 ? 'question' : 'questions')+' in your basket');
		$('#question_basket .badge').text(num_questions>0 ? num_questions : '');
		if(num_questions) {
			$('#question_basket .dropdown-toggle').removeClass('disabled');
		} else {
			$('#question_basket').removeClass('active open');
			$('#question_basket .dropdown-toggle').addClass('disabled');
		}
        var ids = $('#question_basket .dropdown-menu .question').map(function(){return parseInt($(this).attr('data-id'))});
        $('.add-to-basket[data-question-id]').each(function() {
            var id = parseInt($(this).attr('data-question-id'));
            var inBasket = ids.index(id)>=0;
            $(this).find('.glyphicon').toggleClass('text-success',inBasket);
        });
    }

    update_basket();

    Editor.add_question_to_basket = function(id) {
        $.post('/question_basket/add/',{csrfmiddlewaretoken: getCookie('csrftoken'), id: id})
            .success(function(response) {
				$('#question_basket .dropdown-menu').html(response);
				update_basket();
            })
        ;
    }
	Editor.remove_question_from_basket = function(id) {
        $.post('/question_basket/remove/',{csrfmiddlewaretoken: getCookie('csrftoken'), id: id})
            .success(function(response) {
				$('#question_basket .dropdown-menu').html(response);
				update_basket();
            })
        ;
	}
    Editor.empty_basket = function() {
        $.post('/question_basket/empty/',{csrfmiddlewaretoken: getCookie('csrftoken')})
            .success(function(response) {
				$('#question_basket .dropdown-menu').html(response);
				update_basket();
            })
        ;
    }
    $('#question_basket').on('click','.empty-basket',function(e) {
        e.preventDefault();
		e.stopPropagation();
        Editor.empty_basket();
    });
	$('#question_basket').on('click','.question .btn-remove',function(e) {
		e.preventDefault();
		e.stopPropagation();
		Editor.remove_question_from_basket($(this).attr('data-id'));
		$(this).parent('.question').remove();
	});
	$('#question_basket').on('click','.question .remove',function(e) {
		e.preventDefault();
		e.stopPropagation();
		Editor.remove_question_from_basket($(this).attr('data-id'));
		$(this).parent('.question').remove();
	});
	$('body').on('click','.add-to-basket',function(e) {
		e.preventDefault();
		e.stopPropagation();
		Editor.add_question_to_basket($(this).attr('data-question-id'));
	});


    Editor.user_search_autocomplete = function(element,options) {
        var url = '/users/search';
        source = function(req,callback) {
            element.addClass('loading');
            $.getJSON(url,{q:req.term})
                .success(function(data) {
                    var things = [];
                    var things = data.map(function(d) {
                        return {label: d.autocomplete_entry, value: d.name, id: d.id, profile: d.profile}
                    });
                    callback(things);
                })
                .complete(function() {
                    $(element).removeClass('loading');
                })
            ;
        }
        function set_user(e,ui) {
            var id = ui.item.id;
            element.parents('form').find('[name="selected_user"]').val(id);
        }
        element.autocomplete($.extend({source: source, select: set_user, html: true},options));
    }

    Editor.user_search_autocomplete($('#top-search-bar'),{select: function(e,ui) {
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
        options = $.extend(options,extra_options);

        return tinymce.init(options);
    }

    Editor.noop = function() {}
});
