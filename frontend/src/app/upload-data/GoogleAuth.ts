import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

export class AuthService {

  constructor(private oauthService: OAuthService) {
    this.configureOAuth();
  }

  private configureOAuth() {
    const authConfig: AuthConfig = {
      issuer: 'https://accounts.google.com',
      redirectUri: window.location.origin + '/callback',
      clientId: '',
      responseType: 'token',
      scope: 'https://www.googleapis.com/auth/drive', // Specify necessary scopes
    };

    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login() {
    this.oauthService.initImplicitFlow();
  }

  getAccessToken(): string {
    return this.oauthService.getAccessToken();
  }

  // Other methods related to logout, check login status, etc.
}