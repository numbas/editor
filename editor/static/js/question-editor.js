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
//indent every line in given string with n tab characters

    var Variable = Editor.Variable,
        Ruleset = Editor.Ruleset;

    function Question(data)
    {
        this.name = ko.observable(questionJSON.name);

		this.tags = ko.observableArray([]);
		this.metadata = ko.observable('');

        this.statement = ko.observable('');
        this.advice = ko.observable('');

        this.variables = ko.observableArray([]);

        this.parts = ko.observableArray([]);

        this.output = ko.computed(function() {
            return prettyData(this.toJSON());
        },this);

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);

        if(data)
		{
			this.id = data.id;
			this.load(parseExam(data.content));
		}

        this.save = ko.computed(function() {
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
				{json: JSON.stringify(this.save()), csrfmiddlewaretoken: Editor.getCookie('csrftoken')}
			)
                .success(function(data){
                    var address = location.protocol+'//'+location.host+'/question/'+questionJSON.id+'/'+slugify(q.name())+'/';
                    if(history.replaceState)
                        history.replaceState({},q.name(),address);
                })
                .error(function(data) {
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
            ;
        },this).extend({throttle:1000});
    }
    Question.prototype = {
        addVariable: function() {
            this.variables.push(new Variable(this));
        },

        addPart: function() {
            this.parts.push(new Part(this));
        },

        removePart: function(p) {
            this.parts.remove(p);
        },

        toJSON: function() {
            var variables = {};
            this.variables().map(function(v) {
                variables[v.name()] = v.definition();
            });
            return {
                name: this.name(),
                statement: this.statement(),
                advice: this.advice(),
                variables: variables,
                parts: this.parts().map(function(p){return p.toJSON();})
            }
        },

        load: function(data) {
            ['name','statement','advice'].map(mapLoad(data),this);

            if('variables' in data)
            {
                for(var x in data.variables)
                {
                    this.variables.push(new Variable(this,{name:x,definition:data.variables[x]}));
                }
            }

            if('parts' in data)
            {
                data.parts.map(function(vd) {
                    this.parts.push(new Part(this,null,vd));
                },this);
            }
        },

		showPreview: function() {
			var q = this;
			if(q.preview)
				q.preview.close();
			$.post(
				Editor.exam_preview_url,
				{json: JSON.stringify(q.save()), csrfmiddlewaretoken: Editor.getCookie('csrftoken')}
			)
			.success(function(response, status, xhr) {
				var origin = location.protocol+'//'+location.host;
				console.log(response);
				q.preview = window.open(origin+"/numbas-previews/"+response.url);
			})
			.error(function(response, status, xhr) {
				noty({text:response.responseText,timeout:0});
				var responseObj = $.parseJSON(response.responseText);
				var message = textile('h3. Error making the preview:\n\n'+responseObj.message+'\n\n'+responseObj.traceback);
				noty({
					text: message,
					layout: "center",
					type: "error",
					animateOpen: {"height":"toggle"},
					animateClose: {"height":"toggle"},
				timeout: false,
					speed: "500",
					closable: true,
					closeOnSelfClick: true,
				});
			});
		}
    };

    var Part = function(q,parent,data) {
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
            answer:ko.observable(''),
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
                if(parent)
                    parent.steps.remove(this);
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
            {name:'numberentry', niceName: 'Number', has_marks: true},
            {name:'patternmatch', niceName: 'Text pattern', has_marks: true},
            {name:'1_n_2', niceName: 'Choose one from a list'},
            {name:'m_n_2', niceName: 'Choose several from a list'},
            {name:'m_n_x', niceName: 'Match choices with answers'}
        ],

        addStep: function() {
            this.steps.push(new Part(null,this));
        },

        addGap: function() {
            this.gapfill.gaps.push(new Part(null,this));
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
                o.answer = this.numberentry.answer();
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
                if(this.types[i].name == data.type)
                    this.type(this.types[i]);
            }
            this.marks(data.marks);
            this.prompt(data.prompt);
            this.stepsPenalty(data.stepsPenalty || 0);

            if(data.steps)
            {
                data.steps.map(function(s) {
                    this.steps.push(new Part(null,this,s));
                },this);
            }

            switch(this.type().name)
            {
            case 'gapfill':
                if(data.gaps)
                {
                    data.gaps.map(function(g) {
                        this.gapfill.gaps.push(new Part(null,this,g));
                    },this);
                }
                break;
            case 'jme':
                this.jme.answer(data.answer);
                this.jme.answerSimplification(data.answersimplification);
                for(var i=0;i<this.jme.checkingTypes.length;i++)
                {
                    if(this.jme.checkingTypes[i].name == data.checkingtype)
                        this.jme.checkingType(this.jme.checkingTypes[i]);
                }
                this.jme.checkingType().accuracy(data.checkingaccuracy);

                if(data.maxlength)
                {
                    this.jme.maxlength.length(data.maxlength.length);
                    this.jme.maxlength.partialCredit(data.maxlength.partialCredit);
                    this.jme.maxlength.message(data.maxlength.message);
                }

                if(data.minlength)
                {
                    this.jme.minlength.length(data.minlength.length);
                    this.jme.minlength.partialCredit(data.minlength.partialCredit);
                    this.jme.minlength.message(data.minlength.message);
                }

                if(data.musthave)
                {
                    this.jme.musthave.strings(data.musthave.strings);
                    this.jme.musthave.showStrings(data.musthave.showStrings);
                    this.jme.musthave.partialCredit(data.musthave.partialCredit);
                    this.jme.musthave.message(data.musthave.message);
                }

                if(data.notallowed)
                {
                    this.jme.notallowed.strings(data.notallowed.strings);
                    this.jme.notallowed.showStrings(data.notallowed.showStrings);
                    this.jme.notallowed.partialCredit(data.notallowed.partialCredit);
                    this.jme.notallowed.message(data.notallowed.message);
                }
                break;
            case 'numberentry':
                this.numberentry.answer(data.answer);
                this.numberentry.integerAnswer(data.integerAnswer || false);
                this.numberentry.partialCredit(data.partialCredit || 0);
                break;
            case 'patternmatch':
                this.patternmatch.answer(data.answer);
                this.patternmatch.displayAnswer(data.displayAnswer);
                this.patternmatch.caseSensitive(data.caseSensitive || false);
                this.patternmatch.partialCredit(data.partialCredit || 0);
                break;
            case 'm_n_x':
                this.multiplechoice.minMarks(data.minMarks);
                this.multiplechoice.maxMarks(data.maxMarks);
                this.multiplechoice.minAnswers(data.minAnswers);
                this.multiplechoice.maxAnswers(data.maxAnswers);
                this.multiplechoice.shuffleChoices(data.shuffleChoices);
                this.multiplechoice.shuffleAnswers(data.shuffleAnswers);
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
                this.multiplechoice.minMarks(data.minMarks);
                this.multiplechoice.maxMarks(data.maxMarks);
                this.multiplechoice.shuffleChoices(data.shuffleChoices);
                var displayTypes = this.multiplechoice.displayTypes[this.type().name];
                for(var i=0;i<displayTypes.length;i++)
                {
                    if(displayTypes[i].name==data.displayType)
                        this.multiplechoice.displayType(displayTypes[i]);
                }
                this.multiplechoice.displayColumns(data.displayColumns);

                for(var i=0;i<data.choices.length;i++)
                {
                    var c = this.addChoice(data.choices[i]);
                    c.content(data.choices[i]);
                    c.marks(data.matrix[i]);
                    c.distractor(data.distractors[i]);
                }
                break;

            }
        }
    };


    //create a question object
    viewModel = new Question(questionJSON);
    ko.applyBindings(viewModel);
});
