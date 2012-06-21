//nice short 'string contains' function
if(!String.prototype.contains)
{
	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
if(!Array.prototype.contains)
{
	Array.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
var MathJaxQueue;
$(document).ready(function() {
	MathJaxQueue = MathJax.Callback.Queue(MathJax.Hub.Register.StartupHook('End',{}));
	$.fn.mathjax = function() {
		$(this).each(function() {
			MathJaxQueue.Push(['Typeset',MathJax.Hub,this]);
		});
	}

    ko.bindingHandlers.autocomplete = {
        init: function(element,valueAccessor,allBindingsAccessor) {
            var allBindings = allBindingsAccessor();
            var autocompleteCallback = function(e){ return e; };
            if('autocompleteCallback' in allBindings) {
                autocompleteCallback = allBindings.autocompleteCallback;
            }

            var source = ko.utils.unwrapObservable(valueAccessor());

            if(typeof source == 'string') {
                var url = source;
                source = function(req,callback) {
                    $(element).addClass('loading');
                    $.getJSON(url,{q:req.term})
                        .success(function(data) {
                            var things = data.object_list.map(autocompleteCallback);
                            callback(things);
                        })
                        .complete(function() {
                            $(element).removeClass('loading');
                        })
                    ;
                }
            }

            $(element).autocomplete({
                source: source,
                select: function() {$(this).change()}
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

