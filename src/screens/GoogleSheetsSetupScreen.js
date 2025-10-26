import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useWorkout } from '../context/WorkoutContext';
import GoogleSheetsService from '../services/GoogleSheetsService';

export default function GoogleSheetsSetupScreen({ navigation }) {
  const { state, setGoogleSheetsUrl, setWorkoutPlan, setLoading, setError, clearError } = useWorkout();
  const [url, setUrl] = useState(state.googleSheetsUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (!url.trim()) {
      Alert.alert('Ошибка', 'Введите ссылку на Google Sheets');
      return;
    }

    setIsLoading(true);
    setLoading(true);
    clearError();

    try {
      // Аутентификация
      const authResult = await GoogleSheetsService.authenticate();
      if (!authResult || (typeof authResult === 'object' && !authResult.success)) {
        const errorMsg = typeof authResult === 'object' ? authResult.message : 'Ошибка аутентификации';
        throw new Error(errorMsg);
      }

      // Получение данных
      const rawData = await GoogleSheetsService.getSheetData(url);
      const workoutPlan = GoogleSheetsService.parseWorkoutPlan(rawData);

      // Сохранение в контекст
      setGoogleSheetsUrl(url);
      setWorkoutPlan(workoutPlan);

      Alert.alert(
        'Успех!',
        'Таблица подключена успешно!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('WorkoutList'),
          },
        ]
      );
    } catch (error) {
      console.error('Ошибка подключения:', error);
      setError(error.message);
      Alert.alert('Ошибка', error.message);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.navigate('WorkoutList');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🏋️‍♂️ GymBro</Text>
        <Text style={styles.subtitle}>Подключите вашу таблицу тренировок</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ссылка на Google Sheets:</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            placeholderTextColor="#999"
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>📋 Инструкция:</Text>
          <Text style={styles.instructionText}>
            1. Создайте таблицу в Google Sheets{'\n'}
            2. Добавьте колонки: День, Упражнение, Подходы, Повторы, Видео{'\n'}
            3. Заполните данные тренировок{'\n'}
            4. Скопируйте ссылку и вставьте выше
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🔗 Подключить таблицу</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>⏭️ Пропустить</Text>
        </TouchableOpacity>

        {state.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {state.error}</Text>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2E8B57',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  instructions: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2E8B57',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#2E8B57',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2E8B57',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2E8B57',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
});
