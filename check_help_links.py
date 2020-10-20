#!/usr/bin/env python
import os
from pathlib import Path
import re

DOC_ROOT = Path('build-docs/html')
pages = {}
def has_anchor(page,anchor):
    if page in pages:
        text = pages[page]
    else:
        path = DOC_ROOT / page
        if not path.exists():
            return False
        with open(path) as f:
            text = pages[page] = f.read()
    return (not anchor) or 'id="{}"'.format(anchor) in text

re_url = re.compile(r"help_url='(?P<page>[^{]*?)(?:#(?P<anchor>.*?))?'",re.M)
re_url2 = re.compile(r'{{HELP_URL}}([^{]*?\.html.*?)(?:#(.*?))?"',re.M)
re_url3 = re.compile(r"helplink '([^{]*?\.html.*?)(?:#(.*?))?'",re.M)

found_bad = []

for r,ds,fs in os.walk('editor/templates'):
    for f in fs:
        path = Path(r) / f
        with open(path) as f:
            text = f.read()
        help_urls = re_url.findall(text)+re_url2.findall(text)+re_url3.findall(text)
        bads = [m for m in help_urls if not has_anchor(*m)]
        if bads:
            found_bad.append((path,bads))
            
if found_bad:
    print("The following page{s} refer{nots} to parts of the documentation that don't exist:\n".format(s='s' if len(found_bad)!=1 else '', nots='s' if len(found_bad)==1 else ''))
    for path,bads in found_bad:
        print(path)
        for page,anchor in bads:
            print('  {}#{}'.format(page,anchor))
        print('')
else:
    print("All help links are correct.")
