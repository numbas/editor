.. _extension-part:

Extension
^^^^^^^^^

An extension part acts as a placeholder for any interactive element added by an extension, or custom code in the question, which awards marks to the student.

To use an extension part, your code must implement the following methods: (links go to the relevant pages in the Numbas JavaScript API documentation)

* `mark <http://numbas.github.io/Numbas/Numbas.parts.ExtensionPart.html#mark>`_
* `validate <http://numbas.github.io/Numbas/Numbas.parts.ExtensionPart.html#validate>`_
* `createSuspendData <http://numbas.github.io/Numbas/Numbas.parts.ExtensionPart.html#createSuspendData>`_

If you can create a JME value representing the student's answer to the part, you should also implement `studentAnswerAsJME <http://numbas.github.io/Numbas/Numbas.parts.ExtensionPart.html#studentAnswerAsJME>`_ so that it can be used in adaptive marking by later parts.

See the :ref:`GeoGebra extension <geogebra-extension>` for an example of how to use the extension part.
