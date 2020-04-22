from django.core.signing import Signer

def unsubscribe_signer():
    return Signer(salt='unsubscribe')

def unsubscribe_token(user):
    return unsubscribe_signer().sign(user.username)

def unsubscribe_unsign(token):
    return unsubscribe_signer().unsign(token)
