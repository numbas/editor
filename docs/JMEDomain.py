import re

from docutils import nodes
from docutils.parsers.rst.directives import flag
from sphinx import addnodes
from sphinx.roles import XRefRole
from sphinx.locale import _
from sphinx.domains import Domain, ObjType
from sphinx.directives import ObjectDescription
from sphinx.util.nodes import make_refnode
from sphinx.util.docfields import Field, TypedField


jme_sig_re = re.compile(
    r'''^ ((?:\$?[a-zA-Z_][a-zA-Z0-9_]*'*)|\?|[π∞])               # thing name
          (?: \((.*)\)                  # optional: arguments
          )? $                          # and nothing more
          ''', re.VERBOSE)

space_re = re.compile(r'\s+')
bracket_re = re.compile(r'[\[\]()]')
name_re = re.compile(r'''((?:\$?[a-zA-Z_][a-zA-Z0-9_]*'*)|\?|[π∞])|\W[^\s\[\]()\w]*''')

class opname(nodes.Part, nodes.Inline, nodes.FixedTextElement):
    pass

def op_parse_arglist(signode, sig, fullname):
    while len(sig)>0:
        ms = space_re.match(sig)
        if ms:
            signode += nodes.Text('\u00A0'*len(ms.group(0)))
            sig = sig[ms.end():]
            continue
        mb = bracket_re.match(sig)
        if mb:
            signode += nodes.Text(mb.group(0))
            sig = sig[mb.end():]
            continue
        mn = name_re.match(sig)
        if mn:
            name = mn.group(0)
            if name == fullname:
                signode += addnodes.desc_name(name,name)
            else:
                signode += nodes.emphasis(name,name)
            sig = sig[mn.end():]
            continue
        signode += nodes.Text(sig[0])
        sig = sig[1:]

def _pseudo_parse_arglist(signode, arglist):
    """"Parse" a list of arguments separated by commas.

    Arguments can have "optional" annotations given by enclosing them in
    brackets.  Currently, this will split at any comma, even if it's inside a
    string literal (e.g. default argument value).
    """
    paramlist = addnodes.desc_parameterlist()
    stack = [paramlist]
    try:
        for argument in arglist.split(','):
            argument = argument.strip()
            ends_open = ends_close = 0
            while argument.startswith('['):
                stack.append(addnodes.desc_optional())
                stack[-2] += stack[-1]
                argument = argument[1:].strip()
            while argument.startswith(']'):
                stack.pop()
                argument = argument[1:].strip()
            while argument.endswith(']'):
                ends_close += 1
                argument = argument[:-1].strip()
            while argument.endswith('['):
                ends_open += 1
                argument = argument[:-1].strip()
            if argument:
                stack[-1] += addnodes.desc_parameter(argument, argument)
            while ends_open:
                stack.append(addnodes.desc_optional())
                stack[-2] += stack[-1]
                ends_open -= 1
            while ends_close:
                stack.pop()
                ends_close -= 1
        if len(stack) != 1:
            raise IndexError
    except IndexError:
        # if there are too few or too many elements on the stack, just give up
        # and treat the whole argument list as one argument, discarding the
        # already partially populated paramlist node
        signode += addnodes.desc_parameterlist()
        signode[-1] += addnodes.desc_parameter(arglist, arglist)
    else:
        signode += paramlist


