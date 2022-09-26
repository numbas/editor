from contextlib import redirect_stdout
import django
import django.conf
from django.template.loader import render_to_string
from http.server import HTTPServer, BaseHTTPRequestHandler
import importlib
import io
import os
from pathlib import Path, PurePath
import re
import random
import traceback
import urllib.parse

def path_exists(path):
    path = Path(path)
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
    def __init__(self, key, question, default, options=None, kind=None, validation=None):
        self.key = key
        self.question = question
        self.default = self.get_default(default)
        self.validation = validation
        self.options = options

        if kind is None:
            if self.options is not None:
                self.kind = 'dropdown'
            else:
                self.kind = type(self.default).__name__
        else:
            self.kind = kind

    def get_default(self, default):
        if Path('numbas', 'settings.py').exists():
            import numbas.settings
            try:
                if self.key == 'DB_ENGINE':
                    default = numbas.settings.DATABASES['default']['ENGINE'].replace('django.db.backends.', '')
                elif self.key[:3]=='DB_' and self.key[3:] in numbas.settings.DATABASES['default']:
                    default = numbas.settings.DATABASES['default'][self.key[3:]]
                else:
                    try:
                        default = getattr(numbas.settings, self.key)
                    except AttributeError:
                        default = numbas.settings.GLOBAL_SETTINGS[self.key]
                    if isinstance(default,list):
                        default = default[0] if len(default)==1 else ''
            except (AttributeError,KeyError):
                pass

        return default

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
        ("About this editor", [
            Question('SITE_TITLE', 'Title of the site:','Numbas'),
            Question('ALLOW_REGISTRATION', 'Allow new users to register themselves?', True),
            Question('DEFAULT_FROM_EMAIL', 'Address to send emails from:', ''),
            Question('DOMAIN', 'What domain will the site be access from?', 'numbas.example.com'),
        ]),
        ("Filesystem paths", [
            Question('NUMBAS_PATH', 'Path of the Numbas compiler:','/srv/numbas/compiler/', validation=path_exists),
            Question('STATIC_ROOT', 'Where are static files stored?','/srv/numbas/static/', validation=path_exists),
            Question('MEDIA_ROOT', 'Where are uploaded files stored?','/srv/numbas/media/', validation=path_exists),
            Question('PREVIEW_PATH', 'Where are preview exams stored?','/srv/numbas/previews/', validation=path_exists),
            Question('PREVIEW_URL', 'Base URL of previews:','/numbas-previews/'),
            Question('PYTHON_EXEC', 'Python command:','python3'),
        ]),
        ("Database connection", [
            Question(
                'DB_ENGINE', 
                'Which database engine are you using?', 
                'sqlite3', 
                options=[
                    ("sqlite3", "SQLite3"),
                    ("postgres", "PostgreSQL"),
                    ("mysql", "MySQL"),
                ]
            ),
            Question('DB_NAME', 'Name of the database:','numbas_editor'),
            Question('DB_USER', 'Database user:', 'numbas_editor'),
            Question('DB_PASSWORD', 'Database password:', ''),
            Question('DB_HOST', 'Database host:', 'localhost'),
        ]),
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
        self.values = {}
        self.values['SECRET_KEY'] =''.join(random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50))
        self.values['PWD'] = os.getcwd()

    def run_management_command(*args, **kwargs):
        f = io.StringIO()
        with redirect_stdout(f):
            super().run_management_command(*args, **kwargs)

        result = f.getvalue()
        print(result)

        return result

    def handle(self):
        self.get_values()

        self.write_files()

        import numbas.settings
        importlib.reload(numbas.settings)

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "numbas.settings")

        check_result = self.run_management_command('check')

        migrate_result = self.run_management_command('migrate')

        import django
        importlib.reload(django)
        importlib.reload(django.conf)
        django.setup()

        self.setup_site()

        from django.contrib.auth.models import User
        superusers = User.objects.filter(is_superuser=True)

        # TODO - make superuser

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

    def get_values(self):
        self.dev = self.values['DEBUG']

        if self.dev:
            self.values.update(self.dev_values)

        def enrep(value):
            rep = repr(value)
            if isinstance(value,str):
                rep = rep[1:-1]
            return rep

        self.values['SITE_ID'] = self.get_default_value(Question('SITE_ID','','1'))
        self.rvalues = {key: enrep(value) for key, value in self.values.items()}

    def write_files(self):
        self.sub_settings()

        if not self.values['DEBUG']:
            self.sub_file(Path('web', 'django.wsgi'),[ (r"sys.path.append\('(.*?)'\)", 'PWD') ])

        index_subs = [
            (r"Welcome to (the Numbas editor)", 'SITE_TITLE'),
        ]
        self.sub_file(Path('editor', 'templates', 'index_message.html'), index_subs)

        self.sub_file(Path('editor', 'templates', 'terms_of_use_content.html'), [])

        self.sub_file(Path('editor', 'templates', 'privacy_policy_content.html'), [])

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
        self.sub_file(Path('numbas', 'settings.py'), settings_subs, confirm_overwrite)

    def sub_file(self, fname, subs, confirm_overwrite=True):
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

root_dir = Path.cwd() / 'first_setup'

django.conf.settings.configure(
    DEBUG=True,
    TEMPLATES=[{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [root_dir / 'templates'],  # script dir
        'OPTIONS': {
            'debug': True,
        }
    }]
)
django.setup()

PORT = 8000

command = Command()

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if re.match(r'^/static',self.path):
            return self.get_static()
        elif self.path == '/':
            return self.get_index()
        else:
            return self.get_not_found()

    def get_index(self):
        message = render_to_string(
            'index.html',
            {
                'command': command,
            }
        )
        self.send_response(200)
        self.end_headers()
        self.wfile.write(message.encode('utf-8'))

    def get_static(self):
        file = root_dir / 'static' / PurePath(self.path).relative_to('/static')

        if not file.exists():
            return self.get_not_found()

        self.send_response(200)
        self.end_headers()
        with open(file,'rb') as f:
            self.wfile.write(f.read())

    def get_not_found(self):
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length'))).decode('utf-8')
        params = urllib.parse.parse_qs(body)
        self.params = {k:v[0] if len(v)==1 else v for k,v in params.items()}
        print(self.params)

        if self.path == '/':
            self.post_index()

    def post_index(self):
        self.send_response(200)
        self.end_headers()

        questions = sum(qs for title,qs in self.questions)
        question_dict = {q.key: q for q in questions}
        for k,v in self.params.items():
            try:
                q = question_dict[k]
                q.value = v
            except KeyError:
                continue

        command.values.update(self.params)
        print(command.values)
        command.handle()

with HTTPServer(("", PORT), RequestHandler) as httpd:
    print(f"Please open http://localhost:{PORT} to set up this Numbas editor.")
    httpd.serve_forever()
