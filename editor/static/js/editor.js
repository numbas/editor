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
var prettyData,mapLoad,slugify;
if(!window.Editor)
    window.Editor = {};

$(document).ready(function() {

    Editor.getCookie = function(name) {
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

    slugify = function(s) {
        return s.trim().replace(/[^\w\s]/g,'').toLowerCase().replace(/\s/g,'-');
    };

    mapLoad = function(data) {
        return function(n) {                    
            if(n in data)
                this[n](data[n]);
        };
    };

    function indent(s,n)
    {
        //if n is not given, set n=1
        if(n===undefined)
            n=1;

        var lines = s.split('\n');
        for(var tabs='';tabs.length<n;tabs+='  '){}

        for(var i=0;i<lines.length;i++)
        {
            lines[i] = tabs+lines[i];
        }
        return lines.join('\n');
    }

    //represent a JSON-esque object in the Numbas .exam format
    prettyData = function(data){
        switch(typeof(data))
        {
        case 'number':
            return data+'';
        case 'string':
            //this tries to use as little extra syntax as possible. Quotes or triple-quotes are only used if necessary.
            if(data.contains('"'))
                return '"""'+data+'"""';
            if(data.search(/[\n,\{\}\[\] ]/)>=0)
                return '"'+data+'"';
            else if(!data.trim())
                return '""';
            else
                return data;
        case 'boolean':
            return data ? 'true' : 'false';
        case 'object':
            if($.isArray(data))    //data is an array
            {
                if(!data.length)
                    return '[]';    //empty array

                data = data.map(prettyData);    //pretty-print each of the elements

                //decide if the array can be rendered on a single line
                //if any element contains a linebreak, render array over several lines
                var multiline=false;
                for(var i=0;i<data.length;i++)
                {
                    if(data[i].contains('\n'))
                        multiline = true;
                }
                if(multiline)
                {
                    data=data.map(function(s){return indent(s)});
                    return '[\n'+data.join('\n')+'\n]';
                }
                else
                {
                    return '[ '+data.join(', ')+' ]';
                }
            }
            else    //data is an object
            {
                if(!Object.keys(data).filter(function(x){return x}).length)
                    return '{}';
                var o='{\n';
                for(var x in data)
                {
                    if(x)
                        o += indent(x+': '+prettyData(data[x]))+'\n';
                }
                o+='}';
                return o;
            }
        }
    };

    Editor.builtinRulesets = ['basic','unitFactor','unitPower','unitDenominator','zeroFactor','zeroTerm','zeroPower','noLeadingMinus','collectNumbers','simplifyFractions','zeroBase','constantsFirst','sqrtProduct','sqrtDivision','sqrtSquare','trig','otherNumbers']

    Editor.Ruleset = function(exam,data)
    {
        this.name = ko.observable('ruleset'+exam.rulesets().length);
        this.sets = ko.observableArray([]);
        this.allsets = exam.allsets;
        this.remove = function() {
            if(confirm("Remove this ruleset?"))
                exam.rulesets.remove(this);
        };
        if(data)
            this.load(data);
    }
    Editor.Ruleset.prototype = {
        load: function(data) {
            var ruleset = this;
            this.name(data.name);
            data.sets.map(function(set){ ruleset.sets.push(set); });
        }
    };

    Editor.Variable = function(q,data) {
        this.name = ko.observable('');
        this.definition = ko.observable('');
		this.value = ko.observable('');
		this.error = ko.observable('');
		this.display = ko.computed(function() {
			var v;
			if(this.error())
				return this.error();
			else if(v = this.value())
			{
				switch(v.type)
				{
				case 'string':
					return v.value;
				default:
					return '$'+Numbas.jme.display.texify({tok:this.value()})+'$';
				}
			}
			else
				return '';
		},this);
        this.remove = function() {
            q.variables.remove(this);
        };
        if(data)
            this.load(data);
    }
    Editor.Variable.prototype = {
        load: function(data) {
            this.name(data.name);
            this.definition(data.definition);
        }
    }



    //make folders work
    $('.fold > #folder-header').live('click',function() {
        $(this).siblings('#folder').toggle(150,function() {
            var p = $(this).parent();
            p.hasClass('folded') ? p.removeClass('folded') : p.addClass('folded');
        });
    });

    ko.bindingHandlers.writemaths = {
        init: function(element,valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()) || '';
            var d = $('<div/>');
            $(element).append(d);
            var wm = new WriteMaths(d);
            wm.setState(value);
            $(element).bind('input',function() {
                valueAccessor()(d.attr('value'));
            });
        },
        update: function(element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).find('.writemaths').trigger('setstate',value);
        }
    };
    
    ko.bindingHandlers.foldlist = {
        init: function(element,valueAccessor,allBindingsAccessor,viewModel)
        {
            var value = valueAccessor(), allBindings = allBindingsAccessor();
            var show = allBindings.show;

            element=$(element);
            var f=$('<div class="fold"><div id="folder-header"></div><div id="folder"></div></div>');
            f.find('#folder-header').html(ko.utils.unwrapObservable(allBindings.label));
            if(show)
                f.find('#folder').css('display','block');
            element.contents().appendTo(f.find('#folder'));
            var b = $('<button class="remove" data-bind="click:remove"></button>');
            b.click(function(){viewModel.remove()});
            element.append(b);
            element.append(f);
        },
        update: function(element,valueAccessor,allBindingsAccessor)
        {
            var value = valueAccessor(), allBindings = allBindingsAccessor();
            $(element).find('>.fold>#folder-header').html(ko.utils.unwrapObservable(allBindings.label));
        }
    };

    ko.bindingHandlers.fadeVisible = {
        init: function (element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.utils.unwrapObservable(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function (element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            ko.utils.unwrapObservable(value) ? $(element).slideDown(150) : $(element).slideUp(150);
        }
    };

    ko.bindingHandlers.listbox = {
        init: function(element,valueAccessor) {
            var value = valueAccessor();
            $(element).addClass('listbox');

            var i = $('<input/>');
            i.keydown(function(e){
                switch(e.which)
                {
                case 13:
				case 188:
                    var val = $(this).val().slice(0,this.selectionStart);
                    if(val.length)
                        value.push(val);
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).val($(this).val().slice(val.length));
                    break;
                case 8:
                    if(this.selectionStart==0 && this.selectionEnd==0)
                    {
                        var oval = $(this).val();
                        var val = (value.pop() || '').slice(0,-1);
                        $(this).val(val+oval);
                        this.setSelectionRange(val.length,val.length);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
                }
            });
            i.blur(function(e){
                var val = $(this).val();
                if(val.length)
                    value.push(val);
                $(this).val('');
            });
            $(element).append('<ul/>');
            $(element).append(i);
            $(element).delegate('li','click',function(){
                var n = $(this).index();
                i.val(value()[n]).focus();
                value.splice(n,1);
            });
        },
        update: function(element,valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            $(element).find('ul li').remove();
            for(var i=0;i<value.length;i++)
            {
                $(element).find('ul').append($('<li/>').html(value[i]));
            }
        }
    }

	//connect items with observableArrays
	ko.bindingHandlers.sortableList = {
		init: function(element, valueAccessor, allBindingsAccessor, context) {
			var list = valueAccessor();
			var startPos = 0;
			$(element).sortable({
				handle: '.handle',
				placeholder: 'sort-placeholder',
				start: function(e, ui) {
					startPos = ui.item.prevAll().length;
				},
				update: function(e, ui) {
					var newPos = ui.item.prevAll().length;
					var item = list()[startPos];
					list.remove(item);
					list.splice(newPos,0,item);
					ui.item.remove();
					return;
				}
			});
		}
	};

	ko.bindingHandlers.searchClick = {
		init: function(element, valueAccessor, allBindingsAccessor, context) {
			var obj = valueAccessor();
			var show = $('<span></span>').addClass('name');
			var input = $('<input type="text"></input>');
			$(element).addClass('searchClick').append(show,input);

			var value = obj.value();
			show.html(value);
			input.val(value);

			function showName() {
				show.show();
				input.hide();
			}
			function showInput() {
				show.hide();
				input.show().select();
			}

			show.click(function() {
				showInput();
			});

			input
				.autocomplete({
					minLength: 0,
					source: function(request,response) {
						$.getJSON('/question/search/', {q:request.term})
							.success(function(data) {
								var results = data.object_list;
								response( results.map(function(q){
									return {
										label: q.name,
										value: q.name,
										q: q
									}
								}));
							})
						;
					},
					select: function(e, ui) {
						var q = ui.item.q;
						context.name(q.name);
						context.id(q.id);
						showName();

						e.preventDefault();
					},
					change: function(e, ui) {
						input.val(obj.value());
						showName();
					}
				})
				.blur(function() {
					input.val(obj.value());
					showName();
				})
			;

			showName();
		},
		update: function(element, valueAccessor, allBindingsAccessor) {
			var obj = valueAccessor();
			var value = obj.value();
			$(element)
				.find('.name').html(value ? value : 'No question selected!')
				.end()
				.find('input').val(value);
		}
	}

	ko.bindingHandlers.mathjax = {
		update: function(element) {
			$(element).mathjax();
		}
	};
});
