import json

from django.core.management.base import BaseCommand, CommandError
from editor.models import NewQuestion, Project, NewExam

class Command(BaseCommand):
    help = 'Extract unit tests from one or more questions'

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
        questions = self.gather_questions()

        collection = []
        for q in questions:
            data = q.editoritem.get_parsed_content().data
            name = data['name']
            collection.append(data)

        print("""var unit_test_questions = {};""".format(json.dumps(collection)))

    def gather_questions(self):
        options = self.options
        questions = []
        if options['project']:
            project_pk = options['project']
            try:
                project = Project.objects.get(pk=project_pk)
            except Project.DoesNotExist:
                raise CommandError("Project {} does not exist".format(project_pk))

            questions += NewQuestion.objects.filter(editoritem__project=options['project'])

        if options['question_id']:
            questions += NewQuestion.objects.filter(pk__in=options['question_id'])

        if options['exam_ids']:
            questions += NewQuestion.objects.filter(exams__pk__in=options['exam_ids']).distinct()

        return questions
