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

		this.questions = ko.observableArray([]);

		this.mainTabs = ko.observableArray([
			new Editor.Tab('general','General'),
			new Editor.Tab('navigation','Navigation'),
			new Editor.Tab('timing','Timing'),
			new Editor.Tab('feedback','Feedback'),
			new Editor.Tab(
				'questions',
				ko.computed(function() {
					return 'Questions ('+e.questions().length+')';
				})
			)
		]);
        var editingHistoryTab = new Editor.Tab('versions','Editing history');
        this.mainTabs.splice(1,0,editingHistoryTab);
        if(Editor.editable) {
            this.mainTabs.push(new Editor.Tab('access','Access'));
        }
		this.currentTab = ko.observable(this.mainTabs()[0]);

		if(Editor.editable && window.location.hash=='#editing-history') {
			this.currentTab(editingHistoryTab);
		}

        this.stamp = function(status_code) {
            return function() {
                $.post('stamp',{'status': status_code, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(stamp) {
                    e.timeline.splice(0,0,new Editor.TimelineItem({date: stamp.date, user: stamp.user, data: stamp, type: 'stamp'}));
                });
                noty({
                    text: 'Thanks for your feedback!',
                    type: 'success',
                    layout: 'topCenter'
                });
            }
        }

        this.starred = ko.observable(Editor.starred);
        this.toggleStar = function() {
            e.starred(!e.starred());
        }
        this.starData = ko.computed(function() {
            return {starred: this.starred()}
        },this);
        this.saveStar = Editor.saver(this.starData,function(data) {
            return $.post('set-star',data);
        });

        this.realName = ko.observable('An Exam');
		this.name = ko.computed({
			read: this.realName,
			write: function(value) {
				if(value.length)
						this.realName(value);
			},
			owner: this
		});

        Editor.licences.sort(function(a,b){a=a.short_name;b=b.short_name; return a<b ? -1 : a>b ? 1 : 0 });
        this.licence = ko.observable();
        this.licence_name = ko.computed(function() {
            if(this.licence()) {
                return this.licence().name;
            } else {
                return 'None specified';
            }
        },this);

        this.notes = ko.observable('');
		this.description = ko.observable('');
		this.metadata = ko.computed(function() {
			return {
				notes: this.notes(),
				description: this.description(),
                licence: this.licence_name()
			};
		},this);

		this.theme = ko.observable(null);
		this.locale = ko.observable(Editor.preferred_locale);

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
			new Editor.Tab('mine','Recent Questions'),
			new Editor.Tab('search','Search'),
		]);
		this.currentQuestionTab = ko.observable(this.questionTabs()[0]);

        this.recentQuestions = Editor.mappedObservableArray(function(d){ return new Question(d);});
        this.recentQuestions(data.recentQuestions);

        function getRecentQuestions() {
            var cookie = getCookie('csrftoken');
            if(cookie!==null) {
                $.get('/questions/recent/',{csrfmiddlewaretoken: cookie})
                    .success(function(d) {
                        e.recentQuestions(d);
                    })
                ;
            }
        }

        setInterval(getRecentQuestions,5000);

		this.search = {
			query: ko.observable(''),
            tags: ko.observable(''),
			results: {
				raw: ko.observableArray([]),
				all: Editor.mappedObservableArray(function(d) {return new Question(d,e.questionSearchResults);})
			}
		};

		function makeQuery() {
			if(e.search.query().length>0 || e.search.tags().length>0)
				return {
                    query: e.search.query(), 
                    tags: e.search.tags()
                }
		}

		Editor.searchBinding(this.search,'/questions/search/json',makeQuery);

		ko.computed(function() {
			e.search.results.all(e.search.results.raw());
		});

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

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);
        
        this.output = ko.computed(function() {
            var data = JSON.stringify(this.toJSON());
			return '// Numbas version: '+Editor.numbasVersion+'\n'+data;
        },this);

        if(data)
		{
            this.load(data);
		}

		if(Editor.editable) {
			this.firstSave = true;

			this.save = ko.computed(function() {
				return {
					content: this.output(),
					theme: this.theme(),
					locale: this.locale(),
					metadata: this.metadata(),
					questions: this.questions()
								.filter(function(q){return q.id()>0})
								.map(function(q){ return q.id(); })
				};
			},this);

			this.autoSave = Editor.saver(
				this.save,
				function(data) {
					return $.post(
						'/exam/'+e.id+'/'+slugify(e.name())+'/',
						{json: JSON.stringify(data), csrfmiddlewaretoken: getCookie('csrftoken')}
					)
						.success(function(data){
							var address = location.protocol+'//'+location.host+'/exam/'+Editor.examJSON.id+'/'+slugify(e.name())+'/';
							if(history.replaceState)
								history.replaceState({},e.name(),address);
                            e.timeline.splice(0,0,new Editor.TimelineItem({date: data.version.date_created, user: data.version.user, type: 'version', data: data.version}));
						})
						.error(function(response,type,message) {
                            if(message=='')
                                message = 'Server did not respond.';

							noty({
								text: 'Error saving exam:\n\n'+message,
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
				}
			);

            //access control stuff
            this.public_access = ko.observable(Editor.public_access);
            this.access_options = [
                {value:'hidden',text:'Hidden'},
                {value:'view',text:'Anyone can view this'},
                {value:'edit',text:'Anyone can edit this'}
            ];
            this.access_rights = ko.observableArray(Editor.access_rights.map(function(d){return new UserAccess(e,d)}));

            this.access_data = ko.computed(function() {
                return {
                    public_access: e.public_access(),
                    user_ids: e.access_rights().map(function(u){return u.id}),
                    access_levels: e.access_rights().map(function(u){return u.access_level()}),
                    csrfmiddlewaretoken: getCookie('csrftoken')
                }
            });
            this.saveAccess = Editor.saver(this.access_data,function(data) {
                return $.post('set-access',data);
            });
            this.userAccessSearch=ko.observable('');

            this.addUserAccess = function(data) {
                var access_rights = e.access_rights();
                for(var i=0;i<access_rights.length;i++) {
                    if(access_rights[i].id==data.id) {
                        noty({
                            text: "That user is already in the access list.",
                            layout: "center",
                            speed: 100,
                            type: 'error',
                            timeout: 2000,
                            closable: true,
                            animateOpen: {"height":"toggle"},
                            animateClose: {"height":"toggle"},
                            closeOnSelfClick: true
                        });
                        return;
                    }
                }
                e.access_rights.push(new UserAccess(e,data));
            };
		}
		if(window.history !== undefined) {
			var state = window.history.state || {};
			if('currentTab' in state) {
				var tabs = this.mainTabs();
				for(var i=0;i<tabs.length;i++) {
					var tab = tabs[i];
					if(tab.id==state.currentTab) {
						this.currentTab(tab);
						break;
					}
				}
			}
			Editor.computedReplaceState('currentTab',ko.computed(function(){return this.currentTab().id},this));
		}

		this.currentChange = ko.observable(new Editor.Change(this.versionJSON(),Editor.examJSON.author));

		// create a new version when the question JSON changes
		ko.computed(function() {
			var currentChange = this.currentChange.peek();
			var v = new Editor.Change(this.versionJSON(),Editor.examJSON.author, currentChange);

			//if the new version is different to the old one, keep the diff
			if(!currentChange || v.diff.length!=0) {
				currentChange.next_version(v);
				this.currentChange(v);
			}
		},this).extend({throttle:1000});


		this.rewindChange = function() {
			var currentChange = q.currentChange();
			var prev_version = currentChange.prev_version();
			if(!prev_version) {
				throw(new Error("Can't rewind - this is the first version"));
			}
			var data = q.versionJSON();
			data = jiff.patch(jiff.inverse(currentChange.diff),data);
			q.currentChange(prev_version);
			q.load(data);
		};

		this.forwardChange = function() {
			var currentChange = q.currentChange();
			var next_version = currentChange.next_version();
			if(!currentChange.next_version()) {
				throw(new Error("Can't go forward - this is the latest version"));
			}
			var data = q.versionJSON();
			data = jiff.patch(next_version.diff,data);
			q.currentChange(next_version);
			q.load(data);
		};

        this.timeline = ko.observableArray(Editor.timeline.map(function(t){return new Editor.TimelineItem(t)}));

		this.showCondensedTimeline = ko.observable(true);
        
        this.timelineToDisplay = ko.computed(function() {
			if(this.showCondensedTimeline()) {
                var out = [];
				this.timeline().map(function(ev){
					var last = out[out.length-1];
                    if(ev.type=='version') {
                        if(!ev.data.comment() && last && last.type=='version') {
                            return false;
                        }
                        firstVersion = false;
                    }
                    out.push(ev);
                });
                return out;
			} else {
				return this.timeline();
			}
        },this);

        this.stamp = function(status_code) {
            return function() {
                $.post('stamp',{'status': status_code, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(stamp) {
                    e.timeline.splice(0,0,new Editor.TimelineItem({date: stamp.date, user: stamp.user, data: stamp, type: 'stamp'}));
                });
                noty({
                    text: 'Thanks for your feedback!',
                    type: 'success',
                    layout: 'topCenter'
                });
            }
        }

        this.writingComment = ko.observable(false);
        this.commentText = ko.observable('');
        this.commentIsEmpty = ko.computed(function() {
            return $(this.commentText()).text().trim()=='';
        },this);
        this.submitComment = function() {
            if(this.commentIsEmpty()) {
                return;
            }

            var text = this.commentText();
            $.post('comment',{'text': text, csrfmiddlewaretoken: getCookie('csrftoken')}).success(function(comment) {
                e.timeline.splice(0,0,new Editor.TimelineItem({date: comment.date, user: comment.user, data: comment, type: 'comment'}));
            });

            this.commentText('');
            this.writingComment(false);
        }
        this.cancelComment = function() {
            this.commentText('');
            this.writingComment(false);
        }

        this.deleteTimelineItem = function(item) {
            if(item.deleting()) {
                return;
            }
            item.deleting(true);
            $.post(item.data.delete_url,{csrfmiddlewaretoken: getCookie('csrftoken')})
                .success(function() {
                    e.timeline.remove(item);
                })
                .error(function(response,type,message) {
                    if(message=='')
                        message = 'Server did not respond.';

                    noty({
                        text: 'Error deleting timeline item:\n\n'+message,
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

                    item.deleting(false);
                })
            ;
        }
    }
    Exam.prototype = {

        versionJSON: function() {
            var obj = {
                id: this.id,
                author: Editor.examJSON.author,
                locale: Editor.examJSON.locale,
                JSONContent: this.toJSON(),
                metadata: this.metadata(),
                name: this.name(),
                questions: this.questions().map(function(q){return q.toJSON()}),
                theme: this.theme().path
            }
            if(Editor.editable) {
                obj.public_access = this.public_access()
            }
            return obj;
        },

		deleteExam: function(q,e) {
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

			if('metadata' in data) {
				tryLoad(data.metadata,['notes','description'],this);
                var licence_name = data.metadata.licence;
                for(var i=0;i<Editor.licences.length;i++) {
                    if(Editor.licences[i].name==licence_name) {
                        this.licence(Editor.licences[i]);
                        break;
                    }
                }
			}

            var content = data.JSONContent;

            tryLoad(content,['name','percentPass','shuffleQuestions','allQuestions','pickQuestions'],this);
            this.duration((content.duration||0)/60);

            if('navigation' in content)
            {
				tryLoad(content.navigation,['allowregen','reverse','browse','showfrontpage','preventleave'],this);
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
                for(var i=0;i<Editor.themes.length;i++) {
                    if(Editor.themes[i].path==path && Editor.themes[i].custom) {
                        this.theme(Editor.themes[i]);
                        break;
                    }
                }
            } else if('theme' in data) {
                var path = data.theme;
                for(var i=0;i<Editor.themes.length;i++) {
                    if(Editor.themes[i].path==path && !Editor.themes[i].custom) {
                        this.theme(Editor.themes[i]);
                        break;
                    }
                }
            }

            if('locale' in data)
                this.locale(data.locale);

			if('questions' in data)
			{
				this.questions(data.questions.map(function(q) {
					return new Question(q,e.questions)
				}));
			}
        },

        download: function() {
            window.location = Editor.download_url;
        }
    };

    function UserAccess(question,data) {
        var ua = this;
        this.id = data.id;
        this.name = data.name;
        this.access_level = ko.observable(data.access_level || 'view');
        this.remove = function() {
            question.access_rights.remove(ua);
        }
    }
    UserAccess.prototype = {
        access_options: [{value:'view',text:'Can view this'},{value:'edit',text:'Can edit this'}]
    }

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
			viewModel = new Exam(Editor.examJSON);
			ko.applyBindings(viewModel);
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
		window.open(Editor.previewURL,Editor.previewWindow);
	});

});
