import django_tables2 as tables
from django.core.urlresolvers import reverse
from django_tables2.columns import TemplateColumn,Column
from django_tables2 import columns
from django_tables2.utils import A
from editor.models import Question, Exam, QuestionHighlight, ExamHighlight

class UserColumn(columns.linkcolumn.BaseLinkColumn):
    def render(self,value,record,bound_column):
        user = value
        uri = reverse('view_profile',args=[user.pk])
        text = user.get_full_name()
        return self.render_link(uri,text)

class ObjectTable(tables.Table):
    last_modified = Column()

    class Meta:
        attrs = {'class': 'search-results'}

        fields = ('name', 'current_stamp', 'licence', 'author')
        order_by = ('-last_modified')

    def render_last_modified(self,record):
        return record.last_modified.strftime('%d/%m/%Y %H:%M')

class HighlightTable(ObjectTable):
    name = Column()
    
    class Meta:
        fields = ('name','date')
        order_by = ('date')

class QuestionTable(ObjectTable):
    name = TemplateColumn(template_name='question/name_column.html')
    current_stamp = TemplateColumn(template_name='stamp_column.html', verbose_name='Status',orderable=False)
    licence = TemplateColumn(template_name='licence_column.html')
    author = UserColumn()

    class Meta(ObjectTable.Meta):
        model = Question
        sequence = ('name','current_stamp','licence','author','last_modified')

class QuestionHighlightTable(HighlightTable):
    class Meta(HighlightTable.Meta):
        model = QuestionHighlight

class ExamTable(ObjectTable):
    name = TemplateColumn(template_name='exam/name_column.html')
    current_stamp = TemplateColumn(template_name='stamp_column.html', verbose_name='Status',orderable=False)
    licence = TemplateColumn(template_name='licence_column.html')
    author = UserColumn()

    class Meta(ObjectTable.Meta):
        model = Exam
        sequence = ('name','current_stamp','licence','author','last_modified')

class ExamHighlightTable(HighlightTable):
    class Meta(HighlightTable.Meta):
        model = ExamHighlight

