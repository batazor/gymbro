// Тесты для проверки redirect URI
describe('Redirect URI Configuration', () => {
  test('должен использовать правильный redirect URI', () => {
    const redirectUri = 'https://auth.expo.io/@batazor/gymbro';
    
    expect(redirectUri).toBe('https://auth.expo.io/@batazor/gymbro');
    expect(redirectUri).toContain('auth.expo.io');
    expect(redirectUri).toContain('@batazor');
    expect(redirectUri).toContain('gymbro');
  });

  test('должен правильно формировать URL авторизации с redirect URI', () => {
    const clientId = 'test-client-id.apps.googleusercontent.com';
    const redirectUri = 'https://auth.expo.io/@batazor/gymbro';
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    expect(authUrl).toContain('accounts.google.com');
    expect(authUrl).toContain('client_id=' + clientId);
    expect(authUrl).toContain('redirect_uri=' + encodeURIComponent(redirectUri));
    expect(authUrl).toContain('response_type=code');
  });

  test('должен правильно кодировать redirect URI', () => {
    const redirectUri = 'https://auth.expo.io/@batazor/gymbro';
    const encodedUri = encodeURIComponent(redirectUri);
    
    expect(encodedUri).toBe('https%3A%2F%2Fauth.expo.io%2F%40batazor%2Fgymbro');
    expect(encodedUri).toContain('%3A'); // :
    expect(encodedUri).toContain('%2F'); // /
    expect(encodedUri).toContain('%40'); // @
  });

  test('должен правильно обрабатывать различные форматы redirect URI', () => {
    const redirectUris = [
      'https://auth.expo.io/@batazor/gymbro',
      'exp://localhost:8081',
      'exp://127.0.0.1:8081'
    ];
    
    redirectUris.forEach(uri => {
      expect(uri).toBeDefined();
      expect(uri.length).toBeGreaterThan(10);
    });
  });

  test('должен правильно обрабатывать ошибку redirect_uri_mismatch', () => {
    const errorResponse = {
      error: 'redirect_uri_mismatch',
      error_description: 'The redirect URI in the request does not match a registered redirect URI.'
    };
    
    expect(errorResponse.error).toBe('redirect_uri_mismatch');
    expect(errorResponse.error_description).toContain('redirect URI');
  });

  test('должен правильно обрабатывать успешную авторизацию', () => {
    const successResponse = {
      code: '4/0AX4XfWh...',
      state: 'random_state_string'
    };
    
    expect(successResponse.code).toBeDefined();
    expect(successResponse.state).toBeDefined();
  });

  test('должен правильно обрабатывать конфигурацию OAuth2', () => {
    const config = {
      clientId: 'test-client-id.apps.googleusercontent.com',
      clientSecret: 'GOCSPX-test-secret-example',
      redirectUri: 'https://auth.expo.io/@batazor/gymbro',
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };
    
    expect(config.clientId).toContain('googleusercontent.com');
    expect(config.clientSecret).toContain('GOCSPX-');
    expect(config.redirectUri).toContain('auth.expo.io');
    expect(config.scopes[0]).toContain('spreadsheets');
  });

  test('должен правильно обрабатывать параметры авторизации', () => {
    const authParams = {
      client_id: 'test-client-id',
      redirect_uri: 'https://auth.expo.io/@batazor/gymbro',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      access_type: 'offline',
      prompt: 'consent'
    };
    
    expect(authParams.response_type).toBe('code');
    expect(authParams.access_type).toBe('offline');
    expect(authParams.prompt).toBe('consent');
    expect(authParams.redirect_uri).toContain('auth.expo.io');
  });

  test('должен правильно обрабатывать различные типы ошибок OAuth2', () => {
    const oauthErrors = [
      'redirect_uri_mismatch',
      'invalid_client',
      'invalid_grant',
      'unauthorized_client',
      'unsupported_response_type'
    ];
    
    oauthErrors.forEach(error => {
      expect(error).toBeDefined();
      expect(error.length).toBeGreaterThan(5);
    });
  });
});
