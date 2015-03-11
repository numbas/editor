//nice short 'string contains' function
if(!String.prototype.contains)
{
	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
if(!Array.prototype.contains)
{
	Array.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}

//get size of contents of an input
//from http://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
$.textMetrics = function(el) {
	var h = 0, w = 0;

	var div = document.createElement('div');
	document.body.appendChild(div);
	$(div).css({
		position: 'absolute',
		left: -1000,
		top: -1000,
		display: 'none'
	});

	var val = $(el).val();
	val = val.replace(/ /g,'&nbsp;');
	$(div).html(val);
	var styles = ['font-size','font-style', 'font-weight', 'font-family','line-height', 'text-transform', 'letter-spacing'];
	$(styles).each(function() {
		var s = this.toString();
		$(div).css(s, $(el).css(s));
	});

	h = $(div).outerHeight();
	w = $(div).outerWidth();

	$(div).remove();

	var ret = {
	 height: h,
	 width: w
	};

	return ret;
}

var MathJaxQueue;


$(document).ready(function() {
	MathJaxQueue = MathJax.Callback.Queue(MathJax.Hub.Register.StartupHook('End',{}));
	$.fn.mathjax = function() {
		$(this).each(function() {
			MathJaxQueue.Push(['Typeset',MathJax.Hub,this]);
		});
	}

	ko.bindingHandlers.dotdotdot = {
		update: function(element) {
			$(element).dotdotdot({
				watch:true, 
				callback: function() { $(element).mathjax(); }
			});
		}
	}

	ko.bindingHandlers.mathjax = {
		update: function(element) {
			$(element).mathjax();
		}
	};

	ko.bindingHandlers.mathjaxHTML = {
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor()) || '';
			$(element).html(value).mathjax();
		}
	};

	ko.bindingHandlers.addClass = {
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			var oldClass;
			if(oldClass = ko.utils.domData.get(element,'class')) {
				$(element).removeClass(oldClass);
			}
			$(element).addClass(value);
		}
	}

    ko.bindingHandlers.autocomplete = {
        init: function(element,valueAccessor,allBindingsAccessor) {
            var allBindings = allBindingsAccessor();
            var autocompleteCallback = function(e){ return e; };
            if('autocompleteCallback' in allBindings) {
                autocompleteCallback = allBindings.autocompleteCallback;
            }

            var source = ko.utils.unwrapObservable(valueAccessor());

            var dataDict = {};

            if(typeof source == 'string') {
                var url = source;
                source = function(req,callback) {
                    $(element).addClass('loading');
                    $.getJSON(url,{q:req.term})
                        .success(function(data) {
                            dataDict = {};
                            var things = [];
                            for(var i=0;i<data.length;i++) {
                                var thing = autocompleteCallback(data[i]);
                                dataDict[thing.value] = data[i];
                                things.push(thing);
                            }
                            callback(things);
                        })
                        .complete(function() {
                            $(element).removeClass('loading');
                        })
                    ;
                }
            }

            $(element)
                .autocomplete({
                    source: source,
                    select: function(e,ui) {
                        if('value' in allBindings)
                            allBindings.value(ui.item.value);
                        if('autocompleteSelect' in allBindings)
                            allBindings.autocompleteSelect(dataDict[ui.item.value]);
                        $(this).submit();
						$(this).val('');
						e.stopPropagation();
						e.preventDefault();
						return false;
                    }
                })
            ;
        }
    }    

	//automatically resize a text input to fit its contents
	ko.bindingHandlers.autosize = {
		update: function(element,valueAccessor) {
			var settings = { max: null, min: 60, padding: 30 };

			var value = ko.utils.unwrapObservable(valueAccessor());
			if(typeof value == 'object') {
				settings = $.extend(settings,value);
				value = ko.utils.unwrapObservable(settings.value);
			}

			var w = $.textMetrics(element).width + settings.padding;
			w = Math.max(w,settings.min||0);
			if(settings.max!=null)
				w = Math.min(w,settings.max);
			$(element).width(w+'px');
		}
	}

	ko.bindingHandlers.editableHTML = {
		init: function(element, valueAccessor,allBindingsAccessor) {
			var initialValue = ko.utils.unwrapObservable(valueAccessor());
			$(element).attr('contenteditable',true);
			allBindingsAccessor = allBindingsAccessor();
			var placeholder = ko.utils.unwrapObservable(allBindingsAccessor.placeholder) || '';
			$(element).attr('placeholder',placeholder);
			$(element).html(initialValue);
			$(element).on('keyup input', function(e) {
				observable = valueAccessor();
				observable($(element).html());
			});
	  }
	}

})

function getCookie(name) {
	var cookieValue = null;
	if (document.cookie && document.cookie != '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = jQuery.trim(cookies[i]);
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) == (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

