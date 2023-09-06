.. _exam-vpat:

Numbas runtime Accessibility Conformance Report, WCAG Edition
=============================================================

.. note::

    This accessibility conformance report is intended to help instructors and support colleagues to assess whether Numbas satisfies their accessibility criteria.

    There is a separate :ref:`accessibility statement for students <exam-accessibility-statement>`, describing the accessibility features of Numbas, how to use it with assistive technology and how to adapt it to your needs.

(Based on `VPAT® Version 2.4 Rev WCAG <https://www.itic.org/policy/accessibility/vpat>`__)

Name of Product/Version:
    Numbas runtime v7.1.

Report Date:
    September 2023.

Product Description:
    This report covers the Numbas exam interface used by students, with the default theme.
    It does not cover the Numbas editor or the Numbas LTI tool.

Contact Information:
    Email numbas@ncl.ac.uk.

    You can report bugs or make suggestions at `github.com/numbas/Numbas/issues <https://github.com/numbas/Numbas/issues>`__.

Notes
    This report only considers the built-in aspects of the Numbas exam interface.
    Question authors can write any text in question prompts, or insert images or apply formatting that affects the accessibility of the interface.

    Extensions and custom themes can add new functionality or change the behaviour of Numbas; this is outside the scope of this report.

    Instructors using Numbas should be aware of accessibility guidelines and ensure their content is accessible to their students.

    Numbas satisfies all of the criteria of WCAG 2.1 Level AA, and all of the criteria of WCAG 2.1 Level AAA except :ref:`2.2.4: Interruptions <exam-vpat-wcag-2-2-4>`, :ref:`3.1.3: Unusual Words <exam-vpat-wcag-3-1-3>` and :ref:`3.1.5: Reading Level <exam-vpat-wcag-3-1-5>`, which are **partially supported**.

Evaluation Methods Used:
    The following applications were used in this evaluation:
    
    * Desktop browsers: Safari on macOS with VoiceOver, Firefox on Linux, Chrome and Edge on Windows with NVDA.
    * Mobile browsers: Safari on iOS with VoiceOver.
    * Accessibility testing tools: Firefox developer tools, `axe DevTools <https://www.deque.com/axe/devtools/>`_.

    Most of the evaluation was performed by Christian Lawson-Perfect, with some input from other members of the Numbas development team and a student user.

Applicable Standards/Guidelines
-------------------------------

This report covers the degree of conformance for the Web Content Accessibility Guidelines (WCAG) 2.1, at Levels A, AA and AAA.

Terms
-----

The terms used in the Conformance Level information are defined as follows:

Supports
    The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.
Partially Supports
    Some functionality of the product does not meet the criterion.
Does Not Support
    The majority of product functionality does not meet the criterion.
Not Applicable
    The criterion is not relevant to the product.

WCAG 2.1 Report
---------------

Table 1: Success Criteria, Level A
**********************************

