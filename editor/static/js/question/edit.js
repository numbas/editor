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
	Numbas.loadScript('scripts/jme-display.js');
	Numbas.loadScript('scripts/jme.js');
	Numbas.startOK = true;
	Numbas.init = function() {
		//create a question object
		viewModel = new Question(Editor.questionJSON);
		ko.applyBindings(viewModel);
	};
	Numbas.tryInit();

    function Question(data)
    {
        this.realName = ko.observable('A Question');
		this.name = ko.computed({
			read: this.realName,
			write: function(value) {
				if(value.length)
						this.realName(value);
			},
			owner: this
		});

		var realtags = this.realtags = ko.observableArray([]);
        this.tags = ko.computed({
            read: this.realtags,
            write: function(newtags) {
                for(var i=newtags.length-1;i>=0;i--)
                {
                    if(newtags.indexOf(newtags[i])<i)
                        newtags.splice(i,1);
                }
                this.realtags(newtags);
            },
        },this);
        this.tags.push = function(thing) {
            if(realtags().indexOf(thing)==-1)
                realtags.push(thing);
        }
        this.tags.pop = function(thing) {
            return realtags.pop();
        }
        this.tags.splice = function(i,n) {
            return realtags.splice(i,n);
        }

		this.metadata = ko.observable('');

        this.statement = ko.observable('');
        this.advice = ko.observable('');

        var rulesets = this.rulesets = ko.observableArray([]);
        this.allsets = ko.computed(function() {
            return builtinRulesets.concat(rulesets().map(function(r){return r.name()})).sort();
        });

        this.functions = ko.observableArray([]);

        this.variables = ko.observableArray([]);

        this.parts = ko.observableArray([]);

        this.output = ko.computed(function() {
            return prettyData(this.toJSON());
        },this);

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);

		ko.computed(function() {
			//the ko dependency checker seems not to pay attention to what happens in the computeVariables method, so access the variable bits here to give it a prompt
			this.variables().map(function(v) {
				v.name();
				v.definition();
			});
			this.computeVariables();
		},this).extend({throttle:300});

        if(data)
		{
			this.id = data.id;
			this.load(parseExam(data.content));
			try{
				this.tags(data.tags);
			}
			catch(e) {
				this.tags([]);
			}
		}

        this.save = ko.computed(function() {
			window.onbeforeunload = function() {
				return 'There are still unsaved changes.';
			}
			return {
				content: this.output(),
				tags: this.tags(),
				metadata: this.metadata()
			};
		},this);

		this.autoSave = ko.computed(function() {
            var q = this;

            $.post(
				'/question/'+this.id+'/'+slugify(this.name())+'/',
				{json: JSON.stringify(this.save()), csrfmiddlewaretoken: getCookie('csrftoken')}
			)
                .success(function(data){
                    var address = location.protocol+'//'+location.host+'/question/'+Editor.questionJSON.id+'/'+slugify(q.name())+'/';
                    if(history.replaceState)
                        history.replaceState({},q.name(),address);
                })
                .error(function(response,type,message) {
					noty({
						text: textile('Error saving question:\n\n'+message),
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
				})
            ;
        },this).extend({throttle:1000});
    }
    Question.prototype = {
        addRuleset: function() {
            this.rulesets.push(new Ruleset(this));
        },

        addFunction: function(q,e,n) {
            var f = new JMEFunction(this);
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
			var p = new Part(this);
            this.parts.push(p);
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

			var scope = new Numbas.jme.Scope(Numbas.jme.builtinScope);

			var jme = Numbas.jme;
			this.functions().map(function(f) {

				var name = f.name();

				var intype = [],
					paramNames = [];

				f.parameters().map(function(p) {
					intype.push(jme.types[p.type()]);
					paramNames.push(p.name());
				});

				var outcons = jme.types[f.type()];

				var fn = new jme.funcObj(name,intype,outcons,null,true);

				switch(f.language())
				{
				case 'jme':
					fn.tree = jme.compile(f.definition(),scope);

					fn.evaluate = function(args,scope)
					{
						scope = new Numbas.jme.Scope(scope);

						for(var j=0;j<args.length;j++)
						{
							scope.variables[paramNames[j]] = jme.evaluate(args[j],scope);
						}
						return jme.evaluate(this.tree,scope);
					}
					break;
				case 'javascript':
					var preamble='(function('+paramNames.join(',')+'){';
					var math = Numbas.math, 
						util = Numbas.util;
					var jfn = eval(preamble+f.definition()+'})');
					fn.evaluate = function(args,scope)
					{
						args = args.map(function(a){return jme.evaluate(a,scope).value});
						try {
							var val = jfn.apply(this,args);
							if(!val.type)
								val = new outcons(val);
							return val;
						}
						catch(e)
						{
							throw(new Numbas.Error('jme.user javascript error',f.name(),e.message));
						}
					}
					break;
				}

				if(scope.functions[name]===undefined)
					scope.functions[name] = [];
				scope.functions[name].push(fn);
			});

			var todo = {}
			this.variables().map(function(v) {
				if(!v.name() || !v.definition())
					return;
				try {
					var tree = Numbas.jme.compile(v.definition(),scope);
					var vars = Numbas.jme.findvars(tree);
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
			function compute(name,todo,variables,path)
			{
				if(variables[name]!==undefined)
					return;

				if(path===undefined)
					path=[];

				if(path.contains(name))
				{
					throw(new Numbas.Error('jme.variables.circular reference',name,path));
				}

				var v = todo[name];

				if(v===undefined)
					throw(new Numbas.Error('jme.variables.variable not defined',name));

				//work out dependencies
				for(var i=0;i<v.vars.length;i++)
				{
					var x=v.vars[i];
					if(variables[x]===undefined)
					{
						var newpath = path.slice(0);
						newpath.splice(0,0,name);
						compute(x,todo,variables,newpath);
					}
				}

				variables[name] = Numbas.jme.evaluate(v.tree,scope);
				v.v.value(variables[name]);
			}

			for(var x in todo)
			{
				try {
					compute(x,todo,scope.variables);
					todo[x].v.error('');
				}
				catch(e) {
					todo[x].v.error(e.message);
				}
			}
		},

        removePart: function(p) {
            this.parts.remove(p);
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

            return {
                name: this.name(),
                statement: this.statement(),
                advice: this.advice(),
                rulesets: rulesets,
                variables: variables,
				functions: functions,
                parts: this.parts().map(function(p){return p.toJSON();})
            }
        },

        load: function(data) {
            tryLoad(data,['name','statement','advice'],this);

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
					this.functions.push(new JMEFunction(this,data.functions[x]));
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
                data.parts.map(function(vd) {
                    this.parts.push(new Part(this,null,null,vd));
                },this);
            }
        },

		showPreview: function() {
			if(this.preview)
				this.preview.close();

			var q = this;
			$.get(Editor.preview_url)
			.success(function(response, status, xhr) {
				q.preview = window.open(response.url);
			})
			.error(function(response, status, xhr) {
				var responseObj = $.parseJSON(response.responseText);
				var message = 'h3. Error making the preview:\n\n'+responseObj.message+'\n\n'+responseObj.traceback;
				console.log(message);
				noty({
					text: textile(message),
					layout: "topLeft",
					type: "error",
					animateOpen: {"height":"toggle"},
					animateClose: {"height":"toggle"},
					timeout: 5000,
					speed: "500",
					closable: true,
					closeOnSelfClick: true,
				});
			});
		},

		download: function() {
			window.location = Editor.download_url;
		}
    };

    var builtinRulesets = ['basic','unitFactor','unitPower','unitDenominator','zeroFactor','zeroTerm','zeroPower','noLeadingMinus','collectNumbers','simplifyFractions','zeroBase','constantsFirst','sqrtProduct','sqrtDivision','sqrtSquare','trig','otherNumbers']

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

    function Variable(q,data) {
        this.name = ko.observable('');
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
				default:
					return '$'+Numbas.jme.display.texify({tok:this.value()})+'$';
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
			tryLoad(data,['name','definition'],this)
        }
    }

    function JMEFunction(q,data) {
        this.name = ko.observable('');
        this.types = ['number','string','boolean','vector','matrix','list','name','function','op','range','?'];
        this.parameters = ko.observableArray([])
        this.type = ko.observable('number');
        this.definition = ko.observable('');
		this.languages = ['jme','javascript'];
        this.language = ko.observable('jme');

        this.remove = function() {
            q.functions.remove(this);
        };
		if(data)
			this.load(data);
    }
	JMEFunction.prototype = {
		load: function(data) {
			var f = this;
			tryLoad(data,['name','type','definition','language'],this);
			if('parameters' in data) {
				data.parameters.map(function(p) {
					f.parameters.push(new FunctionParameter(this,p[0],p[1]));
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
		},
		removeParameter: function() {
			 this.parameters.pop();
		}
	};

	function FunctionParameter(f,name,type) {
		this.name = ko.observable(name);
		this.type = ko.observable(type);
		this.remove = function() {
			f.parameters.remove(this);
		}
	};

    var Part = function(q,parent,parentList,data) {
        this.type = ko.observable('information');
        this.prompt = ko.observable('');
        this.parent = parent;

        this.marks = ko.observable(0);

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
                message: ko.observable(''),
            },
            minlength: {
                length: ko.observable(0),
                partialCredit: ko.observable(0),
                message: ko.observable(''),
            },
            musthave: {
                strings: ko.observableArray([]),
                showStrings: ko.observable(false),
                partialCredit: ko.observable(0),
                message: ko.observable('')
            },
            notallowed: {
                strings: ko.observableArray([]),
                showStrings: ko.observable(false),
                partialCredit: ko.observable(0),
                message: ko.observable('')
            },
        };
        this.jme.checkingType = ko.observable(this.jme.checkingTypes[0]);

        this.numberentry = {
            minValue: ko.observable(''),
			maxValue: ko.observable(''),
            integerAnswer:ko.observable(false),
            partialCredit:ko.observable(0)
        };

        this.patternmatch = {
            answer: ko.observable(''),
            displayAnswer: ko.observable(''),
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

            displayTypes: {
                m_n_x: [
                    {name: 'radiogroup', niceName: 'Radio boxes'},
                    {name: 'checkbox', niceName: 'Checkboxes'},
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

        this.remove = function() {
            if(confirm("Remove this part?"))
            {
                if(parentList)
                    parentList.remove(this);
                else
                    q.removePart(this);
            }
        };

        if(data)
            this.load(data);
    }
    Part.prototype = {
        types: [
            {name: 'information', niceName: 'Information only'},
            {name: 'gapfill', niceName: 'Gap-fill'},
            {name:'jme', niceName: 'Mathematical expression', has_marks: true},
            {name:'numberentry', niceName: 'Number entry', has_marks: true},
            {name:'patternmatch', niceName: 'Match text pattern', has_marks: true},
            {name:'1_n_2', niceName: 'Choose one from a list'},
            {name:'m_n_2', niceName: 'Choose several from a list'},
            {name:'m_n_x', niceName: 'Match choices with answers'}
        ],

        addStep: function() {
            this.steps.push(new Part(null,this,this.steps));
        },

        addGap: function() {
            this.gapfill.gaps.push(new Part(null,this,this.gapfill.gaps));
        },

        addChoice: function() {
            var c = {
                content: ko.observable('Choice '+(this.multiplechoice.choices().length+1)),
                marks: ko.observable(0),
                distractor: ko.observable(''),
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

        toJSON: function() {
            var o = {
                type: this.type().name,
                marks: this.marks(),
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
                    o.partialCredit = this.numberentry.partialCredit();
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
                {
                    matrix.push(choices[i].answers().map(function(a){return a.marks();}));
                }
                o.matrix = matrix;

                var answers = this.multiplechoice.answers();
                o.answers = answers.map(function(a){return a.content()});
                break;
            case '1_n_2':
            case 'm_n_2':
                o.minMarks = this.multiplechoice.minMarks();
                o.maxMarks = this.multiplechoice.maxMarks();
                o.shuffleChoices = this.multiplechoice.shuffleChoices();
                o.displayType = this.multiplechoice.displayType().name;
                o.displayColumns = this.multiplechoice.displayColumns();

                var choices = this.multiplechoice.choices();
                o.choices = choices.map(function(c){return c.content()});
                var matrix = [];
                var distractors = [];
                for(var i=0;i<choices.length;i++)
                {
                    matrix.push(choices[i].marks());
                    distractors.push(choices[i].distractor());
                }
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
                    this.steps.push(new Part(null,this,this.steps,s));
                },this);
            }

            switch(this.type().name)
            {
            case 'gapfill':
                if(data.gaps)
                {
                    data.gaps.map(function(g) {
                        this.gapfill.gaps.push(new Part(null,this,this.gapfill.gaps,g));
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

                tryLoad(data.maxlength,['length','partialCredit','message'],this.jme.maxlength);
                tryLoad(data.minlength,['length','partialCredit','message'],this.jme.minlength);
                tryLoad(data.musthave,['strings','showStrings','partialCredit','message'],this.jme.musthave);
                tryLoad(data.notallowed,['strings','showStrings','partialCredt','message'],this.jme.notallowed);

                break;
            case 'numberentry':
                tryLoad(data,['minValue','maxValue','integerAnswer','partialCredit'],this.numberentry);
                break;
            case 'patternmatch':
                tryLoad(data,['answer','displayAnswer','caseSensitive','partialCredit'],this.patternmatch);
                break;
            case 'm_n_x':
                tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','shuffleAnswers'],this.multiplechoice);
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
                    for(var j=0;j<data.answers.length;j++)
                    {
                        this.multiplechoice.choices()[i].answers()[j].marks(data.matrix[i][j]);
                    }
                }
                break;
            case '1_n_2':
            case 'm_n_2':
                tryLoad(data,['minMarks','maxMarks','shuffleChoices','displayColumns'],this.multiplechoice);

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
                    c.marks(data.matrix[i] || 0);
					if('distractors' in data)
	                    c.distractor(data.distractors[i] || '');
                }
                break;

            }
        }
    };


});
