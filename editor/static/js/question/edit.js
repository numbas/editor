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

    function Question(data)
    {
		var q = this;

		this.mainTabs = ko.observableArray([
			new Editor.Tab('general','General'),
			new Editor.Tab('statement','Statement'),
			new Editor.Tab('variables','Variables'),
			new Editor.Tab('functions','Functions & Rulesets'),
			new Editor.Tab(
				'parts',
				ko.computed(function() {
					return 'Parts ('+q.parts().length+')';
				})
			),
			new Editor.Tab('advice','Advice'),
			new Editor.Tab(
                'resources',
                ko.computed(function() {
                    return 'Resources ('+q.resources().length+')';
                })
            ),
			new Editor.Tab('exams','Exams using this question')
		]);
        if(Editor.editable)
            this.mainTabs.push(new Editor.Tab('access','Access'));

		this.currentTab = ko.observable(this.mainTabs()[0]);

        this.starred = ko.observable(Editor.starred);
        this.toggleStar = function() {
            q.starred(!q.starred());
        }
        this.starData = ko.computed(function() {
            return {starred: this.starred()}
        },this);
        this.saveStar = Editor.saver(this.starData,function(data) {
            return $.post('set-star',data);
        });

		this.exams = data.exams;

		this.resources = ko.observableArray([]);
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

		this.progress = ko.observable(Editor.progresses[0]);

		var isadvanced = this.isadvanced = ko.observable(true);

        this.name = ko.observable('Untitled Question');
		this.realName = ko.computed(function() {
			var name = this.name()
			return name.length>0 ? name : 'Untitled Question';
		},this);

		var realtags = this.realtags = ko.observableArray([]);
        this.tags = ko.computed({
            read: function() {
				return this.realtags().sort();
			},
            write: function(newtags) {
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
            if(realtags().indexOf(thing)==-1)
                realtags.push(thing);
        }
        this.tags.pop = function(thing) {
            return realtags.pop();
        }
        this.tags.splice = function(i,n) {
            return realtags.splice(i,n);
        }
		this.tags.remove = function(q) {
			return realtags.remove(q);
		}

		this.notes = ko.observable('');
		this.description = ko.observable('');
		this.metadata = ko.computed(function() {
			return {
				notes: this.notes(),
				description: this.description()
			};
		},this);

		this.extensions = ko.observableArray([]);
		for(var i=0;i<Editor.numbasExtensions.length;i++) {
			var ext = Editor.numbasExtensions[i];
			ext.used = ko.observable(false);
			this.extensions.push(ext);
		}
		this.usedExtensions = ko.computed(function() {
			return this.extensions().filter(function(e){return e.used()});
		},this);

        this.statement = Editor.contentObservable('');
        this.advice = Editor.contentObservable('');

        var rulesets = this.rulesets = ko.observableArray([]);
        this.allsets = ko.computed(function() {
            return builtinRulesets.concat(rulesets().map(function(r){return r.name()})).sort();
        });

        this.functions = ko.observableArray([]);

		this.preamble = {
			css: ko.observable(''),
			js: ko.observable('')
		};

        this.variables = ko.observableArray([]);
		this.variableGroups = ko.observableArray([]);
		this.baseVariableGroup = new VariableGroup(this,{name:'Ungrouped variables'});
		this.baseVariableGroup.fixed = true;
		this.allVariableGroups = ko.computed(function() {
			var l = this.variableGroups();
			return l.concat(this.baseVariableGroup);
		},this);
		this.editVariableGroup = ko.observable(null);
		this.autoCalculateVariables = ko.observable(true);
		this.currentVariable = ko.observable(null);

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

        this.parts = ko.observableArray([]);
		this.currentPart = ko.observable(undefined);
		this.showPart = function(part) {
			q.currentPart(part);
		};

        this.output = ko.computed(function() {
            var data = JSON.stringify(q.toJSON());
			return '// Numbas version: '+Editor.numbasVersion+'\n'+data;
        },this);

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
			this.computeVariables();
		},this).extend({throttle:300});

        if(data)
		{
			this.id = data.id;

			if('metadata' in data) {
				tryLoad(data.metadata,['notes','description'],this);
			}

			if('progress' in data) {
				for(var i=0;i<Editor.progresses.length;i++) {
					if(Editor.progresses[i][0]==data.progress) {
						this.progress(Editor.progresses[i]);
						break;
					}
				}
			}

			if('resources' in data)
			{
				data.resources.map(function(rd) {
					this.resources.push(new Editor.Resource(rd));
				},this);
			}

			this.load(Editor.parseExam(data.content));

			try{
				this.tags(data.tags);
			}
			catch(e) {
				this.tags([]);
			}
		}

        if(Editor.editable) {
			this.firstSave = true;

			this.deleteResource =  function(res) {
				$.get(res.deleteURL)
					.success(function() {
						q.resources.remove(res);
					})
					.error(function() {
					})
				;
			}

			this.save = ko.computed(function() {
                return {
                    content: this.output(),
                    tags: this.tags(),
					progress: this.progress()[0],
					resources: this.saveResources(),
                    metadata: this.metadata()
                };
			},this);

            this.autoSave = Editor.saver(
                function() {
                    var data = q.save();

                    if(q.variableErrors()) {
                        window.onbeforeunload = function() {
                            return 'There are errors in one or more variable definitions, so the question can\'t be saved.';
                        }
                        return;
                    }
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
                                history.replaceState({},q.realName(),address);
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
            this.access_rights = ko.observableArray(Editor.access_rights.map(function(d){return new UserAccess(q,d)}));

            this.access_data = ko.computed(function() {
                return {
                    public_access: q.public_access(),
                    user_ids: q.access_rights().map(function(u){return u.id}),
                    access_levels: q.access_rights().map(function(u){return u.access_level()})
                }
            });
            this.saveAccess = Editor.saver(this.access_data,function(data) {
                return $.post('set-access',data);
            });
            this.userAccessSearch=ko.observable('');

            this.addUserAccess = function(data) {
                var access_rights = q.access_rights();
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
                q.access_rights.push(new UserAccess(q,data));
            };
        }
    }
    Question.prototype = {
		deleteQuestion: function(q,e) {
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

		computeVariables: function() {
			if(!Numbas.jme)
			{
				var q = this;
				Numbas.init = function() {
					q.computeVariables();
				};
				return;
			}
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
			var tmpFunctions = this.functions().map(function(f) {
				f.error('');

				try {
					var fn = {
						name: f.name(),
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
				v.error('');
				if(!v.name() || !v.definition())
					return;
				try {
					var tree = jme.compile(v.definition(),scope,true);
					var vars = jme.findvars(tree);
				}
				catch(e) {
					v.error(e.message);
					return;
				}
				v.value('');
				v.dependencies(vars);
				todo[v.name().toLowerCase()] = {
					v: v,
					tree: tree,
					vars: vars
				}
			});

			//evaluate variables
			for(var x in todo)
			{
				try {
					var value = jme.variables.computeVariable(x,todo,scope);
					todo[x].v.value(value);
				}
				catch(e) {
					todo[x].v.error(e.message);
				}
			}
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

			var extensions = [];
			this.extensions().map(function(e) {
				if(e.used())
					extensions.push(e.location);
			});

            return {
                name: this.realName(),
                tags: this.tags(),
				progress: this.progress()[0],
                metadata: this.metadata(),
                statement: this.statement(),
				extensions: extensions,
                advice: this.advice(),
                rulesets: rulesets,
                variables: variables,
				variable_groups: groups,
				functions: functions,
				preamble: {
					js: this.preamble.js(),
					css: this.preamble.css()
				},
                parts: this.parts().map(function(p){return p.toJSON();})

            }
        },

        load: function(data) {
			var q = this;
            tryLoad(data,['name','statement','advice'],this);

			if('extensions' in data) {
				this.extensions().map(function(e) {
					if(data.extensions.indexOf(e.location)>=0)
						e.used(true);
				});
			}

            if('variables' in data)
            {
                for(var x in data.variables)
                {
					var v = new Variable(this,data.variables[x]);
                    this.variables.push(v);
                }
            }
			if('variable_groups' in data) {
				data.variable_groups.map(function(gdata) {
					var vg = q.getVariableGroup(gdata.name);
					gdata.variables.map(function(variable_name) {
						var v = q.getVariable(variable_name);
						vg.variables.push(v);
						q.baseVariableGroup.variables.remove(v);
					});
				});
			}

			this.selectFirstVariable();

			if('functions' in data)
			{
				for(var x in data.functions)
				{
					data.functions[x].name = x;
					this.functions.push(new CustomFunction(this,data.functions[x]));
				}
			}

			if('preamble' in data)
			{
				tryLoad(data.preamble,['css','js'],this.preamble);
			}

            if('rulesets' in data)
            {
                for(var x in data.rulesets)
                {
                    this.rulesets.push(new Ruleset(this,{name: x, sets:data.rulesets[x]}));
                }
            }

            if('parts' in data)
            {
                data.parts.map(function(pd) {
                    this.loadPart(pd);
                },this);
				if(this.parts().length) 
					this.currentPart(this.parts()[0]);
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
        
        changeEditLevel: function() {
            this.isadvanced(!this.isadvanced());
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
				})
                .removeAttr('data-mce-style')
				.attr('alt',this.imageModal.alt())
				.attr('title',this.imageModal.title())
			;

			$('#imageAttributeModal').modal('hide');

            var ed = viewModel.currentTinyMCE;
			ed.onChange.dispatch();
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
        this.name = data.name;
        this.access_level = ko.observable(data.access_level || 'view');
        this.remove = function() {
            question.access_rights.remove(ua);
        }
    }
    UserAccess.prototype = {
        access_options: [{value:'view',text:'Can view this'},{value:'edit',text:'Can edit this'}]
    }

    function Ruleset(exam,data)
    {
        this.name = ko.observable('ruleset'+exam.rulesets().length);
        this.sets = ko.observableArray([]);
        this.allsets = exam.allsets;
        this.remove = function() {
            if(confirm("Remove this ruleset?"))
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
				if(v==this)
					break;
				else if(v.name().toLowerCase()==name.toLowerCase())
					return 'There\'s already a variable with this name.';
			}

			if(!re_name.test(this.name())) {
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
				values: InexhaustibleList(),
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
					return val.definition();
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
			return currentVariable.dependencies().contains(this.name());
		},this);
		this.dependenciesObjects = ko.computed(function() {
			var deps = this.dependencies();
			return q.variables().filter(function(v2) {
				return deps.contains(v2.name());
			});
		},this);
		this.usedIn = ko.computed(function() {
			var v = this;
			return q.variables().filter(function(v2) {
				return v2.dependencies().contains(v.name());
			});
		},this);
		this.value = ko.observable('');
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
				group: this.group().name(),
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
					templateTypeValues.value(parseFloat(definition));
					break;
				case 'range':
					var rule = new Numbas.jme.display.Rule('a..b#c',[]);
					var m = rule.match(tree);
					templateTypeValues.min(Numbas.jme.evaluate(m.a,Numbas.jme.builtinScope).value);
					templateTypeValues.max(Numbas.jme.evaluate(m.b,Numbas.jme.builtinScope).value);
					templateTypeValues.step(Numbas.jme.evaluate(m.c,Numbas.jme.builtinScope).value);
					break;
				case 'randrange':
					var rule = new Numbas.jme.display.Rule('random(a..b#c)',[]);
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
		}
    }

    function CustomFunction(q,data) {
        this.name = ko.observable('');
        this.types = ['number','string','boolean','vector','matrix','list','name','function','op','range','html','?'];
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

	function Script(name,displayName,helpURL) {
		this.name = name;
		this.displayName = displayName;
		this.script = ko.observable('');
		this.helpURL = helpURL;

		this.active = ko.computed(function() {
			return this.script().trim().length>0;
		},this);
	}

    function Part(q,parent,parentList,data) {

		this.q = q;
        this.prompt = Editor.contentObservable('');
        this.parent = parent;
		this.parentList = parentList;

		this.availableTypes = ko.computed(function() {
			var nonGapTypes = ['information','gapfill'];
			var nonStepTypes = ['gapfill'];
			if(this.isGap())
				return this.types.filter(function(t){return nonGapTypes.indexOf(t.name)==-1});
			else if(this.isStep())
				return this.types.filter(function(t){return nonStepTypes.indexOf(t.name)==-1});
			else
				return this.types;
		},this);

        this.type = ko.observable(this.availableTypes()[0]);

		this.header = ko.computed(function() {
			var i = this.parentList.indexOf(this);
			if(this.isGap() || this.isStep()) {
				i = i+'. ';
			}
			else {
				i= 'abcdefghijklmnopqrstuvwxyz'[i]+') ';
			}
			return i+this.type().niceName;
		},this);

		this.tabs = ko.computed(function() {
			var tabs = [];
			if(!this.isGap())
				tabs.push(new Editor.Tab('prompt','Prompt'));

			if(this.type().has_marks)
				tabs.push(new Editor.Tab('marking','Marking'));

			tabs = tabs.concat(this.type().tabs);

			tabs.push(new Editor.Tab('scripts','Scripts'));

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

		this.showCorrectAnswer = ko.observable(true);

		this.scripts = [
			new Script('mark','Mark student\'s answer','http://numbas-editor.readthedocs.org/en/latest/question-parts.html#term-mark-student-s-answer'),
			new Script('validate','Validate student\'s answer','http://numbas-editor.readthedocs.org/en/latest/question-parts.html#term-validate-student-s-answer')
		];

        this.jme = {
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
        this.jme.checkingType = ko.observable(this.jme.checkingTypes[0]);

        this.numberentry = {
            minValue: ko.observable(''),
			maxValue: ko.observable(''),
            integerAnswer: ko.observable(false),
            integerPartialCredit: ko.observable(0),
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
		this.numberentry.precisionType = ko.observable(this.numberentry.precisionTypes[0]);
		this.numberentry.precisionWord = ko.computed(function() {
			switch(this.precisionType().name) {
			case 'dp':
				return 'Digits';
			case 'sigfig':
				return 'Significant figures';
			}
		},this.numberentry);

        this.patternmatch = {
            answer: ko.observable(''),
            displayAnswer: Editor.contentObservable(''),
            caseSensitive: ko.observable(false),
            partialCredit: ko.observable(0)
        };

        this.multiplechoice = {
            minMarks: ko.observable(0),
            maxMarks: ko.observable(0),
            minAnswers: ko.observable(0),
            maxAnswers: ko.observable(0),
            shuffleChoices: ko.observable(false),
            shuffleAnswers: ko.observable(false),
            displayColumns: ko.observable(0),
            displayType:ko.observable(''),
			customMarking: ko.observable(false),
			customMatrix: ko.observable(''),

            displayTypes: {
                'm_n_x': [
                    {name: 'radiogroup', niceName: 'One from each row'},
                    {name: 'checkbox', niceName: 'Checkboxes'}
                ],
                'm_n_2': [
                    {name: 'checkbox', niceName: 'Checkboxes'},
                    {name:'dropdown', niceName: 'Drop-down box'}
                ],
                '1_n_2': [
                    {name:'radiogroup', niceName: 'Radio boxes'},
                    {name:'dropdown', niceName: 'Drop-down box'}
                ]
            },

            choices: ko.observableArray([]),
            answers: ko.observableArray([])
        }

        this.gapfill = {
            gaps: ko.observableArray([])
        };

		this.meOrChildSelected = ko.computed(function() {
			var currentPart = q.currentPart();
			if(currentPart==this)
				return true;
			var children = this.gapfill.gaps().concat(this.steps());
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
        types: [
            {
				name: 'information', 
				niceName: 'Information only', 
				tabs: []
			},
            {
				name: 'gapfill', 
				niceName: 'Gap-fill', 
				has_marks: true,
				tabs: [
				]
			},
            {
				name:'jme', 
				niceName: 'Mathematical expression', 
				has_marks: true, 
				tabs: [
					new Editor.Tab('restrictions','Accuracy and string restrictions')
				]
			},
            {
				name:'numberentry', 
				niceName: 'Number entry', 
				has_marks: true,
				tabs: []
			},
            {
				name:'patternmatch', 
				niceName: 'Match text pattern', 
				has_marks: true,
				tabs: []
			},
            {
				name:'1_n_2', 
				niceName: 'Choose one from a list',
				tabs: [
					new Editor.Tab('marking','Marking'),
					new Editor.Tab('choices','Choices')
				]
			},
            {
				name:'m_n_2', 
				niceName: 'Choose several from a list',
				tabs: [
					new Editor.Tab('marking','Marking'),
					new Editor.Tab('choices','Choices')
				]
			},
            {
				name:'m_n_x', 
				niceName: 'Match choices with answers',
				tabs: [
					new Editor.Tab('choices','Marking matrix'),
					new Editor.Tab('marking','Marking options')
				]
			}
        ],

		copy: function() {
			var data = this.toJSON();
			var p = new Part(this.q,this.parent,this.parentList,data);
			this.parentList.push(p);
			this.q.currentPart(p);
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

        addGap: function() {
			var gap = new Part(this.q,this,this.gapfill.gaps);
            this.gapfill.gaps.push(gap);
			this.q.currentPart(gap);
        },

        addChoice: function() {
            var c = {
                content: Editor.contentObservable('Choice '+(this.multiplechoice.choices().length+1)),
                marks: ko.observable(0),
                distractor: Editor.contentObservable(''),
                answers: ko.observableArray([])
            };
            var p = this;
            c.remove = function() {
                p.removeChoice(c);
            }

            //add a marks observable for each answer
            for(var i=0;i<this.multiplechoice.answers().length;i++)
            {
                c.answers.push({
                    marks: ko.observable(0),
                    distractor: ko.observable('')
                });
            }

            this.multiplechoice.choices.push(c);
            return c;
        },

        removeChoice: function(choice) {
            this.multiplechoice.choices.remove(choice);
        },

        addAnswer: function() {
            var a = {
                content: ko.observable('Answer '+(this.multiplechoice.answers().length+1))
            };
            var p = this;
            a.remove = function() {
                p.removeAnswer(a);
            }

            for(var i=0;i<this.multiplechoice.choices().length;i++)
            {
                this.multiplechoice.choices()[i].answers.push({
                    marks: ko.observable(0),
                    distractor: ko.observable('')
                });
            }
            this.multiplechoice.answers.push(a);
            return a;
        },

        removeAnswer: function(answer) {
            var n = this.multiplechoice.answers.indexOf(answer);
            for(var i=0;i<this.multiplechoice.choices().length;i++)
            {
                this.multiplechoice.choices()[i].answers.splice(n,1);
            }
            this.multiplechoice.answers.remove(answer);
        },

		remove: function() {
            if(confirm("Remove this part?"))
            {
				this.parentList.remove(this);
				if(viewModel.currentPart()==this) {
					viewModel.currentPart(this.parent);
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

		isGap: function() {
			return this.parent && this.parent.type().name=='gapfill' && !this.parent.steps().contains(this);
		},

		isStep: function() {
			return this.parent && this.parent.steps().contains(this);
		},

        toJSON: function() {
            var o = {
                type: this.type().name,
                marks: this.realMarks(),
				showCorrectAnswer: this.showCorrectAnswer(),
				scripts: {}
            };

            if(this.prompt())
                o.prompt = this.prompt();
            if(this.steps().length)
            {
                o.stepsPenalty = this.stepsPenalty(),
                o.steps = this.steps().map(function(s){return s.toJSON();});
            }

			this.scripts.map(function(s) {
				var script = s.script();
				if(s.active()) {
					o.scripts[s.name] = script;
				}
			});

            switch(this.type().name)
            {
            case 'gapfill':
                if(this.gapfill.gaps().length)
                {
                    o.gaps = this.gapfill.gaps().map(function(g) {
                        return g.toJSON();
                    },this);
                }
                break;
            case 'jme':
                o.answer = this.jme.answer();
                if(this.jme.answerSimplification())
                    o.answersimplification = this.jme.answerSimplification();
				o.showpreview = this.jme.showPreview();
                o.checkingtype = this.jme.checkingType().name;
                o.checkingaccuracy = this.jme.checkingType().accuracy();
                o.vsetrangepoints = this.jme.vset.points();
                o.vsetrange = [this.jme.vset.start(),this.jme.vset.end()];
                o.checkvariablenames = this.jme.checkVariableNames();
				o.expectedvariablenames = this.jme.expectedVariableNames();
                if(this.jme.maxlength.length())
                {
                    o.maxlength = {
                        length: this.jme.maxlength.length(),
                        partialCredit: this.jme.maxlength.partialCredit(),
                        message: this.jme.maxlength.message()
                    };
                }
                if(this.jme.minlength.length())
                {
                    o.minlength = {
                        length: this.jme.minlength.length(),
                        partialCredit: this.jme.minlength.partialCredit(),
                        message: this.jme.minlength.message()
                    };
                }
                if(this.jme.musthave.strings().length)
                {
                    o.musthave = {
                        strings: this.jme.musthave.strings(),
                        showStrings: this.jme.musthave.showStrings(),
                        partialCredit: this.jme.musthave.partialCredit(),
                        message: this.jme.musthave.message()
                    };
                }
                if(this.jme.notallowed.strings().length)
                {
                    o.notallowed = {
                        strings: this.jme.notallowed.strings(),
                        showStrings: this.jme.notallowed.showStrings(),
                        partialCredit: this.jme.notallowed.partialCredit(),
                        message: this.jme.notallowed.message()
                    };
                }
                break;
            case 'numberentry':
                o.minValue = this.numberentry.minValue();
                o.maxValue = this.numberentry.maxValue();
                if(this.numberentry.integerAnswer())
                {
                    o.integerAnswer = this.numberentry.integerAnswer();
                    o.integerPartialCredit= this.numberentry.integerPartialCredit();
                }
				if(this.numberentry.precisionType().name!='none') {
					o.precisionType = this.numberentry.precisionType().name;
					o.precision = this.numberentry.precision();
					o.precisionPartialCredit = this.numberentry.precisionPartialCredit();
					o.precisionMessage = this.numberentry.precisionMessage();
					o.strictPrecision = this.numberentry.strictPrecision();
				}
                break;
            case 'patternmatch':
                o.answer = this.patternmatch.answer();
                o.displayAnswer = this.patternmatch.displayAnswer();
                if(this.patternmatch.caseSensitive())
                {
                    o.caseSensitive = this.patternmatch.caseSensitive();
                    o.partialCredit = this.patternmatch.partialCredit();
                }
                break;
            case 'm_n_x':
                o.minMarks = this.multiplechoice.minMarks();
                o.maxMarks = this.multiplechoice.maxMarks();
                o.minAnswers = this.multiplechoice.minAnswers();
                o.maxAnswers = this.multiplechoice.maxAnswers();
                o.shuffleChoices = this.multiplechoice.shuffleChoices();
                o.shuffleAnswers = this.multiplechoice.shuffleAnswers();
                o.displayType = this.multiplechoice.displayType().name;

                var matrix = [];
                var choices = this.multiplechoice.choices();
                o.choices = choices.map(function(c){return c.content()});
				for(var i=0;i<choices.length;i++)
					matrix.push(choices[i].answers().map(function(a){return a.marks();}));

				if(this.multiplechoice.customMarking())
					o.matrix = this.multiplechoice.customMatrix();
				else
					o.matrix = matrix;

                var answers = this.multiplechoice.answers();
                o.answers = answers.map(function(a){return a.content()});
                break;
            case '1_n_2':
            case 'm_n_2':
                o.minMarks = this.multiplechoice.minMarks();
                o.maxMarks = this.multiplechoice.maxMarks();
                o.shuffleChoices = this.multiplechoice.shuffleChoices();
                o.displayType = this.type().name=='1_n_2' ? 'radiogroup' : 'checkbox';
                o.displayColumns = this.multiplechoice.displayColumns();
                o.minAnswers = this.multiplechoice.minAnswers();
                o.maxAnswers = this.multiplechoice.maxAnswers();

                var choices = this.multiplechoice.choices();
                o.choices = choices.map(function(c){return c.content()});
                var matrix = [];
                var distractors = [];
                for(var i=0;i<choices.length;i++)
                {
                    matrix.push(choices[i].marks());
                    distractors.push(choices[i].distractor());
                }

				if(this.multiplechoice.customMarking())
					o.matrix = this.multiplechoice.customMatrix();
				else
					o.matrix = matrix;

                o.distractors = distractors;
                break;
            }
            return o;
        },

        load: function(data) {
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
							this.scripts[i].script(data.scripts[name]);
							break;
						}
					}
				}
			}

            switch(this.type().name)
            {
            case 'gapfill':
                if(data.gaps)
                {
                    data.gaps.map(function(g) {
                        this.gapfill.gaps.push(new Part(this.q,this,this.gapfill.gaps,g));
                    },this);
                }
                break;
            case 'jme':
                tryLoad(data,['answer','answerSimplification','checkVariableNames','expectedVariableNames','showPreview'],this.jme);
                for(var i=0;i<this.jme.checkingTypes.length;i++)
                {
                    if(this.jme.checkingTypes[i].name == data.checkingtype)
                        this.jme.checkingType(this.jme.checkingTypes[i]);
                }
                tryLoad(data,'checkingaccuracy',this.jme.checkingType(),'accuracy');
				tryLoad(data,'vsetrangepoints',this.jme.vset,'points');
				if('vsetrange' in data) {
					this.jme.vset.start(data.vsetrange[0]);
					this.jme.vset.end(data.vsetrange[1]);
				}

                tryLoad(data.maxlength,['length','partialCredit','message'],this.jme.maxlength);
                tryLoad(data.minlength,['length','partialCredit','message'],this.jme.minlength);
                tryLoad(data.musthave,['strings','showStrings','partialCredit','message'],this.jme.musthave);
                tryLoad(data.notallowed,['strings','showStrings','partialCredt','message'],this.jme.notallowed);

                break;
            case 'numberentry':
                tryLoad(data,['minValue','maxValue','integerAnswer','integerPartialCredit','precision','precisionPartialCredit','precisionMessage','precisionType','strictPrecision'],this.numberentry);
				if('answer' in data) {
					this.numberentry.minValue(data.answer);
					this.numberentry.maxValue(data.answer);
				}
				for(var i=0;i<this.numberentry.precisionTypes.length;i++) {
					if(this.numberentry.precisionTypes[i].name == this.numberentry.precisionType())
						this.numberentry.precisionType(this.numberentry.precisionTypes[i]);
				}

                break;
            case 'patternmatch':
                tryLoad(data,['answer','displayAnswer','caseSensitive','partialCredit'],this.patternmatch);
                break;
            case 'm_n_x':
                tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','shuffleAnswers'],this.multiplechoice);
				if(typeof data.matrix == 'string') {
					this.multiplechoice.customMarking(true);
					this.multiplechoice.customMatrix(data.matrix);
				}
                for(var i=0;i<this.multiplechoice.displayTypes.m_n_x.length;i++)
                {
                    if(this.multiplechoice.displayTypes.m_n_x[i].name==data.displayType)
                        this.multiplechoice.displayType(this.multiplechoice.displayTypes.m_n_x[i]);
                }

                for(var i=0;i<data.answers.length;i++)
                {
                    var a = this.addAnswer();
                    a.content(data.answers[i]);
                }
                for(var i=0;i<data.choices.length;i++)
                {
                    var c = this.addChoice(data.choices[i]);
                    c.content(data.choices[i]);
					if(!this.multiplechoice.customMarking()) {
						for(var j=0;j<data.answers.length;j++)
							this.multiplechoice.choices()[i].answers()[j].marks(data.matrix[i][j] || 0);
					}
                }
                break;
            case '1_n_2':
            case 'm_n_2':
                tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','displayColumns'],this.multiplechoice);
				if(typeof data.matrix == 'string') {
					this.multiplechoice.customMarking(true);
					this.multiplechoice.customMatrix(data.matrix);
				}

                var displayTypes = this.multiplechoice.displayTypes[this.type().name];
                for(var i=0;i<displayTypes.length;i++)
                {
                    if(displayTypes[i].name==data.displayType)
                        this.multiplechoice.displayType(displayTypes[i]);
                }

                for(var i=0;i<data.choices.length;i++)
                {
                    var c = this.addChoice(data.choices[i]);
                    c.content(data.choices[i] || '');
					if(!this.multiplechoice.customMarking())
	                    c.marks(data.matrix[i] || 0);
					if('distractors' in data)
                    {
	                    c.distractor(data.distractors[i] || '');
                    }
                }
                break;

            }
        }
    };

	Numbas.loadScript('scripts/jme-display.js');
	Numbas.loadScript('scripts/jme-variables.js');
	Numbas.loadScript('scripts/jme.js');
	Numbas.loadScript('scripts/editor-extras.js');
	for(var i=0;i<Editor.numbasExtensions.length;i++) {
		if(Editor.numbasExtensions[i].hasScript) {
			var name = Editor.numbasExtensions[i].location;
			Numbas.loadScript('scripts/extensions/'+name+'/'+name+'.js');
		}
	}
	Numbas.startOK = true;
	Numbas.init = function() {
		try {
			viewModel = new Question(Editor.questionJSON);
			ko.applyBindings(viewModel);
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
	};
	Numbas.tryInit();

	Mousetrap.bind(['ctrl+b','command+b'],function() {
		window.open(Editor.previewURL,Editor.previewWindow);
	});


});
