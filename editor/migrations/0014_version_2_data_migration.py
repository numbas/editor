# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.utils.encoding import force_text
from django.core import serializers

def old_to_new_questions(apps, schema_editor):
    Question = apps.get_model('editor','Question')
    NewQuestion = apps.get_model('editor','NewQuestion')
    EditorItem = apps.get_model('editor','EditorItem')
    NewStampOfApproval = apps.get_model('editor','NewStampOfApproval')
    TaggedQuestion = apps.get_model('editor','TaggedQuestion')
    TaggedItem = apps.get_model('editor','TaggedItem')
    Resource = apps.get_model('editor','Resource')
    User = apps.get_model('auth','User')
    ContentType = apps.get_model('contenttypes','contenttype')

    editoritem_ct= ContentType.objects.get_for_model(EditorItem)

    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False

    for q in Question.objects.all():
        nq = NewQuestion()
        nq.pk = q.pk

        ei = EditorItem()

        ei.name = q.name
        ei.slug = q.slug
        ei.filename = q.filename
        ei.author = q.author
        ei.public_access = q.public_access
        ei.licence = q.licence

        ei.content = q.content
        ei.metadata = q.metadata

        ei.created = q.created
        ei.last_modified = q.last_modified

        ei.published = q.published
        ei.published_date = q.published_date

        ei.ability_level_start = q.ability_level_start
        ei.ability_level_end = q.ability_level_end

        ei.save()
        nq.editoritem = ei
        nq.save()

        if q.current_stamp:
            ns = NewStampOfApproval()
            ns.object = ei
            ns.user = User.objects.get(pk=q.current_stamp.user.pk)
            ns.status = q.current_stamp.status
            ns.date = q.current_stamp.date
            ns.save()
            ei.current_stamp = ns

        for al in q.ability_levels.all():
            ei.ability_levels.add(al)

        for s in q.subjects.all():
            ei.subjects.add(s)

        for t in q.topics.all():
            ei.topics.add(t)

        for r in q.resources.all():
            r2 = Resource.objects.create(owner=ei.author,file=r.image)
            nq.resources.add(r2)

        for e in q.extensions.all():
            nq.extensions.add(e)

        ei.save()
        nq.save()

    for q in Question.objects.all():
        if q.copy_of:
            nq = NewQuestion.objects.get(pk=q.pk)
            nq.editoritem.copy_of = NewQuestion.objects.get(pk=q.copy_of.pk).editoritem
            nq.save()

    for tq in TaggedQuestion.objects.all():
        TaggedItem.objects.create(content_type=editoritem_ct,object_id=NewQuestion.objects.get(pk=tq.object_id).editoritem.pk,tag=tq.tag)

def remove_new_questions(apps, schema_editor):
    for name in ['NewQuestion','NewExam','EditorItem','TaggedItem','Access','NewStampOfApproval']:
        model = apps.get_model('editor',name)
        model.objects.all().delete()


def old_exams_to_new(apps, schema_editor):
    Exam = apps.get_model('editor','Exam')
    NewExam = apps.get_model('editor','NewExam')
    NewQuestion = apps.get_model('editor','NewQuestion')
    EditorItem = apps.get_model('editor','EditorItem')
    NewStampOfApproval = apps.get_model('editor','NewStampOfApproval')
    ExamQuestion = apps.get_model('editor','ExamQuestion')
    NewExamQuestion = apps.get_model('editor','NewExamQuestion')
    User = apps.get_model('auth','User')

    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False

    for e in Exam.objects.all():
        ne = NewExam()
        ne.pk = e.pk

        ei = EditorItem()

        ei.name = e.name
        ei.slug = e.slug
        ei.filename = e.filename
        ei.author = e.author
        ei.public_access = e.public_access
        ei.licence = e.licence

        ei.content = e.content
        ei.metadata = e.metadata

        ei.created = e.created
        ei.last_modified = e.last_modified

        ei.published = e.published
        ei.published_date = e.published_date

        ei.ability_level_start = e.ability_level_start
        ei.ability_level_end = e.ability_level_end

        ne.theme = e.theme
        ne.custom_theme = e.custom_theme
        ne.locale = e.locale

        ei.save()
        ne.editoritem = ei
        ne.save()

        if e.current_stamp:
            ns = NewStampOfApproval()
            ns.object = ei
            ns.user = User.objects.get(pk=e.current_stamp.user.pk)
            ns.status = e.current_stamp.status
            ns.date = e.current_stamp.date
            ns.save()
            ei.current_stamp = ns

        for al in e.ability_levels.all():
            ei.ability_levels.add(al)

        for s in e.subjects.all():
            ei.subjects.add(s)

        for t in e.topics.all():
            ei.topics.add(t)

        ei.save()
        ne.save()
    
    for eq in ExamQuestion.objects.all():
        neq = NewExamQuestion()
        neq.exam = NewExam.objects.get(pk=eq.exam.pk)
        neq.question = NewQuestion.objects.get(pk=eq.question.pk)
        neq.qn_order = eq.qn_order
        neq.save()


