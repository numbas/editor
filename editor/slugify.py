import uuslug
import emoji

def slugify(s):
    s = emoji.demojize(s)
    slug = uuslug.slugify(s)
    if slug:
        return slug
    else:
        return '_nothing_'
