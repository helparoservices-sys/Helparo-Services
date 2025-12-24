import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.helparo.app',
  appName: 'Helparo',
  webDir: 'out',
  
  // Load from production server (not local files)
  // This is correct for dynamic Next.js apps
  server: {
    url: 'https://helparo.in',
    cleartext: false,
  },
  
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
    webContentsDebuggingEnabled: false,
  },
  
  plugins: {
    StatusBar: {
      style: 'LIGHT',  // LIGHT = white icons on colored background
      backgroundColor: '#14B8A6',  // Teal to match header gradient
      overlaysWebView: false,  // CRITICAL: prevents status bar overlap
    },
    Geolocation: {
      enableHighAccuracy: true,
    },
    // Deep linking configuration for OAuth callbacks
    App: {
      appUrlOpen: {
        enabled: true,
      },
    },
  },
};

export default config;
