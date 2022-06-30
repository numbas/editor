var jme_function_hints = 
[
    {
        "name": "correct",
        "description": "Set the credit to 1 and give the feedback message <code>message</code>.\nIf <code>message</code> is omitted, the default \"Your answer is correct\" message for the current locale is used.",
        "keywords": [
            "award",
            "credit",
            "right"
        ],
        "calling_patterns": [
            "correct(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "incorrect",
        "description": "Set the credit to 0 and give the feedback message <code>message</code>.\nIf <code>message</code> is omitted, the default \"Your answer is incorrect\" message for the current locale is used.",
        "keywords": [
            "credit",
            "wrong"
        ],
        "calling_patterns": [
            "incorrect(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "correctif",
        "description": "If <code>condition</code> evaluates to <code>true</code>, set the credit to 1 and give the default feedback message.\nOtherwise, set the credit to 0 and give the default feedback message.",
        "keywords": [
            "condition",
            "award",
            "credit",
            "right",
            "wrong"
        ],
        "calling_patterns": [
            "correctif(condition)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "set_credit",
        "description": "Set the credit to <code>credit</code>, and give the feedback message <code>message</code>.\nThe message should explain why the credit was awarded.",
        "keywords": [
            "award",
            "credit",
            "score"
        ],
        "calling_patterns": [
            "set_credit(credit, message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "add_credit",
        "description": "Add <code>credit</code> to the current total, to a maximum of 1, and give the feedback message <code>message</code>.\nThe message should explain why the credit was awarded.",
        "keywords": [
            "award",
            "credit",
            "score"
        ],
        "calling_patterns": [
            "add_credit(credit, message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "sub_credit",
        "description": "Subtract <code>credit</code> from the current total and give the feedback message <code>message</code>.\nThe message should explain why the credit was taken away.",
        "keywords": [
            "subtract",
            "credit",
            "score",
            "penalty",
            "penalise"
        ],
        "calling_patterns": [
            "sub_credit(credit, message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "multiply_credit",
        "description": "Multiply the current credit by <code>proportion</code> and give the feedback message <code>message</code>.\nThe message should explain why the credit was modified.",
        "keywords": [
            "penalty",
            "credit",
            "score"
        ],
        "calling_patterns": [
            "multiply_credit(proportion, message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "end",
        "description": "End the marking here.\nAny feedback items produced after this one are not applied.",
        "keywords": [
            "stop"
        ],
        "calling_patterns": [
            "end()"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "fail",
        "description": "Reject the student's answer as invalid, set the credit to 0 and give the feedback message <code>message</code>.\nThe message should explain why the student's answer was rejected.",
        "keywords": [
            "error"
        ],
        "calling_patterns": [
            "fail(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "warn",
        "description": "Show a warning next to the answer input.\nThis does not affect credit or stop the running of the marking algorithm.",
        "keywords": [
            "warning",
            "feedback",
            "message"
        ],
        "calling_patterns": [
            "warn(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "feedback",
        "description": "Give the feedback message <code>message</code>, without modifying the credit awarded.",
        "keywords": [
            "message",
            "comment"
        ],
        "calling_patterns": [
            "feedback(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "positive_feedback",
        "description": "Give the feedback message <code>message</code>, without modifying the credit awarded, but with a positive annotation (a green tick in the default theme).",
        "keywords": [
            "message",
            "comment",
            "tick"
        ],
        "calling_patterns": [
            "positive_feedback(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "negative_feedback",
        "description": "Give the feedback message <code>message</code>, without modifying the credit awarded, but with a negative annotatin (a red cross in the default theme).",
        "keywords": [
            "message",
            "comment",
            "cross"
        ],
        "calling_patterns": [
            "negative_feedback(message)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": ";",
        "description": "Add feedback items generated by <code>x</code> to those generated by <code>y</code>, and return <code>y</code>.",
        "keywords": [
            "then"
        ],
        "calling_patterns": [
            "x ; y"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "apply",
        "description": "If <code>feedback</code> is the name of a marking note, apply its feedback items to this note.",
        "keywords": [
            "concatenate",
            "add",
            "feedback",
            "substitute"
        ],
        "calling_patterns": [
            "apply(feedback)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "apply_marking_script",
        "description": "Apply the marking script with the given name, with the given values of the variables <code>studentanswer</code> and <code>settings</code> and with <code>marks</code> marks available.",
        "keywords": [
            "run",
            "evaluate",
            "marking"
        ],
        "calling_patterns": [
            "apply_marking_script(name, studentanswer, settings, marks)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "submit_part",
        "description": "Submit the part with the given path.\nIf <code>answer</code> is given, the answer stored for that part is overwritten with the given value.\nReturns a dictionary of the following form:",
        "keywords": [
            "part",
            "mark",
            "validate"
        ],
        "calling_patterns": [
            "submit_part(path,[answer])"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "mark_part",
        "description": "Mark the part with the given path, using the given value for <code>studentanswer</code>.",
        "keywords": [
            "part",
            "mark",
            "validate"
        ],
        "calling_patterns": [
            "mark_part(path, studentanswer)"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "concat_feedback",
        "description": "Apply the given list of feedback items (generated by <code>submit_part</code> or <code>mark_part</code>) to this note, scaling the credit awarded by <code>scale</code>.",
        "keywords": [
            "join",
            "add",
            "feedback",
            "apply"
        ],
        "calling_patterns": [
            "concat_feedback(items, scale, [strip_messages])"
        ],
        "doc": "marking-algorithm"
    },
    {
        "name": "int",
        "description": "An indefinite integration, with respect to the given variable.",
        "keywords": [
            "integrate",
            "integral",
            "indefinite"
        ],
        "calling_patterns": [
            "int(expression, variable)"
        ],
        "doc": "simplification"
    },
    {
        "name": "defint",
        "description": "A definite integration between the two given bounds.",
        "keywords": [
            "integrate",
            "integral",
            "definite"
        ],
        "calling_patterns": [
            "defint(expression, variable,lower bound, upper bound)"
        ],
        "doc": "simplification"
    },
    {
        "name": "diff",
        "description": "$n$-th derivative of expression with respect to the given variable",
        "keywords": [
            "differentiate",
            "derivative",
            "calculus"
        ],
        "calling_patterns": [
            "diff(expression, variable, n)"
        ],
        "doc": "simplification"
    },
    {
        "name": "partialdiff",
        "description": "$n$-th partial derivative of expression with respect to the given variable",
        "keywords": [
            "differentiate",
            "derivative",
            "calculus"
        ],
        "calling_patterns": [
            "partialdiff(expression, variable, n)"
        ],
        "doc": "simplification"
    },
    {
        "name": "sub",
        "description": "Add a subscript to a variable name.\nNote that variable names with constant subscripts are already rendered properly -- see variable-names -- but this function allows you to use an arbitray index, or a more complicated expression.",
        "keywords": [
            "subscript"
        ],
        "calling_patterns": [
            "sub(expression,index)"
        ],
        "doc": "simplification"
    },
    {
        "name": "sup",
        "description": "Add a superscript to a variable name.\nNote that the simplification rules to do with powers won't be applied to this function, since it represents a generic superscript notation, rather than the operation of raising to a power.",
        "keywords": [
            "superscript"
        ],
        "calling_patterns": [
            "sup(expression,index)"
        ],
        "doc": "simplification"
    },
    {
        "name": "+",
        "description": "Addition.",
        "keywords": [
            "add",
            "plus"
        ],
        "calling_patterns": [
            "x+y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "-",
        "description": "Subtraction.",
        "keywords": [
            "subtraction",
            "minus"
        ],
        "calling_patterns": [
            "x-y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "*",
        "description": "Multiplication.",
        "keywords": [
            "times",
            "multiply",
            "multiplication",
            "product"
        ],
        "calling_patterns": [
            "x*y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "/",
        "description": "Division.\nOnly defined for numbers.",
        "keywords": [
            "divide",
            "division",
            "quotient",
            "ratio"
        ],
        "calling_patterns": [
            "x/y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "^",
        "description": "Exponentiation.",
        "keywords": [
            "power",
            "exponential"
        ],
        "calling_patterns": [
            "x^y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "exp",
        "description": "$e^x$ - a synonym for <code>e^x</code>.",
        "keywords": [
            "power",
            "exponential"
        ],
        "calling_patterns": [
            "exp(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "decimal",
        "description": "Construct a <code>decimal</code> value.\nAny string accepted by Decimal.js is accepted.",
        "keywords": [
            ""
        ],
        "calling_patterns": [
            "decimal(n)",
            "decimal(x)",
            "dec(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "rational",
        "description": "Convert <code>n</code> to a rational number, taking an approximation when necessary.",
        "keywords": [
            ""
        ],
        "calling_patterns": [
            "rational(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "int",
        "description": "Convert <code>n</code> to an integer, rounding to the nearest integer.",
        "keywords": [
            "integer"
        ],
        "calling_patterns": [
            "int(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "abs",
        "description": "Absolute value, length, or modulus.",
        "keywords": [
            "absolute value",
            "modulus",
            "length",
            "size"
        ],
        "calling_patterns": [
            "abs(x)",
            "len(x)",
            "length(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arg",
        "description": "Argument of a complex number.",
        "keywords": [
            "argument",
            "direction"
        ],
        "calling_patterns": [
            "arg(z)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "re",
        "description": "Real part of a complex number.",
        "keywords": [
            "real part"
        ],
        "calling_patterns": [
            "re(z)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "im",
        "description": "Imaginary part of a complex number.",
        "keywords": [
            "imaginary part"
        ],
        "calling_patterns": [
            "im(z)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "conj",
        "description": "Complex conjugate.",
        "keywords": [
            "conjugate",
            "complex"
        ],
        "calling_patterns": [
            "conj(z)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isint",
        "description": "Returns <code>true</code> if <code>x</code> is an integer - that is, it is real and has no fractional part.",
        "keywords": [
            "integer",
            "test"
        ],
        "calling_patterns": [
            "isint(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "iszero",
        "description": "Returns <code>true</code> when <code>n</code> is exactly 0.",
        "keywords": [
            "integer",
            "test",
            "zero"
        ],
        "calling_patterns": [
            "iszero(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sqrt",
        "description": "Square root of a number.",
        "keywords": [
            "square root"
        ],
        "calling_patterns": [
            "sqrt(x)",
            "sqr(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "root",
        "description": "<code>n</code>th root of <code>x</code>.",
        "keywords": [
            "root",
            "power"
        ],
        "calling_patterns": [
            "root(x,n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "ln",
        "description": "Natural logarithm.",
        "keywords": [
            "logarithm",
            "natural"
        ],
        "calling_patterns": [
            "ln(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "log",
        "description": "Logarithm with base <code>b</code>, or base 10 if <code>b</code> is not given.",
        "keywords": [
            "logarithm",
            "arbitrary",
            "base"
        ],
        "calling_patterns": [
            "log(x,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "degrees",
        "description": "Convert radians to degrees.",
        "keywords": [
            "radians",
            "convert",
            "angle"
        ],
        "calling_patterns": [
            "degrees(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "radians",
        "description": "Convert degrees to radians.",
        "keywords": [
            "degrees",
            "convert",
            "angle"
        ],
        "calling_patterns": [
            "radians(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sign",
        "description": "Sign of a number.\nEquivalent to $\\frac{x}{|x|}$, or 0 when <code>x</code> is 0.",
        "keywords": [
            "positive",
            "negative"
        ],
        "calling_patterns": [
            "sign(x)",
            "sgn(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "max",
        "description": "Greatest of the given numbers.",
        "keywords": [
            "maximum"
        ],
        "calling_patterns": [
            "max(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "min",
        "description": "Least of the given numbers.",
        "keywords": [
            "minimum"
        ],
        "calling_patterns": [
            "min(a,b)",
            "min(numbers)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "clamp",
        "description": "Return the point nearest to <code>x</code> in the interval $[a,b]$.",
        "keywords": [
            "restrict"
        ],
        "calling_patterns": [
            "clamp(x,a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "precround",
        "description": "Round <code>n</code> to <code>d</code> decimal places.\nOn matrices and vectors, this rounds each element independently.",
        "keywords": [
            "round",
            "decimal",
            "places"
        ],
        "calling_patterns": [
            "precround(n,d)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "siground",
        "description": "Round <code>n</code> to <code>f</code> significant figures.\nOn matrices and vectors, this rounds each element independently.",
        "keywords": [
            "round",
            "significant",
            "figures"
        ],
        "calling_patterns": [
            "siground(n,f)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "withintolerance",
        "description": "Returns <code>true</code> if $b-t \\leq a \\leq b+t$.",
        "keywords": [
            "close",
            "near",
            "tolerance"
        ],
        "calling_patterns": [
            "withintolerance(a,b,t)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "dpformat",
        "description": "Round <code>n</code> to <code>d</code> decimal places and return a string, padding with zeros if necessary.",
        "keywords": [
            "string",
            "format",
            "decimal",
            "places",
            "write"
        ],
        "calling_patterns": [
            "dpformat(n,d,[style])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "countdp",
        "description": "Assuming <code>n</code> is a string representing a number, return the number of decimal places used.\nThe string is passed through <code>cleannumber</code> first.",
        "keywords": [
            "decimal",
            "places"
        ],
        "calling_patterns": [
            "countdp(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sigformat",
        "description": "Round <code>n</code> to <code>d</code> significant figures and return a string, padding with zeros if necessary.",
        "keywords": [
            "string",
            "format",
            "significant",
            "figures",
            "write"
        ],
        "calling_patterns": [
            "sigformat(n,d,[style])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "countsigfigs",
        "description": "Assuming <code>n</code> is a string representing a number, return the number of significant figures.\nThe string is passed through <code>cleannumber</code> first.",
        "keywords": [
            "significant",
            "figures"
        ],
        "calling_patterns": [
            "countsigfigs(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "togivenprecision",
        "description": "Returns <code>true</code> if <code>str</code> is a string representing a number given to the desired number of decimal places or significant figures.",
        "keywords": [
            "test",
            "precision",
            "significant",
            "figures",
            "decimal",
            "places"
        ],
        "calling_patterns": [
            "togivenprecision(str, precisionType, precision, strict)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tonearest",
        "description": "Round <code>a</code> to the nearest multiple of <code>b</code>.",
        "keywords": [
            "round",
            "multiple",
            "nearest"
        ],
        "calling_patterns": [
            "tonearest(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "formatnumber",
        "description": "Render the number <code>n</code> using the given number notation style.",
        "keywords": [
            "string",
            "number",
            "write",
            "convert"
        ],
        "calling_patterns": [
            "formatnumber(n,style)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "scientificnumberlatex",
        "description": "Return a LaTeX string representing the given number in scientific notation, $a \\times 10^b$.",
        "keywords": [
            "latex",
            "string",
            "write",
            "convert"
        ],
        "calling_patterns": [
            "scientificnumberlatex(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "scientificnumberhtml",
        "description": "Return an HTML element representing the given number in scientific notation, $a \\times 10^b$.",
        "keywords": [
            "html",
            "convert",
            "write",
            "number"
        ],
        "calling_patterns": [
            "scientificnumberhtml(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cleannumber",
        "description": "Clean a string potentially representing a number.\nRemove space, and then try to identify a notation style, and rewrite to the <code>plain-en</code> style.",
        "keywords": [
            "strip",
            "trim",
            "validate",
            "number"
        ],
        "calling_patterns": [
            "cleannumber(str, styles)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "matchnumber",
        "description": "Try to match a string representing a number in any of the given styles at the start of the given string, and return both the matched text and a corresponding <code>number</code> value.",
        "keywords": [
            "test",
            "number",
            "representation",
            "string"
        ],
        "calling_patterns": [
            "matchnumber(str,styles)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "parsenumber",
        "description": "Parse a string representing a number written in the given style.",
        "keywords": [
            "parse",
            "convert",
            "number",
            "string"
        ],
        "calling_patterns": [
            "parsenumber(string,style)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "parsenumber_or_fraction",
        "description": "Works the same as <code>parsenumber</code>, but also accepts strings of the form <code>number/number</code>, which it interprets as fractions.",
        "keywords": [
            "parse",
            "convert",
            "number",
            "fraction",
            "string"
        ],
        "calling_patterns": [
            "parsenumber_or_fraction(string,style)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "parsedecimal",
        "description": "Parse a string representing a number written in the given style, and return a <code>decimal</code> value.",
        "keywords": [
            "parse",
            "convert",
            "number",
            "decimal",
            "string"
        ],
        "calling_patterns": [
            "parsedecimal(string,style)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "parsedecimal_or_fraction",
        "description": "Works the same as <code>parsedecimal</code>, but also accepts strings of the form <code>number/number</code>, which it interprets as fractions.",
        "keywords": [
            "parse",
            "convert",
            "number",
            "decimal",
            "string",
            "fraction"
        ],
        "calling_patterns": [
            "parsedecimal_or_fraction(string,style)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tobinary",
        "description": "Write the given number in binary: base 2.",
        "keywords": [
            "convert",
            "number",
            "binary",
            "string",
            "base"
        ],
        "calling_patterns": [
            "tobinary(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tooctal",
        "description": "Write the given number in octal: base 8.",
        "keywords": [
            "convert",
            "number",
            "octal",
            "string",
            "base"
        ],
        "calling_patterns": [
            "tooctal(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tohexadecimal",
        "description": "Write the given number in hexadecimal: base 16.",
        "keywords": [
            "convert",
            "number",
            "hexadecimal",
            "string",
            "base"
        ],
        "calling_patterns": [
            "tohexadecimal(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tobase",
        "description": "Write the given number in the given base.\n<code>base</code> can be any integer between 2 and 36.",
        "keywords": [
            "convert",
            "number",
            "string",
            "base"
        ],
        "calling_patterns": [
            "tobase(n,base)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "frombinary",
        "description": "Convert a string representing a number written in binary (base 2) to a <code>integer</code> value.",
        "keywords": [
            "convert",
            "number",
            "binary",
            "string",
            "base"
        ],
        "calling_patterns": [
            "frombinary(s)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "fromoctal",
        "description": "Convert a string representing a number written in octal (base 8) to a <code>integer</code> value.",
        "keywords": [
            "convert",
            "number",
            "octal",
            "string",
            "base"
        ],
        "calling_patterns": [
            "fromoctal(s)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "fromhexadecimal",
        "description": "Convert a string representing a number written in hexadecimal (base 16) to a <code>integer</code> value.",
        "keywords": [
            "convert",
            "number",
            "hexadecimal",
            "string",
            "base"
        ],
        "calling_patterns": [
            "fromhexadecimal(s)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "frombase",
        "description": "Convert a string representing a number written in the given base to a <code>integer</code> value.\n<code>base</code> can be any integer between 2 and 36.",
        "keywords": [
            "convert",
            "number",
            "string",
            "base"
        ],
        "calling_patterns": [
            "frombase(s,base)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isnan",
        "description": "Is <code>n</code> the \"not a number\" value, <code>NaN</code>?",
        "keywords": [
            "test",
            "number",
            "validate",
            "invalid"
        ],
        "calling_patterns": [
            "isnan(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sin",
        "description": "Sine.",
        "keywords": [
            "sine",
            "trigonometry",
            "trigonometric"
        ],
        "calling_patterns": [
            "sin(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cos",
        "description": "Cosine.",
        "keywords": [
            "cosine",
            "trigonometry",
            "trigonometric"
        ],
        "calling_patterns": [
            "cos(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tan",
        "description": "Tangent: $\\tan(x) = \\frac{\\sin(x)}{\\cos(x)}$",
        "keywords": [
            "tangent",
            "trigonometry",
            "trigonometric"
        ],
        "calling_patterns": [
            "tan(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cosec",
        "description": "Cosecant: $\\csc(x) = \\frac{1}{sin(x)}$",
        "keywords": [
            "cosecant",
            "trigonometry",
            "trigonometric"
        ],
        "calling_patterns": [
            "cosec(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sec",
        "description": "Secant: $\\sec(x) = \\frac{1}{cos(x)}$",
        "keywords": [
            "trigonometry",
            "trigonometric",
            "secant"
        ],
        "calling_patterns": [
            "sec(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cot",
        "description": "Cotangent: $\\cot(x) = \\frac{1}{\\tan(x)}$",
        "keywords": [
            "trigonometry",
            "trigonometric",
            "cotangent"
        ],
        "calling_patterns": [
            "cot(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arcsin",
        "description": "Inverse of <code>sin</code>.\nWhen $x \\in [-1,1]$, <code>arcsin(x)</code> returns a value in $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$.",
        "keywords": [
            "trigonometry",
            "trigonometric",
            "arcsine",
            "inverse"
        ],
        "calling_patterns": [
            "arcsin(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arccos",
        "description": "Inverse of <code>cos</code>.\nWhen $x \\in [-1,1]$, <code>arccos(x)</code> returns a value in $[0, \\frac{\\pi}]$.",
        "keywords": [
            "trigonometry",
            "trigonometric",
            "arccosine",
            "inverse"
        ],
        "calling_patterns": [
            "arccos(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arctan",
        "description": "Inverse of <code>tan</code>.\nWhen $x$ is non-complex, <code>arctan(x)</code> returns a value in $[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$.",
        "keywords": [
            "trigonometry",
            "trigonometric",
            "arctangent",
            "inverse"
        ],
        "calling_patterns": [
            "arctan(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "atan2",
        "description": "The angle in radians between the positive $x$-axis and the line through the origin and $(x,y)$.\nThis is often equivalent to <code>arctan(y/x)</code>, except when $x \\lt 0$, when $pi$ is either added or subtracted from the result.",
        "keywords": [
            "trigonometry",
            "trigonometric",
            "arctangent",
            "inverse"
        ],
        "calling_patterns": [
            "atan2(y,x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sinh",
        "description": "Hyperbolic sine: $\\sinh(x) = \\frac{1}{2} \\left( \\mathrm{e}^x - \\mathrm{e}^{-x} \\right)$",
        "keywords": [
            "hyperbolic",
            "sine"
        ],
        "calling_patterns": [
            "sinh(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cosh",
        "description": "Hyperbolic cosine: $\\cosh(x) = \\frac{1}{2} \\left( \\mathrm{e}^x + \\mathrm{e}^{-x} \\right)$",
        "keywords": [
            "hyperbolic",
            "cosine"
        ],
        "calling_patterns": [
            "cosh(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "tanh",
        "description": "Hyperbolic tangent: $\\tanh(x) = \\frac{\\sinh(x)}{\\cosh(x)}$",
        "keywords": [
            "hyperbolic",
            "tangent"
        ],
        "calling_patterns": [
            "tanh(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cosech",
        "description": "Hyperbolic cosecant: $\\operatorname{cosech}(x) = \\frac{1}{\\sinh(x)}$",
        "keywords": [
            "hyperbolic",
            "cosecant"
        ],
        "calling_patterns": [
            "cosech(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sech",
        "description": "Hyperbolic secant: $\\operatorname{sech}(x) = \\frac{1}{\\cosh(x)}$",
        "keywords": [
            "hyperbolic",
            "secant"
        ],
        "calling_patterns": [
            "sech(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "coth",
        "description": "Hyperbolic cotangent: $\\coth(x) = \\frac{1}{\\tanh(x)}$",
        "keywords": [
            "hyperbolic",
            "tangent"
        ],
        "calling_patterns": [
            "coth(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arcsinh",
        "description": "Inverse of <code>sinh</code>.",
        "keywords": [
            "hyperbolic",
            "arcsine",
            "inverse"
        ],
        "calling_patterns": [
            "arcsinh(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arccosh",
        "description": "Inverse of <code>cosh</code>.",
        "keywords": [
            "hyperbolic",
            "arccosine",
            "inverse"
        ],
        "calling_patterns": [
            "arccosh(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "arctanh",
        "description": "Inverse of <code>tanh</code>.",
        "keywords": [
            "hyperbolic",
            "arctangent",
            "inverse"
        ],
        "calling_patterns": [
            "arctanh(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "!",
        "description": "Factorial.\nWhen <code>x</code> is not an integer, $\\Gamma(x+1)$ is used instead.",
        "keywords": [
            "factorial"
        ],
        "calling_patterns": [
            "x!",
            "fact(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "factorise",
        "description": "Factorise <code>n</code>.\nReturns the exponents of the prime factorisation of <code>n</code> as a list.",
        "keywords": [
            "factorise",
            "prime",
            "number",
            "factorisation"
        ],
        "calling_patterns": [
            "factorise(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "divisors",
        "description": "Returns the divisors of <title_reference>n</title_reference>n as a list: positive integers $d$ such that $d \\| n$.",
        "keywords": [
            "divisors",
            "factors",
            "number",
            "factorisation"
        ],
        "calling_patterns": [
            "divisors(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "proper_divisors",
        "description": "Returns the proper divisors of <title_reference>n</title_reference>n as a list: positive integers $d < n$ such that $d \\| n$.\nThat is, the divisors of <title_reference>n</title_reference>n, excluding <title_reference>n</title_reference>n itself.",
        "keywords": [
            "divisors",
            "factors",
            "number",
            "factorisation"
        ],
        "calling_patterns": [
            "proper_divisors(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "gamma",
        "description": "Gamma function.",
        "keywords": [
            "number"
        ],
        "calling_patterns": [
            "gamma(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "ceil",
        "description": "Round up to the nearest integer.\nWhen <code>x</code> is complex, each component is rounded separately.",
        "keywords": [
            "ceiling",
            "round",
            "up",
            "integer",
            "nearest"
        ],
        "calling_patterns": [
            "ceil(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "floor",
        "description": "Round down to the nearest integer.\nWhen <code>x</code> is complex, each component is rounded separately.",
        "keywords": [
            "round",
            "down",
            "integer",
            "nearest"
        ],
        "calling_patterns": [
            "floor(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "round",
        "description": "Round to the nearest integer.\n<code>0.5</code> is rounded up.",
        "keywords": [
            "round",
            "nearest",
            "integer"
        ],
        "calling_patterns": [
            "round(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "trunc",
        "description": "If <code>x</code> is positive, round down to the nearest integer; if it is negative, round up to the nearest integer.",
        "keywords": [
            "truncate",
            "integer",
            "round",
            "nearest"
        ],
        "calling_patterns": [
            "trunc(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "fract",
        "description": "Fractional part of a number.\nEquivalent to <code>x-trunc(x)</code>.",
        "keywords": [
            "fractional",
            "part",
            "decimal"
        ],
        "calling_patterns": [
            "fract(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "rational_approximation",
        "description": "Compute a rational approximation to the given number by computing terms of its continued fraction, returning the numerator and denominator separately.\nThe approximation will be within $e^{-\\text{accuracy}}$ of the true value; the default value for <code>accuracy</code> is 15.",
        "keywords": [
            "approximation",
            "fraction",
            "continued"
        ],
        "calling_patterns": [
            "rational_approximation(n,[accuracy])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "mod",
        "description": "Modulo; remainder after integral division, i.e. $a \\bmod b$.",
        "keywords": [
            "modulus",
            "remainder",
            "division",
            "modulo"
        ],
        "calling_patterns": [
            "mod(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "perm",
        "description": "Count permutations, i.e. $^n \\kern-2pt P_k = \\frac{n!}{(n-k)!}$.",
        "keywords": [
            "permutations",
            "count",
            "combinatoric"
        ],
        "calling_patterns": [
            "perm(n,k)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "comb",
        "description": "Count combinations, i.e. $^n \\kern-2pt C_k = \\frac{n!}{k!(n-k)!}$.",
        "keywords": [
            "combinations",
            "count",
            "combinatoric"
        ],
        "calling_patterns": [
            "comb(n,k)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "gcd",
        "description": "Greatest common divisor of integers <code>a</code> and <code>b</code>.\nCan also write <code>gcf(a,b)</code>.",
        "keywords": [
            "greatest",
            "common",
            "divisor",
            "factor"
        ],
        "calling_patterns": [
            "gcd(a,b)",
            "gcf(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "gcd_without_pi_or_i",
        "description": "Take out factors of $\\pi$ or $i$ from <code>a</code> and <code>b</code> before computing their greatest common denominator.",
        "keywords": [
            "greatest",
            "common",
            "divisor",
            "factor"
        ],
        "calling_patterns": [
            "gcd_without_pi_or_i(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "coprime",
        "description": "Are <code>a</code> and <code>b</code> coprime? True if their <code>gcd</code> is $1$, or if either of <code>a</code> or <code>b</code> is not an integer.",
        "keywords": [
            "test",
            "prime",
            "factorisation"
        ],
        "calling_patterns": [
            "coprime(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "lcm",
        "description": "Lowest common multiple of integers <code>a</code> and <code>b</code>.\nCan be used with any number of arguments; it returns the lowest common multiple of all the arguments.",
        "keywords": [
            "lowest",
            "common",
            "multiple"
        ],
        "calling_patterns": [
            "lcm(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "|",
        "description": "<code>x</code> divides <code>y</code>.",
        "keywords": [
            "divides",
            "test"
        ],
        "calling_patterns": [
            "x|y",
            "x divides y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "vector",
        "description": "Create a vector with given components.\nAlternately, you can create a vector from a single list of numbers.",
        "keywords": [
            "column"
        ],
        "calling_patterns": [
            "vector(a1,a2,...,aN)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "matrix",
        "description": "Create a matrix with given rows, which should be either vectors or lists of numbers.\nOr, you can pass in a single list of lists of numbers.",
        "keywords": [
            "array"
        ],
        "calling_patterns": [
            "matrix(row1,row2,...,rowN)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "id",
        "description": "Identity matrix with $n$ rows and columns.",
        "keywords": [
            "identity",
            "matrix"
        ],
        "calling_patterns": [
            "id(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "numrows",
        "description": "The number of rows in the given matrix",
        "keywords": [
            "number",
            "rows",
            "count",
            "matrix"
        ],
        "calling_patterns": [
            "numrows(matrix)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "numcolumns",
        "description": "The number of columns in the given matrix",
        "keywords": [
            "number",
            "columns",
            "count",
            "matrix"
        ],
        "calling_patterns": [
            "numcolumns(matrix)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "rowvector",
        "description": "Create a row vector ($1 \\times n$ matrix) with the given components.\nAlternately, you can create a row vector from a single list of numbers.",
        "keywords": [
            "vector",
            "transpose",
            "matrix"
        ],
        "calling_patterns": [
            "rowvector(a1,a2,...,aN)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "dot",
        "description": "Dot (scalar) product.\nInputs can be vectors or column matrices.",
        "keywords": [
            "scalar",
            "product",
            "inner",
            "vectors"
        ],
        "calling_patterns": [
            "dot(x,y)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "cross",
        "description": "Cross product.\nInputs can be vectors or column matrices.",
        "keywords": [
            "product",
            "matrix",
            "vectors"
        ],
        "calling_patterns": [
            "cross(x,y)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "angle",
        "description": "Angle between vectors <code>a</code> and <code>b</code>, in radians.\nReturns <code>0</code> if either <code>a</code> or <code>b</code> has length 0.",
        "keywords": [
            "between",
            "vectors"
        ],
        "calling_patterns": [
            "angle(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "is_zero",
        "description": "Returns <code>true</code> if every component of the vector <code>x</code> is zero.",
        "keywords": [
            "test",
            "zero",
            "vector"
        ],
        "calling_patterns": [
            "is_zero(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "is_scalar_multiple",
        "description": "Returns <code>true</code> if <code>u</code> is a scalar multiple of <code>v</code>.\nThat is, if <code>u = k*v</code> for some real number <code>k</code>.",
        "keywords": [
            "test",
            "scalar",
            "multiple",
            "vector"
        ],
        "calling_patterns": [
            "is_scalar_multiple(u,v,[rel_tol],[abs_tol])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "det",
        "description": "Determinant of a matrix.\nThrows an error if used on anything larger than a 3\u00d73 matrix.",
        "keywords": [
            "determinant",
            "matrix",
            "modulus"
        ],
        "calling_patterns": [
            "det(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "transpose",
        "description": "Matrix transpose.",
        "keywords": [
            "turn",
            "matrix"
        ],
        "calling_patterns": [
            "transpose(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sum_cells",
        "description": "Calculate the sum of all the cells in a matrix.",
        "keywords": [
            "cells",
            "add",
            "total"
        ],
        "calling_patterns": [
            "sum_cells(m)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "listval",
        "description": "Get the Nth character of the string <code>x</code>.\nIndices start at 0.",
        "keywords": [
            "index",
            "access",
            "list"
        ],
        "calling_patterns": [
            "x[n]"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "listval",
        "description": "Slice the string <code>x</code> - get the substring between the given indices.\nNote that indices start at 0, and the final index is not included.",
        "keywords": [
            "slice",
            "list"
        ],
        "calling_patterns": [
            "x[a..b]"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "in",
        "description": "Test if <code>substring</code> occurs anywhere in <code>string</code>.\nThis is case-sensitive.",
        "keywords": [
            "test",
            "contains",
            "string"
        ],
        "calling_patterns": [
            "substring in string"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "string",
        "description": "Convert <code>x</code> to a string.",
        "keywords": [
            "convert",
            "string",
            "write"
        ],
        "calling_patterns": [
            "string(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "latex",
        "description": "Mark string <code>x</code> as containing raw LaTeX, so when it's included in a mathmode environment it doesn't get wrapped in a <code>\\textrm</code> environment.",
        "keywords": [
            "convert",
            "string",
            "latex"
        ],
        "calling_patterns": [
            "latex(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "safe",
        "description": "Mark string <code>x</code> as safe: don't substitute variable values into it when this expression is evaluated.",
        "keywords": [
            "raw",
            "string"
        ],
        "calling_patterns": [
            "safe(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "render",
        "description": "Substitute variable values into the string <code>x</code>, even if it's marked as safe (see <code>safe</code>).",
        "keywords": [
            "template",
            "substitute",
            "string"
        ],
        "calling_patterns": [
            "render(x, values)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "capitalise",
        "description": "Capitalise the first letter of a string.",
        "keywords": [
            "upper",
            "case"
        ],
        "calling_patterns": [
            "capitalise(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "pluralise",
        "description": "Return <code>singular</code> if <code>n</code> is 1, otherwise return <code>plural</code>.",
        "keywords": [
            "singular",
            "plural"
        ],
        "calling_patterns": [
            "pluralise(n,singular,plural)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "upper",
        "description": "Convert string to upper-case.",
        "keywords": [
            "upper",
            "case",
            "capitalise",
            "convert"
        ],
        "calling_patterns": [
            "upper(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "lower",
        "description": "Convert string to lower-case.",
        "keywords": [
            "case",
            "convert"
        ],
        "calling_patterns": [
            "lower(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "join",
        "description": "Join a list of strings with the given delimiter.",
        "keywords": [
            "implode",
            "delimiter",
            "concatenate"
        ],
        "calling_patterns": [
            "join(strings, delimiter)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "split",
        "description": "Split a string at every occurrence of <code>delimiter</code>, returning a list of the the remaining pieces.",
        "keywords": [
            "explode",
            "delimiter"
        ],
        "calling_patterns": [
            "split(string,delimiter)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "match_regex",
        "description": "If <code>str</code> matches the regular expression <code>pattern</code>, returns a list of matched groups, otherwise returns an empty list.",
        "keywords": [
            "regular",
            "expression",
            "regexp",
            "test",
            "match"
        ],
        "calling_patterns": [
            "match_regex(pattern,str,flags)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "split_regex",
        "description": "Split a string at every occurrence of a substring matching the given regular expression pattern, returning a list of the the remaining pieces.",
        "keywords": [
            "explode",
            "regular",
            "expression",
            "regexp"
        ],
        "calling_patterns": [
            "split_regex(string,pattern,flags)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "replace_regex",
        "description": "Replace a substring of <code>string</code> matching the given regular expression <code>pattern</code> with the string <code>replacement</code>.",
        "keywords": [
            "substitute",
            "regular",
            "expression",
            "regexp"
        ],
        "calling_patterns": [
            "replace_regex(pattern,replacement,string,flags)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "trim",
        "description": "Remove whitespace from the start and end of <code>str</code>.",
        "keywords": [
            "whitespace",
            "remove",
            "strip"
        ],
        "calling_patterns": [
            "trim(str)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "currency",
        "description": "Write a currency amount, with the given prefix or suffix characters.",
        "keywords": [
            "money",
            "symbol",
            "pence",
            "pounds",
            "dollars",
            "cents"
        ],
        "calling_patterns": [
            "currency(n,prefix,suffix)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "separateThousands",
        "description": "Write a number, with the given separator character between every 3 digits",
        "keywords": [
            "commas",
            "thousands",
            "string"
        ],
        "calling_patterns": [
            "separateThousands(n,separator)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "unpercent",
        "description": "Get rid of the <code>%</code> on the end of a percentage and parse as a number, then divide by 100.",
        "keywords": [
            "percentage",
            "convert",
            "string"
        ],
        "calling_patterns": [
            "unpercent(str)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "lpad",
        "description": "Add copies of <code>prefix</code> to the start of <code>str</code> until the result is at least <code>n</code> characters long.",
        "keywords": [
            "pad",
            "left"
        ],
        "calling_patterns": [
            "lpad(str, n, prefix)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "rpad",
        "description": "Add copies of <code>suffix</code> to the end of <code>str</code> until the result is at least <code>n</code> characters long.",
        "keywords": [
            "pad",
            "right"
        ],
        "calling_patterns": [
            "rpad(str, n, suffix)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "formatstring",
        "description": "For each occurrence of <code>%s</code> in <code>str</code>, replace it with the corresponding entry in the list <code>values</code>.",
        "keywords": [
            "substitute",
            "string",
            "template"
        ],
        "calling_patterns": [
            "formatstring(str, values)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "letterordinal",
        "description": "Get the $n$th element of the sequence <code>a, b, c, ..., aa, ab, ...</code>.",
        "keywords": [
            "ordinal",
            "nth",
            "alphabetic",
            "lexicographic"
        ],
        "calling_patterns": [
            "letterordinal(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "translate",
        "description": "Translate the given string, if it's in the localisation file.",
        "keywords": [
            "localisation",
            "localization",
            "internationalisation",
            "internationalization",
            "i18n"
        ],
        "calling_patterns": [
            "translate(str, arguments)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isbool",
        "description": "After converting to lower case, is <code>str</code> any of the strings <code>\"true\"</code>, <code>\"false\"</code>, <code>\"yes\"</code> or <code>\"no\"</code>?",
        "keywords": [
            "test",
            "boolean",
            "true",
            "truthy",
            "false",
            "yes",
            "no"
        ],
        "calling_patterns": [
            "isbool(str)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "<",
        "description": "Returns <code>true</code> if <code>x</code> is less than <code>y</code>.",
        "keywords": [
            "less",
            "than",
            "comparison",
            "order",
            "compare",
            "smaller"
        ],
        "calling_patterns": [
            "x<y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": ">",
        "description": "Returns <code>true</code> if <code>x</code> is greater than <code>y</code>.",
        "keywords": [
            "greater",
            "than",
            "more",
            "comparison",
            "order",
            "compare",
            "bigger",
            "larger"
        ],
        "calling_patterns": [
            "x>y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "<=",
        "description": "Returns <code>true</code> if <code>x</code> is less than or equal to <code>y</code>.",
        "keywords": [
            "less",
            "than",
            "equals",
            "smaller",
            "comparison",
            "order"
        ],
        "calling_patterns": [
            "x<=y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": ">=",
        "description": "Returns <code>true</code> if <code>x</code> is greater than or equal to <code>y</code>.",
        "keywords": [
            "greater",
            "than",
            "more",
            "comparison",
            "order",
            "compare",
            "bigger",
            "larger",
            "equals"
        ],
        "calling_patterns": [
            "x>=y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "<>",
        "description": "Returns <code>true</code> if <code>x</code> is not equal to <code>y</code>.\nReturns <code>true</code> if <code>x</code> and <code>y</code> are not of the same data type.",
        "keywords": [
            "not",
            "equal",
            "inequality",
            "same"
        ],
        "calling_patterns": [
            "x<>y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "=",
        "description": "Returns <code>true</code> if <code>x</code> is equal to <code>y</code>.\nReturns <code>false</code> if <code>x</code> and <code>y</code> are not of the same data type.",
        "keywords": [
            "equal",
            "same",
            "equality"
        ],
        "calling_patterns": [
            "x=y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isclose",
        "description": "Returns <code>true</code> if <code>x</code> is close to <code>y</code>.",
        "keywords": [
            "close",
            "approximation",
            "test",
            "tolerance",
            "relative",
            "absolute",
            "equals",
            "same"
        ],
        "calling_patterns": [
            "isclose(x,y,[rel_tol],[abs_tol])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "resultsequal",
        "description": "Returns <code>true</code> if <code>a</code> and <code>b</code> are both of the same data type, and \"close enough\" according to the given checking function.",
        "keywords": [
            "same",
            "equal",
            "test",
            "tolerance",
            "expression"
        ],
        "calling_patterns": [
            "resultsequal(a,b,checkingFunction,accuracy)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "and",
        "description": "Logical AND.\nReturns <code>true</code> if both <code>x</code> and <code>y</code> are true, otherwise returns <code>false</code>.",
        "keywords": [
            "logical",
            "and",
            "intersection"
        ],
        "calling_patterns": [
            "x and y",
            "x && y",
            "x & y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "not",
        "description": "Logical NOT.",
        "keywords": [
            "logical",
            "not",
            "negation",
            "negate",
            "negative"
        ],
        "calling_patterns": [
            "not x"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "or",
        "description": "Logical OR.\nReturns <code>true</code> when at least one of <code>x</code> and <code>y</code> is true.\nReturns false when both <code>x</code> and <code>y</code> are false.",
        "keywords": [
            "logical",
            "or",
            "union"
        ],
        "calling_patterns": [
            "x or y",
            "x || y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "xor",
        "description": "Logical XOR.\nReturns <code>true</code> when at either <code>x</code> or <code>y</code> is true but not both.\nReturns <code>false</code> when <code>x</code> and <code>y</code> are the same expression.",
        "keywords": [
            "exclusive",
            "or",
            "logical"
        ],
        "calling_patterns": [
            "x xor y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "implies",
        "description": "Logical implication.\nIf <code>x</code> is true and <code>y</code> is false, then the implication is false.\nOtherwise, the implication is true.",
        "keywords": [
            "logical",
            "implication"
        ],
        "calling_patterns": [
            "x implies y"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "listval",
        "description": "Get the <code>y</code>th element of the collection <code>x</code>.",
        "keywords": [
            "index",
            "access",
            "element"
        ],
        "calling_patterns": [
            "x[y]"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "listval",
        "description": "Slice the collection <code>x</code> - return elements with indices in the given range.\nNote that list indices start at 0, and the final index is not included.",
        "keywords": [
            "slice",
            "access",
            "range",
            "subset"
        ],
        "calling_patterns": [
            "x[a..b]",
            "x[a..b#c]"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "in",
        "description": "Is element <code>x</code> in <code>collection</code>?",
        "keywords": [
            "test",
            "contains",
            "element",
            "inside"
        ],
        "calling_patterns": [
            "x in collection"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "..",
        "description": "Define a range.\nIncludes all integers between and including <code>a</code> and <code>b</code>.",
        "keywords": [
            "range",
            "interval"
        ],
        "calling_patterns": [
            "a .. b"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "#",
        "description": "Set the step size for a range.\nDefault is 1.\nWhen <code>step</code> is 0, the range includes all real numbers between the limits.",
        "keywords": [
            "step",
            "interval"
        ],
        "calling_patterns": [
            "range # step"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "except",
        "description": "Exclude a number, range, or list of items from a list or range.",
        "keywords": [
            "exclude",
            "without"
        ],
        "calling_patterns": [
            "a except b"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "repeat",
        "description": "Evaluate <code>expression</code> <code>n</code> times, and return the results in a list.",
        "keywords": [
            "times",
            "multiple"
        ],
        "calling_patterns": [
            "repeat(expression,n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "all",
        "description": "Returns <code>true</code> if every element of <code>list</code> is <code>true</code>.",
        "keywords": [
            "every",
            "test"
        ],
        "calling_patterns": [
            "all(list)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "some",
        "description": "Returns <code>true</code> if at least one element of <code>list</code> is <code>true</code>.",
        "keywords": [
            "any",
            "exists",
            "test"
        ],
        "calling_patterns": [
            "some(list)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "map",
        "description": "Evaluate <code>expression</code> for each item in list, range, vector or matrix <code>d</code>, replacing variable <code>name</code> with the element from <code>d</code> each time.",
        "keywords": [
            "transform",
            "functional",
            "loop"
        ],
        "calling_patterns": [
            "map(expression,name[s],d)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "filter",
        "description": "Filter each item in list or range <code>d</code>, replacing variable <code>name</code> with the element from <code>d</code> each time, returning only the elements for which <code>expression</code> evaluates to <code>true</code>.",
        "keywords": [
            "only",
            "require",
            "constraint",
            "test",
            "functional",
            "loop"
        ],
        "calling_patterns": [
            "filter(expression,name,d)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "foldl",
        "description": "Accumulate a value by iterating over a collection.\nThis can be used as an abstraction of routines such as \"sum of a list of numbers\", or \"maximum value in a list\".",
        "keywords": [
            "accumulate",
            "fold",
            "functional",
            "iterate",
            "loop"
        ],
        "calling_patterns": [
            "foldl(expression,accumulator_name, item_name, first_value, d)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "iterate",
        "description": "Iterate an expression on the given initial value the given number of times, returning a list containing the values produced at each step.",
        "keywords": [
            "repeat",
            "accumulate",
            "loop"
        ],
        "calling_patterns": [
            "iterate(expression,name,initial,times)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "iterate_until",
        "description": "Iterate an expression on the given initial value until the condition is satisfied, returning a list containing the values produced at each step.",
        "keywords": [
            "repeat",
            "accumulate",
            "loop",
            "until",
            "condition",
            "satisfy"
        ],
        "calling_patterns": [
            "iterate_until(expression,name,initial,condition,max_iterations)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "take",
        "description": "Take the first <code>n</code> elements from list or range <code>d</code>, replacing variable <code>name</code> with the element from <code>d</code> each time, returning only the elements for which <code>expression</code> evaluates to <code>true</code>.",
        "keywords": [
            "first",
            "loop",
            "filter",
            "restrict",
            "elements",
            "only"
        ],
        "calling_patterns": [
            "take(n,expression,name,d)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "flatten",
        "description": "\"Flatten\" a list of lists, returning a single list containing the concatenation of all the entries in <code>lists</code>.",
        "keywords": [
            "concatenate",
            "join",
            "lists"
        ],
        "calling_patterns": [
            "flatten(lists)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "let",
        "description": "Evaluate <code>expression</code>, temporarily defining variables with the given names.\nUse this to cut down on repetition.\nYou can define any number of variables - in the first calling pattern, follow a variable name with its definition.\nOr you can give a dictionary mapping variable names to their values.\nThe last argument is the expression to be evaluated.",
        "keywords": [
            "assign",
            "variable"
        ],
        "calling_patterns": [
            "let(name,definition,...,expression)",
            "let(definitions, expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sort",
        "description": "Sort list <code>x</code>.",
        "keywords": [
            "order",
            "arrange"
        ],
        "calling_patterns": [
            "sort(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sort_destinations",
        "description": "Return a list giving the index that each entry in the list will occupy after sorting.",
        "keywords": [
            "sort",
            "order",
            "arrange",
            "indices",
            "indexes"
        ],
        "calling_patterns": [
            "sort_destinations(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sort_by",
        "description": "Sort the given list of either <code>list</code> or <code>dict</code> values by their entries corresponding to the given key.\nWhen sorting a list of lists, the key is a number representing the index of each list to look at.\nWhen sorting a list of dictionaries, the key is a string.",
        "keywords": [
            "sory",
            "order",
            "arrange",
            "key"
        ],
        "calling_patterns": [
            "sort_by(key,list)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "group_by",
        "description": "Group the entries in the given list of either <code>list</code> or <code>dict</code> values by their entries corresponding to the given key.\nThe returned value is a list of lists of the form <code>[key, group]</code>, where <code>key</code> is the value all elements of the list <code>group</code> have in common.",
        "keywords": [
            "gather",
            "collect",
            "key",
            "lists"
        ],
        "calling_patterns": [
            "group_by(key,list)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "reverse",
        "description": "Reverse list <code>x</code>.",
        "keywords": [
            "backwards"
        ],
        "calling_patterns": [
            "reverse(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "indices",
        "description": "Find the indices at which <code>value</code> occurs in <code>list</code>.",
        "keywords": [
            "find",
            "indexes",
            "search"
        ],
        "calling_patterns": [
            "indices(list,value)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "distinct",
        "description": "Return a copy of the list <code>x</code> with duplicates removed.",
        "keywords": [
            "unique",
            "different"
        ],
        "calling_patterns": [
            "distinct(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "list",
        "description": "Convert a value to a list of its components (or rows, for a matrix).",
        "keywords": [
            "convert",
            "components",
            "elements"
        ],
        "calling_patterns": [
            "list(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "make_variables",
        "description": "Evaluate a dictionary of variable definitions and return a dictionary containing the generated values.",
        "keywords": [
            "evaluate",
            "variables",
            "assign"
        ],
        "calling_patterns": [
            "make_variables(definitions)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "satisfy",
        "description": "Each variable name in <code>names</code> should have a corresponding definition expression in <code>definitions</code>.\n<code>conditions</code> is a list of expressions which you want to evaluate to <code>true</code>.\nThe definitions will be evaluated repeatedly until all the conditions are satisfied, or the number of attempts is greater than <code>maxRuns</code>.\nIf <code>maxRuns</code> isn't given, it defaults to 100 attempts.",
        "keywords": [
            "test",
            "satisfies",
            "conditions"
        ],
        "calling_patterns": [
            "satisfy(names,definitions,conditions,maxRuns)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "sum",
        "description": "Add up a list of numbers",
        "keywords": [
            "total",
            "accumulate",
            "add"
        ],
        "calling_patterns": [
            "sum(numbers)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "prod",
        "description": "Multiply a list of numbers together",
        "keywords": [
            "product",
            "multiply",
            "accumulate"
        ],
        "calling_patterns": [
            "prod(list)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "product",
        "description": "Cartesian product of lists.\nIn other words, every possible combination of choices of one value from each given list.",
        "keywords": [
            "cartesian",
            "combinations",
            "power"
        ],
        "calling_patterns": [
            "product(list1,list2,...,listN)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "zip",
        "description": "Combine two (or more) lists into one - the Nth element of the output is a list containing the Nth elements of each of the input lists.",
        "keywords": [
            "combine",
            "tuples",
            "pairs"
        ],
        "calling_patterns": [
            "zip(list1,list2,...,listN)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "combinations",
        "description": "All ordered choices of <code>r</code> elements from <code>collection</code>, without replacement.",
        "keywords": [
            "ordered",
            "choices",
            "collection",
            "distinct",
            "unique"
        ],
        "calling_patterns": [
            "combinations(collection,r)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "combinations_with_replacement",
        "description": "All ordered choices of <code>r</code> elements from <code>collection</code>, with replacement.",
        "keywords": [
            "ordered",
            "choices",
            "replacement",
            "collection"
        ],
        "calling_patterns": [
            "combinations_with_replacement(collection,r)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "permutations",
        "description": "All choices of <code>r</code> elements from <code>collection</code>, in any order, without replacement.",
        "keywords": [
            "unordered",
            "choices",
            "collection"
        ],
        "calling_patterns": [
            "permutations(collection,r)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "frequencies",
        "description": "Count the number of times each distinct element of <code>collection</code> appears.",
        "keywords": [
            "count",
            "appearances"
        ],
        "calling_patterns": [
            "frequencies(collection)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "enumerate",
        "description": "Enumerate the elements of <code>collection</code>: this function returns a list containing, for each element <code>v</code> of <code>collection</code>, a new list of the form <code>[i,v]</code>, where <code>i</code> is the index of the element in <code>collection</code>.",
        "keywords": [
            "count"
        ],
        "calling_patterns": [
            "enumerate(collection)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "listval",
        "description": "Get the value corresponding to the given key string in the dictionary <code>d</code>.",
        "keywords": [
            "access",
            "item",
            "entry"
        ],
        "calling_patterns": [
            "dict[key]"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "get",
        "description": "Get the value corresponding to the given key string in the dictionary.",
        "keywords": [
            "access",
            "item",
            "entry"
        ],
        "calling_patterns": [
            "get(dict,key,default)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "dict",
        "description": "Create a dictionary with the given key-value pairs.\nEquivalent to <code>[ .. ]</code>, except when no key-value pairs are given: <code>[]</code> creates an empty <em>list</em> instead.",
        "keywords": [
            "dictionary",
            "convert",
            "key",
            "value",
            "structure"
        ],
        "calling_patterns": [
            "dict(a:b, c:d, ...)",
            "dict(pairs)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "keys",
        "description": "A list of all of the given dictionary's keys.",
        "keywords": [
            "entries",
            "dictionary"
        ],
        "calling_patterns": [
            "keys(dict)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "values",
        "description": "A list of the values corresponding to each of the given dictionary's keys.",
        "keywords": [
            "entires",
            "dictionary"
        ],
        "calling_patterns": [
            "values(dict,[keys])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "items",
        "description": "A list of all of the <code>[key,value]</code> pairs in the given dictionary.",
        "keywords": [
            "entries",
            "dictionary"
        ],
        "calling_patterns": [
            "items(dict)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "set",
        "description": "Create a set with the given elements.\nEither pass the elements as individual arguments, or as a list.",
        "keywords": [
            "distinct",
            "unique",
            "different"
        ],
        "calling_patterns": [
            "set(elements)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "union",
        "description": "Union of sets <code>a</code> and <code>b</code>",
        "keywords": [
            "join",
            "either",
            "or",
            "set"
        ],
        "calling_patterns": [
            "union(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "intersection",
        "description": "Intersection of sets <code>a</code> and <code>b</code>, i.e. elements which are in both sets.",
        "keywords": [
            "join",
            "both",
            "and"
        ],
        "calling_patterns": [
            "intersection(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "-",
        "description": "Set minus - elements which are in a but not b",
        "keywords": [
            "difference"
        ],
        "calling_patterns": [
            "a - b"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "random",
        "description": "Pick uniformly at random from a range, list, or from the given arguments.",
        "keywords": [
            "uniform"
        ],
        "calling_patterns": [
            "random(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "weighted_random",
        "description": "Pick random from a weighted list of items.\nEach element in the input list is a pair of the form <code>[item, probability]</code>, where <code>probability</code> is a <code>number</code> value.",
        "keywords": [
            "random"
        ],
        "calling_patterns": [
            "weighted_random(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "deal",
        "description": "Get a random shuffling of the integers $[0 \\dots n-1]$",
        "keywords": [
            "shuffle",
            "order",
            "random"
        ],
        "calling_patterns": [
            "deal(n)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "reorder",
        "description": "Reorder a list given a permutation.\nThe <code>i``th element of the output is the ``order[i]``th element of ``list</code>.",
        "keywords": [
            "arrange",
            "permutation",
            "permute",
            "order"
        ],
        "calling_patterns": [
            "reorder(list,order)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "shuffle",
        "description": "Random shuffling of list or range.",
        "keywords": [
            "random",
            "rearrange"
        ],
        "calling_patterns": [
            "shuffle(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "shuffle_together",
        "description": "Shuffle several lists together - each list has the same permutation of its elements applied.\nThe lists must all be the same length, otherwise an error is thrown.",
        "keywords": [
            "random",
            "rearrange"
        ],
        "calling_patterns": [
            "shuffle_together(lists)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "award",
        "description": "Return <code>a</code> if <code>b</code> is <code>true</code>, else return <code>0</code>.",
        "keywords": [
            "score",
            "test",
            "if",
            "condition"
        ],
        "calling_patterns": [
            "award(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "if",
        "description": "If <code>p</code> is <code>true</code>, return <code>a</code>, else return <code>b</code>.\nOnly the returned value is evaluated.",
        "keywords": [
            "test",
            "condition"
        ],
        "calling_patterns": [
            "if(p,a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "switch",
        "description": "Select cases.\nAlternating boolean expressions with values to return, with the final argument representing the default case.\nOnly the returned value is evaluated.",
        "keywords": [
            "cases",
            "select",
            "condition",
            "if",
            "test"
        ],
        "calling_patterns": [
            "switch(p1,a1,p2,a2, ..., pn,an,d)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "assert",
        "description": "If <code>condition</code> is <code>false</code>, then return <code>value</code>, otherwise don't evaluate <code>value</code> and return <code>false</code>.\nThis is intended for use in marking scripts, to apply marking feedback only if a condition is met.",
        "keywords": [
            "if",
            "test",
            "condition",
            "only"
        ],
        "calling_patterns": [
            "assert(condition, value)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "try",
        "description": "Try to evaluate <code>expression</code>.\nIf it is successfully evaluated, return the result.\nOtherwise, evaluate <code>except</code>, with the error message available as <code>name</code>.",
        "keywords": [
            "catch",
            "error",
            "except"
        ],
        "calling_patterns": [
            "try(expression, name, except)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "html",
        "description": "Parse string <code>x</code> as HTML.",
        "keywords": [
            "parse"
        ],
        "calling_patterns": [
            "html(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isnonemptyhtml",
        "description": "Does <code>str</code> represent a string of HTML containing text?\nReturns false for the empty string, or HTML elements with no text content.",
        "keywords": [
            "test",
            "empty",
            "text"
        ],
        "calling_patterns": [
            "isnonemptyhtml(str)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "table",
        "description": "Create an HTML with cell contents defined by <code>data</code>, which should be a list of lists of data, and column headers defined by the list of strings <code>headers</code>.",
        "keywords": [
            "grid",
            "data",
            "html"
        ],
        "calling_patterns": [
            "table(data)",
            "table(data,headers)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "image",
        "description": "Create an HTML <code>img</code> element loading the image from the given URL.\nImages uploaded through the resources tab are stored in the relative URL <code>resources/images/<filename>.png</code>, where <code><filename></code> is the name of the original file.",
        "keywords": [
            "picture",
            "display"
        ],
        "calling_patterns": [
            "image(url,[width],[height])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "max_width",
        "description": "Apply a CSS <code>max-width</code> attribute to the given element.\nYou can use this to ensure that an image is not displayed too wide.\nThe given <code>width</code> is in <code>em</code> units.",
        "keywords": [
            "width",
            "maximum",
            "size",
            "html"
        ],
        "calling_patterns": [
            "max_width(width,element)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "max_height",
        "description": "Apply a CSS <code>max-height</code> attribute to the given element.\nYou can use this to ensure that an image is not displayed too long.\nThe given <code>height</code> is in <code>em</code> units.",
        "keywords": [
            "height",
            "maximum",
            "size",
            "html"
        ],
        "calling_patterns": [
            "max_height(width,element)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "json_decode",
        "description": "Decode a JSON string into JME data types.",
        "keywords": [
            "decode",
            "parse"
        ],
        "calling_patterns": [
            "json_decode(json)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "json_encode",
        "description": "Convert the given object to a JSON string.",
        "keywords": [
            "convert",
            "stringify"
        ],
        "calling_patterns": [
            "json_encode(data)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "expression",
        "description": "Parse a string as a JME expression.\nThe expression can be substituted into other expressions, such as the answer to a mathematical expression part, or the <code>\\simplify</code> LaTeX command.",
        "keywords": [
            "parse",
            "jme",
            "compile"
        ],
        "calling_patterns": [
            "expression(string)",
            "parse(string)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "eval",
        "description": "Evaluate the given sub-expression.",
        "keywords": [
            "evaluate",
            "jme"
        ],
        "calling_patterns": [
            "eval(expression, values)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "args",
        "description": "Returns the arguments of the top-level operation of <code>expression</code>, as a list of sub-expressions.\nIf <code>expression</code> is a data type other than an operation or function, an empty list is returned.",
        "keywords": [
            "arguments",
            "operands"
        ],
        "calling_patterns": [
            "args(expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "type",
        "description": "Returns the name of the data type of the top token in the expression, as a string.",
        "keywords": [
            "kind"
        ],
        "calling_patterns": [
            "type(expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "name",
        "description": "Construct a <code>name</code> token with the given name.",
        "keywords": [
            "token"
        ],
        "calling_patterns": [
            "name(string)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "op",
        "description": "Construct an operator with the given name.",
        "keywords": [
            "operator",
            "operation",
            "token"
        ],
        "calling_patterns": [
            "op(name)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "function",
        "description": "Construct a function token with the given name.",
        "keywords": [
            "token"
        ],
        "calling_patterns": [
            "function(name)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "exec",
        "description": "Returns a sub-expression representing the application of the given operation to the list of arguments.",
        "keywords": [
            "execute",
            "apply",
            "call"
        ],
        "calling_patterns": [
            "exec(op, arguments)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "findvars",
        "description": "Return a list of all unbound variables used in the given expression.\nEffectively, this is all the variables that need to be given values in order for this expression to be evaluated.",
        "keywords": [
            "variables",
            "unbound",
            "free"
        ],
        "calling_patterns": [
            "findvars(expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "substitute",
        "description": "Substitute the given variable values into <code>expression</code>.",
        "keywords": [
            "replace",
            "variables",
            "rewrite"
        ],
        "calling_patterns": [
            "substitute(variables,expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "simplify",
        "description": "Apply the given simplification rules to <code>expression</code>, until no rules apply.",
        "keywords": [
            "rearrange",
            "rewrite",
            "transform"
        ],
        "calling_patterns": [
            "simplify(expression,rules)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "expand_juxtapositions",
        "description": "Expand juxtapositions in variable and function names for implicit multiplication of terms or composition of functions.\nThis is to do with strings of letters with no spaces or operator symbols between them.",
        "keywords": [
            "implicit",
            "multiplication",
            "grammar"
        ],
        "calling_patterns": [
            "expand_juxtapositions(expression, options)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "canonical_compare",
        "description": "Compare expressions <code>a</code> and <code>b</code> using the \"canonical\" ordering.\nReturns <code>-1</code> if <code>a</code> should go before <code>b</code>, <code>0</code> if they are considered \"equal\", and <code>1</code> if <code>a</code> should go after <code>b</code>.",
        "keywords": [
            "compare",
            "comparison",
            "order",
            "sort"
        ],
        "calling_patterns": [
            "canonical_compare(expr1,expr2)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "numerical_compare",
        "description": "Compare expression <code>a</code> and <code>b</code> by substituting random values in for the free variables.",
        "keywords": [
            "compare",
            "numerical",
            "evaluate",
            "same"
        ],
        "calling_patterns": [
            "numerical_compare(a,b)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "scope_case_sensitive",
        "description": "Set the evaluation scope to be case-sensitive or not, depending on the value of <code>case_sensitive</code>, and then evaluate <code>expression</code>.",
        "keywords": [
            "case",
            "sensitive",
            "upper",
            "lower"
        ],
        "calling_patterns": [
            "scope_case_sensitive(expression, [case_sensitive])"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "diff",
        "description": "Differentiate the given expression with respect to the given variable name",
        "keywords": [
            "differentiate",
            "calculus",
            "derivative"
        ],
        "calling_patterns": [
            "diff(expression,variable)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "match",
        "description": "If <code>expr</code> matches <code>pattern</code>, return a dictionary of the form <code>[\"match\": boolean, \"groups\": dict]</code>, where <code>\"groups\"</code> is a dictionary mapping names of matches to sub-expressions.",
        "keywords": [
            "test",
            "pattern",
            "expression"
        ],
        "calling_patterns": [
            "match(expr, pattern, options)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "matches",
        "description": "Return <code>true</code> if <code>expr</code> matches <code>pattern</code>.",
        "keywords": [
            "test",
            "pattern",
            "expression"
        ],
        "calling_patterns": [
            "matches(expr, pattern, options)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "replace",
        "description": "Replace occurrences of <code>pattern</code> in <code>expr</code> with the expression created by substituting the matched items into <code>replacement</code>.",
        "keywords": [
            "substitute",
            "pattern",
            "expression"
        ],
        "calling_patterns": [
            "replace(pattern, replacement, expr)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "type",
        "description": "Returns the name of the data type of <code>x</code>.",
        "keywords": [
            "kind"
        ],
        "calling_patterns": [
            "type(x)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isa",
        "description": "Returns <code>true</code> if <code>x</code> is of the data type <code>type</code>.",
        "keywords": [
            "is",
            "test",
            "same",
            "type"
        ],
        "calling_patterns": [
            "x isa type"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "as",
        "description": "Convert <code>x</code> to the given data type, if possible.",
        "keywords": [
            "convert",
            "cast",
            "type"
        ],
        "calling_patterns": [
            "x as type"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "infer_variable_types",
        "description": "Attempt to infer the types of free variables in the given expression.",
        "keywords": [
            "variable",
            "type"
        ],
        "calling_patterns": [
            "infer_variable_types(expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "infer_type",
        "description": "Attempt to infer the type of the value produced by the given expression, which may contain free variables.",
        "keywords": [
            "result",
            "type"
        ],
        "calling_patterns": [
            "infer_type(expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "definedvariables",
        "description": "Returns a list containing the names of every variable defined in the current scope, as strings.",
        "keywords": [
            "variables",
            "list",
            "scope"
        ],
        "calling_patterns": [
            "definedvariables()"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "isset",
        "description": "Returns <code>true</code> if the variable with the given name has been defined in the current scope.",
        "keywords": [
            "variable",
            "set",
            "test"
        ],
        "calling_patterns": [
            "isset(name)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "unset",
        "description": "Temporarily remove the named variables, functions and rulesets from the scope, and evaluate the given expression.",
        "keywords": [
            "delete",
            "remove",
            "variables"
        ],
        "calling_patterns": [
            "unset(names, expression)"
        ],
        "doc": "jme-reference"
    },
    {
        "name": "`+-",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "either",
            "or",
            "plus",
            "minus"
        ],
        "calling_patterns": [
            "`+- X"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`*/",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "either",
            "or",
            "times",
            "divide",
            "multiply"
        ],
        "calling_patterns": [
            "`*/ X"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`|",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "either",
            "or"
        ],
        "calling_patterns": [
            "A `| B"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`&",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "and",
            "both"
        ],
        "calling_patterns": [
            "A `& B"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`!",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "not",
            "except",
            "negate"
        ],
        "calling_patterns": [
            "`! X"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`where",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "condition",
            "where",
            "match"
        ],
        "calling_patterns": [
            "X `where C"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`@",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "substitute"
        ],
        "calling_patterns": [
            "macros `@ X"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": ";",
        "description": "Capture the input expression in the group named <code>g</code> if it matches the pattern <code>X</code>.",
        "keywords": [
            "capture",
            "name",
            "group"
        ],
        "calling_patterns": [
            "X;g"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": ":",
        "description": "Match <code>X</code>, and capture the value <code>v</code> in the group named <code>g</code>.",
        "keywords": [
            "capture",
            "name",
            "group",
            "default"
        ],
        "calling_patterns": [
            "X;g:v"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": ";=",
        "description": "Match <code>X</code> only if it's identical to every other occurrence captured under the name <code>g</code>.",
        "keywords": [
            "capture",
            "name",
            "group",
            "same",
            "identical",
            "equal",
            "equivalent"
        ],
        "calling_patterns": [
            "X;=g"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`?",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "one",
            "none",
            "quantifier",
            "optional"
        ],
        "calling_patterns": [
            "X `?"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`:",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "quantifier",
            "default",
            "optional"
        ],
        "calling_patterns": [
            "X `: Y"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`*",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "optional",
            "some",
            "any",
            "all",
            "quantifier",
            "several"
        ],
        "calling_patterns": [
            "X `*"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "`+",
        "description": "Inline interpreted text or phrase reference start-string without end-string.",
        "keywords": [
            "some",
            "all",
            "many",
            "several",
            "quantifier"
        ],
        "calling_patterns": [
            "X `+"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_exactly",
        "description": "Turn off :term:`allow other terms` mode when matching <code>X</code>.",
        "keywords": [
            "others",
            "terms",
            "only"
        ],
        "calling_patterns": [
            "m_exactly(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_commutative",
        "description": "Turn on :term:`use commutativity` mode when matching <code>X</code>.",
        "keywords": [
            "order"
        ],
        "calling_patterns": [
            "m_commutative(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_noncommutative",
        "description": "Turn off :term:`use commutativity` mode when matching <code>X</code>.",
        "keywords": [
            "commutative",
            "order"
        ],
        "calling_patterns": [
            "m_noncommutative(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_associative",
        "description": "Turn on :term:`use associativity` mode when matching <code>X</code>.",
        "keywords": [
            "order",
            "bracket",
            "parentheses"
        ],
        "calling_patterns": [
            "m_associative(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_nonassociative",
        "description": "Turn off :term:`use associativity` mode when matching <code>X</code>.",
        "keywords": [
            "order",
            "bracket",
            "associativity",
            "parentheses"
        ],
        "calling_patterns": [
            "m_nonassociative(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_strictinverse",
        "description": "Turn on :term:`strict inverse` mode when matching <code>X</code>.",
        "keywords": [
            "inverse",
            "unary",
            "plus",
            "minus"
        ],
        "calling_patterns": [
            "m_strictinverse(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_gather",
        "description": "Turn on :term:`gather as a list` mode when matching <code>X</code>.",
        "keywords": [
            "list"
        ],
        "calling_patterns": [
            "m_gather(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_nogather",
        "description": "Turn off :term:`gather as a list` mode when matching <code>X</code>.",
        "keywords": [
            "list"
        ],
        "calling_patterns": [
            "m_nogather(X)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_type",
        "description": "Match any item with the given data type.",
        "keywords": [
            "condition",
            "type"
        ],
        "calling_patterns": [
            "m_type(type)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_func",
        "description": "Match a function whose name, as a string, matches the given pattern, and whose arguments, considered as a <code>list</code>, match the given pattern.",
        "keywords": [
            "condition",
            "function"
        ],
        "calling_patterns": [
            "m_func(name,arguments)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_op",
        "description": "Match a binary or unary operator whose name, as a string, matches the given pattern, and whose operands, considered as a <code>list</code>, match the given pattern.",
        "keywords": [
            "condition",
            "operator"
        ],
        "calling_patterns": [
            "m_op(name,operands)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_uses",
        "description": "Match if the expression uses the variable with the given name as a free variable.",
        "keywords": [
            "condition",
            "variable",
            "has",
            "uses"
        ],
        "calling_patterns": [
            "m_uses(name)"
        ],
        "doc": "pattern-matching/reference"
    },
    {
        "name": "m_anywhere",
        "description": "Match if a sub-expression matching the pattern <code>X</code> can be found anywhere inside the input expression.",
        "keywords": [
            "condition",
            "anywhere",
            "recursive",
            "deep"
        ],
        "calling_patterns": [
            "m_anywhere(X)"
        ],
        "doc": "pattern-matching/reference"
    }
]
;
