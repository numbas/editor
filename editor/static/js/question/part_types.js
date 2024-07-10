$(document).ready(function() {
var part_types = Editor.part_types = {};
var tryGetAttribute = Editor.tryGetAttribute;

var HELP_URL = item_json.helpURL;

part_types.models = [
    {
        name: 'information', 
        niceName: 'Information only',
        description: 'An information part contains only a prompt and no answer input. It is most often used as a Step to provide a hint for a parent part.',
        help_url: HELP_URL + 'question/parts/information.html',
        can_be_gap: false
    },
    {
        name: 'extension', 
        niceName: 'Extension',
        description: 'An extension part acts as a placeholder for any interactive element added by an extension, or custom code in the question, which awards marks to the student.',
        help_url: HELP_URL + 'question/parts/extension.html',
        has_marks: true,
        has_marking_settings: true
    },
    {
        name: 'gapfill', 
        niceName: 'Gap-fill', 
        description: 'Gap-fill parts allow you to include answer inputs inline with the prompt text, instead of at the end of the part.',
        help_url: HELP_URL + 'question/parts/gapfill.html',
        has_marks: true,
        has_marking_settings: true,
        has_feedback_icon: true,
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
                    part.gaps.push(new Editor.question.Part('gap',part.q,part,part.gaps,g));
                });
            }
            tryLoad(data,['sortAnswers'],this);
        }
    },
    {
        name:'jme', 
        niceName: 'Mathematical expression', 
        description: 'Ask the student to enter an algebraic expression, using JME syntax.',
        help_url: HELP_URL + 'question/parts/mathematical-expression.html',
        has_marks: true, 
        has_feedback_icon: true,
        has_correct_answer: true,
        has_marking_settings: true,
        tabs: function(part,model) {
            var restrictions_tab_in_use = ko.computed(function() {
                return model.mustmatchpattern.pattern()!='' || model.maxlength.length()!=0 || model.minlength.length()!=0 || model.musthave.strings().length>0 || model.notallowed.strings().length>0;
            });
            var accuracy_tab_in_use = ko.computed(function() {
                return model.valueGenerators().some(function(v){ return v.value()!=''; });
            });
            return [
                new Editor.Tab('restrictions','Restrictions','text-background',{in_use: restrictions_tab_in_use}),
                new Editor.Tab('checking-accuracy','Accuracy','scale',{in_use: accuracy_tab_in_use})
            ];
        },
        widget: 'jme',

        model: function(part) {
            var jme = Numbas.jme;

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
                    nameToCompare: ko.observable(''),
                    warningTime: Editor.optionObservable([
                        {name: 'submission', niceName: 'After submitting'},
                        {name: 'input', niceName: 'While entering their answer'},
                        {name: 'prevent', niceName: 'Prevent submission'},
                    ])
                },
                checkVariableNames: ko.observable(false),
                singleLetterVariables: ko.observable(false),
                allowUnknownFunctions: ko.observable(true),
                implicitFunctionComposition: ko.observable(false),
                caseSensitive: ko.observable(false)
            };
            model.checkingType = ko.observable(model.checkingTypes[0]);
            model.part = part;

            model.scope = ko.computed(function() {
                return new Numbas.jme.Scope([part.scope(),{caseSensitive: this.caseSensitive()}]);
            },model);

            model.displayAnswer = ko.computed(function() {
                try {
                    var scope = new Numbas.jme.Scope([this.scope()]);
                    scope.functions['subvar'] = {};
                    var tree = jme.compile(Editor.wrap_subvar(this.answer()));
                    tree = scope.expandJuxtapositions(tree, {
                        singleLetterVariables: this.singleLetterVariables(),
                        noUnknownFunctions: !this.allowUnknownFunctions(),
                        implicitFunctionComposition: this.implicitFunctionComposition()
                    });
                    return jme.display.treeToJME(tree);
                } catch(e) {
                    return this.answer();
                }
            },model);

            model.answerIsEquation = ko.computed(function() {
                try {
                    var answer = jme.compile(this.answer());
                    return jme.isOp(answer.tok,'=');
                } catch(e) {
                    return false;
                }
            }, model);

            model.variableNames = ko.computed(function() {
                try {
                    var scope = this.scope();
                    var bits = Numbas.util.splitbrackets(this.answer(),'{','}','(',')');
                    for(var i=1;i<bits.length;i+=2) {
                        bits[i] = '1';
                    }
                    var correctAnswer = bits.join('');
                    var answer = jme.compile(correctAnswer);
                    var names = jme.findvars(answer,[],scope);
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
                    inferredTypes = jme.inferVariableTypes(jme.compile(model.answer()),jme.builtinScope)[0] || {};
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
                    var expr = jme.rules.patternParser.compile(pattern);
                } catch(e) {
                    return [];
                }
                if(!expr) {
                    return [];
                }
                return jme.rules.findCapturedNames(expr);
            },model);

            model.mustmatchpattern.capturedNameOptions = ko.computed(function() {
                var l = model.mustmatchpattern.capturedNames().map(function(n) {return {name: n, label: n}});
                l.splice(0,0,{name:'',label:'Whole expression'});
                return l;
            },model);

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
            data.singleLetterVariables = this.singleLetterVariables();
            data.allowUnknownFunctions = this.allowUnknownFunctions();
            data.implicitFunctionComposition = this.implicitFunctionComposition();
            data.caseSensitive = this.caseSensitive();
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
                    nameToCompare: this.mustmatchpattern.nameToCompare(),
                    warningTime: this.mustmatchpattern.warningTime().name
                }
            }
            data.valuegenerators = this.valueGenerators().map(function(d) {
                return {name: d.name, value: d.value()};
            });
        },

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.answer, type: 'jme-sub', description: 'Correct answer'},
                {tab: 'restrictions', value: model.mustmatchpattern.pattern, type: 'jme-sub', description: "Pattern student's answer must match"},
                {tab: 'restrictions', value: model.mustmatchpattern.message, type: 'html', description: "Warning message for pattern restriction"},
            ]
            var ignored_variables = ko.pureComputed(function() {
                return model.variableNames().concat(['vrange']);
            });
            model.valueGenerators().forEach(function(vg) {
                o.push({tab:'checking-accuracy',value: vg.value,ignore:ignored_variables,type:'jme',description:'Value generator for variable '+vg.name});
            });
            return o;
        },

        load: function(data) {
            tryLoad(data,['answer','answerSimplification','checkVariableNames','singleLetterVariables','allowUnknownFunctions','implicitFunctionComposition','caseSensitive','showPreview','failureRate'],this);
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
            tryLoad(tryGetAttribute(data,'mustMatchPattern'),['pattern', 'partialCredit', 'message', 'nameToCompare', 'warningTime'],this.mustmatchpattern);
            
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
        description: 'Ask the student to enter a number.',
        help_url: HELP_URL + 'question/parts/numberentry.html',
        has_marks: true,
        has_feedback_icon: true,
        has_correct_answer: true,
        has_marking_settings: true,
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
                mustBeReducedPC: ko.observable(0),
                displayAnswer: ko.observable('')
            };

            model.notationStyles = Editor.numberNotationStyles;

            model.allowedNotationStyles = ko.observableArray(model.notationStyles.filter(function(s){return Numbas.locale.default_number_notation.contains(s.code)}));

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
            data.displayAnswer = this.displayAnswer();
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

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.minValue, type: 'jme', description: 'Minimum accepted value'},
                {tab: 'marking-settings', value: model.maxValue, type: 'jme', description: 'Maximum accepted value'},
                {tab: 'marking-settings', value: model.precision, type: 'jme', description: 'Required precision'},
                {tab: 'marking-settings', value: model.precisionMessage, type: 'html', description: model.precisionWord},
                {tab: 'marking-settings', value: model.displayAnswer, type: 'jme', description: 'Display answer'},
            ];
            return o;
        },

        load: function(data) {
            tryLoad(data,['minValue','maxValue','correctAnswerFraction','allowFractions','mustBeReduced','mustBeReducedPC','precision','precisionPartialCredit','precisionMessage','precisionType','strictPrecision','showPrecisionHint','showFractionHint','displayAnswer'],this);
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
        description: 'Ask the student to enter a matrix of numbers.',
        help_url: HELP_URL + 'question/parts/matrixentry.html',
        has_marks: true,
        has_feedback_icon: true,
        has_correct_answer: true,
        has_marking_settings: true,
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
                minColumns: ko.observable(1),
                maxColumns: ko.observable(0),
                minRows: ko.observable(1),
                maxRows: ko.observable(0),
                precisionTypes: [
                    {name: 'none', niceName: 'None'},
                    {name: 'dp', niceName: 'Decimal places'},
                    {name: 'sigfig', niceName: 'Significant figures'}
                ],
                precision: ko.observable(0),
                precisionPartialCredit: ko.observable(0),
                precisionMessage: ko.observable('You have not given your answer to the correct precision.'),
                strictPrecision: ko.observable(true),
                prefilledCells: ko.observable('')
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
            data.minColumns = this.minColumns();
            data.maxColumns = this.maxColumns();
            data.minRows = this.minRows();
            data.maxRows = this.maxRows();
            data.prefilledCells = this.prefilledCells();

            if(this.precisionType().name!='none') {
                data.precisionType = this.precisionType().name;
                data.precision = this.precision();
                data.precisionPartialCredit = this.precisionPartialCredit();
                data.precisionMessage = this.precisionMessage();
                data.strictPrecision = this.strictPrecision();
            }
        },

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.correctAnswer, type: 'jme', description: 'Correct answer'},
                {tab: 'marking-settings', value: model.numRows, type: 'jme', description: 'Number of rows'},
                {tab: 'marking-settings', value: model.numColumns, type: 'jme', description: 'Number of columns'},
                {tab: 'marking-settings', value: model.tolerance, type: 'jme', description: 'Margin of error allowed in each cell'},
                {tab: 'marking-settings', value: model.precision, type: 'jme', description: model.precisionWord},
            ];
            return o;
        },

        load: function(data) {
            tryLoad(data,[
                'correctAnswer',
                'correctAnswerFractions',
                'numRows',
                'numColumns',
                'allowResize',
                'tolerance',
                'markPerCell',
                'allowFractions',
                'precision',
                'precisionPartialCredit',
                'precisionMessage',
                'precisionType',
                'strictPrecision',
                'minColumns',
                'maxColumns',
                'minRows',
                'maxRows',
                'prefilledCells'
            ],this);
            for(var i=0;i<this.precisionTypes.length;i++) {
                if(this.precisionTypes[i].name == this.precisionType())
                    this.precisionType(this.precisionTypes[i]);
            }
        }
    },
    {
        name:'patternmatch', 
        niceName: 'Match text pattern', 
        description: 'Ask the student to enter short, non-mathematical text.',
        help_url: HELP_URL + 'question/parts/match-text-pattern.html',
        has_marks: true,
        has_feedback_icon: true,
        has_correct_answer: true,
        has_marking_settings: true,
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

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.answer, type: 'string', description: 'Answer pattern'},
                {tab: 'marking-settings', value: model.displayAnswer, type: 'string', description: 'Display answer'},
            ];
            return o;
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
        has_feedback_icon: true,
        has_correct_answer: true,
        niceName: 'Choose one from a list',
        description: 'The student must choose one of several options.',
        help_url: HELP_URL + 'question/parts/multiple-choice.html',
        tabs: function(parts,model) {
            return [
                new Editor.Tab('choices','Choices','list',{visible:true,more_important:true,in_use: ko.computed(function() { return model.choices().length>0; })}),
                new Editor.Tab('marking-settings','Marking settings','pencil',{visible:true,more_important:true}),
            ];
        },
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
                    content: Editor.contentObservable(''),
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

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.answer, type: 'string', description: 'Answer pattern'},
                {tab: 'marking-settings', value: model.customMatrix, type: 'jme', description: 'Custom matrix expression'},
                {tab: 'choices', value: model.customChoicesExpression, type: 'jme', description: 'List of choices'},
            ];
            model.choices().forEach(function(c) {
                o.push({tab: 'choices', value: c.content, type: 'html', description: 'Choice text'});
                o.push({tab: 'choices', value: c.distractor, type: 'html', description: 'Choice distractor message'});
                o.push({tab: 'choices', value: c.marks, type: 'jme', description: 'Choice marks'});
            });
            return o;
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
            if(data.choices!==undefined) {
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

        }
    },
    {
        name:'m_n_2', 
        has_marks: true,
        has_feedback_icon: true,
        has_correct_answer: true,
        niceName: 'Choose several from a list',
        description: 'The student can choose any of a list of options.',
        help_url: HELP_URL + 'question/parts/multiple-choice.html',
        tabs: function(part,model) {
            return [
                new Editor.Tab('choices','Choices','list',{visible:true,more_important:true,in_use: ko.computed(function() { return model.choices().length>0;})}),
                new Editor.Tab('marking-settings','Marking settings','pencil',{visible:true,more_important:true}),
            ];
        },
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
                markingMethod: ko.observable('positive'),
                markingMethods: [
                    {name: 'sum ticked cells', niceName: 'Sum ticked cells'},
                    {name: 'score per matched cell', niceName: 'Score per matched cell', needsMaxMarks: true},
                    {name: 'all-or-nothing', niceName: 'All-or-nothing', needsMaxMarks: true}
                ],

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
                    content: Editor.contentObservable(''),
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
            data.markingMethod = this.markingMethod().name;

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

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.minMarks, type: 'jme', description: 'Minimum marks'},
                {tab: 'marking-settings', value: model.maxMarks, type: 'jme', description: 'Maximum marks'},
                {tab: 'marking-settings', value: model.minAnswers, type: 'jme', description: 'Minimum answers'},
                {tab: 'marking-settings', value: model.maxAnswers, type: 'jme', description: 'Maximum answers'},
                {tab: 'marking-settings', value: model.customMatrix, type: 'jme', description: 'Custom matrix expression'},
                {tab: 'choices', value: model.customChoicesExpression, type: 'jme', description: 'List of choices'},
            ];
            model.choices().forEach(function(c) {
                o.push({tab: 'choices', value: c.content, type: 'html', description: 'Choice text'});
                o.push({tab: 'choices', value: c.distractor, type: 'html', description: 'Choice distractor message'});
                o.push({tab: 'choices', value: c.marks, type: 'jme', description: 'Choice marks'});
            });
            return o;
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

            if(data.markingMethod) {
                for(var i=0;i<this.markingMethods.length;i++)
                {
                    if(this.markingMethods[i].name==data.markingMethod) {
                        this.markingMethod(this.markingMethods[i]);
                    }
                }
            }
            if(data.choices!==undefined) {
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
        }
    },
    {
        name:'m_n_x', 
        has_marks: true,
        has_feedback_icon: true,
        has_correct_answer: true,
        niceName: 'Match choices with answers',
        description: 'The student is presented with a 2D grid of choices and answers. Depending on how the part is set up, they must either match up each choice with an answer, or select any number of choice-answer pairs.',
        help_url: HELP_URL + 'question/parts/multiple-choice.html',
        tabs: function(part,model) {
            return [
                new Editor.Tab('choices','Choices','list',{visible:true,more_important:true,in_use: ko.computed(function(){ return model.choices().length>0; })}),
                new Editor.Tab('answers','Answers','list',{visible:true,more_important:true,in_use: ko.computed(function(){ return model.answers().length>0; })}),
                new Editor.Tab('matrix','Marking matrix','th',{visible:true,more_important:true}),
                new Editor.Tab('marking-settings','Marking options','pencil',{visible:true,more_important:true}),
            ];
        },
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
                markingMethod: ko.observable('positive'),
                markingMethods: [
                    {name: 'sum ticked cells', niceName: 'Sum ticked cells'},
                    {name: 'score per matched cell', niceName: 'Score per matched cell', needsMaxMarks: true},
                    {name: 'all-or-nothing', niceName: 'All-or-nothing', needsMaxMarks: true}
                ],

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
                    {name: 'strictuppertriangle', niceName: 'Upper triangle (no diagonal)'},
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
                    content: Editor.contentObservable(''),
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
                    content: ko.observable('')
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
            data.markingMethod = this.markingMethod().name;

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

        variable_references: function(part,model) {
            var o = [
                {tab: 'marking-settings', value: model.minMarks, type: 'jme', description: 'Minimum marks'},
                {tab: 'marking-settings', value: model.maxMarks, type: 'jme', description: 'Maximum marks'},
                {tab: 'marking-settings', value: model.minAnswers, type: 'jme', description: 'Minimum answers'},
                {tab: 'marking-settings', value: model.maxAnswers, type: 'jme', description: 'Maximum answers'},
                {tab: 'marking-settings', value: model.customMatrix, type: 'jme', description: 'Custom matrix expression'},
                {tab: 'marking-settings', value: model.layoutExpression, type: 'jme', description: 'Custom layout expression'},
                {tab: 'choices', value: model.customChoicesExpression, type: 'jme', description: 'List of choices'},
            ];
            model.choices().forEach(function(c) {
                o.push({tab: 'choices', value: c.content, type: 'html', description: 'Choice text'});
                o.push({tab: 'choices', value: c.distractor, type: 'html', description: 'Choice distractor message'});
            });
            model.answers().forEach(function(a) {
                o.push({tab: 'choices', value: a.content, type: 'html', description: 'Answer text'});
            });
            return o;
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
            if(data.markingMethod) {
                for(var i=0;i<this.markingMethods.length;i++)
                {
                    if(this.markingMethods[i].name==data.markingMethod) {
                        this.markingMethod(this.markingMethods[i]);
                    }
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
    this.has_correct_answer = true;
    this.has_marking_settings = true,
    this.has_feedback_icon = true;
    this.can_be_gap = data.can_be_gap;
    this.can_be_step = data.can_be_step;
    this.settings_def = data.settings;
    this.marking_script = data.marking_script;
    this.source = data.source;
    this.required_extensions = data.extensions || [];
    Numbas.partConstructors[this.name] = Numbas.parts.CustomPart;
    Numbas.custom_part_types[this.name] = data;

    var element = document.createElement('div');
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
    variable_references: function(part,model) {
        var o = [];
        this.settings_def.forEach(function(def,i) {
            var s = model.settings[i];
            var value = s.value;
            var description = s.label;
            var type;
            switch(s.input_type) {
                case 'string':
                    if(def.subvars) {
                        o.push({tab:'marking-settings', value: s.value, type: 'string', description: s.label});
                    }
                    break;
                case 'mathematical_expression':
                    if(def.subvars) {
                        o.push({tab:'marking-settings', value: s.value, type: 'jme-sub', description: s.label});
                    }
                    break;
                case 'code':
                    if(def.evaluate) {
                        o.push({tab:'marking-settings', value: s.value, type: 'jme', description: s.label});
                    }
                    break;
                case 'html':
                    o.push({tab:'marking-settings', value: s.value, type: 'html', description: s.label});
                    break;
                case 'list_of_strings':
                    var value = ko.computed(function() {
                        var v = [];
                        s.value().forEach(function(str) {
                            v = v.merge(Editor.vars_used_in_string(str));
                        });
                        return v;
                    });
                    o.push({tab:'marking-settings', value: value, type: 'list', description: s.label});
                    break;
                case 'checkbox':
                case 'dropdown':
                case 'percent':
                case 'choose_several':
                default:
                    break;
            }
        });
        return o;
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

part_types.models.forEach(function(pt) {
    var bits = [pt.niceName, pt.name, pt.description];
    if(pt.source) {
        bits.push(pt.source.author.name);
    }
    pt.search_text = bits.join(' ').toLowerCase();
});

});

