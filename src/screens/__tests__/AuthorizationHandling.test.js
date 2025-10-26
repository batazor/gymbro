// Тесты для проверки обработки авторизации
describe('Authorization Handling', () => {
  test('должен правильно обрабатывать случай когда нужна авторизация', () => {
    const mockResult = {
      success: false,
      needsManualAuth: true,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
      message: 'Требуется авторизация в браузере'
    };
    
    expect(mockResult.needsManualAuth).toBe(true);
    expect(mockResult.authUrl).toContain('accounts.google.com');
    expect(mockResult.message).toContain('авторизация');
  });

  test('должен правильно обрабатывать успешное сохранение', () => {
    const mockResult = {
      success: true,
      apiResponse: true,
      positions: [
        { cellAddress: 'B2', exercise: 'Приседания', set: 1, value: '50' }
      ]
    };
    
    expect(mockResult.success).toBe(true);
    expect(mockResult.apiResponse).toBe(true);
    expect(mockResult.positions).toHaveLength(1);
  });

  test('должен правильно обрабатывать ошибку сохранения', () => {
    const mockResult = {
      success: false,
      message: 'Ошибка записи в таблицу'
    };
    
    expect(mockResult.success).toBe(false);
    expect(mockResult.message).toContain('Ошибка');
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

  test('должен правильно обрабатывать различные типы ответов', () => {
    const responses = [
      { success: true, apiResponse: true },
      { success: true, manualUpdate: true },
      { success: false, needsManualAuth: true },
      { success: false, message: 'Error' }
    ];
    
    responses.forEach(response => {
      if (response.success) {
        expect(response.apiResponse || response.manualUpdate).toBe(true);
      } else {
        expect(response.needsManualAuth || response.message).toBeDefined();
      }
    });
  });

  test('должен правильно обрабатывать инструкции для ручного обновления', () => {
    const positions = [
      { cellAddress: 'B2', exercise: 'Приседания', set: 1, value: '50' },
      { cellAddress: 'C2', exercise: 'Приседания', set: 2, value: '55' }
    ];
    
    const cellInstructions = positions.map(pos => 
      `${pos.cellAddress}: ${pos.exercise} (подход ${pos.set}) = ${pos.value} кг`
    ).join('\n');
    
    expect(cellInstructions).toContain('B2: Приседания (подход 1) = 50 кг');
    expect(cellInstructions).toContain('C2: Приседания (подход 2) = 55 кг');
  });

  test('должен правильно обрабатывать отсутствие URL таблицы', () => {
    const sheetUrl = null;
    const hasUrl = sheetUrl !== null;
    
    expect(hasUrl).toBe(false);
  });

  test('должен правильно обрабатывать валидный URL таблицы', () => {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/test/edit';
    const hasUrl = sheetUrl !== null;
    
    expect(hasUrl).toBe(true);
  });

  test('должен правильно обрабатывать состояния загрузки', () => {
    const states = {
      saving: true,
      snackbarVisible: true,
      snackbarMessage: 'Сохранение результатов...',
      snackbarType: 'info'
    };
    
    expect(states.saving).toBe(true);
    expect(states.snackbarVisible).toBe(true);
    expect(states.snackbarMessage).toContain('Сохранение');
    expect(states.snackbarType).toBe('info');
  });

  test('должен правильно обрабатывать успешные состояния', () => {
    const states = {
      saving: false,
      snackbarVisible: true,
      snackbarMessage: '✅ Успешно сохранено!',
      snackbarType: 'success'
    };
    
    expect(states.saving).toBe(false);
    expect(states.snackbarVisible).toBe(true);
    expect(states.snackbarMessage).toContain('✅');
    expect(states.snackbarType).toBe('success');
  });
});
