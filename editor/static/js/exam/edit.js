$(document).ready(function() {
    var Ruleset = Editor.Ruleset;
    function Exam(data)
    {
        var e = this;

        Editor.EditorItem.apply(this);

        this.questions = ko.observableArray([]);

        this.question_groups = ko.observableArray([]);
        this.addQuestionGroup = function() {
            e.question_groups.push(new QuestionGroup(null,e.question_groups));
        }

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

        this.mainTabs([
            new Editor.Tab('settings','Settings','cog'),
            new Editor.Tab('display','Display','picture'),
            new Editor.Tab('questions','Questions','file'),
            new Editor.Tab('navigation','Navigation','tasks'),
            new Editor.Tab('timing','Timing','time'),
            new Editor.Tab('feedback','Feedback','comment'),
            new Editor.Tab('network','Other versions','link'),
            new Editor.Tab('history','Editing history','time')
        ]);
        if(item_json.editable) {
            this.mainTabs.splice(6,0,new Editor.Tab('access','Access','lock'));
        }
        this.currentTab(this.mainTabs()[0]);

        this.theme = ko.observable(null);
        this.locale = ko.observable(item_json.preferred_locale);

        this.duration = ko.observable(0);
        this.allowPause = ko.observable(true);
        this.percentPass = ko.observable(0);
        this.showfrontpage = ko.observable(true);
        this.showresultspage = ko.observable(true);

        this.allowregen = ko.observable(true);
        this.reverse = ko.observable(true);
        this.browse = ko.observable(true);
        this.preventleave = ko.observable(true);

        this.onleave = ko.observable(null);

        this.timeout = ko.observable(null);
        this.timedwarning = ko.observable(null);

        this.showactualmark = ko.observable(true);
        this.showtotalmark = ko.observable(true);
        this.showanswerstate = ko.observable(true);
        this.allowrevealanswer = ko.observable(true);
        this.advicethreshold = ko.observable(0);

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

        this.recentQuestions = Editor.mappedObservableArray(function(d){ return new Question(d);});
        this.recentQuestions(data.recentQuestions);

        this.basketQuestions = Editor.mappedObservableArray(function(d){ return new Question(d);});
        this.basketQuestions(data.basketQuestions);

        function update_question_list(list,data) {
            var odata = list();
            var changed = data.length!=list.length;
            if(!changed) {
                for(var i=0;i<odata.length;i++) {
                    if(JSON.stringify(odata[i].data)!=JSON.stringify(data[i])) {
                        changed = true;
                        break;
                    }
                }
            }
            if(changed) {
                list(data);
            }
        }

        function getQuestions() {
            var cookie = getCookie('csrftoken');
            if(cookie!==null) {
                $.get('/exam/question-lists/')
                    .success(function(d) {
                        update_question_list(e.recentQuestions,d.recent);
                        update_question_list(e.basketQuestions,d.basket);
                    })
                ;
            }
        }

        setInterval(getQuestions,5000);

        this.onleave = new Event(
            'onleave',
            'On leaving a question',
            'http://numbas-editor.readthedocs.io/en/latest/exam/reference.html#term-on-leaving-a-question',
            [
                {name:'none', niceName:'None'},
                {name:'warnifunattempted', niceName:'Warn if unattempted'},
                {name:'preventifunattempted',niceName:'Prevent if unattempted'}
            ]
        );

        this.timeout = new Event(
            'timeout',
            'On timeout',
            'http://numbas-editor.readthedocs.io/en/latest/exam/reference.html#term-on-timeout-event',
            [
                {name:'none', niceName:'None'},
                {name:'warn', niceName:'Warn'}
            ]
        );
        this.timedwarning = new Event(
            'timedwarning',
            '5 minutes before timeout',
            'http://numbas-editor.readthedocs.io/en/latest/exam/reference.html#term-minutes-before-timeout-event',
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
                return {
                    content: this.output(),
                    theme: this.theme(),
                    locale: this.locale(),
                    subjects: this.subjects().filter(function(s){return s.used()}).map(function(s){return s.pk}),
                    topics: this.topics().filter(function(t){return t.used()}).map(function(t){return t.pk}),
                    ability_levels: this.used_ability_levels().map(function(al){return al.pk}),
                    metadata: this.metadata(),
                    question_groups: this.question_groups()
                                .map(function(qg,i){ return qg.questions().map(function(q) {return q.id(); }) })
                };
            },this);

            this.init_save();

            this.section_tasks = {
                'settings': [
                    Editor.nonempty_task('Give the exam a name.',this.name),
                    Editor.nonempty_task('Fill out the exam description.',this.description),
                    Editor.nonempty_task('Select a licence defining usage rights.',this.licence)
                ],
                'questions': [
                    {text: 'Add at least one question.', done: ko.computed(function(){ return this.numQuestions()>0 },this)}
                ]
            }
            this.init_tasks();
        }

        this.load_state();
    }
    Exam.prototype = {

        versionJSON: function() {
            var obj = {
                id: this.id,
                author: item_json.itemJSON.author,
                locale: item_json.itemJSON.locale,
                JSONContent: this.toJSON(),
                metadata: this.metadata(),
                name: this.name(),
                questions: this.questions().map(function(q){return q.toJSON()}),
                theme: this.theme().path
            }
            if(item_json.editable) {
                obj.public_access = this.public_access()
            }
            return obj;
        },

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
            var group = groups[groups.length-1];
            q.parent = group.questions;
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
                question_groups: this.question_groups().map(function(qg) { return qg.toJSON() }),
                navigation: {
                    allowregen: this.allowregen(),
                    reverse: this.reverse(),
                    browse: this.browse(),
                    showfrontpage: this.showfrontpage(),
                    showresultspage: this.showresultspage(),
                    onleave: this.onleave.toJSON(),
                    preventleave: this.preventleave()
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
                  feedbackmessages: this.feedbackMessages().map(function(f){return f.toJSON()})
                }
            };
        },

        reset: function() {
            this.questions([]);
        },

        load: function(data) {
            Editor.EditorItem.prototype.load.apply(this,[data]);

            var e = this;

            var content = data.JSONContent;

            tryLoad(content,['name','percentPass','shuffleQuestions','allQuestions','pickQuestions'],this);
            this.duration((content.duration||0)/60);

            if('navigation' in content)
            {
                tryLoad(content.navigation,['allowregen','reverse','browse','showfrontpage','showresultspage','preventleave'],this);
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
                tryLoad(content.feedback,['showactualmark','showtotalmark','showanswerstate','allowrevealanswer','advicethreshold','intro'],this);
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

            if('locale' in data)
                this.locale(data.locale);

            if('question_groups' in content) {
                if('question_groups' in data) {
                    data.question_groups.forEach(function(d) {
                        content.question_groups[d.group].questions = d.questions;
                    })
                }
                this.question_groups(content.question_groups.map(function(qg) {
                    return new QuestionGroup(qg,e.question_groups);
                }));
            }
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

    function QuestionGroup(data,parent) {
        var qg = this;

        this.parent = parent;

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
                return new Question(q,qg.questions);
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
    }
    QuestionGroup.prototype = {
        toJSON: function() {
            return {
                name: this.name(),
                pickingStrategy: this.pickingStrategy().name,
                pickQuestions: this.pickQuestions()
            }
        }
    }

    function Question(data,parent)
    {
        var q = this;
        this.id = ko.observable(data.id);
        this.name = ko.observable(data.name);
        this.created = ko.observable(data.created);
        this.author = ko.observable(data.author);
        this.url = ko.observable(data.url);
        this.deleteURL = ko.observable(data.deleteURL);
        this.last_modified = ko.observable(data.last_modified);
        this.previewURL = ko.computed(function() {
            return q.url()+'preview/';
        },this);
        this.metadata = ko.observable(data.metadata);
        var descriptionDiv = document.createElement('div');
        descriptionDiv.innerHTML = this.metadata().description;
        this.description = $(descriptionDiv).text();
        this.current_stamp = data.current_stamp;
        this.current_stamp_display = data.current_stamp_display;
        this.parent = parent;
        this.data = data;

        this.replaceWithCopy = function() {
            $.get(this.url()+'copy/',{csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(data) {
                var newq = new Question(data,q.parent);
                var i = q.parent.indexOf(q)
                q.parent.splice(i,1,newq);
            })
        }

    }
    Question.prototype = {
        remove: function() {
            this.parent.remove(this);
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
            return new Question(this.data,this.parent);
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
