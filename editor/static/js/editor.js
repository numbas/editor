(function() {
	$(document).ready(function() {
		var preview;
		$('#preview').click(function() {
			$.post(
				Editor.exam_preview_url,
//				{
//					'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val(),
//					'content': $('#id_content').val(),
//					'exam-edit-form': $('#exam-edit-form').serializeArray()
//				}
				$('#edit-form').serializeArray()
			)
			.success(function(response, status, xhr) {
				$('#preview-message').html(response);
				if (preview)
					preview.close();
				preview = window.open("http://numbas.mas.ncl.ac.uk/numbas-previews/exam/");
			})
			.error(function(response, status, xhr) {
				$('#preview-message').html(response.responseText);
			});
		});
	});
})();



var viewModel;

$(document).ready(function() {
	//indent every line in given string with n tab characters
	function indent(s,n)
	{
		//if n is not given, set n=1
		if(n===undefined)
			n=1;

		var lines = s.split('\n');
		for(var tabs='';tabs.length<n;tabs+='  '){}

		for(var i=0;i<lines.length;i++)
		{
			lines[i] = tabs+lines[i];
		}
		return lines.join('\n');
	}

	//represent a JSON-esque object in the Numbas .exam format
	function prettyData(data){
		switch(typeof(data))
		{
		case 'number':
			return data+'';
		case 'string':
			//this tries to use as little extra syntax as possible. Quotes or triple-quotes are only used if necessary.
			if(data.contains('"'))
				return '"""'+data+'"""';
			if(data.search(/[\n,\{\}\[\] ]/)>=0)
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
					data=data.map(function(s){return indent(s)});
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
						o += indent(x+': '+prettyData(data[x]))+'\n';
				}
				o+='}';
				return o;
			}
		}
	};

	function Exam()
	{
		this.name = ko.observable('An Exam');
		this.duration = ko.observable(0);
		this.percentPass = ko.observable(50);
		this.shuffleQuestions = ko.observable(false);
		this.showfrontpage = ko.observable(true);

		this.allowregen = ko.observable(false);
		this.reverse = ko.observable(false);
		this.browse = ko.observable(false);

		this.onadvance = ko.observable(null);
		this.onreverse = ko.observable(null);
		this.onmove = ko.observable(null);

		this.timeout = ko.observable(null);
		this.timedwarning = ko.observable(null);

		this.showactualmark = ko.observable(true);
		this.showtotalmark = ko.observable(true);
		this.showanswerstate = ko.observable(true);
		this.allowreavealanswer = ko.observable(true);
		this.advicethreshold = ko.observable(0);

		this.questions = ko.observableArray([]);

		this.onadvance = new Event(
			'onadvance',
			'On advance',
			[
				{name:'none', niceName:'None'},
				{name:'warnifunattempted', niceName:'Warn if unattempted'},
				{name:'preventifunattempted',niceName:'Prevent if unattempted'}
			]
		);
		this.onreverse = new Event(
			'onreverse',
			'On reverse',
			[
				{name:'none', niceName:'None'},
				{name:'warnifunattempted', niceName:'Warn if unattempted'},
				{name:'preventifunattempted',niceName:'Prevent if unattempted'}
			]
		);
		this.onmove = new Event(
			'onmove',
			'On move',
			[
				{name:'none', niceName:'None'},
				{name:'warnifunattempted', niceName:'Warn if unattempted'},
				{name:'preventifunattempted',niceName:'Prevent if unattempted'}
			]
		);

		this.timeout = new Event(
			'timeout',
			'On Timeout',
			[
				{name:'none', niceName:'None'},
				{name:'warn', niceName:'Warn'}
			]
		);
		this.timedwarning = new Event(
			'timedwarning',
			'5 minutes before timeout',
			[
				{name:'none', niceName:'None'},
				{name:'warn', niceName:'Warn'}
			]
		);

		ko.dependentObservable(function() {
			$('title').text(this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor');
		},this);
		
		this.output = ko.dependentObservable(function() {
			return prettyData(this.export());
		},this);

		this.save = ko.dependentObservable(function() {
			var data = this.export();
		},this);

		if(data)
			this.load(data);
	}
	Exam.prototype = {
		addQuestion: function() {
			this.questions.push(new Question(this));
		},

		//returns a JSON-y object representing the exam
		export: function() {
			return {
				name: this.name(),
				duration: this.duration()*60,
				percentPass: this.percentPass(),
				shuffleQuestions: this.shuffleQuestions(),
				navigation: {
					reverse: this.reverse(),
					browse: this.browse(),
					showfrontpage: this.showfrontpage(),
					onadvance: this.onadvance.export(),
					onreverse: this.onreverse.export(),
					onmove: this.onmove.export()
				},
				timing: {
					timeout: this.timeout.export(),
					timedwarning: this.timedwarning.export()
				},
				feedback: {
				  showactualmark: this.showactualmark(),
				  showtotalmark: this.showtotalmark(),
				  showanswerstate: this.showanswerstate(),
				  allowreavealanswer: this.allowreavealanswer(),
				  advicethreshold: this.advicethreshold()
				},
				questions: this.questions().map(function(q){return q.export();})
			};
		},

		load: function(data) {
			['name','percentPass','shuffleQuestions'].map(function(n){
				this[n](data[n]);
			},this);
			this.duration(data.duration/60);

			if('navigation' in data)
			{
				['reverse','browse','showfrontpage'].map(function(n){
					this[n](data.navigation[n]);
				},this);
				this.onadvance.load(data.navigation.onadvance);
				this.onreverse.load(data.navigation.onreverse);
				this.onmove.load(data.navigation.onmove);
			}
			if('timing' in data)
			{
				this.timeout.load(data.timing.timeout);
				this.timedwarning.load(data.timing.timedwarning);
			}

			if('feedback' in data)
			{
				['showactualmark','showtotalmark','showanswerstate','allowreavealanswer','advicethreshold'].map(function(n){
					this[n](data.feedback[n]);
				},this);
			}

			if('questions' in data)
			{
				data.questions.map(function(qd) {
					this.questions.push(new Question(this,qd));
				},this);
			}
		}
	};

	function Event(name,niceName,actions)
	{
		this.name = name;
		this.niceName = niceName;
		this.actions = actions;

		this.action = ko.observable(this.actions[0]);
		this.actionName = ko.dependentObservable(function() {
			return this.action().name;
		},this);
		this.message = ko.observable('')
	}
	Event.prototype = {
		export: function() {
			return {
				action:this.actionName(),
				message: this.message()
			};
		},

		load: function(data) {
			for(var i=0;i<this.actions.length;i++)
			{
				if(this.actions[i].name==data.action)
					this.action(this.actions[i]);
			}
			this.message(data.message);
		}
	};

	function Question(exam,data)
	{
		this.name = ko.observable('A Question');
		this.statement = ko.observable('');
		this.advice = ko.observable('');

		this.variables = ko.observableArray([]);

		this.parts = ko.observableArray([]);

		this.remove = function() {
			if(confirm("Remove this question?"))
				exam.questions.remove(this);
		};
		if(data)
			this.load(data);
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

		export: function() {
			var variables = {};
			this.variables().map(function(v) {
				variables[v.name()] = v.definition();
			});
			return {
				name: this.name(),
				statement: this.statement(),
				advice: this.advice(),
				variables: variables,
				parts: this.parts().map(function(p){return p.export();})
			}
		},

		load: function(data) {
			this.name(data.name);
			this.statement(data.statement);
			this.advice(data.advice);
			for(var x in data.variables)
			{
				this.variables.push(new Variable(this,{name:x,definition:data.variables[x]}));
			}
			data.parts.map(function(vd) {
				this.parts.push(new Part(this,null,vd));
			},this);
		}
	};

	var Variable = function(q,data) {
		this.name = ko.observable('');
		this.definition = ko.observable('');
		this.remove = function() {
			q.variables.remove(this);
		};
		if(data)
			this.load(data);
	}
	Variable.prototype = {
		load: function(data) {
			this.name(data.name);
			this.definition(data.definition);
		}
	}

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

		export: function() {
			var o = {
				type: this.type().name,
				marks: this.marks(),
			};
			if(this.prompt())
				o.prompt = this.prompt();
			if(this.steps().length)
			{
				o.stepsPenalty = this.stepsPenalty(),
				o.steps = this.steps().map(function(s){return s.export();});
			}

			switch(this.type().name)
			{
			case 'gapfill':
				if(this.gapfill.gaps().length)
				{
					o.gaps = this.gapfill.gaps().map(function(g) {
						return g.export();
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

	//make folders work
	$('.fold > #header').live('click',function() {
		$(this).siblings('#folder').toggle(150,function() {
			var p = $(this).parent();
			p.hasClass('folded') ? p.removeClass('folded') : p.addClass('folded');
		});
	});

	ko.bindingHandlers.writemaths = {
		init: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor()) || '';
			var d = $('<div/>');
			$(element).append(d);
			var wm = new WriteMaths(d);
			wm.setState(value);
			$(element).bind('input',function() {
				valueAccessor()(d.attr('value'));
			});
		},
		update: function(element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			$(element).trigger('setstate',value);
		}
	};
	
	ko.bindingHandlers.foldlist = {
		init: function(element,valueAccessor,allBindingsAccessor,viewModel)
		{
			var value = valueAccessor(), allBindings = allBindingsAccessor();
			var show = allBindings.show;

			element=$(element);
			var f=$('<div class="fold"><div id="header"></div><div id="folder"></div></div>');
			f.find('#header').html(ko.utils.unwrapObservable(allBindings.label));
			if(show)
				f.find('#folder').css('display','block');
			element.contents().appendTo(f.find('#folder'));
			var b = $('<button class="remove" data-bind="click:remove"></button>');
			b.click(function(){viewModel.remove()});
			element.append(b);
			element.append(f);
		},
		update: function(element,valueAccessor,allBindingsAccessor)
		{
			var value = valueAccessor(), allBindings = allBindingsAccessor();
			$(element).find('>.fold>#header').html(ko.utils.unwrapObservable(allBindings.label));
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

	ko.bindingHandlers.listbox = {
		init: function(element,valueAccessor) {
			var value = valueAccessor();
			$(element).addClass('listbox');

			var i = $('<input/>');
			i.keydown(function(e){
				switch(e.which)
				{
				case 13:
				case 9:
					var val = $(this).val().slice(0,this.selectionStart);
					if(val.length)
						value.push(val);
					e.preventDefault();
					e.stopPropagation();
					$(this).val($(this).val().slice(val.length));
					break;
				case 8:
					if(this.selectionStart==0 && this.selectionEnd==0)
					{
						var oval = $(this).val();
						var val = (value.pop() || '').slice(0,-1);
						$(this).val(val+oval);
						this.setSelectionRange(val.length,val.length);
						e.preventDefault();
						e.stopPropagation();
					}
					break;
				}
			});
			i.blur(function(e){
				var val = $(this).val();
				if(val.length)
					value.push(val);
				$(this).val('');
			});
			$(element).append('<ul/>');
			$(element).append(i);
			$(element).delegate('li','click',function(){
				var n = $(this).index();
				i.val(value()[n]).focus();
				value.splice(n,1);
			});
		},
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			$(element).find('ul li').remove();
			for(var i=0;i<value.length;i++)
			{
				$(element).find('ul').append($('<li/>').html(value[i]));
			}
		}
	}

	//create an exam object
	var data = $('#id_content').val();
	data = parseExam(data);
	console.log(data);
	viewModel = new Exam(data);
	ko.applyBindings(viewModel);
});
