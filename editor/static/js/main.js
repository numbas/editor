//nice short 'string contains' function
if(!String.prototype.contains)
{
	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
if(!Array.prototype.contains)
{
	Array.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
$(document).ready(function() {
	var MathJaxQueue = MathJax.Callback.Queue(MathJax.Hub.Register.StartupHook('End',{}));
	$.fn.mathjax = function() {
		$(this).each(function() {
			MathJaxQueue.Push(['Typeset',MathJax.Hub,this]);
		});
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

