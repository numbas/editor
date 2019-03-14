from collections import defaultdict
from datetime import datetime
from distutils.util import strtobool
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from editor.models import NewQuestion, Project, NewStampOfApproval, Comment
from editor.views.editoritem import CompileObject, CompileError, ExtensionNotFoundCompileError
import json
import os
import subprocess
import sys
from urllib.parse import urlunparse


def yes_no(question,default=False):
    response = input('{} [{}] '.format(question,'Y/n' if default else 'y/N'))
    try:
        return strtobool(response.lower())==1
    except ValueError:
        return False

def input_choice(question,choices):
    choice_display = ', '.join('{} ({})'.format(choice,short.upper()) for choice,short in choices)
    while True:
        response = input('{} [{}] '.format(question,choice_display)).lower().strip()
        for choice,short in choices:
            if response in (choice.lower(),short.lower()):
                return choice

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
        result['question'] = self.question
        return result

def test_question(q):
    try:
        result = HeadlessTest(q).compile()
        return result
    except HeadlessError as e:
        if e.stdout.strip():
            result = json.loads(e.stdout.strip())
            return result
        else:
            return {
                'success': False,
                'message': '',
                'originalMessages': []
            }
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

STATUS_CHOICES = [
    ('no','n'),
    ('dontuse', 'd'),
    ('problem', 'p'),
    ('broken', 'b'),
    ('test again', 'a'),
]

class Command(BaseCommand):
    help = 'Test a question headlessly'

    last_success = False
    questions_tested = 0

    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.results = []
        self.start_time = datetime.now()

    def add_arguments(self, parser):
        parser.add_argument('--question',dest='question_id',nargs='+', type=int)
        parser.add_argument('--project')
        parser.add_argument('--all', action='store_true')
        parser.add_argument('--exam',dest='exam_ids',nargs='+', type=int)

        parser.add_argument('--repeat',type=int,default=1)

        parser.add_argument('--stamp',action='store_true')
        group = parser.add_argument_group('stamp_status')
        group.add_argument('--broken',dest='stamp_status',action='store_const',const='broken')
        group.add_argument('--dontuse',dest='stamp_status',action='store_const',const='dontuse')
        group.add_argument('--problem',dest='stamp_status',action='store_const',const='problem')
        group.add_argument('--pleasetest',dest='stamp_status',action='store_const',const='pleasetest')

        parser.add_argument('--only-ready', action='store_true')
        parser.add_argument('--show-successes', action='store_true', dest='show_successes')
        parser.add_argument('--try-bad-extensions', dest='ignore_bad_extensions', action='store_false')

    def handle(self, *args, **options):
        self.options = options
        if options['project']:
            self.test_project(options['project'])

        if options['question_id']:
            self.test_questions(NewQuestion.objects.filter(pk__in=options['question_id']))

        if options['all']:
            self.test_all()

        if options['exam_ids']:
            self.test_questions(NewQuestion.objects.filter(exams__pk__in=options['exam_ids']).distinct())

        end_time = datetime.now()
        failures = [r for r in self.results if not r['success']]
        print('Testing finished in {}.'.format((end_time-self.start_time)))
        if len(failures)>0:
            print('\x1b[31m{}/{} questions failed\x1b[0m'.format(len(failures),len(self.results)))
        else:
            print('\x1b[32mEvery question worked!\x1b[0m')

        self.summarise_results()

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
        bad_stamp = Q(editoritem__current_stamp__status__in=('dontuse','problem','broken'))
        questions = questions.exclude(bad_stamp)

        if self.options['only_ready']:
            questions = questions.filter(editoritem__current_stamp__status='ok')
        if self.options['ignore_bad_extensions']:
            questions = questions.exclude(extensions__runs_headless=False)
        print("Testing {} question{}".format(questions.count(),'s' if questions.count()!=1 else ''))
        for q in questions:
            self.questions_tested += 1
            result = self.test_question(q)

    def test_question(self,q):
        #print("Testing question {}: \"{}\"".format(q.pk,q.editoritem.name))
        for i in range(self.options['repeat']):
            result = test_question(q)
            if not result['success']:
                break

        if result['success']:
            if self.options['show_successes']:
                print('\x1b[32m✔ Question {} "{}" ran OK\x1b[0m\n'.format(q.pk, q.editoritem.name))
            else:
                sys.stdout.write('✔')
                sys.stdout.flush()
                self.last_success = True
        else:
            if self.last_success:
                sys.stdout.write('\n\n')
                sys.stdout.flush()
            self.last_success = False
            url = urlunparse(('http',Site.objects.first().domain,q.get_absolute_url(),'','',''))
            error_template = """\x1b[31m✖ Question {pk} "{name}" failed: {message}
  Error codes: {originalMessages}\n
  Edit this question at {url}\x1b[0m
"""
            print(error_template.format(
                pk=q.pk, 
                name=q.editoritem.name, 
                message=result.get('message',''), 
                originalMessages = ', '.join(result.get('originalMessages',[])),
                url=url
            ))

            if result.get('stderr'):
                print(result['stderr'])

            if self.options['stamp']:
                status = self.options['stamp_status'] or input_choice('Stamp this question?', STATUS_CHOICES)
                if status == 'test again':
                    return self.test_question(q)
                elif status != 'no':
                    user = User.objects.filter(is_superuser=True).first()
                    comment_template = """<p>Automatic testing has identified a problem with this question:</p>
    <blockquote>{message}</blockquote>"""
                    comment = Comment.objects.create(
                        object = q.editoritem,
                        user = user,
                        text = comment_template.format(**result)
                    )
                    stamp = NewStampOfApproval.objects.create(
                        object = q.editoritem,
                        user = user,
                        status = status
                    )
        self.results.append(result)

    def summarise_results(self):
        error_codes = defaultdict(list)
        for result in self.results:
            for code in result.get('originalMessages',[]):
                error_codes[code].append(result)
        if len(error_codes):
            print('Breakdown of error codes:')
            print('Freq.\tCode')
            for code,results in sorted(error_codes.items(),key=lambda x:len(x[1])):
                print('{}\t{}'.format(len(results), code))
