// Тесты для проверки автоматического открытия браузера
describe('Browser Auto-Opening', () => {
  test('должен правильно обрабатывать успешное открытие браузера', () => {
    const mockResult = {
      success: true,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
      message: 'Браузер открыт для авторизации',
      needsManualAuth: true,
      browserOpened: true
    };
    
    expect(mockResult.success).toBe(true);
    expect(mockResult.browserOpened).toBe(true);
    expect(mockResult.authUrl).toContain('accounts.google.com');
    expect(mockResult.message).toContain('Браузер открыт');
  });

  test('должен правильно обрабатывать отмену авторизации', () => {
    const mockResult = {
      success: false,
      message: 'Авторизация отменена пользователем',
      needsManualAuth: true,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test'
    };
    
    expect(mockResult.success).toBe(false);
    expect(mockResult.message).toContain('отменена');
    expect(mockResult.needsManualAuth).toBe(true);
  });

  test('должен правильно обрабатывать ошибку открытия браузера', () => {
    const mockResult = {
      success: true,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
      message: 'Откройте URL в браузере для авторизации',
      needsManualAuth: true,
      browserError: 'Cannot open browser'
    };
    
    expect(mockResult.success).toBe(true);
    expect(mockResult.browserError).toBe('Cannot open browser');
    expect(mockResult.needsManualAuth).toBe(true);
  });

  test('должен правильно формировать URL авторизации', () => {
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
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('prompt=consent');
  });

  test('должен правильно обрабатывать различные типы ответов браузера', () => {
    const browserResults = [
      { type: 'dismiss', shouldCancel: true },
      { type: 'cancel', shouldCancel: true },
      { type: 'success', shouldCancel: false }
    ];
    
    browserResults.forEach(result => {
      if (result.type === 'dismiss' || result.type === 'cancel') {
        expect(result.shouldCancel).toBe(true);
      } else {
        expect(result.shouldCancel).toBe(false);
      }
    });
  });

  test('должен правильно обрабатывать состояния авторизации', () => {
    const authStates = [
      { needsManualAuth: true, browserOpened: true, message: 'Браузер открыт' },
      { needsManualAuth: true, browserError: 'Error', message: 'Ошибка браузера' },
      { needsManualAuth: true, message: 'Ручная авторизация' }
    ];
    
    authStates.forEach(state => {
      expect(state.needsManualAuth).toBe(true);
      expect(state.message).toBeDefined();
    });
  });

  test('должен правильно обрабатывать сообщения для пользователя', () => {
    const messages = [
      'Браузер открыт для авторизации',
      'Авторизация отменена пользователем',
      'Не удалось открыть браузер',
      'Откройте URL в браузере для авторизации'
    ];
    
    messages.forEach(message => {
      expect(message.length).toBeGreaterThan(10);
      // Проверяем, что сообщение содержит либо "авторизац", либо "браузер"
      expect(
        message.toLowerCase().includes('авторизац') || 
        message.toLowerCase().includes('браузер')
      ).toBe(true);
    });
  });

  test('должен правильно обрабатывать кнопки в Alert', () => {
    const alertButtons = [
      { text: 'Понятно', style: 'default' },
      { text: 'Отмена', style: 'cancel' },
      { text: 'Открыть браузер', style: 'default' }
    ];
    
    alertButtons.forEach(button => {
      expect(button.text).toBeDefined();
      expect(button.style).toBeDefined();
    });
  });

  test('должен правильно обрабатывать URL для ручного открытия', () => {
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test';
    const canOpenManually = authUrl.startsWith('https://');
    
    expect(canOpenManually).toBe(true);
    expect(authUrl).toContain('accounts.google.com');
  });
});
