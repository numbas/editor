/*
Copyright 2011 Newcastle University

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
var Numbas = {};
(function() {
Numbas.util = {
	//shallow copy of array
	copyarray: function(arr)
	{
		return arr.slice();
	},

	//shallow copy of object
	copyobj: function(obj)
	{
		var newobj={};
		for(x in obj)
		{
			newobj[x]=obj[x];
		}
		return newobj;
	},

	//shallow copy object into already existing object
	copyinto: function(src,dest)
	{
		for(var x in src)
		{
			if(dest[x]===undefined)
				dest[x]=src[x]
		}
	},

	//test if parameter is an integer
	isInt: function(i)
	{
		return parseInt(i,10)==i;
	},

	//test if parameter is a float
	isFloat: function(f)
	{
		return parseFloat(f)==f;
	},

	isBool: function(b)
	{
		if(b==null) { return false; }
		if(typeof(b)=='boolean') { return true; }

		b = b.toString().toLowerCase();
		return b=='false' || b=='true' || b=='yes' || b=='no';
	},

	//parse parameter as a boolean
	parseBool: function(b)
	{
		if(!b)
			return false;
		b = b.toString().toLowerCase();
		return( b=='true' || b=='yes' );
	},

	escapeString: function(s)
	{
		if(s===undefined)
			return '';
		return s.replace(/\\n/g,'\n');
	},


	//split content text up by TeX delimiters
	contentsplitbrackets: function(t)
	{
		var o=[];
		var l=t.length;
		var s=0;
		for(var i=0;i<l;i++)
		{
			if(t.charAt(i)=='$')
			{
				o.push(t.slice(s,i));
				o.push('$');
				s=i+1;
			}
			else if (i<l-1 && t.charAt(i)=='\\' && (t.charAt(i+1)=='[' || t.charAt(i+1)==']'))
			{
				o.push(t.slice(s,i));
				o.push(t.slice(i,i+2));
				s=i+2;
				i+=1;
			}
			else if( i<l-1 && t.slice(i,i+2)=='%%' )
			{
				o.push(t.slice(s,i));
				o.push('%%');
				s=i+2;
				i+=1;
			}
		}
		if(s<l)
			o.push(t.slice(s));
		else
			o.push('');
		return o;
	}
};


//Because indexOf not supported in IE
if(!Array.indexOf)
{
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++){
			if(this[i]==obj){
				return i;
			}
		}
		return -1;
	};
}

//nice short 'string contains' function
if(!String.prototype.contains)
{
	String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}
if(!Array.prototype.contains)
{
	Array.prototype.contains = function(it) { return this.indexOf(it) != -1; };
}

//merge one array into another, only adding elements which aren't already present
if(!Array.prototype.merge)
{
	Array.prototype.merge = function(arr)
	{
		var out = this.slice();
		for(var i=0;i<arr.length;i++)
		{
			if(!out.contains(arr[i]))
				out.push(arr[i]);
		}
		return out;
	};
}

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */

var cbSplit;

// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {

cbSplit = function (str, separator, limit) {
    // if `separator` is not a regex, use the native `split`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        return cbSplit._nativeSplit.call(str, separator, limit);
    }

    var output = [],
        lastLastIndex = 0,
        flags = (separator.ignoreCase ? "i" : "") +
                (separator.multiline  ? "m" : "") +
                (separator.sticky     ? "y" : ""),
        separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
        separator2, match, lastIndex, lastLength;

    str = str + ""; // type conversion
    if (!cbSplit._compliantExecNpcg) {
        separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
    }

    /* behavior for `limit`: if it's...
    - `undefined`: no limit.
    - `NaN` or zero: return an empty array.
    - a positive number: use `Math.floor(limit)`.
    - a negative number: no limit.
    - other: type-convert, then use the above rules. */
    if (limit === undefined || +limit < 0) {
        limit = Infinity;
    } else {
        limit = Math.floor(+limit);
        if (!limit) {
            return [];
        }
    }

    while (match = separator.exec(str)) {
        lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser

        if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));

            // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
            if (!cbSplit._compliantExecNpcg && match.length > 1) {
                match[0].replace(separator2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) {
                            match[i] = undefined;
                        }
                    }
                });
            }

            if (match.length > 1 && match.index < str.length) {
                Array.prototype.push.apply(output, match.slice(1));
            }

            lastLength = match[0].length;
            lastLastIndex = lastIndex;

            if (output.length >= limit) {
                break;
            }
        }

        if (separator.lastIndex === match.index) {
            separator.lastIndex++; // avoid an infinite loop
        }
    }

    if (lastLastIndex === str.length) {
        if (lastLength || !separator.test("")) {
            output.push("");
        }
    } else {
        output.push(str.slice(lastLastIndex));
    }

    return output.length > limit ? output.slice(0, limit) : output;
};


/***************************************
*
*	Javascript Textile->HTML conversion
*
*	ben@ben-daglish.net (with thanks to John Hughes for improvements)
*   Issued under the "do what you like with it - I take no respnsibility" licence
****************************************/


