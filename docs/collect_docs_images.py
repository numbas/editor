import os
from jinja2 import Environment, BaseLoader
from pathlib import Path

raw_template = """
<!doctype html>
<html>
<head>
<style>
* {
box-sizing: border-box;
}
img {
max-width: 30em;
max-height: 30em;
}
input {
display: block;
width: 100%;
}
li {
margin-bottom: 5em;
border: 1px solid black;
}
</style>
<body>
<ul>
    {% for name, image in images %}
    <li>
        <img src="{{name}}">
        <input disabled value="{{image}}">
    </li>
    {% endfor %}
</ul>
</body>
</html>
"""

template = Environment(loader=BaseLoader).from_string(raw_template)

docs_root = Path('.')
output_root = Path('../build-docs', 'html', '_images')

def find_images():
    for root, dirs, files in os.walk(docs_root):
        for f in files:
            fp = Path(root) / f
            if fp.suffix.lower() in ['.png','jpg','.gif']:
                yield (fp.name, fp)

images = list(sorted(find_images()))

with open(output_root / 'list.html', 'w') as f:
    f.write(template.render({'images':images}))
