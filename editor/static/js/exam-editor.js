$(document).ready(function() {
    function Exam()
    {
        this.name = ko.observable('An Exam');
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
        this.allowreavealanswer = ko.observable(true);
        this.advicethreshold = ko.observable(0);

        var rulesets = this.rulesets = ko.observableArray([]);
        this.allsets = ko.computed(function() {
            return Editor.builtinRulesets.concat(rulesets().map(function(r){return r.name()})).sort();
        });

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
            $('title').text(this.name() ? this.name()+' - Numbas Editor' : 'Numbas Editor');
        },this);
        
        this.output = ko.computed(function() {
            return prettyData(this.export());
        },this);

        this.save = ko.computed(function() {
            var data = this.export();
        },this);

        if(data)
            this.load(data);
    }
    Exam.prototype = {
        addRuleset: function() {
            this.rulesets.push(new Ruleset(this));
        },

        //returns a JSON-y object representing the exam
        export: function() {
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
                    onadvance: this.onadvance.export(),
                    onreverse: this.onreverse.export(),
                    onmove: this.onmove.export()
                },
                timing: {
                    timeout: this.timeout.export(),
                    timedwarning: this.timedwarning.export()
                },
                feedback: {
                  showactualmark: this.showactualmark(),
                  showtotalmark: this.showtotalmark(),
                  showanswerstate: this.showanswerstate(),
                  allowreavealanswer: this.allowreavealanswer(),
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
                ['showactualmark','showtotalmark','showanswerstate','allowreavealanswer','advicethreshold'].map(function(n){
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
        export: function() {
            return {
                action:this.actionName(),
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

    //create a question object
    var data = examJSON.content;
    data = parseExam(data);
    viewModel = new Exam(data);
    ko.applyBindings(viewModel);

});