(function() {
var inpr,inbq,inbqq,html;
var aliases = new Array;
var alg={'>':'right','<':'left','=':'center','<>':'justify','~':'bottom','^':'top'};
var ent={"'":"&#8217;"," - ":" &#8211; ","--":"&#8212;"," x ":" &#215; ","\\.\\.\\.":"&#8230;","\\(C\\)":"&#169;","\\(R\\)":"&#174;","\\(TM\\)":"&#8482;"};
var tags={"b":"\\*\\*","i":"__","em":"_","strong":"\\*","cite":"\\?\\?","sup":"\\^","sub":"~","span":"\\%","del":"-","code":"@","ins":"\\+","del":"-"};
var le="\n\n";
var lstlev=0,lst="",elst="",intable=0,mm="";
var para = /^p(\S*)\.\s*(.*)/;
var rfn = /^fn(\d+)\.\s*(.*)/;
var bq = /^bq\.(\.)?\s*/;
var table=/^table\s*{(.*)}\..*/;
var trstyle = /^\{(\S+)\}\.\s*\|/;
Numbas.util.textile = function(t) {
	t+='\n';
	var lines = t.split(/\r?\n/);
	html="";
	inpr=inbq=inbqq=0;
/*	for(var i=0;i<lines.length;i++) {
		if(lines[i].indexOf("[") == 0) {
			var m = lines[i].indexOf("]");
			aliases[lines[i].substring(1,m)]=lines[i].substring(m+1);
		}
	}
*/
	for(var i=0;i<lines.length;i++) {
		//if (lines[i].indexOf("[") == 0) {continue;}
		if(mm=para.exec(lines[i])){stp(1);inpr=1;html += lines[i].replace(para,"<p"+make_attr(mm[1])+">"+prep(mm[2]));continue;}
		if(mm = /^h(\d)(\S*)\.\s*(.*)/.exec(lines[i])){stp(1);html += tag("h"+mm[1],make_attr(mm[2]),prep(mm[3]))+le;continue;}
		if(mm=rfn.exec(lines[i])){stp(1);inpr=1;html+=lines[i].replace(rfn,'<p id="fn'+mm[1]+'"><sup>'+mm[1]+'<\/sup>'+prep(mm[2]));continue;}
		if (lines[i].indexOf("*") == 0) {lst="<ul>";elst="<\/ul>";}
		else if (lines[i].indexOf("#") == 0) {lst="<\ol>";elst="<\/ol>";}
		else {while (lstlev > 0) {html += elst;if(lstlev > 1){html += "<\/li>";}else{html+="\n";}html+="\n";lstlev--;}lst="";}
		if(lst) {
			stp(1);
			var m = /^([*#]+)\s*(.*)/.exec(lines[i]);
			var lev = m[1].length;
			while(lev < lstlev) {html += elst+"<\/li>\n";lstlev--;}
			while(lstlev < lev) {html=html.replace(/<\/li>\n$/,"\n");html += lst;lstlev++;}
			html += tag("li","",prep(m[2]))+"\n";
			continue;
		}
		if (lines[i].match(table)){stp(1);intable=1;html += lines[i].replace(table,'<table style="$1;">\n');continue;}
		if ((lines[i].indexOf("|") == 0)  || (lines[i].match(trstyle)) ) {
			stp(1);
			if(!intable) {html += "<table>\n";intable=1;}
			var rowst="";var trow="";
			var ts=trstyle.exec(lines[i]);
			if(ts){rowst=qat('style',ts[1]);lines[i]=lines[i].replace(trstyle,"\|");}
			var cells = lines[i].split("|");
			for(j=1;j<cells.length-1;j++) {
				var ttag="td";
				if(cells[j].indexOf("_.")==0) {ttag="th";cells[j]=cells[j].substring(2);}
				cells[j]=prep(cells[j]);
				var al=/^([<>=^~\/\\\{]+.*?)\.(.*)/.exec(cells[j]);
				var at="",st="";
				if(al != null) {
					cells[j]=al[2];
					var cs= /\\(\d+)/.exec(al[1]);if(cs != null){at +=qat('colspan',cs[1]);}
					var rs= /\/(\d+)/.exec(al[1]);if(rs != null){at +=qat('rowspan',rs[1]);}
					var va= /([\^~])/.exec(al[1]);if(va != null){st +="vertical-align:"+alg[va[1]]+";";}
					var ta= /(<>|=|<|>)/.exec(al[1]);if(ta != null){st +="text-align:"+alg[ta[1]]+";";}
					var is= /\{([^\}]+)\}/.exec(al[1]);if(is != null){st +=is[1];}
					if(st != ""){at+=qat('style',st);}					
				}
				trow += tag(ttag,at,cells[j]);
			}
			html += "\t"+tag("tr",rowst,trow)+"\n";
			continue;
		}
		if(intable) {html += "<\/table>"+le;intable=0;}

		if (lines[i]=="") {stp();}
		else if (!inpr) {
			if(mm=bq.exec(lines[i])){lines[i]=lines[i].replace(bq,"");html +="<blockquote>";inbq=1;if(mm[1]) {inbqq=1;}}
			if(lines.length>2)
			{
				html += "<p>"+prep(lines[i]);inpr=1;
			}
			else
				html += prep(lines[i]);
		}
		else {html += prep(lines[i]);}
	}
	stp();
	if(intable)
	{
		html+='<\/table>'+le;
		intable=0;
	}
	while (lstlev > 0) 
	{
		html += elst;
		if(lstlev > 1)
		{
			html += "<\/li>";
		}
		else
		{
			html+="\n";
		}
		html+="\n";
		lstlev--;
	}
	lst="";
	return html;
}

function prep(m){
	var bits = Numbas.util.contentsplitbrackets(m);
	var i;
	for( var j=0; j<bits.length; j+=4)
	{
		m = bits[j]
	
		for(i in ent) {m=m.replace(new RegExp(i,"g"),ent[i]);}
		for(i in tags) {
			m = make_tag(m,RegExp("^"+tags[i]+"(.+?)"+tags[i]),i,"");
			m = make_tag(m,RegExp(" "+tags[i]+"(.+?)"+tags[i]),i," ");
		}
		m=m.replace(/\[(\d+)\]/g,'<sup><a href="#fn$1">$1<\/a><\/sup>');
		m=m.replace(/([A-Z]+)\((.*?)\)/g,'<acronym title="$2">$1<\/acronym>');
		m=m.replace(/\"([^\"]+)\":((http|https|mailto):\S+)/g,'<a href="$2">$1<\/a>');
		m = make_image(m,/!([^!\s]+)!:(\S+)/);
		m = make_image(m,/!([^!\s]+)!/);
		m=m.replace(/"([^\"]+)":(\S+)/g,function($0,$1,$2){return tag("a",qat('href',aliases[$2]),$1)});
		m=m.replace(/(=)?"([^\"]+)"/g,function($0,$1,$2){return ($1)?$0:"&#8220;"+$2+"&#8221;"});

		bits[j] = m;
	}
	m = bits.join('');
	return m;
}

function make_tag(s,re,t,sp) {
	var m;
	while(m = re.exec(s)) {
		var st = make_attr(m[1]);
		m[1]=m[1].replace(/^[\[\{\(]\S+[\]\}\)]/g,"");
		m[1]=m[1].replace(/^[<>=()]+/,"");
		s = s.replace(re,sp+tag(t,st,m[1]));
	}
	return s;
}

function make_image(m,re) {
	var ma = re.exec(m);
	if(ma != null) {
		var attr="";var st="";
		var at = /\((.*)\)$/.exec(ma[1]);
		if(at != null) {attr = qat('alt',at[1])+qat("title",at[1]);ma[1]=ma[1].replace(/\((.*)\)$/,"");}
		if(ma[1].match(/^[><]/)) {st = "float:"+((ma[1].indexOf(">")==0)?"right;":"left;");ma[1]=ma[1].replace(/^[><]/,"");}
		var pdl = /(\(+)/.exec(ma[1]);if(pdl){st+="padding-left:"+pdl[1].length+"em;";}
		var pdr = /(\)+)/.exec(ma[1]);if(pdr){st+="padding-right:"+pdr[1].length+"em;";}
		if(st){attr += qat('style',st);}
		var im = '<img src="'+ma[1]+'"'+attr+" />";
		if(ma.length >2) {im=tag('a',qat('href',ma[2]),im);}
		m = m.replace(re,im);
	}
	return m;
}

function make_attr(s) {
	var st="";var at="";
	if(!s){return "";}
	var l=/\[(\w\w)\]/.exec(s);
	if(l != null) {at += qat('lang',l[1]);}
	var ci=/\((\S+)\)/.exec(s);
	if(ci != null) {
		s = s.replace(/\((\S+)\)/,"");
		at += ci[1].replace(/#(.*)$/,' id="$1"').replace(/^(\S+)/,' class="$1"');
	}
	var ta= /(<>|=|<|>)/.exec(s);if(ta){st +="text-align:"+alg[ta[1]]+";";}
	var ss=/\{(\S+)\}/.exec(s);if(ss){st += ss[1];if(!ss[1].match(/;$/)){st+= ";";}}
	var pdl = /(\(+)/.exec(s);if(pdl){st+="padding-left:"+pdl[1].length+"em;";}
	var pdr = /(\)+)/.exec(s);if(pdr){st+="padding-right:"+pdr[1].length+"em;";}
	if(st) {at += qat('style',st);}
	return at;
}

function qat(a,v){return ' '+a+'="'+v+'"';}
function tag(t,a,c) {return "<"+t+a+">"+c+"</"+t+">";}
function stp(b){if(b){inbqq=0;}if(inpr){html+="<\/p>"+le;inpr=0;}if(inbq && !inbqq){html+="<\/blockquote>"+le;inbq=0;}}
})();

cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`

// for convenience...
if(!String.prototype.split)
{
	String.prototype.split = function (separator, limit) {
		return cbSplit(this, separator, limit);
	};
}

//from http://stackoverflow.com/questions/2308134/trim-in-javascript-not-working-in-ie
if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}


//from http://www.tutorialspoint.com/javascript/array_map.htm
if (!Array.prototype.map)
{
  Array.prototype.map = function(fun)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}

var math = Numbas.math = {
	
	//Operations to cope with complex numbers
	complex: function(re,im)
	{
		if(!im)
			return re;
		else
			return {re: re, im: im, complex: true, 
			toString: math.complexToString}
	},
	
	complexToString: function()
	{
		return math.niceNumber(this);
	},

	negate: function(n)
	{
		if(n.complex)
			return math.complex(-n.re,-n.im);
		else
			return -n;
	},

	conjugate: function(n)
	{
		if(n.complex)
			return math.complex(n.re,-n.im);
		else
			return n;
	},

	add: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return math.complex(a.re+b.re, a.im + b.im);
			else
				return math.complex(a.re+b, a.im);
		}
		else
		{
			if(b.complex)
				return math.complex(a + b.re, b.im);
			else
				return a+b;
		}
	},

	sub: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return math.complex(a.re-b.re, a.im - b.im);
			else
				return math.complex(a.re-b, a.im);
		}
		else
		{
			if(b.complex)
				return math.complex(a - b.re, -b.im);
			else
				return a-b;
		}
	},

	mul: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return math.complex(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re);
			else
				return math.complex(a.re*b, a.im*b);
		}
		else
		{
			if(b.complex)
				return math.complex(a*b.re, a*b.im);
			else
				return a*b;
		}
	},

	div: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
			{
				var q = b.re*b.re + b.im*b.im;
				return math.complex((a.re*b.re + a.im*b.im)/q, (a.im*b.re - a.re*b.im)/q);
			}
			else
				return math.complex(a.re/b, a.im/b);
		}
		else
		{
			if(b.complex)
			{
				var q = b.re*b.re + b.im*b.im;
				return math.complex(b.re/q, -b.im/q);
			}
			else
				return a/b;
		}
	},

	pow: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
			{
				var ss = a.re*a.re + a.im*a.im;
				var arg1 = math.arg(a);
				var mag = Math.pow(ss,b.re/2) * Math.exp(-b.im*arg1);
				var arg = b.re*arg1 + (b.im * Math.log(ss))/2;
				return math.complex(mag*Math.cos(arg), mag*Math.sin(arg));
			}
			else
			{
				var mag = Math.pow( math.abs(a), b);
				var arg = math.arg(a) * b;
				return math.complex( mag*Math.cos(arg), mag*Math.sin(arg) );
			}
		}
		else
		{
			if(b.complex)
			{
				var mag = Math.pow(a,b.re);
				var arg = b.im * Math.log(a);
				return math.complex( mag*Math.cos(arg), mag*Math.sin(arg) );
			}
			else
				return Math.pow(a,b);
		}
	},

	root: function(a,b)
	{
		if(a.complex || b.complex)
			return math.pow(b,div(1,a));
		else
			return Math.pow(b,1/a);
	},

	sqrt: function(n)
	{
		if(n.complex)
		{
			var r = math.abs(n);
			return math.complex( Math.sqrt((r+n.re)/2), (n.im<0 ? -1 : 1) * Math.sqrt((r-n.re)/2));
		}
		else if(n<0)
			return math.complex(0,Math.sqrt(-n));
		else
			return Math.sqrt(n)
	},

	log: function(n)
	{
		if(n.complex)
		{
			var mag = math.abs(n);
			var arg = math.arg(n);
			return math.complex(Math.log(mag), arg);
		}
		else
			return Math.log(n);
	},

	exp: function(n)
	{
		if(n.complex)
		{
			return math.complex( Math.exp(n.re) * Math.cos(n.im), Math.exp(n.re) * Math.sin(n.im) );
		}
		else
			return Math.exp(n);
	},
	
	//magnitude of a number
	abs: function(n)
	{
		if(n.complex)
		{
			if(n.re==0)
				return Math.abs(n.im);
			else if(n.im==0)
				return Math.abs(n.re);
			else
				return Math.sqrt(n.re*n.re + n.im*n.im)
		}
		else
			return Math.abs(n);
	},

	//argument of a (complex) numbers
	arg: function(n)
	{
		if(n.complex)
			return Math.atan2(n.im,n.re);
		else
			return Math.atan2(0,n);
	},

	//real part of a number
	re: function(n)
	{
		if(n.complex)
			return n.re;
		else
			return n;
	},

	//imaginary part of a number
	im: function(n)
	{
		if(n.complex)
			return n.im;
		else
			return 0;
	},

	//Ordering relations
	//could go with lexicographic order on complex numbers, but that isn't that useful anyway, so just compare real parts
	lt: function(a,b)
	{
		if(a.complex)
			a=a.re;
		if(b.complex)
			b=b.re;
		return a<b;
	},

	gt: function(a,b)
	{
		if(a.complex)
			a=a.re;
		if(b.complex)
			b=b.re;
		return a>b;
	},

	leq: function(a,b)
	{
		if(a.complex)
			a=a.re;
		if(b.complex)
			b=b.re;
		return a<=b;
	},
	
	geq: function(a,b)
	{
		if(a.complex)
			a=a.re;
		if(b.complex)
			b=b.re;
		return a>=b;
	},

	eq: function(a,b)
	{
		if(a.complex)
		{
			if(b.complex)
				return (a.re==b.re && a.im==b.im);
			else
				return (a.re==b && a.im==0);
		}
		else
		{
			if(b.complex)
				return (a==b.re && b.im==0);
			else
				return a==b;
		}
	},

	max: function(a,b)
	{
		if(a.complex)
			a = a.re;
		if(b.complex)
			b = b.re;
		return Math.max(a,b);
	},

	min: function(a,b)
	{
		if(a.complex)
			a = a.re;
		if(b.complex)
			b = b.re;
		return Math.min(a,b);
	},
	
	neq: function(a,b)
	{
		return !math.eq(a,b);
	},

	//If number is a*pi^n, return n, otherwise return 0
	piDegree: function(n)
	{
		n=Math.abs(n);
		for(degree=1; (a=n/Math.pow(Math.PI,degree))>1 && Math.abs(a-math.round(a))>0.00000001; degree++) {}
		return( a>=1 ? degree : 0 );
	},

	//display a number nicely - rounds off to 10dp so floating point errors aren't displayed
	niceNumber: function(n)
	{
		if(n.complex)
		{
			var re = math.niceNumber(n.re);
			var im = math.niceNumber(n.im);
			if(n.im==0)
				return re+'';
			else if(n.re==0)
			{
				if(n.im==1)
					return 'i';
				else if(n.im==-1)
					return '-i';
				else
					return im+'*i';
			}
			else if(n.im<0)
			{
				if(n.im==-1)
					return re+' - i';
				else
					return re+im+'*i';
			}
			else
			{
				if(n.im==1)
					return re+' + '+'i';
				else
					return re+' + '+im+'*i';
			}
		}
		else	
		{
			if((piD = math.piDegree(n)) > 0)
				n /= Math.pow(Math.PI,piD);

			out = math.precround(n,10)+'';
			switch(piD)
			{
			case 0:
				return out;
			case 1:
				if(n==1)
					return 'pi';
				else
					return out+'*pi';
			default:
				if(n==1)
					return 'pi^'+piD;
				else
					return out+'*pi'+piD;
			}
		}
	},
	//returns a random number in range [0..N-1]
	randomint: function(N) {
		return Math.floor(N*(Math.random()%1)); 
	},

	//a random shuffling of the numbers [0..N-1]
	deal: function(N) 
	{ 
		var J, K, Q = new Array(N);
		for (J=0 ; J<N ; J++)
			{ K = math.randomint(J+1) ; Q[J] = Q[K] ; Q[K] = J; }
		return Q; 
	},

	//returns the inverse of a shuffling
	inverse: function(l)
	{
		arr = new Array(l.length);
		for(var i=0;i<l.length;i++)
		{
			arr[l[i]]=i;
		}
		return arr;
	},

	//just the numbers from 1 to n in array!
	range: function(n)
	{
		var arr=new Array(n);
		for(var i=0;i<n;i++)
		{
			arr[i]=i;
		}
		return arr;
	},

	precround: function(a,b) {
		if(b.complex)
			throw(new Error("Can't round to a complex number of decimal places"));
		if(a.complex)
			return math.complex(math.precround(a.re,b),math.precround(a.im,b));
		else
		{
			b = Math.pow(10,b);
			return Math.round(a*b)/b;
		}
	},

	factorial: function(n)
	{
		if(n<=1) {
			return 1;
		}else{
			var j=1;
			for(var i=2;i<=n;i++)
			{
				j*=i;
			}
			return j;
		}
	},

	log10: function(x)
	{
		return mul(math.log(x),Math.LOG10E);
	},

	radians: function(x) {
		return mul(x,Math.PI/180);
	},
	degrees: function(x) {
		return mul(x,180/Math.PI);
	},
	cos: function(x) {
		if(x.complex)
		{
			return math.complex(Math.cos(x.re)*math.cosh(x.im), -Math.sin(x.re)*math.sinh(x.im));
		}
		else
			return Math.cos(x);
	},
	sin: function(x) {
		if(x.complex)
		{
			return math.complex(Math.sin(x.re)*math.cosh(x.im), -Math.cos(x.re)*math.sinh(x.im));
		}
		else
			return Math.sin(x);
	},
	tan: function(x) {
		if(x.complex)
			return div(math.sin(x),math.cos(x));
		else
			return Math.tan(x);
	},
	cosec: function(x) {
		return div(1,math.sin(x));
	},
	sec: function(x) {
		return div(1,math.cos(x));
	},
	cot: function(x) {
		return div(1,math.tan(x));
	},
	arcsin: function(x) {
		if(x.complex)
		{
			var i = math.complex(0,1), ni = math.complex(0,-1);
			var ex = add(mul(x,i),math.sqrt(sub(1,mul(x,x))));
			return mul(ni,math.log(ex));
		}
		else
			return Math.asin(x);
	},
	arccos: function(x) {
		if(x.complex)
		{
			var i = math.complex(0,1), ni = math.complex(0,-1);
			var ex = add(x, mul(i, math.sqrt( sub(1, mul(x,x)) ) ) );
			return mul(ni,math.log(ex));
		}
		else
			return Math.acos(x);
	},
	arctan: function(x) {
		if(x.complex)
		{
			var i = math.complex(0,1);
			var ex = div(add(i,x),sub(i,x));
			return mul(math.complex(0,0,5), math.log(ex));
		}
		else
			return Math.atan(x);
	},
	sinh: function(x) {
		if(x.complex)
			return div(sub(math.exp(x), math.exp(math.negate(x))),2);
		else
			return (Math.exp(x)-Math.exp(-x))/2;
	},
	cosh: function(x) {
		if(x.complex)
			return div(add(math.exp(x), math.exp(math.negate(x))),2);
		else
			return (Math.exp(x)-Math.exp(-x))/2
	},
	tanh: function(x) {
		return math.sinh(x)/math.cosh(x);
	},
	cosech: function(x) {
		return div(1,math.sinh(x));
	},
	sech: function(x) {
		return div(1,math.cosh(x));
	},
	coth: function(x) {
		return div(1,math.tanh(x));
	},
	arcsinh: function(x) {
		if(x.complex)
			return math.log(add(x, math.sqrt(add(mul(x,x),1))));
		else
			return Math.log(x + Math.sqrt(x*x+1));
	},
	arccosh: function (x) {
		if(x.complex)
			return math.log(add(x, math.sqrt(sub(mul(x,x),1))));
		else
			return Math.log(x + Math.sqrt(x*x-1));
	},
	arctanh: function (x) {
		if(x.complex)
			return div(math.log(div(add(1,x),sub(1,x))),2);
		else
			return 0.5 * Math.log((1+x)/(1-x));
	},

	//round UP to nearest integer
	ceil: function(x) {
		if(x.complex)
			return math.complex(math.ceil(x.re),math.ceil(x.im));
		else
			return Math.ceil(x);
	},

	//round DOWN to nearest integer
	floor: function(x) {
		if(x.complex)
			return math.complex(math.floor(x.re),math.floor(x.im));
		else
			return Math.floor(x);
	},

	//round to nearest integer
	round: function(x) {
		if(x.complex)
			return math.complex(math.round(x.re),math.round(x.im));
		else
			return Math.round(x);
	},

	//chop off decimal part
	trunc: function(x) {
		if(x.complex)
			x=x.re;

		if(x>0) {
			return Math.floor(x);
		}else{
			return Math.ceil(x);
		}
	},
	fract: function(x) {
		if(x.complex)
			x=x.re;

		return x-math.trunc(x);
	},
	sign: function(x) {
		if(x.complex)
			x=x.re;

		if(x==0) {
			return 0;
		}else if (x>0) {
			return 1;
		}else {
			return -1;
		}
	},

	//return random real number between max and min
	randomrange: function(min,max)
	{
		return Math.random()*(max-min)+min;
	},

	//call as random([min,max,step])
	//returns random choice from 'min' to 'max' at 'step' intervals
	//if all the values in the range are appended to the list, eg [min,max,step,v1,v2,v3,...], just pick randomly from the values
	random: function(range)
	{
		if(range.length>3)	//if values in range are given
		{
			return math.choose(range.slice(3));
		}
		else
		{
			if(range[2]==0)
			{
				return math.randomrange(range[0],range[1]);
			}
			else
			{
				var diff = range[1]-range[0];
				var steps = diff/range[2];
				var n = Math.floor(math.randomrange(0,steps+1));
				return range[0]+n*range[2];
			}
		}
	},

	//choose one item from an array
	choose: function(variables)
	{
		var n = Math.floor(math.randomrange(0,variables.length));
		return variables[n];
	},


	// from http://dreaminginjavascript.wordpress.com/2008/11/08/combinations-and-permutations-in-javascript/ 
	//(public domain)
	productRange: function(a,b) {
		if(a>b)
			return 1;
		var product=a,i=a;
		while (i++<b) {
			product*=i;
		}
		return product;
	},
	 
	combinations: function(n,k) {
		if(n.complex || k.complex)
			throw(new Error("Can't compute combinations of complex numbers"));

		k=Math.max(k,n-k);
		return math.productRange(k+1,n)/math.productRange(1,n-k);
	},

	permutations: function(n,k) {
		if(n.complex || k.complex)
			throw(new Error("Can't compute permutations of complex numbers"));

		return math.productRange(k+1,n);
	},

	divides: function(a,b) {
		if(a.complex || b.complex || !Numbas.util.isInt(a) || !Numbas.util.isInt(b))
			return false;

		return (b % a) == 0;
	},

	gcf: function(a,b) {
		if(a.complex || b.complex)
			throw(new Error("Can't compute GCF of complex numbers"));

		if(Math.floor(a)!=a || Math.floor(b)!=b)
			return 1;
		a = Math.floor(Math.abs(a));
		b = Math.floor(Math.abs(b));
		
		var c=0;
		if(a<b) { c=a; a=b; b=c; }		

		if(b==0){return 1;}
		
		while(a % b != 0) {
			c=b;
			b=a % b;
			a=c;
		}
		return b;
	},

	lcm: function(a,b) {
		if(a.complex || b.complex)
			throw(new Error("Can't compute LCM of complex numbers"));
		a = Math.floor(Math.abs(a));
		b = Math.floor(Math.abs(b));
		
		var c = math.gcf(a,b);
		return a*b/c;
	},


	siground: function(a,b) {
		if(b.complex)
			throw(new Error("Can't round to a complex number of sig figs"));
		if(a.complex)
			return math.complex(math.siground(a.re,b),math.siground(a.im,b));
		else
		{
			if(a==0) { return a; }
			b = Math.pow(10,Math.ceil(Math.log(a)/Math.log(10))-b);
			return Math.round(a/b)*b;
		}
	},

	defineRange: function(a,b)
	{
		if(a.complex)
			a=a.re;
		if(b.complex)
			b=b.re;
		return [a,b,1];
	},
	rangeSteps: function(a,b)
	{
		if(b.complex)
			b=b.re;
		return [a[0],a[1],Math.abs(b)];
	},

	//Get a rational approximation to a real number by the continued fractions method
	//if accuracy is given, the returned answer will be within exp(-accuracy) of the original number
	rationalApproximation: function(n,accuracy)
	{
		if(accuracy===undefined)
			accuracy = 15;
		accuracy = Math.exp(-accuracy);

		var on = n;
		var e = Math.floor(n);
		if(e==n)
			return [n,1];
		var l = 0;
		var frac = [];
		while(Math.abs(on-e)>accuracy)
		{
			l+=1;
			var i = Math.floor(n);
			frac.push(i);
			n = 1/(n-i);
			var e = Infinity;
			for(var j=l-1;j>=0;j--)
			{
				e = frac[j]+1/e;
			}
		}
		var f = [1,0];
		for(j=l-1;j>=0;j--)
		{
			f = [frac[j]*f[0]+f[1],f[0]];
		}
		return f;
	}
};

var add = math.add, sub = math.sub, mul = math.mul, div = math.div;

var jme = Numbas.jme = {

	tokenise: function(expr)
	//takes a string in and returns a list of tokens 
	{
		if(!expr)
			return [];
	
		expr += '';

		expr = expr.replace(/\\sub *\\\\space/g,'');	//get rid of stupid hack which avoids times symbols
		expr = expr.replace(/^\s+|\s+$/g, '');	//get rid of whitespace

		var tokens = [];
		var i = 0;
		var re_bool = /^true|^false/;
		var re_number = /^[0-9]+(?:\x2E[0-9]+)?/;
		var re_name = /^{?((?:\$?[a-zA-Z][a-zA-Z0-9]*'*)|\?)}?/i;
		var re_op = /^(_|\.\.|#|not|and|or|xor|isa|<=|>=|<>|&&|\|\||[\|*+\-\/\^<>=!])/i;
		var re_punctuation = /^([\(\),\[\]])/;
		var re_string = /^("([^"]*)")|^('([^']*)')/;
		var re_special = /^\\\\([%!+\-\,\.\/\:;\?\[\]=\*\&<>\|~\(\)]|\d|([a-zA-Z]+))/;
		
		while( expr.length )
		{
			expr = expr.replace(/^\s+|\s+$/g, '');	//get rid of whitespace
		
			var result;
			var token;
			if(result = expr.match(re_number))
			{
				token = new TNum(result[0]);

				if(tokens.length>0 && (tokens[tokens.length-1].type==')'))
				{
					tokens.push(new TOp('*'));
				}
			}
			else if (result = expr.match(re_bool))
			{
				token = new TBool(Numbas.util.parseBool(result[0]));
			}
			else if (result = expr.match(re_op))
			{
				token = result[0];
				if(result[0]=='+' || result[0]=='-') 
				{
					if(tokens.length>0) 
					{
						switch(tokens[tokens.length-1].type) 
						{
						case '(':
						case ',':
						case 'op':
							token=result[0]+'u';		// '+u' and '-u' are the unary sign-changing operations, used if preceding token is appropriate punctuation or another operator
						}
					}else{
						token=result[0]+'u';		// + or - at start of expression are interpreted to be unary sign thingies too
					}
				}
				token=new TOp(token);
			}
			else if (result = expr.match(re_name))
			{
				//see if this is something like xsin, i.e. a single-letter variable name concatenated with a function name
				var bit = result[1].match(builtinsre);
				if(bit && bit[0].length==result[1].length-1)
					{result[1] = result[1].substring(0,result[1].length-bit[0].length);}
				else
					{bit=null;}

				// fill in constants here to avoid having more 'variables' than necessary
				if(result[1].toLowerCase()=='e') {
					token = new TNum(Math.E);

				}else if (result[1].toLowerCase()=='pi' || result[1].toLowerCase()=='\\pi') {
					token = new TNum(Math.PI);

				}else if (result[i].toLowerCase()=='i') {
					token = new TNum(math.complex(0,1));
				}else{
					token = new TName(result[1]);
				}
				
				if(tokens.length>0 && (tokens[tokens.length-1].type=='number' || tokens[tokens.length-1].type=='name' || tokens[tokens.length-1].type==')')) {	//number or right bracket followed by a name, eg '3y', is interpreted to mean multiplication, eg '3*y'
					tokens.push(new TOp('*'));
				}

				// if this was something like xsin, put 'x','*' tokens on stack, then 'sin' token is what we say we read
				if( bit )
				{
					tokens.push(new TName(result[1]));
					tokens.push(new TOp('*'));
					token=new TName(bit[0]);
				}
			}
			else if (result = expr.match(re_punctuation))
			{
				if(result[0]=='(' && tokens.length>0 && (tokens[tokens.length-1].type=='number' || tokens[tokens.length-1].type==')')) {	//number or right bracket followed by left parenthesis is also interpreted to mean multiplication
					tokens.push(new TOp('*'));
				}

				token = new TPunc(result[0]);
			}
			else if (result = expr.match(re_string))
			{
				var string = result[2] || result[4];
				string = Numbas.util.escapeString(string);
				token = new TString(string);
			}
			else if (result = expr.match(re_special))
			{
				var code = result[1] || result[2];
				
				var tex;
				var cons = TSpecial;
				if( varsymbols.contains(code) )	//varsymbols letters should act like variable names
				{
					cons = TName;
				}
				if(samesymbols.contains(code))	//numbers, punctuation, etc. can be left as they are
				{
					tex = code;
				}
				else if (symbols[code]!==undefined)	//is code in dictionary of things that have a particular translation?
				{
					tex = symbols[code];
				}
				else	//otherwise latex command must be the same as numbas, so stick a slash in front
				{
					tex = '\\'+code;
				}

				token = new cons(tex);
			}
			else
			{
				//invalid character or not able to match a token
				return undefined;
			}
			
			expr=expr.slice(result[0].length);	//chop found token off the expression
			
			tokens.push(token);
		}

		//rewrite some synonyms
		for(var i=0; i<tokens.length; i++)
		{
			if(tokens[i].name)
			{
				if(synonyms[tokens[i].name])
					tokens[i].name=synonyms[tokens[i].name];
			}
		}


		return(tokens);
	},

	shunt: function(tokens,functions)
	// turns tokenised infix expression into a parse tree (shunting yard algorithm, wikipedia has a good description)
	{
		var output = [];
		var stack = [];
		
		var numvars=[],olength=[],listmode=[];

		function addoutput(tok)
		{
			if(tok.vars!==undefined)
			{
				if(output.length<tok.vars)
					throw(new Error("Not enough arguments for operation "+tok.name));

				var thing = {tok: tok,
							 args: output.slice(-tok.vars)};
				output = output.slice(0,-tok.vars);
				output.push(thing);
			}
			else
				output.push({tok:tok});
		}

		for(var i = 0;i < tokens.length; i++ )
		{
			var tok = tokens[i];
			
			switch(tok.type) 
			{
			case "number":
			case "string":
			case 'boolean':
				addoutput(tok);
				break;
			case 'special':
				while( stack.length && stack[stack.length-1].type != "(" )
				{
					addoutput(stack.pop());
				}
				addoutput(tok);
				break;
			case "name":
				if( i<tokens.length-1 && tokens[i+1].type=="(")
				{
						stack.push(new TFunc(tok.name));
						numvars.push(0);
						olength.push(output.length);
				}
				else 
				{										//this is a variable otherwise
					addoutput(tok);
				}
				break;
				
			case ",":
				while( stack.length && stack[stack.length-1].type != "(" && stack[stack.length-1].type != '[')
				{	//reached end of expression defining function parameter, so pop all of its operations off stack and onto output
					addoutput(stack.pop())
				}

				numvars[numvars.length-1]++;

				if( ! stack.length )
				{
					throw(new Error("no matching left bracket in function"));
				}
				break;
				
			case "op":

				var o1 = precedence[tok.name];
				while(stack.length && stack[stack.length-1].type=="op" && ((o1 > precedence[stack[stack.length-1].name]) || (leftAssociative(tok.name) && o1 == precedence[stack[stack.length-1].name]))) 
				{	//while ops on stack have lower precedence, pop them onto output because they need to be calculated before this one. left-associative operators also pop off operations with equal precedence
					addoutput(stack.pop());
				}
				stack.push(tok);
				break;

			case '[':
				if(i==0 || tokens[i-1].type=='(' || tokens[i-1].type=='[' || tokens[i-1].type==',' || tokens[i-1].type=='op')	//define list
				{
					listmode.push('new');
				}
				else		//list index
					listmode.push('index');

				stack.push(tok);
				numvars.push(0);
				olength.push(output.length);
				break;

			case ']':
				while( stack.length && stack[stack.length-1].type != "[" ) 
				{
					addoutput(stack.pop());
				}
				if( ! stack.length ) 
				{
					throw(new Error("no matching left bracket"));
				}
				else
				{
					stack.pop();	//get rid of left bracket
				}

				//work out size of list
				var n = numvars.pop();
				var l = olength.pop();
				if(output.length>l)
					n++;

				switch(listmode.pop())
				{
				case 'new':
					addoutput(new TList(n))
					break;
				case 'index':
					var f = new TFunc('listval');
					f.vars = 2;
					addoutput(f);
					break;
				}
				break;
				
			case "(":
				stack.push(tok);
				break;
				
			case ")":
				while( stack.length && stack[stack.length-1].type != "(" ) 
				{
					addoutput(stack.pop());
				}
				if( ! stack.length ) 
				{
					throw(new Error("no matching left bracket"));
				}
				else
				{
					stack.pop();	//get rid of left bracket

					//if this is a function call, then the next thing on the stack should be a function name, which we need to pop
					if( stack.length && stack[stack.length-1].type=="function") 
					{	
						//work out arity of function
						var n = numvars.pop();
						var l = olength.pop();
						if(output.length>l)
							n++;
						var f = stack.pop();
						f.vars = n;

						addoutput(f);
					}
				}
				break;
			}
		}

		//pop all remaining ops on stack into output
		while(stack.length)
		{
			var x = stack.pop();
			if(x.type=="(")
			{
				throw(new Error( "no matching right bracket"));
			}
			else
			{
				addoutput(x);
			}
		}

		if(output.length>1)
			throw(new Error("Expression can't be evaluated -- missing an operator."));

		return(output[0]);
	},

	substituteTree: function(tree,variables,allowUnbound)
	{
		if(tree.tok.bound)
			return tree;

		if(tree.args===undefined)
		{
			if(tree.tok.type=='name')
			{
				var name = tree.tok.name;
				if(variables[name]===undefined)
				{
					if(allowUnbound)
						return {tok: new TName(name)};
					else
						throw new Error("Variable "+name+" is undefined");
				}
				else
				{
					if(variables[name].tok)
						return variables[name];
					else
						return {tok: variables[name]};
				}
			}
			else
				return tree;
		}
		else
		{
			tree = {tok: tree.tok,
					args: tree.args.slice()};
			for(var i=0;i<tree.args.length;i++)
				tree.args[i] = jme.substituteTree(tree.args[i],variables,allowUnbound);
			return tree;
		}
	},

	bind: function(tree,variables,functions)
	{
		if(tree.bound)
			return
		if(tree.args)
		{
			for(var i=0;i<tree.args.length;i++)
				jme.bind(tree.args[i],variables,functions);
		}

		jme.typecheck(tree,functions);
		tree.tok.bound = true;
	},

	evaluate: function(tree,variables,functions)
	{
		if( typeof(tree)=='string' )
			tree = jme.compile(tree,functions);

		if(variables===undefined)
			variables = {};
		if(functions===undefined)
			functions = {};
		else
			functions = Numbas.util.copyobj(functions);
		for(var x in builtins)
		{
			if(functions[x]===undefined)
				functions[x]=builtins[x];
			else
				functions[x]=functions[x].concat(builtins[x]);
		}

		tree = jme.substituteTree(tree,variables,true);
		jme.bind(tree,variables,functions);	//

		var tok = tree.tok;
		switch(tok.type)
		{
		case 'number':
		case 'boolean':
		case 'range':
			return tok;
		case 'list':
			if(tok.value===undefined)
			{
				tok.value = [];
				for(var i=0;i<tree.args.length;i++)
				{
					tok.value[i] = jme.evaluate(tree.args[i],variables,functions);
				}
			}
			return tok;
		case 'string':
			return new TString(jme.contentsubvars(tok.value,variables,functions));
		case 'name':
			if(variables[tok.name.toLowerCase()])
				return variables[tok.name.toLowerCase()];
			else
				return tok;
				throw(new Error("Variable "+tok.name+" not defined"));
			break;
		case 'op':
		case 'function':
			return tok.fn.evaluate(tree.args,variables,functions);
		default:
			return tok;
		}
	},

	compile: function(expr,functions,notypecheck) 
	{
		expr+='';	//make sure expression is a string and not a number or anything like that

		if(!expr.trim().length)
			return null;
		//typecheck
		if(functions===undefined)
			functions = {};
		else
			functions = Numbas.util.copyobj(functions);
		for(var x in builtins)
		{
			if(functions[x]===undefined)
				functions[x]=builtins[x];
			else
				functions[x]=functions[x].concat(builtins[x]);
		}


		//tokenise expression
		var tokens = jme.tokenise(expr);
		if(tokens===undefined){
			throw(new Error('Invalid expression: '+expr));
		}

		//compile to parse tree
		var tree = jme.shunt(tokens,functions);

		if(tree===null)
			return;

		if(!notypecheck)
		{
			if(!jme.typecheck(tree,functions))
				throw(new Error("Type error in expression "+expr));
		}

		return(tree);
	},

	typecheck: function(tree,functions)
	{
		if(tree.bound)
			return true;

		tree.tok.bound = true;

		if(tree.args!=undefined)
		{
			for(var i=0;i<tree.args.length;i++)
			{
				jme.typecheck(tree.args[i],functions);
				if(!tree.args[i].tok.bound)
					tree.tok.bound = false;
			}
		}

		var tok = tree.tok;
		switch(tok.type)
		{
		case 'number':
		case 'string':
		case 'boolean':
		case 'range':
		case 'list':
			tok.outtype = tok.type;
			return true;
		case 'name':
			tok.outtype = '?';
			tok.bound = false;
			return true;
		case 'op':
		case 'function':
			var op = tok.name.toLowerCase();

			if(functions[op]===undefined)
				throw(new Error("Operation "+op+" is not defined"));

			var result = undefined;

			for(var j=0;j<functions[op].length; j++)
			{
				var fn = functions[op][j];
				if(fn.typecheck(tree.args))
				{
					tok.fn = fn;
					tok.outtype = fn.outtype;
					return true;
				}
			}
			throw(new Error("No definition of "+op+" of correct type found"));
			return false; //?
		}
	},

	compare: function(expr1,expr2,settings,variables) {
		date = new Date();	//might as well get an even more up-to-date time than the one got when the script was loaded

		expr1 += '';
		expr2 += '';

		var compile = jme.compile, evaluate = jme.evaluate;

		var checkingFunction = checkingFunctions[settings.checkingType.toLowerCase()];	//work out which checking type is being used

		try {
			var tree1 = compile(expr1);
			var tree2 = compile(expr2);

			if(tree1 == null || tree2 == null) 
			{	//one or both expressions are invalid, can't compare
				return false; 
			}

			//find variable names used in both expressions - can't compare if different
			var vars1 = findvars(tree1);
			var vars2 = findvars(tree2);

			for(var v in variables)
			{
				delete vars1[v];
				delete vars2[v];
			}
			
			if( !varnamesAgree(vars1,vars2) ) 
			{	//whoops, differing variables
				return false;
			}

			if(vars1.length) 
			{	// if variables are used,  evaluate both expressions over a random selection of values and compare results
				var errors = 0;
				var rs = randoms(vars1, settings.vsetRangeStart, settings.vsetRangeEnd, settings.vsetRangePoints);
				for(var i = 0; i<rs.length; i++) {
					Numbas.util.copyinto(variables,rs[i]);
					var r1 = evaluate(tree1,rs[i]);
					var r2 = evaluate(tree2,rs[i]);
					if( !resultsEqual(r1,r2,checkingFunction,settings.checkingAccuracy) ) { errors++; }
				}
				if(errors < settings.failureRate) {
					return true;
				}else{
					return false;
				}
			} else {
				//if no variables used, can just evaluate both expressions once and compare
				r1 = evaluate(tree1,variables);
				r2 = evaluate(tree2,variables);
				return resultsEqual(r1,r2,checkingFunction,settings.checkingAccuracy);
			}
		}
		catch(e) {
			return false;
		}

	},

	contentsubvars: function(str, variables,functions)
	{
		var bits = Numbas.util.contentsplitbrackets(str);	//split up string by TeX delimiters. eg "let $X$ = \[expr\]" becomes ['let ','$','X','$',' = ','\[','expr','\]','']
		var out='';
		for(var i=0; i<bits.length; i++)
		{
			switch(i % 4)
			{
			case 0:	//plain text - variables inserted by expressions in curly braces
				out += jme.subvars(bits[i],variables,functions,true);
				break;
			case 2:	//a TeX expression - variables inserted with \var and \simplify commands
				out += jme.texsubvars(bits[i],variables,functions)
				break;
			case 1:	//a TeX delimiter
			case 3:
				out += bits[i];
				break;
			}
		}
		return out;
	},

	texsubvars: function(s,variables,functions)
	{
		var cmdre = /(.*?)\\((?:var)|(?:simplify))/;
		var out = ''
		while( m = s.match(cmdre) )
		{
			out += m[1];
			var cmd = m[2];
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
					throw(new Error("No matching ] in "+cmd+" args."));
				else
				{
					args = s.slice(si,i);
					i++;
				}
			}

			if(s.charAt(i)!='{')
			{
				throw(new Error("Missing parameter in "+cmd+': '+s));
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
				throw(new Error( "No matching } in "+cmd));

			var expr = s.slice(si,i)

			switch(cmd)
			{
			case 'var':	//substitute a variable
				var v = jme.evaluate(jme.compile(expr,functions),variables,functions);
				v = jme.display.texify({tok: v});
				out += ' '+v+' ';
				break;
			case 'simplify': //a JME expression to be simplified
				var simplificationSettings = jme.display.parseSimplificationSettings('');
				if(/[01]+/.test(args))
				{
					simplificationSettings = jme.display.parseSimplificationSettings(args);
				}
				else if(args.length==0)
				{
					if(!argbrackets)
					{
						var simplificationNames = jme.display.simplificationNames;
						for(var c=0;c<simplificationNames.length;c++)
						{
							simplificationSettings[simplificationNames[c]] = true;
						}
					}
				}
				else
				{
					args = args.split(',');
					for(var c=0;c<args.length;c++)
					{
						simplificationSettings[args[c]]=true;
					}
				}
				expr = jme.subvars(expr,variables,functions);
				var tex = jme.display.exprToLaTeX(expr,simplificationSettings);
				out += ' '+tex+' ';
				break;
			}
			s = s.slice(i+1);
		}

		return out+s;
	},

	//substitutes variables into a string "text {expr1} text {expr2} ..."
	subvars: function(str, variables,functions,display)
	{
		var bits = splitbrackets(str,'{','}');
		if(bits.length==1)
		{
			return str;
		}
		var out = '';
		for(var i=0; i<bits.length; i++)
		{
			if(i % 2)
			{
				var v = jme.evaluate(jme.compile(bits[i],functions),variables,functions);
				if(v.type=='number')
				{
					v = Numbas.math.niceNumber(v.value);
					if(display)
						v = ''+v+'';
					else
						v = '('+v+')';
				}
				else if(v.type=='list')
				{
					v = '['+v.value.map(function(x){return x.value;}).join(',')+']';
				}
				else
				{
					v = v.value;
				}
				if(display)
				{
					v = Numbas.util.textile(v);
				}
				out += v;
			}
			else
			{
				out+=bits[i];
			}
		}
		return out;
	},

	plot: function(eqn,settings)
	{
		var tree = compile(eqn,settings.functions);
		var varname = findvars(tree)[0];
		var points=[];
		for(var x = settings.min; x<=settings.max; x+=(settings.max-settings.min)/settings.steps)
		{
			var variables={};
			variables[varname]=new TNum(x);
			var y = evaluate(tree,variables).value;
			points.push([x,y]);
		}
		return points;
	},

	userFunction: function(name,outtype,definition,parameters)
	{
		var intype=[];
		for(var i=0;i<parameters.length;i++)
			intype.push(parameters[i][1]);

		var tree = jme.compile(definition);

		var evaluate = function(variables)
		{
			var newvars = Numbas.util.copyobj(variables);
			for(var i=0;i<this.paramtypes.length;i++)
			{
				var name = this.paramtypes[i][0];
				newvars[name] = jme.evaluate(variables[i],variables)
			}
		}

		var func = funcObj(name,intype,outtype,evaluate,true);
		func.typecheck = typecheck;
		func.paramtypes = parameters;
	}
};

var date = new Date();  //date needs to be global so the same time can be used for Seconds/mSeconds functions, and I don't want to pass it around all the eval functions

//dictionary mapping numbas symbols to LaTeX symbols
//symbols \\x not in this dictionary will be mapped to \x.

var varsymbols = ['alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','psi','chi','phi','omega','=','space'];
var samesymbols = '!+-,./0123456789:;?[]=';
var symbols = {
	'space': ' ',				'&': '\\&',							'contains': '\\ni',
	'*': '\\ast',				'<': '\\lt',						'>': '\\gt',
	'congruent': '\\cong',		'perpendicular': '\\perp',			'uptee': '\\perp',
	'overscore': '\\bar',		'|': '\\mid',						'~': '\\sim',
	'dash': '^{\\prime}',			'leftanglebracket': '\\langle',		'le': '\\leq',
	'infinity': '\\infty',		'doublearrow': '\\leftrightarrow',	'degree': '^{\\circ}',
	'plusorminus': '\\pm',		'doublequotes': '"',				'ge': '\\geq',
	'proportional': '\\propto',	'filledcircle': '\\bullet',			'divide': '\\div',
	'notequal': '\\neq',		'identical': '\\equiv',				'approximately': '\\approx',
	'vbar': '\\mid',			'hbar': '---',						'dots': '\\ldots',
	'imaginary': '\\mathbb{I}',	'real': '\\mathbb{R}',				'osol': '\\varnothing',
	'subsetequal': '\\supseteq','subset': '\\supset',				'notsubset': '\\not \\subset',
	'supersetequal': '\\subseteq','superset': '\\subset',			'notin': '\\not \\in',
	'product': '\\prod',		'sqrt': '\\sqrt',					'dot': '\\cdot',
	'¬': '\\neg',				'logicaland': '\\wedge',			'logicalor': '\\vee',
	'doubleimplies': '\\Leftrightarrow',							'impliesby': '\\Leftarrow',
	'impliesup': '\\Uparrow', 	'impliesdown': '\\Downarrow',		'implies': '\\Rightarrow',
	'rightanglebracket': '\\rangle',								'integral': '\\int',
	'(': '\\left ( \\right .',					')': '\\left ) \\right .'
};



//a length-sorted list of all the builtin functions, for recognising stuff like xcos() as x*cos()
var builtinsbylength=[],builtinsre=new RegExp();
builtinsbylength.add = function(e)
{
	if(!e.match(/^[a-zA-Z]+$/)){return;}
	var l = e.length;
	for(var i=0;i<this.length;i++)
	{
		if(this[i].length<=l)
		{
			this.splice(i,0,e);
			builtinsre = new RegExp('('+builtinsbylength.join('|')+')$');
			return;
		}
	}
	this.push(e);
	builtinsre = new RegExp('('+builtinsbylength.join('|')+')$');
};


//the data types supported by JME expressions
var types = jme.types = {}
var TNum = types.TNum = types.number = function(num)
{
	if(num===undefined) 
		return;

	this.value = num.complex ? num : parseFloat(num);
}
TNum.prototype.type = 'number';

var TString = types.TString = types.string = function(s)
{
	this.value = s;
}
TString.prototype.type = 'string';

var TBool = types.TBool = types.boolean = function(b)
{
	this.value = b;
}
TBool.prototype.type = 'boolean';

var TList = types.TList = types.list = function(n,value)
{
	this.vars = n;
	this.value = value;
}
TList.prototype.type = 'list';

var TRange = types.TRange = types.range = function(range)
{
	this.value = range;
	if(this.value!==undefined)
	{
		var start = this.value[0], end = this.value[1], step = this.value[2];

		if(step > 0)
		{
			var n = this.size = (end-start)/step+1;
			for(var i=0;i<n;i++)
			{
				this.value[i+3] = start+i*step;
			}
		}
	}
}
TRange.prototype.type = 'range';

var TName = types.TName = types.name = function(name)
{
	this.name = name;
	this.value = name;
}
TName.prototype.type = 'name';

var TFunc = types.TFunc = types['function'] = function(name)
{
	this.name = name;
}
TFunc.prototype.type = 'function';
TFunc.prototype.vars = 0;

var TOp = types.TOp = types.op = function(op)
{
	var arity = 2;
	if(jme.arity[op]!==undefined)
		arity = jme.arity[op];

	this.name = op;
	this.vars = arity;
}
TOp.prototype.type = 'op';

var TPunc = types.TPunc = function(kind)
{
	this.type = kind;
}


//special character
var TSpecial = jme.types.TSpecial = function(value)
{
	this.value = value;
}
TSpecial.prototype.type = 'special';

//concatenation - for dealing with special characters
var TConc = jme.types.TConc = function()
{
}
TConc.prototype.type = 'conc';

var arity = jme.arity = {
	'!': 1,
	'+u': 1,
	'-u': 1
}

var precedence = jme.precedence = {
	'_': 0,
	'!': 1,
	'not': 1,
	'^': 2,
	'*': 3,
	'/': 3,
	'+u': 3.5,
	'-u': 3.5,
	'+': 4,
	'-': 4,
	'..': 5,
	'#':6,
	'<': 7,
	'>': 7,
	'<=': 7,
	'>=': 7,
	'<>': 8,
	'=': 8,
	'|': 9,
	'&': 11,
	'&&': 11,
	'and': 11,
	'|': 12,
	'||': 12,
	'or': 12,
	'xor': 13,
	'isa': 0
};

var synonyms = {
	'not':'!',
	'&':'&&',
	'and':'&&',
	'divides': '|',
	'or':'||',
	'sqr':'sqrt',
	'gcf': 'gcd',
	'sgn':'sign',
	'len': 'abs',
	'length': 'abs'
};
	


function leftAssociative(op)
{
	// check for left-associativity because that is the case when you do something more
	// exponentiation is only right-associative operation at the moment
	return (op!='^');
};

var commutative = jme.commutative =
{
	'*': true,
	'+': true,
	'&&': true
};


//function object - for doing type checking away from the evaluator
//intype is a list of data type constructors (TNum, etc.) for function's parameters' types
//use the string '?' to match any type
//outtype is the type constructor corresponding to the value the function returns
//fn is the function to be evaluated
var funcObj = jme.funcObj = function(name,intype,outcons,fn,nobuiltin)
{
	for(var i=0;i<intype.length;i++)
	{
		if(intype[i]!='?')
			intype[i]=new intype[i]().type;
	}

	name = name.toLowerCase();

	this.name=name;
	this.intype = intype;
	if(typeof(outcons)=='function')
		this.outtype = new outcons().type;
	else
		this.outtype = '?';
	this.outcons = outcons;
	this.fn = fn;

	if(nobuiltin!=true)
	{
		if(builtins[name]===undefined)
		{
			builtins[name]=[this];
			builtinsbylength.add(name);
		}
		else
		{
			builtins[name].push(this);
		}
	}

	this.typecheck = function(variables)
	{
		variables = variables.slice();	//take a copy of the array

		for( var i=0; i<this.intype.length; i++ )
		{
			if(this.intype[i][0]=='*')	//arbitrarily many
			{
				var ntype = this.intype[i].slice(1);
				while(variables.length)
				{
					if(variables[0].tok.outtype==ntype || ntype=='?' || variables[0].tok.outtype=='?')
						variables = variables.slice(1);
					else
						return false;
				}
			}else{
				if(variables.length==0)
					return false;

				if(variables[0].tok.outtype==this.intype[i] || this.intype[i]=='?' || variables[0].tok.outtype=='?')
					variables = variables.slice(1);
				else
					return false;
			}
		}
		if(variables.length>0)	//too many args supplied
			return false;
		else
			return true;
	};

	this.evaluate = function(args,variables,functions)
	{
		var nargs = [];
		for(var i=0; i<args.length; i++)
			nargs.push(jme.evaluate(args[i],variables,functions).value);

		var result = this.fn.apply(null,nargs);

		return new this.outcons(result);
	}
		
}

var math = Numbas.math;

// the built-in operations and functions
var builtins = jme.builtins = {};

builtins['eval'] = [{name: 'eval',
					intype: ['?'],
					outtype: '?',
					typecheck: function(){return true;}
	}];

new funcObj('_', ['?','?'], function(){return new TNum(0);});

new funcObj('+u', [TNum], TNum, function(a){return a;});	//unary plus
new funcObj('-u', [TNum], TNum, math.negate);	//unary minus

new funcObj('+', [TNum,TNum], TNum, math.add );				//'number + number' is addition
var fconc = function(a,b) { return a+b; };					//'string + anything' is concatenation
new funcObj('+', [TString,'?'], TString, fconc );
new funcObj('+', ['?',TString], TString, fconc );

new funcObj('-', [TNum,TNum], TNum, math.sub );
new funcObj('*', [TNum,TNum], TNum, math.mul );
new funcObj('/', [TNum,TNum], TNum, math.div );
new funcObj('^', [TNum,TNum], TNum, math.pow );

new funcObj('..', [TNum,TNum], TRange, math.defineRange );	//define a range
new funcObj('#', [TRange,TNum], TRange, math.rangeSteps );	//define step size for range

new funcObj('<', [TNum,TNum], TBool, math.lt );
new funcObj('>', [TNum,TNum], TBool, math.gt );
new funcObj('<=', [TNum,TNum], TBool, math.leq );
new funcObj('>=', [TNum,TNum], TBool, math.geq );
new funcObj('<>', [TNum], TBool, math.neq );
new funcObj('<>', ['?','?'], TBool, function(a,b){ return a!=b; } );
new funcObj('=', [TNum,TNum], TBool, math.eq );
new funcObj('=', [TName,TName], TBool, function(a,b){ return a==b; });
new funcObj('=', ['?','?'], TBool, function(a,b){ return a==b; } );

new funcObj('&&', [TBool,TBool], TBool, function(a,b){return a&&b;} );
new funcObj('!', [TBool], TBool, function(a){return !a;} );	
new funcObj('||', [TBool,TBool], TBool, function(a,b){return a||b;} );
new funcObj('xor', [TBool,TBool], TBool, function(a,b){return (a || b) && !(a && b);} );

new funcObj('hour24', [], TNum, date.getHours );
new funcObj('hour', [], TNum, function(){return (date.getHours() % 12);} );
new funcObj('ampm', [], TBool, function(){return (date.getHours() >= 12);} );
new funcObj('minute', [], TNum, date.getMinutes );
new funcObj('second', [], TNum, date.getSeconds );
new funcObj('msecond', [], TNum, date.getMilliseconds );
new funcObj('dayofweek', [], TNum, date.getDay );

new funcObj('abs', [TNum], TNum, math.abs );
new funcObj('abs', [TList], TNum, function(l) { return l.length; });
new funcObj('abs', [TRange], TNum, function(r) { return (r[1]-r[0])/r[2]+1; });
new funcObj('arg', [TNum], TNum, math.arg );
new funcObj('re', [TNum], TNum, math.re );
new funcObj('im', [TNum], TNum, math.im );
new funcObj('conj', [TNum], TNum, math.conjugate );

new funcObj('isint',[TNum],TBool, function(a){ return Numbas.util.isInt(a); });

new funcObj('sqrt', [TNum], TNum, math.sqrt );
new funcObj('ln', [TNum], TNum, math.log );
new funcObj('log', [TNum], TNum, math.log10 );
new funcObj('exp', [TNum], TNum, math.exp );
new funcObj('fact', [TNum], TNum, math.factorial );
new funcObj('sin', [TNum], TNum, math.sin );
new funcObj('cos', [TNum], TNum, math.cos );
new funcObj('tan', [TNum], TNum, math.tan );
new funcObj('cosec', [TNum], TNum, math.cosec );
new funcObj('sec', [TNum], TNum, math.sec );
new funcObj('cot', [TNum], TNum, math.cot );
new funcObj('arcsin', [TNum], TNum, math.arcsin );
new funcObj('arccos', [TNum], TNum, math.arccos );
new funcObj('arctan', [TNum], TNum, math.arctan );
new funcObj('sinh', [TNum], TNum, math.sinh );
new funcObj('cosh', [TNum], TNum, math.cosh );
new funcObj('tanh', [TNum], TNum, math.tanh );
new funcObj('cosech', [TNum], TNum, math.cosech );
new funcObj('sech', [TNum], TNum, math.sech );
new funcObj('coth', [TNum], TNum, math.coth );
new funcObj('arcsinh', [TNum], TNum, math.arcsinh );
new funcObj('arccosh', [TNum], TNum, math.arccosh );
new funcObj('arctanh', [TNum], TNum, math.arctanh );
new funcObj('ceil', [TNum], TNum, math.ceil );
new funcObj('floor', [TNum], TNum, math.floor );
new funcObj('trunc', [TNum], TNum, math.trunc );
new funcObj('fract', [TNum], TNum, math.fract );
new funcObj('degrees', [TNum], TNum, math.degrees );
new funcObj('radians', [TNum], TNum, math.radians );
new funcObj('round', [TNum], TNum, math.round );
new funcObj('sign', [TNum], TNum, math.sign );
new funcObj('random', [TRange], TNum, math.random );
arbrandom = new funcObj( 'random',[],'?');			//pick at random from a list of any data type
arbrandom.typecheck = function() { return true; }
arbrandom.evaluate = function(args,variables,functions) { return jme.evaluate(math.choose(args),variables,functions);};
new funcObj('mod', [TNum,TNum], TNum, function(a,b){return a%b;} );
new funcObj('max', [TNum,TNum], TNum, math.max );
new funcObj('min', [TNum,TNum], TNum, math.min );
new funcObj('precround', [TNum,TNum], TNum, math.precround );
new funcObj('siground', [TNum,TNum], TNum, math.siground );
new funcObj('perm', [TNum,TNum], TNum, math.permutations );
new funcObj('comb', [TNum,TNum], TNum, math.combinations );
new funcObj('root', [TNum,TNum], TNum, math.root );
new funcObj('award', [TNum,TBool], TNum, function(a,b){return (b?a:0);} );
new funcObj('gcd', [TNum,TNum], TNum, math.gcf );
new funcObj('lcm', [TNum,TNum], TNum, math.lcm );
new funcObj('|', [TNum,TNum], TBool, math.divides );

new funcObj('diff', ['?','?',TNum], '?');
new funcObj('pdiff', ['?','?',TNum], '?');
new funcObj('int', ['?','?'], '?');
new funcObj('defint', ['?','?',TNum,TNum], '?');

var funcs = {};

//if needs to be a bit different because it can return any type
funcs.iff = new funcObj('if', [TBool,'?','?'], '?');
funcs.iff.evaluate = function(args,variables,functions)
{
	var test = jme.evaluate(args[0],variables,functions).value;

	if(test)
		return jme.evaluate(args[1],variables,functions);
	else
		return jme.evaluate(args[2],variables,functions);
};

//switch pretty much breaks my nice system
funcs.switchf = new funcObj('switch',[],'?');
funcs.switchf.typecheck = function(variables)
{
	//should take alternating booleans and [any value]
	//final odd-numbered argument is the 'otherwise' option
	if(variables.length <2)
		return false;

	var check=0;
	if(variables.length % 2 == 0)
		check = variables.length;
	else
		check = variables.length-1;

	for( var i=0; i<check; i+=2 )
	{
		switch(variables[i].tok.outtype)
		{
		case '?':
		case 'boolean':
			break;
		default:
			return false;
		}
	}
	return true;
}
funcs.switchf.evaluate = function(args,variables,functions)
{
	for(var i=0; i<args.length-1; i+=2 )
	{
		var result = jme.evaluate(args[i],variables,functions).value;
		if(result)
			return jme.evaluate(args[i+1],variables,functions);
	}
	if(args.length % 2 == 1)
		return jme.evaluate(args[args.length-1],variables,functions);
	else
		throw(new Error("No default case for Switch statement"));
}

funcs.isa = new funcObj('isa',['?',TString],TBool)
funcs.isa.evaluate = function(args,variables,functions)
{
	var kind = jme.evaluate(args[1],variables,functions).value;
	if(args[0].tok.type=='name' && variables[args[0].tok.name.toLowerCase()]==undefined )
		return new TBool(kind=='name');

	var match = false;
	if(kind=='complex')
	{
		if(args[0].tok.type=='number' && v.value.complex)
			match = true
	}
	else
	{
		var match = args[0].tok.type == kind;
	}
	return new TBool(match);
};

funcs.repeat = new funcObj('repeat',['?',TNum],TList)
funcs.repeat.evaluate = function(args,variables,functions)
{
	var size = jme.evaluate(args[1],variables,functions).value;
	var l = new TList(size,[]);
	for(var i=0;i<size;i++)
	{
		l.value[i] = jme.evaluate(args[0],variables,functions);
	}
	return l;
}

funcs.listval = new funcObj('listval',[TList,TNum],'?')
funcs.listval.evaluate = function(args,variables,functions)
{
	var index = jme.evaluate(args[1],variables,functions).value;
	var list = jme.evaluate(args[0],variables,functions);
	if(index in list.value)
		return list.value[index];
	else
		throw(new Error("Invalid list index "+index+" on list of size "+list.value.length));
}

funcs.maplist = new funcObj('map',['?',TName,TList],TList)
funcs.maplist.evaluate = function(args,variables,functions)
{
	var list = jme.evaluate(args[2],variables,functions);
	var newlist = new TList(list.size,[]);
	var name = args[1].tok.name;
	variables = Numbas.util.copyobj(variables);
	for(var i=0;i<list.value.length;i++)
	{
		variables[name] = list.value[i];
		newlist.value[i] = jme.evaluate(args[0],variables,functions);
	}
	return newlist;
}

funcs.maprange = new funcObj('map',['?',TName,TRange],TList)
funcs.maprange.evaluate = function(args,variables,functions)
{
	var range = jme.evaluate(args[2],variables,functions);
	var name = args[1].tok.name;
	var newlist = new TList(range.size);
	var variables = Numbas.util.copyobj(variables);
	for(var i=3;i<range.value.length;i++)
	{
		variables[name] = new TNum(range.value[i]);
		newlist.value[i-3] = jme.evaluate(args[0],variables,functions);
	}
	return newlist;
}

function randoms(varnames,min,max,times)
{
	times *= varnames.length;
	var rs = [];
	for( var i=0; i<times; i++ )
	{
		var r = {};
		for( var j=0; j<varnames.length; j++ )
		{
			r[varnames[j]] = new TNum(Numbas.math.randomrange(min,max));
		}
		rs.push(r);
	}
	return rs;
}


function varnamesAgree(array1, array2) {
	var name;
	for(var i=0; i<array1.length; i++) {
		if( (name=array1[i][0])!='$' && !array2.contains(name) )
			return false;
	}
	
	return true;
};

var checkingFunctions = 
{
	absdiff: function(r1,r2,tolerance) 
	{
		// finds absolute difference between values, fails if bigger than tolerance
		return math.leq(Math.abs(math.sub(r1,r2)), tolerance);
	},

	reldiff: function(r1,r2,tolerance) {
		// fails if (r1/r2 - 1) is bigger than tolerance
		if(r2!=0) {
			return math.leq(Math.abs(math.sub(r1,r2)), Math.abs(math.mul(tolerance,r2)));
		} else {	//or if correct answer is 0, checks abs difference
			return math.leq(Math.abs(math.sub(r1,r2)), tolerance);
		}
	},

	dp: function(r1,r2,tolerance) {
		//rounds both values to 'tolerance' decimal places, and fails if unequal 
		tolerance = Math.floor(tolerance);
		return math.eq( math.precround(r1,tolerance), math.precround(r2,tolerance) );
	},

	sigfig: function(r1,r2,tolerance) {
		//rounds both values to 'tolerance' sig figs, and fails if unequal
		tolerance = Math.floor(tolerance);
		return math.eq(math.siground(r1,tolerance), math.siground(r2,tolerance));
	}
};

var findvars = jme.findvars = function(tree)
{
	if(tree.args===undefined)
	{
		if(tree.tok.type=='name')
			return [tree.tok.name.toLowerCase()];
		else
			return [];
	}
	else
	{
		var vars = [];
		for(var i=0;i<tree.args.length;i++)
			vars = vars.merge(findvars(tree.args[i]));
		return vars;
	}
}


function resultsEqual(r1,r2,checkingFunction,checkingAccuracy)
{	// first checks both expressions are of same type, then uses given checking type to compare results

	if(r1.type != r2.type)
	{
		return false;
	}
	if(r1.type == 'number')
	{
		if(r1.value.complex || r2.value.complex)
		{
			if(!r1.value.complex)
				r1.value = {re:r1.value, im:0, complex:true};
			if(!r2.value.complex)
				r2.value = {re:r2.value, im:0, complex:true};
			return checkingFunction(r1.value.re, r2.value.re, checkingAccuracy) && checkingFunction(r1.value.im,r2.value.im,checkingAccuracy);
		}
		else
		{
			return checkingFunction( r1.value, r2.value, checkingAccuracy );
		}
	}
	else
	{
		return r1.value == r2.value;
	}
};

/*                    MATHS FUNCTIONS                */






//split a string up between curly braces
//so a{b}c -> ['a','b','c']
var splitbrackets = jme.splitbrackets = function(t,lb,rb)
{
	var o=[];
	var l=t.length;
	var s=0;
	var depth=0;
	for(var i=0;i<l;i++)
	{
		if(t.charAt(i)==lb && !(i>0 && t.charAt(i-1)=='\\'))
		{
			depth+=1;
			if(depth==1)
			{
				o.push(t.slice(s,i));
				s=i+1;
			}
		}
		else if(t.charAt(i)==rb && !(i>0 && t.charAt(i-1)=='\\'))
		{
			depth-=1;
			if(depth==0)
			{
				o.push(t.slice(s,i));
				s=i+1;
			}
		}
	}
	if(s<l)
		o.push(t.slice(s));
	return o;
}

	
var math = Numbas.math;

var jme = Numbas.jme;

jme.display = {

	exprToLaTeX: function(expr,settings)
	{
		expr+='';
		if(!expr.trim().length)
			return '';
		var tree = jme.display.simplify(expr,settings);
		var tex = texify(tree,settings);
		return tex;
	},

	parseSimplificationSettings: function(settingsString)
	{
		var settings = {};

		for(var i=0; i<settingsString.length && i<simplificationNames.length; i++)
		{
			settings[ simplificationNames[i] ] = settingsString.substr(i,1)=='1';
		}

		return settings;
	},

	simplifyExpression: function(expr,settings)
	{
		return treeToJME(jme.display.simplify(expr,settings));
	},

	simplify: function(expr,settings)
	{
		try 
		{
			var exprTree = jme.compile(expr,{},true);
			var rules = Numbas.util.copyarray(simplificationRules.basic);
			for(var x in settings)
			{
				if(settings[x]==true && simplificationRules[x]!==undefined)
				{
					rules = rules.concat(simplificationRules[x]);
				}
			}
			return jme.display.simplifyTree(exprTree,rules);
		}
		catch(e) 
		{
			e.message += '\nExpression was: '+expr;
			throw(e);
		}
	},

	simplifyTree: function(exprTree,rules)
	{
		var applied = true;
		while( applied )
		{
			if(exprTree.tok.type=='function' && exprTree.tok.name=='eval')
			{
				exprTree = {tok: Numbas.jme.evaluate(exprTree.args[0])};
			}
			else
			{
				if(exprTree.args)
				{
					for(var i=0;i<exprTree.args.length;i++)
					{
						exprTree.args[i] = jme.display.simplifyTree(exprTree.args[i],rules);
					}
				}
				applied = false;
				for( var i=0; i<rules.length;i++)
				{
					var match;
					if(match = rules[i].match(exprTree))
					{
						//Numbas.debug("match rule "+rules[i].patternString,true);
						//Numbas.debug(treeToJME(exprTree),true);
						exprTree = jme.substituteTree(rules[i].result,match);
						//Numbas.debug(treeToJME(exprTree),true);
						applied = true;
						break;
					}
				}
			}
		}
		return exprTree
	}
};


var simplificationNames = jme.display.simplificationNames = [	
							'unitFactor','unitPower','unitDenominator','zeroFactor','zeroTerm','zeroPower',
							'collectNumbers','simplifyFractions','zeroBase','constantsFirst','sqrtProduct',
							'sqrtDivision','sqrtSquare','trig','otherNumbers', 'fractionNumbers' ];

//gets the LaTeX version of an op argument - applies brackets if appropraite
function texifyOpArg(thing,texArgs,i)
{
	var precedence = jme.precedence;
	tex = texArgs[i];
	if(thing.args[i].tok.type=='op')	//if this is an op applied to an op, might need to bracket
	{
		var op1 = thing.args[i].tok.name;	//child op
		var op2 = thing.tok.name;			//parent op
		var p1 = precedence[op1];	//precedence of child op
		var p2 = precedence[op2];	//precedence of parent op
		if( p1 > p2 || (p1==p2 && i>0 && !jme.commutative[op2]) || (op1=='-u' && precedence[op2]<=precedence['*']) )	
		//if leaving out brackets would cause child op to be evaluated after parent op, or precedences the same and parent op not commutative, or child op is negation and parent is exponentiation
			tex = '\\left ( '+tex+' \\right )';
	}
	else if(thing.args[i].tok.type=='number' && thing.args[i].tok.value.complex && thing.tok.type=='op' && (thing.tok.name=='*' || thing.tok.name=='-u') )	
	//complex numbers might need brackets round them when multiplied with something else or unary minusing
	{
		var v = thing.args[i].tok.value;
		if(!(v.re==0 || v.im==0))
			tex = '\\left ( '+tex+' \\right )';
	}
	return tex;
}

// helper function for texing infix operators
function infixTex(code)
{
	return function(thing,texArgs)
	{
		var arity = jme.builtins[thing.tok.name][0].intype.length;
		if( arity == 1 )
		{
			return code+texArgs[0];
		}
		else if ( arity == 2 )
		{
			return texArgs[0]+' '+code+' '+texArgs[1];
		}
	}
}

//helper for texing nullary functions
function nullaryTex(code)
{
	return function(thing,texArgs){ return '\\textrm{'+code+'}'; };
}

//helper function for texing functions
function funcTex(code)
{
	return function(thing,texArgs)
	{
		return code+' \\left ( '+texArgs.join(', ')+' \\right )';
	}
}

var texOps = {
	'#': (function(thing,texArgs) { return texArgs[0]+' \\, \\# \\, '+texArgs[1]; }),
	'_': (function(thing,texArgs) { return texArgs[0]+'_{'+texArgs[1]+'}'; }),
	'!': infixTex('\\neg '),
	'+u': infixTex('+'),
	'-u': (function(thing,texArgs) { 
		var tex = texArgs[0];
		if( thing.args[0].tok.type=='op' )
		{
			var op = thing.args[0].tok.name;
			//if(!( thing.args[0].tok.name=='*' || thing.args[0].tok.name=='/' ))
			if(jme.precedence[op]>jme.precedence['-u'])
			{
				tex='\\left ( '+tex+' \\right )';
			}
		}
		return '-'+tex;
	}),
	'^': (function(thing,texArgs) { 
		var tex0 = texArgs[0];
		if(thing.args[0].tok.type=='op')
			tex0 = '\\left ( ' +tex0+' \\right )';
		return (tex0+'^{ '+texArgs[1]+' }');
	}),
	'*': (function(thing,texArgs) {
		var s = texifyOpArg(thing,texArgs,0);
		for(var i=1; i<thing.args.length; i++ )
		{
			if(thing.args[i-1].tok.type=='special' || thing.args[i].tok.type=='special' || (thing.args[i-1].tok.type=='op' && thing.args[i-1].tok.name=='_') || (thing.args[i].tok.type=='op' && thing.args[i].tok.name=='_'))	//specials or subscripts
			{
				s+=' ';
			}
			else if (thing.args[i].tok.type=='op' && thing.args[i].tok.name=='^' && (thing.args[i].args[0].value==Math.E || thing.args[i].args[0].tok.type!='number'))	//anything times e^(something) or (not number)^(something)
			{
				s+=' ';
			}
			else if (thing.args[i].tok.type=='number' && (thing.args[i].tok.value==Math.PI || thing.args[i].tok.value==Math.E || thing.args[i].tok.value.complex) && thing.args[i-1].tok.type=='number')	//number times Pi or E
			{
				s+=' ';
			}
			else if (thing.args[i].tok.type=='op' && thing.args[i].tok.name=='^' && thing.args[i].args[0].tok.type=='number' && math.eq(thing.args[i].args[0].tok.value,math.complex(0,1)) && thing.args[i-1].tok.type=='number')	//number times a power of i
			{
				s+=' ';
			}
			else if ( thing.args[i].tok.type=='number'
					|| (!(thing.args[i-1].tok.type=='op' && thing.args[i-1].tok.name=='-u') &&
						(thing.args[i].tok.type=='op' && jme.precedence[thing.args[i].tok.name]<=jme.precedence['*'] && thing.args[i].tok.name!='-u' && (thing.args[i].args[0].tok.type=='number' && thing.args[i].args[0].tok.value!=Math.E))
						)
			)
			{
				s += ' \\times ';
			}
			else
				s+= ' ';
			s += texifyOpArg(thing,texArgs,i);
		}
		return s;
	}),
	'/': (function(thing,texArgs) { return ('\\frac{ '+texArgs[0]+' }{ '+texArgs[1]+' }'); }),
	'+': infixTex('+'),
	'-': infixTex('-'),
	'..': infixTex('\\dots'),
	'<': infixTex('\\lt'),
	'>': infixTex('\\gt'),
	'<=': infixTex('\\leq'),
	'>=': infixTex('\\geq'),
	'<>': infixTex('\neq'),
	'=': infixTex('='),
	'&&': infixTex('\\wedge'),
	'||': infixTex('\\vee'),
	'xor': infixTex('\\, \\textrm{XOR} \\,'),
	'|': infixTex('|'),
	'abs': (function(thing,texArgs) { return ('\\left | '+texArgs[0]+' \\right |') }),
	'sqrt': (function(thing,texArgs) { return ('\\sqrt{ '+texArgs[0]+' }'); }),
	'exp': (function(thing,texArgs) { return ('e^{ '+texArgs[0]+' }'); }),
	'fact': (function(thing,texArgs)
			{
				if(thing.args[0].tok.type=='number' || thing.args[0].tok.type=='name')
				{
					return texArgs[0]+'!';
				}
				else
				{
					return '\\left ('+texArgs[0]+' \\right)!';
				}
			}),
	'ceil': (function(thing,texArgs) { return '\\left \\lceil '+texArgs[0]+' \\right \\rceil';}),
	'floor': (function(thing,texArgs) { return '\\left \\lfloor '+texArgs[0]+' \\right \\rfloor';}),
	'int': (function(thing,texArgs) { return ('\\int \\! '+texArgs[0]+' \\, d'+texArgs[1]); }),
	'defint': (function(thing,texArgs) { return ('\\int_{'+texArgs[2]+'}^{'+texArgs[3]+'} \\! '+texArgs[0]+' \\, d'+texArgs[1]); }),
	'diff': (function(thing,texArgs) 
			{
				var degree = (thing.args[2].tok.type=='number' && thing.args[2].tok.value==1) ? '' : '^{'+texArgs[2]+'}';
				if(thing.args[0].tok.type=='name')
				{
					return ('\\frac{d'+degree+texArgs[0]+'}{d'+texArgs[1]+degree+'}');
				}
				else
				{
					return ('\\frac{d'+degree+'}{d'+texArgs[1]+degree+'} \\left ('+texArgs[0]+' \\right )');
				}
			}),
	'partialdiff': (function(thing,texArgs) 
			{ 
				var degree = (thing.args[2].tok.type=='number' && thing.args[2].tok.value==1) ? '' : '^{'+texArgs[2]+'}';
				if(thing.args[0].tok.type=='name')
				{
					return ('\\frac{\\partial '+degree+texArgs[0]+'}{\\partial '+texArgs[1]+degree+'}');
				}
				else
				{
					return ('\\frac{\\partial '+degree+'}{\\partial '+texArgs[1]+degree+'} \\left ('+texArgs[0]+' \\right )');
				}
			}),
	'limit': (function(thing,texArgs) { return ('\\lim_{'+texArgs[1]+' \\to '+texArgs[2]+'}{'+texArgs[0]+'}'); }),
	'mod': (function(thing,texArgs) {return texArgs[0]+' \\pmod{'+texArgs[1]+'}';}),
	'perm': (function(thing,texArgs) { return '^{'+texArgs[0]+'}\\kern-2pt P_{'+texArgs[1]+'}';}),
	'comb': (function(thing,texArgs) { return '^{'+texArgs[0]+'}\\kern-1pt C_{'+texArgs[1]+'}';}),
	'root': (function(thing,texArgs) { return '\\sqrt['+texArgs[0]+']{'+texArgs[1]+'}'; }),
	'if': (function(thing,texArgs) 
			{
				for(var i=0;i<3;i++)
				{
					if(thing.args[i].args!==undefined)
						texArgs[i] = '\\left ( '+texArgs[i]+' \\right )';
				}
				return '\\textbf{If} \\; '+texArgs[0]+' \\; \\textbf{then} \\; '+texArgs[1]+' \\; \\textbf{else} \\; '+texArgs[2]; 
			}),
	'switch': funcTex('\\operatorname{switch}'),
	'gcd': funcTex('\\operatorname{gcd}'),
	'lcm': funcTex('\\operatorname{lcm}'),
	'trunc': funcTex('\\operatorname{trunc}'),
	'fract': funcTex('\\operatorname{fract}'),
	'degrees': funcTex('\\operatorname{degrees}'),
	'radians': funcTex('\\operatorname{radians}'),
	'round': funcTex('\\operatorname{round}'),
	'sign': funcTex('\\operatorname{sign}'),
	'random': funcTex('\\operatorname{random}'),
	'max': funcTex('\\operatorname{max}'),
	'min': funcTex('\\operatorname{min}'),
	'precround': funcTex('\\operatorname{precround}'),
	'siground': funcTex('\\operatorname{siground}'),
	'award': funcTex('\\operatorname{award}'),
	'hour24': nullaryTex('hour24'),
	'hour': nullaryTex('hour'),
	'ampm': nullaryTex('ampm'),
	'minute': nullaryTex('minute'),
	'second': nullaryTex('second'),
	'msecond': nullaryTex('msecond'),
	'dayofweek': nullaryTex('dayofweek'),
	'sin': funcTex('\\sin'),
	'cos': funcTex('\\cos'),
	'tan': funcTex('\\tan'),
	'sec': funcTex('\\sec'),
	'cot': funcTex('\\cot'),
	'cosec': funcTex('\\csc'),
	'arccos': funcTex('\\arccos'),
	'arcsin': funcTex('\\arcsin'),
	'arctan': funcTex('\\arctan'),
	'cosh': funcTex('\\cosh'),
	'sinh': funcTex('\\sinh'),
	'tanh': funcTex('\\tanh'),
	'coth': funcTex('\\coth'),
	'cosech': funcTex('\\operatorname{cosech}'),
	'sech': funcTex('\\operatorname{sech}'),
	'arcsinh': funcTex('\\operatorname{arcsinh}'),
	'arccosh': funcTex('\\operatorname{arccosh}'),
	'arctanh': funcTex('\\operatorname{arctanh}'),
	'ln': funcTex('\\ln'),
	'log': funcTex('\\log_{10}')
}

function texRationalNumber(n)
{
	if(n.complex)
	{
		var re = texRationalNumber(n.re);
		var im = texRationalNumber(n.im)+' i';
		if(n.im==0)
			return re;
		else if(n.re==0)
		{
			if(n.im==1)
				return 'i';
			else if(n.im==-1)
				return '-i';
			else
				return im;
		}
		else if(n.im<0)
		{
			if(n.im==-1)
				return re+' - i';
			else
				return re+' '+im;
		}
		else
		{
			if(n.im==1)
				return re+' + '+'i';
			else
				return re+' + '+im;
		}

	}
	else
	{
		var piD;
		if((piD = math.piDegree(n)) > 0)
			n /= Math.pow(Math.PI,piD);

		var f = math.rationalApproximation(Math.abs(n));
		if(f[1]==1)
			out = Math.abs(f[0]).toString();
		else
			var out = '\\frac{'+f[0]+'}{'+f[1]+'}';
		if(n<0)
			out=' - '+out;

		switch(piD)
		{
		case 0:
			return out;
		case 1:
			return out+' \\pi';
		default:
			return out+' \\pi^{'+piD+'}';
		}
	}
}

function texRealNumber(n)
{
	if(n.complex)
	{
		var re = texRealNumber(n.re);
		var im = texRealNumber(n.im)+' i';
		if(n.im==0)
			return re;
		else if(n.re==0)
		{
			if(n.im==1)
				return 'i';
			else if(n.im==-1)
				return '-i';
			else
				return im;
		}
		else if(n.im<0)
		{
			if(n.im==-1)
				return re+' - i';
			else
				return re+' '+im;
		}
		else
		{
			if(n.im==1)
				return re+' + '+'i';
			else
				return re+' + '+im;
		}

	}
	else
	{
		var piD;
		if((piD = math.piDegree(n)) > 0)
			n /= Math.pow(Math.PI,piD);

		out = math.niceNumber(n);
		switch(piD)
		{
		case 0:
			return out;
		case 1:
			if(n==1)
				return '\\pi';
			else
				return out+' \\pi';
		default:
			if(n==1)
				return '\\pi^{'+piD+'}';
			else
				return out+' \\pi^{'+piD+'}';
		}
	}
}

var greek = ['alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega']

var texify = Numbas.jme.display.texify = function(thing,settings)
{
	if(!thing)
		return '';

	if(!settings)
		settings = {};

	if(thing.args)
	{
		var texArgs = [];
		for(var i=0; i<thing.args.length; i++ )
		{
			texArgs[i] = texify(thing.args[i],settings);
		}
	}

	var tok = thing.tok || thing;
	switch(tok.type)
	{
	case 'number':
		if(tok.value==Math.E)
			return 'e';
		else if(tok.value==Math.PI)
			return '\\pi';
		else
			if(settings.fractionNumbers)
			{
				return texRationalNumber(tok.value);
			}
			else
			{
				return texRealNumber(tok.value);
			}
	case 'string':
		return '"\\textrm{'+tok.value+'}"';
		break;
	case 'boolean':
		return tok.value ? 'true' : 'false';
		break;
	case 'range':
		return tok.value[0]+ ' \dots '+tok.value[1];
		break;
	case 'list':
		if(!texArgs)
		{
			texArgs = [];
			for(var i=0;i<tok.vars;i++)
			{
				texArgs[i] = texify(tok.value[i],settings);
			}
		}
		return '\\{ '+texArgs.join(', ')+' \\}';
	case 'name':
		if(greek.contains(tok.name))
			return '\\'+tok.name;
		else
			return tok.name;
		break;
	case 'special':
		return tok.value;
		break;
	case 'conc':
		return texArgs.join(' ');
		break;
	case 'op':
		return texOps[tok.name.toLowerCase()](thing,texArgs);
		break;
	case 'function':
		if(texOps[tok.name.toLowerCase()])
		{
			return texOps[tok.name.toLowerCase()](thing,texArgs);
		}
		else
		{
			if(tok.name.replace(/[^A-Za-z]/g,'').length==1)
				var texname=tok.name;
			else
				var texname='\\operatorname{'+tok.name+'}';

			return texname+' \\left ( '+texArgs.join(', ')+' \\right )';
		}
		break;
	}
}


//turns an evaluation tree back into a JME expression
//(used when an expression is simplified)
function treeToJME(tree)
{
	var args=tree.args, l;

	if(args!==undefined && ((l=args.length)>0))
	{
		var bits = args.map(treeToJME);
	}

	var tok = tree.tok;
	switch(tok.type)
	{
	case 'number':
		switch(tok.value)
		{
		case Math.E:
			return 'e';
		case Math.PI:
			return 'pi';
		default:
			return Numbas.math.niceNumber(tok.value);
		}
	case 'name':
		return tok.name;
	case 'string':
		return '"'+tok.value+'"';
	case 'boolean':
		return (tok.value ? 'true' : false);
	case 'range':
		return tok.value[0]+'..'+tok.value[1]+(tok.value[2]==1 ? '' : '#'+tok.value[2]);
	case 'list':
		return '[ '+bits.join(', ')+' ]';
	case 'special':
		return tok.value;
	case 'conc':
		return '';
	case 'function':
		return tok.name+'('+bits.join(',')+')';
	case 'op':
		var op = tok.name;

		for(var i=0;i<l;i++)
		{
			if(args[i].tok.type=='op' && opBrackets[op][args[i].tok.name]==true)
				{bits[i]='('+bits[i]+')';}
			else if(args[i].tok.type=='number' && args[i].tok.value.complex && (op=='*' || op=='-u'))
			{
				if(!(args[i].tok.value.re==0 || args[i].tok.value.im==0))
				{bits[i] = '('+bits[i]+')';}
			}
		}

		switch(op)
		{
		case '+u':
			op='+';
			break;
		case '-u':
			op='-';
			break;
		}

		if(l==1)
			{return op+bits[0];}
		else
			{return bits[0]+op+bits[1];}
	}
}

//does each argument (of an operation) need brackets around it?
var opBrackets = {
	'+u':{},
	'-u':{'+':true,'-':true},
	'+': {},
	'-': {},
	'*': {'+u':true,'-u':true,'+':true, '-':true},
	'/': {'+u':true,'-u':true,'+':true, '-':true, '*':true},
	'^': {'+u':true,'-u':true,'+':true, '-':true, '*':true, '/':true},
	'and': {'or':true, 'xor':true},
	'or': {'xor':true},
	'xor':{}
};

var Rule = jme.display.Rule = function(pattern,conditions,result)
{
	this.patternString = pattern;
	this.tree = jme.compile(pattern,{});

	this.result = jme.compile(result,{});

	this.conditions = [];
	for(var i=0;i<conditions.length;i++)
	{
		this.conditions.push(jme.compile(conditions[i],{}));
	}
}

Rule.prototype = {
	match: function(exprTree)
	{
		//see if expression matches rule
		var match = matchTree(this.tree,exprTree);
		if(match==false)
			return false;

		//if expression matches rule, then match is a dictionary of matched variables
		//check matched variables against conditions
		if(this.matchConditions(match))
			return match;
		else
			return false;
	},

	matchConditions: function(match)
	{
		for(var i=0;i<this.conditions.length;i++)
		{
			var c = this.conditions[i];
			c = jme.substituteTree(c,match);
			try
			{
				var result = jme.evaluate(c,{});
				if(result.value==false)
					return false;
			}
			catch(e)
			{
				return false;
			}
		}
		return true;
	}
}


function matchTree(ruleTree,exprTree)
{
	if(!exprTree)
		return false;

	//Numbas.debug("matching "+treeToJME(ruleTree)+" with "+treeToJME(exprTree));

	var ruleTok = ruleTree.tok;
	var exprTok = exprTree.tok;

	var d = {};

	if(ruleTok.type=='name')
	{
		d[ruleTok.name] = exprTree;
		return d;
	}

	if(ruleTok.type != exprTok.type)
	{
		return false;
	}

	switch(ruleTok.type)
	{
	case 'number':
		if( !math.eq(ruleTok.value,exprTok.value) )
			return false;
		return d;

	case 'string':
	case 'boolean':
	case 'special':
	case 'range':
		if(ruleTok.value != exprTok.value)
			return false;
		return d;

	case 'function':
	case 'op':
		if(ruleTok.name != exprTok.name)
			return false;
		
		for(var i=0;i<ruleTree.args.length;i++)
		{
			var m = matchTree(ruleTree.args[i],exprTree.args[i]);
			if(m==false)
				return false;
			else
			{
				for(var x in m)	//get matched variables
				{
					d[x]=m[x];
				}
			}
		}
		return d
	default:
		return d;
	}
}


var simplificationRules = jme.display.simplificationRules = {
	basic: [
		['+x',[],'x'],					//get rid of unary plus
		['x+(-y)',[],'x-y'],			//plus minus = minus
		['x-(-y)',[],'x+y'],			//minus minus = plus
		['-(-x)',[],'x'],				//unary minus minus = plus
		['-x',['x isa "complex"','re(x)<0'],'eval(-x)'],
		['(-x)/y',[],'-x/y'],			//take negation to left of fraction
		['x/(-y)',[],'-x/y'],			
		['(-x)*y',[],'-(x*y)'],			//take negation to left of multiplication
		['x*(-y)',[],'-(x*y)'],		
		['x+(y+z)',[],'(x+y)+z'],		//make sure sums calculated left-to-right
		['x-(y+z)',[],'(x-y)-z'],
		['x+(y-z)',[],'(x+y)-z'],
		['x-(y-z)',[],'(x-y)+z'],
		['x*(y*z)',[],'(x*y)*z'],		//make sure multiplications go left-to-right
		['n*i',['n isa "number"'],'eval(n*i)'],			//always collect multiplication by i
		['i*n',['n isa "number"'],'eval(n*i)']
	],

	unitFactor: [
		['1*x',[],'x'],
		['x*1',[],'x']
	],

	unitPower: [
		['x^1',[],'x']
	],

	unitDenominator: [
		['x/1',[],'x']
	],

	zeroFactor: [
		['x*0',[],'0'],
		['0*x',[],'0'],
		['0/x',[],'0']
	],

	zeroTerm: [
		['0+x',[],'x'],
		['x+0',[],'x'],
		['x-0',[],'x'],
		['0-x',[],'-x']
	],

	zeroPower: [
		['x^0',[],'1']
	],

	collectNumbers: [
		['-x+y',[],'y-x'],											//don't start with a unary minus
		['-x-y',[],'-(x+y)'],										//collect minuses
		['n+m',['n isa "number"','m isa "number"'],'eval(n+m)'],	//add numbers
		['n-m',['n isa "number"','m isa "number"'],'eval(n-m)'],	//subtract numbers
		['n+x',['n isa "number"','!(x isa "number")'],'x+n'],		//add numbers last

		['(x+n)+m',['n isa "number"','m isa "number"'],'x+eval(n+m)'],	//collect number sums
		['(x-n)+m',['n isa "number"','m isa "number"'],'x+eval(m-n)'],	
		['(x+n)-m',['n isa "number"','m isa "number"'],'x+eval(n-m)'],	
		['(x-n)-m',['n isa "number"','m isa "number"'],'x-eval(n+m)'],	
		['(x+n)+y',['n isa "number"'],'(x+y)+n'],						//shift numbers to right hand side
		['(x+n)-y',['n isa "number"'],'(x-y)+n'],
		['(x-n)+y',['n isa "number"'],'(x+y)-n'],
		['(x-n)-y',['n isa "number"'],'(x-y)-n'],

		['n*m',['n isa "number"','m isa "number"'],'eval(n*m)'],		//multiply numbers
		['x*n',['n isa "number"'],'n*x']								//shift numbers to left hand side
	],

	simplifyFractions: [
		['n/m',['n isa "number"','m isa "number"','gcd(n,m)>1'],'eval(n/gcd(n,m))/eval(m/gcd(n,m))'],			//cancel simple fraction
		['(n*x)/m',['n isa "number"','m isa "number"','gcd(n,m)>1'],'(eval(n/gcd(n,m))*x)/eval(m/gcd(n,m))'],	//cancel algebraic fraction
		['n/(m*x)',['n isa "number"','m isa "number"','gcd(n,m)>1'],'eval(n/gcd(n,m))/(eval(m/gcd(n,m))*x)'],	
		['(n*x)/(m*y)',['n isa "number"','m isa "number"','gcd(n,m)>1'],'(eval(n/gcd(n,m))*x)/(eval(m/gcd(n,m))*y)']	
	],

	zeroBase: [
		['0^x',[],'0']
	],

	constantsFirst: [
		['x*n',['n isa "number"','!(x isa "number")'],'n*x']
	],

	sqrtProduct: [
		['sqrt(x)*sqrt(y)',[],'sqrt(x*y)']
	],

	sqrtDivision: [
		['sqrt(x)*sqrt(y)',[],'sqrt(x/y)']
	],

	sqrtSquare: [
		['sqrt(x^2)',[],'x'],
		['sqrt(x)^2',[],'x']
	],

	trig: [
		['sin(n)',['n isa "number"','isint(2*n/pi)'],'eval(sin(n))'],
		['cos(n)',['n isa "number"','isint(2*n/pi)'],'eval(cos(n))'],
		['tan(n)',['n isa "number"','isint(n/pi)'],'0'],
		['cosh(0)',[],'1'],
		['sinh(0)',[],'0'],
		['tanh(0)',[],'0']
	],

	otherNumbers: [
		['n^m',['n isa "number"','m isa "number"'],'eval(n^m)']
	]
};

var compileRules = jme.display.compileRules = function(rules)
{
	for(var i=0;i<rules.length;i++)
	{
		pattern = rules[i][0];
		conditions = rules[i][1];
		result = rules[i][2];
		rules[i] = new Rule(pattern,conditions,result);
	}
	return rules;
}

for(var x in simplificationRules)
	simplificationRules[x] = compileRules(simplificationRules[x]);

})();
