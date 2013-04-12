from south.db import db
from south.v2 import SchemaMigration
from accounts.models import UserProfile
from django.contrib.auth.models import User

class Migration(SchemaMigration):
	def forwards(self,orm):
		for u in User.objects.all():
			UserProfile.objects.get_or_create(user=u)
	
	complete_apps = ['accounts']
