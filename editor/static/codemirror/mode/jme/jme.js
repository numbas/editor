CodeMirror.defineMode("jme", function(config, parserConfig) {

    var re_whitespace = '[\\s \\f\\n\\r\\t\\v\\u00A0\\u2028\\u2029]';
    var re_strip_whitespace = new RegExp('^'+re_whitespace+'+|'+re_whitespace+'+$','g');
    var tokens = {
        'bool': /^true|^false/i,
        'number': /^[0-9]+(?:\x2E[0-9]+)?/,
        'op': /^_|\.\.|#|<=|>=|<>|&&|\|\||[\|*+\-\/\^<>=!&]/i,
        'word_op': /^(?:(not|and|or|xor|isa|except)(?=[^a-zA-Z0-9]|$))/,
        'name': /^{?((?:(?:[a-zA-Z]+):)*)((?:\$?[a-zA-Z][a-zA-Z0-9]*'*)|\?)}?/i,
        'punctuation': /^([\(\),\[\]])/,
        'string': /^(['"])((?:[^\1\\]|\\.)*?)\1/,
        'special': /^\\\\([%!+\-\,\.\/\:,\?\[\]=\*\&<>\|~\(\)]|\d|([a-zA-Z]+))/
    };
    var tokenClass = {
        'bool': 'atom',
        'number': 'number',
        'name': 'variable',
        'op': 'operator',
        'word_op': 'keyword',
        'punctuation': 'bracket',
        'string': 'string',
        'special': 'variable-2'
    }

    return {
        token: function(stream,state) {
            stream.eatSpace();
            if(stream.match(/\/\//)) {
                stream.skipToEnd();
                return 'comment';
            }
            var ch = stream.peek();
            if(stream.eat(/[\(\[]/)) {
                state.inBrackets+= 1;
                return 'bracket';
            }
            else if(stream.eat(/[\)\]]/)) {
                state.inBrackets-= state.inBrackets>0 ? 1 : 0;
                return 'bracket';
            }

            for(var tokType in tokens) {
                if(stream.match(tokens[tokType]))
                    return tokenClass[tokType];
            }
            stream.next();
            return null;
        },
        startState: function() {
            return {
                inBrackets: 0
            };
        },
        indent: function(state, textAfter) {
			var brackets = state.inBrackets;
			var bracketsAfter;
			if(bracketsAfter=textAfter.match(/^\s*[\)\]][\)\]\s]*/)) {
				brackets -= bracketsAfter[0].replace(/\s/,'').length;
			}
			console.log(brackets);
			return brackets*(config.indentUnit || 1);
        }
    }
});
