import django_tables2 as tables
from django.core.urlresolvers import reverse
from django_tables2.columns import TemplateColumn,Column
from django_tables2 import columns
from django_tables2.utils import A
from editor.models import Question, Exam

class UserColumn(columns.linkcolumn.BaseLinkColumn):
    def render(self,value,record,bound_column):
        user = value
        uri = reverse('view_profile',args=[user.pk,user.username])
        text = user.get_full_name()
        return self.render_link(uri,text)

class ObjectTable(tables.Table):

    class Meta:
        attrs = {'class': 'search-results'}

        fields = ('name', 'author')
        order_by = ('-last_modified')

    def render_last_modified(self,record):
        return record.last_modified.strftime('%d/%m/%Y %H:%M')

class QuestionTable(ObjectTable):
    name = TemplateColumn(template_name='question/name_column.html')
    author = UserColumn()
    col_progress = Column(verbose_name='Progress',accessor='progress')
    last_modified = Column()

    class Meta(ObjectTable.Meta):
        model = Question


class ExamTable(ObjectTable):
    name = TemplateColumn(template_name='exam/name_column.html')
    author = UserColumn()
    last_modified = Column()

    class Meta(ObjectTable.Meta):
        model = Exam
