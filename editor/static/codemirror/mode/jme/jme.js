CodeMirror.defineMode("jme", function(config, parserConfig) {

    var re = Numbas.jme.standardParser.re;

    var tokenTypes = [
        {name: 'op', class: 'operator', re: re.re_op},
        {name: 'space', class: 'space', re: new RegExp('^'+re.re_whitespace)},
        {name: 'bool', class: 'atom', re: re.re_bool},
        {name: 'number', class: 'number', re: re.re_number},
        {name: 'superscript', class: 'number', re: re.re_superscript},
        {name: 'name', class: 'variable', re: re.re_name},
        {name: 'string', class: 'string', re: re.re_string},
        {name: 'keypair', class: 'punctuation', re: re.re_keypair}
    ]

    return {
        token: function(stream,state) {
            if(stream.match(/\/\//)) {
                stream.skipToEnd();
                return 'comment';
            }
            var ch = stream.peek();
            if(stream.eat(/[\(\[]/)) {
                state.inBrackets += 1;
                return 'bracket';
            }
            else if(stream.eat(/[\)\]]/)) {
                state.inBrackets -= state.inBrackets>0 ? 1 : 0;
                return 'bracket';
            }
            var m;
            if(m = stream.match(re.re_op)) {
                if(m[0].match(/^[\p{Ll}\p{Lu}\p{Lt}]/u)) {
                    return 'keyword';
                } else {
                    return 'operator';
                }
            }

            for(var i=0;i<tokenTypes.length;i++) {
                var tokenType = tokenTypes[i];
                if(stream.match(tokenType.re)) {
                    return tokenType.class;
                }
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
			return brackets*(config.indentUnit || 1);
        }
    }
});
