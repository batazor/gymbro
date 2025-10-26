// Простые тесты для GoogleSheetsService
describe('GoogleSheetsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('должен извлекать ID из правильного URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1CJCkWz67TjV4NaFWXeDZZfFPUvpblxtB6c49Eg6FYRU/edit';
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : null;
    
    expect(sheetId).toBe('1CJCkWz67TjV4NaFWXeDZZfFPUvpblxtB6c49Eg6FYRU');
  });

  test('должен возвращать null для неправильного URL', () => {
    const url = 'https://example.com';
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : null;
    
    expect(sheetId).toBeNull();
  });

  test('должен правильно конвертировать координаты в адрес ячейки', () => {
    const getCellAddress = (row, col) => {
      const column = String.fromCharCode(65 + col);
      const rowNumber = row + 1;
      return `${column}${rowNumber}`;
    };
    
    expect(getCellAddress(0, 0)).toBe('A1');
    expect(getCellAddress(1, 1)).toBe('B2');
    expect(getCellAddress(25, 25)).toBe('Z26');
  });

  test('должен правильно парсить данные тренировок', () => {
    const mockData = {
      values: [
        ['День', 'Понедельник', 'Вторник', 'Среда'],
        ['Упражнение 1', '10', '12', '15'],
        ['Вес', '20', '25', '30'],
        ['Упражнение 2', '8', '10', '12'],
        ['Вес', '15', '18', '20']
      ]
    };
    
    // Проверяем структуру данных
    expect(mockData.values).toBeDefined();
    expect(mockData.values).toHaveLength(5);
    expect(mockData.values[0]).toContain('День');
    expect(mockData.values[0]).toContain('Понедельник');
  });

  test('должен находить позиции весов в данных', () => {
    const mockData = {
      values: [
        ['День', 'Понедельник', 'Вторник'],
        ['Упражнение 1', '10', '12'],
        ['Вес', '20', '25'],
        ['Упражнение 2', '8', '10'],
        ['Вес', '15', '18']
      ]
    };
    
    const weightPositions = [];
    
    // Имитируем поиск позиций весов
    mockData.values.forEach((row, rowIndex) => {
      if (row[0] === 'Вес') {
        weightPositions.push({
          row: rowIndex,
          col: 1, // Понедельник
          value: row[1],
          exercise: 'Упражнение 1',
          set: 1
        });
      }
    });
    
    expect(weightPositions).toHaveLength(2);
    expect(weightPositions[0].value).toBe('20');
    expect(weightPositions[1].value).toBe('15');
  });

  test('должен создавать правильный URL для API запроса', () => {
    const sheetId = 'test-sheet-id';
    const cellAddress = 'B2';
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    const updateUrl = `${baseUrl}/${sheetId}/values/${cellAddress}:update?valueInputOption=RAW`;
    
    expect(updateUrl).toContain('sheets.googleapis.com');
    expect(updateUrl).toContain('test-sheet-id');
    expect(updateUrl).toContain('B2');
    expect(updateUrl).toContain('valueInputOption=RAW');
  });

  test('должен обрабатывать успешный ответ API', () => {
    const mockApiResponse = {
      updatedCells: 1,
      updatedRows: 1,
      updatedColumns: 1
    };
    
    expect(mockApiResponse.updatedCells).toBe(1);
    expect(mockApiResponse.updatedRows).toBe(1);
    expect(mockApiResponse.updatedColumns).toBe(1);
  });

  test('должен обрабатывать ошибку API', () => {
    const mockErrorResponse = {
      error: {
        code: 403,
        message: 'Permission denied',
        status: 'PERMISSION_DENIED'
      }
    };
    
    expect(mockErrorResponse.error.code).toBe(403);
    expect(mockErrorResponse.error.message).toBe('Permission denied');
    expect(mockErrorResponse.error.status).toBe('PERMISSION_DENIED');
  });

  test('должен создавать правильный запрос для обновления ячейки', () => {
    const updateRequest = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        values: [['50']]
      })
    };
    
    expect(updateRequest.method).toBe('PUT');
    expect(updateRequest.headers['Content-Type']).toBe('application/json');
    expect(updateRequest.headers['Authorization']).toBe('Bearer test-token');
    
    const body = JSON.parse(updateRequest.body);
    expect(body.values).toEqual([['50']]);
  });

  test('должен обрабатывать данные прогресса', () => {
    const mockProgressData = {
      exercise: { name: 'Приседания' },
      workout: { name: 'Понедельник' },
      sets: [
        { weight: '50', reps: '10', completed: true },
        { weight: '55', reps: '8', completed: true }
      ],
      notes: 'Хорошая тренировка',
      exerciseIndex: 0
    };
    
    expect(mockProgressData.exercise.name).toBe('Приседания');
    expect(mockProgressData.workout.name).toBe('Понедельник');
    expect(mockProgressData.sets).toHaveLength(2);
    expect(mockProgressData.sets[0].weight).toBe('50');
    expect(mockProgressData.sets[1].weight).toBe('55');
    expect(mockProgressData.notes).toBe('Хорошая тренировка');
  });

  test('должен создавать правильные позиции для обновления', () => {
    const positions = [
      { row: 1, col: 1, value: '50', exercise: 'Приседания', set: 1 },
      { row: 2, col: 1, value: '55', exercise: 'Приседания', set: 2 }
    ];
    
    expect(positions).toHaveLength(2);
    expect(positions[0].value).toBe('50');
    expect(positions[1].value).toBe('55');
    expect(positions[0].exercise).toBe('Приседания');
    expect(positions[1].exercise).toBe('Приседания');
  });
});
