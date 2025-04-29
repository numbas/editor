(function() {
//nice short 'string contains' function
if(!String.prototype.contains)
{
    String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
if(!Array.prototype.contains)
{
    Array.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}

var measurer;
var measureText_cache = {};
/** Measure the rendered size of text in an input element.
 *
 * @param {Element} element - An element whose style will be used. 
 * @param {string} str - The text to measure.
 * @returns {DOMRect}
 */
window.measureText = function(element, str) {
    var styles = window.getComputedStyle(element);

    if(!measurer) {
        measurer = document.createElement('div');
        measurer.style['position'] = 'absolute';
        measurer.style['left'] = '-10000';
        measurer.style['top'] = '-10000';
        measurer.style['visibility'] = 'hidden';
    }

    var keys = ['font-size','font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
    var id = element.value+';'+keys.map(function(key) { return styles[key]; }).join(';');
    if(measureText_cache[id]) {
        return measureText_cache[id];
    }
    keys.forEach(function(key) {
        measurer.style[key] = styles[key];
    });
    measurer.textContent = str;
    document.body.appendChild(measurer);
    var box = measurer.getBoundingClientRect();
    measureText_cache[id] = box;
    document.body.removeChild(measurer);
    return box;
}


$(document).ready(function() {
    window.Knockout = ko;

    ko.onError = function(e) {
        console.log(e);
    }

    let mj_promise = MathJax.startup.promise;

    function mathjax_typeset_element(element) {
        mj_promise = mj_promise.then(async () => {
            MathJax.typesetClear([element]);
            await MathJax.typesetPromise([element]);
        })
        return mj_promise;
    }
    window.mathjax_typeset_element = mathjax_typeset_element;

    ko.observable.fn.toggleable = function() {
        var o = this;
        this.toggle = function() {
            o(!o());
        }
        return o;
    }

    ko.bindingHandlers.mathjax = {
        update: function(element) {
            if(!window.noMathJax) {
                mathjax_typeset_element(element);
            }
        }
    };

    ko.bindingHandlers.mathjaxHTML = {
        update: function(element,valueAccessor) {
            var value = ko.unwrap(valueAccessor()) || '';
            element.innerHTML = value;
            mathjax_typeset_element(element);
        }
    };

    ko.bindingHandlers.addClass = {
        update: function(element,valueAccessor) {
            var value = ko.unwrap(valueAccessor());
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
            var delay = allBindings.delay || 0;

            var source = ko.unwrap(valueAccessor());

            if(typeof source == 'string') {
                var dataDict = {};

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
                    delay: delay,
                    select: function(e,ui) {
                        if('value' in allBindings)
                            allBindings.value(ui.item.value);
                        if('autocompleteSelect' in allBindings)
                            allBindings.autocompleteSelect(dataDict ? dataDict[ui.item.value] : ui.item.value);
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
            var settings = { max: null, min: 60, padding: 30, useValue: true };
            var str = '';
            var placeholder = element.getAttribute('placeholder') || '';

            function resizeF(str) {
                var w = Math.max(measureText(element, str).width, measureText(element, placeholder).width);
                w = Math.max(w, settings.min || 0);
                if(settings.max !== null) {
                    w = Math.min(w, settings.max);
                }
                const style = getComputedStyle(element);
                w = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + w;
                element.style['width'] = w+'px';
                element.style['max-width'] = '100%';
            };

            var value = ko.unwrap(valueAccessor());
            if(value !== true) {
                var str = value+'';
                if(typeof value == 'object') {
                    settings = Object.assign(settings,value);
                    value = ko.unwrap(settings.value);
                    str = settings.useValue ? value : '';
                }
                resizeF(str);
            } else {
                ['keypress','keydown','keyup','change'].forEach(evt => {
                    element.addEventListener(evt, resizeF);
                });
                resizeF(element.value);
            }
        }
    }

    ko.bindingHandlers.editableHTML = {
        init: function(element, valueAccessor,allBindingsAccessor) {
            var initialValue = ko.unwrap(valueAccessor());
            $(element).attr('contenteditable',true);
            allBindingsAccessor = allBindingsAccessor();
            var placeholder = ko.unwrap(allBindingsAccessor.placeholder) || '';
            $(element).attr('placeholder',placeholder);
            $(element).html(initialValue);
            $(element).on('keyup input', function(e) {
                observable = valueAccessor();
                observable($(element).html());
            });
      }
    }

})

window.getCookie = function(name) {
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

window.getCSRFtoken = function() {
    var inp = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if(inp) {
        return inp.value;
    } else {
        return getCookie('csrftoken');
    }
}
})();

/*
 * jQuery UI Autocomplete HTML Extension
 *
 * Copyright 2010, Scott González (http://scottgonzalez.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/scottgonzalez/jquery-ui-extensions
 */
(function( $ ) {

var proto = $.ui.autocomplete.prototype,
    initSource = proto._initSource;

function filter( array, term ) {
    var matcher = new RegExp( $.ui.autocomplete.escapeRegex(term), "i" );
    return $.grep( array, function(value) {
        return matcher.test( $( "<div>" ).html( value.label || value.value || value ).text() );
    });
}

    $.extend( proto, {
        _initSource: function() {
            if ( this.options.html && $.isArray(this.options.source) ) {
                this.source = function( request, response ) {
                    response( filter( this.options.source, request.term ) );
                };
            } else {
                initSource.call( this );
            }
        },

        _renderItem: function( ul, item) {
            return $( "<li></li>" )
                .data( "item.autocomplete", item )
                .append( $( "<a></a>" )[ this.options.html ? "html" : "text" ]( item.label ) )
                .appendTo( ul );
        }
    });

})( jQuery );
