import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.SHEET_URL_KEY = 'gymbro_sheet_url';
    this.OAUTH_TOKEN_KEY = 'gymbro_oauth_token';
    this.OAUTH_REFRESH_TOKEN_KEY = 'gymbro_oauth_refresh_token';
    this.OAUTH_TOKEN_EXPIRY_KEY = 'gymbro_oauth_token_expiry';
  }

  // Сохранение ссылки на таблицу
  async saveSheetUrl(url) {
    try {
      await AsyncStorage.setItem(this.SHEET_URL_KEY, url);
      console.log('✅ Ссылка на таблицу сохранена:', url);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка сохранения ссылки на таблицу:', error);
      return { success: false, error: error.message };
    }
  }

  // Получение ссылки на таблицу
  async getSheetUrl() {
    try {
      const url = await AsyncStorage.getItem(this.SHEET_URL_KEY);
      console.log('📋 Получена ссылка на таблицу:', url);
      return { success: true, url };
    } catch (error) {
      console.error('❌ Ошибка получения ссылки на таблицу:', error);
      return { success: false, error: error.message };
    }
  }

  // Сохранение OAuth токена
  async saveOAuthToken(tokenData) {
    try {
      await AsyncStorage.setItem(this.OAUTH_TOKEN_KEY, tokenData.access_token);
      await AsyncStorage.setItem(this.OAUTH_REFRESH_TOKEN_KEY, tokenData.refresh_token);
      await AsyncStorage.setItem(this.OAUTH_TOKEN_EXPIRY_KEY, tokenData.expires_in.toString());
      console.log('✅ OAuth токен сохранен');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка сохранения OAuth токена:', error);
      return { success: false, error: error.message };
    }
  }

  // Получение OAuth токена
  async getOAuthToken() {
    try {
      const accessToken = await AsyncStorage.getItem(this.OAUTH_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(this.OAUTH_REFRESH_TOKEN_KEY);
      const expiresIn = await AsyncStorage.getItem(this.OAUTH_TOKEN_EXPIRY_KEY);
      
      if (accessToken && refreshToken && expiresIn) {
        return {
          success: true,
          token: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: parseInt(expiresIn)
          }
        };
      }
      
      return { success: false, error: 'Токен не найден' };
    } catch (error) {
      console.error('❌ Ошибка получения OAuth токена:', error);
      return { success: false, error: error.message };
    }
  }

  // Очистка OAuth токена
  async clearOAuthToken() {
    try {
      await AsyncStorage.removeItem(this.OAUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(this.OAUTH_REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(this.OAUTH_TOKEN_EXPIRY_KEY);
      console.log('✅ OAuth токен очищен');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка очистки OAuth токена:', error);
      return { success: false, error: error.message };
    }
  }

  // Проверка наличия сохраненной ссылки на таблицу
  async hasSheetUrl() {
    try {
      const url = await AsyncStorage.getItem(this.SHEET_URL_KEY);
      return url !== null;
    } catch (error) {
      console.error('❌ Ошибка проверки ссылки на таблицу:', error);
      return false;
    }
  }

  // Проверка наличия OAuth токена
  async hasOAuthToken() {
    try {
      const accessToken = await AsyncStorage.getItem(this.OAUTH_TOKEN_KEY);
      return accessToken !== null;
    } catch (error) {
      console.error('❌ Ошибка проверки OAuth токена:', error);
      return false;
    }
  }

  // Получение всех сохраненных данных
  async getAllData() {
    try {
      const sheetUrl = await AsyncStorage.getItem(this.SHEET_URL_KEY);
      const accessToken = await AsyncStorage.getItem(this.OAUTH_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(this.OAUTH_REFRESH_TOKEN_KEY);
      const expiresIn = await AsyncStorage.getItem(this.OAUTH_TOKEN_EXPIRY_KEY);
      
      return {
        success: true,
        data: {
          sheetUrl,
          oauthToken: accessToken ? {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn ? parseInt(expiresIn) : null
          } : null
        }
      };
    } catch (error) {
      console.error('❌ Ошибка получения всех данных:', error);
      return { success: false, error: error.message };
    }
  }

  // Очистка всех данных
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(this.SHEET_URL_KEY);
      await AsyncStorage.removeItem(this.OAUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(this.OAUTH_REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(this.OAUTH_TOKEN_EXPIRY_KEY);
      console.log('✅ Все данные очищены');
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка очистки всех данных:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new StorageService();
