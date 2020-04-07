from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import mistune
import re
import bs4
from editor.models import Tip, NewQuestion, NewExam

class Command(BaseCommand):
    help = 'Populate the tips table'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str)

    def handle(self, *args, **options):
        filename = options['file']
        with open(filename) as f:
            bits = f.read().split('\n\n---\n\n')
        for bit in bits:
            html = mistune.markdown(bit.strip())
            soup = bs4.BeautifulSoup(html,'html.parser')
            title_tag = soup.contents[0]
            soup.contents = soup.contents[1:]
            if title_tag.name != 'h2':
                raise Exception("Expected an H2 tag at the start")
            title = title_tag.text
            title = ''.join(str(x) for x in title_tag.children)
            link = None
            url = None
            editoritem = None
            for i in range(len(soup.contents)-1,0,-1):
                t = soup.contents[i]
                if not isinstance(t,bs4.element.Tag):
                    continue
                a = t.contents[0]
                if a.name != 'a':
                    break
                qm = re.match(r'https://numbas.mathcentre.ac.uk/question/(\d+)',a['href'])
                em = re.match(r'https://numbas.mathcentre.ac.uk/exam/(\d+)',a['href'])
                if qm:
                    print(qm.group(1))
                    q = NewQuestion.objects.get(pk=int(qm.group(1)))
                    editoritem = q.editoritem
                elif em:
                    e = NewExam.objects.get(pk=int(em.group(1)))
                    editoritem = e.editoritem
                else:
                    url = a['href']
                    link = a.text
                break

            if link is not None:
                soup.contents = soup.contents[:i]

            tip,created = Tip.objects.get_or_create(title=title)
            tip.text = str(soup)
            tip.link = url
            tip.link_text = link
            tip.save()

            print(tip)
