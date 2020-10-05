const ClientOAuth2 = require("client-oauth2");

class OAuthenticate {
  static auth2(
    clientid,
    clientsecret,
    authuri,
    redirecturi,
    accesstokenuri,
    scopes
  ) {
    const auth = new ClientOAuth2({
      clientId: clientid,
      clientSecret: clientsecret,
      accessTokenUri: accesstokenuri,
      authorizationUri: authuri,
      redirectUri: redirecturi,
      scopes: scopes,
    });
    console.log(auth);
  }
}

module.exports = OAuthenticate;
