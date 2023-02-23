import argparse
import json
import os
import re
import random
import subprocess
import sys
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path, PurePath
from pkg_resources import packaging

PYTHON_EXEC_PATH = sys.executable

MIN_PYTHON_VERSION = packaging.version.parse("3.8")

try:
    import django
    import django.conf
    from django.template.loader import render_to_string
except ImportError:
    print("Couldn't import the Python package Django. Have you installed it, and is the virtual environment active?", file=sys.stderr)
    sys.exit(1)


class ValidationError(Exception):
    def html(self):
        return render_to_string(
            Path('errors', type(self).__name__).with_suffix('.html'),
            {
                'error': self,
            }
        )

class PathDoesNotExist(ValidationError):
    def __init__(self, path):
        self.path = path

    def __str__(self):
        return f"The path {self.path} does not exist."

class InvalidFormInput(ValidationError):
    def __init__(self, errors):
        self.errors = errors

    def __str__(self):
        return "There was an error in one of the values you gave." if len(self.errors)==1 else "There were errors in some of the values you gave."

class PackageMissingError(ValidationError):
    def __init__(self, package, install = None):
        self.package = package
        self.install = install if install else package

    def __str__(self):
        return f"The package <code>{self.package}</code> could not be loaded. Run <code>pip install {self.package}</code> to install it."

class NotPythonError(ValidationError):
    def __str__(self):
        return "This is not Python"

class SetupError(ValidationError):
    def __init__(self, error):
        self.error = error

class NeedNewerPythonError(ValidationError):
    min_version = MIN_PYTHON_VERSION

    def __init__(self, version):
        self.version = version

class CantConnectToDatabase(ValidationError):
    pass

def path_exists(path, is_dev=False):
    if not Path(path).exists():
        if is_dev:
            Path(path).mkdir(parents=True, exist_ok=True)
        else:
            raise PathDoesNotExist(path)

class Question:
    def __init__(self, key, question, default, value = None, options = None, kind = None, validation = None, dev_value = None, classes = None):
        self.key = key
        self.question = question
        self.value = self.get_default(default, value)
        self.validation = validation
        self.validation_error = None
        self.dev_value = dev_value
        self.classes = set(classes) if classes is not None else set()
        if dev_value is not None:
            self.classes.add('dev')
        self.options = options
        self.response = self.value

        if kind is None:
            if self.options is not None:
                self.kind = 'dropdown'
            else:
                self.kind = type(self.value).__name__
        else:
            self.kind = kind

    @property
    def css_classes(self):
        classes = self.classes.copy()
        if self.validation_error:
            classes.add('has-error')
        return ' '.join(classes)

    def get_default(self, default, value = None):
        if value is not None:
            return value

        if Path('numbas', 'settings.py').exists():
            try:
                import numbas.settings
                if self.key == 'DB_ENGINE':
                    default = numbas.settings.DATABASES['default']['ENGINE'].replace('django.db.backends.', '')
                elif self.key[:3] == 'DB_' and self.key[3:] in numbas.settings.DATABASES['default']:
                    default = numbas.settings.DATABASES['default'][self.key[3:]]
                else:
                    try:
                        default = getattr(numbas.settings, self.key)
                    except AttributeError:
                        default = numbas.settings.GLOBAL_SETTINGS[self.key]
                    if isinstance(default, list):
                        default = default[0] if len(default) == 1 else ''
            except (ImportError, SyntaxError, AttributeError, KeyError):
                pass

        return default

    def validate(self, value, is_dev=False):
        if self.validation is None:
            return

        try:
            self.validation(value, is_dev)
        except ValidationError as error:
            self.validation_error = error
            raise error

def validate_numbas_path(path, *args):
    path_exists(path)
    if not Path(path, 'bin', 'numbas.py').exists():
        raise ValidationError("The path you gave for the Numbas compiler doesn't seem to be correct. It exists, but doesn't contain the Numbas compiler scripts.")

