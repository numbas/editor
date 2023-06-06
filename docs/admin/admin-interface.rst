.. _admin-interface:

Using the admin interface
=========================
The admin interface can be accessed through ``/admin`` which opens the `Django <https://www.djangoproject.com/>`__ admin interface

.. image:: images/admin-interface-base.png
   :alt: The admin interface.

Here, you can alter many options about the editor.

Installing extensions
---------------------

To install extensions directly to the editor, use the ``extensions`` tab. 
From here you can add new extensions or alter current ones. 

.. image:: images/admin-extensions.png
   :alt: The menu to add an extension.

The name can be anything but the short name must match that used in the python file within the extension.

Ensure that you tick the 'public' checkbox if you want the extension to be universally available.

You may choose any number of authors from the users who are able to edit the extension within the editor itself.

Upload the extension package - this should at minimum contain a ``.js`` file matching the short name.

Upon Saving the extension, it will become available for use within your editor.

Downloading extensions from github
----------------------------------

The extension packages for first-party extensions can be obtained from the `Numbas page on github <https://github.com/numbas?q=numbas-extension>`__

The package is obtained via downloading the zip of the github repository. 
This can then be directly uploaded as above or within the editor - ensure that the short name matches the ``.js`` in the package folder.

.. image:: images/extension-git.png
   :alt: Downloading a zip of an extension from github via the drop-down beside 'Code' and clicking 'Download Zip'.
