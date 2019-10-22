Extensions
==========

An extension is a folder containing one or more files that should be included in an exam. 
They can be javascript files, CSS stylesheets, or any other kind of resource. 

Each extension must have a unique :guilabel:`short name`, which is used both in the Numbas editor and by the script-loader in compiled exams.

The minimum an extension must contain is a file named ``<extension-name>.js``, containing the following::

    Numbas.addExtension('<extension-name>',['base'],function(extension) {

    });

(See the API documentation for `Numbas.addExtension <http://numbas.github.io/Numbas/Numbas.html#addExtension>`_ for details on how this function works)

This function call tells Numbas that the extension has loaded. 
Because Numbas can't guarantee the order script files will be loaded in, code which uses the `Numbas` object must be placed inside the callback function given to ``Numbas.addExtension``.


Using an extension with the editor
----------------------------------

Package your extension's files into a .zip file. 
Next, go to the Numbas editor click on the :guilabel:`Profile` link, then :guilabel:`Extensions`. 
The :guilabel:`Upload a new extension` link takes you to a form where you can upload the .zip file you created.

.. glossary::
    Name:
        A human-readable name for the extension. 
        This should concisely describe what it does, or what feature it provides.

    Short name:
        A unique identifier for the extension.

        .. warning::
            An extension's short name must be **unique**, and match the short name used when uploading it to the editor. 
            This means that if you reuse an extension and use a different name when uploading it to the editor, you must rename its JavaScript file and change the name given to ``Numbas.addExtension``.

    Documentation URL:
        The URL of a page describing how to use the extension.


Adding JME functions
--------------------

An extension can add JME functions (or rulesets, or anything else that goes in a `Scope <http://numbas.github.io/Numbas/Numbas.jme.Scope.html>`_ object by manipulating the ``extension.scope`` object. 
Here's an example which adds a single JME function::

    Numbas.addExtension('difference',['jme'],function(extension) {
        var funcObj = Numbas.jme.funcObj;
        var TNum = Numbas.jme.types.TNum;

        extension.scope.addFunction(new funcObj('difference',[TNum,TNum],TNum,function(a,b){ return Math.abs(a-b); }, {unwrapValues:true}));
    })

(Download this extension: :download:`difference.zip <_static/extensions/difference.zip>`)

Adding a new JME data type
--------------------------

JME data types are JavaScript objects, distinguished by their ``type`` property. 
The object should have a `value` property which contains the data it represents. 
The JME system can happily use new data types, but you'll need to tell it how to render them as LaTeX or JME code. 
This is done by adding methods to ``Numbas.jme.display.typeToTeX`` and ``Numbas.jme.display.typeToJME``. 
Once you've defined how to create and display the new data type, you can add functions dealing with it in the same way as for the built-in data types.

Here's an example extension which defines a toy "chemical" data type (excuse the bad chemistry)::

    Numbas.addExtension('chemicals',['jme','jme-display'],function(chemicals) {

        var chemicalsScope = chemicals.scope;

        // Define the constructor for a new data type representing a chemical formula
        // `formula` is a dictionary mapping element symbols to the number of atoms present
        function TChemical(formula) {
            this.value = formula;
        }
        TChemical.prototype.type = 'chemical';

        // define a couple of example formulas
        chemicalsScope.variables.oxygen = new TChemical({O:2});
        chemicalsScope.variables.water = new TChemical({H:2, O:1});

        // Code to render a chemical formula as LaTeX
        Numbas.jme.display.typeToTeX.chemical = function(thing,tok,texArgs,settings) {
            var out = '';
            for(var element in tok.value){
                out += element;
                var num = tok.value[element];
                if(num>1) {
                    out += '_{'+num+'}';
                }
            }
            return '\\mathrm{'+out+'}';
        }

        // Code to render a chemical formula as a JME expression
        Numbas.jme.display.typeToJME.chemical = function(tree,tok,bits,settings) {
            var out = '';
            for(var element in tok.value) {
                if(out.length) {
                    out += '+';
                }
                out += 'molecule("'+element+'",'+tok.value[element]+')'
            }
            return out;
        }

        var funcObj = Numbas.jme.funcObj;
        var TString = Numbas.jme.types.TString;
        var TNum = Numbas.jme.types.TNum;

        // define addition on chemicals: add up the elements in each formula
        chemicalsScope.addFunction(new funcObj('+',[TChemical,TChemical],TChemical,function(c1,c2) {
            var nformula = {};
            var element;
            for(element in c1) {
                nformula[element] = c1[element];
            }
            for(element in c2) {
                if(element in nformula) {
                    nformula[element] += c2[element];
                } else {
                    nformula[element] = c2[element];
                }
            }
            return nformula;
        }));

        // define a function to create a molecule with given number of atoms of given element
        chemicalsScope.addFunction(new funcObj('molecule',[TString,TNum],TChemical,function(element,numatoms) {
            var formula = {};
            formula[element] = numatoms;
            return formula;
        }));

        // define a JME functions which tells you how many of the given element are in a formula
        chemicalsScope.addFunction(new funcObj('numatoms',[TChemical,Numbas.jme.types.TString],Numbas.jme.types.TNum,function(chemical,element) {
            if(element in chemical) {
                return chemical[element];
            } else {
                return 0;
            }
        }));
    });

(Download this extension: :download:`chemicals.zip <_static/extensions/chemicals.zip>`)

First-party extensions
----------------------

.. toctree::
    :maxdepth: 1

    extensions/jsxgraph
    extensions/geogebra
    extensions/stats
    extensions/random-person

