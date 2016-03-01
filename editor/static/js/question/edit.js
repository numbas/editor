/*
Copyright 2012 Newcastle University

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var viewModel;

$(document).ready(function() {
	var builtinRulesets = ['basic','unitFactor','unitPower','unitDenominator','zeroFactor','zeroTerm','zeroPower','noLeadingMinus','collectNumbers','simplifyFractions','zeroBase','constantsFirst','sqrtProduct','sqrtDivision','sqrtSquare','trig','otherNumbers']

	var jmeTypes = [];
	var forbiddenJmeTypes = ['op','name','function'];
	for(var type in Numbas.jme.types) {
		var t = Numbas.jme.types[type].prototype.type;
		if(t && jmeTypes.indexOf(t)==-1 && forbiddenJmeTypes.indexOf(t)==-1) {
			jmeTypes.push(t);
		}
	}

    function Question(data)
    {
		var q = this;

        this.published = ko.observable(false);
        this.starred = ko.observable(Editor.starred);
        this.current_stamp = ko.observable(Editor.current_stamp);
        this.licence = ko.observable();
		this.resources = ko.observableArray([]);
        this.name = ko.observable('Untitled Question');
		this.realtags = ko.observableArray([]);
		this.notes = ko.observable('');
		this.description = ko.observable('');
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
			maxRuns: ko.observable(100),
			totalRuns: ko.observable(0),
			totalErrors: ko.observable(0),
			totalCorrect: ko.observable(0),
			advice: ko.observable(''),
			running_time: ko.observable(3),
			running: ko.observable(false),
			time_remaining: ko.observable(0)
		};
        this.parts = ko.observableArray([]);
		this.currentPart = ko.observable(undefined);

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


		this.mainTabs = ko.observableArray([
			new Editor.Tab('settings','Settings','cog'),
			new Editor.Tab('statement','Statement','blackboard'),
			new Editor.Tab('variables','Variables','th-list'),
			new Editor.Tab('variabletesting','Variable testing','dashboard'),
			new Editor.Tab(
				'parts',
                'Parts',
                'list'
			),
			new Editor.Tab('advice','Advice','blackboard'),
			new Editor.Tab('extensions','Extensions & scripts','wrench'),
			new Editor.Tab(
                'resources',
                ko.computed(function() {
                    return 'Resources ('+q.resources().length+')';
                }),
                'picture'
            ),
			new Editor.Tab('exams','Exams using this question','book'),
            new Editor.Tab('network','Other versions','link'),
            new Editor.Tab('versions','Editing history','time')
		]);
        if(Editor.editable) {
            var adviceTab = new Editor.Tab('access','Access','lock');
            this.mainTabs.splice(5,0,adviceTab);
        }

		this.currentTab = ko.observable(this.mainTabs()[0]);

        this.setTab = function(id) {
            return function() {
                var tab = q.getTab(id);

                q.currentTab(tab);
            }
        }

		if(Editor.editable) {
            switch(window.location.hash.slice(1)) {
                case 'editing-history':
        			this.currentTab(editingHistoryTab);
                    break;
                case 'network':
                    this.currentTab(networkTab);
            } 
		}

        this.toggleStar = function() {
            q.starred(!q.starred());
        }
        this.starData = ko.computed(function() {
            return {starred: this.starred()}
        },this);
        this.saveStar = Editor.saver(this.starData,function(data) {
            return $.post('set-star',data);
        });

        this.add_to_basket = function() {
            Editor.add_question_to_basket(Editor.questionJSON.id);
        }

		this.exams = data.exams;

        Editor.licences.sort(function(a,b){a=a.short_name;b=b.short_name; return a<b ? -1 : a>b ? 1 : 0 });
        this.licence_name = ko.computed(function() {
            if(this.licence()) {
                return this.licence().name;
            } else {
                return 'None specified';
            }
        },this);

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
            if(q.realtags().indexOf(thing)==-1) {
                q.realtags.push(thing);
            }
        }
        this.tags.pop = function(thing) {
            return q.realtags.pop();
        }
        this.tags.splice = function(i,n) {
            return q.realtags.splice(i,n);
        }
		this.tags.remove = function(q) {
			return q.realtags.remove(q);
		}

		this.metadata = ko.computed(function() {
			return {
				notes: this.notes(),
				description: this.description(),
                licence: this.licence_name()
			};
		},this);

		for(var i=0;i<Editor.numbasExtensions.length;i++) {
			var ext = Editor.numbasExtensions[i];
			ext.used = ko.observable(false);
			this.extensions.push(ext);
		}
		this.usedExtensions = ko.computed(function() {
			return this.extensions().filter(function(e){return e.used()});
		},this);

        this.allsets = ko.computed(function() {
            return builtinRulesets.concat(this.rulesets().map(function(r){return r.name()})).sort();
        },this);

		this.preamble = {
			css: ko.observable(''),
			js: ko.observable('')
		};

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
				if(variables[i].nameError() || variables[i].error())
					return true;
			}
			return false;
		},this);

		this.addVariableBefore = function() {
			var n = q.variables.indexOf(this);
			var v = new Variable(q);
			q.variables.splice(n,0,v);
		}

		this.showPart = function(part) {
			q.currentPart(part);
		};

        this.expand_all_parts = function() {
            q.allParts().map(function(p) {
                p.open(true);
            });
        }

        this.collapse_all_parts = function() {
            q.allParts().map(function(p) {
                p.open(false);
            });
        }

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

        this.output = ko.computed(function() {
            var data = JSON.stringify(q.toJSON());
			return '// Numbas version: '+Editor.numbasVersion+'\n'+data;
        },this);


        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);

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

        if(data) {
			this.load(data);
		}

        if(Editor.editable) {
			this.firstSave = true;

			this.deleteResource =  function(res) {
				$.get(res.deleteURL)
					.success(function() {
						q.resources.remove(res);
					})
					.error(function(e) {
						console.log("Error deleting resource",e);
						q.resources.remove(res);
					})
				;
			}

			this.save = ko.computed(function() {
                return {
                    content: this.output(),
					extensions: this.usedExtensions().map(function(e){return e.pk}),
                    tags: this.tags(),
					resources: this.saveResources(),
                    metadata: this.metadata()
                };
			},this);

            this.autoSave = Editor.saver(
                function() {
                    var data = q.save();

                    return data;
                },
                function(data) {
                    return $.post(
                        '/question/'+q.id+'/'+slugify(q.realName())+'/',
                        {json: JSON.stringify(data), csrfmiddlewaretoken: getCookie('csrftoken')}
                    )
                        .success(function(data){
                            var address = location.protocol+'//'+location.host+data.url;
                            if(history.replaceState)
                                history.replaceState(history.state,q.realName(),address);
                            q.timeline.splice(0,0,new Editor.TimelineItem({date: data.version.date_created, user: data.version.user, type: 'version', data: data.version}));
                        })
                        .error(function(response,type,message) {
                            if(message=='')
                                message = 'Server did not respond.';

                            noty({
                                text: 'Error saving question:\n\n'+message,
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
                }
            );

            //access control stuff
            this.public_access = ko.observable(Editor.public_access);
            this.access_options = [
                {value:'hidden',text:'Hidden'},
                {value:'view',text:'Anyone can view this'},
                {value:'edit',text:'Anyone can edit this'}
            ];
            this.access_rights = ko.observableArray(Editor.access_rights.map(function(d){
                var access = new UserAccess(q,d.user)
                access.access_level(d.access_level);
                return access;
            }));

            this.access_data = ko.computed(function() {
                return {
                    public_access: q.public_access(),
                    user_ids: q.access_rights().map(function(u){return u.id}),
                    access_levels: q.access_rights().map(function(u){return u.access_level()})
                }
            });
            this.saveAccess = Editor.saver(this.access_data,function(data) {
                return $.post('/item/'+q.editoritem_id+'/set-access',data);
            });
            this.userAccessSearch=ko.observable('');

            this.addUserAccess = function(data) {
                var access_rights = q.access_rights();
                for(var i=0;i<access_rights.length;i++) {
                    if(access_rights[i].id==data.user.id) {
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
                var access = new UserAccess(q,data.user);
                access.access_level(d.access_level);
                q.access_rights.push(access);
            };

            this.section_tasks = {
                'settings': [
                    Editor.nonempty_task('Give the question a name.',this.name),
                    Editor.nonempty_task('Fill out the question description.',this.description),
                    Editor.nonempty_task('Select a licence defining usage rights.',this.licence)
                ],
                'statement': [
                    Editor.nonempty_task('Write a question statement.',this.statement)
                ],
                'parts': [
                    {text: 'Create at least one part.', done: ko.computed(function(){ return this.parts().length>0 },this)}
                ],
                'advice': [
                    Editor.nonempty_task('Write a worked solution to the question.',this.advice)
                ]
            }

            this.section_completed = {};
            for(var section in this.section_tasks) {
                this.section_completed[section] = ko.computed(function() {
                    return this.section_tasks[section].every(function(t){return ko.unwrap(t.done)});
                },this);
            }
            
            this.all_sections_completed = ko.computed(function() {
                for(var key in this.section_completed) {
                    if(!this.section_completed[key]()) {
                        return false;
                    }
                }
                return true;
            },this);
        }

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
			Editor.computedReplaceState('currentTab',ko.computed(function(){return this.currentTab().id},this));
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

			if('currentPart' in state && state.currentPart!==undefined) {
				var path = state.currentPart;
				var part = this.parts()[path[0]];
				if(path.length>1) {
					switch(path[1]) {
						case 'gap':
							part = part.gaps()[path[2]];
							break;
						case 'step':
							part = part.steps()[path[2]];
							break;
					}
				}
				this.currentPart(part);
			}
			Editor.computedReplaceState('currentPart',ko.computed(function(){
				var p = this.currentPart();
                if(!p) {
                    return undefined;
                }
				if(p.isGap()) {
					var parentPart = p.parent();
					return [this.parts().indexOf(parentPart), 'gap', parentPart.gaps().indexOf(p)];
				} else if(p.isStep()) {
					var parentPart = p.parent();
					return [this.parts().indexOf(parentPart), 'step', parentPart.steps().indexOf(p)];
				} else {
					return [this.parts().indexOf(p)];
				}
			},this));
			if(this.currentPart() && 'currentPartTab' in state) {
				var tabs = this.currentPart().tabs();
				for(var i=0;i<tabs.length;i++) {
					var tab = tabs[i];
					if(tab.id==state.currentPartTab) {
						this.currentPart().currentTab(tab);
						break;
					}
				}
			}
			Editor.computedReplaceState('currentPartTab',ko.computed(function(){
                var p = this.currentPart();
                if(p) {
                    return p.currentTab().id;
                } else {
                    return undefined;
                }
            },this));
		}

		this.currentChange = ko.observable(new Editor.Change(this.versionJSON(),Editor.questionJSON.author));

		// create a new version when the question JSON changes
		ko.computed(function() {
			var currentChange = this.currentChange.peek();
			var v = new Editor.Change(this.versionJSON(),Editor.questionJSON.author, currentChange);

			//if the new version is different to the old one, keep the diff
			if(!currentChange || v.diff.length!=0) {
				currentChange.next_version(v);
				this.currentChange(v);
			}
		},this).extend({throttle:1000});


		this.rewindChange = function() {
			var currentChange = q.currentChange();
			var prev_version = currentChange.prev_version();
			if(!prev_version) {
				throw(new Error("Can't rewind - this is the first version"));
			}
			var data = q.versionJSON();
			data = jiff.patch(jiff.inverse(currentChange.diff),data);
			q.currentChange(prev_version);
			q.load(data);
		};

		this.forwardChange = function() {
			var currentChange = q.currentChange();
			var next_version = currentChange.next_version();
			if(!currentChange.next_version()) {
				throw(new Error("Can't go forward - this is the latest version"));
			}
			var data = q.versionJSON();
			data = jiff.patch(next_version.diff,data);
			q.currentChange(next_version);
			q.load(data);
		};

        this.timeline = ko.observableArray(Editor.timeline.map(function(t){return new Editor.TimelineItem(t)}));

		this.showCondensedTimeline = ko.observable(true);
        
        this.timelineToDisplay = ko.computed(function() {
			if(this.showCondensedTimeline()) {
                var out = [];
				this.timeline().map(function(e){
					var last = out[out.length-1];
                    if(e.type=='version') {
                        if(!e.data.comment() && last && last.type=='version') {
                            return false;
                        }
                        firstVersion = false;
					}
                    out.push(e);
                });
                return out;
			} else {
				return this.timeline();
			}
        },this);

        this.addStamp = function(status_code) {
            return function() {
                $.post('stamp',{'status': status_code, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(stamp) {
                    q.timeline.splice(0,0,new Editor.TimelineItem({date: stamp.date, user: stamp.user, data: stamp, type: 'stamp'}));
                });
                noty({
                    text: 'Thanks for your feedback!',
                    type: 'success',
                    layout: 'topCenter'
                });
            }
        }

        this.writingComment = ko.observable(false);
        this.commentText = ko.observable('');
        this.commentIsEmpty = ko.computed(function() {
            return $(this.commentText()).text().trim()=='';
        },this);
        this.submitComment = function() {
            if(this.commentIsEmpty()) {
                return;
            }

            var text = this.commentText();
            $.post('comment',{'text': text, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(comment) {
                q.timeline.splice(0,0,new Editor.TimelineItem({date: comment.date, user: comment.user, data: comment, type: 'comment'}));
            });

            this.commentText('');
            this.writingComment(false);
        }
        this.cancelComment = function() {
            this.commentText('');
            this.writingComment(false);
        }

        this.deleteTimelineItem = function(item) {
            if(item.deleting()) {
                return;
            }
            item.deleting(true);
            $.post(item.data.delete_url,{csrfmiddlewaretoken: getCookie('csrftoken')})
                .success(function() {
                    q.timeline.remove(item);
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

                    item.deleting(false);
                })
            ;
        }
    }
    Question.prototype = {

		versionJSON: function() {
			var obj = {
				id: this.id,
				JSONContent: this.toJSON(),
				numbasVersion: Editor.numbasVersion,
				name: this.name(),
				author: Editor.questionJSON.author,
				copy_of: Editor.questionJSON.copy_of,
				extensions: this.usedExtensions().map(function(e){return e.pk}),
				tags: this.tags(),
				resources: this.saveResources(),
				metadata: this.metadata()
			};
            if(Editor.editable) {
                obj.public_access = this.public_access();
            }
            return obj;
		},

		applyDiff: function(version) {
			viewModel.currentChange(version);
			viewModel.load(version.data);
		},

		deleteQuestion: function(q,e) {
			if(window.confirm('Really delete this question?')) {
				$(e.target).find('form').submit();
			}
		},

        getTab: function(id) {
            return this.mainTabs().find(function(t){return t.id==id});
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

        addPart: function() {
			var p = new Part(this,null,this.parts);
            this.parts.push(p);
			this.currentPart(p);
			return p;
        },

		loadPart: function(data) {
			var p = new Part(this,null,this.parts,data);
            this.parts.push(p);
			this.currentPart(p);
			return p;
		},

		getPart: function(path) {
			return this.parts()[0];
			var re_path = /^p(\d+)(?:g(\d+)|s(\d+))?$/;
			var m = re_path.exec(path);
			var i = parseInt(m[1]);
			var p = this.parts()[i];
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
					v.value('');
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

			// fill in observables
			if(conditionSatisfied) {
				this.variables().map(function(v) {
					if(v.locked.peek()) {
						return;
					}
					var name = v.name().toLowerCase();
					var result = results.variables[name];
					if(!result) {
						v.value(null);
						v.error('');
						return;
					}
					if('value' in result) {
						v.value(result.value);
					}
					if('error' in result) {
						v.error(result.error);
					}
				});
			}

			this.questionScope(results.scope);
		},

		// get everything ready to compute variables - make functions, and work out dependency graph
		prepareVariables: function() {
			var jme = Numbas.jme;

			var scopes = [jme.builtinScope];
			var extensions = this.extensions().filter(function(e){return e.used()});
			for(var i=0;i<extensions.length;i++) {
				var extension = extensions[i].location;
				if(extension in Numbas.extensions && 'scope' in Numbas.extensions[extension]) {
					scopes.push(Numbas.extensions[extension].scope);
				}
			}

			var scope = new jme.Scope(scopes);

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
					if(scope.functions[cfn.name]===undefined)
						scope.functions[cfn.name] = [];
					scope.functions[cfn.name].push(cfn);
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
					var tree = jme.compile(v.definition(),scope,true);
					var vars = jme.findvars(tree);
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
                parts: this.parts().map(function(p){return p.toJSON();})

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
			var q = this;

			this.reset();

			this.id = data.id;
            this.editoritem_id = data.editoritem_id;

            this.published(data.published);

			if('metadata' in data) {
				tryLoad(data.metadata,['notes','description'],this);
                var licence_name = data.metadata.licence;
                for(var i=0;i<Editor.licences.length;i++) {
                    if(Editor.licences[i].name==licence_name) {
                        this.licence(Editor.licences[i]);
                        break;
                    }
                }
			}

			if('extensions' in data) {
				this.extensions().map(function(e) {
					if(data.extensions.indexOf(e.location)>=0)
						e.used(true);
				});
			}

			if('resources' in data)
			{
				data.resources.map(function(rd) {
					this.resources.push(new Editor.Resource(rd));
				},this);
			}

			contentData = data.JSONContent;

            tryLoad(contentData,['name','statement','advice'],this);

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
						vg.variables.push(v);
						q.baseVariableGroup.variables.remove(v);
					});
				});
			}
			if('ungrouped_variables' in contentData) {
				contentData.ungrouped_variables.map(function(variable_name) {
					var v = q.getVariable(variable_name);
					q.baseVariableGroup.variables.remove(v);
					q.baseVariableGroup.variables.push(v);
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

            if('parts' in contentData)
            {
                contentData.parts.map(function(pd) {
                    this.loadPart(pd);
                },this);
				if(this.parts().length) 
					this.currentPart(this.parts()[0]);
            }

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

		download: function() {
			window.location = Editor.download_url;
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

    function UserAccess(question,data) {
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
        this.name = ko.observable('');
		this.group = ko.observable(null);
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

			return '';
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
				value: ko.observable('')
			},
			'long string': {
				value: ko.observable('')
			},
			'list of numbers': {
				commaValue: ko.observable('')
			},
			'list of strings': {
				values: InexhaustibleList()
			}
		};
		this.editDefinition = this.templateTypeValues['anything'].definition;
		this.templateTypeValues['list of numbers'].values = ko.computed(function() {
			var commaValue = this.commaValue();
			if(!commaValue.trim())
				return [];

			var numbers = commaValue.split(/\s+|\s*,\s*/g);

			numbers = numbers
						.map(function(n) {
							return parseFloat(n);
						})
						.filter(function(n) {
							return !isNaN(n);
						})
			;

			return numbers;
		},this.templateTypeValues['list of numbers']);

		this.definition = ko.computed({
			read: function() {
				var templateType = this.templateType().id;
				var val = this.templateTypeValues[templateType];
				var treeToJME = Numbas.jme.display.treeToJME;
				var wrapValue = Numbas.jme.wrapValue;
				switch(templateType) {
				case 'anything':
					return val.definition()+'';
				case 'number':
					return treeToJME({tok: wrapValue(parseFloat(val.value()))});
				case 'range':
					var tree = Numbas.jme.compile('a..b#c');
					tree.args[0].args[0] = {tok: wrapValue(parseFloat(val.min()))};
					tree.args[0].args[1] = {tok: wrapValue(parseFloat(val.max()))};
					tree.args[1] = {tok: wrapValue(parseFloat(val.step()))};
					return treeToJME(tree);
				case 'randrange':
					var tree = Numbas.jme.compile('random(a..b#c)');
					tree.args[0].args[0].args[0] = {tok: wrapValue(parseFloat(val.min()))};
					tree.args[0].args[0].args[1] = {tok: wrapValue(parseFloat(val.max()))};
					tree.args[0].args[1] = {tok: wrapValue(parseFloat(val.step()))};
					return treeToJME(tree);
				case 'string':
				case 'long string':
					return treeToJME({tok: wrapValue(val.value())});
				case 'list of numbers':
				case 'list of strings':
					return treeToJME({tok: wrapValue(val.values())});
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
		this.value = ko.observable('');
		this.thisLocked = ko.observable(false);
		this.locked = ko.computed(function() {
			return this.usedIn().some(function(v){return v.locked()}) || this.thisLocked();
		},this);
		this.error = ko.observable('');
		this.display = ko.computed(function() {
			var v;
			if(this.error())
				return this.error();
			else if(v = this.value())
			{
				switch(v.type)
				{
				case 'string':
					return v.value;
				case 'list':
					return 'List of '+v.value.length+' '+Numbas.util.pluralise(v.value.length,'item','items');
				case 'html':
					return 'HTML node';
				default:
					return Numbas.jme.display.treeToJME({tok:v});
				}
			}
			else
				return '';
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
			{id: 'list of strings', name: 'List of short text strings'}
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
					templateTypeValues.value(tree.tok.value);
					break;
				case 'list of numbers':
					templateTypeValues.commaValue(tree.args.map(function(t){return Numbas.jme.evaluate(t,Numbas.jme.builtinScope).value}).join(' , '));
					break;
				case 'list of strings':
					templateTypeValues.values(tree.args.map(function(t){return t.tok.value}));
				}
			}
			catch(e) {
				console.log(e);
			}
		},

		toggleLocked: function(v,e) {
			this.thisLocked(!this.thisLocked());
			e.preventDefault();
		}
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

    function Part(q,parent,parentList,data) {

		var p = this;
		this.q = q;
        this.prompt = Editor.contentObservable('');
        this.parent = ko.observable(parent);
		this.parentList = parentList;

        this.open = ko.observable(true);
        this.toggleOpen = function() {
            p.open(!p.open());
        }

		this.types = partTypes.map(function(data){return new PartType(p,data);});

        this.isRootPart = ko.computed(function() {
            return !this.parent();
        },this);

		this.isGap = ko.computed(function(){
			return this.parent() && this.parent().type().name=='gapfill' && !this.parent().steps().contains(this);
		},this);

		this.isStep = ko.computed(function() {
			return this.parent() && this.parent().steps().contains(this);
		},this);

		var nonGapTypes = ['information','gapfill'];
		this.availableTypes = ko.computed(function() {
			var nonStepTypes = ['gapfill'];
			if(this.isGap())
				return this.types.filter(function(t){return nonGapTypes.indexOf(t.name)==-1});
			else if(this.isStep())
				return this.types.filter(function(t){return nonStepTypes.indexOf(t.name)==-1});
			else
				return this.types;
		},this);
        this.type = ko.observable(this.availableTypes()[0]);

		this.canBeReplacedWithGap = ko.computed(function() {
			return !(this.isGap() || this.isStep() || nonGapTypes.indexOf(this.type().name)>=0);
		},this);

		this.indexLabel = ko.computed(function() {
			var i = this.parentList.indexOf(this);
			if(this.isGap() || this.isStep()) {
				i = i;
			}
			else {
				i = Numbas.util.letterOrdinal(i);
			}
			return i;
		},this);
		this.header = ko.computed(function() {
			if(this.isGap()) {
                return 'Gap '+this.indexLabel()+'. ';
            } else if(this.isStep()) {
				return 'Step '+this.indexLabel()+'. ';
			} else if(this.isRootPart()) {
				return 'Part '+this.indexLabel()+') ';
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
		this.nicePath = ko.computed(function() {
			return Numbas.util.capitalise(Numbas.util.nicePartName(this.path()));
		},this);

		this.tabs = ko.computed(function() {
			var tabs = [];
			if(!this.isGap())
				tabs.push(new Editor.Tab('prompt','Prompt','blackboard'));

			if(this.type().has_marks)
				tabs.push(new Editor.Tab('marking','Marking','pencil'));

			tabs = tabs.concat(this.type().tabs);

			tabs.push(new Editor.Tab('scripts','Scripts','wrench'));

			tabs.push(new Editor.Tab('adaptivemarking','Adaptive marking','transfer'));

			return tabs;
		},this);
		this.realCurrentTab = ko.observable(this.tabs()[0]);
		this.currentTab = ko.computed({
			read: function() {
				if(this.tabs().indexOf(this.realCurrentTab())==-1) {
					this.realCurrentTab(this.tabs()[0]);
					return this.tabs()[0];
				}
				else
					return this.realCurrentTab();
			},
			write: this.realCurrentTab
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

        this.steps = ko.observableArray([]);
        this.stepsPenalty = ko.observable(0);

		this.gaps = ko.observableArray([]);
		this.addGap = function() {
			var gap = new Part(p.q,p,p.gaps);
			p.gaps.push(gap);
			p.q.currentPart(gap);
		}

		this.showCorrectAnswer = ko.observable(true);

		this.variableReplacements = ko.observableArray([]);
		this.addVariableReplacement = function() {
			p.variableReplacements.push(new VariableReplacement(p));
		}
		this.deleteVariableReplacement = function(vr) {
			p.variableReplacements.remove(vr);
		}

		this.variableReplacementStrategies = [
			{name: 'originalfirst', niceName: 'Try without replacements first'},
			{name: 'alwaysreplace', niceName: 'Always replace variables'}
		];
		this.variableReplacementStrategy = ko.observable(this.variableReplacementStrategies[0])

		this.scripts = [
			new Script('constructor','When the part is created','after','http://numbas-editor.readthedocs.org/en/latest/question-parts.html#term-when-the-part-is-created'),
			new Script('mark','Mark student\'s answer','instead','http://numbas-editor.readthedocs.org/en/latest/question-parts.html#term-mark-student-s-answer'),
			new Script('validate','Validate student\'s answer','instead','http://numbas-editor.readthedocs.org/en/latest/question-parts.html#term-validate-student-s-answer')
		];

		this.types.map(function(t){p[t.name] = t.model});

		this.meOrChildSelected = ko.computed(function() {
			var currentPart = q.currentPart();
			if(currentPart==this)
				return true;
			var children = this.gaps().concat(this.steps());
			for(var i=0;i<children.length;i++) {
				if(currentPart==children[i])
					return true;
			}
			return false;
		},this);

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
			var gapFill = new Part(this.q,this.parent(),this.parentList);
			gapFill.setType('gapfill');

			this.parentList.splice(this.parentList.indexOf(this),1,gapFill);
			gapFill.gaps.push(this);
			this.parentList = gapFill.gaps;
			this.parent(gapFill);
			
			gapFill.prompt(this.prompt()+'\n<p>[[0]]</p>');
			this.prompt('');

			gapFill.steps(this.steps());
			gapFill.steps().map(function(step){ 
				step.parent(gapFill);
				step.parentList = gapFill.steps;
			});
			this.steps([]);
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

        addStep: function() {
			var step = new Part(this.q,this,this.steps);
            this.steps.push(step);
			this.q.currentPart(step);
        },

		remove: function() {
            if(confirm("Remove this part?"))
            {
				this.parentList.remove(this);
				if(viewModel.currentPart()==this) {
					viewModel.currentPart(this.parent());
				}
            }
        },

		moveUp: function() {
			var i = this.parentList.indexOf(this);
			if(i>0) {
				this.parentList.remove(this);
				this.parentList.splice(i-1,0,this);
			}
		},

		moveDown: function() {
			var i = this.parentList.indexOf(this);
			this.parentList.remove(this);
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
                marks: this.realMarks(),
				showCorrectAnswer: this.showCorrectAnswer(),
				scripts: {},
				variableReplacements: this.variableReplacements().map(function(vr){return vr.toJSON()}),
				variableReplacementStrategy: this.variableReplacementStrategy().name
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
            tryLoad(data,['marks','prompt','stepsPenalty','showCorrectAnswer'],this);

            if(data.steps)
            {
                data.steps.map(function(s) {
                    this.steps.push(new Part(this.q,this,this.steps,s));
                },this);
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
		this.replacement = ko.observable(null);
		this.must_go_first = ko.observable(false);
		this.availableParts = ko.computed(function() {
			var p = this.part
			return p.q.allParts().filter(function(p2){
				return p!=p2;
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

	function PartType(part,data) {
		this.name = data.name;
		this.part = part;
		this.niceName = data.niceName;
		this.has_marks = data.has_marks || false;
		this.tabs = data.tabs || [];
		this.model = data.model ? data.model(part) : {};
		this.toJSONFn = data.toJSON || function() {};
		this.loadFn = data.load || function() {};
	}
	PartType.prototype = {
		toJSON: function(data) {
			this.toJSONFn.apply(this.model,[data,this.part]);
		},
		load: function(data) {
			this.loadFn.apply(this.model,[data,this.part]);
		}
	};


	var partTypes = [
		{
			name: 'information', 
			niceName: 'Information only'
		},
		{
			name: 'gapfill', 
			niceName: 'Gap-fill', 
			has_marks: true,

			toJSON: function(data,part) {
				if(part.gaps().length)
				{
					data.gaps = part.gaps().map(function(g) {
						return g.toJSON();
					});
				}
			},
			load: function(data,part) {
                if(data.gaps)
                {
                    data.gaps.map(function(g) {
                        part.gaps.push(new Part(part.q,part,part.gaps,g));
                    });
                }
			}
		},
		{
			name:'jme', 
			niceName: 'Mathematical expression', 
			has_marks: true, 
			tabs: [
				new Editor.Tab('restrictions','Accuracy and string restrictions','scale')
			],

			model: function() {
				var model = {
					answer: ko.observable(''),
					answerSimplification: ko.observable(''),
					showPreview: ko.observable(true),
					checkingTypes: [
						{name:'absdiff',niceName:'Absolute difference', accuracy: ko.observable(0.001)},
						{name:'reldiff',niceName:'Relative difference', accuracy: ko.observable(0.001)},
						{name:'dp',niceName:'Decimal points', accuracy: ko.observable(3)},
						{name:'sigfig',niceName:'Significant figures', accuracy: ko.observable(3)}
					],
					failureRate: ko.observable(1),
					vset: {
						points: ko.observable(5),
						start: ko.observable(0),
						end: ko.observable(1)
					},
					maxlength: {
						length: ko.observable(0),
						partialCredit: ko.observable(0),
						message: Editor.contentObservable('')
					},
					minlength: {
						length: ko.observable(0),
						partialCredit: ko.observable(0),
						message: Editor.contentObservable('')
					},
					musthave: {
						strings: ko.observableArray([]),
						showStrings: ko.observable(false),
						partialCredit: ko.observable(0),
						message: Editor.contentObservable('')
					},
					notallowed: {
						strings: ko.observableArray([]),
						showStrings: ko.observable(false),
						partialCredit: ko.observable(0),
						message: Editor.contentObservable('')
					},
					checkVariableNames: ko.observable(false),
					expectedVariableNames: ko.observableArray([])
				};
				model.checkingType = ko.observable(model.checkingTypes[0]);

				return model;
			},

			toJSON: function(data) {
                data.answer = this.answer();
                if(this.answerSimplification())
                    data.answersimplification = this.answerSimplification();
				data.showpreview = this.showPreview();
                data.checkingtype = this.checkingType().name;
                data.checkingaccuracy = this.checkingType().accuracy();
                data.vsetrangepoints = this.vset.points();
                data.vsetrange = [this.vset.start(),this.vset.end()];
                data.checkvariablenames = this.checkVariableNames();
				data.expectedvariablenames = this.expectedVariableNames();
                if(this.maxlength.length())
                {
                    data.maxlength = {
                        length: this.maxlength.length(),
                        partialCredit: this.maxlength.partialCredit(),
                        message: this.maxlength.message()
                    };
                }
                if(this.minlength.length())
                {
                    data.minlength = {
                        length: this.minlength.length(),
                        partialCredit: this.minlength.partialCredit(),
                        message: this.minlength.message()
                    };
                }
                if(this.musthave.strings().length)
                {
                    data.musthave = {
                        strings: this.musthave.strings(),
                        showStrings: this.musthave.showStrings(),
                        partialCredit: this.musthave.partialCredit(),
                        message: this.musthave.message()
                    };
                }
                if(this.notallowed.strings().length)
                {
                    data.notallowed = {
                        strings: this.notallowed.strings(),
                        showStrings: this.notallowed.showStrings(),
                        partialCredit: this.notallowed.partialCredit(),
                        message: this.notallowed.message()
                    };
                }
			},
			load: function(data) {
                tryLoad(data,['answer','answerSimplification','checkVariableNames','expectedVariableNames','showPreview'],this);
                for(var i=0;i<this.checkingTypes.length;i++)
                {
                    if(this.checkingTypes[i].name == data.checkingtype)
                        this.checkingType(this.checkingTypes[i]);
                }
                tryLoad(data,'checkingaccuracy',this.checkingType(),'accuracy');
				tryLoad(data,'vsetrangepoints',this.vset,'points');
				if('vsetrange' in data) {
					this.vset.start(data.vsetrange[0]);
					this.vset.end(data.vsetrange[1]);
				}

                tryLoad(data.maxlength,['length','partialCredit','message'],this.maxlength);
                tryLoad(data.minlength,['length','partialCredit','message'],this.minlength);
                tryLoad(data.musthave,['strings','showStrings','partialCredit','message'],this.musthave);
                tryLoad(data.notallowed,['strings','showStrings','partialCredt','message'],this.notallowed);
			}
		},
		{
			name:'numberentry', 
			niceName: 'Number entry', 
			has_marks: true,
			tabs: [],

			model: function() {
				var model = {
					minValue: ko.observable(''),
					maxValue: ko.observable(''),
					correctAnswerFraction: ko.observable(false),
					integerAnswer: ko.observable(false),
					integerPartialCredit: ko.observable(0),
					allowFractions: ko.observable(false),
					precisionTypes: [
						{name: 'none', niceName: 'None'},
						{name: 'dp', niceName: 'Decimal places'},
						{name: 'sigfig', niceName: 'Significant figures'}
					],
					precision: ko.observable(0),
					precisionPartialCredit: ko.observable(0),
					precisionMessage: ko.observable('You have not given your answer to the correct precision.'),
					strictPrecision: ko.observable(true)
				};
				model.precisionType = ko.observable(model.precisionTypes[0]);
				model.precisionWord = ko.computed(function() {
					switch(this.precisionType().name) {
					case 'dp':
						return 'Digits';
					case 'sigfig':
						return 'Significant figures';
					}
				},model);

				return model;
			},

			toJSON: function(data) {
                data.minValue = this.minValue();
                data.maxValue = this.maxValue();
				data.correctAnswerFraction = this.correctAnswerFraction();
                if(this.integerAnswer())
                {
                    data.integerAnswer = this.integerAnswer();
                    data.integerPartialCredit= this.integerPartialCredit();
                }
				data.allowFractions = this.allowFractions();
				if(this.precisionType().name!='none') {
					data.precisionType = this.precisionType().name;
					data.precision = this.precision();
					data.precisionPartialCredit = this.precisionPartialCredit();
					data.precisionMessage = this.precisionMessage();
					data.strictPrecision = this.strictPrecision();
				}
			},
			load: function(data) {
                tryLoad(data,['minValue','maxValue','correctAnswerFraction','integerAnswer','integerPartialCredit','allowFractions','precision','precisionPartialCredit','precisionMessage','precisionType','strictPrecision'],this);
				if('answer' in data) {
					this.minValue(data.answer);
					this.maxValue(data.answer);
				}
				for(var i=0;i<this.precisionTypes.length;i++) {
					if(this.precisionTypes[i].name == this.precisionType())
						this.precisionType(this.precisionTypes[i]);
				}
			}
		},
		{
			name: 'matrix',
			niceName: 'Matrix entry',
			has_marks: true,
			tabs: [],

			model: function() {
				var model = {
					correctAnswer: ko.observable(''),
					correctAnswerFractions: ko.observable(false),
					numRows: ko.observable(1),
					numColumns: ko.observable(1),
					allowResize: ko.observable(true),
					tolerance: ko.observable(0),
					markPerCell: ko.observable(false),
					allowFractions: ko.observable(false),
					precisionTypes: [
						{name: 'none', niceName: 'None'},
						{name: 'dp', niceName: 'Decimal places'},
						{name: 'sigfig', niceName: 'Significant figures'}
					],
					precision: ko.observable(0),
					precisionPartialCredit: ko.observable(0),
					precisionMessage: ko.observable('You have not given your answer to the correct precision.'),
					strictPrecision: ko.observable(true)
				}
				model.precisionType = ko.observable(model.precisionTypes[0]);
				model.precisionWord = ko.computed(function() {
					switch(this.precisionType().name) {
					case 'dp':
						return 'Digits';
					case 'sigfig':
						return 'Significant figures';
					}
				},model);

				return model;
			},

			toJSON: function(data) {
				data.correctAnswer = this.correctAnswer();
				data.correctAnswerFractions = this.correctAnswerFractions();
				data.numRows = this.numRows();
				data.numColumns = this.numColumns();
				data.allowResize = this.allowResize();
				data.tolerance = this.tolerance();
				data.markPerCell = this.markPerCell();
				data.allowFractions = this.allowFractions();

				if(this.precisionType().name!='none') {
					data.precisionType = this.precisionType().name;
					data.precision = this.precision();
					data.precisionPartialCredit = this.precisionPartialCredit();
					data.precisionMessage = this.precisionMessage();
					data.strictPrecision = this.strictPrecision();
				}
			},

			load: function(data) {
				tryLoad(data,['correctAnswer','correctAnswerFractions','numRows','numColumns','allowResize','tolerance','markPerCell','allowFractions','precision','precisionPartialCredit','precisionMessage','precisionType','strictPrecision'],this);
				for(var i=0;i<this.precisionTypes.length;i++) {
					if(this.precisionTypes[i].name == this.precisionType())
						this.precisionType(this.precisionTypes[i]);
				}
			}
		},
		{
			name:'patternmatch', 
			niceName: 'Match text pattern', 
			has_marks: true,
			tabs: [],

			model: function() {
				return {
					answer: ko.observable(''),
					displayAnswer: Editor.contentObservable(''),
					caseSensitive: ko.observable(false),
					partialCredit: ko.observable(0)
				}
			},

			toJSON: function(data) {
                data.answer = this.answer();
                data.displayAnswer = this.displayAnswer();
                if(this.caseSensitive())
                {
                    data.caseSensitive = this.caseSensitive();
                    data.partialCredit = this.partialCredit();
                }
			},
			load: function(data) {
                tryLoad(data,['answer','displayAnswer','caseSensitive','partialCredit'],this);
			}
		},
		{
			name:'1_n_2', 
			niceName: 'Choose one from a list',
			tabs: [
				new Editor.Tab('marking','Marking','pencil'),
				new Editor.Tab('choices','Choices','list')
			],

			model: function(part) {
				var model = {
					minMarks: ko.observable(0),
					maxMarks: ko.observable(0),
					shuffleChoices: ko.observable(false),
					displayColumns: ko.observable(0),
					customMatrix: ko.observable(''),

					customChoices: ko.observable(false),
					customChoicesExpression: ko.observable(''),

					choices: ko.observableArray([])
				};
				var _customMarking = ko.observable(false);
				model.customMarking = ko.computed({
					read: function() {
						return _customMarking() || this.customChoices();
					},
					write: function(v) {
						return _customMarking(v);
					}
				},model);

				model.addChoice = function() {
					var c = {
						content: Editor.contentObservable('Choice '+(model.choices().length+1)),
						marks: ko.observable(0),
						distractor: Editor.contentObservable(''),
						answers: ko.observableArray([])
					};
					c.remove = function() {
						model.removeChoice(c);
					}

					model.choices.push(c);
					return c;
				};

				model.removeChoice = function(choice) {
					model.choices.remove(choice);
				};

				return model;
			},

			toJSON: function(data) {
                data.minMarks = this.minMarks();
                data.maxMarks = this.maxMarks();
                data.shuffleChoices = this.shuffleChoices();
                data.displayType = 'radiogroup';
                data.displayColumns = this.displayColumns();

				if(this.customChoices()) {
					data.choices = this.customChoicesExpression();
				} else {
	                var choices = this.choices();
    	            data.choices = choices.map(function(c){return c.content()});
				}
				if(this.customMarking()) {
					data.matrix = this.customMatrix();
				} else {
					var matrix = [];
					var distractors = [];
					for(var i=0;i<choices.length;i++)
					{
						matrix.push(choices[i].marks());
						distractors.push(choices[i].distractor());
					}

					data.matrix = matrix;
				}

                data.distractors = distractors;
			},
			load: function(data) {
                tryLoad(data,['minMarks','maxMarks','shuffleChoices','displayColumns'],this);
				if(typeof data.matrix == 'string') {
					this.customMarking(true);
					this.customMatrix(data.matrix);
				}

				if(typeof data.choices == 'string') {
					this.customChoices(true);
					this.customChoicesExpression(data.choices);
				} else {
					for(var i=0;i<data.choices.length;i++)
					{
						var c = this.addChoice(data.choices[i]);
						c.content(data.choices[i] || '');
						if(!this.customMarking()) {
							c.marks(data.matrix[i] || 0);
						}
						if('distractors' in data)
						{
							c.distractor(data.distractors[i] || '');
						}
					}
				}

			}
		},
		{
			name:'m_n_2', 
			niceName: 'Choose several from a list',
			tabs: [
				new Editor.Tab('marking','Marking','pencil'),
				new Editor.Tab('choices','Choices','list')
			],

			model: function() {
				var model = {
					minMarks: ko.observable(0),
					maxMarks: ko.observable(0),
					minAnswers: ko.observable(0),
					maxAnswers: ko.observable(0),
					shuffleChoices: ko.observable(false),
					displayColumns: ko.observable(0),
					customMatrix: ko.observable(''),
					warningType: ko.observable(''),

					warningTypes: [
						{name: 'none', niceName: 'Do nothing'},
						{name: 'warn', niceName: 'Warn'},
						{name: 'prevent', niceName: 'Prevent submission'}
					],

					customChoices: ko.observable(false),
					customChoicesExpression: ko.observable(''),

					choices: ko.observableArray([]),
				};
				var _customMarking = ko.observable(false);
				model.customMarking = ko.computed({
					read: function() {
						return _customMarking() || this.customChoices();
					},
					write: function(v) {
						return _customMarking(v);
					}
				},model);

				model.addChoice = function() {
					var c = {
						content: Editor.contentObservable('Choice '+(model.choices().length+1)),
						marks: ko.observable(0),
						distractor: Editor.contentObservable(''),
						answers: ko.observableArray([])
					};
					c.remove = function() {
						model.removeChoice(c);
					}

					model.choices.push(c);
					return c;
				};

				model.removeChoice = function(choice) {
					model.choices.remove(choice);
				};

				return model;
			},

			toJSON: function(data) {
                data.minMarks = this.minMarks();
                data.maxMarks = this.maxMarks();
                data.shuffleChoices = this.shuffleChoices();
                data.displayType = 'checkbox';
                data.displayColumns = this.displayColumns();
                data.minAnswers = this.minAnswers();
                data.maxAnswers = this.maxAnswers();
				data.warningType = this.warningType().name;

				if(this.customChoices()) {
					data.choices = this.customChoicesExpression();
				} else {
	                var choices = this.choices();
    	            data.choices = choices.map(function(c){return c.content()});
				}
				if(this.customMarking()) {
					data.matrix = this.customMatrix();
				} else {
					var matrix = [];
					var distractors = [];
					for(var i=0;i<choices.length;i++)
					{
						matrix.push(choices[i].marks());
						distractors.push(choices[i].distractor());
					}

					data.matrix = matrix;
				}

                data.distractors = distractors;
			},
			load: function(data) {
                tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','displayColumns'],this);
				if(typeof data.matrix == 'string') {
					this.customMarking(true);
					this.customMatrix(data.matrix);
				}

                for(var i=0;i<this.warningTypes.length;i++)
                {
                    if(this.warningTypes[i].name==data.warningType) {
                        this.warningType(this.warningTypes[i]);
					}
                }

				if(typeof data.choices == 'string') {
					this.customChoices(true);
					this.customChoicesExpression(data.choices);
				} else {
					for(var i=0;i<data.choices.length;i++)
					{
						var c = this.addChoice(data.choices[i]);
						c.content(data.choices[i] || '');
						if(!this.customMarking()) {
							c.marks(data.matrix[i] || 0);
						}
						if('distractors' in data)
						{
							c.distractor(data.distractors[i] || '');
						}
					}
				}
			}
		},
		{
			name:'m_n_x', 
			niceName: 'Match choices with answers',
			tabs: [
				new Editor.Tab('choices','Choices','list'),
				new Editor.Tab('answers','Answers','list'),
				new Editor.Tab('matrix','Marking matrix','th'),
				new Editor.Tab('marking','Marking options','pencil')
			],

			model: function() {
				var model = {
					minMarks: ko.observable(0),
					maxMarks: ko.observable(0),
					minAnswers: ko.observable(0),
					maxAnswers: ko.observable(0),
					shuffleChoices: ko.observable(false),
					shuffleAnswers: ko.observable(false),
					displayType:ko.observable(''),
					customMatrix: ko.observable(''),
					warningType: ko.observable(''),

					warningTypes: [
						{name: 'none', niceName: 'Do nothing'},
						{name: 'warn', niceName: 'Warn'},
						{name: 'prevent', niceName: 'Prevent submission'}
					],
					displayTypes: [
						{name: 'radiogroup', niceName: 'One from each row'},
						{name: 'checkbox', niceName: 'Checkboxes'}
					],

					customChoices: ko.observable(false),
					customChoicesExpression: ko.observable(''),
					customAnswers: ko.observable(false),
					customAnswersExpression: ko.observable(''),

					choices: ko.observableArray([]),
					answers: ko.observableArray([]),

					layoutType: ko.observable('all'),
					layoutTypes: [
						{name: 'all', niceName: 'Show all options'},
						{name: 'lowertriangle', niceName: 'Lower triangle'},
						{name: 'strictlowertriangle', niceName: 'Lower triangle (no diagonal)'},
						{name: 'uppertriangle', niceName: 'Upper triangle'},
						{name: 'strict uppertriangle', niceName: 'Upper triangle (no diagonal)'},
						{name: 'expression', niceName: 'Custom expression'}
					],
					layoutExpression: ko.observable('')
				};

				model.matrix = Editor.editableGrid(
					ko.computed(function() {
						return model.choices().length;
					}), 
					ko.computed(function() {
						return model.answers().length;
					}),
					function() {
						return {
							marks: ko.observable(0),
							distractor: ko.observable('')
						}
					}
				);

				var _customMarking = ko.observable(false);
				model.customMarking = ko.computed({
					read: function() {
						return _customMarking() || this.customChoices() || this.customAnswers();
					},
					write: function(v) {
						return _customMarking(v);
					}
				},model);

				model.addChoice = function() {
					var c = {
						content: Editor.contentObservable('Choice '+(model.choices().length+1)),
						marks: ko.observable(0),
						distractor: Editor.contentObservable('')
					};
					c.remove = function() {
						model.removeChoice(c);
					}

					model.choices.push(c);
					return c;
				},

				model.removeChoice = function(choice) {
					model.choices.remove(choice);
				};

				model.addAnswer = function() {
					var a = {
						content: ko.observable('Answer '+(model.answers().length+1))
					};
					a.remove = function() {
						model.removeAnswer(a);
					}

					model.answers.push(a);
					return a;
				};

				model.removeAnswer = function(answer) {
					var n = model.answers.indexOf(answer);
					model.answers.remove(answer);
				};

				return model;
			},

			toJSON: function(data) {
                data.minMarks = this.minMarks();
                data.maxMarks = this.maxMarks();
                data.minAnswers = this.minAnswers();
                data.maxAnswers = this.maxAnswers();
                data.shuffleChoices = this.shuffleChoices();
                data.shuffleAnswers = this.shuffleAnswers();
                data.displayType = this.displayType().name;
				data.warningType = this.warningType().name;

				if(this.customChoices()) {
					data.choices = this.customChoicesExpression();
				} else {
	                var choices = this.choices();
    	            data.choices = choices.map(function(c){return c.content()});
				}

				if(this.customMarking()) {
					data.matrix = this.customMatrix();
				} else {
					data.matrix = this.matrix().map(function(r){ return r().map(function(c) { return c.marks() }) });
				}

				data.layout = {type: this.layoutType().name, expression: this.layoutExpression()}

				if(this.customAnswers()) {
					data.answers = this.customAnswersExpression();
				} else {
	                var answers = this.answers();
    	            data.answers = answers.map(function(a){return a.content()});
				}
			},
			load: function(data) {
                tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','shuffleAnswers'],this);
                for(var i=0;i<this.warningTypes.length;i++)
                {
                    if(this.warningTypes[i].name==data.warningType) {
                        this.warningType(this.warningTypes[i]);
					}
                }
                for(var i=0;i<this.displayTypes.length;i++)
                {
                    if(this.displayTypes[i].name==data.displayType) {
                        this.displayType(this.displayTypes[i]);
					}
                }
				if(data.layout) {
					for(var i=0;i<this.layoutTypes.length;i++)
					{
						if(this.layoutTypes[i].name==data.layout.type) {
							this.layoutType(this.layoutTypes[i]);
						}
					}
					tryLoad(data.layout,['expression'],this,['layoutExpression']);
				}

				if(typeof data.answers == 'string') {
					this.customAnswers(true);
					this.customAnswersExpression(data.answers);
				} else {
					for(var i=0;i<data.answers.length;i++)
					{
						var a = this.addAnswer();
						a.content(data.answers[i]);
					}
				}
				if(typeof data.choices == 'string') {
					this.customChoices(true);
					this.customChoicesExpression(data.choices);
				} else {
					for(var i=0;i<data.choices.length;i++)
					{
						var c = this.addChoice(data.choices[i]);
						c.content(data.choices[i]);
					}
				}
				if(typeof data.matrix == 'string') {
					this.customMarking(true);
					this.customMatrix(data.matrix);
				} else {
					for(var i=0;i<data.matrix.length;i++) {
						for(var j=0;j<data.matrix[i].length;j++) {
							this.matrix()[i]()[j].marks(data.matrix[i][j]);
						}
					}
				}
			}
		}
	];

    var deps = ['jme-display','jme-variables','jme','editor-extras'];
	for(var i=0;i<Editor.numbasExtensions.length;i++) {
		var extension = Editor.numbasExtensions[i];
		if(extension.hasScript) {
			deps.push('extensions/'+extension.location+'/'+extension.location+'.js');
		}
	}
    Numbas.queueScript('start-editor',deps,function() {
		try {
			viewModel = new Question(Editor.questionJSON);
			ko.applyBindings(viewModel);
            document.body.classList.add('loaded');
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
		window.open(Editor.previewURL,Editor.previewWindow);
	});


    ko.onError = function(e) {
        console.log(e);
    }

});
