$(document).ready(function() {
    var Ruleset = Editor.Ruleset;
    function Exam(data)
    {
        var e = this;

        Editor.EditorItem.apply(this);

        this.question_groups = ko.observableArray([]);
        this.addQuestionGroup = function() {
            e.question_groups.push(new QuestionGroup(null,e));
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

        this.mainTabs([
            new Editor.Tab('questions','Questions','file',{in_use: ko.computed(function() { return this.questions().length>0; },this)}),
            new Editor.Tab('display','Display','picture',{in_use: ko.computed(function() { return this.theme() && this.theme().path!='default'; },this)}),
            new Editor.Tab('navigation','Navigation','tasks'),
            new Editor.Tab('timing','Timing','time'),
            new Editor.Tab('feedback','Feedback','comment'),
            new Editor.Tab('settings','Settings','cog'),
            new Editor.Tab('network','Other versions','link',{in_use:item_json.other_versions_exist}),
            new Editor.Tab('history','Editing history','time',{in_use:item_json.editing_history_used})
        ]);
        if(item_json.editable) {
            this.mainTabs.splice(6,0,new Editor.Tab('access','Access','lock'));
        }
        this.currentTab(this.mainTabs()[0]);

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
        this.navigateModeOptions = [
            {name: 'sequence', niceName: 'Sequential'},
            {name: 'menu', niceName: 'Choose from menu'}
        ];
        this.navigatemode = ko.observable(this.navigateModeOptions[0]);
        this.reverse = ko.observable(true);
        this.browse = ko.observable(true);
        this.allowsteps = ko.observable(true);
        this.preventleave = ko.observable(true);
        this.startpassword = ko.observable('');

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
        this.feedbackMessages = ko.observableArray([]);

        this.addFeedbackMessage = function() {
            e.feedbackMessages.push(new FeedbackMessage());
        }

        this.questionTabs = ko.observableArray([
            new Editor.Tab('basket','Basket','shopping-cart'),
            new Editor.Tab('mine','Recent Questions','time')
        ]);
        this.currentQuestionTab = ko.observable(this.questionTabs()[0]);

        this.recentQuestions = Editor.mappedObservableArray(function(d){ return new Question(d,e);});
        this.recentQuestions(data.recentQuestions);

        this.basketQuestions = Editor.mappedObservableArray(function(d){ return new Question(d,e);});
        this.basketQuestions(data.basketQuestions);

        function getQuestions() {
            if(!is_logged_in) {
                return;
            }
            var cookie = getCookie('csrftoken');
            if(cookie!==null) {
                $.get('/exam/question-lists/'+e.id)
                    .success(function(d) {
                        e.recentQuestions(d.recent);
                        e.basketQuestions(d.basket);

                        var exam_question_by_pk = {};
                        d.exam_questions.forEach(function(d) {
                            exam_question_by_pk[d.id] = d;
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

        this.init_output();

        if(data)
        {
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
                save_request.success(function(data) {
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

        this.load_state();
    }
    Exam.prototype = {

        getTab: function(id) {
            return this.mainTabs().find(function(t){return t.id==id});
        },

        deleteItem: function(q,e) {
            if(window.confirm('Really delete this exam?')) {
                $(e.target).find('form').submit();
            }
        },

        addQuestion: function(q) {
            var groups = this.question_groups();
            if(!groups.length) {
                this.addQuestionGroup();
            }
            var group = groups[groups.length-1];
            group.questions.push(q);
        },

        //returns a JSON-y object representing the exam
        toJSON: function() {
            return {
                name: this.name(),
                metadata: this.metadata(),
                duration: this.duration()*60,
                percentPass: this.percentPass(),
                showQuestionGroupNames: this.showQuestionGroupNames(),
                showstudentname: this.showstudentname(),
                question_groups: this.question_groups().map(function(qg) { return qg.toJSON() }),
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
                    startpassword: this.startpassword()
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
                    reviewshowscore: this.reviewshowscore(),
                    reviewshowfeedback: this.reviewshowfeedback(),
                    reviewshowexpectedanswer: this.reviewshowexpectedanswer(),
                    reviewshowadvice: this.reviewshowadvice(),
                    feedbackmessages: this.feedbackMessages().map(function(f){return f.toJSON()})
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

            tryLoad(content,['name','percentPass','shuffleQuestions','allQuestions','pickQuestions','showQuestionGroupNames','showstudentname'],this);
            this.duration((content.duration||0)/60);

            if('navigation' in content)
            {
                tryLoad(content.navigation,['allowregen','reverse','browse','showfrontpage','preventleave','startpassword'],this);
                var showresultspage = Editor.tryGetAttribute(content.navigation, 'showresultspage');
                if(showresultspage) {
                    this.showresultspage(this.showResultsPageOptions.find(function(o){return o.name==showresultspage}));
                }
                var navigatemode = Editor.tryGetAttribute(content.navigation, 'navigatemode');
                if(navigatemode) {
                    this.navigatemode(this.navigateModeOptions.find(function(o){return o.name==navigatemode}));
                }
                this.onleave.load(content.navigation.onleave);
            }

            if('timing' in content)
            {
                tryLoad(content.timing,['allowPause'],this);
                this.timeout.load(content.timing.timeout);
                this.timedwarning.load(content.timing.timedwarning);
            }

            if('feedback' in content)
            {
                tryLoad(content.feedback,['showactualmark','showtotalmark','showanswerstate','allowrevealanswer','advicethreshold','intro','reviewshowscore','reviewshowfeedback','reviewshowexpectedanswer','reviewshowadvice'],this);
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

    function Event(name,niceName,helpURL,actions)
    {
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
            for(var i=0;i<this.actions.length;i++)
            {
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

        this.questions = ko.observableArray([]);

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

        this.first_number = ko.computed(function() {
            if(!this.parent) {
                return 0;
            }
            var all_groups = this.parent();
            var index = all_groups.indexOf(this);
            var total = 0;
            all_groups.slice(0,index).forEach(function(g) {
                total += g.num_questions();
            });
            return total;
        },this);
    }
    QuestionGroup.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                pickingStrategy: this.pickingStrategy().name,
                pickQuestions: this.pickQuestions(),
                questionNames: this.questions().map(function(q) {
                    return q.customName();
                })
            }
        }
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
        this.displayName = ko.computed({
            write: function(v) {
                return this.customName(v);
            },
            read: function() {
                var custom = this.customName().trim();
                return custom || this.name()
            }
        },this);
        this.published = ko.observable();
        this.load(data);

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
                        return g.first_number()+g.questions.indexOf(this)+1;
                }
            }
        },this);

        this.data = data;

        this.replaceWithCopy = function() {
            if(!q.question_group()) {
                return;
            }
            $.get(this.url()+'copy/',{csrfmiddlewaretoken: getCookie('csrftoken'),project:viewModel.project_id}).success(function(data) {
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
                url: this.url()
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

    Numbas.queueScript('start-editor',['jme-display','jme-variables','jme','editor-extras'],function() {
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
