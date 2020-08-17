.. _number-notation:

Number notation
===============

There are many different ways of writing a number, depending on culture and context.

Numbas can interpret and display numbers in several styles.

Styles of notation
------------------

Numbas supports the following styles of notation. 
The entry in the "Code" column is the string you should use to identify the style in JME or JavaScript code.

+-----------------+-----------------+-------------------------------------------------+-------------------+
| Style           | Code            | Description                                     | Example           |
+=================+=================+=================================================+===================+
| English (plain) | ``plain``       | Powers of 1000 not separated,                   | 1234567.890123    |
|                 |                 | and a dot is used for the decimal mark.         |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| English         | ``en``          | Positive powers of 1000 are separated with      | 1,234,567.890123  |
|                 |                 | commas, and a dot is used for the decimal mark. |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| SI (English)    | ``si-en``       | Powers of 1000 are separated with spaces,       | 1 234 567.890 123 |
|                 |                 | and a dot is used for the decimal mark.         |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| SI (French)     | ``si-fr``       | Powers of 1000 are separated with spaces,       | 1 234 567,890 123 |
|                 |                 | and a comma is used for the decimal mark.       |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| Continental     | ``eu``          | Positive powers of 1000 are separated with      | 1.234.567,890123  |
|                 |                 | dots, and a comma is used for the decimal mark. |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| Continental     | ``plain-eu``    | Powers of 1000 are not separated,               | 1234567,890123    |
| (plain)         |                 | and a comma is used for the decimal mark.       |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| Swiss           | ``ch``          | Positive powers of 1000 are separated with      | 1'234'567.890123  |
|                 |                 | apostrophes, and a dot is used for the          |                   |
|                 |                 | decimal mark.                                   |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| Indian          | ``in``          | Groups of digits in the integer part are        | 12,34,567.890123  |
|                 |                 | separated with commas.                          |                   |
|                 |                 | The rightmost group is three digits, and other  |                   |
|                 |                 | digits are grouped in pairs.                    |                   |
|                 |                 | A dot is used for the decimal mark.             |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+
| Scientific      | ``scientific``  | A mantissa between 1 and 10, formatted using    | 1.234567e+6       |
|                 |                 | the 'plain' style, then the letter 'e',         |                   |
|                 |                 | followed by a signed integer exponent.          |                   |
+-----------------+-----------------+-------------------------------------------------+-------------------+

.. warning::
    Note that some styles conflict with each other: for example, ``1.234`` is a number between 1 and 2 in English, while it's the integer 1234 in French. 

In the JavaScript runtime, these styles are defined in ``Numbas.util.numberNotationStyles``.

Numbers in JME
--------------

In :ref:`jme` code, and :ref:`mathematical-expression` parts, numbers are written in the "English (plain)" form **only**.

You can parse a string representing a number written in a different style using the :jme:func:`parsenumber` function, and display it using a particular style using the :jme:func:`formatnumber` function, or by giving a style code to :jme:func:`dpformat` or :jme:func:`sigformat`.
