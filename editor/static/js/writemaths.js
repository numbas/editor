/*
Copyright (C) 2012-25 Christian Lawson-Perfect

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(() => {
var endDelimiters = {
    '$': [/(?<!\\)\$/g, '$'],
    '\\(': [/(?<!\\)\\\)/g, '\\)'],
    '$$': [/(?<!\\)\$\$/g, '$$'],
    '\\[': [/(?<!\\)\\\]/g, '\\]'],
}

/**
 * @typedef maths_match
 * @property {number} start
 * @property {number} end
 * @property {string} math
 * @property {string} startDelimiter
 * @property {string} endDelimiter
 */

/** Find the last passage of maths in `txt` before the position `target`.
 *
 * @param {string} txt
 * @param {number} target
 * @returns {maths_match}
 */
function findMaths(txt,target) {
    let m;
    const re_startMaths = /(?<!\\)\$\$?|\\\(|\\\[|\\begin\{(\w+)\}/g;
    while(re_startMaths.lastIndex < target) {
        m = re_startMaths.exec(txt);
        if(!m) {
            return null;
        }

        const [startDelimiter, env] = m;

        const [re_endMaths, endDelimiter] =
            startDelimiter.match(/^\\begin/) ? 
            [new RegExp(`(?<!\\\\)\\\\end\\{${env}\\}`, 'g'), `\\end{${env}}`]
            : endDelimiters[startDelimiter]
        ;

        const start = re_startMaths.lastIndex;
        
        if(start > target) {
            return null;
        }

        re_endMaths.lastIndex = start;
        const endm = re_endMaths.exec(txt);
        if(!endm) {
            return {
                start,
                end: target,
                math: txt.slice(start),
                startDelimiter,
                endDelimiter
            }
        }

        const end = re_endMaths.lastIndex - endm[0].length;

        if(target <= end) {
            return {
                start,
                end,
                math: txt.slice(start, end),
                startDelimiter,
                endDelimiter
            }
        }

        re_startMaths.lastIndex = end + endm[0].length;
    }
}
window.findMaths = findMaths;

/** 
 * Show a preview rendering of mathematical notation in an editable area.
 *
 * @param {Element} element
 */
window.writemaths = function(element) {

    const iframe = element.querySelector('iframe');
    const el = iframe.contentDocument.querySelector('body');
    el.classList.add('writemaths', 'tex2jax_ignore');

    const previewElement = document.createElement('div');
    previewElement.classList.add('wm_preview');
    element.insertBefore(previewElement, element.firstChild);

    const container = document.createElement('div');
    container.classList.add('container');
    previewElement.append(container);

    function hide_preview() {
        previewElement.classList.remove('shown');
    }

    function show_preview() {
        previewElement.classList.add('shown');
    }

    let lastMath;

    function update_preview() {
        hide_preview();
        element.classList.remove('in-maths');

        const selection = iframe.contentWindow.getSelection();

        if(selection.type != 'Caret') {
            return;
        }

        let anchor = selection.anchorNode;
        let target = selection.anchorOffset;
        if(anchor.nodeType == anchor.TEXT_NODE) {
            while(anchor.previousSibling) {
                anchor = anchor.previousSibling;
                target += anchor.textContent.length;
            }
            anchor = anchor.parentElement;
        } else {
            target = 0;
            for(let i=0; i<selection.anchorOffset; i++) {
                target += anchor.childNodes[i].textContent.length;
            }
        }

        let p = anchor;
        while(p) {
            if(p.nodeType == p.ELEMENT_NODE && (['code','pre'].includes(p.nodeName.toLowerCase()) || p.classList.contains('wm_ignore'))) {
                return;
            }
            p = p.parentElement;
        }

        let txt = '';
        for(let n of anchor.childNodes) {
            if(n.nodeType==n.ELEMENT_NODE && n.nodeName.toLowerCase()=='br') {
                if(txt.length < target) {
                    target += 1;
                }
                txt += '\n';
            } else {
                txt += n.textContent;
            }
        }

        const q = findMaths(txt, target);

        if(!q) {
            return;
        }

        const {math, startDelimiter, endDelimiter} = q;

        element.classList.add('in-maths');

        if(!math.trim()) {
            return;
        }

        show_preview();

        if(math != lastMath) {
            const tex = startDelimiter + math + endDelimiter;
            container.innerHTML = '';
            container.textContent = tex;
            lastMath = math;
            MathJax.typesetPromise([container]).catch(e => console.error(e));
        }
    }

    let timeout_call;
    function throttle() {
        if(timeout_call) {
            clearTimeout(timeout_call);
        }

        setTimeout(update_preview, 100);
    }

    el.addEventListener('blur',hide_preview);
    el.addEventListener('keyup', (e) => {
        if(e.key == 'Escape') {
            hide_preview();
            return;
        }
        throttle();
    });
    el.addEventListener('click', throttle);
    el.addEventListener('scroll', throttle);
}
})();
