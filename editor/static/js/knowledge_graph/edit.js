var viewModel;

$(document).ready(function() {

    function KnowledgeGraph() {
        var kg = this;
        this.topics = ko.observableArray([]);
        this.learning_objectives = ko.observableArray([]);
        this.current_topic = ko.observable(null);
        this.current_learning_objective = ko.observable(null);

        this.add_topic = function() {
            var t = new Topic(kg);
            kg.topics.push(t);
            kg.current_topic(t);
            return t;
        }

        this.remove_topic = function(t) {
            kg.topics.remove(t);
        }

        this.add_learning_objective = function() {
            var lo = new LearningObjective(kg);
            kg.learning_objectives.push(lo);
            kg.current_learning_objective(lo);
            return lo;
        }

        this.remove_learning_objective = function(lo) {
            kg.learning_objectives.remove(lo);
        }

        ko.computed(function() {
            this.topics().forEach(function(t) {
                t.leads_to([]);
            });

            this.topics().forEach(function(t) {
                t.depends_on().forEach(function(t2) {
                    t2.leads_to.push(t);
                });
            });
        },this);
    }

    function autocomplete_source(obj,from,to) {
        return function(s,callback) {
            var result = ko.unwrap(from).filter(function(o2) {
                if(o2 == obj || ko.unwrap(to).contains(o2)) {
                    return false;
                }
                return o2.name().toLowerCase().indexOf(s.term.toLowerCase())>=0;
            }).map(function(o2) { return { label: o2.name(), value: o2 } })
            callback(result);
        }
    }

    function Topic(graph,name) {
        var t = this;
        this.graph = graph;
        this.name = ko.observable(name || '');
        this.label = ko.computed(function() {
            return this.name().trim() || 'Unnamed topic';
        },this);
        this.depends_on = ko.observableArray([]);
        this.leads_to = ko.observableArray([]);
        this.learning_objectives = ko.observableArray([]);

        this.dependency_autocomplete = autocomplete_source(this, graph.topics, this.depends_on);

        this.leads_to_autocomplete = autocomplete_source(this, graph.topics, this.leads_to);

        this.add_dependency = function(t2) {
            t.depends_on.push(t2);
        }
        this.remove_dependency = function(t2) {
            t.depends_on.remove(t2);
        }

        this.add_leads_to = function(t2) {
            t2.depends_on.push(t);
        }
        this.remove_leads_to = function(t2) {
            t2.depends_on.remove(t);
        }

        this.learning_objective_autocomplete = autocomplete_source(this, graph.learning_objectives, this.learning_objectives);
        this.add_learning_objective = function(lo) {
            t.learning_objectives.push(lo);
        }
        this.remove_learning_objective = function(lo) {
            t.learning_objectives.remove(lo);
        }
    }

    function LearningObjective(graph,name) {
        this.graph = graph;
        this.name = ko.observable(name || '');
    }

    var diagnosys = {
      "topics": [
        {
          "learning_objectives": [],
          "depends_on": [],
          "leads_to": [],
          "name": "501",
          "questions": [
            "Matrix question"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "102, Multiply negative and positive"
          ],
          "leads_to": [],
          "name": "101, Multiplication of negative numbers",
          "questions": [
            "Multiplication of negative numbers"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "103, Negative Numbers"
          ],
          "leads_to": [
            "101, Multiplication of negative numbers"
          ],
          "name": "102, Multiply negative and positive",
          "questions": [
            "Multiplying a negative and a positive number"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [],
          "leads_to": [
            "102, Multiply negative and positive",
            "201, Use of < and > signs"
          ],
          "name": "103, Negative Numbers",
          "questions": [
            "Negative numbers"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [],
          "leads_to": [
            "201, Use of < and > signs"
          ],
          "name": "104, Size of decimals",
          "questions": [
            "Size of decimals"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "108, Factors of an integer"
          ],
          "leads_to": [
            "205, Inverse ratios",
            "206, Cancelling numerical fractions"
          ],
          "name": "107, Ratios",
          "questions": [
            "Ratios"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [],
          "leads_to": [
            "107, Ratios",
            "206, Cancelling numerical fractions",
            "208, Factors of algebraic products"
          ],
          "name": "108, Factors of an integer",
          "questions": [
            "Factors of Integers"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [],
          "leads_to": [
            "216, Add/subtract numerical fractions"
          ],
          "name": "109, Simple fractions",
          "questions": [
            "Simple fractions"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "103, Negative Numbers",
            "104, Size of decimals"
          ],
          "leads_to": [
            "301, Solution of simple inequalities"
          ],
          "name": "201, Use of < and > signs",
          "questions": [
            "Use of < > signs"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "107, Ratios"
          ],
          "leads_to": [],
          "name": "205, Inverse ratios",
          "questions": [
            "Inverse ratios"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "107, Ratios",
            "108, Factors of an integer"
          ],
          "leads_to": [
            "207, Multiply algebraic fractions",
            "216, Add/subtract numerical fractions",
            "303, Simplification of fractions with powers"
          ],
          "name": "206, Cancelling numerical fractions",
          "questions": [
            "Cancelling Numerical Fractions"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "109, Simple fractions",
            "206, Cancelling numerical fractions"
          ],
          "leads_to": [
            "308, Add/subtract algebraic fractions"
          ],
          "name": "216, Add/subtract numerical fractions",
          "questions": [
            "Addition + Subtraction of Fractions"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "201, Use of < and > signs"
          ],
          "leads_to": [],
          "name": "301, Solution of simple inequalities",
          "questions": [
            "Solve simple inequalities"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [],
          "leads_to": [
            "202, Significant figures"
          ],
          "name": "105, Decimal places",
          "questions": [
            "Decimal places"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [],
          "leads_to": [
            "203, Definition of negative powers",
            "204, Rules for positive powers"
          ],
          "name": "106, Definition of positive powers",
          "questions": [
            "Definition of positive powers"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "105, Decimal places"
          ],
          "leads_to": [
            "302, Scientific Notation"
          ],
          "name": "202, Significant figures",
          "questions": [
            "Significant figures"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "106, Definition of positive powers"
          ],
          "leads_to": [
            "302, Scientific Notation",
            "304, Rules for negative powers",
            "306, Definition of fractional powers"
          ],
          "name": "203, Definition of negative powers",
          "questions": [
            "Definition of negative powers"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "106, Definition of positive powers"
          ],
          "leads_to": [
            "304, Rules for negative powers"
          ],
          "name": "204, Rules for positive powers",
          "questions": [
            "Rules for positive powers"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "202, Significant figures",
            "203, Definition of negative powers"
          ],
          "leads_to": [
            "401, Simplify with scientific notation"
          ],
          "name": "302, Scientific Notation",
          "questions": [
            "Scientific notation"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "206, Cancelling numerical fractions",
            "304, Rules for negative powers"
          ],
          "leads_to": [
            "401, Simplify with scientific notation"
          ],
          "name": "303, Simplification of fractions with powers",
          "questions": [
            "Simplify fractions and powers"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "203, Definition of negative powers",
            "204, Rules for positive powers"
          ],
          "leads_to": [
            "303, Simplification of fractions with powers",
            "305, Rules for fractional powers",
            "402, Logs",
            "403, Arbitrary factors"
          ],
          "name": "304, Rules for negative powers",
          "questions": [
            "Rules for negative Powers"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "304, Rules for negative powers",
            "306, Definition of fractional powers"
          ],
          "leads_to": [],
          "name": "305, Rules for fractional powers",
          "questions": [
            "Rules for fractional powers"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "203, Definition of negative powers"
          ],
          "leads_to": [
            "305, Rules for fractional powers"
          ],
          "name": "306, Definition of fractional powers",
          "questions": [
            "Definition of Fractional Powers"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "302, Scientific Notation",
            "303, Simplification of fractions with powers"
          ],
          "leads_to": [],
          "name": "401, Simplify with scientific notation",
          "questions": [
            "Simplify + Scientific notation"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "304, Rules for negative powers"
          ],
          "leads_to": [],
          "name": "402, Logs",
          "questions": [
            "Logarithms"
          ]
        },
        {
          "learning_objectives": [
            "powers"
          ],
          "depends_on": [
            "304, Rules for negative powers"
          ],
          "leads_to": [],
          "name": "403, Arbitrary factors",
          "questions": [
            "Arbitrary Factors"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [],
          "leads_to": [
            "211, Collecting terms",
            "312, Expanding two brackets",
            "317, Complex numbers"
          ],
          "name": "110, Collect terms (simple)",
          "questions": [
            "Collect terms (simple)"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [],
          "leads_to": [
            "212, Solving linear equations"
          ],
          "name": "111, Solving a simple equation",
          "questions": [
            "Solving a simple equation"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [],
          "leads_to": [
            "210, Expanding one bracket",
            "214, Evaluating formula",
            "215, Precedence Rules"
          ],
          "name": "112, Simple calculation",
          "questions": [
            "Simple calculation"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [],
          "leads_to": [
            "214, Evaluating formula"
          ],
          "name": "113, Evaluating a simple expression",
          "questions": [
            "Evaluating a simple expression"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "206, Cancelling numerical fractions"
          ],
          "leads_to": [
            "307, Division of algebraic fractions"
          ],
          "name": "207, Multiply algebraic fractions",
          "questions": [
            "Multiplication of Fractions"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "108, Factors of an integer"
          ],
          "leads_to": [
            "209, Simple Factorisation"
          ],
          "name": "208, Factors of algebraic products",
          "questions": [
            "Factors of Algebraic Products"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "208, Factors of algebraic products",
            "210, Expanding one bracket"
          ],
          "leads_to": [
            "309, Simple Quadratic equations",
            "311, Factorising a quadratic",
            "412, Difficult linear equation"
          ],
          "name": "209, Simple Factorisation",
          "questions": [
            "Simple Factorisation"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "112, Simple calculation"
          ],
          "leads_to": [
            "209, Simple Factorisation",
            "312, Expanding two brackets"
          ],
          "name": "210, Expanding one bracket",
          "questions": [
            "Expand one bracket"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "110, Collect terms (simple)"
          ],
          "leads_to": [],
          "name": "211, Collecting terms",
          "questions": [
            "Collect Terms"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "111, Solving a simple equation"
          ],
          "leads_to": [
            "309, Simple Quadratic equations",
            "310, Relation between roots and factors",
            "314, Simultaneous Equations",
            "315, Unusual linear equation"
          ],
          "name": "212, Solving linear equations",
          "questions": [
            "Linear Equations"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [],
          "leads_to": [
            "315, Unusual linear equation"
          ],
          "name": "213, Transposition of formula",
          "questions": [
            "Transposition of formulae"
          ]
        },
        {
          "learning_objectives": [
            "basic algebra"
          ],
          "depends_on": [
            "112, Simple calculation",
            "113, Evaluating a simple expression"
          ],
          "leads_to": [
            "316, Use of quadratic formula",
            "410, Substituting into a formula"
          ],
          "name": "214, Evaluating formula",
          "questions": [
            "Evaluation of Formulae"
          ]
        },
        {
          "learning_objectives": [
            "numbers"
          ],
          "depends_on": [
            "112, Simple calculation"
          ],
          "leads_to": [],
          "name": "215, Precedence Rules",
          "questions": [
            "Order of Operations"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "207, Multiply algebraic fractions"
          ],
          "leads_to": [],
          "name": "307, Division of algebraic fractions",
          "questions": [
            "Division of Fractions"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "216, Add/subtract numerical fractions"
          ],
          "leads_to": [
            "404, L.c.d. of an algebraic fraction",
            "405, Identification of common errors"
          ],
          "name": "308, Add/subtract algebraic fractions",
          "questions": [
            "Addition/Subtraction of Algebraic Fractions"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "209, Simple Factorisation",
            "212, Solving linear equations"
          ],
          "leads_to": [],
          "name": "309, Simple Quadratic equations",
          "questions": [
            "Simple Quadratic Equations"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "212, Solving linear equations",
            "311, Factorising a quadratic"
          ],
          "leads_to": [],
          "name": "310, Relation between roots and factors",
          "questions": [
            "Relationship of Roots and Factors"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "209, Simple Factorisation",
            "312, Expanding two brackets"
          ],
          "leads_to": [
            "310, Relation between roots and factors",
            "407, Quadratics - completing the square"
          ],
          "name": "311, Factorising a quadratic",
          "questions": [
            "Factorising a Quadratic Function"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "110, Collect terms (simple)",
            "210, Expanding one bracket"
          ],
          "leads_to": [
            "311, Factorising a quadratic",
            "313, Difference of squares",
            "405, Identification of common errors",
            "408, Multiplication of complex numbers",
            "410, Substituting into a formula"
          ],
          "name": "312, Expanding two brackets",
          "questions": [
            "Expanding Two Brackets"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "312, Expanding two brackets"
          ],
          "leads_to": [],
          "name": "313, Difference of squares",
          "questions": [
            "Difference of squares"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "212, Solving linear equations"
          ],
          "leads_to": [],
          "name": "314, Simultaneous Equations",
          "questions": [
            "Simultaneous Equations"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "212, Solving linear equations",
            "213, Transposition of formula"
          ],
          "leads_to": [
            "412, Difficult linear equation"
          ],
          "name": "315, Unusual linear equation",
          "questions": [
            "Unusual Linear Equation"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "214, Evaluating formula"
          ],
          "leads_to": [
            "411, Solutions of a quadratic"
          ],
          "name": "316, Use of quadratic formula",
          "questions": [
            "Formula for Quadratic Equation"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "110, Collect terms (simple)"
          ],
          "leads_to": [
            "408, Multiplication of complex numbers"
          ],
          "name": "317, Complex numbers",
          "questions": [
            "Complex numbers"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "308, Add/subtract algebraic fractions"
          ],
          "leads_to": [],
          "name": "404, L.c.d. of an algebraic fraction",
          "questions": [
            "Lowest Common Denominator"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "308, Add/subtract algebraic fractions",
            "312, Expanding two brackets"
          ],
          "leads_to": [],
          "name": "405, Identification of common errors",
          "questions": [
            "Common Errors"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "407, Quadratics - completing the square"
          ],
          "leads_to": [],
          "name": "406, Solve quad. by comp. the square",
          "questions": [
            "Solution of quadratic by c.t.s."
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "311, Factorising a quadratic"
          ],
          "leads_to": [
            "406, Solve quad. by comp. the square"
          ],
          "name": "407, Quadratics - completing the square",
          "questions": [
            "Completing the square"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "312, Expanding two brackets",
            "317, Complex numbers"
          ],
          "leads_to": [],
          "name": "408, Multiplication of complex numbers",
          "questions": [
            "Multiplying complex numbers"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "411, Solutions of a quadratic"
          ],
          "leads_to": [],
          "name": "409, Divide by zero (possible solution)",
          "questions": [
            "Existence of solutions"
          ]
        },
        {
          "learning_objectives": [
            "algebra methods"
          ],
          "depends_on": [
            "214, Evaluating formula",
            "312, Expanding two brackets"
          ],
          "leads_to": [],
          "name": "410, Substituting into a formula",
          "questions": [
            "Substituting into a formula"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "316, Use of quadratic formula"
          ],
          "leads_to": [
            "409, Divide by zero (possible solution)"
          ],
          "name": "411, Solutions of a quadratic",
          "questions": [
            "Solutions to a quadratic equation"
          ]
        },
        {
          "learning_objectives": [
            "equations"
          ],
          "depends_on": [
            "209, Simple Factorisation",
            "315, Unusual linear equation"
          ],
          "leads_to": [],
          "name": "412, Difficult linear equation",
          "questions": [
            "Difficult Linear Equation"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [],
          "leads_to": [
            "342, Finding Max/Min of a quadratic",
            "441, Product rule",
            "442, Integration of powers"
          ],
          "name": "341, Differentiation of powers",
          "questions": [
            "Differentiate powers"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "341, Differentiation of powers"
          ],
          "leads_to": [],
          "name": "342, Finding Max/Min of a quadratic",
          "questions": [
            "Max/Min of quadratics"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [],
          "leads_to": [],
          "name": "343, Geometric Progression",
          "questions": [
            "Geometric progression"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "341, Differentiation of powers"
          ],
          "leads_to": [],
          "name": "441, Product rule",
          "questions": [
            "Product rule"
          ]
        },
        {
          "learning_objectives": [
            "algebra+calculus"
          ],
          "depends_on": [
            "341, Differentiation of powers"
          ],
          "leads_to": [],
          "name": "442, Integration of powers",
          "questions": [
            "Integrate powers"
          ]
        },
        {
          "learning_objectives": [
            "graphs"
          ],
          "depends_on": [],
          "leads_to": [
            "251, Gradient of a straight line"
          ],
          "name": "151, Coordinates",
          "questions": [
            "Coordinates"
          ]
        },
        {
          "learning_objectives": [
            "graphs"
          ],
          "depends_on": [
            "151, Coordinates"
          ],
          "leads_to": [
            "351, Equation of a straight line"
          ],
          "name": "251, Gradient of a straight line",
          "questions": [
            "Gradient of straight line"
          ]
        },
        {
          "learning_objectives": [
            "graphs"
          ],
          "depends_on": [
            "251, Gradient of a straight line"
          ],
          "leads_to": [
            "451, Recognise formula of quad. graph",
            "452, Recognise formula of recip. graph"
          ],
          "name": "351, Equation of a straight line",
          "questions": [
            "Equation of a straight line"
          ]
        },
        {
          "learning_objectives": [
            "graphs"
          ],
          "depends_on": [
            "351, Equation of a straight line"
          ],
          "leads_to": [],
          "name": "451, Recognise formula of quad. graph",
          "questions": [
            "Quadratic Graphs"
          ]
        },
        {
          "learning_objectives": [
            "graphs"
          ],
          "depends_on": [
            "351, Equation of a straight line"
          ],
          "leads_to": [],
          "name": "452, Recognise formula of recip. graph",
          "questions": [
            "Reciprocal Graphs"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [],
          "leads_to": [
            "321, Equation of a circle",
            "322, Sin and Cos formula"
          ],
          "name": "221, Pythagoras",
          "questions": [
            "Pythagoras Theorem"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [],
          "leads_to": [
            "322, Sin and Cos formula",
            "422, Sin and Cos as functions"
          ],
          "name": "222, Definition of sin and cos",
          "questions": [
            "Sine and Cosine"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [],
          "leads_to": [
            "324, Percentages (advanced)"
          ],
          "name": "223, Percentages",
          "questions": [
            "Percentages"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [
            "221, Pythagoras"
          ],
          "leads_to": [
            "421, Deduce radius of circle"
          ],
          "name": "321, Equation of a circle",
          "questions": [
            "Equation of a circle"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [
            "221, Pythagoras",
            "222, Definition of sin and cos"
          ],
          "leads_to": [],
          "name": "322, Sin and Cos formula",
          "questions": [
            "Sine/Cosine Relationships"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [],
          "leads_to": [],
          "name": "323, Definition of radians",
          "questions": [
            "Radians"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [
            "223, Percentages"
          ],
          "leads_to": [],
          "name": "324, Percentages (advanced)",
          "questions": [
            "Percentages (advanced)"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [
            "321, Equation of a circle"
          ],
          "leads_to": [],
          "name": "421, Deduce radius of circle",
          "questions": [
            "Radius of a circle"
          ]
        },
        {
          "learning_objectives": [
            "miscellaneous"
          ],
          "depends_on": [
            "222, Definition of sin and cos"
          ],
          "leads_to": [],
          "name": "422, Sin and Cos as functions",
          "questions": [
            "Sine and Cosine Functions"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [],
          "leads_to": [
            "261, Area of trapezium",
            "262, Area and circumference of a circle"
          ],
          "name": "161, Area of a triangle",
          "questions": [
            "Area of Triangle"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "161, Area of a triangle"
          ],
          "leads_to": [
            "363, Area of irregular shapes"
          ],
          "name": "261, Area of trapezium",
          "questions": [
            "Area of Trapezium"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "161, Area of a triangle"
          ],
          "leads_to": [
            "361, Volume of cylinder"
          ],
          "name": "262, Area and circumference of a circle",
          "questions": [
            "Area and Circumference of a circle"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [],
          "leads_to": [
            "362, Area/Length relationship"
          ],
          "name": "263, Similar triangles",
          "questions": [
            "Similar triangles"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "262, Area and circumference of a circle"
          ],
          "leads_to": [
            "461, Surface area of a cylinder"
          ],
          "name": "361, Volume of cylinder",
          "questions": [
            "Volume of cylinder"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "263, Similar triangles"
          ],
          "leads_to": [
            "462, Volume Area Length relationships"
          ],
          "name": "362, Area/Length relationship",
          "questions": [
            "Area/Length relationship"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "261, Area of trapezium"
          ],
          "leads_to": [],
          "name": "363, Area of irregular shapes",
          "questions": [
            "Area of irregular shapes"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "361, Volume of cylinder"
          ],
          "leads_to": [],
          "name": "461, Surface area of a cylinder",
          "questions": [
            "Surface area of cylinder"
          ]
        },
        {
          "learning_objectives": [
            "area+volume"
          ],
          "depends_on": [
            "362, Area/Length relationship"
          ],
          "leads_to": [],
          "name": "462, Volume Area Length relationships",
          "questions": [
            "Volume Area Length relations"
          ]
        },
        {
          "learning_objectives": [
            "statistics"
          ],
          "depends_on": [],
          "leads_to": [],
          "name": "231, Range of a set of numbers",
          "questions": [
            "Range"
          ]
        },
        {
          "learning_objectives": [
            "statistics"
          ],
          "depends_on": [],
          "leads_to": [],
          "name": "232, Mean of a set of numbers",
          "questions": [
            "Mean - discrete"
          ]
        },
        {
          "learning_objectives": [
            "statistics"
          ],
          "depends_on": [],
          "leads_to": [
            "334, Conditional probability"
          ],
          "name": "233, Simple probability (coins)",
          "questions": [
            "Probability-coins"
          ]
        },
        {
          "learning_objectives": [
            "statistics"
          ],
          "depends_on": [
            "233, Simple probability (coins)"
          ],
          "leads_to": [],
          "name": "334, Conditional probability",
          "questions": [
            "Conditional Probability"
          ]
        },
        {
          "learning_objectives": [
            "statistics"
          ],
          "depends_on": [],
          "leads_to": [
            "335, Venn Diagrams (conditional prob.)"
          ],
          "name": "234, Venn Diagrams (probability)",
          "questions": [
            "Probability - Venn Diagrams"
          ]
        },
        {
          "learning_objectives": [
            "statistics"
          ],
          "depends_on": [
            "234, Venn Diagrams (probability)"
          ],
          "leads_to": [],
          "name": "335, Venn Diagrams (conditional prob.)",
          "questions": [
            "Conditional Probability - Venn Diagrams"
          ]
        }
      ],
      "learning_objectives": [
        {
          "name": "numbers",
          "topics": [
            "101, Multiplication of negative numbers",
            "102, Multiply negative and positive",
            "103, Negative Numbers",
            "104, Size of decimals",
            "107, Ratios",
            "108, Factors of an integer",
            "109, Simple fractions",
            "201, Use of < and > signs",
            "205, Inverse ratios",
            "206, Cancelling numerical fractions",
            "216, Add/subtract numerical fractions",
            "301, Solution of simple inequalities",
            "105, Decimal places",
            "202, Significant figures",
            "302, Scientific Notation",
            "112, Simple calculation",
            "215, Precedence Rules"
          ]
        },
        {
          "name": "powers",
          "topics": [
            "106, Definition of positive powers",
            "203, Definition of negative powers",
            "204, Rules for positive powers",
            "303, Simplification of fractions with powers",
            "304, Rules for negative powers",
            "305, Rules for fractional powers",
            "306, Definition of fractional powers",
            "401, Simplify with scientific notation",
            "402, Logs",
            "403, Arbitrary factors"
          ]
        },
        {
          "name": "basic algebra",
          "topics": [
            "110, Collect terms (simple)",
            "111, Solving a simple equation",
            "113, Evaluating a simple expression",
            "207, Multiply algebraic fractions",
            "208, Factors of algebraic products",
            "209, Simple Factorisation",
            "210, Expanding one bracket",
            "211, Collecting terms",
            "212, Solving linear equations",
            "213, Transposition of formula",
            "214, Evaluating formula"
          ]
        },
        {
          "name": "algebra methods",
          "topics": [
            "307, Division of algebraic fractions",
            "308, Add/subtract algebraic fractions",
            "311, Factorising a quadratic",
            "312, Expanding two brackets",
            "313, Difference of squares",
            "404, L.c.d. of an algebraic fraction",
            "407, Quadratics - completing the square",
            "410, Substituting into a formula"
          ]
        },
        {
          "name": "equations",
          "topics": [
            "309, Simple Quadratic equations",
            "310, Relation between roots and factors",
            "314, Simultaneous Equations",
            "315, Unusual linear equation",
            "316, Use of quadratic formula",
            "406, Solve quad. by comp. the square",
            "411, Solutions of a quadratic",
            "412, Difficult linear equation"
          ]
        },
        {
          "name": "algebra+calculus",
          "topics": [
            "317, Complex numbers",
            "405, Identification of common errors",
            "408, Multiplication of complex numbers",
            "409, Divide by zero (possible solution)",
            "341, Differentiation of powers",
            "342, Finding Max/Min of a quadratic",
            "343, Geometric Progression",
            "441, Product rule",
            "442, Integration of powers"
          ]
        },
        {
          "name": "graphs",
          "topics": [
            "151, Coordinates",
            "251, Gradient of a straight line",
            "351, Equation of a straight line",
            "451, Recognise formula of quad. graph",
            "452, Recognise formula of recip. graph"
          ]
        },
        {
          "name": "miscellaneous",
          "topics": [
            "221, Pythagoras",
            "222, Definition of sin and cos",
            "223, Percentages",
            "321, Equation of a circle",
            "322, Sin and Cos formula",
            "323, Definition of radians",
            "324, Percentages (advanced)",
            "421, Deduce radius of circle",
            "422, Sin and Cos as functions"
          ]
        },
        {
          "name": "area+volume",
          "topics": [
            "161, Area of a triangle",
            "261, Area of trapezium",
            "262, Area and circumference of a circle",
            "263, Similar triangles",
            "361, Volume of cylinder",
            "362, Area/Length relationship",
            "363, Area of irregular shapes",
            "461, Surface area of a cylinder",
            "462, Volume Area Length relationships"
          ]
        },
        {
          "name": "statistics",
          "topics": [
            "231, Range of a set of numbers",
            "232, Mean of a set of numbers",
            "233, Simple probability (coins)",
            "334, Conditional probability",
            "234, Venn Diagrams (probability)",
            "335, Venn Diagrams (conditional prob.)"
          ]
        }
      ]
    };



    try {
        var kg = new KnowledgeGraph();

        var lomap = {};
        var tmap = {};
        diagnosys.learning_objectives.forEach(function(lod) {
            var lo = new LearningObjective(kg,lod.name);
            lomap[lo.name] = lo;
            kg.learning_objectives.push(lo);
        });
        diagnosys.topics.forEach(function(td) {
            var t = new Topic(kg,td.name);
            tmap[td.name] = t;
            kg.topics.push(t);
        });
        diagnosys.learning_objectives.forEach(function(lod) {
            lod.topics.forEach(function(tn) {
                tmap[tn].learning_objectives(lomap[lod.name]);
            });
        });
        diagnosys.topics.forEach(function(td) {
            var t = tmap[td.name];
            td.depends_on.forEach(function(tn) {
                var t2 = tmap[tn];
                if(!t.depends_on().contains(t2)) {
                    t.depends_on.push(t2);
                }
            });
            td.leads_to.forEach(function(tn) {
                var t2 = tmap[tn];
                if(!t2.depends_on().contains(t)) {
                    t2.depends_on.push(t);
                }
            });
        });

        viewModel = {
            tabber: new Editor.Tabber([
                {id: 'topics', title: 'Topics', icon: 'book'},
                {id: 'learning-objectives', title: 'Learning objectives', icon: 'ok'},
                {id: 'settings', title: 'Settings', icon: 'cog'}
            ]),
            graph: kg,
            show_topic: function(t) {
                kg.current_topic(t);
                viewModel.tabber.setTab('topics')();
            },
            show_learning_objective: function(lo) {
                kg.current_learning_objective(lo);
                viewModel.tabber.setTab('learning-objectives')();
            }
        };

        ko.options.deferUpdates = true;
        ko.applyBindings(viewModel);
        try {
            document.body.classList.add('loaded');
        } catch(e) {
            document.body.className += ' loaded';
        }

        show_graph(viewModel.graph);
    } catch(e) {
        $('.page-loading').hide();
        $('.page-error')
            .show()
            .find('.trace')
                .html(e.message)
        ;
        throw(e);
    }
});