def validate_python_exec(python_cmd, *args):
    try:
        res = subprocess.run(python_cmd.split(' ')+['--version'], check=True, capture_output = True)
        stdout = res.stdout.decode('utf-8')
        m = re.match(r'^Python (?P<version>.*)$', stdout)
        if not m:
            raise NotPythonError()
        version = packaging.version.parse(m.group('version'))
        if version < MIN_PYTHON_VERSION:
            raise NeedNewerPythonError(version)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        raise NotPythonError() from e

class Command:

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

    def __init__(self, values = None, dev = False, server = None):
        self.response = []
        self.rvalues = {}
        self.dev = dev
        self.server = server

        self.make_questions(values)

        self.values['SECRET_KEY'] =''.join(random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50))
        self.values['PWD'] = os.getcwd()

    def make_questions(self, values):
        given_values = values is not None
        if not given_values:
            values = {}
        self.values = values

        self.question_dict = {}
        def make_question(key, question, default, *args, **kwargs):
            if given_values:
                if isinstance(default,bool):
                    value = key in self.values
                else:
                    value = self.values.get(key, '')
            else:
                value = None
            q = Question(key, question, default, *args, value = value, **kwargs)
            self.question_dict[key] = q
            return q

        self.questions = [
            ("About this editor", [
                make_question('DEBUG', 'Is this installation for development?', False),
                make_question('SITE_TITLE', 'Title of the site:', 'Numbas', dev_value = 'Numbas development'),
                make_question('ALLOW_REGISTRATION', 'Allow new users to register themselves?', True, dev_value = True),
                make_question('DEFAULT_FROM_EMAIL', 'Address to send emails from:', '', dev_value = ''),
                make_question('DOMAIN', 'What domain will the site be accessed from?', 'numbas.example.com', dev_value = 'localhost'),
            ]),
            ("Filesystem paths", [
                make_question('NUMBAS_PATH', 'Path of the Numbas compiler:', '/srv/numbas/compiler/', validation = validate_numbas_path),
                make_question('STATIC_ROOT', 'Where are static files stored?', '/srv/numbas/static/', validation = path_exists, dev_value = 'editor/static'),
                make_question('MEDIA_ROOT', 'Where are uploaded files stored?', '/srv/numbas/media/', validation = path_exists, dev_value = 'media'),
                make_question('PREVIEW_PATH', 'Where are preview exams stored?', '/srv/numbas/previews/', dev_value = 'editor/static/previews'),
                make_question('PREVIEW_URL', 'Base URL of previews:', '/numbas-previews/', dev_value = '/static/previews/'),
                make_question('PYTHON_EXEC', 'Python command:', PYTHON_EXEC_PATH, validation = validate_python_exec, dev_value = PYTHON_EXEC_PATH),
            ]),
            ("Database connection", [
                make_question(
                    'DB_ENGINE',
                    'Which database engine are you using?',
                    'sqlite3',
                    options = [
                        ("sqlite3", "SQLite3"),
                        ("postgresql", "PostgreSQL"),
                        ("mysql", "MySQL")
                    ],
                    dev_value = 'sqlite3'
                ),
                make_question('DB_NAME', 'Name of the database:', 'numbas_editor', dev_value = 'db.sqlite3'),
                make_question('DB_USER', 'Database user:', 'numbas_editor', dev_value = '', classes = ['db-server']),
                make_question('DB_PASSWORD', 'Database password:', '', dev_value = '', classes = ['db-server'], kind='password'),
                make_question('DB_HOST', 'Database host:', 'localhost', dev_value = '', classes = ['db-server']),
            ]),
            ("Superuser details", [
                make_question('SU_CREATE', 'Create a new superuser?', True),
                make_question('SU_NAME', 'Username:', 'superuser', classes = ['superuser']),
                make_question('SU_PASS', 'Password:', '', classes = ['superuser'], kind='password'),
                make_question('SU_EMAIL', 'Email:', '', classes = ['superuser']),
                make_question('SU_FIRST_NAME', 'First name:', '', classes = ['superuser']),
                make_question('SU_LAST_NAME', 'Last name:', '', classes = ['superuser']),
            ]),
        ]


    def check_database(self):
        if self.values['DB_ENGINE'] == 'postgresql':
            try:
                import psycopg2
                try:
                    _conn = psycopg2.connect(
                        dbname = self.values['DB_NAME'],
                        user = self.values['DB_USER'],
                        password = self.values['DB_PASSWORD'],
                        host = self.values['DB_HOST']
                    )
                except psycopg2.Error as e:
                    raise CantConnectToDatabase(e) from e
            except ImportError as e:
                raise PackageMissingError('psycopg2') from e
        elif self.values['DB_ENGINE'] == 'mysql':
            try:
                import MySQLdb
                try:
                    _conn = MySQLdb.connect(
                        db = self.values['DB_NAME'],
                        user = self.values['DB_USER'],
                        password = self.values['DB_PASSWORD'],
                        host = self.values['DB_HOST']
                    )
                except MySQLdb.OperationalError as e:
                    raise CantConnectToDatabase(e) from e
            except ImportError as e:
                raise PackageMissingError('mysqlclient') from e

    def run_setup(self):
        if self.server.setup_process is not None:
            raise SetupError('The final setup task is already running.')

        cmd = [sys.executable, 'manage.py', 'first_setup_db', json.dumps(self.values)]
        if self.dev:
            cmd.append('--dev')
        self.server.setup_process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def handle(self):
        self.get_values()

        print("Checking database")
        self.check_database()

        print("Writing files")
        self.write_files()

        print("Run setup")
        self.run_setup()

    def get_value(self, key):
        return self.question_dict[key].value

    def get_values(self):
        for q in self.question_dict.values():
            self.values[q.key] = q.value

        self.dev = self.values['DEBUG']

        if self.dev:
            for _, questions in self.questions:
                for q in questions:
                    if q.dev_value is None:
                        continue
                    self.values[q.key] = q.dev_value

        def enrep(value):
            rep = repr(value)
            if isinstance(value, str):
                rep = rep[1:-1]
            return rep

        self.rvalues = {key: enrep(value) for key, value in self.values.items()}

        validation_errors = []

        for _, questions in self.questions:
            for question in questions:
                if question.key in self.values:
                    question.response = self.values[question.key]
                    try:
                        question.validate(question.response, self.dev)
                    except ValidationError as e:
                        print(e)
                        validation_errors.append(e)

        if validation_errors:
            raise InvalidFormInput(validation_errors)

        return validation_errors

    def write_files(self):
        self.sub_settings()

        if not self.values['DEBUG']:
            self.sub_file(Path('web', 'django.wsgi'), [ (r"sys.path.append\('(.*?)'\)", 'PWD') ])

        index_subs = [
            (r"Welcome to (the Numbas editor)", 'SITE_TITLE'),
        ]
        self.sub_file(Path('editor', 'templates', 'index_message.html'), index_subs)

        self.sub_file(Path('editor', 'templates', 'terms_of_use_content.html'), [])

        self.sub_file(Path('editor', 'templates', 'privacy_policy_content.html'), [])

    def sub_settings(self):
        def set_database(_m, rvalues):
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
        ]
        self.sub_file(Path('numbas', 'settings.py'), settings_subs)

    def sub_file(self, fname, subs):
        self.server.written_files.append(fname)

        with open(str(fname)+'.dist', encoding='utf-8') as f:
            text = f.read()

        for pattern, key in subs:
            pattern = re.compile(pattern, re.MULTILINE | re.DOTALL)
            if callable(key):
                text = self.sub_fn(text, pattern, key)
            else:
                text = self.sub(text, pattern, self.rvalues.get(key))


        with open(fname, 'w', encoding='utf-8') as f:
            f.write(text)

    def sub_fn(self, source, pattern, fn):
        m = pattern.search(source)
        if not m:
            raise Exception(f"Didn't find {pattern.pattern}")
        start, end = m.span(0)
        out = fn(m, self.rvalues)
        return source[:start]+out+source[end:]

    def sub(self, source, pattern, value):
        def fix(m):
            t = m.group(0)
            start, end = m.span(1)
            ts, _ = m.span(0)
            start -= ts
            end -= ts
            return t[:start]+value+t[end:]
        if not pattern.search(source):
            raise Exception(f"Didn't find {pattern.pattern}")
        return pattern.sub(fix, source)


