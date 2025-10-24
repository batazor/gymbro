/**
 * Утилиты для работы с данными тренировок
 */

// Константы для дней недели
export const DAYS_OF_WEEK = [
  'Понедельник',
  'Вторник', 
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

// Структура данных упражнения
export class Exercise {
  constructor(data) {
    this.name = data.name || '';
    this.group = data.group || '';
    this.sets = data.sets || 0;
    this.reps = data.reps || '';
    this.weight = data.weight || '';
    this.rest = data.rest || '';
    this.specialty = data.specialty || '';
    this.videoUrl = data.videoUrl || '';
    this.comment = data.comment || '';
    this.completed = data.completed || false;
  }

  // Получить количество подходов как число
  getSetsCount() {
    if (typeof this.sets === 'number') return this.sets;
    if (typeof this.sets === 'string') {
      const match = this.sets.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  // Получить диапазон повторов
  getRepsRange() {
    if (typeof this.reps === 'string') {
      const match = this.reps.match(/(\d+)-(\d+)/);
      if (match) {
        return {
          min: parseInt(match[1]),
          max: parseInt(match[2])
        };
      }
      const singleMatch = this.reps.match(/(\d+)/);
      if (singleMatch) {
        const num = parseInt(singleMatch[1]);
        return { min: num, max: num };
      }
    }
    return { min: 0, max: 0 };
  }

  // Проверить, является ли упражнение отдыхом
  isRest() {
    return this.name.toLowerCase().includes('отдыхаем') || 
           this.name.toLowerCase().includes('отдых');
  }
}

// Структура данных тренировки
export class Workout {
  constructor(dayName, exercises = []) {
    this.dayName = dayName;
    this.exercises = exercises.map(ex => new Exercise(ex));
    this.completed = false;
    this.date = null;
  }

  // Получить только активные упражнения (не отдых)
  getActiveExercises() {
    return this.exercises.filter(ex => !ex.isRest());
  }

  // Проверить, завершена ли тренировка
  isCompleted() {
    return this.getActiveExercises().every(ex => ex.completed);
  }

  // Получить прогресс тренировки (в процентах)
  getProgress() {
    const activeExercises = this.getActiveExercises();
    if (activeExercises.length === 0) return 100;
    
    const completedCount = activeExercises.filter(ex => ex.completed).length;
    return Math.round((completedCount / activeExercises.length) * 100);
  }
}

// Структура данных тренировочного плана
export class WorkoutPlan {
  constructor(data = {}) {
    this.workouts = {};
    this.parseData(data);
  }

  parseData(data) {
    DAYS_OF_WEEK.forEach(day => {
      this.workouts[day] = new Workout(day, data[day] || []);
    });
  }

  // Получить тренировку по дню
  getWorkoutByDay(dayName) {
    return this.workouts[dayName] || new Workout(dayName);
  }

  // Получить тренировку на сегодня
  getTodayWorkout() {
    const today = new Date().getDay();
    const adjustedDay = today === 0 ? 6 : today - 1; // Воскресенье = 6
    const dayName = DAYS_OF_WEEK[adjustedDay];
    return this.getWorkoutByDay(dayName);
  }

  // Получить все тренировки
  getAllWorkouts() {
    return Object.values(this.workouts);
  }

  // Получить статистику плана
  getStats() {
    const workouts = this.getAllWorkouts();
    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(w => w.isCompleted()).length;
    const totalExercises = workouts.reduce((sum, w) => sum + w.getActiveExercises().length, 0);
    const completedExercises = workouts.reduce((sum, w) => 
      sum + w.getActiveExercises().filter(ex => ex.completed).length, 0
    );

    return {
      totalWorkouts,
      completedWorkouts,
      totalExercises,
      completedExercises,
      completionRate: totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0,
      exerciseCompletionRate: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0
    };
  }
}

// Утилиты для работы с датами
export const DateUtils = {
  // Получить название дня недели
  getDayName(date = new Date()) {
    const dayIndex = date.getDay();
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAYS_OF_WEEK[adjustedIndex];
  },

  // Получить индекс дня недели
  getDayIndex(date = new Date()) {
    const dayIndex = date.getDay();
    return dayIndex === 0 ? 6 : dayIndex - 1;
  },

  // Проверить, является ли день выходным
  isWeekend(date = new Date()) {
    const dayIndex = date.getDay();
    return dayIndex === 0 || dayIndex === 6; // Воскресенье или суббота
  },

  // Форматировать дату для отображения
  formatDate(date = new Date()) {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

// Утилиты для валидации
export const ValidationUtils = {
  // Проверить валидность URL Google Sheets
  isValidGoogleSheetsUrl(url) {
    const pattern = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
    return pattern.test(url);
  },

  // Проверить валидность данных упражнения
  isValidExercise(exercise) {
    return exercise && 
           typeof exercise.name === 'string' && 
           exercise.name.trim().length > 0;
  },

  // Проверить валидность данных тренировки
  isValidWorkout(workout) {
    return workout && 
           typeof workout.dayName === 'string' && 
           Array.isArray(workout.exercises);
  }
};
