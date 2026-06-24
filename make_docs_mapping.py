from sphinx.util.inventory import InventoryFile
import json

with open('build-docs/html/objects.inv', 'rb') as f:
    raw_data = f.read()

f = InventoryFile.loads(raw_data, uri='')

data = {k: v.uri for p, cat in f.data.items() for k, v in cat.items()}

print(json.dumps(data, indent=4))