root_dir = Path.cwd() / 'first_setup'

django.conf.settings.configure(
    DEBUG = True,
    TEMPLATES = [{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [root_dir / 'templates'],
        'OPTIONS': {
            'debug': True,
        }
    }]
)
django.setup()

class RequestHandler(BaseHTTPRequestHandler):
    params = None

    def do_GET(self):
        if re.match(r'^/static', self.path):
            return self.get_static()

        if self.path == '/':
            return self.get_index()

        if self.path == '/setup-status':
            return self.get_setup_status()

        if self.path == '/finished':
            return self.get_finished_response()

        return self.get_not_found()

    def get_index(self):
        message = render_to_string(
            'index.html',
            {
                'command': Command(server=self.server),
            }
        )
        self.send_response(200)
        self.end_headers()
        self.wfile.write(message.encode('utf-8'))

    def get_setup_status(self):
        if self.server.run_result is not None:
            status = 'finished'
        elif self.server.setup_process is not None:
            status = 'running'
        else:
            status = 'not-running'

        self.send_response(200)
        self.end_headers()
        self.wfile.write(status.encode('utf-8'))

    def get_finished_response(self):
        if self.server.run_result is None:
            return self.get_not_found()

        message = render_to_string(
            'response.html',
            {
                'command': Command(server=self.server, dev=self.server.run_result['dev']),
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
        with open(file, 'rb') as f:
            self.wfile.write(f.read())

    def get_not_found(self):
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get('Content-Length'))).decode('utf-8')
        params = urllib.parse.parse_qs(body)
        self.params = {k:v[0] if len(v) == 1 else v for k, v in params.items()}

        if self.path == '/':
            self.post_index()

    def post_index(self):
        command = Command(self.params, server=self.server)

        try:
            command.handle()

            self.send_response(200)
            self.end_headers()
            message = render_to_string(
                'setup_waiting.html',
                {
                    'command': command,
                }
            )
        except ValidationError as error:
            self.send_response(400)
            self.end_headers()
            message = render_to_string(
                'index.html',
                {
                    'command': command,
                    'form_error': error,
                }
            )

        self.wfile.write(message.encode('utf-8'))

    def log_request(self, code = '-', size = '-'):
        pass

class SetupHTTPServer(HTTPServer):

    timeout = 1

    setup_process = None
    run_result = None
    written_files = []

    def poll_setup(self):
        if self.setup_process is None:
            return

        returncode = self.setup_process.poll()
        if returncode is None:
            return

        print("Setup is finished")

        stdout_data, stderr_data = self.setup_process.communicate()
        stdout = stdout_data.decode('utf-8')
        stderr = stderr_data.decode('utf-8')

        if returncode != 0:
            try:
                result = json.loads(stdout)
                error = result.get('error','')
                raise SetupError(error) from e
            except json.decoder.JSONDecodeError as e2:
                raise SetupError(stderr) from e2

        try:
            self.run_result = json.loads(stdout)
        except json.decoder.JSONDecodeError as e:
            raise SetupError(e) from e
        self.written_files.append(Path('numbas', 'settings.py'))

        self.setup_process = None

def serve_web(port):
    with SetupHTTPServer(("", port), RequestHandler) as httpd:
        print(f"Please open http://localhost:{port} to set up this Numbas editor.")
        while True:
            httpd.handle_request()
            httpd.poll_setup()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', default=8000, type=int, help="The port to run the webserver on")
    arguments = parser.parse_args()

    serve_web(port = arguments.port)
