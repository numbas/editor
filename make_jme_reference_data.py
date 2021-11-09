from docutils.parsers import rst

from collections import OrderedDict
from docutils import nodes
from docutils.core import publish_parts
from docutils.parsers.rst import Directive, directives, roles
from docutils.parsers.rst.directives import body, misc
from docutils.parsers import rst
import docutils
import io
from docutils.nodes import NodeVisitor
import json
from pathlib import Path

class JMEFunction(nodes.container):
    pass

class JMEFunctionDirective(Directive):

    required_arguments = 0
    optional_arguments = 0
    final_argument_whitespace = True
    option_spec = {'op': str, 'keywords': str}
    has_content = True

    def run(self):
        # Raise an error if the directive does not have contents.
        self.assert_has_content()
        text = '\n'.join(self.content)
        # Create the admonition node, to be populated by `nested_parse`.
        name = self.options.get('op')
        calling_patterns = []
        for line in self.content:
            line = line.strip()
            if line == '':
                break
            calling_patterns.append(line)
#        if self.options.get('keywords') is None:
#            import sys
#            sys.stdout.write(self.content[0]+'\n')
        keywords = [x.strip() for x in self.options.get('keywords','').split(',')]
        if name is None:
            name = self.content[0]
            if '(' in name:
                name = name[:name.find('(')]
        node = JMEFunction(rawsource=text, fn_name=name, fn_keywords=keywords, fn_calling_patterns=calling_patterns)
        # Parse the directive contents.
        self.state.nested_parse(self.content, self.content_offset,
                                node)
        return [node]
    
class notest(nodes.Inline, nodes.TextElement):
    tagname = 'notest'
    
    pass

def notest_role(role, rawtext, text, lineno, inliner, options={}, content=[]):
    roles.set_classes(options)
    i = rawtext.find('`')
    text = rawtext.split('`')[1]
    node = notest(rawtext, text, **options)
    return [node], []

class Role(misc.Role):

    def run(self):
        """Dynamically create and register a custom interpreted text role."""
        if self.content_offset > self.lineno or not self.content:
            raise self.error('"%s" directive requires arguments on the first '
                             'line.' % self.name)
        args = self.content[0]
        match = self.argument_pattern.match(args)
        if not match:
            raise self.error('"%s" directive arguments not valid role names: '
                             '"%s".' % (self.name, args))
        new_role_name = match.group(1)
        if new_role_name == 'no-test':
            return []
        return super().run()
    
class ref(nodes.Inline, nodes.TextElement):
    tagname = 'ref'

    pass

def ref_role(role, rawtext, text, lineno, inliner, options={}, content=[]):
    roles.set_classes(options)
    text = rawtext.split('`')[1]
    i = text.find(' <')
    if i>=0:
        text = text[:i]
    node = ref(rawtext, text, **options)
    return [node], []

def jme_function_role(role, rawtext, text, lineno, inliner, options={}, content=[]):
    roles.set_classes(options)
    text = rawtext.split('`')[1]
    node = nodes.literal(rawtext, text, **options)
    return [node], []

def data_role(role, rawtext, text, lineno, inliner, options={}, content=[]):
    roles.set_classes(options)
    text = rawtext.split('`')[1]
    node = nodes.literal(rawtext, text, **options)
    return [node], []

directives.register_directive('role', Role)
directives.register_directive('jme:function', JMEFunctionDirective)
roles.register_local_role('jme:func', jme_function_role)
directives.register_directive('no-test', notest)
roles.register_local_role('no-test', notest_role)
roles.register_local_role('data', data_role)
roles.register_local_role('ref', ref_role)

def is_example(node):
    for v in node.traverse():
        if isinstance(v,nodes.Text) and 'Example' in v:
            return True
    return False

def grab_text(node):
    t = ''
    for n in node.traverse():
        if isinstance(n,nodes.Text):
            t += n
    return t

class SimpleNodeVisitor(NodeVisitor):
    def unknown_visit(self,node):
        pass
            
    def unknown_departure(self,node):
        pass

class ExampleVisitor(SimpleNodeVisitor):
    expr = None
    has_output = False
    output = None
    notest = False
    
    def __init__(self,*args,**kwargs):
        self.examples = []
        super().__init__(*args,**kwargs)
    
    def visit_list_item(self, node):
        self.expr = None
        self.has_output = False
        self.output = None
        self.notest = False
        
    def depart_list_item(self, node):
        if self.expr and self.has_output and self.output and not self.notest:
            self.examples.append(OrderedDict([('in', self.expr), ('out', self.output)]))
        
    def visit_literal(self, node):
        if not self.expr:
            self.expr = grab_text(node)
        elif not self.output:
            self.output = grab_text(node)
        
    def visit_Text(self, node):
        if '→' in node:
            self.has_output = True
        
    def visit_notest(self, node):
        self.notest = True
    
class GetTitleVisitor(SimpleNodeVisitor):
    title = None
    
    def visit_title(self,node):
        if not self.title:
            self.title = grab_text(node)
    
class DescriptionVisitor(SimpleNodeVisitor):
    description = ''

    def visit_literal(self, node):
        self.description += '<code>'

    def depart_literal(self, node):
        self.description += '</code>'

    def visit_Text(self, node):
        self.description += str(node)

    def visit_title_reference(self,node):
        self.description += str(node)

    def visit_strong(self,node):
        self.description += '<strong>'

    def depart_strong(self,node):
        self.description += '</strong>'

    def visit_emphasis(self,node):
        self.description += '<em>'

    def depart_emphasis(self,node):
        self.description += '</em>'

    def visit_math(self, node):
        self.description += '$'

    def depart_math(self, node):
        self.description += '$'

class MyVisitor(SimpleNodeVisitor):
    current_function = None
    description = ''
    desc_paragraph_counter = 0

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.fns = []
        self.keywords = []

    def visit_JMEFunction(self, node: docutils.nodes.reference) -> None:
        name = node.attributes.get('fn_name')
        self.description = ''
        self.current_function = name
        self.desc_paragraph_counter = 0
        self.keywords = node.attributes.get('fn_keywords',[])
        self.calling_patterns = node.attributes.get('fn_calling_patterns',[])
            
    def depart_JMEFunction(self, node):
        if self.current_function:
            self.fns.append({
                'name': self.current_function, 
                'description': self.description, 
                'keywords': self.keywords,
                'calling_patterns': self.calling_patterns,
            })
        self.current_function = None
        self.examples = []

    def visit_paragraph(self, node):
        self.desc_paragraph_counter += 1
        if self.desc_paragraph_counter == 2:
            dv = DescriptionVisitor(self.document)
            node.walkabout(dv)
            self.description = dv.description
    
def read_file(p):
    relative_path = p.relative_to(docs_path).with_suffix('')
    with open(p) as f:
        source = f.read()
        parser = rst.Parser()
        opts = docutils.frontend.OptionParser(
                            components=(docutils.parsers.rst.Parser,)
                            )
        settings = opts.get_default_values()
        warning_stream = io.StringIO("")
        settings.update({'warning_stream': warning_stream},opts)
        document = docutils.utils.new_document(source, settings)
        res = parser.parse(source, document)
        v = MyVisitor(document)
        document.walkabout(v)

        for fn in v.fns:
            fn['doc'] = str(relative_path)

        return v.fns[:]

docs_path = Path('docs')

fns = []

for p in docs_path.rglob('*.rst'):
    fns += read_file(p)

print(json.dumps(fns,indent=4))
