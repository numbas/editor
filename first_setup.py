import random
import re
import os

def print_notice(s):
    print('\033[92m'+s+'\033[0m\n')

class Command(object):

    questions = [
        ('DEBUG', 'Is this installation for development?', False),
        ('NUMBAS_PATH', 'Path of the Numbas compiler:','/srv/numbas/compiler/'),
        ('DB_ENGINE', 'Which database engine are you using?', 'sqlite3'),
        ('STATIC_ROOT', 'Where are static files stored?','/srv/numbas/static/'),
        ('MEDIA_ROOT', 'Where are uploaded files stored?','/srv/numbas/media/'),
        ('PREVIEW_PATH', 'Where are preview exams stored?','/srv/numbas/previews/'),
        ('PREVIEW_URL', 'Base URL of previews:','/previews/'),
        ('PYTHON_EXEC', 'Python command:','python3'),
        ('SITE_TITLE', 'Title of the site:','Numbas'),
        ('ALLOW_REGISTRATION', 'Allow users to register themselves?', True),
    ]
    db_questions = [
        ('DB_NAME', 'Name of the database:','numbas_editor'),
        ('DB_USER', 'Database user:', 'numbas_editor'),
        ('DB_PASSWORD', 'Database password:', ''),
        ('DB_HOST', 'Database host:', 'localhost'),
    ]

    sqlite_template = """DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.{DB_ENGINE}',
        'NAME': os.path.join(BASE_DIR, '{DB_NAME}'),
    }}
}}"""

    other_db_template = """DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.{DB_ENGINE}',
        'NAME': '{{DB_NAME}}',
        'USER': '{{DB_USER}}',
        'PASSWORD': '{{DB_PASSWORD}}',
        'HOST': '{{DB_HOST}}',
    }}
}}"""

    def __init__(self):
        self.written_files = []

    def handle(self):
        print_notice("This script will configure the Numbas editor up to a point where you can open it in a web browser, based on your answers to the following questions.")

        self.get_values()

        self.write_files()

        self.run_management_command('check')

        if self.get_input('Would you like to automatically set up the database now?',True):
            self.run_management_command('migrate')

        if self.get_input('Would you like to create an admin user now?',True):
            self.run_management_command('createsuperuser')

        print_notice("Done!")

        if self.values['DEBUG']:
            print_notice("Run\n  python manage.py runserver\nto start a development server at http://localhost:8000.")
        else:
            self.run_management_command('collectstatic')
            print_notice("The Numbas editor is now set up. Once you've configured your web server, it'll be ready to use.")

    def get_values(self):
        self.values = {}

        self.values['SECRET_KEY'] =''.join(random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50))
        self.values['PWD'] = os.getcwd()

        for key, question, default in self.questions:
            self.get_value(key,question,default)
            if key=='DB_ENGINE':
                if 'sqlite' not in self.values[key]:
                    for key,question,default in self.db_questions:
                        self.get_value(key,question,default)
                else:
                    self.values['DB_NAME'] = self.get_input('Name of the database file:','db.sqlite3')

        def enrep(value):
            rep = repr(value)
            if isinstance(value,str):
                rep = rep[1:-1]
            return rep

        self.rvalues = {key: enrep(value) for key, value in self.values.items()}

    def get_value(self, key, question, default):
        if os.path.exists('numbas/settings.py'):
            import numbas.settings
            try:
                default = getattr(numbas.settings,key)
            except AttributeError:
                if key in numbas.settings.GLOBAL_SETTINGS:
                    default = numbas.settings.GLOBAL_SETTINGS[key]
                elif key=='DB_ENGINE':
                    default = numbas.settings.DATABASES['default']['ENGINE'].replace('django.db.backends.','')
                elif key[:3]=='DB_' and key[3:] in numbas.settings.DATABASES['default']:
                    default = numbas.settings.DATABASES['default'][key[3:]]
        self.values[key] = self.get_input(question,default)


    def write_files(self):

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
            (r"^SITE_TITLE = '(Numbas)'", 'SITE_TITLE'),
            (r"^DATABASES = {.*^}", set_database),
            (r"^SECRET_KEY = '()'", 'SECRET_KEY'),
            (r"^ALLOW_REGISTRATION = (True)", 'ALLOW_REGISTRATION')
        ]
        self.sub_file('numbas/settings.py', settings_subs)

        if not self.values['DEBUG']:
            self.sub_file('web/django.wsgi',[ (r"sys.path.append\('(.*?)'\)", 'PWD') ])

        index_subs = [
            (r"Welcome to (the Numbas editor)", 'SITE_TITLE'),
        ]
        self.sub_file('editor/templates/index_message.html', index_subs)
        self.sub_file('editor/templates/terms_of_use.html', [])

        if len(self.written_files):
            print_notice("The following files have been written. You should look at them now to see if you need to make any more changes.")
            for f in self.written_files:
                print_notice(' * '+f)
            print('')

    def sub_file(self, fname, subs):
        if os.path.exists(fname):
            overwrite = self.get_input("{} already exists. Overwrite it?".format(fname),False)
            if not overwrite:
                return

        self.written_files.append(fname)

        with open(fname+'.dist') as f:
            text = f.read()

        for pattern, key in subs:
            pattern = re.compile(pattern, re.MULTILINE | re.DOTALL)
            if callable(key):
                self.sub_fn(text, pattern, key)
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

    def run_management_command(self, *args):
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "numbas.settings")
        from django.core.management import ManagementUtility
        args = ['manage.py'] + list(args)
        utility = ManagementUtility(args)
        try:
            utility.execute()
        except SystemExit:
            pass

    def get_input(self, question, default):
        v = None
        try:
            while v is None:
                if isinstance(default,bool):
                    if default is not None:
                        q = question+(' [Y/n]' if default else ' [y/N]')
                    else:
                        q = question
                    t = input(q+' ').strip().lower()
                    if t=='' and default is not None:
                        v = default
                    if t=='y':
                        v = True
                    if t=='n':
                        v = False
                else:
                    if default is not None:
                        q = "{} ['{}']".format(question,str(default))
                    else:
                        q = question
                    t = input(q+' ').strip()
                    if t=='' and default is not None:
                        v = default
                    if t:
                        v = t
        except KeyboardInterrupt:
            print('')
            raise SystemExit
        print('')
        return v
            

if __name__ == '__main__':
    command = Command()
    command.handle()
