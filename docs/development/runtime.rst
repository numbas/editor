Making changes to the runtime
=============================

The Numbas runtime compiler gathers together all the files in the ``runtime`` directory, as well as any extensions and the theme's scripts, into a single file called ``scripts.js``.

The editor and unit tests also each use a single compiled JavaScript file containing the runtime code.
In order for changes to take effect, you must rebuild these.

In the Numbas compiler directory, run:

.. code-block:: console

    $ make tests

In the Numbas editor directory, run:

.. code-block:: console

    $ make update_from_runtime

Unit tests
----------

The unit tests ensure that the Numbas runtime matches the expected behaviour: they help you catch occasions where you break something in the course of fixing something else.

When you make a change to the runtime, you should add a unit test for the expected behaviour.

There are two sets of tests: one for the JME system, and one for the exam/question/part logic.
They are both held in the ``tests`` directory, and both use `QUnit <https://qunitjs.com/>`__.

To run the tests, start a static file server in the compiler directory:

.. code-block:: console

    $ cd compiler
    $ python -m http.server 8002

And open http://localhost:8002/tests.

Adding a JME function
---------------------

Built-in JME functions are defined in ``runtime/scripts/jme-builtins.js``.

A JME function definition consists of:

* The function's *name*.

* The *signature* of the arguments.

  This is a list of :ref:`data types <jme-data-types>`, or ``'?'`` when any type is acceptable.

* The *return type* of the function. 

  This is one of the token constructor functions in ``Numbas.jme.types``.

* The body of the function, as a JavaScript function.

In ``jme-builtins.js``, there is a convenience function ``newBuiltin`` which takes a function definition and adds it to the built-in JME scope.

Here's a definition of a function ``double(n)`` which doubles the given number::

    newBuiltin('double', ['number'], TNum, function(n) {
        return 2*n;
    });

In the function definition, arguments are shallowly unwrapped: the ``value`` property of each argument is passed through.
When the argument is a collection such as :data:`list` or :data:`dict`, or a type without a ``value`` property, such as :data:`name`, then you should use the ``unwrapValues`` option to fully unwrap and re-wrap the value.

Here's a function that returns the range of a list of numbers::

    newBuiltin('range', ['list of number'], TNum, function(l) {
        return math.listmax(l) - math.listmin(l);
    }, {unwrapValues: true});

When you need to operate on token objects directly, or return a value of variable type, you can construct your own ``evaluate`` function, and give ``null`` for the function body argument.,

Here's a function which returns the last element of a list::

    newBuiltin('last', ['list'], '?', null, {
        evaluate: function(args, scope) {
            var l = args[0].value;
            return l[l.length-1];
        }
    });

(Everything about defining JME functions is fiddly, and it needs to be improved.
Making up some convenience functions for common patterns would be time well spent!)

The JME unit tests assert that every built-in function has at least one example in the documentation.

In ``editor/docs/jme-reference.rst``, add an entry for the function, including at least one item under the **Examples** header.

Then in the compiler directory, rebuild the tests:

.. code-block:: console

    $ make tests
