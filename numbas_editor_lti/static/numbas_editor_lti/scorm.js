/** A SCORM API.
 * It provides the `window.API_1484_11` object, which SCORM packages use to interact with the data model.
 *
 * @param {object} data - A dictionary of the SCORM data model
 * @param {number} attempt_pk - the id of the attempt
 */
function SCORM_API(data,attempt_pk) {
    var sc = this;

    this.callbacks = new CallbackHandler();

    this.attempt_pk = attempt_pk;

    /** Key to save data under in localStorage
     */
    this.localstorage_key = 'numbas-lti-attempt-'+this.attempt_pk+'-scorm-data';

    /** A unique ID for this instance of the API, to differentiate it from other clients loading the same attempt.
     */
    this.uid = (new Date()-0)+':'+Math.random();

    this.initialise_data(data);

    this.initialise_api();

}
SCORM_API.prototype = {

    /** Has the API been initialised?
     */
	initialized: false,

    /** Has the API been terminated?
     */
	terminated: false,

    /** The code of the last error that was raised
     */
	last_error: 0,

    /** Setup the SCORM data model.
     *  Merge in elements loaded from the page with elements saved to localStorage, taking the most recent value when there's a clash.
     */
    initialise_data: function(data) {
        var stored_data = this.get_localstorage();

        // merge stored data

        // create the data model
        this.data = {};
        for(var key in data) {
            this.data[key] = data[key];
        }
        if(stored_data.current) {
            for(var key in stored_data.current) {
                this.data[key] = stored_data.current[key];
            }
            this.data['cmi.entry'] = 'resume';
            this.data['cmi.mode'] = this.data['cmi.completion_status'] == 'completed' ? 'review' : 'normal';
        }
        
        /** SCORM display mode - 'normal' or 'review'
         */
        this.mode = this.data['cmi.mode'];

        /** Is the client allowed to change data model elements?
         *  Not allowed in review mode.
         */
        this.allow_set = this.mode=='normal';

        this.callbacks.trigger('initialise_data');
    },

    /** Initialise the SCORM API and expose it to the SCORM activity
     */
    initialise_api: function() {
        var sc = this;

        /** The API object to expose to the SCORM activity
         */
        this.API_1484_11 = {};
        ['Initialize','Terminate','GetLastError','GetErrorString','GetDiagnostic','GetValue','SetValue','Commit'].forEach(function(fn) {
            sc.API_1484_11[fn] = function() {
                return sc[fn].apply(sc,arguments);
            };
        });

        /** Counts for the various lists in the data model
         */
        this.counts = {
            'comments_from_learner': 0,
            'comments_from_lms': 0,
            'interactions': 0,
            'objectives': 0,
        }
        this.interaction_counts = [];

        /** Set the counts based on the existing data model
         */
        for(var key in this.data) {
            this.check_key_counts_something(key);
        }

        this.callbacks.trigger('initialise_api');
    },

    /** Terminate the SCORM API because we were told to by the server, and navigate to the given URL
     */
    external_kill: function(message, url) {
        if(!this.terminated) {
            this.Terminate('');
            alert(message);
            window.location = show_attempts_url;
            this.callbacks.trigger('external_kill');
        }
    },

    /** Store information which hasn't been confirmed received by the server to localStorage.
     */
    set_localstorage: function() {
        try {
            var data = {
                current: this.data,
                save_time: (new Date())-0
            }
            window.localStorage.setItem(this.localstorage_key, JSON.stringify(data));
            this.localstorage_used = true;
        } catch(e) {
            this.localstorage_used = false;
        }
        this.callbacks.trigger('set_localstorage');
    },

    /** Load saved information from localStorage.
     * @returns {object} of the form `{sent: {id: [{key,value,time,counter}]}}`
     */
    get_localstorage: function() {
        try {
            var stored = window.localStorage.getItem(this.localstorage_key);
            if(stored===null) {
                throw(new Error());
            } else {
                return JSON.parse(stored);
            }
        } catch(e) {
            return {};
        }
    },

    /** For a given data model key, if it belongs to a list, update the counter for that list
     */
    check_key_counts_something: function(key) {
        var m;
        if(m=key.match(/^cmi.(\w+).(\d+)/)) {
            var ckey = m[1];
            var n = parseInt(m[2]);
            this.counts[ckey] = Math.max(n+1, this.counts[ckey]);
            this.data['cmi.'+ckey+'._count'] = this.counts[ckey];
            if(ckey=='interactions' && this.interaction_counts[n]===undefined) {
                this.interaction_counts[n] = {
                    'objectives': 0,
                    'correct_responses': 0
                }
            }
        }
        if(m=key.match(/^cmi.interactions.(\d+).(objectives|correct_responses).(\d+)/)) {
            var n1 = parseInt(m[1]);
            var skey = m[2];
            var n2 = parseInt(m[3]);
            this.interaction_counts[n1][skey] = Math.max(n2+1, this.interaction_counts[n1][skey]);
            this.data['cmi.interactions.'+n1+'.'+skey+'._count'] = this.interaction_counts[n1][skey];
        }
    },

	Initialize: function(b) {
        this.callbacks.trigger('Initialize',b);
        if(b!='' || this.initialized || this.terminated) {
			return false;
		}
		this.initialized = true;
		return true;
	},

	Terminate: function(b) {
        this.callbacks.trigger('Terminate',b);
		if(b!='' || !this.initialized || this.terminated) {
			return false;
		}
		this.terminated = true;
        document.body.classList.add('terminated');
        this.set_localstorage();

		return true;
	},

	GetLastError: function() {
		return this.last_error;
	},

	GetErrorString: function(code) {
		return "I haven't written any error strings yet.";
	},

	GetDiagnostic: function(code) {
		return "I haven't written any error handling yet.";
	},

	GetValue: function(key) {
		var v = this.data[key];
        if(v===undefined) {
            return '';
        } else {
            return v;
        }
	},

	SetValue: function(key,value) {
        if(!this.allow_set) {
            return;
        }
        value = (value+'');
        var changed = value!=this.data[key];
        if(changed) {
    		this.data[key] = value;
            this.check_key_counts_something(key);
        }
        this.callbacks.trigger('SetValue',key,value,changed);
	},

    Commit: function(s) {
        this.set_localstorage();
        this.callbacks.trigger('Commit');
        return true;
    }
}

function CallbackHandler() {
    this.callbacks = {};
}
CallbackHandler.prototype = {
    on: function(key,fn) {
        if(this.callbacks[key] === undefined) {
            this.callbacks[key] = [];
        }
        this.callbacks[key].push(fn);
    },
    trigger: function(key) {
        if(!this.callbacks[key]) {
            return;
        }
        var args = Array.prototype.slice.call(arguments,1);
        this.callbacks[key].forEach(function(fn) {
            fn.apply(this,args);
        });
    }
}

/** A single SCORM data model element, with the time it was set.
 */
function SCORMData(key,value,time,counter) {
    this.key = key;
    this.value = value;
    this.time = time;
    this.counter = counter;
}
SCORMData.prototype = {
    as_json: function() {
        return {
            key: this.key,
            value: this.value,
            time: this.timestamp(),
            counter: this.counter
        }
    },

    timestamp: function() {
        return this.time.getTime()/1000
    }
}
