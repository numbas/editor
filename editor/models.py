from django.db import models
from django.template.defaultfilters import slugify

class Question(models.Model):
    
    """Model class for a question.
    
    Many-to-many relation with Exam through ExamQuestion.
    
    """
    
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(editable=False, unique=True)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200, editable=False)
    content = models.TextField(blank=True)
    metadata = models.TextField(blank=True)
    tags = models.TextField(blank=True)
    
    def __unicode__(self):
        return self.name
    
    def save(self, *args, **kwargs):
#        if not self.pk:
        self.slug = slugify(self.name)
            
        super(Question, self).save(*args, **kwargs)


class Exam(models.Model):
    
    """Model class for an Exam.
    
    Many-to-many relation with Question through ExamQuestion.
    
    """
    
    questions = models.ManyToManyField(Question, through='ExamQuestion',
                                       blank=True, editable=False)
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(editable=False, unique=True)
    author = models.CharField(max_length=200)
    filename = models.CharField(max_length=200, editable=False)
    content = models.TextField(blank=True)
    metadata = models.TextField(blank=True)
    
    def __unicode__(self):
        return self.name
    
    def save(self, *args, **kwargs):
#        if not self.pk:
        self.slug = slugify(self.name)
            
        super(Exam, self).save(*args, **kwargs)
        
        
class ExamQuestion(models.Model):
    
    """Model class linking exams and questions."""
    
    class Meta:
        unique_together = (('exam', 'question'), ('exam', '_order'))
        ordering = ['_order']
#        order_with_respect_to = 'exam'
         
    exam = models.ForeignKey(Exam)
    question = models.ForeignKey(Question)
    _order = models.PositiveIntegerField()