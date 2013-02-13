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
			new Editor.Tab('exams','Exams using this question')
		]);
		this.currentTab = ko.observable(this.mainTabs()[0]);

		this.exams = data.exams;

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

        this.variables = ko.observableArray([]);
		this.autoCalculateVariables = ko.observable(true);

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
            return prettyData(q.toJSON());
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


			this.load(parseExam(data.content));

			try{
				this.tags(data.tags);
			}
			catch(e) {
				this.tags([]);
			}
		}

        if(Editor.editable) {
			this.firstSave = true;

			this.save = ko.computed(function() {
                return {
                    content: this.output(),
                    tags: this.tags(),
					progress: this.progress()[0],
                    metadata: this.metadata()
                };
			},this);

            this.autoSave = ko.computed(function() {
                var vm = this;

				var data = this.save();

				if(this.firstSave) {
					this.firstSave = false;
					return;
				}

				window.onbeforeunload = function() {
					return 'There are still unsaved changes.';
				}

				if(this.variableErrors()) {
					window.onbeforeunload = function() {
						return 'There are errors in one or more variable definitions, so the question can\'t be saved.';
					}
					return;
				}

                if(!this.save_noty)
                {
                    this.save_noty = noty({
                        text: 'Saving...', 
                        layout: 'topCenter', 
                        type: 'information',
                        timeout: 0, 
                        speed: 150,
                        closeOnSelfClick: false, 
                        closeButton: false
                    });
                }
                
                $.post(
                    '/question/'+this.id+'/'+slugify(this.realName())+'/',
                    {json: JSON.stringify(data), csrfmiddlewaretoken: getCookie('csrftoken')}
                )
                    .success(function(data){
                        var address = location.protocol+'//'+location.host+data.url;
                        if(history.replaceState)
                            history.replaceState({},vm.realName(),address);
                        $.noty.close(vm.save_noty);
                        noty({text:'Saved.',type:'success',timeout: 1000, layout: 'topCenter'});
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
                    .complete(function() {
                        window.onbeforeunload = null;
                        $.noty.close(vm.save_noty);
                        vm.save_noty = null;
                    })
                ;
            },this).extend({throttle:1000});
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
			return v;
        },

        addPart: function() {
			var p = new Part(this,null,this.parts);
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

				var fn = {
					name: f.name(),
					definition: f.definition(),
					language: f.language(),
					outtype: f.type(),
					parameters: f.parameters().map(function(p) {
						return {
							name: p.name(),
							type: p.type()
						}
					})
				};


				try {
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
                variables[v.name()] = v.definition();
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
				functions: functions,
                parts: this.parts().map(function(p){return p.toJSON();})

            }
        },

        load: function(data) {
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
                    this.variables.push(new Variable(this,{name:x,definition:data.variables[x]}));
                }
            }

			if('functions' in data)
			{
				for(var x in data.functions)
				{
					data.functions[x].name = x;
					this.functions.push(new CustomFunction(this,data.functions[x]));
				}
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
                    this.parts.push(new Part(this,null,this.parts,pd));
                },this);
				if(this.parts().length) 
					this.currentPart(this.parts()[0]);
            }
        },

		download: function() {
			window.location = Editor.download_url;
		},
        
        changeEditLevel: function() {
            this.isadvanced(!this.isadvanced());
        }
        
    };


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

	var re_name = /^{?((?:(?:[a-zA-Z]+):)*)((?:\$?[a-zA-Z][a-zA-Z0-9]*'*)|\?)}?$/i;

    function Variable(q,data) {
        this.name = ko.observable('');
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
        this.definition = ko.observable('');
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
					return '$'+Numbas.jme.display.texify({tok:v})+'$';
				}
			}
			else
				return '';
		},this);
        this.remove = function() {
            q.variables.remove(this);
        };
        if(data)
            this.load(data);
    }
    Variable.prototype = {
        load: function(data) {
			tryLoad(data,['name','definition'],this);
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

    function Part(q,parent,parentList,data) {

		this.q = q;
        this.prompt = Editor.contentObservable('');
        this.parent = parent;
		this.parentList = parentList;

		this.availableTypes = ko.computed(function() {
			var nonGapTypes = ['information','gapfill'];
			if(this.isGap())
				return this.types.filter(function(t){return nonGapTypes.indexOf(t.name)==-1});
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
			return tabs;
		},this);
		this.currentTab = ko.observable(this.tabs()[0]);

        this.marks = ko.observable(1);
		this.realMarks = ko.computed(function() {
			switch(this.type().name) {
			case 'information':
			case 'gapfill':
				return 0;
			default:
				return this.marks();
			}
		},this);

        this.steps = ko.observableArray([]);
        this.stepsPenalty = ko.observable(0);

        this.jme = {
            answer: ko.observable(''),
            answerSimplification: ko.observable(''),
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
            }
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
			precisionMessage: ko.observable('You have not given your answer to the correct precision.')
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
                marks: this.realMarks()
            };
            if(this.prompt())
                o.prompt = this.prompt();
            if(this.steps().length)
            {
                o.stepsPenalty = this.stepsPenalty(),
                o.steps = this.steps().map(function(s){return s.toJSON();});
            }

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
                o.checkingtype = this.jme.checkingType().name;
                o.checkingaccuracy = this.jme.checkingType().accuracy();
                o.vsetrangepoints = this.jme.vset.points();
                o.vsetrange = [this.jme.vset.start(),this.jme.vset.end()];
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
                //o.displayType = this.multiplechoice.displayType().name;

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
            tryLoad(data,['marks','prompt','stepsPenalty'],this);

            if(data.steps)
            {
                data.steps.map(function(s) {
                    this.steps.push(new Part(this.q,this,this.steps,s));
                },this);
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
                tryLoad(data,['answer','answerSimplification'],this.jme);
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
                tryLoad(data,['minValue','maxValue','integerAnswer','integerPartialCredit','precision','precisionPartialCredit','precisionMessage'],this.numberentry);
				if('answer' in data) {
					this.numberentry.minValue(data.answer);
					this.numberentry.maxValue(data.answer);
				}
				for(var i=0;i<this.numberentry.precisionTypes.length;i++) {
					if(this.numberentry.precisionTypes[i].name == data.precisionType)
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
		var name = Editor.numbasExtensions[i].location;
		Numbas.loadScript('scripts/extensions/'+name+'/'+name+'.js');
	}
	Numbas.startOK = true;
	Numbas.init = function() {
		//create a question object
		viewModel = new Question(Editor.questionJSON);
		ko.applyBindings(viewModel);
	};
	Numbas.tryInit();

	Mousetrap.bind(['ctrl+b','command+b'],function() {
		window.open(Editor.previewURL,Editor.previewWindow);
	});


});
