from slugify import slugify as _slugify
import emoji

def slugify(s):
    s = emoji.demojize(s)
    slug = _slugify(s, algorithm='modern')
    if slug:
        return slug
    else:
        return '_nothing_'
