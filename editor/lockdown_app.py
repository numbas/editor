import binascii
from Crypto import Random
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
from django.conf import settings
import hashlib
import json

def make_key(password):
    key = hashlib.scrypt(password.encode('utf-8'),salt=getattr(settings,'LOCKDOWN_APP').get('salt','').encode('utf-8'),n=16384,r=8,p=1)
    return key[:24]

def encrypt(password, message):
    msglist = []
    key = make_key(password)
    print('KEY: ',binascii.hexlify(key))
    iv = Random.new().read(AES.block_size)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    encrypted = cipher.encrypt(pad(message.encode('utf-8'), AES.block_size))
    return iv, encrypted


def make_link(request, launch_url, password):
    token = ''

    link_settings = {
        'url': launch_url,
        'token': token,
    }

    iv, encrypted = encrypt(password, json.dumps(link_settings))
    print(getattr(settings,'LOCKDOWN_APP').get('salt',''))
    print(password)
    print(iv)
    print(encrypted)
    url = f'numbas://{request.get_host()}/'+binascii.hexlify(iv+encrypted).decode('ascii')
    return url
