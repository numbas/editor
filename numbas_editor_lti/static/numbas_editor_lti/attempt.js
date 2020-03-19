var lti_data = JSON.parse(document.getElementById('lti-data').textContent)
var context_key = lti_data.lti_context_pk+'-'+lti_data.exam_pk;
var scorm_cmi = JSON.parse(document.getElementById('scorm-cmi').textContent);

function Attempt(controller,id) {
    this.controller = controller;
    this.id = id;
    this.sc = new SCORM_API(scorm_cmi, context_key+'-'+id);
    this.completion_status = ko.observable('incomplete');
    this.resume_label = ko.pureComputed(function() {
        return this.completion_status()=='completed' ? 'Review' : 'Resume';
    },this);
    this.start_time = ko.observable(new Date());
    this.current_score = ko.observable(0);
}
Attempt.prototype = {
    last_sent_score: 0,

    begin: function() {
        var sc = this.sc;
        this.controller.begin_attempt(this);

        var attempt = this;
        window.API_1484_11 = this.sc.API_1484_11;
        
        var iframe = this.iframe = document.createElement('iframe');
        iframe.setAttribute('src',lti_data.exam_url);
        iframe.classList.add('exam');
        document.getElementById('exams').appendChild(iframe);

        sc.callbacks.on('SetValue',function(key,value,changed) {
            if(key!='cmi.completion_status') {
                return;
            }
            attempt.completion_status(value);
        })
        sc.callbacks.on('SetValue',function(key,value,changed) {
            if(key!='cmi.score.scaled') {
                return;
            }
            attempt.current_score(value);
        });
        sc.callbacks.on('Commit',function() {
            if(attempt.current_score() != attempt.last_sent_score) {
                attempt.send_score();
            }
            attempt.controller.save();
        });
    },

    send_score: function() {
        var csrf = document.cookie.split(';').map(x=>x.split('=')).find(x=>x[0]=='csrftoken')[1]
        var formData = new FormData(); 
        formData.append('score',this.current_score());
        fetch('post_result',{
            method:'POST',
            credentials:'same-origin',
            headers:{'X-CSRFToken':csrf},
            body:formData
        });
        this.last_sent_score = this.current_score();
    },

    end: function() {
        window.API_1484_11 = null;
        this.iframe.parentNode.removeChild(this.iframe);
    }
}

function Controller() {
    this.localstorage_key = 'numbas-lti-'+context_key+'-attempts';

    this.attempts = ko.observableArray([]);
    this.current_attempt = ko.observable(null);

    this.load();

    var attempts = this.attempts();
    if(!attempts.length) {
        this.new_attempt();
    } else {
        attempts[attempts.length-1].begin();
    }
}
Controller.prototype = {
    mode: 'one attempt',

    new_attempt: function() {
        var a = new Attempt(this,this.attempts().length);
        this.attempts.push(a);
        a.start_time(new Date());
        a.begin();
    },

    begin_attempt: function(attempt) {
        this.end_attempt();

        this.current_attempt(attempt);
        this.save();
    },

    end_attempt: function() {
        if(this.current_attempt()) {
            this.current_attempt().end();
        }
        this.current_attempt(null);
    },

    save: function() {
        var data = {
            attempts: this.attempts().map(function(a) {
                return {
                    id: a.id,
                    start_time: a.start_time(),
                    score: a.current_score()
                }
            })
        };
        localStorage.setItem(this.localstorage_key,JSON.stringify(data));
    },

    load: function() {
        var c = this;
        var data_json = localStorage.getItem(this.localstorage_key);
        if(data_json) {
            var data = JSON.parse(data_json);
            data.attempts.forEach(function(ad) {
                var a = new Attempt(c,ad.id);
                a.start_time(new Date(ad.start_time));
                a.current_score(ad.score);
                c.attempts.push(a);
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", function(){
    var c = window.c = new Controller();
    ko.applyBindings(c);
});
