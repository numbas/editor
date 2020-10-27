from django.db import models, transaction
from django.db.models import Q, Max, Count
from django.core.management.base import BaseCommand, CommandError
from django.contrib.contenttypes.models import ContentType
from editor.models import EditorItem, NewQuestion, Project, NewExam, NUMBAS_FILE_VERSION
from numbasobject import NumbasObject
from feature_survey.models import Feature
from functools import wraps
from itertools import groupby
from math import floor

from collections import defaultdict

survey_questions = defaultdict(lambda: [])

ct_question = ContentType.objects.get_for_model(NewQuestion)

def combine(a,b):
    if isinstance(b,bool):
        return a or b
    else:
        return a + b

def survey_question(category):
    def decorator(fn):
        feature = fn.__name__
        @wraps(fn)
        def do_question(cmd,obj,*args,**kwargs):
            res = fn(obj,*args,**kwargs)
            features = []
            if isinstance(res,bool) and res:
                features = [feature]
            elif res is not None:
                features = res
            if features:
                for f in features:
                    cmd.record_feature(obj,f)
            return res
        survey_questions[category].append(do_question)
    return decorator

question_question = survey_question('question')
exam_question = survey_question('exam')
editoritem_question = survey_question('editoritem')
project_question = survey_question('project')

def exam_content_question(fn):
    @exam_question
    @wraps(fn)
    def efn(e):
        return fn(e.editoritem.parsed_content.data)

def question_content_question(fn):
    @question_question
    @wraps(fn)
    def efn(q):
        return fn(q.editoritem.parsed_content.data)

def editoritem_content_question(fn):
    @editoritem_question
    @wraps(fn)
    def efn(e):
        return fn(e.parsed_content.data)

def part_question(fn):
    def inspect_part(p):
        features = fn(p)
        for sp in p.get('steps',[])+p.get('gaps',[])+p.get('alternatives',[]):
            features = combine(features, inspect_part(sp))
        return features

    @question_content_question
    @wraps(fn)
    def efn(q):
        features = []
        for p in q.get('parts',[]):
            features = combine(features, inspect_part(p))
        if isinstance(features,bool):
            return [fn.__name__] if features else []
        else:
            return set(features)

@question_question
def has_resources(q):
    return q.resources.exists()

@question_question
def resources_have_alt_text(q):
    return q.resources.exclude(alt_text='').exists()

@question_question
def uses_extensions(q):
    return q.extensions.exists()

@question_question
def extensions_used(q):
    return ['question using extension '+e.location for e in q.extensions.all()]

@question_question
def uses_custom_part_types(q):
    return q.custom_part_types.exists()

@question_question
def custom_part_types_used(q):
    return ['question using custom part type '+p.short_name for p in q.custom_part_types.all()]

@question_content_question
def has_custom_rulesets(c):
    return len(c.get('rulesets',[])) > 0

@question_content_question
def has_variables(c):
    return ['has_variables' if len(c.get('variables',[])) > 0 else 'no_variables']

@question_content_question
def has_variable_groups(c):
    return len(c.get('variable_groups',[])) > 0

@question_content_question
def has_custom_functions(c):
    fns = list(c.get('functions',{}).values())
    features = []
    if len(fns)>0:
        features.append('has_custom_functions')
    for lang in set(f.get('language') for f in fns):
        if lang:
            features.append('has function in language '+lang)
    return features

@question_content_question
def has_preamble(c):
    p = c.get('preamble',{})
    languages = [k for k,v in p.items() if v]
    return ['has {} preamble'.format(k) for k in languages]

@question_content_question
def explore_mode(c):
    return c.get('partsMode')=='explore'

@part_question
def part_types_used(p):
    t = p.get('type')
    return ['uses part type '+t] if t else []

@part_question
def uses_custom_part_name(p):
    return p.get('useCustomName',False)

@part_question
def has_custom_marking_algorithm(p):
    return bool(p.get('customMarkingAlgorithm',False))

@part_question
def custom_marking_algorithm_from_scratch(p):
    return bool(p.get('customMarkingAlgorithm',False) and not p.get('extendBaseMarkingAlgorithm',False))

