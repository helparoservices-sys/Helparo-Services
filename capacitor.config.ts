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
    Geolocation: {
      enableHighAccuracy: true,
    },
    // Deep linking configuration for OAuth callbacks
    App: {
      appUrlOpen: {
        enabled: true,
      },
    },
    // SystemBars: NEW Capacitor 8.0+ plugin for edge-to-edge support
    SystemBars: {
      style: 'DARK',  // Dark text on light background  
      insetsHandling: 'css',  // Injects CSS variables for safe area
    },
  },
};

export default config;
