#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from django.db import models
from django.template.defaultfilters import slugify

class Question(models.Model):
    
    """Model class for a question.
    
    Many-to-many relation with Exam through ExamQuestion.
    
    """
    
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False)
    author = models.CharField(max_length=200, blank=True, editable=False)
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
    name = models.CharField(max_length=200)
    slug = models.SlugField(editable=False)
    author = models.CharField(max_length=200, blank=True, editable=False)
    filename = models.CharField(max_length=200, editable=False)
    content = models.TextField(blank=True)
    metadata = models.TextField(blank=True)
    
    def __unicode__(self):
        return self.name
    
    def get_questions(self):
        return self.questions.order_by('examquestion')
    
    def save(self, *args, **kwargs):
#        if not self.pk:
        self.slug = slugify(self.name)
            
        super(Exam, self).save(*args, **kwargs)
        
        
class ExamQuestion(models.Model):
    
    """Model class linking exams and questions."""
    
    class Meta:
#        unique_together = (('exam', 'question'), ('exam', 'qn_order'))
        ordering = ['qn_order']
        
    exam = models.ForeignKey(Exam)
    question = models.ForeignKey(Question)
    qn_order = models.PositiveIntegerField()
