.. title:: What do I need to use Numbas?

What do I need to use Numbas?
#############################

The Numbas editor
-----------------

The Numbas editor is used to write questions and collect them into exams.
The editor at `numbas.mathcentre.ac.uk <https://numbas.mathcentre.ac.uk>`_ is free to use, and hosted by Newcastle University.

If you want to set up your own instance of the editor, you can: it's open source. 
See the :ref:`editor installation instructions <server-installation>`.

What students need
------------------

Students access Numbas through a web browser.
The exam runs entirely on the student's device.
Numbas is compatible with all major browsers and devices.

For standalone tests, you just need to upload your exam to the web and give your students a link to it.
See :ref:`recording scores <recording-scores>` for information on integrating Numbas with a virtual learning environment.

We aim for Numbas to be compatible with all popular browsers.

We have tested Numbas on the following browsers.
Any more recent versions should be assumed to work.

* **Chrome** version 112 (released 2023-04-04).
* **Firefox** version 117 (released 2023-08-29).
* **Edge** version 112 (released 2023-04-06).
* **macOS Safari** version 16.5 (released 2023-09-18, with MacOS Sonoma).
* **iOS Safari (iPhone/iPad)** version 16.5 (released 2023-09-18).

.. _recording-scores:

Recording scores
----------------

In order to record students' scores and other attempt data, you need to connect to a virtual learning environment (VLE).
Numbas can use the SCORM 2004 standard, if your VLE supports it.
Several VLEs have built-in SCORM players: the ones we know of are Blackboard Learn 9.1+, Moodle 2.6+, desire2learn Brightspace.

.. warning::
    Blackboard Learn's SCORM player has several bugs and missing features.
    Many users have reported Blackboard failing to record attempt data for 5-10% of student attempts, apparently at random.
    We don't recommend using Blackboard's built-in SCORM player for summative assessment.

Our recommended method of integrating with a VLE is the `Numbas LTI provider <https://docs.numbas.org.uk/lti/>`_.
The LTI provider is software which you must run on a server you control; see the  `guide on what you need to run the LTI provider <https://docs.numbas.org.uk/lti/en/latest/getting-started.html#what-do-i-need-in-order-to-use-this>`_.

The LTI provider works with any Basic LTI 1.1 tool consumer, which includes most VLEs.
The major ones we know of are: `Blackboard Learn 9.1+ <https://help.blackboard.com/Learn/Administrator/SaaS/Integrations/Learning_Tools_Interoperability>`_, `Moodle 2.2+ <https://docs.moodle.org/36/en/LTI_and_Moodle>`_, `Canvas <https://community.canvaslms.com/docs/DOC-10724-67952720325>`_, `desire2learn Brightspace <https://community.d2l.com/brightspace/kb/articles/4260-set-up-integration-with-a-tool-provider>`_.

Students can also print out or produce PDF transcripts of their attempts once completed.
