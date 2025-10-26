# 🔐 Настройка OAuth2 для Google Sheets

## 📋 Пошаговая инструкция:

### 1. Создание проекта в Google Cloud Console
1. Перейдите на https://console.cloud.google.com/
2. Создайте новый проект или выберите существующий
3. Назовите проект (например, "GymBro App")

### 2. Включение Google Sheets API
1. В левом меню: "APIs & Services" → "Library"
2. Найдите "Google Sheets API"
3. Нажмите "Enable"

### 3. Создание OAuth2 credentials
1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth client ID"
3. Выберите "Web application"
4. Назовите клиент (например, "GymBro Web Client")

### 4. Настройка redirect URI
1. В разделе "Authorized redirect URIs" добавьте:
   ```
   https://auth.expo.io/@batazor/gymbro
   ```
2. Сохраните изменения

### 5. Получение Client ID и Client Secret
1. Скопируйте "Client ID" и "Client Secret"
2. Откройте файл `src/services/GoogleOAuthService.js`
3. Замените значения:

```javascript
this.clientId = 'ВАШ_CLIENT_ID_ЗДЕСЬ';
// И в методе exchangeCodeForToken:
client_secret: 'ВАШ_CLIENT_SECRET_ЗДЕСЬ',
```

### 6. Настройка Expo
1. Откройте файл `app.json`
2. Добавьте схему для redirect:

```json
{
  "expo": {
    "scheme": "gymbro"
  }
}
```

## ⚠️ Важно:
- **Безопасность**: Не публикуйте Client Secret в открытом коде
- **Redirect URI**: Должен точно совпадать с настройками в Google Console
- **Права доступа**: Пользователь должен дать разрешение на доступ к Google Sheets

## 🚀 После настройки:
1. Запустите приложение
2. При первом сохранении откроется браузер для авторизации
3. Пользователь авторизуется через Google
4. Данные автоматически записываются в таблицу

## 🔧 Тестирование:
1. Дайте ссылку на таблицу с правами редактирования
2. Введите веса в приложении
3. Нажмите "Сохранить"
4. Пройдите авторизацию в браузере
5. Проверьте, что данные появились в таблице
