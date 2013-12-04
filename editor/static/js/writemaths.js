/*
Copyright (C) 2012 Christian Perfect

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function() {

function saveSelection(containerEl) {
    var charIndex = 0, start = 0, end = 0, foundStart = false, stop = {};
    var sel = rangy.getSelection(), range;

    function traverseTextNodes(node, range) {
        if (node.nodeType == 3) {
            if (!foundStart && node == range.startContainer) {
                start = charIndex + range.startOffset;
                foundStart = true;
            }
            if (foundStart && node == range.endContainer) {
                end = charIndex + range.endOffset;
                throw stop;
            }
            charIndex += node.length;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i], range);
            }
        }
    }
    
    if (sel.rangeCount) {
        try {
            traverseTextNodes(containerEl, sel.getRangeAt(0));
        } catch (ex) {
            if (ex != stop) {
                throw ex;
            }
        }
    }

    return {
        start: start,
        end: end
    };
}

function restoreSelection(containerEl, savedSel) {
    var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
    range.collapseToPoint(containerEl, 0);
    
    function traverseTextNodes(node) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i]);
            }
        }
    }
    
    try {
        traverseTextNodes(containerEl);
    } catch (ex) {
        if (ex == stop) {
            rangy.getSelection().setSingleRange(range);
        } else {
            throw ex;
        }
    }
}

var endDelimiters = {
    '$': /[^\\]\$/,
    '\\(': /[^\\]\\\)/,
    '$$': /[^\\]\$\$/,
    '\\[': /[^\\]\\\]/
}
var re_startMaths = /\$\$|\$|\\\(|\\\[|\\begin\{(\w+)\}/;
function findMaths(txt,target) {
    var i = 0;
    var m;
    var startDelimiter, endDelimiter;
    var start, end;
    var startChop, endChop;
    var re_end;
   
    while(txt.length) {
        m = re_startMaths.exec(txt);
        
        if(!m)     // if no maths delimiters, target is not in a maths section
            return null;
        
        startDelimiter = m[0];
        var start = m.index;
        
        if(i+start >= target)    // if target was before the starting delimiter, it's not in a maths section
            return null;
        
        startChop = start+startDelimiter.length;
        txt = txt.slice(startChop);
        
        if(startDelimiter.match(/^\\begin/)) {    //if this is an environment, construct a regexp to find the corresponding \end{} command.
            var environment = m[1];
            re_end = new RegExp('[^\\\\]\\\\end\\{'+environment+'\\}');    // don't ask if this copes with nested environments
        }
        else {
            re_end = endDelimiters[startDelimiter];    // get the corresponding end delimiter for the matched start delimiter
        }
        
        m = re_end.exec(txt);
        
        if(!m) {    // if no ending delimiter, target is in a maths section
            return {
                start: i+start,
                end: i+startChop+txt.length,
                math: txt,
                startDelimiter: startDelimiter,
                endDelimiter: endDelimiter
            };
        }
        
        endDelimiter = m[0];
        var end = m.index+1;    // the end delimiter regexp has a "not a backslash" character at the start because JS regexps don't do negative lookbehind
        endChop = end+endDelimiter.length-1;
        if(i+startChop+end >= target) {    // if target is before the end delimiter, it's in a maths section
            return {
                start: i+start,
                end: i+startChop+endChop,
                math: txt.slice(0,end),
                startDelimiter: startDelimiter,
                endDelimiter: endDelimiter.slice(1)
            };
        } 
        else {
            txt = txt.slice(endChop);
            i += startChop+endChop;
        }
    }
}

jQuery(function() {
    jQuery("<style type='text/css'> .wm_preview { z-index: 1; position: absolute; display: none; border: 1px solid; padding: 0.2em; width: auto; margin: 0 auto; background: white;} </style>").appendTo("head");

	jQuery.fn.writemaths = function(options) {
		options = jQuery.extend({
			cleanMaths: function(m){ return m; },
			callback: function() {},
            iFrame: false,
			position: false,
			previewPosition: 'left top'
		},options);

        jQuery(this).each(function() {

            var textarea = jQuery(this).is('textarea,input');

            var root = this;
            if(options.iFrame) {
    			var iframe = jQuery(this).find('iframe')[0];
                var el = jQuery(iframe).contents().find('body');
            }
            else
            {
                el = jQuery(this);
            }
            el.addClass('writemaths tex2jax_ignore');
            var previewElement = jQuery('<div class="wm_preview"/>');
			jQuery('body').append(previewElement);

            var queue = MathJax.Callback.Queue(MathJax.Hub.Register.StartupHook("End",{}));

			function positionPreview() {
				var of = options.iFrame ? iframe : textarea ? root : document;
				if(options.position)
					previewElement.position({my: options.previewPosition, at: options.position, of: of, collision: 'fit'})
				else
					previewElement.position({my: 'left bottom', at: 'left top', of: of, offset: pos.x+' '+pos.y, collision: 'fit'})
			}

			function updatePreview(e) {
                previewElement.hide();

                var pos, txt, sel, range;
                if(textarea) {
                    pos = jQuery(this).getCaretPosition();
                    var fontHeight = parseInt(jQuery(this).css('font-size').replace('px',''));
                    pos = {x: pos.left, y: pos.top - fontHeight};
                    sel = jQuery(this).getSelection();
                    range = {startOffset: sel.start, endOffset: sel.end};
                    txt = jQuery(this).val();
                }
                else {
                    sel = options.iFrame ? rangy.getIframeSelection(iframe) : rangy.getSelection();
                    try{
                        pos = sel.getStartDocumentPos();
                    }
                    catch(e) {
                        return;
                    }
					if(options.iFrame) {
						pos.y -= $(iframe).contents().scrollTop();
					}
                    var anchor = sel.anchorNode;

                    range = sel.getRangeAt(0);

					if(anchor.nodeType == anchor.TEXT_NODE) {	
						while(anchor.previousSibling) {
							anchor = anchor.previousSibling;
							range.startOffset += anchor.textContent.length;
							range.endOffset += anchor.textContent.length;
						}
						anchor = anchor.parentNode;
					}

                    if(jQuery(anchor).add(jQuery(anchor).parents()).filter('code,pre,.wm_ignore').length)
                        return;
                    txt = jQuery(anchor).text();
                }
				if(pos.y<0)
					return;

                //only do this if the selection has zero width
                //so when you're selecting blocks of text, distracting previews don't pop up
                if(range.startOffset != range.endOffset)
                    return;

				var target = range.startOffset;

				var q = findMaths(txt,target);

				if(!q)
					return;

                var math;
				if(q.startDelimiter.match(/^\\begin/))
					math = q.startDelimiter + q.math + (q.endDelimiter ? q.endDelimiter : '');
				else
					math = q.math;

                if(!math.length)
                    return;

                previewElement.show();

				if(math==$(this).data('writemaths-lastMath'))
					return;

				var script = document.createElement('script');
				script.setAttribute('type','math/tex');
				script.textContent = options.cleanMaths(math);
				previewElement.html(script);
				$(this).data('writemaths-lastMath',math);;
                positionPreview();

                queue.Push(['Typeset',MathJax.Hub,previewElement[0]]);
                queue.Push(positionPreview);
                queue.Push(options.callback);
            }

			updatePreview = $.throttle(100,updatePreview);

            el
			.on('blur',function(e) {
				previewElement.hide();
			})
			.on('keyup click',updatePreview);
			if(options.iFrame)
				$(el[0].ownerDocument).on('scroll',updatePreview);
			else
				el.on('scroll',updatePreview);

        });
		return this;
	}
});

})();
