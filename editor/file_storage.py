from django.core.files import File
from django.core.files.storage import FileSystemStorage
import hashlib
from pathlib import Path

def hashed_name(name, content):
    if not hasattr(content, "chunks"):
        content = File(content, name)

    content.seek(0)
    h = hashlib.file_digest(content, 'sha256').hexdigest()

    p = Path(name)
    name = str((p.parent / h).with_suffix(p.suffix))
    return name

class HashedFilenameStorage(FileSystemStorage):
    def save(self, name, content, *args, **kwargs):
        name = hashed_name(name, content)
        if self.exists(name):
            return name

        return super().save(name, content, *args, **kwargs)
