$(document).ready(function() {
var part_types = Editor.part_types = {};

part_types.models = [
    {
        name: 'information', 
        niceName: 'Information only',
        can_be_gap: false
    },
    {
        name: 'extension', 
        niceName: 'Extension',
        has_marks: true
    },
    {
        name: 'gapfill', 
        niceName: 'Gap-fill', 
        has_marks: true,
        can_be_gap: false,
        can_be_step: false,
        widget: 'gapfill',

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
                    part.gaps.push(new Editor.question.Part(part.q,part,part.gaps,g));
                });
            }
        }
    },
    {
        name:'jme', 
        niceName: 'Mathematical expression', 
        has_marks: true, 
        tabs: [
            new Editor.Tab('restrictions','String restrictions','text-background'),
            new Editor.Tab('checking-accuracy','Accuracy','scale')
        ],
        widget: 'jme',

        model: function(part) {
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

            model.markingSettings = ko.computed(function() {
                try {
                    var correctAnswer = Numbas.jme.subvars(model.answer(),part.q.questionScope());
                } catch(e) {
                    correctAnswer = '';
                }
                return {
                    expectedVariableNames: model.expectedVariableNames(),
                    minLength: model.minlength.length(),
                    minLengthPC: model.minlength.partialCredit(),
                    minLengthMessage: model.minlength.message(),
                    maxLength: model.maxlength.length(),
                    maxLengthPC: model.maxlength.partialCredit(),
                    maxLengthMessage: model.maxlength.message(),
                    notAllowed: model.notallowed.strings(),
                    notAllowedPC: model.notallowed.partialCredit(),
                    notAllowedMessage: model.notallowed.message(),
                    mustHave: model.musthave.strings(),
                    mustHavePC: model.musthave.partialCredit(),
                    correctAnswer: correctAnswer,
                    correctAnswerString: model.answer(),
                    answerSimplificationString: model.answerSimplification(),
                    vsetRangeStart: model.vset.start(),
                    vsetRangeEnd: model.vset.end(),
                    vsetRangePoints: model.vset.points(),
                    checkingType: model.checkingType().name,
                    checkingAccuracy: model.checkingType().accuracy(),
                    failureRate: model.failureRate(),
                    checkVariableNames: model.checkVariableNames(),
                    showPreview: model.showPreview(),
                    expectedVariableNames: model.expectedVariableNames()
                };
            });

            return model;
        },

        toJSON: function(data) {
            data.answer = this.answer();
            if(this.answerSimplification())
                data.answerSimplification = this.answerSimplification();
            data.showPreview = this.showPreview();
            data.checkingType = this.checkingType().name;
            data.checkingAccuracy = this.checkingType().accuracy();
            data.failureRate = this.failureRate();
            data.vsetRangePoints = this.vset.points();
            data.vsetRange = [this.vset.start(),this.vset.end()];
            data.checkVariableNames = this.checkVariableNames();
            data.expectedVariableNames = this.expectedVariableNames();
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
        widget: 'number',

        model: function() {
            var model = {
                minValue: ko.observable(''),
                maxValue: ko.observable(''),
                correctAnswerFraction: ko.observable(false),
                allowFractions: ko.observable(false),
                precisionTypes: [
                    {name: 'none', niceName: 'None'},
                    {name: 'dp', niceName: 'Decimal places'},
                    {name: 'sigfig', niceName: 'Significant figures'}
                ],
                precision: ko.observable(0),
                precisionPartialCredit: ko.observable(0),
                precisionMessage: ko.observable('You have not given your answer to the correct precision.'),
                strictPrecision: ko.observable(true),
                showPrecisionHint: ko.observable(true),
                mustBeReduced: ko.observable(false),
                mustBeReducedPC: ko.observable(0)
            };

            model.notationStyles = [
                {
                    code: 'plain',
                    name: 'English (Plain)',
                    description: 'No thousands separator; dot for decimal point.',
                },
                {
                    code: 'en',
                    name:'English',
                    description:'Commas separate thousands; dot for decimal point.',
                },
                {
                    code: 'si-en',
                    name:'SI (English)',
                    description:'Spaces separate thousands; dot for decimal point.',
                },
                {
                    code: 'si-fr',
                    name:'SI (French)',
                    description:'Spaces separate thousands; comma for decimal point.',
                },
                {
                    code: 'eu',
                    name: 'Continental',
                    description:'Dots separate thousands; comma for decimal point.',
                },
                {
                    code: 'plain-eu',
                    name:'Continental (Plain)',
                    description:'No thousands separator; comma for decimal point.',
                },
                {
                    code: 'ch',
                    name:'Swiss',
                    description:'Apostrophes separate thousands; dot for decimal point.',
                },
                {
                    code: 'in',
                    name:'Indian',
                    description:'Commas separate groups; rightmost group is 3 digits, other groups 2 digits; dot for decimal point.',
                }
            ];

            model.allowedNotationStyles = ko.observableArray(model.notationStyles.filter(function(s){return ['plain','en','si-en'].contains(s.code)}));

            model.correctAnswerStyle = ko.observable(model.allowedNotationStyles()[0] || model.notationStyles[0]);

            model.precisionType = ko.observable(model.precisionTypes[0]);
            model.precisionWord = ko.computed(function() {
                switch(this.precisionType().name) {
                case 'dp':
                    return 'Digits';
                case 'sigfig':
                    return 'Significant figures';
                }
            },model);

            model.fractionPossible = ko.computed(function() {
                return !(['dp','sigfig'].contains(this.precisionType().name));
            },model);

            return model;
        },

        toJSON: function(data) {
            data.minValue = this.minValue();
            data.maxValue = this.maxValue();
            data.correctAnswerFraction = this.fractionPossible() && this.allowFractions() && this.correctAnswerFraction();
            data.allowFractions = this.fractionPossible() && this.allowFractions();
            data.mustBeReduced = this.fractionPossible() && this.allowFractions() && this.mustBeReduced();
            data.mustBeReducedPC = this.mustBeReducedPC();
            if(this.precisionType().name!='none') {
                data.precisionType = this.precisionType().name;
                data.precision = this.precision();
                data.precisionPartialCredit = this.precisionPartialCredit();
                data.precisionMessage = this.precisionMessage();
                data.strictPrecision = this.strictPrecision();
                data.showPrecisionHint = this.showPrecisionHint();
            }
            data.notationStyles = this.allowedNotationStyles().map(function(s){return s.code});
            if(this.correctAnswerStyle()) {
                data.correctAnswerStyle = this.correctAnswerStyle().code;
            }
        },
        load: function(data) {
            tryLoad(data,['minValue','maxValue','correctAnswerFraction','allowFractions','mustBeReduced','mustBeReducedPC','precision','precisionPartialCredit','precisionMessage','precisionType','strictPrecision','showPrecisionHint'],this);
            if('answer' in data) {
                this.minValue(data.answer);
                this.maxValue(data.answer);
            }
            for(var i=0;i<this.precisionTypes.length;i++) {
                if(this.precisionTypes[i].name == this.precisionType())
                    this.precisionType(this.precisionTypes[i]);
            }
            if('notationStyles' in data) {
                this.allowedNotationStyles(this.notationStyles.filter(function(s) {
                    return data.notationStyles.contains(s.code);
                }));
            }
            if('correctAnswerStyle' in data) {
                var style = this.notationStyles.filter(function(s){return s.code==data.correctAnswerStyle})[0];
                if(style) {
                    this.correctAnswerStyle(style);
                }
            }
        }
    },
    {
        name: 'matrix',
        niceName: 'Matrix entry',
        has_marks: true,
        tabs: [],
        widget: 'matrix',

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

            model.fractionPossible = ko.computed(function() {
                return !(['dp','sigfig'].contains(this.precisionType().name));
            },model);

            return model;
        },

        toJSON: function(data) {
            data.correctAnswer = this.correctAnswer();
            data.correctAnswerFractions = this.fractionPossible() && this.correctAnswerFractions();
            data.numRows = this.numRows();
            data.numColumns = this.numColumns();
            data.allowResize = this.allowResize();
            data.tolerance = this.tolerance();
            data.markPerCell = this.markPerCell();
            data.allowFractions = this.fractionPossible() && this.allowFractions();

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
        widget: 'string',

        model: function() {
            var model = {
                answer: ko.observable(''),
                displayAnswer: Editor.contentObservable(''),
                caseSensitive: ko.observable(false),
                partialCredit: ko.observable(0),
                matchModes: [
                    {name: 'regex', niceName: 'Regular expression'},
                    {name: 'exact', niceName: 'Exact match'}
                ]
            }
            model.matchMode = ko.observable(model.matchModes[0]);
            return model;
        },

        toJSON: function(data) {
            data.answer = this.answer();
            data.displayAnswer = this.displayAnswer();
            if(this.caseSensitive())
            {
                data.caseSensitive = this.caseSensitive();
                data.partialCredit = this.partialCredit();
            }
            data.matchMode = this.matchMode().name;
        },
        load: function(data) {
            tryLoad(data,['answer','displayAnswer','caseSensitive','partialCredit','matchMode'],this);
            for(var i=0;i<this.matchModes.length;i++) {
                if(this.matchModes[i].name == this.matchMode())
                    this.matchMode(this.matchModes[i]);
            }
        }
    },
    {
        name:'1_n_2', 
        niceName: 'Choose one from a list',
        tabs: [
            new Editor.Tab('choices','Choices','list',true,true),
            new Editor.Tab('marking-settings','Marking settings','pencil',true,true),
            new Editor.Tab('marking-algorithm','Marking algorithm','ok'),
        ],
        widget: 'radios',

        model: function(part) {
            var model = {
                minMarks: ko.observable(0),
                maxMarks: ko.observable(0),
                shuffleChoices: ko.observable(false),
                displayColumns: ko.observable(0),
                customMatrix: ko.observable(''),
                displayType:ko.observable(''),
                customChoices: ko.observable(false),
                customChoicesExpression: ko.observable(''),
                displayTypes: [
                    {name: 'radiogroup', niceName: 'Radio buttons'},
                    {name: 'dropdownlist', niceName: 'Drop down list'}
                ],
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
            data.displayType = this.displayType().name;
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

                data.distractors = distractors;
            }
        },
        load: function(data) {
            tryLoad(data,['minMarks','maxMarks','shuffleChoices','displayColumns'],this);
            if(typeof data.matrix == 'string') {
                this.customMarking(true);
                this.customMatrix(data.matrix);
            }
            for(var i=0;i<this.displayTypes.length;i++) {
                if(this.displayTypes[i].name==data.displayType) {
                    this.displayType(this.displayTypes[i]);
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
        name:'m_n_2', 
        niceName: 'Choose several from a list',
        tabs: [
            new Editor.Tab('choices','Choices','list',true,true),
            new Editor.Tab('marking-settings','Marking settings','pencil',true,true),
            new Editor.Tab('marking-algorithm','Marking algorithm','ok')
        ],
        widget: 'checkboxes',

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

                data.distractors = distractors;
            }
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
            new Editor.Tab('choices','Choices','list',true,true),
            new Editor.Tab('answers','Answers','list',true,true),
            new Editor.Tab('matrix','Marking matrix','th',true,true),
            new Editor.Tab('marking-settings','Marking options','pencil',true,true),
            new Editor.Tab('marking-algorithm','Marking algorithm','ok')
        ],
        widget: 'm_n_x',

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

            model.showMarkingMatrix = ko.computed(function() {
                var hasChoices = model.customChoices() || model.choices().length;
                var hasAnswers = model.customAnswers() || model.answers().length;
                return hasChoices && hasAnswers && !model.customMarking();
            },this);

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

function CustomPartType(data) {
    this.name = data.short_name;
    this.niceName = data.name;
    this.description = data.description;
    this.widget = data.input_widget;
    this.has_marks = true;
    this.tabs = [];
    this.can_be_gap = data.can_be_gap;
    this.can_be_step = data.can_be_step;
    this.marking_script = data.marking_script;
    this.source = data.source;
    this.make_settings(data.settings);
}
CustomPartType.prototype = {
    is_custom_part_type: true,

    make_settings: function(settings_def) {
        var pt = this;
        this.settings = settings_def.map(function(d) {
            var value = $.isArray(d.default_value) ? ko.observableArray(d.default_value) : ko.observable(d.default_value);
            return {
                name: d.name,
                value: value,
                label: d.label,
                input_type: d.input_type,
                hint: d.hint,
                data: d
            }
        });

    },
    model: function() {
        var pt = this;
        var model = {settings: this.settings};
        return model;
    },
    toJSON: function(data) {
        this.settings.forEach(function(s) {
            data[s.name] = s.value();
        });
        return data;
    },
    load: function(data) {
        this.settings.forEach(function(s) {
            tryLoad(data,s.name,s,'value');
        });
    }
}

item_json.custom_part_types.forEach(function(data) {
    part_types.models.push(new CustomPartType(data));
});

ko.components.register('answer-widget', {
    viewModel: function(params) {
        this.answerJSON = params.answer;
        this.part = params.part;
        this.widget = params.widget;
    },
    template: '\
    <span data-bind="component: {name: \'answer-widget-\'+widget, params: {answerJSON: answerJSON, part: part}}"></span>\
    '
});

ko.components.register('answer-widget-string', {
    viewModel: function(params) {
        this.answerJSON = params.answerJSON;
        this.input = ko.observable(ko.unwrap(this.answerJSON() || ''));
        ko.computed(function() {
            this.answerJSON(this.input());
        },this);
    },
    template: '\
        <input class="form-control" type="text" data-bind="textInput: input">\
    '
});

ko.components.register('answer-widget-number', {
    viewModel: function(params) {
        this.answerJSON = params.answerJSON;
        this.input = ko.observable(ko.unwrap(this.answerJSON() || ''));
        ko.computed(function() {
            this.answerJSON(this.input());
        },this);
    },
    template: '\
        <input class="form-control" type="text" data-bind="textInput: input">\
    '
});

ko.components.register('answer-widget-jme', {
    viewModel: function(params) {
        this.answerJSON = params.answerJSON;
        this.input = ko.observable(ko.unwrap(this.answerJSON() || ''));
        ko.computed(function() {
            this.answerJSON(this.input());
        },this);
    },
    template: '\
        <input class="form-control" type="text" data-bind="textInput: input, autosize: {max: 500, min: 30, padding: 10, value: input}">\
        <span class="preview" data-bind="JME: input"></span>\
    '
});

ko.components.register('answer-widget-gapfill', {
    viewModel: function(params) {
        this.answerJSON = params.answerJSON;
        var part = params.part;
        this.gaps = ko.computed(function() {
            return part.gaps().map(function(gap) {
                return {answerJSON: ko.observable(), part: gap};
            });
        },this)
        ko.computed(function() {
            this.answerJSON(this.gaps().map(function(g){return g.answerJSON()}));
        },this);
    },
    template: '\
        <table class="table">\
            <tbody data-bind="foreach: gaps">\
                <tr>\
                    <th><span data-bind="text: part.header"></span></th>\
                    <td><div data-bind="component: {name: \'answer-widget\', params: {answer: answerJSON, widget: part.type().widget, part: part}}"></div></td>\
                </tr>\
            </tbody>\
        </table>\
    '
});

ko.components.register('answer-widget-matrix', {
    viewModel: function(params) {
        this.answerJSON = params.answerJSON;
        this.input = ko.observable([]);
        ko.computed(function() {
            var value = this.input();
            var numRows = value.length;
            var numColumns = numRows>0 ? value[0].length : 0;
            this.answerJSON({rows: numRows, columns: numColumns, matrix: value});
        },this);
    },
    template: '\
        <matrix-input params="value: input, allowResize: true"></matrix-input>\
    '
});

ko.components.register('matrix-input',{
    viewModel: function(params) {
        this.allowResize = params.allowResize ? params.allowResize : ko.observable(false);
        if(typeof params.rows=='function') {
            this.numRows = params.rows;
        } else {
            this.numRows = ko.observable(params.rows || 2);
        }
        if(typeof params.columns=='function') {
            this.numColumns = params.columns;
        } else {
            this.numColumns = ko.observable(params.columns || 2);
        }

        var v = params.value();
        this.numRows(v.length || 1);
        this.numColumns(v.length ? v[0].length : 1);
        this.value = ko.observableArray(v.map(function(r){return ko.observableArray(r.map(function(c){return {cell:ko.observable(c)}}))}));

        this.disable = params.disable || false;

        this.keydown = function(obj,e) {
            this.oldPos = e.target.selectionStart;
            return true;
        }


        this.moveArrow = function(obj,e) {
            var cell = $(e.target).parent('td');
            var selectionStart = e.target.selectionStart;
            switch(e.which) {
            case 39:
                if(e.target.selectionStart == this.oldPos && e.target.selectionStart==e.target.selectionEnd && e.target.selectionEnd==e.target.value.length) {
                    cell.next().find('input').focus();
                }
                break;
            case 37:
                if(e.target.selectionStart == this.oldPos && e.target.selectionStart==e.target.selectionEnd && e.target.selectionEnd==0) {
                    cell.prev().find('input').focus();
                }
                break;
            case 38:
                var e = cell.parents('tr').prev().children().eq(cell.index()).find('input');
                if(e.length) {
                    e.focus();
                    e[0].setSelectionRange(this.oldPos,this.oldPos);
                }
                break;
            case 40:
                var e = cell.parents('tr').next().children().eq(cell.index()).find('input');
                if(e.length) {
                    e.focus();
                    e[0].setSelectionRange(this.oldPos,this.oldPos);
                }
                break;
            }
            return false;
        }
        
        this.update = function() {
            // update value when number of rows or columns changes
            var numRows = parseInt(this.numRows());
            var numColumns = parseInt(this.numColumns());
            var value = this.value();
            if(numRows==value.length && (numRows==0 || numColumns==value[0]().length)) {
                return;
            }
            value.splice(numRows,value.length-numRows);
            for(var i=0;i<numRows;i++) {
                var row;
                if(value.length<=i) {
                    row = [];
                    value.push(ko.observableArray(row));
                } else {
                    row = value[i]();
                }
                row.splice(numColumns,row.length-numColumns);
                
                for(var j=0;j<numColumns;j++) {
                    var cell;
                    if(row.length<=j) {
                        cell = ko.observable('');
                        row.push({cell:cell});
                    } else {
                        cell = row[j];
                    }
                }
                value[i](row);
            }
            this.value(value);
        }

        ko.computed(this.update,this);
        
        var firstGo = true;
        //update value with model
        ko.computed(function() {
            var v = this.value().map(function(row,i){
                return row().map(function(cell,j){return cell.cell()})
            })
            if(firstGo) {
                firstGo = false;
                return;
            }
            params.value(v);
        },this)
    },
    template: 
     '<div class="matrix-input">'
    +'	<!-- ko if: allowResize --><div class="matrix-size">'
    +'		<label class="num-rows">Rows: <input type="number" min="1" data-bind="value: numRows, autosize: true, disable: disable"/></label>'
    +'		<label class="num-columns">Columns: <input type="number" min="1" data-bind="value: numColumns, autosize: true, disable: disable"/></label>'
    +'	</div><!-- /ko -->'
    +'	<div class="matrix-wrapper">'
    +'		<span class="left-bracket"></span>'
    +'		<table class="matrix">'
    +'			<tbody data-bind="foreach: value">'
    +'				<tr data-bind="foreach: $data">'
    +'					<td class="cell"><input type="text" data-bind="textInput: cell, autosize: true, disable: $parents[1].disable, event: {keydown: $parents[1].keydown, keyup: $parents[1].moveArrow}"></td>'
    +'				</tr>'
    +'			</tbody>'
    +'		</table>'
    +'		<span class="right-bracket"></span>'
    +'	</div>'
    +'</div>'
    }
)

ko.components.register('answer-widget-multipleresponse', {
    viewModel: function(params) {
        this.answerJSON = params.answerJSON;
        this.input = ko.observable(ko.unwrap(this.answerJSON() || ''));
        ko.computed(function() {
            this.answerJSON(this.input());
        },this);
    },
    template: '\
        <input class="form-control" type="text" data-bind="textInput: input">\
    '
});

ko.components.register('answer-widget-radios', {
    viewModel: function(params) {
        this.part = params.part;
        this.choices = ko.computed(function() {
            try {
                return this.part.type().model.choices().map(function(c){return c.content()});
            } catch(e) {
                return [];
            }
        },this);
        this.choice = ko.observable(0);
        this.answerJSON = params.answerJSON;
        ko.computed(function() {
            var choice = this.choice();
            this.answerJSON(this.choices().map(function(c,i){return [i==choice]}));
        },this);
    },
    template: '\
        <form>\
        <ul data-bind="foreach: choices">\
            <li><label><input type="radio" name="choice" data-bind="checkedValue: $index, checked: $parent.choice"> <span data-bind="html: $data"></span></label></li>\
        </ul>\
    '
});

ko.components.register('answer-widget-checkboxes', {
    viewModel: function(params) {
        this.part = params.part;
        this.choices = ko.computed(function() {
            try {
                return this.part.type().model.choices().map(function(c){
                    return {
                        content: c.content(),
                        ticked: ko.observable(false)
                    }
                });
            } catch(e) {
                return [];
            }
        },this);
        this.choice = ko.observable(0);
        this.answerJSON = params.answerJSON;
        ko.computed(function() {
            this.answerJSON(this.choices().map(function(c){return [c.ticked()]}));
        },this);
    },
    template: '\
        <form>\
        <ul data-bind="foreach: choices">\
            <li><label><input type="checkbox" name="choice" data-bind="checked: ticked"> <span data-bind="html: content"></span></label></li>\
        </ul>\
    '
});

ko.components.register('answer-widget-m_n_x', {
    viewModel: function(params) {
        this.part = params.part;
        this.answerJSON = params.answerJSON;
        this.choices = ko.computed(function() {
            try {
                return this.part.type().model.choices().map(function(c){return c.content()});
            } catch(e) {
                return [];
            }
        },this);
        this.answers = ko.computed(function() {
            try {
                return this.part.type().model.answers().map(function(c){return c.content()});
            } catch(e) {
                return [];
            }
        },this);
        this.ticks = ko.computed(function() {
            var choices = this.choices();
            var answers = this.answers();
            var ticks = [];
            for(var i=0;i<choices.length;i++) {
                var row = [];
                for(var j=0;j<answers.length;j++) {
                    row.push({ticked: ko.observable(false)});
                }
                ticks.push(row);
            }
            return ticks;
        },this);

        ko.computed(function() {
            var ticks = this.ticks().map(function(r){return r.map(function(d){return d.ticked()})});

            // because of the never-ending madness to do with the order of matrices in multiple choice parts,
            // this matrix needs to be transposed
            // It makes more sense for the array to go [choice][answer], because that's how they're displayed, but 
            // changing that would mean breaking old questions.
            var numAnswers = this.answers().length;
            var numChoices = this.choices().length;
            var oticks = [];
            for(var i=0;i<numAnswers;i++) {
                var row = [];
                oticks.push(row);
                for(var j=0;j<numChoices;j++) {
                    row.push(ticks[j][i]);
                }
            }
            this.answerJSON(oticks);
        },this);
    },
    template: '\
        <form>\
            <table>\
            <thead>\
            <tr>\
                <td></td>\
                <!-- ko foreach: answers -->\
                <th><span data-bind="html: $data"></span></th>\
                <!-- /ko -->\
            </tr>\
            <tbody data-bind="foreach: ticks">\
                <tr>\
                    <th><span data-bind="html: $parent.choices()[$index()]"></span></th>\
                    <!-- ko foreach: $data -->\
                    <td><input type="checkbox" data-bind="checked: ticked"></td>\
                    <!-- /ko -->\
                </tr>\
            </tbody>\
            </table>\
        </form>\
    '
});

});

