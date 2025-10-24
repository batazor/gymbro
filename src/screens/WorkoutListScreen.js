import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWorkout } from '../context/WorkoutContext';

const DAYS_OF_WEEK = [
  'Понедельник',
  'Вторник', 
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

export default function WorkoutListScreen({ navigation }) {
  const { state, setCurrentDay } = useWorkout();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    // Определяем текущий день недели
    const today = new Date().getDay();
    const adjustedDay = today === 0 ? 6 : today - 1; // Воскресенье = 6
    setCurrentDayIndex(adjustedDay);
  }, []);

  const getWorkoutForDay = (dayIndex) => {
    const dayName = DAYS_OF_WEEK[dayIndex];
    return state.workoutPlan?.[dayName] || [];
  };

  const getCurrentWorkout = () => {
    return getWorkoutForDay(currentDayIndex);
  };

  const handleStartWorkout = () => {
    const workout = getCurrentWorkout();
    if (workout.length === 0) {
      Alert.alert(
        'Отдых! 😎',
        'Сегодня у вас нет тренировки. Хорошего отдыха!',
        [{ text: 'OK' }]
      );
      return;
    }

    setCurrentDay(DAYS_OF_WEEK[currentDayIndex]);
    navigation.navigate('Exercise', { 
      exerciseIndex: 0,
      exercise: workout[0]
    });
  };

  const renderDayItem = ({ item: dayName, index }) => {
    const workout = getWorkoutForDay(index);
    const isToday = index === currentDayIndex;
    const isCompleted = false; // TODO: проверка завершенности тренировки

    return (
      <TouchableOpacity
        style={[
          styles.dayItem,
          isToday && styles.todayItem,
          isCompleted && styles.completedItem
        ]}
        onPress={() => {
          setCurrentDayIndex(index);
          if (workout.length > 0) {
            setCurrentDay(dayName);
            navigation.navigate('Exercise', { 
              exerciseIndex: 0,
              exercise: workout[0]
            });
          }
        }}
      >
        <View style={styles.dayHeader}>
          <Text style={[
            styles.dayName,
            isToday && styles.todayText
          ]}>
            {dayName}
          </Text>
          {isToday && <Text style={styles.todayLabel}>СЕГОДНЯ</Text>}
          {isCompleted && <Text style={styles.completedLabel}>✅</Text>}
        </View>
        
        <Text style={styles.exerciseCount}>
          {workout.length > 0 
            ? `${workout.length} упражнений` 
            : 'Отдых'
          }
        </Text>
        
        {workout.length > 0 && (
          <View style={styles.exercisePreview}>
            {workout.slice(0, 2).map((exercise, idx) => (
              <Text key={idx} style={styles.exerciseName}>
                • {exercise.name}
              </Text>
            ))}
            {workout.length > 2 && (
              <Text style={styles.moreExercises}>
                и еще {workout.length - 2}...
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCurrentWorkout = () => {
    const workout = getCurrentWorkout();
    
    if (workout.length === 0) {
      return (
        <View style={styles.restDayContainer}>
          <Text style={styles.restDayEmoji}>😎</Text>
          <Text style={styles.restDayTitle}>День отдыха!</Text>
          <Text style={styles.restDayText}>
            Сегодня у вас нет тренировки.{'\n'}
            Хорошего отдыха!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.currentWorkoutContainer}>
        <Text style={styles.currentWorkoutTitle}>
          Тренировка на сегодня
        </Text>
        <Text style={styles.currentWorkoutSubtitle}>
          {DAYS_OF_WEEK[currentDayIndex]} • {workout.length} упражнений
        </Text>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startButtonText}>🏋️‍♂️ Начать тренировку</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!state.workoutPlan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={styles.loadingText}>Загрузка плана тренировок...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCurrentWorkout()}
      
      <View style={styles.weekContainer}>
        <Text style={styles.weekTitle}>📅 Недельный план</Text>
        <FlatList
          data={DAYS_OF_WEEK}
          renderItem={renderDayItem}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
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
  currentWorkoutContainer: {
    backgroundColor: '#2E8B57',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentWorkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  currentWorkoutSubtitle: {
    fontSize: 14,
    color: '#e8f5e8',
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  restDayContainer: {
    backgroundColor: '#fff3cd',
    margin: 15,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  restDayEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  restDayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  restDayText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 22,
  },
  weekContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  dayItem: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  todayItem: {
    borderColor: '#2E8B57',
    borderWidth: 2,
  },
  completedItem: {
    backgroundColor: '#e8f5e8',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayText: {
    color: '#2E8B57',
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E8B57',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedLabel: {
    fontSize: 16,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exercisePreview: {
    marginTop: 5,
  },
  exerciseName: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  moreExercises: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
