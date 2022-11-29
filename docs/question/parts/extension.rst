.. _extension-part:

Extension
^^^^^^^^^

An extension part acts as a placeholder for any interactive element added by an extension, or custom code in the question, which awards marks to the student.

To use an extension part, your code must implement the following methods: (links go to the relevant pages in the Numbas JavaScript API documentation)

* `mark <https://docs.numbas.org.uk/runtime_api/en/latest/Numbas.parts.ExtensionPart.html#mark>`__
* `createSuspendData <https://docs.numbas.org.uk/runtime_api/en/latest/Numbas.parts.ExtensionPart.html#createSuspendData>`__
* `loadSuspendData <https://docs.numbas.org.uk/runtime_api/en/latest/Numbas.parts.ExtensionPart.html#loadSuspendData>`__

If you can create a JME value representing the student's answer to the part, you should also implement `studentAnswerAsJME <https://docs.numbas.org.uk/runtime_api/en/latest/Numbas.parts.ExtensionPart.html#studentAnswerAsJME>`__ so that it can be used in adaptive marking by later parts.

See the :ref:`GeoGebra extension <geogebra-extension>` for an example of how to use the extension part.