@part_question
def has_unit_tests(p):
    return len(p.get('unitTests',[])) > 0

@part_question
def has_alternatives(p):
    return len(p.get('alternatives',[])) > 0

@part_question
def has_variable_replacements(p):
    return len(p.get('variableReplacements',[])) > 0

@part_question
def nonzero_adaptive_marking_penalty(p):
    return str(p.get('adaptiveMarkingPenalty','0')) != '0'

@part_question
def has_steps(p):
    return len(p.get('steps',[])) > 0

@part_question
def has_custom_js_scripts(p):
    sd = p.get('scripts',{})
    features = []
    if sd:
        features.append('has custom javascript scripts')
    for k in sd.keys():
        features.append('has custom javascript script for '+k)
    return features

@exam_question
def uses_custom_theme(e):
    return e.custom_theme is not None 

@exam_question
def uses_theme(e):
    theme_name = e.theme if e.custom_theme is None else e.custom_theme.slug
    return ['uses theme '+theme_name]

@exam_question
def uses_locale(e):
    return ['uses locale '+e.locale]

@exam_content_question
def has_time_limit(e):
    return str(e.get('duration', '0')) != '0'

@exam_content_question
def has_percent_pass(e):
    return str(e.get('percentPass', '0')) != '0'

@exam_content_question
def shows_question_group_names(e):
    return e.get('showQuestionGroupNames',False)

@exam_content_question
def has_question_groups(e):
    return len(e.get('question_groups',[])) > 1

@exam_content_question
def menu_mode(e):
    return e.get('navigatemode','') == 'menu'

@exam_content_question
def has_password(e):
    return e.get('navigation',{}).get('startpassword','') != ''

@exam_content_question
def has_intro(e):
    return e.get('feedback',{}).get('intro','') != ''

@exam_content_question
def has_feedback_messages(e):
    return len(e.get('feedback',{}).get('feedbackmessages',[])) > 0

@editoritem_question
def published(e):
    return e.published

@editoritem_question
def has_access_rights(e):
    return e.access_rights.exists()

@editoritem_question
def has_licence(e):
    if e.licence:
        return ['has licence', 'has licence '+e.licence.short_name]

@editoritem_question
def has_tags(e):
    return e.tags.exists()

@editoritem_question
def has_ability_levels(e):
    return e.ability_levels.exists()

@editoritem_question
def has_subjects(e):
    return e.subjects.exists()

@editoritem_question
def has_topics(e):
    return e.topics.exists()

@editoritem_question
def has_taxonomy_nodes(e):
    return e.taxonomy_nodes.exists()

@editoritem_question 
def has_stamp(e):
    return e.current_stamp is not None

@editoritem_question
def has_pull_requests(e):
    return e.outgoing_pull_requests.exists() or e.incoming_pull_requests.exists()

@editoritem_question
def has_comments(e):
    return e.comments.exists()

@editoritem_question
def has_restore_points(e):
    return e.restore_points.exists()

@project_question
def has_members(p):
    return p.permissions.exists()

@project_question
def is_public(p):
    return p.public_view

@project_question
def has_watching_non_members(p):
    return p.watching_non_members.exists()

@project_question
def has_description(p):
    return bool(p.description)

@project_question
def has_default_locale(p):
    return ['has default locale '+p.default_locale]

@project_question
def has_default_licence(p):
    return p.default_licence is not None

@project_question
def has_custom_part_types(p):
    return p.custom_part_types.exists()

