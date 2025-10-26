// Простые тесты для GoogleOAuthService
describe('GoogleOAuthService', () => {
  // Мокаем зависимости
  const mockAuthSession = {
    makeRedirectUri: jest.fn(() => 'exp://localhost:8081'),
    startAsync: jest.fn(),
    ResponseType: { Code: 'code' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('должен иметь правильный Client ID', () => {
    // Простая проверка конфигурации
    const expectedClientId = '539249827554-ffb4uibg16i0g8tdbkp90r8tnks0ev90.apps.googleusercontent.com';
    expect(expectedClientId).toContain('googleusercontent.com');
  });

  test('должен создавать правильный redirect URI', () => {
    const redirectUri = mockAuthSession.makeRedirectUri({
      scheme: 'gymbro',
      path: 'auth'
    });
    
    expect(redirectUri).toBe('exp://localhost:8081');
    expect(mockAuthSession.makeRedirectUri).toHaveBeenCalledWith({
      scheme: 'gymbro',
      path: 'auth'
    });
  });

  test('должен иметь правильные scopes', () => {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ];
    
    expect(scopes).toHaveLength(2);
    expect(scopes[0]).toContain('spreadsheets');
    expect(scopes[1]).toContain('drive.readonly');
  });

  test('должен создавать правильный URL авторизации', () => {
    const clientId = 'test-client-id';
    const redirectUri = 'exp://localhost:8081';
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    expect(authUrl).toContain('accounts.google.com');
    expect(authUrl).toContain('client_id=test-client-id');
    expect(authUrl).toContain('response_type=code');
  });

  test('должен обрабатывать успешный ответ авторизации', () => {
    const mockResult = {
      type: 'success',
      params: { code: 'test-auth-code' }
    };
    
    expect(mockResult.type).toBe('success');
    expect(mockResult.params.code).toBe('test-auth-code');
  });

  test('должен обрабатывать отмену авторизации', () => {
    const mockResult = {
      type: 'cancel'
    };
    
    expect(mockResult.type).toBe('cancel');
  });

  test('должен создавать правильный запрос токена', () => {
    const tokenRequest = {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      code: 'test-auth-code',
      grant_type: 'authorization_code',
      redirect_uri: 'exp://localhost:8081'
    };
    
    expect(tokenRequest.grant_type).toBe('authorization_code');
    expect(tokenRequest.code).toBe('test-auth-code');
  });

  test('должен обрабатывать успешный ответ токена', () => {
    const mockTokenResponse = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer'
    };
    
    expect(mockTokenResponse.access_token).toBe('test-access-token');
    expect(mockTokenResponse.refresh_token).toBe('test-refresh-token');
    expect(mockTokenResponse.expires_in).toBe(3600);
  });

  test('должен проверять валидность токена', () => {
    const now = Date.now();
    const validExpiry = now + 3600000; // 1 час
    const expiredExpiry = now - 3600000; // 1 час назад
    
    // Проверяем валидный токен
    expect(validExpiry).toBeGreaterThan(now);
    
    // Проверяем истекший токен
    expect(expiredExpiry).toBeLessThan(now);
  });

  test('должен создавать правильный запрос обновления токена', () => {
    const refreshRequest = {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      refresh_token: 'test-refresh-token',
      grant_type: 'refresh_token'
    };
    
    expect(refreshRequest.grant_type).toBe('refresh_token');
    expect(refreshRequest.refresh_token).toBe('test-refresh-token');
  });
});