class JMEObject(ObjectDescription):
    options_spec = {}

    doc_field_types = [
        TypedField('parameter', label=_('Parameters'),
                   names=('param', 'parameter', 'arg', 'argument'),
                   typerolename='obj', typenames=('paramtype', 'type'),
                   can_collapse=True),
        Field('returnvalue', label=_('Returns'), has_arg=False,
              names=('returns', 'return')),
        Field('returntype', label=_('Return type'), has_arg=False,
              names=('rtype',)),
    ]

    def get_signature_prefix(self, sig):
        """May return a prefix to put before the object name in the
        signature.
        """
        return ''

    def needs_arglist(self):
        """May return true if an empty argument list is to be generated even if
        the document contains none.
        """
        True

    def handle_signature(self, sig, signode):
        """Transform a JME signature into RST nodes.

        Return (fully qualified name of the thing, classname if any).
        """
        if self.options.get('op'):
            fullname = self.options['op']
            name = sig
            arglist = []
            signode['fullname'] = fullname
            op_parse_arglist(signode, sig, fullname)
            return fullname, ''

        m = jme_sig_re.match(sig)
        if m is None:
            raise ValueError
        name, arglist = m.groups()

        fullname = name

        signode['fullname'] = fullname

        signode += addnodes.desc_name(name, name)
        if not arglist:
            if self.needs_arglist():
                # for callables, add an empty parameter list
                signode += addnodes.desc_parameterlist()
            return fullname, ''

        _pseudo_parse_arglist(signode, arglist)
        return fullname, ''

    def get_index_text(self, name):
        """Return the text for the index entry of the object."""
        raise NotImplementedError('must be implemented in subclasses')

    def add_target_and_index(self, name_cls, sig, signode):
        fullname = self.get_fullname(name_cls)
        # note target
        if fullname not in self.state.document.ids:
            signode['names'].append(fullname)
            signode['ids'].append(fullname)
            signode['first'] = (not self.names)
            self.state.document.note_explicit_target(signode)
            objects = self.env.domaindata['jme']['objects']
            if fullname in objects:
                self.state_machine.reporter.warning(
                    'duplicate object description of %s, ' % fullname +
                    'other instance in ' +
                    self.env.doc2path(objects[fullname][0]) +
                    ', use :noindex: for one of them',
                    line=self.lineno)
            objects[fullname] = (self.env.docname, self.objtype)

        indextext = self.get_index_text(name_cls)
        if indextext:
            self.indexnode['entries'].append(('single', indextext, fullname, False, ''))

class JMEFunction(JMEObject):
    """
    Description of a JME function
    """
    option_spec = {
        'op': str,
        'keywords': str,
        'noexamples': str,
    }

    def needs_arglist(self):
        return self.options.get('op') is None

    def get_index_text(self, name_cls):
        return name_cls[0]

    def get_fullname(self, name_cls):
        return name_cls[0]

class JMEData(JMEObject):
    """
    Description of a JME data element (type, variable or constant)
    """

    def needs_arglist(self):
        return False

    def get_index_text(self, name_cls):
        return name_cls[0]

    def handle_signature(self, sig, signode):
        """Transform a JME signature into RST nodes.

        Return (fully qualified name of the thing, classname if any).
        """
        m = jme_sig_re.match(sig)
        if m is None:
            raise ValueError
        name, _ = m.groups()
        signode['fullname'] = name
        signode += addnodes.desc_name(name, name)
        return name, ''

    def get_fullname(self, name_cls):
        return name_cls[0]

class JMEVariable(JMEData):

    def get_fullname(self, name_cls):
        return name_cls[0]


class JMEXRefRole(XRefRole):
    def process_link(self, env, refnode, has_explicit_title, title, target):
        return title, target


class JMEDomain(Domain):
    """JME domain."""
    name = 'jme'
    label = 'JME'
    object_types = {
        'function': ObjType(_('function'), 'func', 'obj'),
        'data': ObjType(_('data'), 'data', 'obj'),
        'variable': ObjType(_('variable'), 'var', 'obj'),
    }

    directives = {
        'function': JMEFunction,
        'data': JMEData,
        'variable': JMEVariable,
    }
    roles = {
        'func':  JMEXRefRole(fix_parens=False),
        'data':  JMEXRefRole(),
        'var': JMEXRefRole(),
    }
    initial_data = {
        'objects': {},  # fullname -> docname, objtype
    }

    def clear_doc(self, docname):
        for fullname, (fn, _) in list(self.data['objects'].items()):
            if fn == docname:
                del self.data['objects'][fullname]

    def find_obj(self, name):
        objects = self.data['objects']
        if name in objects:
            return [(name,objects[name])]
        else:
            return []

    def resolve_xref(self, env, fromdocname, builder,
                     type, target, node, contnode):
        matches = self.find_obj(target)
        if not matches:
            return None
        elif len(matches) > 1:
            env.warn_node(
                'more than one target found for cross-reference '
                '%r: %s' % (target, ', '.join(match[0] for match in matches)),
                node)
        name, obj = matches[0]

        return make_refnode(builder, fromdocname, obj[0], name, contnode, name)

    def get_objects(self):
        for refname, (docname, type) in self.data['objects'].items():
            yield (refname, refname, type, docname, refname, 1)

def setup(app):
    app.add_domain(JMEDomain)