class Command(BaseCommand):
    help = 'Extract unit tests from one or more questions'

    def add_arguments(self, parser):
        parser.add_argument('--question',dest='question_ids',nargs='+', type=int)
        parser.add_argument('--project',dest='project_ids',nargs='+', type=int)
        parser.add_argument('--all', action='store_true')
        parser.add_argument('--exam',dest='exam_ids',nargs='+', type=int)
        parser.add_argument('--resurvey',action='store_true')

    def handle(self, *args, **options):
        self.options = options

        kinds = [
            'question',
            'exam',
            'editoritem',
            'project',
        ]

        with transaction.atomic():
            for kind in kinds:
                self.survey_object(kind)

        self.summarise_features()

    def survey_object(self, name):
        things = getattr(self,'gather_'+name+'s')()
        fn = getattr(self,'survey_'+name)

        n = things.count()
        print("Surveying {} {}s".format(n,name))

        oi = 0
        for i,o in enumerate(things):
            fn(o)
            if floor(i/100)>floor(oi/100):
                oi = i
                print('{}% of {}s'.format(floor(100*i/n),name))

    def record_feature(self, obj, feature):
        feature = feature.replace('_',' ')
        ct = ContentType.objects.get_for_model(obj)
        f,created = Feature.objects.get_or_create(object_content_type=ct, object_id=obj.pk, feature=feature)
        if not created:
            f.save()

    def summarise_features(self):
        print('')
        counts = Feature.objects.all().values('object_content_type','feature').annotate(freq=Count('feature'))
        for ctid, features in groupby(counts,key=lambda x: x['object_content_type']):
            ct = ContentType.objects.get(pk=ctid)
            print(ct.name)
            print("-"*len(ct.name))
            for f in features:
                print('{}\t{}'.format(f['freq'], f['feature']))

    def should_resurvey(self, obj, last_modified):
        features = Feature.objects.filter(object_content_type=ContentType.objects.get_for_model(obj),object_id=obj.pk)
        last_surveyed = features.aggregate(last_surveyed=Max('date_observed'))['last_surveyed']
        resurvey = self.options['resurvey'] or last_surveyed is None or last_modified > last_surveyed or self.options['resurvey']
        if resurvey:
            features.delete()
        return resurvey

    def gather_questions(self):
        options = self.options
        if options['all']:
            questions = NewQuestion.objects.all()
        else:
            q = Q()
            if options['project_ids']:
                project_pks = options['project_ids']
                q |= Q(editoritem__project__in=project_pks)

            if options['question_ids']:
                q |= Q(pk__in=options['question_ids'])

            if options['exam_ids']:
                q |= Q(exams__pk__in=options['exam_ids'])

            questions = NewQuestion.objects.filter(q).distinct()

        questions = questions.prefetch_related('resources','extensions','editoritem')

        return questions

    def survey_question(self, q):
        if not self.should_resurvey(q, q.editoritem.last_modified):
            return
        q.editoritem.get_parsed_content()
        for t in survey_questions['question']:
            t(self,q)

    def gather_exams(self):
        options = self.options
        if options['all']:
            exams = NewExam.objects.all()
        else:
            q = Q()
            if options['project_ids']:
                project_pks = options['project_ids']
                q |= Q(editoritem__project__in=project_pks)

            if options['exam_ids']:
                q |= Q(pk__in=options['qexam_ids'])

            exams = NewExam.objects.filter(q).distinct()

        exams = exams.prefetch_related('editoritem','custom_theme')

        return exams

    def survey_exam(self, e):
        if not self.should_resurvey(e, e.editoritem.last_modified):
            return
        e.editoritem.get_parsed_content()
        for t in survey_questions['exam']:
            t(self,e)

    def gather_editoritems(self):
        options = self.options
        if options['all']:
            editoritems = EditorItem.objects.all()
        else:
            q = Q()
            if options['project_ids']:
                q |= Q(project__in=options['project_ids'])

            editoritems = EditorItem.objects.filter(q).distinct()

        editoritems = editoritems.prefetch_related('comments','access_rights','licence','current_stamp','ability_levels','subjects','topics','taxonomy_nodes')

        return editoritems

    def survey_editoritem(self, e):
        if not self.should_resurvey(e, e.last_modified):
            return
        e.get_parsed_content()
        for t in survey_questions['editoritem']:
            t(self,e)

    def gather_projects(self):
        options = self.options
        if options['all']:
            projects = Project.objects.all()
        elif options['project_ids']:
            projects = Project.objects.filter(pk__in=options['project_ids'])
        else:
            return []

        return projects

    def survey_project(self, p):
        for t in survey_questions['project']:
            t(self,p)
