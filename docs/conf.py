# -*- coding: utf-8 -*-
#
import os
import sys

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))


# -- Project information -----------------------------------------------------

project = 'Numbas'
copyright = '2012-2021, Newcastle University'

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = ['sphinx.ext.intersphinx', 'sphinx.ext.todo', 'sphinx.ext.coverage', 'sphinx.ext.mathjax', 'sphinx.ext.ifconfig', 'sphinx.ext.viewcode', 'video']


def setup(app):
    from JMEDomain import JMEDomain
    app.add_domain(JMEDomain)
    app.add_css_file('numbas-style.css')

templates_path = ['_templates']

version = '7.3'
release = '7.3'

html_theme = 'sphinx_book_theme'

html_logo = '_static/images/numbas-logo-large.png'

html_static_path = ['_static']

html_theme_options = {
    'use_fullscreen_button': False,
    'use_issues_button': False,
    'repository_url': 'https://github.com/numbas/editor',
    'repository_branch': 'master',
    'use_repository_button': True,
    'use_edit_page_button': True,
    'path_to_docs': 'docs/',
}

todo_emit_warnings = True
