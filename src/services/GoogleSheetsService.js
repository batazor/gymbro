import { MVP_CONFIG } from '../config/AppConfig';

class GoogleSheetsService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Аутентификация через Google (отключена для MVP)
  async authenticate() {
    try {
      // Для MVP используем только публичный доступ к таблицам
      console.log('📖 MVP режим: используем публичный доступ к таблицам');
      this.accessToken = null;
      this.refreshToken = null;
      return true; // Всегда успешно для публичного доступа
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      throw error;
    }
  }

  // Извлечение ID таблицы из URL
  extractSheetId(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // Получение данных из Google Sheets через публичный API
  async getSheetData(sheetUrl, range = 'A1:Z1000') {
    try {
      const sheetId = this.extractSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('Неверный URL таблицы');
      }

      // Используем публичный API для получения CSV данных
      const publicUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&range=${range}`;
      
      console.log(`📊 Получение данных из: ${sheetUrl}`);
      
      const response = await fetch(publicUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      console.log(`✅ Получено ${csvText.length} символов данных`);
      
      // Парсим CSV в массив строк
      const lines = csvText.split('\n');
      const data = lines.map(line => {
        // Простой парсинг CSV (может не работать с запятыми внутри кавычек)
        return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      });

      return data;
    } catch (error) {
      console.error('Ошибка получения данных:', error);
      throw error;
    }
  }

  // Парсинг данных тренировочного плана из реальной структуры таблицы
  parseWorkoutPlan(rawData) {
    if (!rawData || rawData.length < 2) {
      throw new Error('Недостаточно данных в таблице');
    }

    // Парсим структуру таблицы Виктора
    const workoutPlan = {};
    
    // Определяем дни недели из первой строки
    const headerRow = rawData[0];
    const dayColumns = this.extractDayColumns(headerRow);
    
    // Парсим упражнения по дням
    dayColumns.forEach(({ dayName, startCol, endCol }) => {
      workoutPlan[dayName] = this.parseExercisesForDay(rawData, startCol, endCol);
    });

    return workoutPlan;
  }

  // Извлечение колонок дней недели из заголовка
  extractDayColumns(headerRow) {
    const dayColumns = [];
    const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    dayNames.forEach(dayName => {
      const dayIndex = headerRow.findIndex(cell => 
        cell && cell.toLowerCase().includes(dayName.toLowerCase())
      );
      
      if (dayIndex !== -1) {
        // Находим конец блока для этого дня
        let endCol = dayIndex + 1;
        while (endCol < headerRow.length && 
               (headerRow[endCol] === '' || headerRow[endCol] === undefined)) {
          endCol++;
        }
        
        dayColumns.push({
          dayName: this.normalizeDayName(headerRow[dayIndex]),
          startCol: dayIndex,
          endCol: endCol
        });
      }
    });
    
    return dayColumns;
  }

  // Нормализация названия дня
  normalizeDayName(dayText) {
    const dayNames = {
      'понедельник': 'Понедельник',
      'вторник': 'Вторник', 
      'среда': 'Среда',
      'четверг': 'Четверг',
      'пятница': 'Пятница',
      'суббота': 'Суббота',
      'воскресенье': 'Воскресенье'
    };
    
    const lowerText = dayText.toLowerCase();
    for (const [key, value] of Object.entries(dayNames)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }
    return dayText;
  }

  // Парсинг упражнений для конкретного дня
  parseExercisesForDay(rawData, startCol, endCol) {
    const exercises = [];
    
    // Ищем строки с упражнениями
    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      if (!row || row.length === 0) continue;
      
      // Проверяем, является ли строка упражнением
      const firstCell = row[0] || '';
      if (firstCell.toLowerCase().includes('упражнение')) {
        const exerciseData = this.parseExerciseRow(row, startCol, endCol, rawData, rowIndex);
        if (exerciseData) {
          exercises.push(exerciseData);
        }
      }
    }
    
    return exercises;
  }

  // Парсинг строки упражнения
  parseExerciseRow(row, startCol, endCol, allData, rowIndex) {
    // Получаем название упражнения
    const exerciseName = row[startCol] || '';
    if (!exerciseName || exerciseName.toLowerCase().includes('отдыхаем')) {
      return null;
    }
    
    // Ищем дополнительные данные в следующих строках
    const exerciseData = {
      name: exerciseName.trim(),
      group: '',
      sets: 4, // По умолчанию 4 подхода
      reps: '',
      weight: '',
      rest: '',
      specialty: '',
      videoUrl: '',
      comment: '',
      completed: false
    };
    
    // Ищем группу мышц
    for (let i = rowIndex - 5; i <= rowIndex + 5; i++) {
      if (i >= 0 && i < allData.length) {
        const checkRow = allData[i];
        if (checkRow && checkRow[0] && checkRow[0].toLowerCase().includes('группа')) {
          exerciseData.group = checkRow[startCol] || '';
          break;
        }
      }
    }
    
    // Ищем повторы
    for (let i = rowIndex; i < Math.min(rowIndex + 10, allData.length); i++) {
      const checkRow = allData[i];
      if (checkRow && checkRow[0] && checkRow[0].toLowerCase().includes('повторы')) {
        exerciseData.reps = checkRow[startCol] || '';
        break;
      }
    }
    
    // Ищем ссылку на видео
    for (let i = rowIndex; i < Math.min(rowIndex + 10, allData.length); i++) {
      const checkRow = allData[i];
      if (checkRow && checkRow[0] && checkRow[0].toLowerCase().includes('ссылка')) {
        exerciseData.videoUrl = checkRow[startCol] || '';
        break;
      }
    }
    
    // Ищем особенность выполнения
    for (let i = rowIndex; i < Math.min(rowIndex + 10, allData.length); i++) {
      const checkRow = allData[i];
      if (checkRow && checkRow[0] && checkRow[0].toLowerCase().includes('особенность')) {
        exerciseData.specialty = checkRow[startCol] || '';
        break;
      }
    }
    
    return exerciseData;
  }

  // Запись прогресса в таблицу (отключена для MVP)
  async writeProgress(sheetUrl, progressData) {
    try {
      // Для MVP запись отключена - только чтение
      console.log('📖 MVP режим: запись прогресса отключена');
      console.log('Данные для записи (только логирование):', progressData);
      
      // Возвращаем успешный результат для совместимости
      return { 
        success: true, 
        message: 'Прогресс сохранен локально (MVP режим - только чтение)' 
      };
    } catch (error) {
      console.error('Ошибка записи прогресса:', error);
      throw error;
    }
  }

  // Проверка существования листа
  async checkSheetExists(sheetId, sheetName) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?access_token=${this.accessToken}`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.sheets.some(sheet => sheet.properties.title === sheetName);
    } catch (error) {
      console.error('Ошибка проверки листа:', error);
      return false;
    }
  }

  // Создание листа "Прогресс"
  async createProgressSheet(sheetId) {
    try {
      const body = {
        requests: [{
          addSheet: {
            properties: {
              title: 'Прогресс',
              gridProperties: {
                rowCount: 1000,
                columnCount: 7
              }
            }
          }
        }]
      };

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate?access_token=${this.accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка создания листа: ${response.status}`);
      }

      // Добавляем заголовки
      await this.addProgressHeaders(sheetId);
      
      return await response.json();
    } catch (error) {
      console.error('Ошибка создания листа прогресса:', error);
      throw error;
    }
  }

  // Добавление заголовков в лист "Прогресс"
  async addProgressHeaders(sheetId) {
    try {
      const headers = [
        'Дата',
        'День недели', 
        'Упражнение',
        'Подход',
        'Вес (кг)',
        'Выполнено',
        'Комментарий'
      ];

      const body = {
        values: [headers]
      };

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Прогресс!A1:G1?valueInputOption=RAW&access_token=${this.accessToken}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка добавления заголовков: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка добавления заголовков:', error);
      throw error;
    }
  }

  // Получение прогресса из таблицы
  async getProgress(sheetUrl) {
    try {
      const sheetId = this.extractSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('Неверный URL таблицы');
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Прогресс!A:G?access_token=${this.accessToken}`
      );

      if (!response.ok) {
        // Если лист "Прогресс" не существует, возвращаем пустой массив
        if (response.status === 400) {
          return [];
        }
        throw new Error(`Ошибка API: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length < 2) return [];

      const headers = rows[0];
      const progressRows = rows.slice(1);

      return progressRows.map(row => ({
        date: row[0] || '',
        day: row[1] || '',
        exercise: row[2] || '',
        set: parseInt(row[3]) || 0,
        weight: row[4] || '',
        completed: row[5] === '✅',
        notes: row[6] || '',
      }));
    } catch (error) {
      console.error('Ошибка получения прогресса:', error);
      return [];
    }
  }
}

export default new GoogleSheetsService();