def remove_new_exams(apps,schema_editor):
    NewExam = apps.get_model('editor','NewExam')
    NewExam.objects.all().delete()
    NewExamQuestion = apps.get_model('editor','NewExamQuestion')
    NewExamQuestion.objects.all().delete()

def old_access_to_new(apps,schema_editor):
    Exam = apps.get_model('editor','exam')
    Question = apps.get_model('editor','question')
    NewExam = apps.get_model('editor','newexam')
    NewQuestion = apps.get_model('editor','newquestion')
    EditorItem = apps.get_model('editor','editoritem')
    QuestionAccess = apps.get_model('editor','QuestionAccess')
    ExamAccess = apps.get_model('editor','ExamAccess')
    Access = apps.get_model('editor','Access')

    for qa in QuestionAccess.objects.all():
        Access.objects.create(item=NewQuestion.objects.get(pk=qa.question.pk).editoritem,user=qa.user,access=qa.access)

    for ea in ExamAccess.objects.all():
        Access.objects.create(item=NewExam.objects.get(pk=ea.exam.pk).editoritem,user=ea.user,access=ea.access)

def remove_new_access(apps,schema_editor):
    Access = apps.get_model('editor','Access')

    Access.objects.all().delete()

def copy_revisions(apps, schema_editor):
    Version = apps.get_model('reversion','Version')
    ContentType = apps.get_model('contenttypes','contenttype')
    Exam = apps.get_model('editor','exam')
    Question = apps.get_model('editor','question')
    NewExam = apps.get_model('editor','newexam')
    NewQuestion = apps.get_model('editor','newquestion')
    User = apps.get_model('auth','user')
    Theme = apps.get_model('editor','theme')
    Licence = apps.get_model('editor','licence')
    EditorItem = apps.get_model('editor','editoritem')
    TimelineItem = apps.get_model('editor','timelineitem')
    RestorePoint = apps.get_model('editor','restorepoint')

    exam_ct = ContentType.objects.get_for_model(Exam)
    question_ct = ContentType.objects.get_for_model(Question)
    newexam_ct = ContentType.objects.get_for_model(NewExam)
    newquestion_ct = ContentType.objects.get_for_model(NewQuestion)
    editoritem_ct = ContentType.objects.get_for_model(EditorItem)
    restorepoint_ct = ContentType.objects.get_for_model(RestorePoint)
 
    for v in Version.objects.exclude(revision__comment=''):
        if v.content_type==exam_ct:
            data = v.serialized_data
            data = force_text(data.encode("utf8"))
            e = list(serializers.deserialize(v.format, data, ignorenonexistent=True))[0].object
            try:
                ne = NewExam.objects.get(pk=v.object_id)
            except NewExam.DoesNotExist:
                continue
            ei = ne.editoritem

            ei.name = e.name
            ei.author = User.objects.get(pk=e.author.pk)
            ei.content = e.content
            ei.created = e.created
            ei.content = e.content
            ei.share_uuid = q.share_uuid
            ei.last_modified = e.last_modified
            if e.licence:
                try:
                    ei.licence = Licence.objects.get(pk=e.licence.pk)
                except Licence.DoesNotExist:
                    pass
            ei.public_access = e.public_access
            ei.slug = e.slug
            ei.metadata = e.metadata

            ne.locale = e.locale
            ne.theme = e.theme
            try:
                if e.custom_theme:
                    ne.custom_theme = Theme.objects.get(pk=e.custom_theme.pk)
            except exceptions.ObjectDoesNotExist:
                pass

            nve = Version()
            nve.format = v.format
            nve.content_type = editoritem_ct
            nve.object_id = ei.pk
            nve.object_id_int = ei.pk
            nve.object_repr = repr(ei)
            nve.revision = v.revision
            nve.serialized_data = serializers.serialize(v.format,(ei,))
            nve.save()

            nvx = Version()
            nvx.format = 'json'
            nvx.content_type = newexam_ct
            nvx.object_id = v.object_id
            nvx.object_id_int = v.object_id
            nvx.object_repr = repr(ne)
            nvx.revision = v.revision
            nvx.serialized_data = serializers.serialize(v.format,(ne,))
            nvx.save()
        elif v.content_type==question_ct:
            data = v.serialized_data
            data = force_text(data.encode("utf8"))
            q = list(serializers.deserialize(v.format, data, ignorenonexistent=True))[0].object
            try:
                nq = NewQuestion.objects.get(pk=v.object_id)
            except NewQuestion.DoesNotExist:
                continue
            ei = nq.editoritem

            ei.name = q.name
            ei.author = User.objects.get(pk=q.author.pk)
            ei.content = q.content
            ei.created = q.created
            ei.content = q.content
            ei.share_uuid = q.share_uuid
            ei.last_modified = q.last_modified
            if q.licence:
                try:
                    ei.licence = Licence.objects.get(pk=q.licence.pk)
                except Licence.DoesNotExist:
                    pass
            ei.public_access = q.public_access
            ei.slug = q.slug
            ei.metadata = q.metadata
            try:
                if q.copy_of:
                    ei.copy_of = NewQuestion.objects.get(pk=q.copy_of.pk).editoritem
            except NewQuestion.DoesNotExist:
                pass

            nve = Version()
            nve.format = v.format
            nve.content_type = editoritem_ct
            nve.object_id = ei.pk
            nve.object_id_int = ei.pk
            nve.object_repr = repr(ei)
            nve.revision = v.revision
            nve.serialized_data = serializers.serialize(v.format,(ei,))
            nve.save()

            nvq = Version()
            nvq.format = 'json'
            nvq.content_type = newquestion_ct
            nvq.object_id = v.object_id
            nvq.object_id_int = v.object_id
            nvq.object_repr = repr(nq)
            nvq.revision = v.revision
            nvq.serialized_data = serializers.serialize(v.format,(nq,))
            nvq.save()

    def set_timelineitem_date_auto_now(v):
        ti = TimelineItem()
        for field in ti._meta.local_fields:
            if field.name == "date":
                field.auto_now_add = v

    set_timelineitem_date_auto_now(True)

    RestorePoint.objects.all().delete()
    for v in Version.objects.exclude(revision__comment='').exclude(revision__user=None).filter(content_type=editoritem_ct):
        ei = EditorItem.objects.get(pk=v.object_id)
        rp = RestorePoint.objects.create(object=ei,description=v.revision.comment,user=v.revision.user,revision=v.revision)
        
    set_timelineitem_date_auto_now(False)
    for rp in RestorePoint.objects.all():
        ti = TimelineItem.objects.get(object_content_type=restorepoint_ct,object_id=rp.pk)
        for field in ti._meta.local_fields:
            if field.name == "date":
                field.auto_now_add = False
        ti.date = rp.revision.date_created
        ti.save()

