var WriteMaths;
(function() {
WriteMaths = function(e,options)
{
	if(!options)
		options = {};
	e=$(e);
	e.addClass('writemaths');
	this.e = e;
	this.d = options.display;
	this.saveName = options.saveName;
	
	this.bindEvents();

	///set up
	if(options.content)
		this.setState(options.content.trim());
	else
		this.setState(e.text().trim());

	this.savefn = options.savefn || function(){};
	this.loadfn = options.loadfn || function(){};

	this.load();
}
WriteMaths.numGraphs = 0;

WriteMaths.prototype = {
	locked: false,

	outputMode: 'html',

	lock: function() {
		this.locked = true;
		this.e.find('textarea,input').blur();
		this.e.addClass('locked');
	},

	unlock: function() {
		this.locked = false;
		this.e.removeClass('locked');
	},

	bindEvents: function() {
		var wm = this;
		var e = this.e;

		//trigger a 'setstate' event to set the state of the writemaths area
		e.bind('setstate',function(ev,state) {
			if(state!=e.attr('value'))	
				wm.setState(state);
		});

		//clicking on a paragraph makes it editable
		e.delegate('.line','click',function(e) {
			if(wm.locked) { return }
			var d = input();
			d.val(($(this).attr('source') || '').trim());
			$(this).replaceWith(d);
			d.focus();
			positionPreview.apply(d[0]);
		});
		

		//handle keypresses in input
		e.delegate('textarea, input','keydown',function(ev) {
			if(wm.locked) { return }
			//find previous and next lines, in case they need to be used
			var prvLine;
			var i = $(this);
			if(i.parent().is('ol,ul') && !i.prev().length)	//if current line is first list item, work with the list tag
				i = i.parent();

			if(i.prev().is('ol,ul'))	//if previous item is a list, select its last line
				prvLine = i.prev().children('.line:last');
			else	//otherwise, select previous normal line
				prvLine = i.prev('.line');

			var nxtLine;
			var i = $(this);
			if(i.parent().is('ol,ul') && !i.next().length)	//if current line is first list item, work with the list tag
				i = i.parent();

			if(i.next().is('ol,ul'))	//if nextious item is a list, select its last line
				nxtLine = i.next().children('.line:first');
			else	//otherwise, select nextious normal line
				nxtLine = i.next('.line');

			//which key was pressed?
			switch(ev.which)
			{
			//backspace
			case 8:
				if(this.selectionStart==0 && this.selectionEnd==0)
				{
					var p = prvLine;
					if(p.length)
					{
						var os = p.attr('source') || '';
						p.attr('source', os+$(this).val());
						p=$(p[0]);
						$(this).attr('going',true);
						$(this).remove();
						p.click();
						e.find('textarea, input')[0].setSelectionRange(os.length,os.length);
					}
					ev.stopPropagation();
					ev.preventDefault();
				}
				break;

			//return
			case 13:
				$(this).attr('going',true);
				var i = this.selectionStart;
				var t = $(this).val().slice(i);		//text after cursor
				$(this).val( $(this).val().slice(0,i));	//chop off text after cursor
				var d = input2display($(this));	//replace input with display
				var i = input();	//
				i.val(t);
				if(d.is('li'))
				{

				}
				d.after(i);
				i.focus();
				i[0].setSelectionRange(0,0);
				break;

			//up
			case 38:
				prvLine.click();
				break;

			//down
			case 40:
				nxtLine.click();
				break;

			//delete
			case 46:
				var val = $(this).val()
				if(this.selectionStart==val.length && this.selectionEnd==val.length)
				{
					var p = nxtLine;
					if(p.length)
					{
						$(this).val(val+(p.attr('source') || ''));
						p.remove();
						this.setSelectionRange(val.length,val.length);
					}
					ev.stopPropagation();
					ev.preventDefault();
				}
				break;

			//escape
			case 27:
				$(this).blur();
			}
		});

		function positionPreview() {
			if(this.selectionStart!=this.selectionEnd)
				return;

			var txt = $(this).val().slice(0,this.selectionStart);

			var i=0;
			var inMath=false;
			var startMath = 0;
			var mathLimit,mathDelimit;
			while(i<this.selectionStart)
			{
				if(inMath)
				{
					if(txt.slice(i,i+mathDelimit.length)==mathDelimit)
					{
						inMath = false;
						i+=mathDelimit.length-1;
					}
				}
				else if(txt[i]=='$')
				{
					inMath = true;
					startMath = i+1;
					mathLimit = '$';
					mathDelimit = '$';
				}
				else if(txt.slice(i,i+2)=='\\[')
				{
					inMath = true;
					startMath = i+2;
					mathLimit = '\\[';
					mathDelimit = '\\]';
				}
				i+=1;
			}
			if(!inMath)
			{
				e.find('.preview').hide();
				return;
			}
			var val = $(this).val();
			i = startMath+1;
			while(i<val.length && inMath)
			{
				if(val.slice(i,i+mathDelimit.length)==mathDelimit)
					inMath = false;
				i+=1;
			}
			if(inMath && i==val.length)
			{
				//try to make a guess at how much of the remaining string is meant to be maths
				var words = val.slice(startMath).split(' ');
				var j = 0;
				while(j<words.length && !words[j].match(/^[a-zA-Z]{2,}$/))
				{
					j+=1;
				}
				i = startMath + words.slice(0,j).join(' ').length;
				i = Math.max(this.selectionStart,i)+1;
			}
			var math = val.slice(startMath,i-1);
			if(!math.length)
				return;
			math = mathLimit + math + mathDelimit;

			var dr = $('<p>'+txt.slice(0,startMath)+'</p>');
			e.append(dr);
			var w = $.textMetrics(dr).width - this.scrollLeft;
			dr.remove();
			e.find('.preview')
				.show()
				.html(cleanJME(math))
				.position({my: 'left bottom', at: 'left top', of: this, offset: w+' 0', collision: 'fit'})
			;
			var inp = this;
			var queue = MathJax.Callback.Queue(MathJax.Hub.Register.StartupHook("End",{}));
			queue.Push(['Typeset',MathJax.Hub,e.find('.preview')[0]]);
			queue.Push(function() {
				e.find('.preview').position({my: 'left bottom', at: 'left top', of: inp, offset: w+' 0', collision: 'fit'});
			});
		}
	
		e.delegate('textarea, input','keyup',positionPreview).delegate('textarea, input','click',positionPreview);

		e.delegate('textarea, input','keyup',function() {
			if(wm.locked) { return }
			wm.saveState();
		});
		e.delegate('textarea, input','input',function() {
			if(wm.locked) { return }
			wm.output();
		});

		e.delegate('textarea, input','blur',function() {
			if(!$(this).attr('going'))
				input2display($(this));
			e.find('.preview').hide();
		});

		e.delegate('.graph','click',function(e){
			e.preventDefault();
			e.stopPropagation();
			if(!e){
				var e = window.event;
			};
			e.cancelBubble = true;
			return false;
		});
	},

	load: function() {
		if(this.saveName)
		{
			s = localStorage['writemaths.'+this.saveName];
			if(s)
				this.setState(s);
			var wm = this;
			this.loadfn.apply(this);
		}
	},

	setState: function(s) {
		this.e.html('');
		this.e.append('<div class="preview"/>');
		this.e.attr('value',s);
		this.e.trigger('input');

		var lines = s.split('\n');
		var i = lines.length;
		while(i--)
		{
			var p = makeParagraph(lines[i]);
			if(p.is('ol,ul'))
			{
				p.removeClass('line').removeAttr('source');
				p.children().addClass('line').attr('source',lines[i]);
			}
			if(p.is('ol,ul') && this.e.children(':first').is('ol,ul'))
			{
				p = p.find('li');
				this.e.children(':first').prepend(p);
			}
			else
				this.e.prepend(p);
			finishParagraph(p);
		}
	},

	getState: function() {
		var lines = this.e.children('.line, textarea, input').add(this.e.children('ol,ul').children('.line,input')).map(function(){
			return ($(this).attr('source') || $(this).val());
		}).toArray();
		var nlines = [];
		for(var i=0;i<lines.length;i++)
		{
			var line = lines[i];
			for(var j=i;j<lines.length && lines[j].search(/^[\*#] /)==0; j++) {}
			if(j>i)
			{
				line = lines.slice(i,j).join('\n');
				i=j-1;
			}
				
			nlines.push(line);
		}
		return nlines;
	},

	saveState: function() {
		if(this.saveName)
		{
			var s = this.getState().join('\n');
			localStorage['writemaths.'+this.saveName]= s;
			this.savefn.apply(this,[s]);
		}
	},


	output: function() {
		var state = this.getState();
		this.e.attr('value',state.join('\n'));
		var source;
		switch(this.outputMode)
		{
		case 'html':
			source = this.getHTML();
			break;
		case 'tex':
			source = this.getTeX();
			break;
		}

		$(this.d)
			.width('100%')
			.attr('rows',source.split('\n').length)
			.html(source)
		;
	},

	getHTML: function() {
		var d = $('<div/>');
		var lines = this.getState();
		for(var i=0;i<lines.length;i++)
		{
			var h = makeParagraph(lines[i],true);
			h.linkURLs().find('a').oembed();
			h.removeAttr('source').removeClass('line');
			if(!h.attr('class').length)
				h.removeAttr('class');
			var el = h.get(0);
			if(h.find('br').length)
			{
				lines[i]='';
			}
			else
			{
				var d=$('<div/>');
				d.append(h);
				lines[i] =  d.html();
			}
		}
		html = lines.join('\n\n');
		return html;
	},

	getTeX: function() {
		var lines = this.getState();
		for(var i=0;i<lines.length;i++)
		{
			var p = makeParagraph(lines[i],true);
			p.linkURLs();
			lines[i] = p.get(0);
		}
		var tex = $.map(lines,htmlToTeX).join('\n\n');
		tex = '\
\\documentclass[a4paper]{article} \n\
\\usepackage{amsmath} \n\
\\usepackage{amssymb} \n\
\\usepackage{upgreek} \n\
\\usepackage{amsthm} \n\
\\usepackage{verbatim} \n\
\\usepackage{hyperref} \n\
\\parskip 1ex \n\
\\parindent 0pt \n\
\n\
\\begin{document}\n\n'+tex+'\n\n\\end{document}';

		return tex;
	}
};

var htmlToTeX;
(function() {
	function environ(name)
	{
		return function(content) {
			return '\\'+name+'{'+content+'}';
		};
	}

	function inline(name)
	{
		return function(content) {
			return '{\\'+name+' '+content+'}';
		};
	}
	
	function id(content)
	{
		return content;
	}

	var htmlTeXdict = {
		'em':		inline('it'),
		'i': 		inline('it'),
		'strong':	inline('bf'),
		'b':		inline('bf'),
		'cite':		environ('cite'),
		'del':		environ('sout'),
		'ins':		environ('underline'),
		'sup':		environ('textsuperscript'),
		'sub':		environ('textsubscript'),
		'span':		id,
		'p':		id,
		'br':		id,
		'div':		id,
		'code':		environ('verb'),
		'h1':		function(content) {
						return '\\title{'+content+'}\n\\maketitle';
					},
		'h2':		environ('section'),
		'h3':		environ('subsection'),
		'h4':		environ('subsubsection'),
		'a':		function(content,el) {
						return '\\href{'+$(el).attr('href')+'}{'+content+'}';
					},
		'li':		function(content) {
						return '\\item '+content;
					},
		'ul':		function(content) {
						return '\\begin{itemize}'+content+'\\end{itemize}';
					},
		'ol':		function(content) {
						return '\\begin{enumerate}'+content+'\\end{enumerate}';
					},
	};

	var unicode1 = {
		'\u2019': '\'',
		'\u201C': '``',
		'\u201D': '"',
		'\u2013': ' - ',
		'\u2014': ' -- ',
		'\u00D7': ' x ',
		'\u2026': '...',
		'\u00A9': '\\copyright ',
		'\u00AE': '\\textregistered ',
		'\u2122': '\\texttrademark'
	};
	var unicode = {};
	for(var x in unicode1) { unicode[x] = [new RegExp(x,'g'),unicode1[x]]; }

	htmlToTeX = function(el)
	{
		switch(el.nodeType)
		{
		case 1:
			var content = $(el).contents();
			content = $.map(content,htmlToTeX).join('');
			for(var x in unicode)
			{
				var r = unicode[x][0];
				var to = unicode[x][1];
				content = content.replace(r,to);
			}
			var name = el.tagName.toLowerCase();
			if(name in htmlTeXdict)
			{
				return htmlTeXdict[name](content,el);
			}
			else
			{
				return '';
			}
		case 3:
			return $(el).text();
		}
	}
})();

function texMaths(s) {
	var bits = Numbas.jme.splitbrackets(s,'{','}');
	var out = '';
	for(var i=0;i<bits.length;i++)
	{
		if(i%2)	//JME
			out += bits[i];
		else	//raw LaTeX
			try{
				out += Numbas.jme.display.exprToLaTeX(bits[i]);
			}catch(e){
				out+=bits[i];
			}
	}
	return out;
};

function input() {
	return $('<input rows="1"></input>');
}
function makeParagraph(val,notypeset)
{
	if(val.length)
	{
		var dval = cleanJME(val);
		var d = $(textile(dval));
		if(d.is('div'))
		{
			var p=$('<p></p>');
			p.append(d);
			d=p;
		}
		d.attr('source',val);
		if(!notypeset)
			MathJax.Hub.Queue(['Typeset',MathJax.Hub,d[0]]);
	}
	else
	{
		d = $('<p><br/></p>');
	}
	d.addClass('line');
	return d.first();
}
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
			case '%%':
				if(i<bits.length-1)
				{
					WriteMaths.numGraphs += 1;
					dval += '<div id="jsxgraph-'+WriteMaths.numGraphs+'" class="graph" source="'+bits[i+1]+'"/>';
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

function finishParagraph(p) {
	try{

		p.find('.graph').each(function() {
			var id = $(this).attr('id');
			var src = $(this).attr('source');
			$(this).css('width','400px').css('height','300px');
			urlexp.lastIndex = 0;
			if(src.match(/^geonext /))
			{
				src = src.slice(8);
				if(urlexp.test(src))
					JXG.JSXGraph.loadBoardFromFile(id,src,'Geonext');
				else
					JXG.JSXGraph.loadBoardFromString(id,src,'Geonext');
			}
			else
			{
				JXG.JSXGraph
					.initBoard(id,{
						showCopyright:false,
						originX: 200,
						originY: 150,
						unitX: 50,
						unitY: 50,
						axis:true
					})
					.construct(src)
				;
			}
		});
	}
	catch(e) {
		console.log(e);
	}
	p.linkURLs().find('a').oembed()
	p.find('a').attr('target','_blank');
}

function input2display(e) {
	e.attr('going',true);
	var val = e.val();
	var d = makeParagraph(val);
	var p;

	//if this line is a list item
	if(d.is('ol,ul'))
	{
		var l;
		var li = d.find('li');
		li.attr('source',d.attr('source')).addClass('line');
		//if editing a list item, attach this line to the list
		if((l=e.parent('ol,ul')).length)
		{
			e.replaceWith(li);
		}
		//if editing a previously non-list line, and there is a list above, attach this line to the list above
		if((l=e.prev('ol,ul')).length)
		{
			l.append(li);
			var l2
			if((l2 = e.next('ol,ul')).length)	//if there's a list below, join it with this one
			{
				l.append(l2.children());
				l2.remove();
			}
			e.remove();
		}
		//if editing a previously non-list line, and there is a list below, attach this line to the list below
		else if((l=e.next('ol,ul')).length)
		{
			l.prepend(li);
			e.remove();
		}
		//if created a list with nothing above or below, just make sure the list container tag isn't interpreted as an editable line
		else
		{
			d.removeAttr('source').removeClass('line');
			e.replaceWith(d);
		}
		d = li;
	}
	else if ((p=e.parent('ol,ul')).length)	//if this was a list item but is no longer, split the list.
	{
		var l2 = p.clone();
		l2.children().remove();
		l2.append(e.nextAll().remove());
		if(l2.children().length)
			p.after(l2);
	
		p.after(e);
		e.replaceWith(d);
		if(!p.children().length)
			p.remove();
	}
	else
	{
		e.replaceWith(d);
	}
	finishParagraph(d);
	return d;
}


var urlexp = /(^|\s)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])($|\s|[!:,.;])/ig;

$.fn.linkURLs = function() {
	this.each(function() {
		$(this).html($(this).html().replace(urlexp,"$1<a href='$2'>$2</a>$4")); 
	});
	return this;
}


/*

 Style HTML
---------------

  Written by Nochum Sossonko, (nsossonko@hotmail.com)

  Based on code initially developed by: Einar Lielmanis, <elfz@laacz.lv>
    http://jsbeautifier.org


  You are free to use this in any way you want, in case you find this useful or working for you.

  Usage:
    style_html(html_source);

*/

function style_html(html_source, indent_size, indent_character, max_char, brace_style) {
//Wrapper function to invoke all the necessary constructors and deal with the output.

  var Parser, multi_parser;

  function Parser() {

    this.pos = 0; //Parser position
    this.token = '';
    this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
    this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
      parent: 'parent1',
      parentcount: 1,
      parent1: ''
    };
    this.tag_type = '';
    this.token_text = this.last_token = this.last_text = this.token_type = '';


    this.Utils = { //Uilities made available to the various functions
      whitespace: "\n\r\t ".split(''),
      single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed'.split(','), //all the single tags for HTML
      extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
      in_array: function (what, arr) {
        for (var i=0; i<arr.length; i++) {
          if (what === arr[i]) {
            return true;
          }
        }
        return false;
      }
    }

    this.get_content = function () { //function to capture regular content between tags

      var input_char = '';
      var content = [];
      var space = false; //if a space is needed
      while (this.input.charAt(this.pos) !== '<') {
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;


        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
          if (content.length) {
            space = true;
          }
          this.line_char_count--;
          continue; //don't want to insert unnecessary space
        }
        else if (space) {
          if (this.line_char_count >= this.max_char) { //insert a line when the max_char is reached
            content.push('\n');
            for (var i=0; i<this.indent_level; i++) {
              content.push(this.indent_string);
            }
            this.line_char_count = 0;
          }
          else{
            content.push(' ');
            this.line_char_count++;
          }
          space = false;
        }
        content.push(input_char); //letter at-a-time (or string) inserted to an array
      }
      return content.length?content.join(''):'';
    }

    this.get_script = function () { //get the full content of a script to pass to js_beautify

      var input_char = '';
      var content = [];
      var reg_match = new RegExp('\<\/script' + '\>', 'igm');
      reg_match.lastIndex = this.pos;
      var reg_array = reg_match.exec(this.input);
      var end_script = reg_array?reg_array.index:this.input.length; //absolute end of script
      while(this.pos < end_script) { //get everything in between the script tags
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;


        content.push(input_char);
      }
      return content.length?content.join(''):''; //we might not have any content at all
    }

    this.record_tag = function (tag){ //function to record a tag and its parent in this.tags Object
      if (this.tags[tag + 'count']) { //check for the existence of this tag type
        this.tags[tag + 'count']++;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
      }
      else { //otherwise initialize this tag type
        this.tags[tag + 'count'] = 1;
        this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
      }
      this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
      this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
    }

    this.retrieve_tag = function (tag) { //function to retrieve the opening tag to the corresponding closer
      if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
        var temp_parent = this.tags.parent; //check to see if it's a closable tag.
        while (temp_parent) { //till we reach '' (the initial value);
          if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
            break;
          }
          temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
        }
        if (temp_parent) { //if we caught something
          this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
          this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
        }
        delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
        delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
        if (this.tags[tag + 'count'] == 1) {
          delete this.tags[tag + 'count'];
        }
        else {
          this.tags[tag + 'count']--;
        }
      }
    }

    this.get_tag = function () { //function to get a full tag and parse its type
      var input_char = '';
      var content = [];
      var space = false;

      do {
        if (this.pos >= this.input.length) {
          return content.length?content.join(''):['', 'TK_EOF'];
        }

        input_char = this.input.charAt(this.pos);
        this.pos++;
        this.line_char_count++;

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
          space = true;
          this.line_char_count--;
          continue;
        }

        if (input_char === "'" || input_char === '"') {
          if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
            input_char += this.get_unformatted(input_char);
            space = true;
          }
        }

        if (input_char === '=') { //no space before =
          space = false;
        }

        if (content.length && content[content.length-1] !== '=' && input_char !== '>'
            && space) { //no space after = or before >
          if (this.line_char_count >= this.max_char) {
            this.print_newline(false, content);
            this.line_char_count = 0;
          }
          else {
            content.push(' ');
            this.line_char_count++;
          }
          space = false;
        }
        content.push(input_char); //inserts character at-a-time (or string)
      } while (input_char !== '>');

      var tag_complete = content.join('');
      var tag_index;
      if (tag_complete.indexOf(' ') != -1) { //if there's whitespace, thats where the tag name ends
        tag_index = tag_complete.indexOf(' ');
      }
      else { //otherwise go with the tag ending
        tag_index = tag_complete.indexOf('>');
      }
      var tag_check = tag_complete.substring(1, tag_index).toLowerCase();
      if (tag_complete.charAt(tag_complete.length-2) === '/' ||
          this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
        this.tag_type = 'SINGLE';
      }
      else if (tag_check === 'script') { //for later script handling
        this.record_tag(tag_check);
        this.tag_type = 'SCRIPT';
      }
      else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
        this.record_tag(tag_check);
        this.tag_type = 'STYLE';
      }
      else if (tag_check === 'a') { // do not reformat the <a> links
        var comment = this.get_unformatted('</a>', tag_complete); //...delegate to get_unformatted function
        content.push(comment);
        this.tag_type = 'SINGLE';
      }
      else if (tag_check.charAt(0) === '!') { //peek for <!-- comment
        if (tag_check.indexOf('[if') != -1) { //peek for <!--[if conditional comment
          if (tag_complete.indexOf('!IE') != -1) { //this type needs a closing --> so...
            var comment = this.get_unformatted('-->', tag_complete); //...delegate to get_unformatted
            content.push(comment);
          }
          this.tag_type = 'START';
        }
        else if (tag_check.indexOf('[endif') != -1) {//peek for <!--[endif end conditional comment
          this.tag_type = 'END';
          this.unindent();
        }
        else if (tag_check.indexOf('[cdata[') != -1) { //if it's a <[cdata[ comment...
          var comment = this.get_unformatted(']]>', tag_complete); //...delegate to get_unformatted function
          content.push(comment);
          this.tag_type = 'SINGLE'; //<![CDATA[ comments are treated like single tags
        }
        else {
          var comment = this.get_unformatted('-->', tag_complete);
          content.push(comment);
          this.tag_type = 'SINGLE';
        }
      }
      else {
        if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
          this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
          this.tag_type = 'END';
        }
        else { //otherwise it's a start-tag
          this.record_tag(tag_check); //push it on the tag stack
          this.tag_type = 'START';
        }
        if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
          this.print_newline(true, this.output);
        }
      }
      return content.join(''); //returns fully formatted tag
    }

    this.get_unformatted = function (delimiter, orig_tag) { //function to return unformatted content in its entirety

      if (orig_tag && orig_tag.indexOf(delimiter) != -1) {
        return '';
      }
      var input_char = '';
      var content = '';
      var space = true;
      do {

        if (this.pos >= this.input.length) {
          return content;
        }

        input_char = this.input.charAt(this.pos);
        this.pos++

        if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
          if (!space) {
            this.line_char_count--;
            continue;
          }
          if (input_char === '\n' || input_char === '\r') {
            content += '\n';
            for (var i=0; i<this.indent_level; i++) {
              content += this.indent_string;
            }
            space = false; //...and make sure other indentation is erased
            this.line_char_count = 0;
            continue;
          }
        }
        content += input_char;
        this.line_char_count++;
        space = true;


      } while (content.indexOf(delimiter) == -1);
      return content;
    }

    this.get_token = function () { //initial handler for token-retrieval
      var token;

      if (this.last_token === 'TK_TAG_SCRIPT') { //check if we need to format javascript
        var temp_token = this.get_script();
        if (typeof temp_token !== 'string') {
          return temp_token;
        }
        token = js_beautify(temp_token,
                {indent_size: this.indent_size, indent_char: this.indent_character, indent_level: this.indent_level, brace_style: this.brace_style}); //call the JS Beautifier
        return [token, 'TK_CONTENT'];
      }
      if (this.current_mode === 'CONTENT') {
        token = this.get_content();
        if (typeof token !== 'string') {
          return token;
        }
        else {
          return [token, 'TK_CONTENT'];
        }
      }

      if(this.current_mode === 'TAG') {
        token = this.get_tag();
        if (typeof token !== 'string') {
          return token;
        }
        else {
          var tag_name_type = 'TK_TAG_' + this.tag_type;
          return [token, tag_name_type];
        }
      }
    }

    this.printer = function (js_source, indent_character, indent_size, max_char, brace_style) { //handles input/output and some other printing functions

      this.input = js_source || ''; //gets the input for the Parser
      this.output = [];
      this.indent_character = indent_character || ' ';
      this.indent_string = '';
      this.indent_size = indent_size || 2;
      this.brace_style = brace_style || 'collapse';
      this.indent_level = 0;
      this.max_char = max_char || 70; //maximum amount of characters per line
      this.line_char_count = 0; //count to see if max_char was exceeded

      for (var i=0; i<this.indent_size; i++) {
        this.indent_string += this.indent_character;
      }

      this.print_newline = function (ignore, arr) {
        this.line_char_count = 0;
        if (!arr || !arr.length) {
          return;
        }
        if (!ignore) { //we might want the extra line
          while (this.Utils.in_array(arr[arr.length-1], this.Utils.whitespace)) {
            arr.pop();
          }
        }
        arr.push('\n');
        for (var i=0; i<this.indent_level; i++) {
          arr.push(this.indent_string);
        }
      }


      this.print_token = function (text) {
        this.output.push(text);
      }

      this.indent = function () {
        this.indent_level++;
      }

      this.unindent = function () {
        if (this.indent_level > 0) {
          this.indent_level--;
        }
      }
    }
    return this;
  }

  /*_____________________--------------------_____________________*/



  multi_parser = new Parser(); //wrapping functions Parser
  multi_parser.printer(html_source, indent_character, indent_size, 80, brace_style); //initialize starting values



  while (true) {
      var t = multi_parser.get_token();
      multi_parser.token_text = t[0];
      multi_parser.token_type = t[1];

    if (multi_parser.token_type === 'TK_EOF') {
      break;
    }


    switch (multi_parser.token_type) {
      case 'TK_TAG_START': case 'TK_TAG_SCRIPT': case 'TK_TAG_STYLE':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.indent();
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_END':
        multi_parser.print_newline(true, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_TAG_SINGLE':
        multi_parser.print_newline(false, multi_parser.output);
        multi_parser.print_token(multi_parser.token_text);
        multi_parser.current_mode = 'CONTENT';
        break;
      case 'TK_CONTENT':
        if (multi_parser.token_text !== '') {
          multi_parser.print_newline(false, multi_parser.output);
          multi_parser.print_token(multi_parser.token_text);
        }
        multi_parser.current_mode = 'TAG';
        break;
    }
    multi_parser.last_token = multi_parser.token_type;
    multi_parser.last_text = multi_parser.token_text;
  }
  return multi_parser.output.join('');
}