.. list-table::
  :header-rows: 1

  - 

     - Criteria
     - Conformance Level
     - Remarks and Explanations
  - 

     - .. _exam-vpat-wcag-1-1-1:

       `1.1.1: Non-text Content <https://www.w3.org/WAI/WCAG21/quickref/#non-text-content>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-2-1:

       `1.2.1: Audio-only and Video-only (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#audio-only-and-video-only-prerecorded>`__ (Level A)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-2:

       `1.2.2: Captions (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#captions-prerecorded>`__ (Level A)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-3:

       `1.2.3: Audio Description or Media Alternative (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#audio-description-or-media-alternative-prerecorded>`__ (Level A)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-3-1:

       `1.3.1: Info and Relationships <https://www.w3.org/WAI/WCAG21/quickref/#info-and-relationships>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-3-2:

       `1.3.2: Meaningful Sequence <https://www.w3.org/WAI/WCAG21/quickref/#meaningful-sequence>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-3-3:

       `1.3.3: Sensory Characteristics <https://www.w3.org/WAI/WCAG21/quickref/#sensory-characteristics>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-1:

       `1.4.1: Use of Color <https://www.w3.org/WAI/WCAG21/quickref/#use-of-color>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-2:

       `1.4.2: Audio Control <https://www.w3.org/WAI/WCAG21/quickref/#audio-control>`__ (Level A)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-2-1-1:

       `2.1.1: Keyboard <https://www.w3.org/WAI/WCAG21/quickref/#keyboard>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-1-2:

       `2.1.2: No Keyboard Trap <https://www.w3.org/WAI/WCAG21/quickref/#no-keyboard-trap>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-1-4:

       `2.1.4: Character Key Shortcuts <https://www.w3.org/WAI/WCAG21/quickref/#character-key-shortcuts>`__ (Level A)
     - Not Applicable
     - There are no character key shortcuts.
  - 

     - .. _exam-vpat-wcag-2-2-1:

       `2.2.1: Timing Adjustable <https://www.w3.org/WAI/WCAG21/quickref/#timing-adjustable>`__ (Level A)
     - Supports
     - The exam can have a time limit specified by the author.
       This is essential.
  - 

     - .. _exam-vpat-wcag-2-2-2:

       `2.2.2: Pause, Stop, Hide <https://www.w3.org/WAI/WCAG21/quickref/#pause-stop-hide>`__ (Level A)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-2-3-1:

       `2.3.1: Three Flashes or Below Threshold <https://www.w3.org/WAI/WCAG21/quickref/#three-flashes-or-below-threshold>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-4-1:

       `2.4.1: Bypass Blocks <https://www.w3.org/WAI/WCAG21/quickref/#bypass-blocks>`__ (Level A)
     - Supports
     - There is a "skip to content" link at the start of the page,
       and sections of the page are marked up semantically so
       produce landmarks.
  - 

     - .. _exam-vpat-wcag-2-4-2:

       `2.4.2: Page Titled <https://www.w3.org/WAI/WCAG21/quickref/#page-titled>`__ (Level A)
     - Supports
     - The title of the page is the name of the exam.
  - 

     - .. _exam-vpat-wcag-2-4-3:

       `2.4.3: Focus Order <https://www.w3.org/WAI/WCAG21/quickref/#focus-order>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-4-4:

       `2.4.4: Link Purpose (In Context) <https://www.w3.org/WAI/WCAG21/quickref/#link-purpose-in-context>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-5-1:

       `2.5.1: Pointer Gestures <https://www.w3.org/WAI/WCAG21/quickref/#pointer-gestures>`__ (Level A)
     - Not Applicable
     - There are no multipoint or path-based gestures.
  - 

     - .. _exam-vpat-wcag-2-5-2:

       `2.5.2: Pointer Cancellation <https://www.w3.org/WAI/WCAG21/quickref/#pointer-cancellation>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-5-3:

       `2.5.3: Label in Name <https://www.w3.org/WAI/WCAG21/quickref/#label-in-name>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-5-4:

       `2.5.4: Motion Actuation <https://www.w3.org/WAI/WCAG21/quickref/#motion-actuation>`__ (Level A)
     - Not Applicable
     - There are no features which use device motion or user motion.
  - 

     - .. _exam-vpat-wcag-3-1-1:

       `3.1.1: Language of Page <https://www.w3.org/WAI/WCAG21/quickref/#language-of-page>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-2-1:

       `3.2.1: On Focus <https://www.w3.org/WAI/WCAG21/quickref/#on-focus>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-2-2:

       `3.2.2: On Input <https://www.w3.org/WAI/WCAG21/quickref/#on-input>`__ (Level A)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-3-1:

       `3.3.1: Error Identification <https://www.w3.org/WAI/WCAG21/quickref/#error-identification>`__ (Level A)
     - Supports
     - Answer inputs have the ``aria-invalid`` attribute set when
       they're invalid.
  - 

     - .. _exam-vpat-wcag-3-3-2:

       `3.3.2: Labels or Instructions <https://www.w3.org/WAI/WCAG21/quickref/#labels-or-instructions>`__ (Level A)
     - Supports
     - The question author should describe in the part prompt how
       the student should enter their answer.

Table 2: Success Criteria, Level AA
***********************************

.. list-table::
  :header-rows: 1

  - 

     - Criteria
     - Conformance Level
     - Remarks and Explanations
  - 

     - .. _exam-vpat-wcag-1-2-4:

       `1.2.4: Captions (Live) <https://www.w3.org/WAI/WCAG21/quickref/#captions-live>`__ (Level AA)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-5:

       `1.2.5: Audio Description (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#audio-description-prerecorded>`__ (Level AA)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-6:

       `1.2.6: Sign Language (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#sign-language-prerecorded>`__ (Level AA)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-7:

       `1.2.7: Extended Audio Description (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#extended-audio-description-prerecorded>`__ (Level AA)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-8:

       `1.2.8: Media Alternative (Prerecorded) <https://www.w3.org/WAI/WCAG21/quickref/#media-alternative-prerecorded>`__ (Level AA)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-2-9:

       `1.2.9: Audio-only (Live) <https://www.w3.org/WAI/WCAG21/quickref/#audio-only-live>`__ (Level AA)
     - Not Applicable
     - 
  - 

     - .. _exam-vpat-wcag-1-3-4:

       `1.3.4: Orientation <https://www.w3.org/WAI/WCAG21/quickref/#orientation>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-3-5:

       `1.3.5: Identify Input Purpose <https://www.w3.org/WAI/WCAG21/quickref/#identify-input-purpose>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-3:

       `1.4.3: Contrast (Minimum) <https://www.w3.org/WAI/WCAG21/quickref/#contrast-minimum>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-4:

       `1.4.4: Resize text <https://www.w3.org/WAI/WCAG21/quickref/#resize-text>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-5:

       `1.4.5: Images of Text <https://www.w3.org/WAI/WCAG21/quickref/#images-of-text>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-10:

       `1.4.10: Reflow <https://www.w3.org/WAI/WCAG21/quickref/#reflow>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-11:

       `1.4.11: Non-text Contrast <https://www.w3.org/WAI/WCAG21/quickref/#non-text-contrast>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-12:

       `1.4.12: Text Spacing <https://www.w3.org/WAI/WCAG21/quickref/#text-spacing>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-13:

       `1.4.13: Content on Hover or Focus <https://www.w3.org/WAI/WCAG21/quickref/#content-on-hover-or-focus>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-1-3:

       `2.1.3: Keyboard (No Exception) <https://www.w3.org/WAI/WCAG21/quickref/#keyboard-no-exception>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-4-5:

       `2.4.5: Multiple Ways <https://www.w3.org/WAI/WCAG21/quickref/#multiple-ways>`__ (Level AA)
     - Not Applicable
     - There's only one page, and questions are presented in a list
       that students should work through procedurally.
  - 

     - .. _exam-vpat-wcag-2-4-6:

       `2.4.6: Headings and Labels <https://www.w3.org/WAI/WCAG21/quickref/#headings-and-labels>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-4-7:

       `2.4.7: Focus Visible <https://www.w3.org/WAI/WCAG21/quickref/#focus-visible>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-1-2:

       `3.1.2: Language of Parts <https://www.w3.org/WAI/WCAG21/quickref/#language-of-parts>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-2-3:

       `3.2.3: Consistent Navigation <https://www.w3.org/WAI/WCAG21/quickref/#consistent-navigation>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-2-4:

       `3.2.4: Consistent Identification <https://www.w3.org/WAI/WCAG21/quickref/#consistent-identification>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-3-3:

       `3.3.3: Error Suggestion <https://www.w3.org/WAI/WCAG21/quickref/#error-suggestion>`__ (Level AA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-3-4:

       `3.3.4: Error Prevention (Legal, Financial, Data) <https://www.w3.org/WAI/WCAG21/quickref/#error-prevention-legal-financial-data>`__ (Level AA)
     - Supports
     - The user can change their answers at any time while the exam
       is in progress.

       Invalid answers are shown immediately.

       The user can review all of their answers before ending the
       exam, unless this has been disabled by the exam author.

Table 3: Success Criteria, Level AAA
************************************

.. list-table::
  :header-rows: 1

  - 

     - Criteria
     - Conformance Level
     - Remarks and Explanations
  - 

     - .. _exam-vpat-wcag-1-3-6:

       `1.3.6: Identify Purpose <https://www.w3.org/WAI/WCAG21/quickref/#identify-purpose>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-6:

       `1.4.6: Contrast (Enhanced) <https://www.w3.org/WAI/WCAG21/quickref/#contrast-enhanced>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-7:

       `1.4.7: Low or No Background Audio <https://www.w3.org/WAI/WCAG21/quickref/#low-or-no-background-audio>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-8:

       `1.4.8: Visual Presentation <https://www.w3.org/WAI/WCAG21/quickref/#visual-presentation>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-1-4-9:

       `1.4.9: Images of Text (No Exception) <https://www.w3.org/WAI/WCAG21/quickref/#images-of-text-no-exception>`__ (Level AAA)
     - Supports
     - The only instance of this is the logo, which contains the
       name "Numbas".
  - 

     - .. _exam-vpat-wcag-2-2-3:

       `2.2.3: No Timing <https://www.w3.org/WAI/WCAG21/quickref/#no-timing>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-2-4:

       `2.2.4: Interruptions <https://www.w3.org/WAI/WCAG21/quickref/#interruptions>`__ (Level AAA)
     - **Partially Supports**
     - The only interruption not prompted by user input is the
       warning that time is running out.
       While exam authors can turn this off, individual users can't.
  - 

     - .. _exam-vpat-wcag-2-2-5:

       `2.2.5: Re-authenticating <https://www.w3.org/WAI/WCAG21/quickref/#re-authenticating>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-2-6:

       `2.2.6: Timeouts <https://www.w3.org/WAI/WCAG21/quickref/#timeouts>`__ (Level AAA)
     - Supports
     - The only timer is the exam time limit, which is shown on the
       front page and during the exam.
  - 

     - .. _exam-vpat-wcag-2-3-2:

       `2.3.2: Three Flashes <https://www.w3.org/WAI/WCAG21/quickref/#three-flashes>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-3-3:

       `2.3.3: Animation from Interactions <https://www.w3.org/WAI/WCAG21/quickref/#animation-from-interactions>`__ (Level AAA)
     - Supports
     - There are no animations triggered by interactions.
  - 

     - .. _exam-vpat-wcag-2-4-8:

       `2.4.8: Location <https://www.w3.org/WAI/WCAG21/quickref/#location>`__ (Level AAA)
     - Supports
     - The current question is marked in the sidebar, as well as
       its name being displayed in the top nav bar and at the top
       of the content.
       In explore mode, breadcrumbs for the tree of parts, and the
       current part is marked as the current step.
  - 

     - .. _exam-vpat-wcag-2-4-9:

       `2.4.9: Link Purpose (Link Only) <https://www.w3.org/WAI/WCAG21/quickref/#link-purpose-link-only>`__ (Level AAA)
     - Supports
     - The only two links in the footer are to the Numbas and
       Newcastle University sites, in the footer, both labelled
       with those names.

       The explore mode breadcrumb links give the part's name.
  - 

     - .. _exam-vpat-wcag-2-4-10:

       `2.4.10: Section Headings <https://www.w3.org/WAI/WCAG21/quickref/#section-headings>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-2-5-5:

       `2.5.5: Target Size <https://www.w3.org/WAI/WCAG21/quickref/#target-size>`__ (Level AAA)
     - Supports
     - Explore mode breadcrumb links are 18px high and could be
       narrow if the part's name is short, but they are inline.
  - 

     - .. _exam-vpat-wcag-2-5-6:

       `2.5.6: Concurrent Input Mechanisms <https://www.w3.org/WAI/WCAG21/quickref/#concurrent-input-mechanisms>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-1-3:

       `3.1.3: Unusual Words <https://www.w3.org/WAI/WCAG21/quickref/#unusual-words>`__ (Level AAA)
     - **Partially Supports**
     - Warnings for answer inputs can use words that the user
       should, but might not, understand, such as "integer", "operator" or "variable".
       This is a tricky issue: the meaning of those words might
       be being assessed!
  - 

     - .. _exam-vpat-wcag-3-1-4:

       `3.1.4: Abbreviations <https://www.w3.org/WAI/WCAG21/quickref/#abbreviations>`__ (Level AAA)
     - Not Applicable
     - No abbreviations are used in the built-in text.
       Question authors should ensure this criterion is satisfied if they use any abbreviations.
  - 

     - .. _exam-vpat-wcag-3-1-5:

       `3.1.5: Reading Level <https://www.w3.org/WAI/WCAG21/quickref/#reading-level>`__ (Level AAA)
     - **Partially Supports**
     - The majority of text in a Numbas question is provided by 
       the question author, so out of the scope of this report.
       Most built-in text is at a lower secondary reading level,
       but some warning messages about invalid inputs use more
       complex terminology, which can't be avoided.
  - 

     - .. _exam-vpat-wcag-3-1-6:

       `3.1.6: Pronunciation <https://www.w3.org/WAI/WCAG21/quickref/#pronunciation>`__ (Level AAA)
     - Not Applicable
     - No ambiguous terms are used in the built-in text.
       Question authors should ensure this criterion is satisfied if they use any ambiguous terms.
  - 

     - .. _exam-vpat-wcag-3-2-5:

       `3.2.5: Change on Request <https://www.w3.org/WAI/WCAG21/quickref/#change-on-request>`__ (Level AAA)
     - Supports
     - 
  - 

     - .. _exam-vpat-wcag-3-3-5:

       `3.3.5: Help <https://www.w3.org/WAI/WCAG21/quickref/#help>`__ (Level AAA)
     - Supports
     - There are hints for some answer inputs, e.g. numbers.

       There are warnings for invalid inputs, but no instructions
       about syntax for mathematical expressions.

       The question author should give instructions about any
       non-standard syntax used in answers.
  - 

     - .. _exam-vpat-wcag-3-3-6:

       `3.3.6: Error Prevention (All) <https://www.w3.org/WAI/WCAG21/quickref/#error-prevention-all>`__ (Level AAA)
     - Supports
     - Students can change their answers at any time until the exam
       is ended.

       Input that can't be marked shows an immediate warning
       message, usually offering a hint.

       They are asked to confirm ending the exam.