def delete_new_revisions(apps, schema_editor):
    Version = apps.get_model('reversion','Version')
    ContentType = apps.get_model('contenttypes','contenttype')
    RestorePoint = apps.get_model('editor','restorepoint')

    exam_ct = ContentType.objects.get(app_label='editor',model='exam')
    question_ct = ContentType.objects.get(app_label='editor',model='question')
    newexam_ct = ContentType.objects.get(app_label='editor',model='newexam')
    newquestion_ct = ContentType.objects.get(app_label='editor',model='newquestion')
    editoritem_ct = ContentType.objects.get(app_label='editor',model='editoritem')

    Version.objects.filter(content_type__in=[newexam_ct,newquestion_ct,editoritem_ct]).delete()

    RestorePoint.objects.all().delete()
    pass

def set_newstamp_dates(apps, schema_editor):
    ContentType = apps.get_model('contenttypes','contenttype')
    TimelineItem = apps.get_model('editor','timelineitem')
    NewStampOfApproval = apps.get_model('editor','newstampofapproval')
    StampOfApproval = apps.get_model('editor','stampofapproval')

    def set_timelineitem_date_auto_now(v):
        ti = TimelineItem.objects.first()
        if ti:
            for field in ti._meta.local_fields:
                if field.name == "date":
                    field.auto_now_add = v

    set_timelineitem_date_auto_now(False)

    newstamp_ct = ContentType.objects.get_for_model(NewStampOfApproval)

    for ns in NewStampOfApproval.objects.all():
        try:
            rel_obj = ns.object.exam
        except Exception:
            rel_obj = ns.object.question
        os = StampOfApproval.objects.filter(object_id=rel_obj.id).last()
        if os is not None:
            ti = TimelineItem.objects.get(object_content_type=newstamp_ct,object_id=ns.pk)
            for field in ti._meta.local_fields:
                if field.name == "date":
                    field.auto_now_add = False
                ti.date = os.date
            ti.save()

