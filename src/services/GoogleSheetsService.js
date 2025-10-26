import { MVP_CONFIG } from '../config/AppConfig';
import { GOOGLE_SHEETS_CONFIG } from '../config/GoogleSheetsConfig';
import GoogleOAuthService from './GoogleOAuthService';
import StorageService from './StorageService';

class GoogleSheetsService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Сохранение ссылки на таблицу
  async saveSheetUrl(url) {
    try {
      const result = await StorageService.saveSheetUrl(url);
      if (result.success) {
        console.log('✅ Ссылка на таблицу сохранена');
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения ссылки на таблицу:', error);
      throw error;
    }
  }

  // Получение сохраненной ссылки на таблицу
  async getSheetUrl() {
    try {
      const result = await StorageService.getSheetUrl();
      if (result.success) {
        return result.url;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Ошибка получения ссылки на таблицу:', error);
      return null;
    }
  }

  // Аутентификация через Google OAuth2
  async authenticate() {
    try {
      console.log('🔐 Начинаем OAuth2 аутентификацию...');
      
      // Выполняем авторизацию (включая проверку и обновление токенов)
      const authResult = await GoogleOAuthService.authenticate();
      
      if (authResult.success) {
        console.log('✅ OAuth2 аутентификация успешна');
        return true;
      } else {
        // Возвращаем детальную информацию об ошибке
        return {
          success: false,
          error: authResult.error,
          message: authResult.message,
          needsVerification: authResult.needsVerification
        };
      }
    } catch (error) {
      console.error('❌ Ошибка аутентификации:', error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
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
    
    // Парсим упражнения по дням и запоминаем позиции
    dayColumns.forEach(({ dayName, startCol, endCol }) => {
      workoutPlan[dayName] = this.parseExercisesForDay(rawData, startCol, endCol, dayName);
    });

    // Сохраняем позиции для последующего обновления
    this.weightPositions = this.extractWeightPositions(rawData, dayColumns);

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
  parseExercisesForDay(rawData, startCol, endCol, dayName) {
    const exercises = [];
    
    // Ищем строки с упражнениями
    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      if (!row || row.length === 0) continue;
      
      // Проверяем, является ли строка упражнением
      const firstCell = row[0] || '';
      if (firstCell.toLowerCase().includes('упражнение')) {
        const exerciseData = this.parseExerciseRow(row, startCol, endCol, rawData, rowIndex, dayName);
        if (exerciseData) {
          exercises.push(exerciseData);
        }
      }
    }
    
    return exercises;
  }

  // Парсинг строки упражнения
  parseExerciseRow(row, startCol, endCol, allData, rowIndex, dayName) {
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
      completed: false,
      dayName: dayName,
      exerciseRowIndex: rowIndex
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

  // Извлечение позиций строк с весом
  extractWeightPositions(rawData, dayColumns) {
    const weightPositions = {};
    
    // Ищем все строки с весом
    for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      if (!row || row.length === 0) continue;
      
      const firstCell = row[0] || '';
      if (firstCell.toLowerCase().includes('вес')) {
        // Найдена строка с весом, определяем для какого упражнения
        const exerciseName = this.findExerciseForWeightRow(rawData, rowIndex);
        
        if (exerciseName) {
          dayColumns.forEach(({ dayName, startCol, endCol }) => {
            if (!weightPositions[exerciseName]) {
              weightPositions[exerciseName] = {};
            }
            
            weightPositions[exerciseName][dayName] = {
              row: rowIndex + 1, // +1 для Google Sheets (1-based)
              startCol: startCol + 1, // +1 для Google Sheets (1-based)
              endCol: endCol + 1,
              dayStartCol: startCol,
              dayEndCol: endCol
            };
          });
        }
      }
    }
    
    return weightPositions;
  }

  // Поиск упражнения для строки с весом
  findExerciseForWeightRow(rawData, weightRowIndex) {
    // Ищем ближайшее упражнение выше строки с весом
    for (let i = weightRowIndex - 1; i >= Math.max(0, weightRowIndex - 10); i--) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;
      
      const firstCell = row[0] || '';
      if (firstCell.toLowerCase().includes('упражнение')) {
        // Найдено упражнение, извлекаем название из первой колонки дня
        const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        
        for (const dayName of dayNames) {
          const dayIndex = rawData[0].findIndex(cell => 
            cell && cell.toLowerCase().includes(dayName.toLowerCase())
          );
          
          if (dayIndex !== -1 && row[dayIndex]) {
            return row[dayIndex].trim();
          }
        }
      }
    }
    
    return null;
  }

  // Запись прогресса в таблицу через публичный API
  async writeProgress(sheetUrl, progressData) {
    try {
      // Сохраняем ссылку на таблицу
      if (sheetUrl) {
        await this.saveSheetUrl(sheetUrl);
      }
      
      const sheetId = this.extractSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('Неверный URL таблицы');
      }

      console.log('📊 Запись прогресса в Google Sheets:', sheetId);
      
      // Аутентификация
      const authResult = await this.authenticate();
      
      // Если аутентификация не удалась, возвращаем ошибку
      if (!authResult || (typeof authResult === 'object' && !authResult.success)) {
        return {
          success: false,
          error: typeof authResult === 'object' ? authResult.error : 'auth_failed',
          message: typeof authResult === 'object' ? authResult.message : 'Ошибка аутентификации',
          needsVerification: typeof authResult === 'object' ? authResult.needsVerification : false
        };
      }
      
      // Используем сохраненные позиции весов
      if (!this.weightPositions) {
        throw new Error('Позиции весов не найдены. Перезагрузите план тренировок.');
      }

      const exerciseName = progressData.exercise.name;
      const dayName = progressData.workout.day;
      
      if (!this.weightPositions[exerciseName] || !this.weightPositions[exerciseName][dayName]) {
        throw new Error(`Позиции для упражнения "${exerciseName}" в день "${dayName}" не найдены`);
      }

      const weightPosition = this.weightPositions[exerciseName][dayName];
      
      // Подготавливаем данные для записи весов
      const weightUpdates = [];
      progressData.sets.forEach((set, setIndex) => {
        if (set.completed && set.weight) {
          const colIndex = weightPosition.startCol + setIndex;
          if (colIndex <= weightPosition.endCol) {
            weightUpdates.push({
              row: weightPosition.row,
              col: colIndex,
              value: set.weight,
              exercise: exerciseName,
              set: setIndex + 1,
              day: dayName,
              cellAddress: this.getCellAddress(weightPosition.row, colIndex)
            });
          }
        }
      });

      if (weightUpdates.length === 0) {
        throw new Error('Нет данных для записи');
      }

      // Обновляем ячейки с весами
      const result = await this.updateWeightCells(sheetId, weightUpdates);
      
      console.log('✅ Прогресс успешно записан в таблицу');
      return result;
    } catch (error) {
      console.error('❌ Ошибка записи прогресса:', error);
      throw error;
    }
  }

  // Поиск позиций для записи весов в таблице
  findWeightPositions(tableData, progressData) {
    const positions = [];
    const exerciseName = progressData.exercise.name;
    
    // Ищем строки с упражнениями и соответствующие строки с весом
    for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      const row = tableData[rowIndex];
      if (!row || row.length === 0) continue;
      
      // Ищем строку с названием упражнения
      const exerciseRow = row.find(cell => 
        cell && cell.toLowerCase().includes(exerciseName.toLowerCase())
      );
      
      if (exerciseRow) {
        // Ищем соответствующую строку с весом (обычно через несколько строк)
        for (let weightRowIndex = rowIndex + 1; weightRowIndex < Math.min(rowIndex + 10, tableData.length); weightRowIndex++) {
          const weightRow = tableData[weightRowIndex];
          if (weightRow && weightRow[0] && weightRow[0].toLowerCase().includes('вес')) {
            // Найдена строка с весом, определяем колонки для записи
            const dayColumns = this.getDayColumnsForExercise(tableData, rowIndex);
            
            dayColumns.forEach(({ dayName, startCol, endCol }) => {
              // Записываем веса для каждого подхода
              progressData.sets.forEach((set, setIndex) => {
                if (set.completed && set.weight) {
                  const colIndex = startCol + setIndex;
                  if (colIndex < endCol) {
                    positions.push({
                      row: weightRowIndex + 1, // +1 для Google Sheets (1-based)
                      col: colIndex + 1, // +1 для Google Sheets (1-based)
                      value: set.weight,
                      exercise: exerciseName,
                      set: setIndex + 1,
                      day: dayName
                    });
                  }
                }
              });
            });
            break;
          }
        }
      }
    }
    
    return positions;
  }

  // Получение колонок дня для упражнения
  getDayColumnsForExercise(tableData, exerciseRowIndex) {
    const dayColumns = [];
    const headerRow = tableData[0];
    
    // Определяем дни недели из заголовка
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

  // Обновление ячеек с весами через Google Sheets API
  async updateWeightCells(sheetId, positions) {
    try {
      console.log('📝 Обновление ячеек с весами:', positions);
      
      // Реальное обновление через Google Sheets API
      const apiResult = await this.updateCellsViaAPI(sheetId, positions);
      
      if (apiResult.success) {
        console.log('✅ Ячейки успешно обновлены через API');
        return {
          success: true,
          message: `Успешно обновлено ${positions.length} ячеек в таблице`,
          positions: positions,
          apiResponse: apiResult.data
        };
      } else {
        throw new Error(apiResult.error || 'Ошибка обновления ячеек');
      }
      
    } catch (error) {
      console.error('Ошибка обновления ячеек:', error);
      throw error;
    }
  }

  // Реальная запись через Google Sheets API с OAuth2
  async updateCellsViaAPI(sheetId, positions) {
    try {
      console.log('🚀 Начинаем реальную запись в Google Sheets с OAuth2...');
      
      // Получаем валидный токен
      const accessToken = await GoogleOAuthService.getValidToken();
      
      // Обновляем каждую ячейку отдельно
      const updatePromises = positions.map(async (pos) => {
        const cellAddress = this.getCellAddress(pos.row, pos.col);
        const updateUrl = `${GOOGLE_SHEETS_CONFIG.BASE_URL}/${sheetId}/values/${cellAddress}:update?valueInputOption=RAW`;
        
        const response = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            values: [[pos.value]]
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Ячейка ${cellAddress} обновлена: ${pos.value}`);
          return { success: true, cell: cellAddress, value: pos.value };
        } else {
          const errorText = await response.text();
          console.log(`❌ Ошибка обновления ${cellAddress}:`, response.status, errorText);
          return { success: false, cell: cellAddress, error: `${response.status}: ${errorText}` };
        }
      });

      // Ждем все обновления
      const results = await Promise.all(updatePromises);
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length === positions.length) {
        console.log('✅ Все ячейки успешно обновлены через OAuth2!');
        return {
          success: true,
          data: { successful, failed },
          message: `Обновлено ${successful.length} ячеек через OAuth2`
        };
      } else {
        console.log(`⚠️ Обновлено ${successful.length} из ${positions.length} ячеек`);
        return {
          success: false,
          error: `Обновлено только ${successful.length} из ${positions.length} ячеек. Ошибки: ${failed.map(f => f.error).join(', ')}`
        };
      }
    } catch (error) {
      console.error('Ошибка OAuth2 API обновления:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Получение инструкций для ручного обновления
  getManualUpdateInstructions(positions, sheetId) {
    const cellInstructions = [];
    positions.forEach(pos => {
      const cellAddress = this.getCellAddress(pos.row, pos.col);
      const instruction = `${cellAddress}: ${pos.exercise} (подход ${pos.set}) = ${pos.value} кг`;
      cellInstructions.push(instruction);
    });
    
    return {
      success: true,
      message: `Найдено ${positions.length} ячеек для обновления! Откройте таблицу и обновите их вручную.`,
      positions: positions,
      cellInstructions: cellInstructions,
      manualUpdate: true,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    };
  }

  // Получение адреса ячейки (например, A1, B2)
  getCellAddress(row, col) {
    const colLetter = String.fromCharCode(64 + col); // A=1, B=2, etc.
    return `${colLetter}${row}`;
  }

  // Форматирование данных прогресса для записи
  formatProgressData(progressData) {
    const rows = [];
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const currentTime = new Date().toLocaleTimeString('ru-RU');
    
    progressData.sets.forEach((set, index) => {
      if (set.completed && set.weight && set.reps) {
        rows.push([
          currentDate,
          currentTime,
          progressData.exercise.name,
          progressData.exercise.group,
          set.setNumber,
          set.weight,
          set.reps,
          '✅',
          progressData.notes || '',
          progressData.workout.day
        ]);
      }
    });
    
    return rows;
  }

  // Добавление данных в лист "Прогресс" через публичный API
  async appendProgressData(sheetId, rowData) {
    try {
      console.log('📝 Попытка записи данных в лист Прогресс:', rowData);
      
      // Проверяем существование листа Прогресс
      const progressSheetExists = await this.checkProgressSheetExists(sheetId);
      
      if (!progressSheetExists) {
        throw new Error('Лист "Прогресс" не найден. Создайте лист "Прогресс" в вашей таблице с правильными заголовками.');
      }

      // Для записи в Google Sheets через публичный доступ используем специальный метод
      // Создаем URL для записи через Google Forms или используем альтернативный подход
      const writeResult = await this.writeToSheetViaForm(sheetId, rowData);
      
      return {
        success: writeResult.success,
        message: writeResult.message,
        rowsCount: rowData.length,
        data: rowData
      };
    } catch (error) {
      console.error('Ошибка добавления данных в лист Прогресс:', error);
      throw error;
    }
  }

  // Запись данных через Google Sheets API
  async writeToSheetViaForm(sheetId, rowData) {
    try {
      // Попытка записи через Google Sheets API
      const apiResult = await this.writeToSheetAPI(sheetId, rowData);
      
      if (apiResult.success) {
        return apiResult;
      }
      
      // Если API не сработал, возвращаем инструкции для ручного ввода
      console.log('📊 API запись не удалась, используем ручной ввод:');
      console.log('1. Откройте вашу таблицу Google Sheets');
      console.log('2. Перейдите на лист "Прогресс"');
      console.log('3. Добавьте следующие строки в конец таблицы:');
      
      rowData.forEach((row, index) => {
        console.log(`Строка ${index + 1}:`, row.join(' | '));
      });
      
      return { 
        success: true, 
        message: `Данные подготовлены для записи. Добавьте ${rowData.length} строк в лист "Прогресс" вашей таблицы.`,
        instructions: rowData,
        manualEntry: true
      };
    } catch (error) {
      console.error('Ошибка подготовки данных для записи:', error);
      throw error;
    }
  }

  // Запись через Google Sheets API
  async writeToSheetAPI(sheetId, rowData) {
    try {
      // Получаем валидный токен для OAuth2
      const accessToken = await GoogleOAuthService.getValidToken();
      
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Прогресс!A:J:append?valueInputOption=RAW`;
      
      const requestBody = {
        values: rowData
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Данные успешно записаны в Google Sheets:', result);
        return {
          success: true,
          message: `Успешно записано ${rowData.length} строк в таблицу`,
          apiResponse: result
        };
      } else {
        console.log('❌ API запись не удалась:', response.status, response.statusText);
        return {
          success: false,
          message: `API ошибка: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Ошибка API записи:', error);
      return {
        success: false,
        message: `Ошибка API: ${error.message}`
      };
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

  // Создание листа "Прогресс" (инструкция для пользователя)
  async createProgressSheet(sheetId) {
    try {
      console.log('📋 Инструкция: Создайте лист "Прогресс" в вашей таблице');
      console.log('📋 Заголовки столбцов должны быть:');
      console.log('   A: Дата');
      console.log('   B: Время');
      console.log('   C: Упражнение');
      console.log('   D: Группа мышц');
      console.log('   E: Подход');
      console.log('   F: Вес (кг)');
      console.log('   G: Повторы');
      console.log('   H: Статус');
      console.log('   I: Заметки');
      console.log('   J: День недели');
      
      // Возвращаем инструкцию вместо реального создания
      return {
        success: true,
        message: 'Создайте лист "Прогресс" вручную с указанными заголовками',
        instructions: {
          sheetName: 'Прогресс',
          headers: [
            'Дата', 'Время', 'Упражнение', 'Группа мышц', 
            'Подход', 'Вес (кг)', 'Повторы', 'Статус', 'Заметки', 'День недели'
          ]
        }
      };
    } catch (error) {
      console.error('Ошибка создания листа прогресса:', error);
      throw error;
    }
  }

  // Добавление заголовков в лист "Прогресс" (инструкция)
  async addProgressHeaders(sheetId) {
    try {
      console.log('📋 Добавьте следующие заголовки в первую строку листа "Прогресс":');
      const headers = [
        'Дата',
        'Время', 
        'Упражнение',
        'Группа мышц',
        'Подход',
        'Вес (кг)',
        'Повторы',
        'Статус',
        'Заметки',
        'День недели'
      ];
      
      console.log('📋 Заголовки:', headers.join(' | '));
      
      return {
        success: true,
        message: 'Заголовки подготовлены для добавления в таблицу',
        headers
      };
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
