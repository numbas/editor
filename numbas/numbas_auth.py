from django.conf import settings

try:
    from django_auth_ldap.backend import LDAPBackend
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
            user,created = super(NumbasAuthBackend, self).get_or_create_user(username, ldap_user)
            if created:
                p = user.userprofile.personal_project
                p.name = "{}'s workspace".format(ldap_user.attrs['givenName'][0])
                p.save()
            return user,created
except ImportError:
    pass

try:
    from shibboleth.middleware import ShibbolethRemoteUserMiddleware
    class NumbasShibbolethRemoteUserMiddleware(ShibbolethRemoteUserMiddleware):
        """Authentication backend overriding ShibbolethRemoteUserMiddleware."""

        header = settings.SHIBBOLETH_USERNAME_HEADER
except ImportError:
    pass
