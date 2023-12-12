$(document).ready(function() {
    var Ruleset = Editor.Ruleset;
    function Exam(data) {
        var e = this;

        Editor.EditorItem.apply(this);

        this.question_view = ko.observable('groups');
        this.edit_question_group = function() {
            e.question_view('groups');
        }
        this.cancel_add_questions = function() {
            e.question_view('groups');
        }


        this.question_groups = ko.observableArray([]);
        this.current_question_group = ko.observable(null);
        this.current_question_group.subscribe(function(qg) {
            if(qg) {
                e.question_view('groups');
            }
        });

        this.addQuestionGroup = function() {
            var qg = new QuestionGroup(null,e);
            e.question_groups.push(qg);
            e.current_question_group(qg);
            return qg;
        }

        this.questions = ko.computed(function() {
            var l = [];
            this.question_groups().map(function(g) {
                l = l.concat(g.questions());
            });
            return l
        },this);

        this.any_unpublished_questions = ko.computed(function() {
            return this.questions().some(function(q) { return !q.published(); });
        },this);

        this.ready_to_download_checks.push(function() {
            if(!e.questions().every(function(q) {return q.current_stamp()=='ok'})) {
                return {ready: false, reason: 'not every question is labelled "Ready to use"'};
            }
        });

        this.showQuestionGroupNames = ko.observable(false);
        this.shuffleQuestionGroups = ko.observable(false);

        this.shuffleQuestions = ko.observable(false);
        var tickAllQuestions = ko.observable(true);
        this.allQuestions = ko.computed({
            read: function() {
                return this.shuffleQuestions() ? tickAllQuestions() : true;
            },
            write: function(v) {
                if(this.shuffleQuestions()) {
                    tickAllQuestions(v);
                }
            }
        },this);
        this.pickQuestions = ko.observable(0);

        this.numQuestions = ko.computed(function() {
            var t = 0;
            this.question_groups().forEach(function(g) {
                t += g.questions().length;
            });
            return t;
        },this);

        this.theme = ko.observable(null);
        this.locale = ko.observable(item_json.preferred_locale);

        this.allowPrinting = ko.observable(true);

        this.navigateModeOptions = [
            {
                name: 'sequence', 
                niceName: 'Sequential', 
                edit_question_names: true, 
                change_question_groups: true, 
                number_questions: true
            },
            {
                name: 'menu', 
                niceName: 'Choose from menu', 
                edit_question_names: true, 
                change_question_groups: true, 
                number_questions: false
            },
            {
                name: 'diagnostic', 
                niceName: 'Diagnostic', 
                edit_question_names: false, 
                change_question_groups: false, 
                number_questions: false
            }
        ];
        this.navigatemode = ko.observable(this.navigateModeOptions[0]);

        this.mainTabber.tabs([
            new Editor.Tab('questions','Questions','file',{in_use: ko.computed(function() { return this.questions().length>0; },this)}),
            new Editor.Tab('diagnostic', 'Diagnostic', 'object-align-horizontal', {visible: ko.computed(function() { return this.navigatemode().name=='diagnostic'; },this)}),
            new Editor.Tab('display','Display','picture',{in_use: ko.computed(function() { return this.theme() && this.theme().path!='default'; },this)}),
            new Editor.Tab('navigation','Navigation','tasks'),
            new Editor.Tab('timing','Timing','time'),
            new Editor.Tab('feedback','Feedback','comment'),
            new Editor.Tab('settings','Settings','cog'),
            new Editor.Tab('network','Other versions','link',{in_use:item_json.other_versions_exist}),
            new Editor.Tab('history','Editing history','time',{in_use:item_json.editing_history_used})
        ]);
        if(item_json.editable) {
            this.mainTabber.tabs.splice(6,0,new Editor.Tab('access','Access','lock'));
        }
        this.mainTabber.currentTab(this.mainTabber.tabs()[0]);

        this.duration = ko.observable(0);
        this.allowPause = ko.observable(true);
        this.percentPass = ko.observable(0);
        this.showfrontpage = ko.observable(true);
        this.showResultsPageOptions = [
            {name: 'oncompletion', niceName: 'On completion'},
            {name: 'review', niceName: 'When entering in review mode'},
            {name: 'never', niceName: 'Never'}
        ];
        this.showresultspage = ko.observable(this.showResultsPageOptions[0]);

        this.allowregen = ko.observable(true);
        this.reverse = ko.observable(true);
        this.browse = ko.observable(true);
        this.allowsteps = ko.observable(true);
        this.preventleave = ko.observable(true);
        this.typeendtoleave = ko.observable(false);
        this.startpassword = ko.observable('');
        this.allowAttemptDownload = ko.observable(false);
        this.downloadEncryptionKey = ko.observable('');

        this.onleave = ko.observable(null);

        this.timeout = ko.observable(null);
        this.timedwarning = ko.observable(null);

        this.showactualmark = ko.observable(true);
        this.showtotalmark = ko.observable(true);
        this.showanswerstate = ko.observable(true);
        this.allowrevealanswer = ko.observable(true);
        this.advicethreshold = ko.observable(0);
        this.showstudentname = ko.observable(true);

        this.reviewshowscore = ko.observable(true);
        this.reviewshowfeedback = ko.observable(true);
        this.reviewshowexpectedanswer = ko.observable(true);
        this.reviewshowadvice = ko.observable(true);

        this.intro = ko.observable('');
        this.end_message = ko.observable('');
        this.feedbackMessages = ko.observableArray([]);

        this.addFeedbackMessage = function() {
            e.feedbackMessages.push(new FeedbackMessage());
        }

        this.questionTabs = ko.observableArray([
            new Editor.Tab('basket','Basket','shopping-cart'),
            new Editor.Tab('mine','Recent Questions','time')
        ]);
        this.currentQuestionTab = ko.observable(this.questionTabs()[0]);

        this.recentQuestions = Editor.mappedObservableArray(function(d){ return new QuestionSummary(d,e);});
        this.recentQuestions(data.recentQuestions);

        this.basketQuestions = Editor.mappedObservableArray(function(d){ return new QuestionSummary(d,e);});
        this.basketQuestions(data.basketQuestions);

        function getQuestions() {
            if(!is_logged_in) {
                return;
            }
            var cookie = getCSRFtoken();
            if(cookie!==null) {
                $.get('/exam/question-lists/'+e.id)
                    .success(function(d) {
                        e.recentQuestions(d.recent);
                        e.basketQuestions(d.basket);

                        var exam_question_by_pk = {};
                        d.exam_questions.forEach(function(qd) {
                            exam_question_by_pk[qd.id] = qd;
                        });
                        e.questions().forEach(function(q) {
                            q.load(exam_question_by_pk[q.id()]);
                        });
                    })
                ;
            }
        }

        setInterval(getQuestions,5000);

        this.onleave = new Event(
            'onleave',
            'On leaving a question',
            'exam/reference.html#term-on-leaving-a-question',
            [
                {name:'none', niceName:'None'},
                {name:'warnifunattempted', niceName:'Warn if unattempted'},
                {name:'preventifunattempted',niceName:'Prevent if unattempted'}
            ]
        );

        this.timeout = new Event(
            'timeout',
            'On timeout',
            'exam/reference.html#term-on-timeout-event',
            [
                {name:'none', niceName:'None'},
                {name:'warn', niceName:'Warn'}
            ]
        );
        this.timedwarning = new Event(
            'timedwarning',
            '5 minutes before timeout',
            'exam/reference.html#term-minutes-before-timeout-event',
            [
                {name:'none', niceName:'None'},
                {name:'warn', niceName:'Warn'}
            ]
        );


        this.diagnostic = {
            tabber: new Editor.Tabber([
                {id: 'topics', title: 'Topics', icon: 'book'},
                {id: 'learning-objectives', title: 'Learning objectives', icon: 'ok'},
                {id: 'algorithm', title: 'Diagnostic algorithm', icon: 'road'}
            ]),

            knowledge_graph: new KnowledgeGraph(this),

            pass_topic_condition: Editor.optionObservable([
                {name: 'ncorrect', niceName: 'Correctly answer N questions'},
                {name: 'percentcorrect', niceName: 'Correctly answer a proportion of the available questions'},
            ]),
            pass_topic_number: ko.observable(1),

            fail_topic_condition: Editor.optionObservable([
                {name: 'nincorrect', niceName: 'Incorrectly answer N questions'},
                {name: 'percentincorrect', niceName: 'Incorrectly answer a proportion of the available questions'},
            ]),
            fail_topic_number: ko.observable(1),

            on_incorrect_answer: Editor.optionObservable([
                {name: 'move-on', niceName: 'Don\'t repeat'},
                {name: 'repeat-immediately', niceName: 'Repeat immediately'},
                {name: 'repeat-at-end', niceName: 'Repeat at the end of the topic'}
            ]),

            partially_correct_try_again: ko.observable(true),
            partially_correct_threshold: ko.observable(0.5),

            initial_retries: ko.observable(0),
            max_retries: ko.observable(0),
            win_retry_after: Editor.optionObservable([
                {name: 'never', niceName: 'Never'},
                {name: 'correct-answer', niceName: 'After answering a question correctly'},
                {name: 'pass-topic', niceName: 'After passing a topic'},
            ]),
            win_retry_number: ko.observable(0),

            allow_delay_question: ko.observable(false),
        }
        this.diagnostic.show_topic = function(t) {
            var kg = e.diagnostic.knowledge_graph;
            kg.current_topic(t);
            e.mainTabber.setTab('diagnostic')();
            e.diagnostic.tabber.setTab('topics')();
        };
        this.diagnostic.show_learning_objective = function(lo) {
            var kg = e.diagnostic.knowledge_graph;
            kg.current_learning_objective(lo);
            e.mainTabber.setTab('diagnostic')();
            e.diagnostic.tabber.setTab('learning-objectives')();
        };
        this.diagnostic.scriptOptions = [
            {niceName: 'Diagnosys', name: 'diagnosys'},
            {niceName: 'Mastery', name: 'mastery'},
            {niceName: 'Custom', name: 'custom'}
        ];
        this.diagnostic.script = ko.observable(this.diagnostic.scriptOptions[0]);
        var _extendScript = ko.observable(false);
        this.diagnostic.extendScript = ko.computed({
            read: function() {
                return this.diagnostic.script().name=='custom' || _extendScript()
            },
            write: _extendScript
        },this);
        this.diagnostic.customScript = ko.observable('');
        this.diagnostic.baseScript = ko.pureComputed(function() {
            var name = e.diagnostic.script().name;
            if(name=='custom') {
                return '';
            } else {
                return Numbas.raw_diagnostic_scripts[name] || '';
            }
        });
        this.diagnostic.scriptError = ko.observable('');
        ko.computed(function() {
            e.diagnostic.scriptError('');
            try {
                if(e.diagnostic.extendScript()) {
                    var base = Numbas.diagnostic.scripts[e.diagnostic.script().name];
                    var script = new Numbas.diagnostic.DiagnosticScript(e.diagnostic.customScript(),base);
                }
            } catch(err) {
                e.diagnostic.scriptError(err.message);
            }
        },this).extend({rateLimit: 1000});


        this.init_output();

        if(data) {
            this.load(data);
        }


        if(item_json.editable) {
            this.save = ko.computed(function() {
                var used_nodes = [];
                function node_used(n) {
                    if(n.used()) {
                        used_nodes.push(n.pk);
                    }
                    n.children.forEach(node_used);
                }
                this.taxonomies.forEach(function(t) {
                    t.trees.forEach(node_used);
                });
                return {
                    content: this.output(),
                    theme: this.theme(),
                    locale: this.locale(),
                    taxonomy_nodes: used_nodes,
                    ability_levels: this.used_ability_levels().map(function(al){return al.pk}),
                    metadata: this.metadata(),
                    question_groups: this.question_groups()
                                .map(function(qg,i){ return qg.questions().map(function(q) {return q.id(); }) })
                };
            },this);

            this.init_save(function(save_request) {
                save_request.then(async function(request) {
                    const response = await request;
                    const data = await response.json();
                    e.remove_deleted_questions(data.deleted_questions);
                });
            });

            this.section_tasks = {
                'settings': [
                    Editor.nonempty_task('Give the exam a name.',this.name, '#name-input'),
                    Editor.nonempty_task('Fill out the exam description.',this.description, '#description-input .wmTextArea'),
                    Editor.nonempty_task('Select a licence defining usage rights.',this.licence, '#licence-select')
                ],
                'questions': [
                    {text: 'Add at least one question.', done: ko.computed(function(){ return this.numQuestions()>0 },this), focus_on: '.question-result .handle:first'},
                    {text: 'Publish every question.', done: ko.computed(function(){ return !this.any_unpublished_questions() },this), focus_on: '.question-result .handle:first'}
                ]
            }
            this.init_tasks();
        }

        if(window.history !== undefined) {
            this.load_state();
            var state = window.history.state || {};
            var graph = this.diagnostic.knowledge_graph;
            if('currentTopic' in state) {
                var topic = graph.topics().find(function(t) { return t.name()==state.currentTopic; });
                if(topic) {
                    graph.current_topic(topic);
                }
            }
            Editor.computedReplaceState('currentTopic',ko.pureComputed(function(){
                var t = graph.current_topic();
                return t && t.name();
            },this));
            if('currentLearningObjective' in state) {
                var learning_objective = graph.learning_objectives().find(function(t) { return t.name()==state.currentLearningObjective; });
                if(learning_objective) {
                    graph.current_learning_objective(learning_objective);
                }
            }
            Editor.computedReplaceState('currentLearningObjective',ko.pureComputed(function(){
                var lo = graph.current_learning_objective();
                return lo && lo.name();
            },this));
            if('currentDiagnosticTab' in state) {
                this.diagnostic.tabber.setTab(state.currentDiagnosticTab)();
            }
            Editor.computedReplaceState('currentDiagnosticTab',ko.pureComputed(function() {
                var tab = this.diagnostic.tabber.currentTab();
                return tab ? tab.id : '';
            },this));
        }
    }
    Exam.prototype = {

        deleteItem: function(q,e) {
            if(window.confirm('Really delete this exam?')) {
                $(e.target).find('form').submit();
            }
        },

        addQuestion: function(q) {
            var group = this.current_question_group();
            if(!group) {
                return;
            }
            group.questions.push(q);
            this.question_view('groups');
        },

        //returns a JSON-y object representing the exam
        toJSON: function() {
            return {
                name: this.name(),
                metadata: this.metadata(),
                duration: this.duration()*60,
                percentPass: this.percentPass(),
                showQuestionGroupNames: this.showQuestionGroupNames(),
                shuffleQuestionGroups: this.shuffleQuestionGroups(),
                showstudentname: this.showstudentname(),
                question_groups: this.question_groups().map(function(qg) { return qg.toJSON() }),
                allowPrinting: this.allowPrinting(),
                navigation: {
                    allowregen: this.allowregen(),
                    reverse: this.reverse(),
                    browse: this.browse(),
                    allowsteps: this.allowsteps(),
                    showfrontpage: this.showfrontpage(),
                    showresultspage: this.showresultspage().name,
                    navigatemode: this.navigatemode().name,
                    onleave: this.onleave.toJSON(),
                    preventleave: this.preventleave(),
                    typeendtoleave: this.typeendtoleave(),
                    startpassword: this.startpassword(),
                    allowAttemptDownload: this.allowAttemptDownload(),
                    downloadEncryptionKey: this.downloadEncryptionKey()
                },
                timing: {
                    allowPause: this.allowPause(),
                    timeout: this.timeout.toJSON(),
                    timedwarning: this.timedwarning.toJSON()
                },
                feedback: {
                    showactualmark: this.showactualmark(),
                    showtotalmark: this.showtotalmark(),
                    showanswerstate: this.showanswerstate(),
                    allowrevealanswer: this.allowrevealanswer(),
                    advicethreshold: this.advicethreshold(),
                    intro: this.intro(),
                    end_message: this.end_message(),
                    reviewshowscore: this.reviewshowscore(),
                    reviewshowfeedback: this.reviewshowfeedback(),
                    reviewshowexpectedanswer: this.reviewshowexpectedanswer(),
                    reviewshowadvice: this.reviewshowadvice(),
                    feedbackmessages: this.feedbackMessages().map(function(f){return f.toJSON()})
                },
                diagnostic: {
                    knowledge_graph: this.diagnostic.knowledge_graph.toJSON(),
                    script: this.diagnostic.script().name,
                    customScript: this.diagnostic.extendScript() ? this.diagnostic.customScript() : ''
                }
            };
        },

        reset: function() {
        },

        load: function(data) {
            Editor.EditorItem.prototype.load.apply(this,[data]);

            var e = this;

            var content = data.JSONContent;

            this.project_id = data.project_id;

            tryLoad(content,['name','percentPass','shuffleQuestions','allQuestions','pickQuestions','showQuestionGroupNames','shuffleQuestionGroups','showstudentname','allowPrinting'],this);
            this.duration((content.duration||0)/60);

            if('navigation' in content) {
                tryLoad(content.navigation,['allowregen','reverse','browse','showfrontpage','preventleave','typeendtoleave','startpassword','allowAttemptDownload','downloadEncryptionKey','allowsteps'],this);
                var showresultspage = Editor.tryGetAttribute(content.navigation, 'showresultspage');
                if(showresultspage) {
                    this.showresultspage(this.showResultsPageOptions.find(function(o){return o.name==showresultspage}));
                }
                if(content.navigation.navigatemode=='adaptive') {
                    content.navigation.navigatemode = 'diagnostic';
                }
                var navigatemode = Editor.tryGetAttribute(content.navigation, 'navigatemode');
                if(navigatemode) {
                    this.navigatemode(this.navigateModeOptions.find(function(o){return o.name==navigatemode}));
                }
                this.onleave.load(content.navigation.onleave);
            }

            if('timing' in content) {
                tryLoad(content.timing,['allowPause'],this);
                this.timeout.load(content.timing.timeout);
                this.timedwarning.load(content.timing.timedwarning);
            }

            if('feedback' in content) {
                tryLoad(content.feedback,['showactualmark','showtotalmark','showanswerstate','allowrevealanswer','advicethreshold','intro','end_message','reviewshowscore','reviewshowfeedback','reviewshowexpectedanswer','reviewshowadvice'],this);
                if('feedbackmessages' in content.feedback) {
                    this.feedbackMessages(content.feedback.feedbackmessages.map(function(d){var f = new FeedbackMessage(); f.load(d); return f}));
                }
            }

            if('custom_theme' in data && data.custom_theme) {
                var path = data.custom_theme;
                for(var i=0;i<item_json.themes.length;i++) {
                    if(item_json.themes[i].path==path && item_json.themes[i].custom) {
                        this.theme(item_json.themes[i]);
                        break;
                    }
                }
            } else  {
                var path = 'theme' in data ? data.theme : '';
                path = path || 'default';
                for(var i=0;i<item_json.themes.length;i++) {
                    if(item_json.themes[i].path==path && !item_json.themes[i].custom) {
                        this.theme(item_json.themes[i]);
                        break;
                    }
                }
            }
            if(!this.theme()) {
                this.theme(item_json.themes[0]);
            }

            if('locale' in data) {
                this.locale(data.locale);
            }

            if('question_groups' in data) {
                content.question_groups = content.question_groups || [];
                data.question_groups.forEach(function(d) {
                    content.question_groups[d.group] = content.question_groups[d.group] || {questions: []};
                    content.question_groups[d.group].questions = d.questions;
                })
            }
            this.question_groups(content.question_groups.map(function(qg) {
                return new QuestionGroup(qg,e);
            }));

            this.current_question_group(this.question_groups()[0]);

            if('diagnostic' in content){ 
                var diagnostic = content.diagnostic;
                var graph = this.diagnostic.knowledge_graph;
                graph.load(diagnostic.knowledge_graph);

                tryLoad(diagnostic, ['customScript'], this.diagnostic);
                if(this.diagnostic.customScript) {
                    this.diagnostic.extendScript(true);
                }
                var script = this.diagnostic.scriptOptions.find(function(o){return o.name==diagnostic.script});
                if(script) {
                    this.diagnostic.script(script);
                }

                graph.topics().forEach(function(t) {
                    var qg = e.question_groups().find(function(qg) { return t.name()==qg.name(); });
                    if(qg) {
                        qg.topic(t);
                        t.question_group = qg;
                    }
                });
            }
        },

        remove_deleted_questions: function(questions) {
            if(!questions.length) {
                return;
            }
            this.question_groups().forEach(function(g) {
                var without_deleted = g.questions().filter(function(q) { return !questions.contains(q.id()) });
                if(without_deleted.length < g.questions().length) {
                    g.questions(without_deleted);
                }
            });
        }
    };
    Exam.prototype.__proto__ = Editor.EditorItem.prototype;

    function Event(name,niceName,helpURL,actions) {
        this.name = name;
        this.niceName = niceName;
        this.helpURL = helpURL;
        this.actions = actions;

        this.action = ko.observable(this.actions[0]);
        this.actionName = ko.computed(function() {
            return this.action().name;
        },this);
        this.message = Editor.contentObservable('')
    }
    Event.prototype = {
        toJSON: function() {
            return {
                action: this.actionName(),
                message: this.message()
            };
        },

        load: function(data) {
            if(!data)
                return;
            for(var i=0;i<this.actions.length;i++) {
                if(this.actions[i].name==data.action)
                    this.action(this.actions[i]);
            }
            this.message(data.message);
        }
    };

    function QuestionGroup(data,exam) {
        var qg = this;

        this.exam = exam
        this.parent = exam.question_groups;

        data = data || {};

        this.name = ko.observable(data.name || 'Group');
        this.topic = ko.observable(null);
        ko.computed(function() {
            var t = this.topic();
            if(t) {
                this.name(t.name());
            }
        },this);

        this.questions = ko.observableArray([]);

        this.num_questions_text = ko.pureComputed(function() {
            var n = this.questions().length;
            switch(n) {
                case 0:
                    return 'Empty';
                case 1:
                    return '1 question';
                default:
                    return n+' questions';
            }
        },this);

        this.receivedQuestions = ko.observableArray([]);
        ko.computed(function() {
            var received = this.receivedQuestions();
            if(received.length) {
                this.questions(this.questions().concat(received));
                this.receivedQuestions([]);
            }
        },this);

        if(data.questions) {
            this.questions(data.questions.map(function(q) {
                return new Question(q,qg.exam);
            }));
            if(data.questionNames) {
                this.questions().forEach(function(q,i) {
                    q.customName(data.questionNames[i] || '');
                });
            }
            if(data.variable_overrides) {
                this.questions().forEach(function(q,i) {
                    data.variable_overrides[i].forEach(function(vod) {
                        var v = q.variable_overrides().find(function(vo) { return vo.name==vod.name; });
                        if(v) {
                            v.definition(vod.definition);
                        }
                    });
                });
            }
        }

        this.pickingStrategies = [
            {name: 'all-ordered', niceName: 'All questions, in this order'},
            {name: 'all-shuffled', niceName: 'All questions, in random order'},
            {name: 'random-subset', niceName: 'Pick a random subset'}
        ];
        this.pickingStrategy = ko.observable(this.pickingStrategies.filter(function(s){return s.name==data.pickingStrategy})[0] || this.pickingStrategies[0]);
        this.pickQuestions = ko.observable(data.pickQuestions||1);

        this.remove = function() {
            if(!qg.questions().length || window.confirm('Are you sure you want to remove this group? All of its questions will also be removed from the exam.')) {
                qg.parent.remove(qg);
                if(qg.exam.current_question_group()==qg) {
                    qg.exam.current_question_group(null);
                }
            }
        }

        // the number of questions that will be chosen from this group
        this.num_questions = ko.computed(function() {
            switch(this.pickingStrategy().name) {
                case 'random-subset':
                    return parseInt(this.pickQuestions());
                default:
                    return this.questions().length;
            }
        },this);

        // The number of questions in this group that will be numbered.
        this.num_numbered_questions = ko.computed(function() {
            switch(this.pickingStrategy().name) {
                case 'random-subset':
                    return parseInt(this.pickQuestions());
                default:
                    return this.questions().filter(function(q) { return !q.hasCustomName(); }).length;
            }
        },this);
        this.first_number = ko.computed(function() {
            if(!this.parent) {
                return 0;
            }
            var all_groups = this.parent();
            var index = all_groups.indexOf(this);
            var total = 0;
            all_groups.slice(0,index).forEach(function(g) {
                total += g.num_numbered_questions();
            });
            return total;
        },this);

        this.add_questions = function() {
            qg.exam.question_view('add_question');
        }
        this.edit_topic = function() {
            if(!qg.topic()) {
                return;
            }
            qg.exam.diagnostic.show_topic(qg.topic());
        }
    }
    QuestionGroup.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                pickingStrategy: this.pickingStrategy().name,
                pickQuestions: this.pickQuestions(),
                questionNames: this.questions().map(function(q) {
                    return q.customName();
                }),
                variable_overrides: this.questions().map(function(q) {
                    return q.variable_overrides().filter(function(vo) { return vo.definition().trim()!=''; }).map(function(vo) { return vo.toJSON(); });
                })
            }
        }
    }

    Editor.highlight_question_dropper = function(e) {
        Array.from(document.querySelectorAll('.group-drop-question')).forEach(g => g.parentElement.classList.remove('dropping'));
        e.to.parentElement.classList.add('dropping');
    }
    Editor.start_question_sorting = function(e) {
        document.body.classList.add('dragging-question');
    }
    Editor.stop_question_sorting = function(e) {
        document.body.classList.remove('dragging-question');
    }

    function Question(data,exam) {
        var q = this;
        this.exam = exam;
        this.id = ko.observable();
        this.name = ko.observable();
        this.created = ko.observable();
        this.author = ko.observable();
        this.url = ko.observable();
        this.deleteURL = ko.observable();
        this.last_modified = ko.observable();
        this.metadata = ko.observable();
        this.current_stamp = ko.observable();
        this.current_stamp_display = ko.observable();
        this.customName = ko.observable('');
        this.hasCustomName = ko.pureComputed(function() {
            return this.customName().trim()!='';
        },this);
        this.displayName = ko.computed({
            write: function(v) {
                if(v==this.name()) {
                    v = '';
                }
                return this.customName(v);
            },
            read: function() {
                var custom = this.customName().trim();
                return custom || this.name()
            }
        },this);
        this.published = ko.observable();
        this.load(data);

        this.variable_overrides = ko.observableArray(Object.values(data.variables || {}).map(function(vd) {
            return new VariableOverride(q,vd);
        }));

        this.previewURL = ko.computed(function() {
            return q.url()+'preview/';
        },this);
        this.description = ko.computed(function() {
            var descriptionDiv = document.createElement('div');
            descriptionDiv.innerHTML = this.metadata().description || '';
            return $(descriptionDiv).text();
        },this);

        this.question_group = ko.computed(function() {
            var groups = exam.question_groups();
            for(var i=0;i<groups.length;i++) {
                if(groups[i].questions.indexOf(this)!=-1) {
                    return groups[i];
                }
            }
            return null;
        },this);

        this.usedInExam = ko.computed(function() {
            var questions = exam.questions();
            for(var i=0;i<questions.length;i++) {
                if(this.id() == questions[i].id()) {
                    return true;
                }
            }
            return false;
        }, this);

        this.number = ko.computed(function() {
            var g = this.question_group();
            if(!g) {
                return undefined;
            } else {
                switch(g.pickingStrategy().name) {
                    case 'random-subset':
                    case 'all-shuffled':
                        return undefined;
                    default:
                        var i = g.questions.indexOf(this);
                        var n = g.questions.slice(0,i).filter(function(q2) { return !q2.hasCustomName(); }).length;
                        return g.first_number()+n+1;
                }
            }
        },this);

        this.data = data;

        this.replaceWithCopy = function() {
            if(!q.question_group()) {
                return;
            }
            $.get(this.url()+'copy/',{csrfmiddlewaretoken: getCSRFtoken(),project:viewModel.project_id}).success(function(data) {
                var newq = new Question(data,q.exam);
                var i = q.question_group().questions.indexOf(q)
                q.question_group().questions.splice(i,1,newq);
            })
        }

    }
    Question.prototype = {
        load: function(data) {
            this.id(data.id);
            this.name(data.name);
            this.created(data.created);
            this.author(data.author);
            this.url(data.url);
            this.deleteURL(data.deleteURL);
            this.last_modified(data.last_modified);
            this.metadata(data.metadata);
            this.current_stamp(data.current_stamp);
            this.current_stamp_display(data.current_stamp_display);
            this.published(data.published);
        },
        remove: function() {
            if(!this.question_group()) {
                return;
            }
            this.question_group().questions.remove(this);
        },

        toJSON: function() {
            return {
                id: this.id(),
                name: this.name(),
                author: this.author(),
                created: this.created(),
                deleteURL: this.deleteURL(),
                last_modified: this.last_modified(),
                metadata: this.metadata(),
                url: this.url(),
                variable_overrides: this.variable_overrides().map(function(vo) { return vo.toJSON(); })
            };
        },

        clone: function() {
            return new Question(this.data,this.exam);
        },

        add: function() {
            var newQ = this.clone();
            viewModel.addQuestion(newQ);
        }
    }


    function QuestionSummary(data,exam) {
        var q = this;
        this.data = data;
        this.exam = exam;
        this.load(data);
    }
    QuestionSummary.prototype = {
        load: function(data) {
            this.id = data.id;
            this.name = data.name;
            this.created = data.created;
            this.author = data.author;
            this.url = data.url;
            this.deleteURL = data.deleteURL;
            this.last_modified = data.last_modified;
            this.metadata = data.metadata;
            this.current_stamp = data.current_stamp;
            this.current_stamp_display = data.current_stamp_display;
            this.previewURL = this.url+'preview/';
            var descriptionDiv = document.createElement('div');
            descriptionDiv.innerHTML = this.metadata.description || '';
            this.description = $(descriptionDiv).text();
        },
        clone: function() {
            return new Question(this.data,this.exam);
        },

        add: function() {
            var newQ = this.clone();
            viewModel.addQuestion(newQ);
        }
    }

    function VariableOverride(question,data) {
        this.question = question;
        this.name = data.name;
        this.description = data.description;
        this.definition = ko.observable('');
        this.original_definition = data.definition;
    }
    VariableOverride.prototype = {
        load: function(data) {
        },
        toJSON: function() {
            return {
                name: this.name,
                definition: this.definition()
            }
        }
    };

    function FeedbackMessage() {
        this.message = ko.observable('');
        this.threshold = ko.observable(0);
    }
    FeedbackMessage.prototype = {
        toJSON: function() {
            return {
                message: this.message(),
                threshold: this.threshold()
            }
        },

        load: function(data) {
            this.message(data.message);
            this.threshold(data.threshold || 0);
        },
        remove: function() {
            viewModel.feedbackMessages.remove(this);
        }
    }

    function KnowledgeGraph(exam,data) {
        var kg = this;
        this.exam = exam;
        this.topics = ko.observableArray([]);
        this.learning_objectives = ko.observableArray([]);
        this.current_topic = ko.observable(null);
        this.current_learning_objective = ko.observable(null);

        this.add_topic = function() {
            var t = new Topic(kg);
            kg.topics.push(t);
            kg.current_topic(t);
            var qg = kg.exam.addQuestionGroup();
            qg.topic(t);
            t.question_group = qg;
            return t;
        }

        this.add_learning_objective = function() {
            var lo = new LearningObjective(kg);
            kg.learning_objectives.push(lo);
            kg.current_learning_objective(lo);
            return lo;
        }

        this.remove_learning_objective = function(lo) {
            kg.learning_objectives.remove(lo);
        }

        ko.computed(function() {
            this.topics().forEach(function(t) {
                t.leads_to([]);
            });

            this.topics().forEach(function(t) {
                t.depends_on().forEach(function(t2) {
                    t2.leads_to.push(t);
                });
            });
        },this);

        if(data) {
            this.load(data);
        }
    }
    KnowledgeGraph.prototype = {
        load: function(data) {
            var kg = this;

            var topics = [];
            data.topics.forEach(function(td) {
                topics.push(new Topic(kg,td));
            });
            var learning_objectives = [];
            data.learning_objectives.forEach(function(lod) {
                learning_objectives.push(new LearningObjective(kg,lod));
            })

            data.topics.forEach(function(td,i) {
                topics[i].depends_on(td.depends_on.map(function(name) { return topics.find(function(t2) { return t2.name() == name; }) }));
                topics[i].learning_objectives(td.learning_objectives.map(function(name) { return learning_objectives.find(function(lo) { return lo.name() == name; }) }));
            })

            kg.topics(topics);
            kg.learning_objectives(learning_objectives);
        },

        toJSON: function() {
            var o = {
                topics: this.topics().map(function(t) { return t.toJSON(); }),
                learning_objectives: this.learning_objectives().map(function(lo) { return lo.toJSON(); })
            }
            return o;
        }
    }

    function Topic(graph,data) {
        var t = this;
        this.graph = graph;
        this.name = ko.observable('');
        this.label = ko.computed(function() {
            return this.name().trim() || 'Unnamed topic';
        },this);
        this.depends_on = ko.observableArray([]);
        this.leads_to = ko.observableArray([]);
        this.learning_objectives = ko.observableArray([]);

        this.description = ko.observable('');

        this.dependency_autocomplete = Editor.autocomplete_source(this, graph.topics, this.depends_on);

        this.leads_to_autocomplete = Editor.autocomplete_source(this, graph.topics, this.leads_to);

        this.add_dependency = function(t2) {
            t.depends_on.push(t2);
        }
        this.remove_dependency = function(t2) {
            t.depends_on.remove(t2);
        }

        this.add_leads_to = function(t2) {
            t2.depends_on.push(t);
        }
        this.remove_leads_to = function(t2) {
            t2.depends_on.remove(t);
        }

        this.learning_objective_autocomplete = Editor.autocomplete_source(this, graph.learning_objectives, this.learning_objectives);
        this.add_learning_objective = function(lo) {
            t.learning_objectives.push(lo);
        }
        this.remove_learning_objective = function(lo) {
            t.learning_objectives.remove(lo);
        }

        this.remove = function() {
            t.leads_to().forEach(function(t2) {
                t2.depends_on.remove(t);
            })
            t.graph.topics.remove(t);
            if(t.graph.current_topic()==t) {
                t.graph.current_topic(null);
            }
            t.question_group.remove();
        }

        if(data) {
            this.load(data);
        }
    }
    Topic.prototype = {
        load: function(data) {
            this.name(data.name);
            this.description(data.description);
        },

        toJSON: function() {
            var o = {
                name: this.name(),
                description: this.description(),
                depends_on: this.depends_on().map(function(t) { return t.name(); }),
                learning_objectives: this.learning_objectives().map(function(lo) { return lo.name(); })
            }
            return o;
        }
    }

    function LearningObjective(graph,data) {
        var lo = this;
        this.graph = graph;
        this.name = ko.observable('');
        this.label = ko.computed(function() {
            return this.name().trim() || 'Unnamed learning objective';
        },this);
        this.description = ko.observable('');

        this.topics = ko.computed(function() {
            return lo.graph.topics().filter(function(t) { return t.learning_objectives().indexOf(lo)>=0; });
        },this);

        this.topic_autocomplete = Editor.autocomplete_source(this, graph.topics, this.topics);
        this.add_topic = function(t) {
            t.learning_objectives.push(lo);
        }
        this.remove_topic = function(t) {
            t.learning_objectives.remove(lo);
        }

        this.remove = function() {
            lo.topics().forEach(function(t) {
                t.learning_objectives.remove(lo);
            });
            lo.graph.learning_objectives.remove(lo);
            if(lo.graph.current_learning_objective()==lo) {
                lo.graph.current_learning_objective(null);
            }
        }

        if(data) {
            this.load(data);
        }
    }
    LearningObjective.prototype = {
        load: function(data) {
            this.name(data.name);
            this.description(data.description);
        },

        toJSON: function() {
            var o = {
                name: this.name(),
                description: this.description()
            }
            return o;
        }
    }


    Numbas.queueScript('start-editor',['jme-display','jme-variables','jme','editor-extras','diagnostic_scripts','diagnostic'],function() {
        try {
            viewModel = new Exam(item_json.itemJSON);
            ko.options.deferUpdates = true;
            ko.applyBindings(viewModel);
            try {
                document.body.classList.add('loaded');
            } catch(e) {
                document.body.className += ' loaded';
            }
            Editor.update_basket();
            $('.timeline').mathjax();
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
        window.open(item_json.previewURL,item_json.previewWindow);
    });

});
