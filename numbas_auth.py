from django_auth_ldap.backend import LDAPBackend
from shibboleth.middleware import ShibbolethRemoteUserMiddleware

class NumbasAuthBackend(LDAPBackend):
    
    """Authentication backend overriding LDAPBackend.
    
    This could be used to override certain functionality within the LDAP authentication backend.
    The example here overrides get_or_create_user() to alter the LDAP givenName attribute.
    
    To use this backend, edit settings.py and replace the LDAPBackend line in AUTHENTICATION_BACKENDS with
        numbas_auth.NumbasAuthBackend
        
    """
    
    def get_or_create_user(self, username, ldap_user):
        """Alter the LDAP givenName attribute to the familiar first name in displayName."""
        
        ldap_user.attrs['givenName'] = [ldap_user.attrs['displayName'][0].split()[0]]
        return super(NumbasAuthBackend, self).get_or_create_user(username, ldap_user)


class NumbasShibbolethRemoteUserMiddleware(ShibbolethRemoteUserMiddleware):
    """Authentication backend overriding ShibbolethRemoteUserMiddleware."""

    # If the Shibboleth username header should not be REMOTE_USER, then set
    # what it should be here.  This is the only user attribute that should be
    # set here; all others should be set in shib_auth.py
    header = 'uname'

    def make_profile(self, user, shib_meta):
        """Transform the displayname into a friendly first name."""
        user.first_name = user.first_name.split()[0]
        user.save()
