/**
 * Конфигурация для Google Sheets API
 * Замените на ваши реальные значения
 */

export const GOOGLE_CONFIG = {
  // iOS Client ID (получить в Google Cloud Console)
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  
  // Android Client ID (получить в Google Cloud Console)
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  
  // Web Client ID (для тестирования)
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  
  // Права доступа
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.readonly'
  ],
  
  // Дополнительные настройки
  additionalScopes: [],
  serviceConfiguration: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke'
  }
};

// Настройки для MVP
export const MVP_CONFIG = {
  // MVP режим: только чтение данных, без аутентификации
  mvpMode: true,
  
  // URL для тестирования (реальная таблица Виктора)
  testSheetUrl: 'https://docs.google.com/spreadsheets/d/1CJCkWz67TjV4NaFWXeDZZfFPUvpblxtB6c49Eg6FYRU/edit',
  
  // Включить логирование
  enableLogging: true,
  
  // Только чтение данных
  readOnly: true,
  
  // Локальное сохранение прогресса
  localProgressStorage: true
};

// Настройки приложения
export const APP_CONFIG = {
  // Название приложения
  appName: 'GymBro',
  
  // Версия
  version: '1.0.0',
  
  // Настройки кэширования
  cacheSettings: {
    // Время жизни кэша (в миллисекундах)
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 часа
    
    // Максимальный размер кэша
    maxCacheSize: 10 * 1024 * 1024 // 10MB
  },
  
  // Настройки синхронизации
  syncSettings: {
    // Интервал синхронизации (в миллисекундах)
    syncInterval: 5 * 60 * 1000, // 5 минут
    
    // Автоматическая синхронизация
    autoSync: true
  }
};

export default {
  GOOGLE_CONFIG,
  MVP_CONFIG,
  APP_CONFIG
};
