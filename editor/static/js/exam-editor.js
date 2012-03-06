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
        this.name = ko.observable('An Exam');

		this.tags = ko.observableArray([]);
		this.metadata = ko.observable('');

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
        this.allowrevealanswer = ko.observable(true);
        this.advicethreshold = ko.observable(0);

        var rulesets = this.rulesets = ko.observableArray([]);
        this.allsets = ko.computed(function() {
            return Editor.builtinRulesets.concat(rulesets().map(function(r){return r.name()})).sort();
        });

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

        ko.computed(function() {
            document.title = this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor';
        },this);
        
        this.output = ko.computed(function() {
            return prettyData(this.toJSON());
        },this);

        if(data)
		{
			this.id = data.id;
            this.load(parseExam(data.content));
			if('questions' in data)
			{
				this.questions(data.questions.map(function(q) {
					return new Question(q.id,q.name,this)
				}));
			}
		}

        this.save = ko.computed(function() {
            return {
				content: this.output(),
				tags: this.tags(),
				metadata: this.metadata(),
				questions: this.questions().filter(function(q){return q.id()>0}).map(function(q){ return q.toJSON(); }),
			};
		},this);

		this.autoSave = ko.computed(function() {
            var e = this;
            $.post(
                '/exam/'+this.id+'/'+slugify(this.name())+'/',
                {json: JSON.stringify(this.save()), csrfmiddlewaretoken: Editor.getCookie('csrftoken')}
            )
                .success(function(data){
                    var address = location.protocol+'//'+location.host+'/exam/'+examJSON.id+'/'+slugify(e.name())+'/';
                    if(history.replaceState)
                        history.replaceState({},e.name(),address);
                })
                .error(function(xhr,type,message) {
					noty({
						text: textile('Error saving exam:\n\n'+message),
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
            ;
        },this).extend({throttle:1000});

    }
    Exam.prototype = {
        addRuleset: function() {
            this.rulesets.push(new Ruleset(this));
        },

		addQuestion: function() {
			this.questions.push(new Question(0,'',this));
		},

        //returns a JSON-y object representing the exam
        toJSON: function() {
            var rulesets = {};
            this.rulesets().map(function(r){
                rulesets[r.name()] = r.sets();
            });
            return {
                name: this.name(),
                duration: this.duration()*60,
                percentPass: this.percentPass(),
                shuffleQuestions: this.shuffleQuestions(),
                navigation: {
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
                },
                rulesets: rulesets,
            };
        },

        load: function(data) {
            ['name','percentPass','shuffleQuestions'].map(mapLoad(data),this);
            this.duration((data.duration||0)/60);

            if('navigation' in data)
            {
                ['reverse','browse','showfrontpage'].map(function(n){
                    if(n in data)
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
                ['showactualmark','showtotalmark','showanswerstate','allowrevealanswer','advicethreshold'].map(function(n){
                    this[n](data.feedback[n]);
                },this);
            }

            if('rulesets' in data)
            {
                for(var x in data.rulesets)
                {
                    this.rulesets.push(new Ruleset(this,{name: x, sets:data.rulesets[x]}));
                }
            }
        },

		showPreview: function() {
			var e = this;
			if(e.preview)
				e.preview.close();
			$.post(
				Editor.exam_preview_url,
                {json: JSON.stringify(e.save()), csrfmiddlewaretoken: Editor.getCookie('csrftoken')}
			)
			.success(function(response, status, xhr) {
				e.preview = window.open(response.url);
			})
			.error(function(response, status, xhr) {
				noty({text:response.responseText,timeout:0});
				var responseObj = $.parseJSON(response.responseText);
				var message = textile('h3. Error making the preview:\n\n'+responseObj.message+'\n\n'+responseObj.traceback);
				noty({
					text: message,
					layout: "center",
					type: "error",
					animateOpen: {"height":"toggle"},
					animateClose: {"height":"toggle"},
				timeout: false,
					speed: "500",
					closable: true,
					closeOnSelfClick: true,
				});
			});
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
        this.message = ko.observable('')
    }
    Event.prototype = {
        toJSON: function() {
            return {
                action: this.actionName(),
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

	function Question(id,name,exam)
	{
		this.id = ko.observable(id);
		this.name = ko.observable(name);
		this.exam = exam;
		
		this.selected = ko.observable(true);
	}
	Question.prototype = {
		remove: function() {
			this.exam.questions.remove(this);
		},

		select: function() {
			this.selected(true);
		},

		deselect: function() {
			this.selected(false);
		},

		toJSON: function() {
			return {
				id: this.id(),
				name: this.name()
			};
		}
	}

    //create an exam object
    viewModel = new Exam(examJSON);
    ko.applyBindings(viewModel);
});
