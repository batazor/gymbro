import AsyncStorage from '@react-native-async-storage/async-storage';

class WorkoutStorageService {
  constructor() {
    this.WORKOUT_HISTORY_KEY = 'workout_history';
    this.CURRENT_WORKOUT_KEY = 'current_workout';
    this.STATISTICS_KEY = 'workout_statistics';
  }

  // Сохранение завершенной тренировки
  async saveWorkoutResult(workoutData) {
    try {
      const workoutResult = {
        id: this.generateWorkoutId(),
        date: new Date().toISOString(),
        workout: workoutData.workout,
        exerciseIndex: workoutData.exerciseIndex,
        exercise: workoutData.exercise,
        sets: workoutData.sets,
        notes: workoutData.notes,
        duration: workoutData.duration || 0,
        completedAt: new Date().toISOString()
      };

      // Получаем существующую историю
      const history = await this.getWorkoutHistory();
      
      // Добавляем новую тренировку
      history.push(workoutResult);
      
      // Сохраняем обновленную историю
      await AsyncStorage.setItem(this.WORKOUT_HISTORY_KEY, JSON.stringify(history));
      
      // Обновляем статистику
      await this.updateStatistics(workoutResult);
      
      console.log('✅ Тренировка сохранена:', workoutResult.id);
      return workoutResult;
    } catch (error) {
      console.error('❌ Ошибка сохранения тренировки:', error);
      throw error;
    }
  }

  // Получение истории тренировок
  async getWorkoutHistory() {
    try {
      const historyJson = await AsyncStorage.getItem(this.WORKOUT_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('❌ Ошибка получения истории:', error);
      return [];
    }
  }

  // Получение статистики
  async getStatistics() {
    try {
      const statsJson = await AsyncStorage.getItem(this.STATISTICS_KEY);
      return statsJson ? JSON.parse(statsJson) : this.getDefaultStatistics();
    } catch (error) {
      console.error('❌ Ошибка получения статистики:', error);
      return this.getDefaultStatistics();
    }
  }

  // Обновление статистики
  async updateStatistics(workoutResult) {
    try {
      const stats = await this.getStatistics();
      
      // Обновляем общую статистику
      stats.totalWorkouts += 1;
      stats.totalExercises += 1;
      stats.totalSets += workoutResult.sets.length;
      stats.totalCompletedSets += workoutResult.sets.filter(set => set.completed).length;
      
      // Обновляем статистику по дням недели
      const dayName = this.getDayNameFromDate(workoutResult.date);
      if (!stats.workoutsByDay[dayName]) {
        stats.workoutsByDay[dayName] = 0;
      }
      stats.workoutsByDay[dayName] += 1;
      
      // Обновляем статистику по упражнениям
      const exerciseName = workoutResult.exercise.name;
      if (!stats.exercisesStats[exerciseName]) {
        stats.exercisesStats[exerciseName] = {
          count: 0,
          totalSets: 0,
          totalWeight: 0,
          lastPerformed: null
        };
      }
      
      stats.exercisesStats[exerciseName].count += 1;
      stats.exercisesStats[exerciseName].totalSets += workoutResult.sets.length;
      stats.exercisesStats[exerciseName].totalWeight += workoutResult.sets.reduce((sum, set) => 
        sum + (parseFloat(set.weight) || 0), 0
      );
      stats.exercisesStats[exerciseName].lastPerformed = workoutResult.date;
      
      // Обновляем последнюю тренировку
      stats.lastWorkout = workoutResult.date;
      
      // Сохраняем обновленную статистику
      await AsyncStorage.setItem(this.STATISTICS_KEY, JSON.stringify(stats));
      
      console.log('✅ Статистика обновлена');
    } catch (error) {
      console.error('❌ Ошибка обновления статистики:', error);
    }
  }

  // Получение статистики по упражнению
  async getExerciseStats(exerciseName) {
    try {
      const stats = await this.getStatistics();
      return stats.exercisesStats[exerciseName] || {
        count: 0,
        totalSets: 0,
        totalWeight: 0,
        lastPerformed: null
      };
    } catch (error) {
      console.error('❌ Ошибка получения статистики упражнения:', error);
      return this.getDefaultExerciseStats();
    }
  }

  // Получение тренировок за период
  async getWorkoutsByPeriod(startDate, endDate) {
    try {
      const history = await this.getWorkoutHistory();
      return history.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= startDate && workoutDate <= endDate;
      });
    } catch (error) {
      console.error('❌ Ошибка получения тренировок за период:', error);
      return [];
    }
  }

  // Получение последних тренировок
  async getRecentWorkouts(limit = 10) {
    try {
      const history = await this.getWorkoutHistory();
      return history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Ошибка получения последних тренировок:', error);
      return [];
    }
  }

  // Экспорт данных в JSON
  async exportData() {
    try {
      const history = await this.getWorkoutHistory();
      const statistics = await this.getStatistics();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        history,
        statistics
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Ошибка экспорта данных:', error);
      throw error;
    }
  }

  // Очистка всех данных
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(this.WORKOUT_HISTORY_KEY);
      await AsyncStorage.removeItem(this.CURRENT_WORKOUT_KEY);
      await AsyncStorage.removeItem(this.STATISTICS_KEY);
      console.log('✅ Все данные очищены');
    } catch (error) {
      console.error('❌ Ошибка очистки данных:', error);
      throw error;
    }
  }

  // Вспомогательные методы
  generateWorkoutId() {
    return `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getDayNameFromDate(dateString) {
    const date = new Date(dateString);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
  }

  getDefaultStatistics() {
    return {
      totalWorkouts: 0,
      totalExercises: 0,
      totalSets: 0,
      totalCompletedSets: 0,
      workoutsByDay: {},
      exercisesStats: {},
      lastWorkout: null,
      createdAt: new Date().toISOString()
    };
  }

  getDefaultExerciseStats() {
    return {
      count: 0,
      totalSets: 0,
      totalWeight: 0,
      lastPerformed: null
    };
  }

  // Сохранение текущей тренировки (для восстановления)
  async saveCurrentWorkout(workoutData) {
    try {
      await AsyncStorage.setItem(this.CURRENT_WORKOUT_KEY, JSON.stringify(workoutData));
    } catch (error) {
      console.error('❌ Ошибка сохранения текущей тренировки:', error);
    }
  }

  // Получение текущей тренировки
  async getCurrentWorkout() {
    try {
      const currentWorkoutJson = await AsyncStorage.getItem(this.CURRENT_WORKOUT_KEY);
      return currentWorkoutJson ? JSON.parse(currentWorkoutJson) : null;
    } catch (error) {
      console.error('❌ Ошибка получения текущей тренировки:', error);
      return null;
    }
  }

  // Очистка текущей тренировки
  async clearCurrentWorkout() {
    try {
      await AsyncStorage.removeItem(this.CURRENT_WORKOUT_KEY);
    } catch (error) {
      console.error('❌ Ошибка очистки текущей тренировки:', error);
    }
  }
}

export default new WorkoutStorageService();
