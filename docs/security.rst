.. _security:

Security
--------

Numbas exams run entirely in the web browser.
While that means that Numbas can run in a huge range of contexts, it also means that all of the information required to carry out marking and calculate scores is necessarily on the student's device.

When a Numbas exam is run through a standard desktop web browser, it is possible to use the browser's developer tools to view the source code, retrieve expected answers, or manipulate reported data.
For this reason, we recommend that high-stakes summative assessments using Numbas should be delivered exclusively through a locked-down browser app, so that students don't have access to this internal data.

.. _lockdown-app:

Numbas lockdown app
===================

There is an official `Numbas lockdown app <https://www.numbas.org.uk/lockdown-app/>`_, which is compatible with the Numbas LTI provider.
By requiring that exams are launched with the Numbas lockdown app, you can ensure that students don't have access to the exam's internal code.
The Numbas lockdown app doesn't restrict the use of other apps on the student's device, so they still have access to other websites and their local files.

Other lockdown apps
===================

There are several other locked-down browsers available. 

`Safe Exam Browser <https://safeexambrowser.org/>`_ is an open-source option which completely locks the desktop environment, so the student only has access to apps and websites that you have specifically allowed.
