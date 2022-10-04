from contextlib import redirect_stdout
from distutils.core import setup
from http.server import HTTPServer, BaseHTTPRequestHandler
import importlib
import io
import os
from pathlib import Path, PurePath
import re
import random
import subprocess
import sys
import traceback
import urllib.parse
import json

try:
    import django
    import django.conf
    from django.template.loader import render_to_string
except ImportError:
    print("Couldn't import django. Have you installed it, and is the virtual environment active?")
    sys.exit(1)
    

def path_exists(path):
    path = Path(path)
    if not path.exists():
        #answer = input("That path doesn't exist. Create it? [y/n]").strip().lower()
        #if answer=='y':
        #    path.mkdir(parents=True, exist_ok=True)
        #    return True
        #else:
        return False
    else:
        return True

class Question(object):
    def __init__(self, key, question, default, options=None, kind=None, validation=None, dev_overridden=False,superuser_question=False):
        self.key = key
        self.question = question
        self.default = self.get_default(default)
        self.validation = validation
        self.hide={'dev_overridden': dev_overridden, 'superuser_question': superuser_question }
        #self.dev_overridden = dev_overridden #if we are in a dev environment, do we require this value to be specific?
        self.options = options
        self.response=self.default

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
    invalid_form=False

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
        'DOMAIN': 'localhost',
        'DB_USER': 'numbas_editor',
        'DB_PASSWORD': '',
        'DB_HOST':'localhost'
        
    }

    questions = [
        ("About this editor", [
            Question('DEBUG', 'Is this installation for development?', False),
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
                    ("postgresql", "PostgreSQL"),
                    ("mysql", "MySQL")
                ]
            ),
            Question('DB_NAME', 'Name of the database:','numbas_editor'),
            Question('DB_USER', 'Database user:', 'numbas_editor'),
            Question('DB_PASSWORD', 'Database password:', ''),
            Question('DB_HOST', 'Database host:', 'localhost'),
        ]),
        ("Superuser details", [
            Question('SU_CREATE','Create a new superuser?',True),
            Question('SU_NAME', 'Username:','superuser',superuser_question=True),
            Question('SU_PASS', 'Password:', '',superuser_question=True),
            Question('SU_EMAIL', 'Email:','',superuser_question=True),
            Question('SU_FIRST_NAME', 'First name:','',superuser_question=True),
            Question('SU_LAST_NAME', 'Last name:','',superuser_question=True),
        ]),
    ]
    
    #being lazy and auto-assigning the dev_override. This may be bad practice but writing a function to change a boolean seems overzealous
    for question_list in questions:
        for question in question_list[1]:
            if question.key in dev_values.keys():
                question.hide['dev_overridden']=True
        
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
        self.response = []
        self.valid_input=True #this is turned to false if any of the users' inputs are not reasonable, and the response should be altered to tell the user why.
        self.values = {}
        self.values['SECRET_KEY'] =''.join(random.SystemRandom().choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50))
        self.values['PWD'] = os.getcwd()
        #create default values as empty strings, as empty fields are not returned by the form.
        for (header,questions) in self.questions:
            for question in questions:
                self.values[question.key] = ""
        self.values['DEBUG'] = False #when this comes from the entry, it will be a string, not a bool
        self.values['ALLOW_REGISTRATION'] = False
        self.values['SU_CREATE'] = False

    def reset_values_to_default(self):
        '''resets any values to their initial defaults to allow for a fresh input. This is only done as the html post seems to only send non-empty fields  '''
        for (header,questions) in self.questions:
            for question in questions:
                self.values[question.key] = ""
        self.values['DEBUG'] = False
        self.values['ALLOW_REGISTRATION'] = False
        self.values['SU_CREATE'] = False

    def run_management_command(self,*args, **kwargs):
        
        f = io.StringIO()
        with redirect_stdout(f):
            from django.core.management import ManagementUtility
            args = ['manage.py'] + list(args)
            utility = ManagementUtility(args)
            try:
                utility.execute()
            except SystemExit:
                pass #Todo: catch error here!

        result = f.getvalue()
        #print(result)

        return result

    def handle(self):
        self.get_values()
        if not self.valid_input:
            return
        self.write_files()

        import numbas.settings
        importlib.reload(numbas.settings)

        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "numbas.settings")
        #I have no idea if these are the correct modules to make these work. Postgresql seems to need tweaking (it's looking for a server during setup), mysql won't install for me, it seems it needs more.
        if command.values['DB_ENGINE']=='postgresql':
            try: 
                import psycopg2
            except:
                self.update_response("psycopg2 is required for postgresql, ensure this module is installed.",valid=False)
        elif command.values['DB_ENGINE']=='mysql':
            try: 
                import mysqlclient
            except:
                self.update_response("mysqlclient is required for mysql, ensure this module is installed.",valid=False)

        if not self.valid_input: #early exit, there's no point continuing if we already have an error.
            return
        check_result = self.run_management_command('check')

        migrate_subprocess=subprocess.run([sys.executable,'manage.py','migrate'],capture_output=True)

        setup_subprocess=subprocess.run([sys.executable,'commands.py',str(self.dev),json.dumps(self.values),json.dumps(self.rvalues)],capture_output=True)

        if setup_subprocess.returncode==0 and migrate_subprocess.returncode==0:
            self.written_files.append(Path('numbas', 'settings.py'))
            self.domain=setup_subprocess.stdout.splitlines()[-1].decode("utf-8") #the domain is always the last thing passed back from commands so -1 works. Make this cleaner if you know how!
        else:
            if b"No module named \'numbasobject\'" in setup_subprocess.stderr: #not actually sure how to properly check for this as an import as it is *up* one level and apparently that's complicated
                self.update_response("Compiler is not present in provided directory \""+self.values['NUMBAS_PATH']+"\"",valid=False)
            elif b"unable to open database file" in migrate_subprocess.stderr:
                self.update_response("Cannot find the database file in \""+self.values['DB_NAME']+"\", ensure that the path exists and ends with a database file such as db.sqlite3 (which does not need to exist already)",valid=False) 
            else:
                if migrate_subprocess.returncode!=0:
                    self.update_response("Something wrong with the migrate process \"..."+str(migrate_subprocess.stderr)[-100:]+" \"",valid=False)
                    print(migrate_subprocess.stderr)
                else:
                    self.update_response("Something wrong with the setup process \"..."+str(setup_subprocess.stderr)[-100:]+" \"",valid=False)
                    print(setup_subprocess.stderr)
        if not self.valid_input:
            return
        if len(self.written_files):
            self.update_response("The following files have been written. You should look at them now to see if you need to make any more changes.")

            written_files= list(set(self.written_files)) #reversed(list(dict.fromkeys(reversed(self.written_files)))) #this just removes duplicates, for example numbas settings. It keeps order, with the *last* change staying as late as possible
            for f in written_files:
               self.update_response(' * '+str(f))

        if self.values['DEBUG']=="True":
            #we could automatically switch to the webserver if we can figure out how to stop 'serve_forever'. This would then need to say 'this is how you start it in future' and ask them to refresh
            self.update_response("Run\n  python manage.py runserver\nto start a development server at http://localhost:8000.")
        else:
            #self.run_management_command('collectstatic')
            self.update_response("The Numbas editor is now set up. Once you've configured your web server, it'll be ready to use at http://{}".format(self.domain))
        


    def get_values(self):
        self.dev = self.values['DEBUG']=="True"

        if self.dev:
            self.values.update(self.dev_values)

        def enrep(value):
            rep = repr(value)
            if isinstance(value,str):
                rep = rep[1:-1]
            return rep

        self.values['SITE_ID'] = Question('SITE_ID','','1').get_default("") #self.get_default_value(Question('SITE_ID','','1')) #added a 'values' of an empty string. Should probably be a useful default or something (quite difficult to tell *why* this function wants values passed
        self.rvalues = {key: enrep(value) for key, value in self.values.items()}
        
        for question_list in command.questions:
            for question in question_list[1]:
                if question.key in self.values.keys():
                    question.response=self.values[question.key]
                    if not question.validate(question.response):
                        invalid_message="Invalid response to "+question.question
                        if question.validation==path_exists:
                            invalid_message+=" ensure the path exists. Last entry: "+question.response
                        self.update_response(invalid_message,valid=False)
                        
                

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

    def update_response(self, response, valid=True):
        '''Takes a string response and adds it to the internal response. If this is newly invalid, it resets the response so that only the errors are replied. It ignores valid additions to an invalid-response.'''
        if not valid and self.valid_input:
            self.valid_input=valid
            self.response=[]
        if valid==self.valid_input:
            self.response+=[response]
    
    def clear_response(self):
        '''Clears the response messages and resets the validity boolean'''
        self.valid_input=True
        self.response=[]

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


root_dir = Path.cwd() / 'first_setup'

django.conf.settings.configure(
    DEBUG=True,
    TEMPLATES=[{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [root_dir / 'templates'],  
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
        
        if self.path == '/':
            self.post_index()

    def post_index(self):
        command.reset_values_to_default()
        self.send_response(200)
        self.end_headers()
        questions = sum((qs for title,qs in command.questions),[])
        question_dict = {q.key: q for q in questions}
        for k,v in self.params.items():
            try:
                q = question_dict[k]
                q.value = v
            except KeyError:
                continue
        command.values.update(self.params)
        command.handle()
        if command.valid_input:
            message = render_to_string(
                'response.html',
                {
                    'command': command,
                }
            )
        else:
            message = render_to_string(
                'index.html',
                {
                    'command': command,
                }
            )
            
        self.wfile.write(message.encode('utf-8'))
        command.clear_response()

with HTTPServer(("", PORT), RequestHandler) as httpd:
    print(f"Please open http://localhost:{PORT} to set up this Numbas editor.")
    httpd.serve_forever()
