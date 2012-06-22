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
        return super(NumbasAuthBackend, self).get_or_create_user(username, ldap_user)
