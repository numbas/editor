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
var prettyData,tryLoad,makeContent,slugify;
if(!window.Editor)
	window.Editor = {};

//knockout-sortable | (c) 2012 Ryan Niemeyer | http://www.opensource.org/licenses/mit-license
(function(ko, $, undefined) {
var ITEMKEY = "ko_sortItem",
    LISTKEY = "ko_sortList",
    PARENTKEY = "ko_parentList";

//internal afterRender that adds meta-data to children
var addMetaDataAfterRender = function(elements, data) {
    ko.utils.arrayForEach(elements, function(element) {
        if (element.nodeType === 1) {
            ko.utils.domData.set(element, ITEMKEY, data);
            ko.utils.domData.set(element, PARENTKEY, ko.utils.domData.get(element.parentNode, LISTKEY));
        }
    });
};

//prepare the proper options for the template binding
var prepareTemplateOptions = function(valueAccessor) {
    var result = {},
        options = ko.utils.unwrapObservable(valueAccessor()),
        actualAfterRender;

    //build our options to pass to the template engine
    if (options.data) {
        result.foreach = options.data;
        result.name = options.template;
    } else {
        result.foreach = valueAccessor();
    }

    ko.utils.arrayForEach(["afterAdd", "afterRender", "beforeRemove", "includeDestroyed", "templateEngine", "templateOptions"], function (option) {
        result[option] = options[option] || ko.bindingHandlers.sortable[option];
    });

    //use an afterRender function to add meta-data
    if (result.afterRender) {
        //wrap the existing function, if it was passed
        actualAfterRender = result.afterRender;
        result.afterRender = function(element, data) {
            addMetaDataAfterRender.call(data, element, data);
            actualAfterRender.call(data, element, data);
        };
    } else {
        result.afterRender = addMetaDataAfterRender;
    }

    //return options to pass to the template binding
    return result;
};

//connect items with observableArrays
ko.bindingHandlers.sortable = {
    init: function(element, valueAccessor, allBindingsAccessor, data, context) {
        var $element = $(element),
            value = ko.utils.unwrapObservable(valueAccessor()) || {},
            templateOptions = prepareTemplateOptions(valueAccessor),
            sortable = {},
            startActual, updateActual;

        //remove leading/trailing text nodes from anonymous templates
        ko.utils.arrayForEach(element.childNodes, function(node) {
            if (node && node.nodeType === 3) {
                node.parentNode.removeChild(node);
            }
        });

        //build a new object that has the global options with overrides from the binding
        $.extend(true, sortable, ko.bindingHandlers.sortable);
        if (value.options && sortable.options) {
            ko.utils.extend(sortable.options, value.options);
            delete value.options;
        }
        ko.utils.extend(sortable, value);

        //if allowDrop is an observable or a function, then execute it in a computed observable
        if (sortable.connectClass && (ko.isObservable(sortable.allowDrop) || typeof sortable.allowDrop == "function")) {
            ko.computed({
               read: function() {
                   var value = ko.utils.unwrapObservable(sortable.allowDrop),
                       shouldAdd = typeof value == "function" ? value.call(this, templateOptions.foreach) : value;
                   ko.utils.toggleDomNodeCssClass(element, sortable.connectClass, shouldAdd);
               },
               disposeWhenNodeIsRemoved: element
            }, this);
        } else {
            ko.utils.toggleDomNodeCssClass(element, sortable.connectClass, sortable.allowDrop);
        }

        //wrap the template binding
        ko.bindingHandlers.template.init(element, function() { return templateOptions; }, allBindingsAccessor, data, context);

        //keep a reference to start/update functions that might have been passed in
        startActual = sortable.options.start;
        updateActual = sortable.options.update;

        //initialize sortable binding after template binding has rendered in update function
        setTimeout(function() {
            $element.sortable(ko.utils.extend(sortable.options, {
                start: function(event, ui) {
                    //make sure that fields have a chance to update model
                    ui.item.find("input:focus").change();
                    if (startActual) {
                        startActual.apply(this, arguments);
                    }
                },
                update: function(event, ui) {
                    var sourceParent, targetParent, targetIndex, arg,
                        el = ui.item[0],
                        item = ko.utils.domData.get(el, ITEMKEY);

                    if (item) {
                        //identify parents
                        sourceParent = ko.utils.domData.get(el, PARENTKEY);
                        targetParent = ko.utils.domData.get(el.parentNode, LISTKEY);
                        targetIndex = ko.utils.arrayIndexOf(ui.item.parent().children(), el);

                        if (sortable.beforeMove || sortable.afterMove) {
                            arg = {
                                item: item,
                                sourceParent: sourceParent,
                                sourceParentNode: el.parentNode,
                                sourceIndex: sourceParent.indexOf(item),
                                targetParent: targetParent,
                                targetIndex: targetIndex,
                                cancelDrop: false
                            };
                        }

                        if (sortable.beforeMove) {
                            sortable.beforeMove.call(this, arg, event, ui);
                            if (arg.cancelDrop) {
                                $(arg.sourceParent === arg.targetParent ? this : ui.sender).sortable('cancel');
                                return;
                            }
                        }

                        if (targetIndex >= 0) {
                            sourceParent.remove(item);
                            targetParent.splice(targetIndex, 0, item);
                        }

                        //rendering is handled by manipulating the observableArray; ignore dropped element
                        ko.utils.domData.set(el, ITEMKEY, null);
                        ui.item.remove();

                        //allow binding to accept a function to execute after moving the item
                        if (sortable.afterMove) {
                           sortable.afterMove.call(this, arg, event, ui);
                        }
                    }

                    if (updateActual) {
                        updateActual.apply(this, arguments);
                    }
                },
                connectWith: sortable.connectClass ? "." + sortable.connectClass : false
            }));

            //handle enabling/disabling sorting
            if (sortable.isEnabled !== undefined) {
                ko.computed({
                    read: function() {
                        $element.sortable(ko.utils.unwrapObservable(sortable.isEnabled) ? "enable" : "disable");
                    },
                    disposeWhenNodeIsRemoved: element
                });
            }
        }, 0);

        //handle disposal
        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $element.sortable("destroy");
        });

        return { 'controlsDescendantBindings': true };
    },
    update: function(element, valueAccessor, allBindingsAccessor, data, context) {
        var templateOptions = prepareTemplateOptions(valueAccessor);

        //attach meta-data
        ko.utils.domData.set(element, LISTKEY, templateOptions.foreach);

        //call template binding's update with correct options
        ko.bindingHandlers.template.update(element, function() { return templateOptions; }, allBindingsAccessor, data, context);
    },
    connectClass: 'ko_container',
    allowDrop: true,
    afterMove: null,
    beforeMove: null,
    options: {}
};
})(ko, jQuery);


