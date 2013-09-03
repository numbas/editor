# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding M2M table for field favourite_exams on 'UserProfile'
        db.create_table(u'accounts_userprofile_favourite_exams', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('userprofile', models.ForeignKey(orm[u'accounts.userprofile'], null=False)),
            ('exam', models.ForeignKey(orm[u'editor.exam'], null=False))
        ))
        db.create_unique(u'accounts_userprofile_favourite_exams', ['userprofile_id', 'exam_id'])


    def backwards(self, orm):
        # Removing M2M table for field favourite_exams on 'UserProfile'
        db.delete_table('accounts_userprofile_favourite_exams')


    models = {
        u'accounts.registrationprofile': {
            'Meta': {'object_name': 'RegistrationProfile', '_ormbases': [u'registration.RegistrationProfile']},
            u'registrationprofile_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['registration.RegistrationProfile']", 'unique': 'True', 'primary_key': 'True'})
        },
        u'accounts.userprofile': {
            'Meta': {'object_name': 'UserProfile'},
            'bio': ('sanitizer.models.SanitizedTextField', [], {'default': "''"}),
            'favourite_exams': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'fans'", 'blank': 'True', 'to': u"orm['editor.Exam']"}),
            'favourite_questions': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'fans'", 'blank': 'True', 'to': u"orm['editor.Question']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'default': "'en-GB'", 'max_length': '100'}),
            'user': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['auth.User']", 'unique': 'True'})
        },
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'editor.editortag': {
            'Meta': {'ordering': "['name']", 'object_name': 'EditorTag'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'official': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '100'})
        },
        u'editor.exam': {
            'Meta': {'ordering': "['name']", 'object_name': 'Exam'},
            'access_rights': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'accessed_exams+'", 'blank': 'True', 'through': u"orm['editor.ExamAccess']", 'to': u"orm['auth.User']"}),
            'author': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'own_exams'", 'to': u"orm['auth.User']"}),
            'content': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(1970, 1, 1, 0, 0)', 'auto_now_add': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '200'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_modified': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(1970, 1, 1, 0, 0)', 'auto_now': 'True', 'blank': 'True'}),
            'locale': ('django.db.models.fields.CharField', [], {'default': "'en-GB'", 'max_length': '200'}),
            'metadata': ('editor.jsonfield.JSONField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'default': "'Untitled Exam'", 'max_length': '200'}),
            'public_access': ('django.db.models.fields.CharField', [], {'default': "'view'", 'max_length': '6'}),
            'questions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['editor.Question']", 'symmetrical': 'False', 'through': u"orm['editor.ExamQuestion']", 'blank': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '200'}),
            'theme': ('django.db.models.fields.CharField', [], {'default': "'default'", 'max_length': '200'})
        },
        u'editor.examaccess': {
            'Meta': {'object_name': 'ExamAccess'},
            'access': ('django.db.models.fields.CharField', [], {'default': "'view'", 'max_length': '6'}),
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['editor.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'editor.examquestion': {
            'Meta': {'ordering': "['qn_order']", 'object_name': 'ExamQuestion'},
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['editor.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'qn_order': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'question': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['editor.Question']"})
        },
        u'editor.image': {
            'Meta': {'object_name': 'Image'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('django.db.models.fields.files.ImageField', [], {'max_length': '255'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'editor.question': {
            'Meta': {'ordering': "['name']", 'object_name': 'Question'},
            'access_rights': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'accessed_questions+'", 'blank': 'True', 'through': u"orm['editor.QuestionAccess']", 'to': u"orm['auth.User']"}),
            'author': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'own_questions'", 'to': u"orm['auth.User']"}),
            'content': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(1970, 1, 1, 0, 0)', 'auto_now_add': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '200'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_modified': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(1970, 1, 1, 0, 0)', 'auto_now': 'True', 'blank': 'True'}),
            'metadata': ('editor.jsonfield.JSONField', [], {'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'default': "'Untitled Question'", 'max_length': '200'}),
            'progress': ('django.db.models.fields.CharField', [], {'default': "'in-progress'", 'max_length': '15'}),
            'public_access': ('django.db.models.fields.CharField', [], {'default': "'view'", 'max_length': '6'}),
            'resources': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['editor.Image']", 'symmetrical': 'False', 'blank': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'max_length': '200'})
        },
        u'editor.questionaccess': {
            'Meta': {'object_name': 'QuestionAccess'},
            'access': ('django.db.models.fields.CharField', [], {'default': "'view'", 'max_length': '6'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'question': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['editor.Question']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"})
        },
        u'editor.taggedquestion': {
            'Meta': {'object_name': 'TaggedQuestion'},
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "u'editor_taggedquestion_tagged_items'", 'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'object_id': ('django.db.models.fields.IntegerField', [], {'db_index': 'True'}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'tagged_items'", 'to': u"orm['editor.EditorTag']"})
        },
        u'registration.registrationprofile': {
            'Meta': {'object_name': 'RegistrationProfile'},
            'activation_key': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']", 'unique': 'True'})
        }
    }

    complete_apps = ['accounts']