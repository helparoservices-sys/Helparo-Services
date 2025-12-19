import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.helparo.app',
  appName: 'Helparo',
  webDir: 'out',
  
  server: {
    url: 'https://helparo.in',
    cleartext: false,
  },
  
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  
  plugins: {
    Geolocation: {
      enableHighAccuracy: true,
    },
  },
};

export default config;