$(document).ready(function() {


	$.noty.defaultOptions.theme = 'noty_theme_twitter';

	slugify = function(s) {
		return s.trim().replace(/[^\w\s]/g,'').toLowerCase().replace(/\s/g,'-');
	};

	tryLoad = function(data,attr,obj,altname) {
		if(!data)
			return;

		if(attr instanceof Array)
		{
			if(!altname)
				altname=[];
			for(var i=0;i<attr.length;i++)
			{
				tryLoad(data,attr[i],obj,altname[i] || attr[i]);
			}
			return;
		}
		altname = altname || attr;

		function set(value) {
			if(altname in obj && typeof obj[altname]() == 'string')
				value+='';
			obj[altname](value);
		}

		if(attr in data)
			set(data[attr]);
		else if(attr.toLowerCase() in data)
			set(data[attr.toLowerCase()]);
	}

	Editor.Tab = function(id,title) {
		this.id = id;
		this.title = title;
	}

	Editor.contentObservable = function(val) {
		var obs = ko.observable(val);
        return ko.computed({
            read: obs,
            write: function(v) {
				try {
	                obs(HTMLtoXML(v+''));
				}
				catch(e) {
				}
            }
        });
	};

    Editor.searchBinding = function(search,url,makeQuery) {
		search.results.error = ko.observable('');
		search.searching = ko.observable(false);

        if('page' in search.results) {
            search.results.pages = ko.computed(function() {
                var results = this.all();
                var pages = [];
                for(var i=0;i<results.length;i+=10) {
                    pages.push(results.slice(i,i+10));
                }

                return pages;
            },search.results);

            search.results.pageText = ko.computed(function() {
                return this.page()+'/'+this.pages().length;
            },search.results);
        }

		search.submit = function() {
            var data = makeQuery();
			if(!data) {
				search.results.raw([]);
				search.lastID = null;
				return;
			}

            data.id = search.lastID = Math.random()+'';
            if(search.restorePage)
                data.page = search.restorePage;
            else
                data.page = 1;

			search.results.error('');
            search.searching(true);

            $.getJSON(url,data)
                .success(function(response) {
					if(response.id != search.lastID)
						return;
					search.results.raw(response.object_list);
                    if('page' in search.results)
                        search.results.page(parseInt(response.page) || 1);
                })
                .error(function() {
					if('console' in window)
	                    console.log(arguments);
					search.results.raw([]);
					search.results.error('Error fetching results: '+arguments[2]);
                })
                .complete(function() {
                    search.searching(false);
                });
            ;

		};
		search.submit();
    }

	Editor.mappedObservableArray = function(map) {
		var obj = {list: ko.observableArray([])};
		var obs = ko.computed({
			owner: obj,
			read: obj.list,
			write: function(l) {
				this.list(l.map(map));
			}
		});
		obs.remove = function(o) {
			return obj.list.remove(o);
		}
		obs.push = function(o) {
			return obj.list.push(map(o));
		}
		obs.indexOf = function(o) {
			return obj.list.indexOf(o);
		}
		return obs;
	}

	Editor.beforeRemove = function(elem) {
		if(elem.nodeType==elem.ELEMENT_NODE) {
			$(elem).stop().slideUp(150,function(){$(this).remove()});
		}
		else {
			$(elem).remove();
		}
	};

	Editor.afterAdd = function(elem) {
		if(elem.nodeType==elem.ELEMENT_NODE) {
			$(elem).stop().hide().slideDown(150);
		}
	}

    Editor.savers = 0;
    //fn should do the save and return a promise which resolves when the save is done
    Editor.startSave = function() {
        Editor.savers += 1;

        if(Editor.savers==1) {
            if(!Editor.save_noty)
            {
                Editor.save_noty = noty({
                    text: 'Saving...', 
                    layout: 'topCenter', 
                    type: 'information',
                    timeout: 0, 
                    speed: 150,
                    closeOnSelfClick: false, 
                    closeButton: false
                });
            }
                
            window.onbeforeunload = function() {
                return 'There are still unsaved changes.';
            }
        }
    }
    Editor.endSave = function() {
        Editor.savers = Math.max(Editor.savers-1,0);
        if(Editor.savers==0) {
            window.onbeforeunload = null;
            $.noty.close(Editor.save_noty);
            Editor.save_noty = null;
        }
    }

    //obs is an observable on the data to be saved
    //savefn is a function which does the save, and returns a deferred object which resolves when the save is done
    Editor.saver = function(obs,savefn) {
        var firstSave = true;

        return ko.computed(function() {
            var data = obs();
            if(firstSave) {
                firstSave = false;
                return;
            }
            Editor.startSave();
            data.csrfmiddlewaretoken = getCookie('csrftoken');
            var def = savefn(data);
            def
                .always(Editor.endSave)
                .done(function() {
                    noty({text:'Saved.',type:'success',timeout: 1000, layout: 'topCenter'})
                })
            ;
        }).extend({throttle:1000});
    }

	//represent a JSON-esque object in the Numbas .exam format
	prettyData = function(data){
		switch(typeof(data))
		{
		case 'number':
			return data+'';
		case 'string':
			//this tries to use as little extra syntax as possible. Quotes or triple-quotes are only used if necessary.
			if(data.toLowerCase()=='infinity')
				return '"infinity"';
			else if(data.contains('"') || data.contains("'"))
				return '"""'+data+'"""';
			else if(data.search(/[:\n,\{\}\[\] ]|\/\//)>=0)
				return '"'+data+'"';
			else if(!data.trim())
				return '""';
			else
				return data;
		case 'boolean':
			return data ? 'true' : 'false';
		case 'object':
			if($.isArray(data))	//data is an array
			{
				if(!data.length)
					return '[]';	//empty array

				data = data.map(prettyData);	//pretty-print each of the elements

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
					return '[\n'+data.join('\n')+'\n]';
				}
				else
				{
					return '[ '+data.join(', ')+' ]';
				}
			}
			else	//data is an object
			{
				if(!Object.keys(data).filter(function(x){return x}).length)
					return '{}';
				var o='{\n';
				for(var x in data)
				{
					if(x)
						o += x+': '+prettyData(data[x])+'\n';
				}
				o+='}';
				return o;
			}
		}
	};

	function cleanJME(val)
	{
		var dval = $.trim(val);
		var bits = Numbas.util.contentsplitbrackets(dval);
		dval='';
		for(var i=0;i<bits.length;i++)
		{
			switch(i % 2)
			{
			case 0:	//text
				dval += bits[i];
				break;
			case 1: //delimiter
				switch(bits[i])
				{
				case '$':
					if(i<bits.length-1)
					{
						dval += '$'+texMaths(bits[i+1])+'$';
						i+=2;
					}
					else
						dval += bits[i];
					break;
				case '\\[':
					if(i<bits.length-1)
					{
						dval += '\\['+texMaths(bits[i+1])+'\\]';
						i+=2;
					}
					else
						dval += bits[i];
					break;
				}
			}
		}
		return dval;
	}
	function texsplit(s)
	{
		var cmdre = /((?:.|\n)*?)\\((?:var)|(?:simplify))/m;
		var out = [];
		while( m = s.match(cmdre) )
		{
			out.push(m[1]);
			var cmd = m[2];
			out.push(cmd);

			var i = m[0].length;

			var args = '';
			var argbrackets = false;
			if( s.charAt(i) == '[' )
			{
				argbrackets = true;
				var si = i+1;
				while(i<s.length && s.charAt(i)!=']')
					i++;
				if(i==s.length)
				{
					out = out.slice(0,-2);
					out.push(s);
					return out;
				}
				else
				{
					args = s.slice(si,i);
					i++;
				}
			}
			if(!argbrackets)
				args='all';
			out.push(args);

			if(s.charAt(i)!='{')
			{
				out = out.slice(0,-3);
				out.push(s);
				return out;
			}

			var brackets=1;
			var si = i+1;
			while(i<s.length-1 && brackets>0)
			{
				i++;
				if(s.charAt(i)=='{')
					brackets++;
				else if(s.charAt(i)=='}')
					brackets--;
			}
			if(i == s.length-1 && brackets>0)
			{
				out = out.slice(0,-3);
				out.push(s);
				return out;
			}

			var expr = s.slice(si,i);
			s = s.slice(i+1);
			out.push(expr);
		}
		out.push(s);
		return out;
	}
	function texJMEBit(expr) {
		var scope = new Numbas.jme.Scope(Numbas.jme.builtinScope,{rulesets: Numbas.jme.display.simplificationRules});
		try{
			var sbits = Numbas.util.splitbrackets(expr,'{','}');
			var expr = '';
			for(var j=0;j<sbits.length;j+=1)
			{
				expr += j%2 ? 'subvar('+sbits[j]+')' : sbits[j]; //subvar here instead of \\color because we're still in JME
			}
			expr = Numbas.jme.display.exprToLaTeX(expr,[],scope);
			return expr;
		} catch(e) {
			return '\\color{red}{\\textrm{'+e.message+'}}';
		}
	}
	function texMaths(s) {
		var bits = texsplit(s);
		var out = '';
		for(var i=0;i<bits.length-3;i+=4)
		{
			out+=bits[i];
			var cmd = bits[i+1],
				args = bits[i+2],
				expr = bits[i+3];
			expr = texJMEBit(expr);

			switch(cmd)
			{
			case 'var':	//substitute a variable
				out += ' \\class{jme-var}{\\left\\{'+expr+'\\right\\}}';
				break;
			case 'simplify': //a JME expression to be simplified
				out += ' \\class{jme-simplify}{\\left\\{'+expr+'\\right\\}}';
				break;
			}
		}
		return out+bits[bits.length-1];
	};

	ko.bindingHandlers.codemirror = {
		init: function(element,valueAccessor,allBindingsAccessor) {
			var value = valueAccessor();
			var allBindings = allBindingsAccessor();

			$(element).val(ko.utils.unwrapObservable(value));
			
			var mode = ko.utils.unwrapObservable(allBindings.codemirrorMode) || 'javascript';
			var readOnly = ko.utils.unwrapObservable(allBindings.readOnly) || false;

			function onChange(editor,change) {
				if(typeof value=='function') {
					value(editor.getValue());
				}
			}

			var mc = CodeMirror.fromTextArea(element,{
				lineNumbers: true,
				matchBrackets: true,
                mode: mode,
				onChange: onChange
			});
			ko.utils.domData.set(element,'codemirror',mc);
		},
		update: function(element,valueAccessor,allBindingsAccessor) {
			var mc = ko.utils.domData.get(element,'codemirror');
			var value = ko.utils.unwrapObservable(valueAccessor());
			if(value!=mc.getValue()) {
				mc.setValue(value);
			}
			var allBindings = allBindingsAccessor();
			var mode = ko.utils.unwrapObservable(allBindings.codemirrorMode) || 'javascript';
			mc.setOption('mode',mode);
		}
	}

	ko.bindingHandlers.writemaths = {
		init: function(element,valueAccessor,allBindingsAccessor) {
            valueAccessor = valueAccessor();
			allBindingsAccessor = allBindingsAccessor();

			var value = ko.utils.unwrapObservable(valueAccessor) || '';

			var height = allBindingsAccessor.hasOwnProperty('wmHeight') ? allBindingsAccessor.wmHeight : 200;
			var width = allBindingsAccessor.hasOwnProperty('wmWidth') ? allBindingsAccessor.wmWidth : '';

			var d = $('<div style="text-align:right"/>');
			var toggle = $('<button type="button" class="wmToggle on">Toggle rich text editor</button>');
			d.append(toggle);
			$(element).append(d);
			toggle.click(function() {
				var ed = $(element).children('textarea').tinymce();
				$(element).toggleClass('on',ed.isHidden());
				if(ed.isHidden()) {
					ed.show()
					ed.setContent(ko.utils.unwrapObservable(valueAccessor));
				}
				else {
					ed.hide();
					var mc = ko.utils.domData.get(plaintext[0],'codemirror');
					mc.setValue(ko.utils.unwrapObservable(valueAccessor));
				}
			});

            var t = $('<textarea class="wmTextArea" style="width:100%"/>');
			var plaintext = $('<textarea class="plaintext"/>');


            $(element)
				.css('width',width)
                .addClass('writemathsContainer on')
                .append(t)
				.append(plaintext)
            ;


			//tinyMCE
			function onMCEChange(ed) {
				valueAccessor(ed.getContent());
			}

            t
                .tinymce({
                    theme: 'numbas',
					plugins: 'media',
					media_strict: false,
					init_instance_callback: function(ed) { 
						$(element).writemaths({cleanMaths: cleanJME, iFrame: true, position: 'center top', previewPosition: 'center bottom'}); 
						ed.onChange.add(onMCEChange);
						ed.onKeyUp.add(onMCEChange);
						ed.onPaste.add(onMCEChange);
					},
                    theme_advanced_resizing: true,
					theme_advanced_resize_horizontal: false,
					height: height,
					width: width,
					verify_html: false
                })
				.val(value);
            ;


			//codemirror
			function onChange(editor,change) {
				if(typeof valueAccessor=='function') {
					valueAccessor(editor.getValue());
				}
			}

			var mc = CodeMirror.fromTextArea(plaintext[0],{
				lineNumbers: true,
				matchBrackets: true,
                mode: 'htmlmixed',
				onChange: onChange
			});
			ko.utils.domData.set(plaintext[0],'codemirror',mc);
		},
		update: function(element, valueAccessor) {
			var tinymce = $(element).find('iframe').contents().find('body');
			var plaintext = $(element).children('.plaintext');

			var value = ko.utils.unwrapObservable(valueAccessor()) || '';
            if (!tinymce.is(':focus')) {
				var ed = $(element).children('.wmTextArea').tinymce();
				if(ed)
					ed.setContent(value);
			}
			if(plaintext.length && tinymce.is(':focus')) {
				var mc = ko.utils.domData.get(plaintext[0],'codemirror');
				if(value!=mc.getValue()) {
					mc.setValue(value);
				}
            }		
		}
	};

	$.fn.unselectable = function() {
		$(this).on('mousedown',function(e){ e.preventDefault(); });
	};

	ko.bindingHandlers.debug = {
		update: function(element,valueAccessor) {
			var value = valueAccessor();
			console.log(value,ko.utils.unwrapObservable(value));
		}
	}

	ko.bindingHandlers.cleanJME = {
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor()) || '';
			value = cleanJME(value);
			$(element).html(value).mathjax();
		}
	}
	
	ko.bindingHandlers.foldlist = {
		init: function(element,valueAccessor,allBindingsAccessor,viewModel)
		{
			var value = valueAccessor(), allBindings = allBindingsAccessor();
			var show = allBindings.show;

			element=$(element);
			var b = $('<button type="button" class="delete" data-bind="click:remove" value="Delete"></button>');
			b.click(function(){viewModel.remove()});
			element.append(b);
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

			var i = $('<input type="text"/>');
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
						var val = (value.pop() || '');
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

			var d = $('<div class="input-prepend"/>')
			$(element).append(d);
			$(d).append('<ul class="add-on"/>');
			$(d).append(i);
			function selectItem() {
				var n = $(this).index();
				i.val(value()[n]).focus();
				value.splice(n,1);
			};

			$(element).on('click',function() {
				i.focus();
			});


			$(element).delegate('li',{
				click: selectItem,
				keypress: function(e) {
					if($(this).is(':focus') && e.which==32)
					{
						selectItem.call(this);
						e.preventDefault();
						e.stopPropagation();
					}
				}
			});
		},
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			$(element).find('ul li').remove();
			for(var i=0;i<value.length;i++)
			{
				$(element).find('ul').append($('<li tabindex="0"/>').html(value[i]));
			}
		}
	}

	ko.bindingHandlers.dragOut = {
		init: function(element, valueAccessor) {
			var obj = {
				data: null,
				sortable: ''
			};
			obj = $.extend(obj,valueAccessor());
			$(element)
				.draggable({
					handle: '.handle',
					revert: true, 
					revertDuration: 100,
					helper: 'clone',
					connectToSortable: obj.sortable
				})
			;
		}
	};

	ko.bindingHandlers.JME = {
		update: function(element,valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			var tex = texJMEBit(value);
			if(tex.length>0)
				$(element).html('$'+tex+'$').mathjax();
			else
				$(element).html('');
		}
	};

    ko.bindingHandlers.fromNow = {
        init: function(element,valueAccessor) {
            var value = valueAccessor();
            function update() {
                $(element).text(moment(ko.utils.unwrapObservable(value)).fromNow());
            }
            update();
            ko.utils.domData.set(element,'fromNow',setInterval(update,30000));
        },
        update: function(element,valueAccessor) {
            clearInterval(ko.utils.domData.get(element,'fromNow'));
            ko.bindingHandlers.fromNow.init(element,valueAccessor);
        }
    }
    ko.bindingHandlers.calendarTime = {
        init: function(element,valueAccessor) {
            var value = valueAccessor();
            function update() {
                $(element).text(moment(ko.utils.unwrapObservable(value)).format('DD/MM/YYYY'));
            }
            update();
            ko.utils.domData.set(element,'calendarTime',setInterval(update,30000));
        },
        update: function(element,valueAccessor) {
            clearInterval(ko.utils.domData.get(element,'calendarTime'));
            ko.bindingHandlers.calendarTime.init(element,valueAccessor);
        }
    }

	var Resource = Editor.Resource = function(data) {
		this.progress = ko.observable(0);
		this.url = ko.observable('');
		this.name = ko.observable('');
		this.pk = ko.observable(0);

		if(data) {
			this.load(data);
			this.progress(1);
		}
	}
	Resource.prototype = {
		load: function(data) {
			this.url(data.url);
			this.name(data.name);
			this.pk(data.pk);
			this.deleteURL = data.delete_url;
		},
		filePatterns: {
			'html': /\.html?$/,
			'img': /\.(png|jpg|gif|bmp|jpeg|webp|tiff|tif|raw|svg)$/
		},
		filetype: function() {
			var name = this.name();
			for(var type in this.filePatterns) {
				if(this.filePatterns[type].test(name))
					return type;
			}
		}
	};

	ko.bindingHandlers.fileupload = {
		init: function(element, valueAccessor, allBindingsAccessor) {
			var fileArray = valueAccessor();
			var allBindings = allBindingsAccessor();
			var afterUpload = allBindings.afterupload;

			$(element).fileupload({
				dataType: 'json',

				done: function (e, data) {
					data.res.load(data.result);
					if(afterUpload)
						afterUpload(data.res);
				},
				add: function(e, data) {
					data.res = new Resource();
					fileArray.splice(0,0,data.res);
					data.submit();
				},

				progress: function(e,data) {
					data.res.progress(data.loaded/data.total);
				}
			});
		}
	}
});
