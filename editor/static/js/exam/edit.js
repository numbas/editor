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

$(document).ready(function() {
    var Ruleset = Editor.Ruleset;
    function Exam(data)
    {
        var e = this;

        Editor.EditorItem.apply(this);

        this.questions = ko.observableArray([]);

        this.mainTabs([
            new Editor.Tab('settings','Settings','cog'),
            new Editor.Tab('questions','Questions','file'),
            new Editor.Tab('navigation','Navigation','tasks'),
            new Editor.Tab('timing','Timing','time'),
            new Editor.Tab('feedback','Feedback','comment'),
            new Editor.Tab('network','Other versions','link'),
            new Editor.Tab('history','Editing history','time')
        ]);
        if(item_json.editable) {
            this.mainTabs.splice(5,0,new Editor.Tab('access','Access','lock'));
        }
        this.currentTab(this.mainTabs()[0]);

        this.theme = ko.observable(null);
        this.locale = ko.observable(item_json.preferred_locale);

        this.duration = ko.observable(0);
        this.allowPause = ko.observable(true);
        this.percentPass = ko.observable(0);
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
            'http://numbas-editor.readthedocs.org/en/latest/exam-reference.html#term-on-leaving-a-question',
            [
                {name:'none', niceName:'None'},
                {name:'warnifunattempted', niceName:'Warn if unattempted'},
                {name:'preventifunattempted',niceName:'Prevent if unattempted'}
            ]
        );

        this.timeout = new Event(
            'timeout',
            'On timeout',
            'http://numbas-editor.readthedocs.org/en/latest/exam-reference.html#term-on-timeout-event',
            [
                {name:'none', niceName:'None'},
                {name:'warn', niceName:'Warn'}
            ]
        );
        this.timedwarning = new Event(
            'timedwarning',
            '5 minutes before timeout',
            'http://numbas-editor.readthedocs.org/en/latest/exam-reference.html#term-minutes-before-timeout-event',
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
                    questions: this.questions()
                                .filter(function(q){return q.id()>0})
                                .map(function(q){ return q.id(); })
                };
            },this);

            this.init_save();

            this.section_tasks = {
                'settings': [
                    Editor.nonempty_task('Give the question a name.',this.name),
                    Editor.nonempty_task('Fill out the question description.',this.description),
                    Editor.nonempty_task('Select a licence defining usage rights.',this.licence)
                ],
                'questions': [
                    {text: 'Add at least one question.', done: ko.computed(function(){ return this.questions().length>0 },this)}
                ]
            }
            this.init_tasks();
        }

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

        dropQuestion: function(data) {
            data.item.parent = data.targetParent;
        },

        //returns a JSON-y object representing the exam
        toJSON: function() {
            return {
                name: this.name(),
                metadata: this.metadata(),
                duration: this.duration()*60,
                percentPass: this.percentPass(),
                shuffleQuestions: this.shuffleQuestions(),
                allQuestions: this.allQuestions(),
                pickQuestions: this.pickQuestions(),
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
                  advicethreshold: this.advicethreshold()
                }
            };
        },

        reset: function() {
            this.questions([]);
        },

        load: function(data) {
            this.reset();

            var e = this;
            this.id = data.id;
            this.editoritem_id = data.editoritem_id;

            if('metadata' in data) {
                tryLoad(data.metadata,['description'],this);
                var licence_name = data.metadata.licence;
                for(var i=0;i<item_json.licences.length;i++) {
                    if(item_json.licences[i].name==licence_name) {
                        this.licence(item_json.licences[i]);
                        break;
                    }
                }
            }

            if('topics' in data) {
                data.topics.map(function(pk) {
                    this.get_topic(pk).used(true);
                },this);
            }

            if('subjects' in data) {
                data.subjects.map(function(pk) {
                    this.get_subject(pk).used(true);
                },this);
            }


            var content = data.JSONContent;

            this.published(data.published);

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
                tryLoad(content.feedback,['showactualmark','showtotalmark','showanswerstate','allowrevealanswer','advicethreshold'],this);
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

            if('questions' in data)
            {
                this.questions(data.questions.map(function(q) {
                    return new Question(q,e.questions)
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
        this.progress = data.progress;
        this.progressDisplay = data.progressDisplay;
        this.metadata = ko.observable(data.metadata);
        var descriptionDiv = document.createElement('div');
        descriptionDiv.innerHTML = this.metadata().description;
        this.description = $(descriptionDiv).text();
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
                progress: this.progress,
                progressDisplay: this.progressDisplay,
                url: this.url()
            };
        },

        clone: function() {
            return new Question(this.data,this.parent);
        },

        add: function() {
            var newQ = this.clone();
            newQ.parent = viewModel.questions;
            viewModel.questions.push(newQ);
        }
    }

    Numbas.queueScript('start-editor',['jme-display','jme-variables','jme','editor-extras'],function() {
        try {
            viewModel = new Exam(item_json.itemJSON);
            ko.applyBindings(viewModel);
            document.body.classList.add('loaded');
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
