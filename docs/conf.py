# -*- coding: utf-8 -*-
#
import sys, os

extensions = ['sphinx.ext.intersphinx', 'sphinx.ext.todo', 'sphinx.ext.coverage', 'sphinx.ext.mathjax', 'sphinx.ext.ifconfig', 'sphinx.ext.viewcode']

def setup(app):
    sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
    from JMEDomain import JMEDomain
    app.add_domain(JMEDomain)
    app.add_stylesheet('numbas-style.css')

templates_path = ['_templates']

source_suffix = '.rst'

master_doc = 'index'

project = u'Numbas'
copyright = u'2012-2018, Newcastle University'

version = '3.1'
release = '3.1'

import sphinx_rtd_theme
html_theme = 'sphinx_rtd_theme'
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]

html_logo = '_static/images/numbas-logo-large.png'

html_static_path = ['_static']

htmlhelp_basename = 'Numbaseditordoc'

latex_elements = {
	'papersize': 'a4paper',
	'fontpkg': """\usepackage{cmbright}""",
}

latex_documents = [
  ('index', 'Numbaseditor.tex', u'Numbas editor Documentation',
   u'Newcastle University', 'manual'),
]

man_pages = [
    ('index', 'numbaseditor', u'Numbas editor Documentation',
     [u'Newcastle University'], 1)
]

texinfo_documents = [
  ('index', 'Numbaseditor', u'Numbas editor Documentation',
   u'Newcastle University', 'Numbaseditor', 'One line description of project.',
   'Miscellaneous'),
]

epub_title = u'Numbas editor'
epub_author = u'Newcastle University'
epub_publisher = u'Newcastle University'
epub_copyright = u'2012-2018, Newcastle University'

todo_emit_warnings = True
