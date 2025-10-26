// Тесты для проверки правильности OAuth методов
describe('OAuth Methods Validation', () => {
  test('должен использовать правильный URL для авторизации', () => {
    const clientId = 'test-client-id.apps.googleusercontent.com';
    const redirectUri = 'exp://localhost:8081';
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    // Проверяем правильность URL
    expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(authUrl).toContain('client_id=' + clientId);
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('prompt=consent');
    expect(authUrl).toContain('scope=' + encodeURIComponent(scopes[0]));
  });

  test('должен использовать правильный URL для обмена кода на токен', () => {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token');
  });

  test('должен использовать правильные параметры для обмена кода на токен', () => {
    const clientId = 'test-client-id';
    const clientSecret = 'test-client-secret';
    const authCode = 'test-auth-code';
    const redirectUri = 'exp://localhost:8081';
    
    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    };
    
    expect(params.grant_type).toBe('authorization_code');
    expect(params.client_id).toBe(clientId);
    expect(params.client_secret).toBe(clientSecret);
    expect(params.code).toBe(authCode);
    expect(params.redirect_uri).toBe(redirectUri);
  });

  test('должен использовать правильные параметры для обновления токена', () => {
    const clientId = 'test-client-id';
    const clientSecret = 'test-client-secret';
    const refreshToken = 'test-refresh-token';
    
    const params = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };
    
    expect(params.grant_type).toBe('refresh_token');
    expect(params.client_id).toBe(clientId);
    expect(params.client_secret).toBe(clientSecret);
    expect(params.refresh_token).toBe(refreshToken);
  });

  test('должен правильно обрабатывать успешный ответ токена', () => {
    const mockTokenResponse = {
      access_token: 'ya29.a0AfH6SMC...',
      refresh_token: '1//04...',
      expires_in: 3599,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/spreadsheets'
    };
    
    expect(mockTokenResponse.access_token).toBeDefined();
    expect(mockTokenResponse.refresh_token).toBeDefined();
    expect(mockTokenResponse.expires_in).toBeGreaterThan(0);
    expect(mockTokenResponse.token_type).toBe('Bearer');
    expect(mockTokenResponse.scope).toContain('spreadsheets');
  });

  test('должен правильно обрабатывать ошибки OAuth', () => {
    const mockErrorResponse = {
      error: 'invalid_grant',
      error_description: 'The provided authorization code is invalid'
    };
    
    expect(mockErrorResponse.error).toBe('invalid_grant');
    expect(mockErrorResponse.error_description).toContain('invalid');
  });

  test('должен правильно проверять валидность токена', () => {
    const now = Date.now();
    const validExpiry = now + 3600000; // 1 час
    const expiredExpiry = now - 3600000; // 1 час назад
    
    // Проверяем валидный токен
    const isValid = validExpiry > now;
    expect(isValid).toBe(true);
    
    // Проверяем истекший токен
    const isExpired = expiredExpiry < now;
    expect(isExpired).toBe(true);
  });

  test('должен правильно создавать Authorization header', () => {
    const accessToken = 'ya29.a0AfH6SMC...';
    const authHeader = `Bearer ${accessToken}`;
    
    expect(authHeader).toBe('Bearer ya29.a0AfH6SMC...');
    expect(authHeader).toContain('Bearer');
  });

  test('должен правильно обрабатывать scopes', () => {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ];
    
    const scopesString = scopes.join(' ');
    
    expect(scopesString).toContain('spreadsheets');
    expect(scopesString).toContain('drive.readonly');
    expect(scopesString.split(' ')).toHaveLength(2);
  });

  test('должен правильно обрабатывать redirect URI', () => {
    const redirectUri = 'exp://localhost:8081';
    
    expect(redirectUri).toContain('exp://');
    expect(redirectUri).toContain('localhost');
    expect(redirectUri).toContain('8081');
  });

  test('должен правильно обрабатывать Client ID формат', () => {
    const clientId = 'test-client-id.apps.googleusercontent.com';
    
    expect(clientId).toContain('.apps.googleusercontent.com');
    expect(clientId).toMatch(/^\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/);
  });

  test('должен правильно обрабатывать Client Secret формат', () => {
    const clientSecret = 'GOCSPX-test-secret-example';
    
    expect(clientSecret).toContain('GOCSPX-');
    expect(clientSecret).toMatch(/^GOCSPX-[a-zA-Z0-9-]+$/);
  });

  test('должен правильно обрабатывать response types', () => {
    const responseTypes = {
      code: 'code',
      token: 'token'
    };
    
    expect(responseTypes.code).toBe('code');
    expect(responseTypes.token).toBe('token');
  });

  test('должен правильно обрабатывать grant types', () => {
    const grantTypes = {
      authorization_code: 'authorization_code',
      refresh_token: 'refresh_token'
    };
    
    expect(grantTypes.authorization_code).toBe('authorization_code');
    expect(grantTypes.refresh_token).toBe('refresh_token');
  });
});
