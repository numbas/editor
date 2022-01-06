.. _writing-extensions:

Writing an extension
====================

Creating a new extension
------------------------

To begin writing an extension, click on the :guilabel:`Profile` link, then :guilabel:`Extensions`.

Click the :guilabel:`Create a new extension button`.
On the following page, enter a name for your extension and click :guilabel:`Submit`.
Note that the extension's name must be unique among all extensions in the database, so you might need to change your chosen name if someone else has already used it.

You will then be presented with the editor for the extension's main script file.

Uploading an extension
----------------------

The :guilabel:`Upload an extension` link takes you to a form where you can upload your extension.

Either upload a single JavaScript file, or a .zip file containing all of the extension's files.

After uploading your extension, you will be returned to the list of your extensions.

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
        If this isn't used, then any ``README`` file in the extension package will be used.

Editing an extension
--------------------

To edit an existing extension, click the corresponding link in the list of extensions either in the question editor or in your profile's :guilabel:`Extensions` page.

The editor allows you to edit text files in the extension package.
After making changes, click the :guilabel:`Save` button.
If you've got a question which uses the extension open in another tab, you'll have to reload it before changes take effect.

Access to extensions
--------------------

An extension you create is initially only available to you.
You can grant access to other named users under the :guilabel:`Access` tab in the extension editor.

You can give other users the ability to *view* your extension, which will allow them to use the extension in their own questions, or the ability to *edit*, which will also allow them to edit the extension's source code.

Contents of an extension
------------------------

The minimum an extension must contain is a file named ``<extension-name>.js``, containing the following::

    Numbas.addExtension('<extension-name>',['base'],function(extension) {

    });

(See the API documentation for `Numbas.addExtension <http://numbas.github.io/Numbas/Numbas.html#addExtension>`_ for details on how this function works)

This function call tells Numbas that the extension has loaded.
Because Numbas can't guarantee the order script files will be loaded in, code which uses the `Numbas` object must be placed inside the callback function given to ``Numbas.addExtension``.

An extension can also include CSS files, which will be added to the rest of the Numbas CSS when an exam using the extension is compiled.
Any other file types are included in the compiled package as-is, under the path ``extensions/<extension-name>``. 

It's also a good idea to include documentation on how to use your extension in a ``README`` file.
Extensions created through the editor automatically have a ``README.md`` file, which is written in `Markdown <https://www.markdownguide.org/>`_ format.

Adding JME functions
--------------------

An extension can add JME functions (or rulesets, or anything else that goes in a `Scope <http://numbas.github.io/Numbas/Numbas.jme.Scope.html>`_ object by manipulating the ``extension.scope`` object.
Here's an example which adds a single JME function::

    Numbas.addExtension('difference',['jme'],function(extension) {
        var funcObj = Numbas.jme.funcObj;
        var TNum = Numbas.jme.types.TNum;

        extension.scope.addFunction(new funcObj('difference',[TNum,TNum],TNum,function(a,b){ return Math.abs(a-b); }, {unwrapValues:true}));
    })

(Download this extension: :download:`difference.zip <_static/difference.zip>`)

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

(Download this extension: :download:`chemicals.zip <_static/chemicals.zip>`)

