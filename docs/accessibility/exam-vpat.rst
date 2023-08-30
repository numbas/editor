Numbas runtime Accessibility Conformance Report, WCAG Edition
=============================================================

(Based on VPAT® Version 2.4Rev)

Name of Product/Version:
    Numbas runtime

Report Date:
    2023-08-29

Product Description:

Contact Information:

Notes:

Evaluation Methods Used:
     Safari on macOS and iOS with VoiceOver, Firefox on Linux with
     Orca, Firefox, Chrome and Edge on Windows with NVDA.

Applicable Standards/Guidelines
-------------------------------

This report covers the degree of conformance for the following accessibility standard/guidelines:

+------------------------------------------+--------------------+
| Standard/Guideline                       | Included in Report |
+==========================================+====================+
| Web Content Accessibility Guidelines 2.1 | Level A (Yes)      |
|                                          |                    |
|                                          | Level AA (Yes)     |
|                                          |                    |
|                                          | Level AAA (Yes)    |
+------------------------------------------+--------------------+

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

Table 1: Success Critera, Level A
*********************************

.. list-table::

  - 

     - Criteria
     - Conformance Level
     - Remarks and Explanations
  - 

     - 1.1.1: Non-text Content (Level A)
     - Supports
     - 
  - 

     - 1.2.1: Audio-only and Video-only (Prerecorded) (Level A)
     - Not Applicable
     - 
  - 

     - 1.2.2: Captions (Prerecorded) (Level A)
     - Not Applicable
     - 
  - 

     - 1.2.3: Audio Description or Media Alternative (Prerecorded) (Level A)
     - Not Applicable
     - 
  - 

     - 1.3.1: Info and Relationships (Level A)
     - Supports
     - 
  - 

     - 1.3.2: Meaningful Sequence (Level A)
     - Supports
     - 
  - 

     - 1.3.3: Sensory Characteristics (Level A)
     - Supports
     - 
  - 

     - 1.3.4: Orientation (Level AA)
     - Supports
     - 
  - 

     - 1.3.5: Identify Input Purpose (Level AA)
     - Supports
     - 
  - 

     - 1.3.6: Identify Purpose (Level AAA)
     - Supports
     - 
  - 

     - 1.4.1: Use of Color (Level A)
     - Supports
     - 
  - 

     - 1.4.2: Audio Control (Level A)
     - Not Applicable
     - 
  - 

     - 1.4.3: Contrast (Minimum) (Level AA)
     - Supports
     - 
  - 

     - 1.4.4: Resize text (Level AA)
     - Supports
     - 
  - 

     - 1.4.5: Images of Text (Level AA)
     - Supports
     - 
  - 

     - 1.4.6: Contrast (Enhanced) (Level AAA)
     - Supports
     - 
  - 

     - 1.4.7: Low or No Background Audio (Level AAA)
     - Not Applicable
     - 
  - 

     - 1.4.8: Visual Presentation (Level AAA)
     - Supports
     - 
  - 

     - 1.4.9: Images of Text (No Exception) (Level AAA)
     - Supports
     - The only instance of this is the logo, which contains the
       name "Numbas".
  - 

     - 1.4.10: Reflow (Level AA)
     - Supports
     - 
  - 

     - 1.4.11: Non-text Contrast (Level AA)
     - Supports
     - 
  - 

     - 1.4.12: Text Spacing (Level AA)
     - Supports
     - 
  - 

     - 1.4.13: Content on Hover or Focus (Level AA)
     - Supports
     - 
  - 

     - 2.1.1: Keyboard (Level A)
     - Supports
     - 
  - 

     - 2.1.2: No Keyboard Trap (Level A)
     - Supports
     - 
  - 

     - 2.1.3: Keyboard (No Exception) (Level AA)
     - Supports
     - 
  - 

     - 2.1.4: Character Key Shortcuts (Level A)
     - Not Applicable
     - 
  - 

     - 2.2.1: Timing Adjustable (Level A)
     - Supports
     - The exam can have a time limit specified by the author. This
       is essential.
  - 

     - 2.2.2: Pause, Stop, Hide (Level A)
     - Not Applicable
     - 
  - 

     - 2.2.3: No Timing (Level AAA)
     - Supports
     - 
  - 

     - 2.2.4: Interruptions (Level AAA)
     - Partially Supports
     - The only interruption not prompted by user input is the
       warning that time is running out. While exam authors can
       turn this off, individual users can't.
  - 

     - 2.2.5: Re-authenticating (Level AAA)
     - Supports
     - 
  - 

     - 2.2.6: Timeouts (Level AAA)
     - Supports
     - The only timer is the exam time limit, which is shown on the
       front page and during the exam.
  - 

     - 2.3.1: Three Flashes or Below Threshold (Level A)
     - Supports
     - 
  - 

     - 2.3.2: Three Flashes (Level AAA)
     - Supports
     - 
  - 

     - 2.3.3: Animation from Interactions (Level AAA)
     - Not Applicable
     - 
  - 

     - 2.4.1: Bypass Blocks (Level A)
     - Supports
     - There is a "skip to content" link at the start of the page,
       and sections of the page are marked up semantically so
       produce landmarks.
  - 

     - 2.4.2: Page Titled (Level A)
     - Supports
     - The title of the page is the name of the exam.
  - 

     - 2.4.3: Focus Order (Level A)
     - Supports
     - 
  - 

     - 2.4.4: Link Purpose (In Context) (Level A)
     - Supports
     - 
  - 

     - 2.4.5: Multiple Ways (Level AA)
     - Not Applicable
     - There's only one page, and questions are presented in a list
       that students should work through procedurally.
  - 

     - 2.4.6: Headings and Labels (Level AA)
     - Supports
     - 
  - 

     - 2.4.7: Focus Visible (Level AA)
     - Supports
     - 
  - 

     - 2.4.8: Location (Level AAA)
     - Supports
     - The current question is marked in the sidebar, as well as
       its name being displayed in the top nav bar and at the top
       of the content. In explore mode, breadcrumbs for the tree of
       parts, and the current part is marked as the current step.
  - 

     - 2.4.9: Link Purpose (Link Only) (Level AAA)
     - Supports
     - The only two links in the footer are to the Numbas and
       Newcastle University sites, in the footer, both labelled
       with those names.

       The explore mode breadcrumb links give the part's name.
  - 

     - 2.4.10: Section Headings (Level AAA)
     - Supports
     - 
  - 

     - 2.5.1: Pointer Gestures (Level A)
     - Not Applicable
     - 
  - 

     - 2.5.2: Pointer Cancellation (Level A)
     - Supports
     - 
  - 

     - 2.5.3: Label in Name (Level A)
     - Supports
     - 
  - 

     - 2.5.4: Motion Actuation (Level A)
     - Not Applicable
     - 
  - 

     - 2.5.5: Target Size (Level AAA)
     - Supports
     - Explore mode breadcrumb links are 18px high and could be
       narrow if the part's name is short, but they are inline.
  - 

     - 2.5.6: Concurrent Input Mechanisms (Level AAA)
     - Supports
     - 
  - 

     - 3.1.1: Language of Page (Level A)
     - Supports
     - 
  - 

     - 3.1.2: Language of Parts (Level AA)
     - Supports
     - 
  - 

     - 3.1.3: Unusual Words (Level AAA)
     - Partially Supports
     - Warnings for answer inputs can use words that the user
       should, but might not, understand. This is a tricky issue:
       the meaning of those words might be being assessed!
  - 

     - 3.1.4: Abbreviations (Level AAA)
     - Not Applicable
     - 
  - 

     - 3.1.5: Reading Level (Level AAA)
     - Cannot tell
     - Is there anything that uses complicated language that the
       user couldn't be expected to understand as a pre-requisite?
       Warnings for mathematical expression parts are complicated,
       but have to be, and students asked to enter a mathematical
       expression should understand them.
  - 

     - 3.1.6: Pronunciation (Level AAA)
     - Not Applicable
     - 
  - 

     - 3.2.1: On Focus (Level A)
     - Supports
     - 
  - 

     - 3.2.2: On Input (Level A)
     - Supports
     - 
  - 

     - 3.2.3: Consistent Navigation (Level AA)
     - Supports
     - 
  - 

     - 3.2.4: Consistent Identification (Level AA)
     - Supports
     - 
  - 

     - 3.2.5: Change on Request (Level AAA)
     - Supports
     - 
  - 

     - 3.3.1: Error Identification (Level A)
     - Supports
     - Answer inputs have the ``aria-invalid`` attribute set when
       they're invalid.
  - 

     - 3.3.2: Labels or Instructions (Level A)
     - Supports
     - The question author should describe in the part prompt how
       the student should enter their answer.
  - 

     - 3.3.3: Error Suggestion (Level AA)
     - Supports
     - 
  - 

     - 3.3.4: Error Prevention (Legal, Financial, Data) (Level AA)
     - Supports
     - The user can change their answers at any time while the exam
       is in progress.

       Invalid answers are shown immediately.

       The user can review all of their answers before ending the
       exam, unless this has been disabled by the exam author.
  - 

     - 3.3.5: Help (Level AAA)
     - Supports
     - There are hints for some answer inputs, e.g. numbers.

       There are warnings for invalid inputs, but no instructions
       about syntax for mathematical expressions.

       The question author should give instructions about any
       non-standard syntax used in answers.
  - 

     - 3.3.6: Error Prevention (All) (Level AAA)
     - Supports
     - Students can change their answers at any time until the exam
       is ended.

       Input that can't be marked shows an immediate warning
       message, usually offering a hint.

       They are asked to confirm ending the exam.

Table 2: Success Critera, Level AA
**********************************

.. list-table::

  - 

     - Criteria
     - Conformance Level
     - Remarks and Explanations
  - 

     - 1.2.4: Captions (Live) (Level AA)
     - Not Applicable
     - 
  - 

     - 1.2.5: Audio Description (Prerecorded) (Level AA)
     - Not Applicable
     - 
  - 

     - 1.2.6: Sign Language (Prerecorded) (Level AA)
     - Not Applicable
     - 
  - 

     - 1.2.7: Extended Audio Description (Prerecorded) (Level AA)
     - Not Applicable
     - 
  - 

     - 1.2.8: Media Alternative (Prerecorded) (Level AA)
     - Not Applicable
     - 
  - 

     - 1.2.9: Audio-only (Live) (Level AA)
     - Not Applicable
     - 
