/**
 * Тесты для парсинга данных тренировок с реальными данными
 */

import { WorkoutPlan, Exercise, Workout, ValidationUtils } from '../utils/WorkoutUtils.js';

// URL реальной таблицы для тестирования
const REAL_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1CJCkWz67TjV4NaFWXeDZZfFPUvpblxtB6c49Eg6FYRU/edit';

// Функция для получения реальных данных из Google Sheets
async function fetchRealSheetData() {
  const sheetId = REAL_SHEET_URL.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!sheetId) {
    throw new Error('Не удалось извлечь ID таблицы');
  }
  
  const publicUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&range=A1:Z100`;
  const response = await fetch(publicUrl);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const csvText = await response.text();
  const lines = csvText.split('\n');
  return lines.map(line => {
    return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
  });
}

// Упрощенный парсер для тестирования
class TestWorkoutParser {
  extractDayColumns(headerRow) {
    const dayColumns = [];
    const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    
    dayNames.forEach(dayName => {
      const dayIndex = headerRow.findIndex(cell => 
        cell && cell.toLowerCase().includes(dayName.toLowerCase())
      );
      
      if (dayIndex !== -1) {
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

  parseExercisesForDay(rawData, startCol, endCol) {
    const exercises = [];
    
    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      if (!row || row.length === 0) continue;
      
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

  parseExerciseRow(row, startCol, endCol, allData, rowIndex) {
    const exerciseName = row[startCol] || '';
    if (!exerciseName || exerciseName.toLowerCase().includes('отдыхаем')) {
      return null;
    }
    
    const exerciseData = {
      name: exerciseName.trim(),
      group: '',
      sets: 4,
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
    
    return exerciseData;
  }

  parseWorkoutPlan(rawData) {
    if (!rawData || rawData.length < 2) {
      throw new Error('Недостаточно данных в таблице');
    }

    const workoutPlan = {};
    const headerRow = rawData[0];
    const dayColumns = this.extractDayColumns(headerRow);
    
    dayColumns.forEach(({ dayName, startCol, endCol }) => {
      workoutPlan[dayName] = this.parseExercisesForDay(rawData, startCol, endCol);
    });

    return workoutPlan;
  }
}

// Тестовый класс для запуска тестов
class WorkoutParserTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.realData = null;
  }

  // Добавить тест
  addTest(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  // Запустить все тесты
  async runAll() {
    console.log('🧪 Запуск тестов парсера тренировок с реальными данными...\n');
    
    // Сначала получаем реальные данные
    try {
      console.log('📊 Получение данных из реальной таблицы...');
      this.realData = await fetchRealSheetData();
      console.log(`✅ Получено ${this.realData.length} строк данных\n`);
    } catch (error) {
      console.error('❌ Ошибка получения данных:', error.message);
      console.log('💡 Проверьте интернет-соединение и доступность таблицы');
      return false;
    }
    
    for (const test of this.tests) {
      try {
        await test.testFunction();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Результаты: ${this.passed} прошли, ${this.failed} провалились`);
    return this.failed === 0;
  }

  // Утилита для проверки равенства
  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}. Ожидалось: ${expected}, получено: ${actual}`);
    }
  }

  // Утилита для проверки истинности
  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(`${message}. Условие не выполнено`);
    }
  }

  // Утилита для проверки наличия элемента в массиве
  assertContains(array, element, message) {
    if (!array.includes(element)) {
      throw new Error(`${message}. Элемент ${element} не найден в массиве`);
    }
  }
}

// Создаем экземпляр тестов
const testRunner = new WorkoutParserTests();

// Тест 1: Получение реальных данных
testRunner.addTest('Получение данных из реальной таблицы', () => {
  testRunner.assertTrue(testRunner.realData && testRunner.realData.length > 0, 'Данные должны быть получены');
  testRunner.assertTrue(testRunner.realData.length >= 10, 'Должно быть достаточно строк данных');
});

// Тест 2: Извлечение колонок дней недели
testRunner.addTest('Извлечение колонок дней недели', () => {
  const parser = new TestWorkoutParser();
  const headerRow = testRunner.realData[0];
  const dayColumns = parser.extractDayColumns(headerRow);
  
  testRunner.assertTrue(dayColumns.length > 0, 'Должны быть найдены колонки дней');
  
  const dayNames = dayColumns.map(dc => dc.dayName);
  testRunner.assertContains(dayNames, 'Понедельник', 'Должен быть найден Понедельник');
  testRunner.assertContains(dayNames, 'Среда', 'Должен быть найден Среда');
  testRunner.assertContains(dayNames, 'Пятница', 'Должен быть найден Пятница');
});

// Тест 3: Нормализация названий дней
testRunner.addTest('Нормализация названий дней', () => {
  const parser = new TestWorkoutParser();
  testRunner.assertEqual(
    parser.normalizeDayName('Понедельник ГРУДЬ И БИЦЕПС'),
    'Понедельник',
    'Нормализация понедельника'
  );
  
  testRunner.assertEqual(
    parser.normalizeDayName('Среда СПИНА И ТРИЦЕПС'),
    'Среда',
    'Нормализация среды'
  );
  
  testRunner.assertEqual(
    parser.normalizeDayName('Пятница ПЛЕЧИ И НОГИ'),
    'Пятница',
    'Нормализация пятницы'
  );
});

// Тест 4: Парсинг полного плана тренировок
testRunner.addTest('Парсинг полного плана тренировок', () => {
  const parser = new TestWorkoutParser();
  const workoutPlan = parser.parseWorkoutPlan(testRunner.realData);
  
  testRunner.assertTrue(
    Object.keys(workoutPlan).length > 0,
    'План должен содержать тренировки'
  );
  
  // Проверяем наличие тренировок по дням
  testRunner.assertTrue(
    workoutPlan['Понедельник'] && workoutPlan['Понедельник'].length > 0,
    'Понедельник должен содержать упражнения'
  );
  
  testRunner.assertTrue(
    workoutPlan['Среда'] && workoutPlan['Среда'].length > 0,
    'Среда должна содержать упражнения'
  );
  
  testRunner.assertTrue(
    workoutPlan['Пятница'] && workoutPlan['Пятница'].length > 0,
    'Пятница должна содержать упражнения'
  );
});

// Тест 5: Структура данных упражнения
testRunner.addTest('Структура данных упражнения', () => {
  const parser = new TestWorkoutParser();
  const workoutPlan = parser.parseWorkoutPlan(testRunner.realData);
  
  const mondayExercises = workoutPlan['Понедельник'];
  testRunner.assertTrue(mondayExercises.length > 0, 'Должны быть упражнения в понедельник');
  
  const firstExercise = mondayExercises[0];
  testRunner.assertTrue(
    firstExercise.name && firstExercise.name.length > 0,
    'Упражнение должно иметь название'
  );
  
  testRunner.assertTrue(
    firstExercise.group && firstExercise.group.length > 0,
    'Упражнение должно иметь группу мышц'
  );
  
  testRunner.assertTrue(
    firstExercise.reps && firstExercise.reps.length > 0,
    'Упражнение должно иметь повторы'
  );
});

// Тест 6: Класс Exercise
testRunner.addTest('Класс Exercise', () => {
  const exerciseData = {
    name: 'Жим штанги лёжа',
    group: 'Грудные мышцы',
    sets: 4,
    reps: '6,6,6,6',
    weight: '',
    rest: '',
    specialty: 'Обычный подход',
    videoUrl: '',
    comment: '',
    completed: false
  };
  
  const exercise = new Exercise(exerciseData);
  
  testRunner.assertEqual(exercise.name, 'Жим штанги лёжа', 'Название упражнения');
  testRunner.assertEqual(exercise.group, 'Грудные мышцы', 'Группа мышц');
  testRunner.assertEqual(exercise.getSetsCount(), 4, 'Количество подходов');
  testRunner.assertTrue(!exercise.isRest(), 'Не должно быть отдыхом');
});

// Тест 7: Класс Workout
testRunner.addTest('Класс Workout', () => {
  const exercises = [
    { name: 'Жим штанги лёжа', group: 'Грудные мышцы', sets: 4, reps: '6', completed: false },
    { name: 'Отдыхаем!', group: 'Отдых', sets: 0, reps: '', completed: false }
  ];
  
  const workout = new Workout('Понедельник', exercises);
  
  testRunner.assertEqual(workout.dayName, 'Понедельник', 'Название дня');
  testRunner.assertEqual(workout.exercises.length, 2, 'Количество упражнений');
  testRunner.assertEqual(workout.getActiveExercises().length, 1, 'Количество активных упражнений');
  testRunner.assertEqual(workout.getProgress(), 0, 'Прогресс должен быть 0%');
});

// Тест 8: Класс WorkoutPlan
testRunner.addTest('Класс WorkoutPlan', () => {
  const parser = new TestWorkoutParser();
  const planData = parser.parseWorkoutPlan(testRunner.realData);
  const plan = new WorkoutPlan(planData);
  
  testRunner.assertTrue(plan.getWorkoutByDay('Понедельник'), 'Тренировка понедельника');
  testRunner.assertTrue(plan.getWorkoutByDay('Среда'), 'Тренировка среды');
  
  const stats = plan.getStats();
  testRunner.assertTrue(stats.totalWorkouts > 0, 'Должны быть тренировки');
  testRunner.assertTrue(stats.totalExercises > 0, 'Должны быть упражнения');
});

// Тест 9: Валидация URL
testRunner.addTest('Валидация URL Google Sheets', () => {
  testRunner.assertTrue(
    ValidationUtils.isValidGoogleSheetsUrl(REAL_SHEET_URL),
    'Реальный URL должен проходить проверку'
  );
  
  const invalidUrl = 'https://example.com/sheet';
  testRunner.assertTrue(
    !ValidationUtils.isValidGoogleSheetsUrl(invalidUrl),
    'Невалидный URL не должен проходить проверку'
  );
});

// Тест 10: Интеграционный тест
testRunner.addTest('Интеграционный тест парсинга', () => {
  const parser = new TestWorkoutParser();
  const workoutPlan = parser.parseWorkoutPlan(testRunner.realData);
  const plan = new WorkoutPlan(workoutPlan);
  
  // Проверяем, что план создался корректно
  testRunner.assertTrue(plan, 'План должен быть создан');
  
  // Проверяем статистику
  const stats = plan.getStats();
  testRunner.assertTrue(stats.totalWorkouts > 0, 'Должны быть тренировки');
  testRunner.assertTrue(stats.totalExercises > 0, 'Должны быть упражнения');
  
  // Проверяем конкретные тренировки
  const mondayWorkout = plan.getWorkoutByDay('Понедельник');
  testRunner.assertTrue(mondayWorkout, 'Тренировка понедельника должна существовать');
  
  const activeExercises = mondayWorkout.getActiveExercises();
  testRunner.assertTrue(activeExercises.length > 0, 'Должны быть активные упражнения');
  
  // Проверяем первое упражнение
  const firstExercise = activeExercises[0];
  testRunner.assertTrue(firstExercise.name.length > 0, 'Упражнение должно иметь название');
  testRunner.assertTrue(firstExercise.group.length > 0, 'Упражнение должно иметь группу');
});

// Экспорт для использования в приложении
export { testRunner, REAL_SHEET_URL };

// Функция для запуска тестов из консоли
export const runTests = async () => {
  return await testRunner.runAll();
};