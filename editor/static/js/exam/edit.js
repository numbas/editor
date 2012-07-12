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
        this.realName = ko.observable('An Exam');
		this.name = ko.computed({
			read: this.realName,
			write: function(value) {
				if(value.length)
						this.realName(value);
			},
			owner: this
		});

        this.notes = ko.observable('');
		this.description = ko.observable('');
		this.metadata = ko.computed(function() {
			return {
				notes: this.notes(),
				description: this.description()
			};
		},this);

		this.theme = ko.observable('default');

        this.duration = ko.observable(0);
        this.percentPass = ko.observable(50);
        this.shuffleQuestions = ko.observable(false);
        this.showfrontpage = ko.observable(true);

        this.allowregen = ko.observable(true);
        this.reverse = ko.observable(true);
        this.browse = ko.observable(true);

        this.onadvance = ko.observable(null);
        this.onreverse = ko.observable(null);
        this.onmove = ko.observable(null);

        this.timeout = ko.observable(null);
        this.timedwarning = ko.observable(null);

        this.showactualmark = ko.observable(true);
        this.showtotalmark = ko.observable(true);
        this.showanswerstate = ko.observable(true);
        this.allowrevealanswer = ko.observable(true);
        this.advicethreshold = ko.observable(0);

		this.questions = ko.observableArray([]);

		this.questionSearch = ko.observable('');
		this.questionSearchResults = ko.observableArray([]);
		this.searching = ko.observable(false);
		ko.computed(function() {
			var search = this.questionSearch();
			if(search.length)
			{
				var vm = this;
				this.searching(true);
				$.getJSON('/questions/search/',{q:this.questionSearch()})
					.success(function(data) {
                        var questions = data.object_list.map(function(d) {
                            return new Question(d,vm.questionSearchResults);
                        });
						vm.questionSearchResults(questions);
					})
					.complete(function() {
						vm.searching(false);
					});
				;
			}
			else {
				this.questionSearchResults([]);
			}
		},this).extend({throttle:100});

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

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);
        
        this.output = ko.computed(function() {
            return prettyData(this.toJSON());
        },this);

        if(data)
		{
			this.id = data.id;

			if('metadata' in data) {
				tryLoad(data.metadata,['notes'],this);
			}

            this.load(parseExam(data.content));

            if('theme' in data)
                this.theme(data.theme);

			if('questions' in data)
			{
				this.questions(data.questions.map(function(q) {
					return new Question(q,e.questions)
				}));
			}
		}

        this.save = ko.computed(function() {
			window.onbeforeunload = function() {
				return 'There are still unsaved changes.';
			}
            return {
				content: this.output(),
                theme: this.theme(),
				metadata: this.metadata(),
				questions: this.questions()
							.filter(function(q){return q.id()>0})
							.map(function(q){ return q.id(); })
			};
		},this);

		this.autoSave = ko.computed(function() {
            var e = this;

			if(!this.save_noty)
			{
				this.save_noty = noty({
					text: 'Saving...', 
					layout: 'topCenter', 
					type: 'information',
					timeout: 0, 
					speed: 150,
					closeOnSelfClick: false, 
					closeButton: false
				});
			}
			
            $.post(
                '/exam/'+this.id+'/'+slugify(this.name())+'/',
                {json: JSON.stringify(this.save()), csrfmiddlewaretoken: getCookie('csrftoken')}
            )
                .success(function(data){
                    var address = location.protocol+'//'+location.host+'/exam/'+Editor.examJSON.id+'/'+slugify(e.name())+'/';
                    if(history.replaceState)
                        history.replaceState({},e.name(),address);
					noty({text:'Saved.',type:'success',timeout: 1000, layout: 'topCenter'});
                })
                .error(function(response,type,message) {
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
				.complete(function() {
					window.onbeforeunload = null;
					$.noty.close(viewModel.save_noty);
					viewModel.save_noty = null;
				})
            ;
        },this).extend({throttle:1000});

    }
    Exam.prototype = {
		deleteExam: function(q,e) {
			if(window.confirm('Really delete this exam?')) {
				$(e.target).find('form').submit();
			}
		},

		dropQuestion: function(data) {
            data.item.parent = data.targetParent;
            if(data.sourceParent==viewModel.questionSearchResults && data.targetParent != viewModel.questionSearchResults) {
                var clone = data.item.clone();
                clone.parent = data.sourceParent;
                viewModel.questionSearchResults.splice(data.sourceIndex,0,clone);
            }
		},

        //returns a JSON-y object representing the exam
        toJSON: function() {
            return {
                name: this.name(),
                duration: this.duration()*60,
                percentPass: this.percentPass(),
                shuffleQuestions: this.shuffleQuestions(),
                navigation: {
					allowregen: this.allowregen(),
                    reverse: this.reverse(),
                    browse: this.browse(),
                    showfrontpage: this.showfrontpage(),
                    onadvance: this.onadvance.toJSON(),
                    onreverse: this.onreverse.toJSON(),
                    onmove: this.onmove.toJSON()
                },
                timing: {
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

        load: function(data) {
            tryLoad(data,['name','percentPass','shuffleQuestions'],this);
            this.duration((data.duration||0)/60);

            if('navigation' in data)
            {
				tryLoad(data.navigation,['allowregen','reverse','browse','showfrontpage'],this);
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
                tryLoad(data.feedback,['showactualmark','showtotalmark','showanswerstate','allowrevealanswer','advicethreshold'],this);
            }
        },

        download: function() {
            window.location = Editor.download_url;
        }
    };

    function Event(name,niceName,actions)
    {
        this.name = name;
        this.niceName = niceName;
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
		this.id = ko.observable(data.id);
		this.name = ko.observable(data.name);
		this.url = ko.observable(data.url);
		this.parent = parent;
	}
	Question.prototype = {
		remove: function() {
			this.parent.remove(this);
		},

		toJSON: function() {
			return {
				id: this.id(),
				name: this.name()
			};
		},

        clone: function() {
            return new Question({
                id: this.id(),
                name: this.name(),
                url: this.url()
            },this.parent);
        }
	}

	Numbas.loadScript('scripts/jme-display.js');
	Numbas.loadScript('scripts/jme.js');
	Numbas.loadScript('scripts/editor-extras.js');
	Numbas.startOK = true;
	Numbas.init = function() {
		//create an exam object
		viewModel = new Exam(Editor.examJSON);
		ko.applyBindings(viewModel);
	};
	Numbas.tryInit();
});
