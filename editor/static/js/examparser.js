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
var parseExam;

(function() {

function ParseError(parser,error,hint)
{
	this.parser = parser;
	this.expression = parser.source.slice(parser.cursor,parser.cursor+50);
	this.line = parser.source.slice(0,parser.cursor).split('\n').length;
	this.error = error;
	this.hint = hint;

	this.message = this.error+' at line '+this.line+' near: \n\t '+this.expression;
	if(this.hint)
		this.message += '\nPossible fix: '+this.hint;
}
ParseError.prototype = new Error();
ParseError.prototype.constructor = ParseError;

function ExamParser()
{
}
ExamParser.prototype = {
	source: '',
	cursor: 0,
	data: undefined,

	parse: function(source) {
		this.source = this.working = source;
		this.cursor = 0;
		this.data = this.getThing();
		if(this.source.slice(this.cursor).trim()!='')
			throw(new ParseError(this,"Didn't parse all input","check for unmatched brackets"));
		return this.data;
	},

	lStripComments: function() {
		this.working = this.working.replace(/^(\s*\/\/.*(\n|$)\s*)*\s*/,'');
		this.cursor = this.source.length - this.working.length;
	},

	stripSpace: function() {
		this.working = this.working.replace(/^[ \t\r\x0b\x0c]*/,'');
		this.cursor = this.source.length - this.working.length;
	},

	consume: function(n) {
		this.working = this.working.slice(n);
		this.cursor += n;
	},

	getThing: function() {
		this.lStripComments();
		switch(this.working[0])
		{
		//object
		case '{':
			this.consume(1);
			this.lStripComments();
			
			var obj = {};
			while(this.working.length && this.working[0]!='}')
			{
				var re_name = /^(\w*)$/;
				var i = this.working.indexOf(':');
				if(i==-1)
					throw(new ParseError(this,'Expected a colon'));

				var name = this.working.slice(0,i).trim();
				if(!name.match(re_name))
					throw(new ParseError(this,'Invalid name '+name+' for an object property','check for mismatched brackets'));

				this.consume(i+1);

				var thing = this.getThing();
				obj[name] = thing;

				this.stripSpace();

				if(this.working[0]=='\n' || this.working[0]==',')
				{
					this.consume(1);
					this.lStripComments();
				}
				else if(this.working.slice(0,2)=='//')
				{
					this.lStripComments();
				}
				else if(this.working[0]=='}')
				{
					break;
				}
				else
				{
					throw(new ParseError(this,'Expected either } or , in object definition'));
				}
			}
			if(this.working.length==0)
				throw(new ParseError(this,'Expected a } to close an object'));

			this.consume(1);
			return obj;

		//array
		case '[':
			this.consume(1);
			this.lStripComments();

			var arr = [];
			while(this.working.length && this.working[0]!=']')
			{
				var thing = this.getThing();
				arr.push(thing);

				this.stripSpace();
				
				if(this.working[0]=='\n' || this.working[0]==',')
				{
					this.consume(1);
					this.lStripComments();
				}
				else if(this.working.slice(0,2)=='//')
				{
					this.lStripComments();
				}
				else
				{
					this.lStripComments();
					if(this.working[0]==']')
						break;
					else
						throw(new ParseError(this,"Expected either , or ] in array definition"));
				}
			}

			if(this.working.length==0)
				throw(new ParseError("Expected a ] to end an array"));

			this.consume(1);
			return arr;

		//string literal delimited by double quotes
		case '"':
			if(this.working.slice(0,3)=='"""')	//triple-quoted string
			{
				this.consume(3);
				var i = this.working.indexOf('"""');
				if(i==-1)
					throw(new ParseError(this,'Expected """ to end string literal'));
				var str = this.working.slice(0,i);
				this.consume(i+3);
				return str;
			}
			else
			{
				this.consume(1);
				var i = this.working.indexOf('"');
				if(i==-1)
					throw(new ParseError(this,'Expected " to end string literal'));
				var str = this.working.slice(0,i);
				this.consume(i+1);
				return str;
			}

		//string literal delimited by single quotes
		case "'":
			if(this.working.slice(0,3)=="'''")	//triple-quoted string
			{
				this.consume(3);
				var i = this.working.indexOf("'''");
				if(i==-1)
					throw(new ParseError(this,"Expected '''to end string literal"));
				var str = this.working.slice(0,i);
				this.consume(i+3);
				return str;
			}
			else
			{
				this.consume(1);
				var i = this.working.indexOf("'");
				if(i==-1)
					throw(new ParseError(this,"Expected ' to end string literal"));
				var str = this.working.slice(0,i);
				this.consume(i+1);
				return str;
			}

		//undelimited literal
		default:
			var i = this.working.search(/([\]\}\n,:]|\/\/|$)/);

			var v = this.working.slice(0,i).trim();
			var l = v.toLowerCase();
			this.consume(i);

			if(parseFloat(v)==v)
			{
				return parseFloat(v);
			}
			else if(l=='true')
				return true;
			else if(l=='false')
				return false;
			else
				return v;
		}
	}
}

parseExam = function(source)
{
	var parser = new ExamParser();
	return parser.parse(source);
}

})();
