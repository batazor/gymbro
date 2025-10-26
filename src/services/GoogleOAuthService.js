import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import StorageService from './StorageService';

// Завершаем auth session для WebBrowser
WebBrowser.maybeCompleteAuthSession();

class GoogleOAuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // OAuth2 конфигурация для Google
    // ⚠️ ВНИМАНИЕ: Замените эти значения на ваши реальные Google OAuth credentials
    // Получите их здесь: https://console.cloud.google.com/apis/credentials
    this.clientId = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
    this.clientSecret = 'YOUR_CLIENT_SECRET_HERE';
    // Используем стандартный redirect URI для Expo
    this.redirectUri = 'https://auth.expo.io/@batazor/gymbro';
    
    this.scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    // Discovery document для Google OAuth2
    this.discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };
  }

  // Создание запроса авторизации
  createAuthRequest() {
    return {
      clientId: this.clientId,
      scopes: this.scopes,
      redirectUri: this.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    };
  }

  // Обмен кода авторизации на токен
  async exchangeCodeForToken(authCode) {
    try {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token;
        this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        
        console.log('✅ OAuth2 токен получен успешно');
        return { success: true, token: tokenData };
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка получения токена:', errorText);
        
        // Пытаемся парсить JSON ошибку
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'access_denied') {
            return { 
              success: false, 
              error: 'access_denied',
              message: 'Пользователь отменил авторизацию',
              errorData 
            };
          }
          // Обработка ошибки верификации приложения
          if (errorData.error === 'access_denied' && errorText.includes('verification')) {
            return { 
              success: false, 
              error: 'verification_required',
              message: 'Приложение не прошло верификацию Google. Добавьте свой аккаунт в тестовые пользователи.',
              errorData,
              needsVerification: true
            };
          }
        } catch (parseError) {
          // Если не удалось парсить JSON, возвращаем текст ошибки
        }
        
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('❌ Ошибка обмена кода на токен:', error);
      return { success: false, error: error.message };
    }
  }

  // Проверка валидности токена
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) {
      return false;
    }
    
    // Проверяем, не истек ли токен (с запасом в 5 минут)
    return Date.now() < (this.tokenExpiry - 5 * 60 * 1000);
  }

  // Обновление токена
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Нет refresh token для обновления');
    }

    try {
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        
        this.accessToken = tokenData.access_token;
        this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        
        console.log('✅ Токен обновлен успешно');
        return { success: true, token: tokenData };
      } else {
        const error = await response.text();
        console.error('❌ Ошибка обновления токена:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Ошибка обновления токена:', error);
      return { success: false, error: error.message };
    }
  }

  // Получение валидного токена (с автообновлением)
  async getValidToken() {
    // Сначала проверяем токен в памяти
    if (this.isTokenValid()) {
      return this.accessToken;
    }

    // Если токен в памяти истек, пытаемся загрузить из хранилища
    if (!this.accessToken || !this.refreshToken) {
      const savedToken = await StorageService.getOAuthToken();
      if (savedToken.success && savedToken.token) {
        this.accessToken = savedToken.token.access_token;
        this.refreshToken = savedToken.token.refresh_token;
        this.tokenExpiry = Date.now() + (savedToken.token.expires_in * 1000);
        
        if (this.isTokenValid()) {
          console.log('✅ Используем токен из хранилища');
          return this.accessToken;
        }
      }
    }

    // Если есть refresh token, пытаемся обновить токен
    if (this.refreshToken) {
      console.log('🔄 Обновляем истекший токен...');
      const refreshResult = await this.refreshAccessToken();
      if (refreshResult.success) {
        // Сохраняем обновленный токен
        await StorageService.saveOAuthToken({
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_in: Math.floor((this.tokenExpiry - Date.now()) / 1000)
        });
        return this.accessToken;
      }
    }

    // Если ничего не помогло, требуется повторная авторизация
    throw new Error('Требуется повторная авторизация');
  }

  // Авторизация пользователя (с поддержкой веб-платформы)
  async authenticate() {
    try {
      console.log('🔐 Начинаем OAuth2 авторизацию...');
      
      // Для веб-платформы проверяем localStorage на наличие кода авторизации
      if (Platform.OS === 'web') {
        const authCode = localStorage.getItem('google_auth_code');
        const authTimestamp = localStorage.getItem('google_auth_timestamp');
        
        if (authCode && authTimestamp) {
          const timestamp = parseInt(authTimestamp);
          const now = Date.now();
          
          // Проверяем, что код не старше 5 минут
          if (now - timestamp < 5 * 60 * 1000) {
            console.log('🔄 Найден код авторизации в localStorage');
            
            // Очищаем localStorage
            localStorage.removeItem('google_auth_code');
            localStorage.removeItem('google_auth_timestamp');
            
            // Обмениваем код на токен
            const tokenResult = await this.exchangeCodeForToken(authCode);
            
            if (tokenResult.success) {
              await StorageService.saveOAuthToken(tokenResult.token);
              console.log('✅ Авторизация завершена успешно');
              return { success: true, message: 'Авторизация успешна' };
            } else {
              return {
                success: false,
                error: tokenResult.error,
                message: tokenResult.message,
                needsVerification: tokenResult.needsVerification
              };
            }
          } else {
            // Код устарел, очищаем localStorage
            localStorage.removeItem('google_auth_code');
            localStorage.removeItem('google_auth_timestamp');
          }
        }
      }
      
      // Сначала пытаемся получить валидный токен (с автообновлением)
      try {
        const validToken = await this.getValidToken();
        if (validToken) {
          console.log('✅ Используем валидный токен');
          return { success: true, message: 'Используем валидный токен' };
        }
      } catch (error) {
        console.log('⚠️ Не удалось получить валидный токен:', error.message);
      }
      
      // Если токен недействителен, выполняем полный OAuth flow
      console.log('🔄 Выполняем полный OAuth flow...');
      
      // Для веб-платформы используем локальный redirect URI
      let redirectUri;
      if (Platform.OS === 'web') {
        // Используем текущий домен для веб-платформы
        redirectUri = `${window.location.origin}/oauth-callback`;
      } else {
        // Для мобильных платформ используем стандартный Expo URI
        redirectUri = this.redirectUri;
      }
      
      const authUrl = `${this.discovery.authorizationEndpoint}?` +
        `client_id=${this.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(this.scopes.join(' '))}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      console.log('🔗 URL для авторизации:', authUrl);
      console.log('🔗 Redirect URI:', redirectUri);
      console.log('🌐 Платформа:', Platform.OS);
      
      // Для веб-платформы используем другой подход
      if (Platform.OS === 'web') {
        return await this.authenticateWeb(authUrl, redirectUri);
      }
      
      // Для мобильных платформ используем WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      console.log('📱 Результат авторизации:', result);
      
      if (result.type === 'success' && result.url) {
        // Извлекаем код авторизации из URL
        const url = new URL(result.url);
        const authCode = url.searchParams.get('code');
        
        if (authCode) {
          console.log('✅ Получен код авторизации');
          
          // Обмениваем код на токен
          const tokenResult = await this.exchangeCodeForToken(authCode);
          
          if (tokenResult.success) {
            // Сохраняем токен
            await StorageService.saveOAuthToken(tokenResult.token);
            console.log('✅ Авторизация завершена успешно');
            return { success: true, message: 'Авторизация успешна' };
          } else {
            // Ошибка обмена кода на токен
            return {
              success: false,
              error: tokenResult.error,
              message: tokenResult.message,
              needsVerification: tokenResult.needsVerification
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Не удалось получить код авторизации',
            error: 'no_auth_code'
          };
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        return { 
          success: false, 
          message: 'Авторизация отменена пользователем',
          error: 'access_denied'
        };
      } else {
        return { 
          success: false, 
          message: 'Неизвестная ошибка авторизации',
          error: 'unknown_error'
        };
      }
    } catch (error) {
      console.error('❌ Ошибка авторизации:', error);
      return { success: false, error: error.message };
    }
  }

  // Авторизация для веб-платформы (без window.closed)
  async authenticateWeb(authUrl, redirectUri) {
    try {
      console.log('🌐 Выполняем авторизацию для веб-платформы...');
      
      // Для веб-платформы используем redirect вместо popup
      // Это избегает проблем с CORS политиками
      return new Promise((resolve) => {
        // Создаем скрытую iframe для авторизации
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = authUrl;
        document.body.appendChild(iframe);
        
        // Слушаем сообщения от iframe
        const messageHandler = (event) => {
          // Проверяем origin для безопасности
          if (event.origin !== 'https://accounts.google.com' && 
              event.origin !== window.location.origin) {
            return;
          }
          
          if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.code) {
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            
            // Обмениваем код на токен
            this.exchangeCodeForToken(event.data.code).then(tokenResult => {
              if (tokenResult.success) {
                StorageService.saveOAuthToken(tokenResult.token).then(() => {
                  resolve({ success: true, message: 'Авторизация успешна' });
                });
              } else {
                resolve({
                  success: false,
                  error: tokenResult.error,
                  message: tokenResult.message,
                  needsVerification: tokenResult.needsVerification
                });
              }
            });
          } else if (event.data && event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            resolve({
              success: false,
              message: 'Ошибка авторизации',
              error: 'auth_error'
            });
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Альтернативный подход: используем window.location для redirect
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          
          // Если iframe не сработал, используем прямой redirect
          console.log('🔄 Используем прямой redirect для авторизации...');
          window.location.href = authUrl;
          
          resolve({
            success: false,
            message: 'Перенаправление на страницу авторизации',
            error: 'redirect_required',
            authUrl: authUrl
          });
        }, 2000); // Даем iframe 2 секунды
      });
    } catch (error) {
      console.error('❌ Ошибка веб-авторизации:', error);
      return { success: false, error: error.message };
    }
  }

  // Обработка кода авторизации (вызывается после ручной авторизации)
  async handleAuthCode(authCode) {
    try {
      console.log('🔄 Обрабатываем код авторизации...');
      
      const tokenResult = await this.exchangeCodeForToken(authCode);
      
      if (tokenResult.success) {
        // Сохраняем токен в локальное хранилище
        await StorageService.saveOAuthToken(tokenResult.token);
        
        console.log('✅ Авторизация завершена успешно');
        return { success: true, message: 'Авторизация успешна' };
      } else {
        // Возвращаем детальную информацию об ошибке
        return {
          success: false,
          error: tokenResult.error,
          message: tokenResult.message,
          needsVerification: tokenResult.needsVerification,
          errorData: tokenResult.errorData
        };
      }
    } catch (error) {
      console.error('❌ Ошибка обработки кода авторизации:', error);
      return { success: false, error: error.message };
    }
  }

  // Выход из системы
  async logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Очищаем токен из локального хранилища
    await StorageService.clearOAuthToken();
    
    console.log('👋 Выход из системы выполнен');
  }

  // Проверка статуса авторизации
  isAuthenticated() {
    return this.accessToken !== null;
  }
}

export default new GoogleOAuthService();