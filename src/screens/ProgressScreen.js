import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useWorkout } from '../context/WorkoutContext';

export default function ProgressScreen({ navigation }) {
  const { state } = useWorkout();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [progressStats, setProgressStats] = useState(null);

  useEffect(() => {
    calculateProgressStats();
  }, [state.progress]);

  const calculateProgressStats = () => {
    if (!state.progress || state.progress.length === 0) {
      setProgressStats(null);
      return;
    }

    // Группируем прогресс по дням
    const progressByDay = {};
    state.progress.forEach(item => {
      if (!progressByDay[item.date]) {
        progressByDay[item.date] = {};
      }
      if (!progressByDay[item.date][item.exercise]) {
        progressByDay[item.date][item.exercise] = [];
      }
      progressByDay[item.date][item.exercise].push(item);
    });

    // Вычисляем статистику
    const totalWorkouts = Object.keys(progressByDay).length;
    const totalExercises = Object.keys(
      Object.values(progressByDay).reduce((acc, day) => ({ ...acc, ...day }), {})
    ).length;
    
    const completedSets = state.progress.filter(item => item.completed).length;
    const totalSets = state.progress.length;

    setProgressStats({
      totalWorkouts,
      totalExercises,
      completedSets,
      totalSets,
      completionRate: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
      progressByDay
    });
  };

  const getProgressForDay = (date) => {
    if (!progressStats) return [];
    
    const dayProgress = progressStats.progressByDay[date];
    if (!dayProgress) return [];

    return Object.entries(dayProgress).map(([exercise, sets]) => ({
      exercise,
      sets: sets.sort((a, b) => a.set - b.set),
      completedSets: sets.filter(set => set.completed).length,
      totalSets: sets.length
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const renderProgressItem = ({ item }) => (
    <View style={styles.progressItem}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.exercise}</Text>
        <Text style={styles.exerciseStats}>
          {item.completedSets}/{item.totalSets} подходов
        </Text>
      </View>
      
      <View style={styles.setsContainer}>
        {item.sets.map((set, index) => (
          <View key={index} style={[
            styles.setItem,
            set.completed && styles.completedSetItem
          ]}>
            <Text style={styles.setNumber}>Подход {set.set}</Text>
            <Text style={styles.setDetails}>
              {set.weight ? `${set.weight}кг` : 'Без веса'} × {set.reps || 'N/A'} повт.
            </Text>
            <Text style={[
              styles.setStatus,
              set.completed && styles.completedSetStatus
            ]}>
              {set.completed ? '✅' : '❌'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDayItem = ({ item: date }) => {
    const dayProgress = getProgressForDay(date);
    const isSelected = selectedDay === date;

    return (
      <TouchableOpacity
        style={[
          styles.dayItem,
          isSelected && styles.selectedDayItem
        ]}
        onPress={() => setSelectedDay(isSelected ? null : date)}
      >
        <Text style={[
          styles.dayDate,
          isSelected && styles.selectedDayDate
        ]}>
          {formatDate(date)}
        </Text>
        <Text style={styles.dayStats}>
          {dayProgress.length} упражнений
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStatsCard = (title, value, subtitle) => (
    <View style={styles.statsCard}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={styles.loadingText}>Загрузка прогресса...</Text>
      </View>
    );
  }

  if (!progressStats || progressStats.totalWorkouts === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>Нет данных о прогрессе</Text>
        <Text style={styles.emptyText}>
          Выполните несколько тренировок, чтобы увидеть статистику
        </Text>
        <TouchableOpacity
          style={styles.startWorkoutButton}
          onPress={() => navigation.navigate('WorkoutList')}
        >
          <Text style={styles.startWorkoutButtonText}>🏋️‍♂️ Начать тренировку</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dates = Object.keys(progressStats.progressByDay).sort().reverse();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>📈 Общая статистика</Text>
        
        <View style={styles.statsGrid}>
          {renderStatsCard(
            'Тренировок',
            progressStats.totalWorkouts,
            'дней'
          )}
          {renderStatsCard(
            'Упражнений',
            progressStats.totalExercises,
            'разных'
          )}
          {renderStatsCard(
            'Подходов',
            progressStats.completedSets,
            `из ${progressStats.totalSets}`
          )}
          {renderStatsCard(
            'Прогресс',
            `${progressStats.completionRate}%`,
            'выполнено'
          )}
        </View>
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>📅 История тренировок</Text>
        
        <FlatList
          data={dates}
          renderItem={renderDayItem}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />

        {selectedDay && (
          <View style={styles.selectedDayContainer}>
            <Text style={styles.selectedDayTitle}>
              Тренировка {formatDate(selectedDay)}
            </Text>
            
            <FlatList
              data={getProgressForDay(selectedDay)}
              renderItem={renderProgressItem}
              keyExtractor={(item, index) => `${item.exercise}-${index}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  startWorkoutButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startWorkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 5,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  historyContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dayItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDayItem: {
    backgroundColor: '#e8f5e8',
    borderColor: '#2E8B57',
    borderWidth: 2,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  selectedDayDate: {
    color: '#2E8B57',
  },
  dayStats: {
    fontSize: 14,
    color: '#666',
  },
  selectedDayContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  exerciseStats: {
    fontSize: 14,
    color: '#666',
  },
  setsContainer: {
    marginTop: 5,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 5,
  },
  completedSetItem: {
    backgroundColor: '#e8f5e8',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  setDetails: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  setStatus: {
    fontSize: 16,
  },
  completedSetStatus: {
    color: '#4caf50',
  },
});
