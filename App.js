import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { 
  Provider as PaperProvider, 
  Card, 
  Title, 
  Paragraph, 
  TextInput, 
  Button, 
  ActivityIndicator,
  Snackbar,
  Surface,
  Text
} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import GoogleSheetsService from './src/services/GoogleSheetsService';
import ExerciseScreen from './src/screens/ExerciseScreen';
import ProgressSetupScreen from './src/screens/ProgressSetupScreen';

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleLoadWorkout = async () => {
    if (!sheetUrl.trim()) {
      setError('Введите URL таблицы');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authResult = await GoogleSheetsService.authenticate();
      
      if (!authResult || (typeof authResult === 'object' && !authResult.success)) {
        const errorMsg = typeof authResult === 'object' ? authResult.message : 'Ошибка аутентификации';
        throw new Error(errorMsg);
      }
      
      const data = await GoogleSheetsService.getSheetData(sheetUrl);
      const rawPlan = GoogleSheetsService.parseWorkoutPlan(data);

      // Нормализуем структуру под UI: { workouts: [{ day, muscleGroup, exercises }] }
      const workoutsArray = Object.entries(rawPlan).map(([day, exercises]) => ({
        day,
        muscleGroup: (exercises.find(ex => ex.group)?.group) || '',
        exercises,
      }));

      setWorkoutPlan({ workouts: workoutsArray });
      setError(`Успех! Загружен план с ${workoutsArray.length} тренировками`);
      setSnackbarVisible(true);
    } catch (err) {
      setError(err.message);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getTodayWorkout = () => {
    if (!workoutPlan) return null;
    
    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long' });
    const todayWorkout = workoutPlan.workouts.find(w => 
      w.day.toLowerCase().includes(today.toLowerCase())
    );
    
    return todayWorkout || workoutPlan.workouts[0];
  };

  const openVideo = async (videoUrl) => {
    if (videoUrl) {
      try {
        const supported = await Linking.canOpenURL(videoUrl);
        if (supported) {
          await Linking.openURL(videoUrl);
        } else {
          Alert.alert('Ошибка', 'Не удается открыть ссылку на видео');
        }
      } catch (error) {
        Alert.alert('Ошибка', 'Не удается открыть ссылку на видео');
      }
    }
  };

  const startWorkout = (workout) => {
    if (workout.exercises.length === 0) {
      Alert.alert('Ошибка', 'В этой тренировке нет упражнений');
      return;
    }
    
    navigation.navigate('Exercise', {
      exercise: workout.exercises[0],
      exerciseIndex: 0,
      totalExercises: workout.exercises.length,
      workout: workout,
      sheetUrl: sheetUrl
    });
  };

  const todayWorkout = getTodayWorkout();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <Surface style={styles.header} elevation={4}>
          <Title style={styles.title}>🏋️‍♂️ GymBro MVP</Title>
          <Paragraph style={styles.subtitle}>
            Тренировочный план из Google Sheets
          </Paragraph>
        </Surface>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Настройка таблицы</Title>
            <TextInput
              label="URL Google Sheets"
              value={sheetUrl}
              onChangeText={setSheetUrl}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              style={styles.input}
              mode="outlined"
            />
            <Button 
              mode="contained" 
              onPress={handleLoadWorkout}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Загрузка...' : 'Загрузить план'}
            </Button>
          </Card.Content>
        </Card>

        {todayWorkout && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.workoutTitle}>
                📅 {todayWorkout.day}: {todayWorkout.muscleGroup}
              </Title>
              <Paragraph style={styles.exerciseCount}>
                {todayWorkout.exercises.length} упражнений
              </Paragraph>
              
                  <Button 
                    mode="contained" 
                    onPress={() => startWorkout(todayWorkout)}
                    style={styles.startButton}
                    icon="play"
                  >
                    Начать тренировку
                  </Button>
                  
                  <Button 
                    mode="outlined" 
                    onPress={() => navigation.navigate('ProgressSetup', { sheetUrl })}
                    style={styles.setupButton}
                    icon="cog"
                  >
                    Настроить сохранение прогресса
                  </Button>
              
              {todayWorkout.exercises.map((exercise, index) => (
                <Card key={index} style={styles.exerciseCard}>
                  <Card.Content>
                    <Title style={styles.exerciseName}>
                      {index + 1}. {exercise.name}
                    </Title>
                    <Paragraph style={styles.exerciseDetails}>
                      {exercise.sets} × {exercise.reps} | {exercise.group}
                    </Paragraph>
                    
                    {exercise.videoUrl && (
                      <Button 
                        mode="outlined" 
                        onPress={() => openVideo(exercise.videoUrl)}
                        style={styles.videoButton}
                        icon="play-circle"
                        compact
                      >
                        Видео
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.footerCard}>
          <Card.Content>
            <Text style={styles.footerText}>
              ✅ MVP версия работает!{'\n'}
              📊 Данные загружаются из реальной таблицы{'\n'}
              🚀 Готово к дальнейшей разработке
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: 'GymBro MVP',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="Exercise" 
              component={ExerciseScreen}
              options={{ 
                title: 'Упражнение',
                headerStyle: {
                  backgroundColor: '#2E8B57',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen 
              name="ProgressSetup" 
              component={ProgressSetupScreen}
              options={{ 
                title: 'Настройка прогресса',
                headerStyle: {
                  backgroundColor: '#2E8B57',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    backgroundColor: '#2E8B57',
    padding: 24,
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  startButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  setupButton: {
    marginBottom: 16,
  },
  videoButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  workoutTitle: {
    color: '#2E8B57',
    marginBottom: 8,
  },
  exerciseCount: {
    marginBottom: 16,
    color: '#666',
  },
  exerciseCard: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  exerciseName: {
    fontSize: 16,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
  },
  footerCard: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  footerText: {
    color: '#2e7d32',
    fontSize: 14,
    lineHeight: 20,
  },
});
