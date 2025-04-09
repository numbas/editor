/**
 * An extension to MathJax which adds \var and \simplify commands.
 */
(function() {

    var NumbasMap = new MathJax._.input.tex.SymbolMap.CommandMap(
        'numbasMap', 

        {
            var: ['numbasVar', 'var'],
            simplify: ['numbasSimplify', 'simplify']
        }, 

        { 
            numbasVar: function mmlToken(parser, name, type) {
                const {jme} = Numbas;

                try {
                    const settings_string = parser.GetBrackets(name); // The optional argument to the command, in square brackets.

                    const settings = {};
                    if(settings_string!==undefined) {
                        settings_string.split(/\s*,\s*/g).forEach(function(v) {
                            var setting = jme.normaliseRulesetName(v.trim());
                            settings[setting] = true;
                        });
                    }

                    const expr = parser.GetArgument(name);

                    const {scope} = parser.configuration.packageData.get('numbas');

                    let tex;

                    if(scope.showSubstitutions) {
                        const tok = jme.evaluate(expr, scope);
                        tex = jme.display.texify({tok}, settings, scope);
                    } else {
                        const res = Editor.texJMEBit(expr, settings, null, scope);
                        tex = `\\class{jme-var}{\\left\\{${res.tex || res.message}\\right\\}}`;
                    }

                    console.log(tex);
                    const mml = new MathJax._.input.tex.TexParser.default(tex, parser.stack.env, parser.configuration).mml();

                    parser.Push(mml);
                } catch(e) {
                    console.error(e);
                    throw(new Numbas.Error('mathjax.math processing error',{message:e.message,expression:expr}));
                }

            },

            numbasSimplify: function mmlToken(parser, name, type) {
                const {jme} = Numbas;

                try {
                    let ruleset = parser.GetBrackets(name); // The optional argument to the command, in square brackets.
                    if(ruleset === undefined) {
                        ruleset = 'all';
                    }

                    const expr = parser.GetArgument(name);

                    const {scope} = parser.configuration.packageData.get('numbas');

                    let tex;
                    if(scope.showSubstitutions) {
                        const subbed_tree = Numbas.jme.display.subvars(expr, scope);
                        tex = Numbas.jme.display.treeToLaTeX(subbed_tree, ruleset, scope);
                    } else {
                        const res = Editor.texJMEBit(expr, ruleset, null, scope);
                        tex = `\\class{jme-simplify}{\\left\\{${res.tex || res.message}\\right\\}}`;
                    }

                    const mml = new MathJax._.input.tex.TexParser.default(tex, parser.stack.env, parser.configuration).mml();

                    parser.Push(mml);
                } catch(e) {
                    console.error(e);
                    throw(new Numbas.Error('mathjax.math processing error',{message:e.message,expression:expr}));
                }

            },
        }
    );

    function saveJMEScope(arg) {
        const scope = Numbas.display_util.find_jme_scope(arg.math.start.node);
        arg.data.packageData.set('numbas',{scope});
    }


    var NumbasConfiguration = MathJax._.input.tex.Configuration.Configuration.create('numbas', {
        handler: {
            macro: ['numbasMap']
        },
        preprocessors: [
            [saveJMEScope, 1]
        ],  
    });

})();
