from contextlib import redirect_stdout
import argparse
import io
import json
import os, sys
from pathlib import Path, PurePath
import re
import subprocess
import urllib

class Command(object):

    sqlite_template = """DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.{DB_ENGINE}',
        'NAME': os.path.join(BASE_DIR, '{DB_NAME}'),
    }}
}}"""

    other_db_template = """DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.{DB_ENGINE}',
        'NAME': '{DB_NAME}',
        'USER': '{DB_USER}',
        'PASSWORD': '{DB_PASSWORD}',
        'HOST': '{DB_HOST}',
    }}
}}"""

    def __init__(self,dev, values, rvalues):
        self.written_files = []
        self.dev=dev=="True"
        self.values=values
        self.rvalues=rvalues


    def run_management_command(self,*args, **kwargs):
                
        #f = io.StringIO()
        #with redirect_stdout(f):
        from django.core.management import ManagementUtility
        args = ['manage.py'] + list(args)
        utility = ManagementUtility(args)
        try:
            utility.execute()
        except SystemExit:
            pass #Todo: catch error here!

        #result = f.getvalue()
        #print(result)

        #return result

    def setup_site(self):
        from django.contrib.sites.models import Site
        try:
            domain = Site.objects.first().domain
        except Site.DoesNotExist:
            domain = 'localhost' if self.dev else 'numbas.example.com'

        if not self.dev:
            domain = self.rvalues['DOMAIN']

        try:
            url = urllib.parse.urlparse(domain)
            self.domain = url.netloc if url.netloc else domain
        except ValueError:
            self.domain = domain

        s, created = Site.objects.get_or_create(domain=self.domain)
        s.name = self.values['SITE_TITLE']
        self.rvalues['SITE_ID'] = str(s.id)
        s.save()

        self.sub_settings()

        import numbas.settings
        importlib.reload(numbas.settings)

    def sub_settings(self, confirm_overwrite=True):
        def set_database(m, rvalues):
            template = self.sqlite_template if 'sqlite' in rvalues['DB_ENGINE'] else self.other_db_template
            return template.format(**rvalues)

        settings_subs = [
            (r"^DEBUG = (True)", 'DEBUG'),
            (r"'NUMBAS_PATH': '(.*?)',", 'NUMBAS_PATH'),
            (r"^STATIC_ROOT = '(static/)'", 'STATIC_ROOT'),
            (r"^MEDIA_ROOT = '(media/)'", 'MEDIA_ROOT'),
            (r"'PREVIEW_PATH': '(.*?)'", 'PREVIEW_PATH'),
            (r"'PREVIEW_URL': '(.*?)',", 'PREVIEW_URL'),
            (r"'PYTHON_EXEC': '(.*?)',", 'PYTHON_EXEC'),
            (r"^SITE_TITLE = '(.*?)'", 'SITE_TITLE'),
            (r"^DATABASES = {.*?^}", set_database),
            (r"^SECRET_KEY = '(.*?)'", 'SECRET_KEY'),
            (r"^ALLOW_REGISTRATION = (True|False)", 'ALLOW_REGISTRATION'),
            (r"^DEFAULT_FROM_EMAIL = '(.*?)'", 'DEFAULT_FROM_EMAIL'),
            (r"^SITE_ID = (\d+)", 'SITE_ID'),
        ]
        self.sub_file(Path('numbas', 'settings.py'), settings_subs, confirm_overwrite)

    def sub_file(self, fname, subs, confirm_overwrite=True):
        self.written_files.append(str(fname))

        with open(str(fname)+'.dist') as f:
            text = f.read()

        for pattern, key in subs:
            pattern = re.compile(pattern, re.MULTILINE | re.DOTALL)
            if callable(key):
                text = self.sub_fn(text, pattern, key)
            else:
                text = self.sub(text,pattern,self.rvalues[key])

        with open(fname,'w') as f:
            f.write(text)

    def sub_fn(self, source, pattern, fn):
        m = pattern.search(source)
        if not m:
            raise Exception("Didn't find {}".format(pattern.pattern))
        start, end = m.span(0)
        out = fn(m, self.rvalues)
        return source[:start]+out+source[end:]

    def sub(self, source, pattern, value):
        def fix(m):
            t = m.group(0)
            start, end = m.span(1)
            ts,te = m.span(0)
            start -= ts
            end -= ts
            return t[:start]+value+t[end:]
        if not pattern.search(source):
            raise Exception("Didn't find {}".format(pattern.pattern))
        return pattern.sub(fix, source)


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "numbas.settings")
    parser = argparse.ArgumentParser()
    parser.add_argument("dev",help="whether the installation is for development",type=bool)
    parser.add_argument("values")
    parser.add_argument("rvalues")
    args=parser.parse_args()
    values=json.loads(args.values)
    rvalues=json.loads(args.rvalues)
    command=Command(args.dev,values, rvalues)

    import django
    import django.conf
    import importlib
    importlib.reload(django)
    importlib.reload(django.conf)
    django.setup()
    command.setup_site()

    from django.contrib.auth.models import User
    superusers = User.objects.filter(is_superuser=True)

    if command.values['DEBUG']!="True":
        command.run_management_command('collectstatic', '-noinput')
    #print(str(superusers.exists()))
    
    if command.values['SU_CREATE']=='True': 
        u=User.objects.create_superuser(command.values['SU_NAME'], command.values['SU_EMAIL'], command.values['SU_PASS'])
        u.first_name = command.values['SU_FIRST_NAME']
        u.last_name = command.values['SU_LAST_NAME']
        u.save()
    
    print(str(command.domain)) #must remain the last thing passed back
