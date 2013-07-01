from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User

class Command(BaseCommand):
	help = 'Show the 10 newest users'

	def handle(self, *args, **options):
		users = User.objects.all().order_by('-date_joined')
		for user in users[:10]:
			self.stdout.write('%s (%s) joined %s' % (user.get_full_name(),user.email,user.date_joined))
