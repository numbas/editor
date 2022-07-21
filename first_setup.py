import random
import re
import os
import traceback
import urllib.parse
import importlib
import pathlib

def print_notice(s):
    print('\033[92m'+s+'\033[0m\n')

def path_exists(path):
    path = pathlib.Path(path)
    if not path.exists():
        answer = input("That path doesn't exist. Create it? [y/n]").strip().lower()
        if answer=='y':
            path.mkdir(parents=True, exist_ok=True)
            return True
        else:
            return False
    else:
        return True

class Question(object):
    def __init__(self, key, question, default, validation=None):
        self.key = key
        self.question = question
        self.default = default
        self.validation = validation

    def get_default(self, values):
        if callable(self.default):
            return self.default(values)
        else:
            return self.default

    def validate(self, value):
        return self.validation is None or self.validation(value)

class Command(object):

    dev = False

    dev_question = Question('DEBUG', 'Is this installation for development?', False)

    dev_values = {
        'DB_ENGINE': 'sqlite3',
        'DB_NAME': 'db.sqlite3',
        'PYTHON_EXEC': 'python3',
        'STATIC_ROOT': 'editor/static',
        'MEDIA_ROOT': 'media',
        'PREVIEW_PATH': 'editor/static/previews',
        'PREVIEW_URL': '/static/previews/',
        'SITE_TITLE': 'Numbas development',
        'ALLOW_REGISTRATION': True,
        'DEFAULT_FROM_EMAIL': '',
    }

    questions = [
        Question('NUMBAS_PATH', 'Path of the Numbas compiler:','/srv/numbas/compiler/', validation=path_exists),
        Question('DB_ENGINE', 'Which database engine are you using? (Common options: postgres, mysql, sqlite3)', lambda v: 'sqlite3' if v['DEBUG'] else 'mysql'),
        Question('STATIC_ROOT', 'Where are static files stored?','/srv/numbas/static/', validation=path_exists),
        Question('MEDIA_ROOT', 'Where are uploaded files stored?','/srv/numbas/media/', validation=path_exists),
        Question('PREVIEW_PATH', 'Where are preview exams stored?','/srv/numbas/previews/', validation=path_exists),
        Question('PREVIEW_URL', 'Base URL of previews:','/numbas-previews/'),
        Question('PYTHON_EXEC', 'Python command:','python3'),
        Question('SITE_TITLE', 'Title of the site:','Numbas'),
        Question('ALLOW_REGISTRATION', 'Allow new users to register themselves?', True),
        Question('DEFAULT_FROM_EMAIL', 'Address to send emails from:', ''),
    ]
    db_questions = [
        Question('DB_NAME', 'Name of the database:','numbas_editor'),
        Question('DB_USER', 'Database user:', 'numbas_editor'),
        Question('DB_PASSWORD', 'Database password:', ''),
        Question('DB_HOST', 'Database host:', 'localhost'),
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
        'NAME': '{DB_NAME}',
        'USER': '{DB_USER}',
        'PASSWORD': '{DB_PASSWORD}',
        'HOST': '{DB_HOST}',
    }}
}}"""

    def __init__(self):
        self.written_files = []

    def handle(self):
        print_notice("This script will configure the Numbas editor up to a point where you can open it in a web browser, based on your answers to the following questions.")

        self.get_values()

        self.write_files()

        import numbas.settings
        importlib.reload(numbas.settings)

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "numbas.settings")

        print_notice("Now we'll check that everything works properly")

        self.run_management_command('check')

        if self.get_input('Would you like to automatically set up the database now?',True):
            self.run_management_command('migrate')

        import django
        django.setup()

        self.setup_site()

        from django.contrib.auth.models import User
        superusers = User.objects.filter(is_superuser=True)
        if superusers.exists():
            if self.get_input("There's already at least one admin user.\nWould you like to create another admin user now?",False):
                self.run_management_command('createsuperuser')
        else:
            if self.get_input('Would you like to create an admin user now?',True):
                self.run_management_command('createsuperuser')

        print_notice("Done!")

        if self.values['DEBUG']:
            print_notice("Run\n  python manage.py runserver\nto start a development server at http://localhost:8000.")
        else:
            self.run_management_command('collectstatic')
            print_notice("The Numbas editor is now set up. Once you've configured your web server, it'll be ready to use at http://{}".format(self.domain))

    def setup_site(self):
        from django.contrib.sites.models import Site
        try:
            domain = Site.objects.first().domain
        except Site.DoesNotExist:
            domain = 'localhost' if self.dev else 'numbas.example.com'

        if not self.dev:
            domain = self.get_input('What domain will the site be accessed from?', domain)

        try:
            url = urllib.parse.urlparse(domain)
            self.domain = url.netloc if url.netloc else domain
        except ValueError:
            self.domain = domain

        s, created = Site.objects.get_or_create(domain=self.domain)
        s.name = self.values['SITE_TITLE']
        self.rvalues['SITE_ID'] = str(s.id)
        s.save()

        self.sub_settings(confirm_overwrite=False)

        import numbas.settings
        importlib.reload(numbas.settings)

    def get_values(self):
        self.values = {}

        self.values['SECRET_KEY'] =''.join(random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50))
        self.values['PWD'] = os.getcwd()

        self.get_value(self.dev_question)

        self.dev = self.values['DEBUG']

        if self.dev:
            self.values.update(self.dev_values)

        for question in self.questions:
            self.get_value(question)
            if question.key=='DB_ENGINE':
                if 'sqlite' not in self.values[question.key]:
                    for question in self.db_questions:
                        self.get_value(question)
                else:
                    self.get_value(Question('DB_NAME', 'Name of the database file:','db.sqlite3'))

        def enrep(value):
            rep = repr(value)
            if isinstance(value,str):
                rep = rep[1:-1]
            return rep

        self.values['SITE_ID'] = self.get_default_value(Question('SITE_ID','','1'))
        self.rvalues = {key: enrep(value) for key, value in self.values.items()}

    def get_default_value(self, question):
        default = question.get_default(self.values)
        if pathlib.Path('numbas', 'settings.py').exists():
            import numbas.settings
            try:
                if question.key=='DB_ENGINE':
                    default = numbas.settings.DATABASES['default']['ENGINE'].replace('django.db.backends.', '')
                elif question.key[:3]=='DB_' and question.key[3:] in numbas.settings.DATABASES['default']:
                    default = numbas.settings.DATABASES['default'][question.key[3:]]
                else:
                    try:
                        default = getattr(numbas.settings, question.key)
                    except AttributeError:
                        default = numbas.settings.GLOBAL_SETTINGS[question.key]
                    if isinstance(default,list):
                        default = default[0] if len(default)==1 else ''
            except (AttributeError,KeyError):
                pass
        return default

    def get_value(self, question):
        if self.dev and question.key in self.dev_values:
            return
        self.values[question.key] = self.get_input(question.question, self.get_default_value(question), question.validation)

    def write_files(self):

        self.sub_settings()

        if not self.values['DEBUG']:
            self.sub_file(pathlib.Path('web', 'django.wsgi'),[ (r"sys.path.append\('(.*?)'\)", 'PWD') ])

        index_subs = [
            (r"Welcome to (the Numbas editor)", 'SITE_TITLE'),
        ]
        self.sub_file(pathlib.Path('editor', 'templates', 'index_message.html'), index_subs)

        self.sub_file(pathlib.Path('editor', 'templates', 'terms_of_use_content.html'), [])

        self.sub_file(pathlib.Path('editor', 'templates', 'privacy_policy_content.html'), [])

        if len(self.written_files):
            print_notice("The following files have been written. You should look at them now to see if you need to make any more changes.")
            for f in self.written_files:
                print_notice(' * '+str(f))
            print('')

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
        self.sub_file(pathlib.Path('numbas', 'settings.py'), settings_subs, confirm_overwrite)

    def sub_file(self, fname, subs, confirm_overwrite=True):
        if fname.exists() and confirm_overwrite:
            overwrite = self.get_input("{} already exists. Overwrite it?".format(fname),True)
            if not overwrite:
                return

        self.written_files.append(fname)

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
        print("Wrote",fname)

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
        from django.core.management import ManagementUtility
        args = ['manage.py'] + list(args)
        utility = ManagementUtility(args)
        try:
            utility.execute()
        except SystemExit:
            pass
        print('')

    def get_input(self, question, default, validation=None):
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
                if validation is not None and not validation(v):
                    v = None
        except KeyboardInterrupt:
            print('')
            raise SystemExit
        print('')
        return v
            

if __name__ == '__main__':
    command = Command()
    try:
        command.handle()
    except Exception as e:
        traceback.print_exc()
        print_notice("The setup script failed. Look at the error message above for a description of why.")