(function($) {

 $.textMetrics = function(el) {

  var h = 0, w = 0;

  var div = document.createElement('div');
  document.body.appendChild(div);
  $(div).css({
   position: 'absolute',
   left: -1000,
   top: -1000,
   display: 'none',
   width: 'auto'
  });

  $(div).html($(el).html());
  var styles = ['font-size','font-style', 'font-weight', 'font-family','line-height', 'text-transform', 'letter-spacing'];
  $(styles).each(function() {
   var s = this.toString();
   $(div).css(s,$(el).css(s));
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

})(jQuery);

var re_inlineMaths = /\$.*?\$/g;
textile.phraseTypes.splice(0,0,function(text) {
	var out = [];
	var m;
	while(m=re_inlineMaths.exec(text))
	{
		var bit = [text.slice(0,m.index),m[0]];
		out = this.joinPhraseBits(out,bit,out.length);
		text = text.slice(re_inlineMaths.lastIndex);
		re_inlineMaths.lastIndex = 0;
	}
	if(out.length)
		out = this.joinPhraseBits(out,[text],out.length);
	return out;
});

var re_displayMaths = /\\\[.*?\\\]/g;
textile.phraseTypes.splice(0,0,function(text) {
	var out = [];
	var m;
	while(m=re_displayMaths.exec(text))
	{
		var bit = [text.slice(0,m.index),m[0]];
		out = this.joinPhraseBits(out,bit,out.length);
		text = text.slice(re_displayMaths.lastIndex);
		re_displayMaths.lastIndex = 0;
	}
	if(out.length)
		out = this.joinPhraseBits(out,[text],out.length);
	return out;
});

var re_jsxgraph = /%%.*?%%/g;
textile.phraseTypes.splice(0,0,function(text) {
	var out = [];
	var m;
	while(m=re_jsxgraph.exec(text))
	{
		var bit = [text.slice(0,m.index),m[0]];
		out = this.joinPhraseBits(out,bit,out.length);
		text = text.slice(re_jsxgraph.lastIndex);
		re_jsxgraph.lastIndex = 0;
	}
	if(out.length)
		out = this.joinPhraseBits(out,[text],out.length);
	return out;
});

})();
