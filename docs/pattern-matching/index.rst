.. _pattern-matching:

Pattern-matching mathematical expressions
=========================================

Numbas includes a sophisticated pattern-matching algorithm for mathematical expressions. 
The algorithm decides whether an input expression matches a given pattern, and also identifies *named matching groups*, which are sub-expressions of the input expression.

Pattern-matching is used to power the :ref:`simplification rules <simplification-rules>`, as well as to establish the *form* of mathematical expressions entered by the student.

The pattern-matcher should be considered to work similarly to a `regular expression algorithm <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions>`_, except it operates on algebraic syntax trees instead of text strings. 


.. toctree::
    :caption: Pattern-matching
    :maxdepth: 2

    reference
    examples
