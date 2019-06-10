$(document).ready(function() {
var part_types = Editor.part_types = {};
var tryGetAttribute = Editor.tryGetAttribute;

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
        has_marking_settings: true,
        can_be_gap: false,
        can_be_step: false,
        widget: '',

        model: function(part) {
            var model = {
                all_gaps_same_type: ko.computed(function() {
                    var gaps = part.gaps();
                    if(gaps.length==0) {
                        return true;
                    }
                    var type = gaps[0].type().name;
                    return gaps.every(function(g) { return g.type().name==type; });
                }),
                sortAnswers: ko.observable(false)
            };
            return model;
        },

        toJSON: function(data,part) {
            if(part.gaps().length)
            {
                data.gaps = part.gaps().map(function(g) {
                    return g.toJSON();
                });
            }
            data.sortAnswers = this.sortAnswers();
        },
        load: function(data,part) {
            if(data.gaps)
            {
                data.gaps.map(function(g) {
                    part.gaps.push(new Editor.question.Part(part.q,part,part.gaps,g));
                });
            }
            tryLoad(data,['sortAnswers'],this);
        }
    },
    {
        name:'jme', 
        niceName: 'Mathematical expression', 
        has_marks: true, 
        has_marking_settings: true,
        tabs: [
            new Editor.Tab('restrictions','Restrictions','text-background'),
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
                mustmatchpattern: {
                    pattern: ko.observable(''),
                    partialCredit: ko.observable(0),
                    message: ko.observable(''),
                    nameToCompare: ko.observable('')
                },
                checkVariableNames: ko.observable(false)
            };
            model.checkingType = ko.observable(model.checkingTypes[0]);

            model.answerIsEquation = ko.computed(function() {
                try {
                    var answer = Numbas.jme.compile(this.answer());
                    return Numbas.jme.isOp(answer.tok,'=');
                } catch(e) {
                    return false;
                }
            }, model);

            model.variableNames = ko.computed(function() {
                try {
                    var correctAnswer = Numbas.jme.subvars(this.answer(),part.q.questionScope());
                    var answer = Numbas.jme.compile(correctAnswer);
                    var names = Numbas.jme.findvars(answer);
                    return names.sort();
                } catch(e) {
                    return [];
                }
            },model);

            var valueGenerators = {};
            var valueGeneratorFactory = ko.computed(function() {
                this.variableNames().forEach(function(name) {
                    if(!valueGenerators[name]) {
                        valueGenerators[name] = ko.observable('');
                    }
                });
            },model);

            model.valueGenerators = ko.computed(function() {
                valueGeneratorFactory();
                var inferredTypes;
                try {
                    inferredTypes = Numbas.jme.inferVariableTypes(Numbas.jme.compile(model.answer()),Numbas.jme.builtinScope)[0] || {};
                } catch(e) {
                    inferredTypes = {};
                }
                return this.variableNames().map(function(n) {
                    return {name: n, value: valueGenerators[n], inferredType: inferredTypes[n]};
                });
            },model);

            model.mustmatchpattern.capturedNames = ko.computed(function() {
                var pattern = this.mustmatchpattern.pattern();
                try {
                    var expr = Numbas.jme.rules.patternParser.compile(pattern);
                } catch(e) {
                    return [];
                }
                if(!expr) {
                    return [];
                }
                return Numbas.jme.rules.findCapturedNames(expr);
            },model);

            model.mustmatchpattern.capturedNameOptions = ko.computed(function() {
                var l = model.mustmatchpattern.capturedNames().map(function(n) {return {name: n, label: n}});
                l.splice(0,0,{name:'',label:'Whole expression'});
                return l;
            },model);

            model.markingSettings = ko.computed(function() {
                try {
                    var correctAnswer = Numbas.jme.subvars(model.answer(),part.q.questionScope());
                } catch(e) {
                    correctAnswer = '';
                }
                return {
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
                    mustmatchpattern: model.mustmatchpattern.pattern(),
                    mustMatchPC: model.mustmatchpattern.partialCredit(),
                    mustMatchMessage: model.mustmatchpattern.message(),
                    matchNameToCompare: model.mustmatchpattern.nameToCompare(),
                    valueGenerators: model.valueGenerators().map(function(d) {
                        return {name: d.name, value: d.value()}
                    })
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
            if(this.mustmatchpattern.pattern().trim()) {
                data.mustmatchpattern = {
                    pattern: this.mustmatchpattern.pattern(),
                    partialCredit: this.mustmatchpattern.partialCredit(),
                    message: this.mustmatchpattern.message(),
                    nameToCompare: this.mustmatchpattern.nameToCompare()
                }
            }
            data.valuegenerators = this.valueGenerators().map(function(d) {
                return {name: d.name, value: d.value()};
            });
        },
        load: function(data) {
            tryLoad(data,['answer','answerSimplification','checkVariableNames','showPreview'],this);
            var checkingType = tryGetAttribute(data,'checkingType');
            for(var i=0;i<this.checkingTypes.length;i++) {
                if(this.checkingTypes[i].name == checkingType)
                    this.checkingType(this.checkingTypes[i]);
            }
            tryLoad(data,'checkingaccuracy',this.checkingType(),'accuracy');
            tryLoad(data,'vsetrangepoints',this.vset,'points');
            var vsetrange = tryGetAttribute(data,'vSetRange');
            if(vsetrange) {
                this.vset.start(vsetrange[0]);
                this.vset.end(vsetrange[1]);
            }

            tryLoad(tryGetAttribute(data,'maxLength'),['length','partialCredit','message'],this.maxlength);
            tryLoad(tryGetAttribute(data,'minLength'),['length','partialCredit','message'],this.minlength);
            tryLoad(tryGetAttribute(data,'mustHave'),['strings','showStrings','partialCredit','message'],this.musthave);
            tryLoad(tryGetAttribute(data,'notAllowed'),['strings','showStrings','partialCredt','message'],this.notallowed);
            tryLoad(tryGetAttribute(data,'mustMatchPattern'),['pattern','partialCredt','message','nameToCompare'],this.mustmatchpattern);
            
            var valueGenerators = tryGetAttribute(data,'valueGenerators');
            if(valueGenerators) {
                var d = {};
                valueGenerators.forEach(function(def) {
                    d[def.name] = def.value;
                });
                this.valueGenerators().forEach(function(g) {
                    g.value(d[g.name] || '');
                });
            }
        }
    },
    {
        name:'numberentry', 
        niceName: 'Number entry', 
        has_marks: true,
        has_marking_settings: true,
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
                showFractionHint: ko.observable(true),
                mustBeReduced: ko.observable(false),
                mustBeReducedPC: ko.observable(0)
            };

            model.notationStyles = Editor.numberNotationStyles;

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
            } else {
                data.showFractionHint = this.showFractionHint();
            }
            data.notationStyles = this.allowedNotationStyles().map(function(s){return s.code});
            if(this.correctAnswerStyle()) {
                data.correctAnswerStyle = this.correctAnswerStyle().code;
            }
        },
        load: function(data) {
            tryLoad(data,['minValue','maxValue','correctAnswerFraction','allowFractions','mustBeReduced','mustBeReducedPC','precision','precisionPartialCredit','precisionMessage','precisionType','strictPrecision','showPrecisionHint','showFractionHint'],this);
            if('answer' in data) {
                this.minValue(data.answer);
                this.maxValue(data.answer);
            }
            for(var i=0;i<this.precisionTypes.length;i++) {
                if(this.precisionTypes[i].name == this.precisionType())
                    this.precisionType(this.precisionTypes[i]);
            }
            var notationStyles = tryGetAttribute(data,'notationStyles');
            if(notationStyles) {
                this.allowedNotationStyles(this.notationStyles.filter(function(s) {
                    return notationStyles.contains(s.code);
                }));
            }
            var correctAnswerStyle = tryGetAttribute(data,'correctAnswerStyle');
            if(correctAnswerStyle) {
                var style = this.notationStyles.filter(function(s){return s.code==correctAnswerStyle})[0];
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
        has_marking_settings: true,
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
        has_marking_settings: true,
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
        has_marks: true,
        niceName: 'Choose one from a list',
        tabs: [
            new Editor.Tab('choices','Choices','list',true,true),
            new Editor.Tab('marking-settings','Marking settings','pencil',true,true),
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
                showCellAnswerState: ko.observable(true),
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
            data.showCellAnswerState = this.showCellAnswerState();

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
            tryLoad(data,['minMarks','maxMarks','shuffleChoices','displayColumns','showCellAnswerState'],this);
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
        has_marks: true,
        niceName: 'Choose several from a list',
        tabs: [
            new Editor.Tab('choices','Choices','list',true,true),
            new Editor.Tab('marking-settings','Marking settings','pencil',true,true),
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
                showCellAnswerState: ko.observable(true),

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
            data.showCellAnswerState = this.showCellAnswerState();

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
            tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','displayColumns','showCellAnswerState'],this);
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
        has_marks: true,
        niceName: 'Match choices with answers',
        tabs: [
            new Editor.Tab('choices','Choices','list',true,true),
            new Editor.Tab('answers','Answers','list',true,true),
            new Editor.Tab('matrix','Marking matrix','th',true,true),
            new Editor.Tab('marking-settings','Marking options','pencil',true,true),
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
                showCellAnswerState: ko.observable(true),

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
            data.showCellAnswerState = this.showCellAnswerState();

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
            tryLoad(data,['minMarks','maxMarks','minAnswers','maxAnswers','shuffleChoices','shuffleAnswers','showCellAnswerState'],this);
            var warningType = tryGetAttribute(data,'warningType');
            for(var i=0;i<this.warningTypes.length;i++)
            {
                if(this.warningTypes[i].name==warningType) {
                    this.warningType(this.warningTypes[i]);
                }
            }
            var displayType = tryGetAttribute(data,'displayType');
            for(var i=0;i<this.displayTypes.length;i++)
            {
                if(this.displayTypes[i].name==displayType) {
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

Numbas.custom_part_types = {};

function CustomPartType(data) {
    this.name = data.short_name;
    this.niceName = data.name;
    this.help_url = data.source.edit_page;
    this.description = data.description;
    this.widget = data.input_widget;
    this.has_marks = true;
    this.tabs = [];
    this.can_be_gap = data.can_be_gap;
    this.can_be_step = data.can_be_step;
    this.has_marking_settings = true;
    this.settings_def = data.settings;
    this.marking_script = data.marking_script;
    this.source = data.source;
    this.required_extensions = data.extensions || [];
    Numbas.partConstructors[this.name] = Numbas.parts.CustomPart;
    Numbas.custom_part_types[this.name] = data;

    var element = document.createElement('div');
    this.search_text = [this.niceName, this.name, this.source.author.name, this.description].join(' ').toLowerCase();
}
CustomPartType.prototype = {
    is_custom_part_type: true,

    make_settings: function() {
        var pt = this;
        return this.settings_def.map(function(d) {
            var value;
            switch(d.input_type) {
            case 'choose_several':
                value = ko.observableArray(d.choices.filter(function(c){return c.default_value}).map(function(c){return c.value}));
                break;
            default:
                var value = $.isArray(d.default_value) ? ko.observableArray(d.default_value) : ko.observable(d.default_value);
            }
            return {
                name: d.name,
                value: value,
                label: d.label,
                input_type: d.input_type,
                help_url: d.help_url,
                hint: d.hint,
                data: d
            }
        });

    },
    model: function() {
        var pt = this;
        var model = {settings: this.make_settings()};
        return model;
    },
    toJSON: function(data) {
        data.settings = {};
        this.settings.forEach(function(s) {
            data.settings[s.name] = s.value();
        });
        return data;
    },
    load: function(data) {
        this.settings.forEach(function(s) {
            tryLoad(data.settings,s.name,s,'value');
        });
    }
}

item_json.custom_part_types.forEach(function(data) {
    part_types.models.push(new CustomPartType(data));
});

});

