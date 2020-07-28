.. _jsxgraph-extension:

JSXGraph
--------


The JSXGraph extension provides a function ``Numbas.extensions.jsxgraph.makeBoard`` which creates a JSXGraph board and wraps it inside an HTML `div` element to embed in the page.

The simplest use is to define a custom function in Javascript which returns an HTML value, like so::

    // First, make the JSXGraph board.
    // The function provided by the JSXGraph extension wraps the board up in 
    // a div tag so that it's easier to embed in the page.
    var div = Numbas.extensions.jsxgraph.makeBoard('400px','400px',
        {boundingBox: [-13,16,13,-16],
         axis: false,
         showNavigation: false,
         grid: true
        });

    // div.board is the object created by JSXGraph, which you use to 
    // manipulate elements
    var board = div.board;  

    // Then do whatever you want with the board....

    // and return the container div
    return div;

The question `Using student input in a JSXGraph diagram <https://numbas.mathcentre.ac.uk/question/2223/using-student-input-in-a-jsxgraph-diagram/>`_ is a more complete example of creating a JSXGraph diagram based on question variables and student input.

For help on using JSXGraph, see `the official documentation <http://jsxgraph.uni-bayreuth.de/wp/docs/index.html>`_.
