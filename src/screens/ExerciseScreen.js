import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import {
  Card, 
  Title, 
  Paragraph, 
  TextInput, 
  Button, 
  Surface,
  Text,
  Chip,
  ProgressBar,
  Divider,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleSheetsService from '../services/GoogleSheetsService';

export default function ExerciseScreen({ route, navigation }) {
  const { exercise, exerciseIndex, totalExercises, workout, sheetUrl } = route.params;
  const [sets, setSets] = useState(
    Array(exercise.sets || 4).fill(null).map((_, index) => ({
      setNumber: index + 1,
      weight: '',
      reps: exercise.reps || '',
      completed: false
    }))
  );
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('success'); // 'success', 'error', 'info'

  const handleWeightChange = (weight) => {
    // Валидация: только цифры и точка/запятая для десятичных
    const cleanWeight = weight.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    
    const newSets = [...sets];
    newSets[currentSetIndex].weight = cleanWeight;
    setSets(newSets);
  };

  const handleRepsChange = (reps) => {
    const newSets = [...sets];
    newSets[currentSetIndex].reps = reps;
    setSets(newSets);
  };

  const markSetCompleted = () => {
    const newSets = [...sets];
    newSets[currentSetIndex].completed = true;
    setSets(newSets);
  };

  const goToNextSet = () => {
    if (currentSetIndex < sets.length - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    }
  };

  const goToPreviousSet = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex(currentSetIndex - 1);
    }
  };

  const openVideo = async () => {
    if (exercise.videoUrl) {
      try {
        const supported = await Linking.canOpenURL(exercise.videoUrl);
        if (supported) {
        await Linking.openURL(exercise.videoUrl);
        } else {
          Alert.alert('Ошибка', 'Не удается открыть ссылку на видео');
        }
      } catch (error) {
        Alert.alert('Ошибка', 'Не удается открыть ссылку на видео');
      }
    }
  };

  const getCompletedSetsCount = () => {
    return sets.filter(set => set.completed).length;
  };

  const getProgress = () => {
    return sets.length > 0 ? getCompletedSetsCount() / sets.length : 0;
  };

  const showSnackbar = (message, type = 'success') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const saveExerciseResults = async () => {
    if (!sheetUrl) {
      showSnackbar('URL таблицы не найден', 'error');
      return;
    }

    setSaving(true);
    showSnackbar('Сохранение результатов...', 'info');
    
    try {
      const progressData = {
        exercise,
        workout,
        sets,
        notes,
        exerciseIndex
      };

      const result = await GoogleSheetsService.writeProgress(sheetUrl, progressData);
      
      if (result.success) {
        if (result.apiResponse) {
          // Успешное обновление через API
          showSnackbar(`✅ Успешно обновлено ${result.positions.length} ячеек в таблице!`, 'success');
        } else if (result.manualUpdate) {
          // Нужно обновить вручную
          showSnackbar(
            `✅ Найдено ${result.positions.length} ячеек для обновления!`, 
            'info'
          );
          
          // Показываем детальное сообщение с адресами ячеек
          const cellInstructions = result.positions.map(pos => 
            `${pos.cellAddress}: ${pos.exercise} (подход ${pos.set}) = ${pos.value} кг`
          ).join('\n');

          Alert.alert(
            'Обновите ячейки в таблице',
            `Найдите и обновите следующие ячейки в вашей таблице:\n\n${cellInstructions}`,
            [
              { text: 'Понятно', style: 'default' },
              { text: 'Открыть таблицу', onPress: () => Linking.openURL(result.sheetUrl) }
            ]
          );
        } else {
          showSnackbar(`✅ Успешно сохранено!`, 'success');
        }
      } else if (result.error === 'access_denied') {
        showSnackbar('❌ Авторизация отменена', 'error');
        
        Alert.alert(
          'Авторизация отменена',
          'Вы отменили авторизацию в Google. Для сохранения данных необходимо предоставить разрешения. Попробуйте снова?',
          [
            { text: 'Нет', style: 'cancel' },
            { 
              text: 'Попробовать снова', 
              onPress: () => saveExerciseResults()
            }
          ]
        );
      } else if (result.needsVerification) {
        showSnackbar('⚠️ Требуется верификация приложения', 'error');
        
        Alert.alert(
          'Верификация приложения',
          'Приложение не прошло верификацию Google. Добавьте свой аккаунт в тестовые пользователи в Google Cloud Console.',
          [
            { text: 'Понятно', style: 'default' }
          ]
        );
      } else if (result.error === 'popup_blocked') {
        showSnackbar('❌ Блокировщик всплывающих окон', 'error');
        
        Alert.alert(
          'Блокировщик всплывающих окон',
          'Отключите блокировщик всплывающих окон для этого сайта и попробуйте снова.',
          [
            { text: 'Понятно', style: 'default' }
          ]
        );
      } else if (result.error === 'timeout') {
        showSnackbar('⏰ Таймаут авторизации', 'error');
        
        Alert.alert(
          'Таймаут авторизации',
          'Авторизация заняла слишком много времени. Попробуйте снова.',
          [
            { text: 'Понятно', style: 'default' }
          ]
        );
      } else if (result.error === 'redirect_required') {
        showSnackbar('🔄 Перенаправление на авторизацию', 'info');
        
        Alert.alert(
          'Авторизация Google',
          'Вы будете перенаправлены на страницу авторизации Google. После авторизации вернитесь в приложение.',
          [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Продолжить', 
              onPress: () => {
                if (result.authUrl) {
                  window.location.href = result.authUrl;
                }
              }
            }
          ]
        );
      } else {
        showSnackbar(`❌ Ошибка: ${result.message}`, 'error');
      }
    } catch (error) {
      showSnackbar(`❌ Ошибка сохранения: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const goToNextExercise = async () => {
    // Сначала сохраняем результаты текущего упражнения
    await saveExerciseResults();
    
    if (exerciseIndex < totalExercises - 1) {
      // Переходим к следующему упражнению
      const nextExercise = workout.exercises[exerciseIndex + 1];
      navigation.push('Exercise', {
        exercise: nextExercise,
        exerciseIndex: exerciseIndex + 1,
        totalExercises,
        workout,
        sheetUrl
      });
    } else {
      // Завершили все упражнения
      Alert.alert(
        'Тренировка завершена! 🎉',
        'Отличная работа! Все упражнения выполнены и сохранены.',
        [
          {
            text: 'Вернуться к плану',
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
    }
  };

  const currentSet = sets[currentSetIndex];

    return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Заголовок */}
        <Surface style={styles.header} elevation={4}>
          <Title style={styles.title}>
            {exerciseIndex + 1} из {totalExercises}
          </Title>
          <Paragraph style={styles.subtitle}>
            {workout.day}: {workout.muscleGroup}
          </Paragraph>
        </Surface>

        {/* Информация об упражнении */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.exerciseName}>{exercise.name}</Title>
            <Paragraph style={styles.exerciseGroup}>
              Группа мышц: {exercise.group}
            </Paragraph>
            
            {exercise.specialty && (
              <Paragraph style={styles.specialty}>
                💡 {exercise.specialty}
              </Paragraph>
            )}

            {/* Прогресс выполнения */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Прогресс: {getCompletedSetsCount()}/{sets.length} подходов
          </Text>
              <ProgressBar 
                progress={getProgress()} 
                color="#4CAF50" 
                style={styles.progressBar}
              />
        </View>

            {/* Ссылка на видео */}
            {exercise.videoUrl && (
              <Button 
                mode="outlined" 
                onPress={openVideo}
                style={styles.videoButton}
                icon="play-circle"
              >
                Смотреть технику выполнения
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Текущий подход */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.setTitle}>
              Подход {currentSet.setNumber} из {sets.length}
            </Title>
            
            <View style={styles.setStatus}>
              <Chip 
                mode={currentSet.completed ? "flat" : "outlined"}
              style={[
                  styles.completedChip,
                  currentSet.completed && styles.completedChipActive
                ]}
              >
                {currentSet.completed ? '✅ Выполнен' : '⏳ В процессе'}
              </Chip>
            </View>
            
            <View style={styles.inputsContainer}>
              <TextInput
                label="Вес (кг)"
                value={currentSet.weight}
                onChangeText={handleWeightChange}
                keyboardType="numeric"
                style={styles.weightInput}
                mode="outlined"
                disabled={currentSet.completed}
                placeholder="0.0"
                helperText="Только цифры"
              />
              <TextInput
                label="Повторы"
                value={currentSet.reps}
                onChangeText={handleRepsChange}
              keyboardType="numeric"
                style={styles.repsInput}
                mode="outlined"
                disabled={currentSet.completed}
            />
          </View>

            {/* Кнопки навигации по подходам */}
            <View style={styles.setNavigation}>
              <Button 
                mode="outlined" 
                onPress={goToPreviousSet}
                disabled={currentSetIndex === 0}
                style={styles.navButton}
                icon="chevron-left"
              >
                Предыдущий
              </Button>
              
              <Button 
                mode="contained" 
                onPress={() => {
                  markSetCompleted();
                  if (currentSetIndex < sets.length - 1) {
                    goToNextSet();
                  }
                }}
                style={styles.completeButton}
                icon="check"
                disabled={!currentSet.weight || !currentSet.reps}
              >
                {currentSetIndex < sets.length - 1 ? 'Выполнен →' : 'Завершить'}
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={goToNextSet}
                disabled={currentSetIndex === sets.length - 1}
                style={styles.navButton}
                icon="chevron-right"
              >
                Следующий
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Заметки */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.notesTitle}>Заметки к упражнению</Title>
            <TextInput
              label="Добавить заметку..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* Кнопки навигации между упражнениями */}
        <View style={styles.exerciseNavigation}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Назад к плану
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={saveExerciseResults}
            loading={saving}
            disabled={saving || getCompletedSetsCount() === 0}
            style={styles.saveButton}
            icon="content-save"
          >
            Сохранить
          </Button>
          
          <Button 
            mode="contained" 
            onPress={goToNextExercise}
            style={styles.nextButton}
            disabled={getCompletedSetsCount() === 0}
          >
            {exerciseIndex < totalExercises - 1 ? 'Следующее упражнение' : 'Завершить тренировку'}
          </Button>
        </View>
      </ScrollView>

      {/* Уведомления о статусе сохранения */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={6000}
            style={[
          styles.snackbar,
          snackbarType === 'error' && styles.snackbarError,
          snackbarType === 'info' && styles.snackbarInfo,
          snackbarType === 'success' && styles.snackbarSuccess
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
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
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
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
  exerciseName: {
    color: '#2E8B57',
    fontSize: 20,
    marginBottom: 8,
  },
  exerciseGroup: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  specialty: {
    fontSize: 14,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  videoButton: {
    marginTop: 8,
  },
  setTitle: {
    color: '#2E8B57',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  setStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completedChip: {
    backgroundColor: '#f0f0f0',
  },
  completedChipActive: {
    backgroundColor: '#E8F5E8',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weightInput: {
    flex: 1,
    marginRight: 8,
  },
  repsInput: {
    flex: 1,
    marginLeft: 8,
  },
  setNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  completeButton: {
    flex: 2,
    marginHorizontal: 8,
  },
  notesTitle: {
    color: '#2E8B57',
    marginBottom: 12,
  },
  notesInput: {
    marginBottom: 8,
  },
  exerciseNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    marginRight: 4,
  },
  saveButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  nextButton: {
    flex: 1,
    marginLeft: 4,
  },
  snackbar: {
    marginBottom: 16,
  },
  snackbarSuccess: {
    backgroundColor: '#4CAF50',
  },
  snackbarError: {
    backgroundColor: '#F44336',
  },
  snackbarInfo: {
    backgroundColor: '#2196F3',
  },
});