# Environment Setup Guide

## Google OAuth Credentials

To use this application, you need to set up Google OAuth credentials.

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID credential
3. Copy your `Client ID` and `Client Secret`

### Setting up Credentials

Open `src/services/GoogleOAuthService.js` and replace the placeholder values:

```javascript
this.clientId = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
this.clientSecret = 'YOUR_CLIENT_SECRET_HERE';
```

With your actual credentials:

```javascript
this.clientId = 'your-actual-client-id.apps.googleusercontent.com';
this.clientSecret = 'your-actual-client-secret';
```

### Security Notes

⚠️ **Important Security Information:**
- The actual credentials have been removed from the codebase to comply with GitHub's secret scanning
- You need to add your own credentials before running the application
- Never commit files with real credentials to version control
- Consider creating your own OAuth application in Google Cloud Console

### Getting Your Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project or create a new one
3. Click "Create Credentials" → "OAuth client ID"
4. Choose "Web application" for web or "Mobile app" for mobile
5. Add your redirect URIs (e.g., `https://auth.expo.io/@batazor/gymbro`)
6. Copy the Client ID and Client Secret
7. Replace the placeholder values in the code
