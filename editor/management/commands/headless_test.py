from datetime import datetime
from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError
from editor.models import NewQuestion, Project
from editor.views.editoritem import CompileObject, CompileError, ExtensionNotFoundCompileError
import json
import os
import subprocess
from urllib.parse import urlunparse

class HeadlessError(CompileError):
    pass

class HeadlessTest(CompileObject):
    def __init__(self,q,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.question = q
    def compile(self):
        numbasobject = self.question.as_numbasobject(None)
        self.add_extensions(numbasobject)
        source = str(numbasobject)
        command = [
            os.path.join(settings.GLOBAL_SETTINGS['NUMBAS_PATH'],'headless'),
        ]
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate(source.encode('utf-8'))
        code = process.poll()
        if code != 0:
            raise HeadlessError('Error while running the question', stdout=stdout.decode('utf-8'), stderr=stderr.decode('utf-8'), code=code)
        result = json.loads(stdout.decode('utf-8').strip())
        result['stderr'] = stderr.decode('utf-8')
        return result

def test_question(q):
    try:
        result = HeadlessTest(q).compile()
        return result
    except HeadlessError as e:
        result = json.loads(e.stdout.strip())
        return result
    except CompileError as e:
        return {
            'success': False,
            'message': e.message,
            'originalMessages': []
        }
    except json.JSONDecodeError as e:
        return {
            'success': False,
            'message': str(e),
            'originalMessages': []
        }

class Command(BaseCommand):
    help = 'Test a question headlessly'

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.results = []
        self.start_time = datetime.now()

    def add_arguments(self, parser):
        parser.add_argument('question_id',nargs='*', type=int)
        parser.add_argument('--project')
        parser.add_argument('--only-ready', action='store_true')
        parser.add_argument('--all', action='store_true')
        parser.add_argument('--hide-successes', action='store_false', dest='show_successes')
        parser.add_argument('--ignore-bad-extensions', action='store_true')

    def handle(self, *args, **options):
        self.options = options
        if options['project']:
            self.test_project(options['project'])

        if len(options['question_id']):
            self.test_questions(NewQuestion.objects.filter(pk__in=options['question_id']))

        if options['all']:
            self.test_all()

        end_time = datetime.now()
        failures = [r for r in self.results if not r['success']]
        print('\nTesting finished in {}.\n{}/{} questions failed'.format((end_time-self.start_time), len(failures),len(self.results)))

    def test_project(self,pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise CommandError("Project {} does not exist".format(question_id))

        print("Testing project \"{}\"".format(project.name))
        questions = NewQuestion.objects.filter(editoritem__project=project)
        self.test_questions(questions)

    def test_all(self):
        self.test_questions(NewQuestion.objects.all())

    def test_questions(self,questions):
        if self.options['only_ready']:
            questions = questions.filter(editoritem__current_stamp__status='ok')
        if self.options['ignore_bad_extensions']:
            questions = questions.exclude(extensions__runs_headless=False)
        print("Testing {} questions".format(questions.count()))
        for q in questions:
            result = self.test_question(q)

    def test_question(self,q):
        #print("Testing question {}: \"{}\"".format(q.pk,q.editoritem.name))
        result = test_question(q)
        if result['success']:
            if self.options['show_successes']:
                print('\x1b[32m✔ Question {} "{}" ran OK\x1b[0m'.format(q.pk, q.editoritem.name))
        else:
            url = urlunparse(('http',Site.objects.first().domain,q.get_absolute_url(),'','',''))
            print('\x1b[31m✖ Question {pk} "{name}" failed: {message}\n  Error codes: {originalMessages}\n  Edit this question at {url}\x1b[0m'.format(
                pk=q.pk, 
                name=q.editoritem.name, 
                message=result.get('message',''), 
                originalMessages = ', '.join(result.get('originalMessages',[])),
                url=url
            ))
            if result.get('stderr'):
                print(result['stderr'])
        self.results.append(result)