def set_project(apps,schema_editor):
    EditorItem = apps.get_model('editor','EditorItem')

    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False

    for e in EditorItem.objects.all():
        e.project = e.author.userprofile.personal_project
        e.save()

def copy_comments(apps,schema_editor):
    ContentType = apps.get_model('contenttypes','contenttype')
    TimelineItem = apps.get_model('editor','timelineitem')
    Comment = apps.get_model('editor','comment')
    Question = apps.get_model('editor','question')
    NewQuestion = apps.get_model('editor','newquestion')
    EditorItem = apps.get_model('editor','editoritem')

    question_ct = ContentType.objects.get_for_model(Question)
    newquestion_ct = ContentType.objects.get_for_model(NewQuestion)
    editoritem_ct = ContentType.objects.get_for_model(EditorItem)
    comment_ct = ContentType.objects.get_for_model(Comment)

    for oc in Comment.objects.filter(object_content_type=question_ct):
        ei = NewQuestion.objects.get(pk=oc.object_id).editoritem
        nc = Comment.objects.create(object_id=ei.pk,object_content_type=editoritem_ct, user=oc.user,text=oc.text)

    for c in Comment.objects.filter(object_content_type=newquestion_ct):
        ti = TimelineItem.objects.get(object_content_type=comment_ct,object_id=c.pk)
        for field in ti._meta.local_fields:
            if field.name == "date":
                field.auto_now_add = False
        ti.date = c.date
        ti.save()

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0013_version_2_models'),
        ('reversion','__first__'),
        ('auth','__first__'),
        ('accounts','0010_create_personal_projects'),
    ]

    operations = [
        migrations.RunPython(old_to_new_questions,remove_new_questions),
        migrations.RunSQL(
        """
            SELECT ei.id,et.id,ct.id 
            FROM editor_taggedquestion as tq 
            JOIN editor_editortag as et ON tq.tag_id=et.id 
            JOIN editor_question AS q ON q.id=tq.object_id 
            JOIN editor_newquestion AS nq on nq.id=q.id 
            JOIN editor_editoritem AS ei ON ei.id=nq.editoritem_id
            JOIN django_content_type as ct ON ct.app_label="editor" AND ct.model="editoritem"
        """,
        """
            DELETE FROM editor_taggeditem
        """),
        migrations.RunPython(old_exams_to_new,remove_new_exams),
        migrations.RunPython(copy_revisions,delete_new_revisions),
        migrations.RunPython(old_access_to_new,remove_new_access),
        migrations.RunPython(set_newstamp_dates,migrations.RunPython.noop),
        migrations.RunPython(set_project,migrations.RunPython.noop),
        migrations.RunPython(copy_comments,migrations.RunPython.noop),
    ]
