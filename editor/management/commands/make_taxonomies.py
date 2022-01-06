from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import re
from editor.models import Taxonomy, TaxonomyNode

class Command(BaseCommand):
    help = 'Create taxonomies'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str)

    def handle(self, *args, **options):
        filename = options['file']
        structure = (0,'',[])
        stack = []

        with open(filename) as f:
            for line in f:
                indentation = len(re.match(r'^ *',line)[0])//4
                name = line.strip()
                if not name:
                    continue

                ci, _, children = structure

                nstructure = (indentation+1,name,[])
                if indentation>ci:
                    stack.append(structure)
                    structure = children[-1]
                elif indentation<ci:
                    while structure[0]>indentation:
                        structure = stack.pop()
                ci, _, children = structure
                children.append(nstructure)

        _,_, taxonomies = stack[0]

        def make_node(taxonomy,parent,structure,code):
            _,name,children = structure
            node = TaxonomyNode.objects.create(taxonomy=taxonomy, parent=parent, name=name, code=code)
            for i,c in enumerate(children):
                make_node(taxonomy, node, c, code+'.'+str(i+1))

        for _,name,children in taxonomies:
            t = Taxonomy.objects.create(name=name)
            for i,c in enumerate(children):
                make_node(t,None,c,str(i+1))
