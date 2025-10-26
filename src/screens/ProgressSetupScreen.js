import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Surface,
  Text,
  List,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgressSetupScreen({ navigation, route }) {
  const { sheetUrl } = route.params;

  const openSheet = async () => {
    if (sheetUrl) {
      try {
        const supported = await Linking.canOpenURL(sheetUrl);
        if (supported) {
          await Linking.openURL(sheetUrl);
        } else {
          Alert.alert('Ошибка', 'Не удается открыть ссылку на таблицу');
        }
      } catch (error) {
        Alert.alert('Ошибка', 'Не удается открыть ссылку на таблицу');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Заголовок */}
        <Surface style={styles.header} elevation={4}>
          <Title style={styles.title}>📊 Настройка листа "Прогресс"</Title>
          <Paragraph style={styles.subtitle}>
            Создайте лист для сохранения результатов тренировок
          </Paragraph>
        </Surface>

        {/* Инструкции */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📋 Пошаговая инструкция:</Title>
            
            <List.Item
              title="1. Откройте вашу таблицу"
              description="Нажмите кнопку ниже для открытия Google Sheets"
              left={props => <List.Icon {...props} icon="open-in-new" />}
            />
            
            <List.Item
              title="2. Создайте новый лист"
              description="Внизу таблицы нажмите '+' для создания нового листа"
              left={props => <List.Icon {...props} icon="plus" />}
            />
            
            <List.Item
              title="3. Переименуйте лист"
              description="Назовите лист 'Прогресс' (без кавычек)"
              left={props => <List.Icon {...props} icon="rename-box" />}
            />
            
            <List.Item
              title="4. Добавьте заголовки"
              description="В первую строку добавьте заголовки столбцов"
              left={props => <List.Icon {...props} icon="format-header-1" />}
            />
          </Card.Content>
        </Card>

        {/* Заголовки столбцов */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📝 Заголовки столбцов:</Title>
            <Paragraph style={styles.description}>
              Скопируйте и вставьте эти заголовки в первую строку листа "Прогресс":
            </Paragraph>
            
            <View style={styles.headersContainer}>
              <Text style={styles.headerText}>
                A: Дата{'\n'}
                B: Время{'\n'}
                C: Упражнение{'\n'}
                D: Группа мышц{'\n'}
                E: Подход{'\n'}
                F: Вес (кг){'\n'}
                G: Повторы{'\n'}
                H: Статус{'\n'}
                I: Заметки{'\n'}
                J: День недели
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Пример данных */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>📊 Пример данных:</Title>
            <Paragraph style={styles.description}>
              После настройки листа ваши результаты будут сохраняться в таком формате:
            </Paragraph>
            
            <View style={styles.exampleContainer}>
              <Text style={styles.exampleText}>
                01.12.2024 | 14:30 | Жим лежа | Грудь | 1 | 80 | 12 | ✅ | Отлично | Понедельник{'\n'}
                01.12.2024 | 14:35 | Жим лежа | Грудь | 2 | 80 | 10 | ✅ | Хорошо | Понедельник{'\n'}
                01.12.2024 | 14:40 | Жим лежа | Грудь | 3 | 75 | 12 | ✅ | Устал | Понедельник
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Важные замечания */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>⚠️ Важные замечания:</Title>
            
            <List.Item
              title="Публичный доступ"
              description="Таблица должна быть доступна для просмотра всем, у кого есть ссылка"
              left={props => <List.Icon {...props} icon="eye" />}
            />
            
            <List.Item
              title="Права редактирования"
              description="Для записи данных нужны права на редактирование таблицы"
              left={props => <List.Icon {...props} icon="pencil" />}
            />
            
            <List.Item
              title="Формат данных"
              description="Дата и время сохраняются автоматически при выполнении упражнений"
              left={props => <List.Icon {...props} icon="clock" />}
            />
          </Card.Content>
        </Card>

        {/* Кнопки действий */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={openSheet}
            style={styles.openButton}
            icon="open-in-new"
          >
            Открыть таблицу
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Назад к тренировке
          </Button>
        </View>
      </ScrollView>
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
  sectionTitle: {
    color: '#2E8B57',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  headersContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  headerText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  exampleContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  exampleText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  actionButtons: {
    marginTop: 16,
  },
  openButton: {
    marginBottom: 12,
  },
  backButton: {
    marginBottom: 16,
  },
});
