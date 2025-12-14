import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.helparo.app',
  appName: 'Helparo',
  webDir: 'out',
  
  // Server configuration for live updates
  // When you update your website, the app automatically gets updated!
  server: {
    // Use your live website URL for automatic updates
    url: 'https://helparo.in',
    // Clear cache on app start to get latest content
    cleartext: true,
    // Allow navigation to external URLs
    allowNavigation: ['*.helparo.in', '*.supabase.co', '*.googleapis.com', '*.cashfree.com']
  },

  // Android-specific configuration
  android: {
    // Allow mixed content (http + https)
    allowMixedContent: true,
    // Capture all links in the app
    captureAllLinks: true,
    // Use legacy bridge for better compatibility
    useLegacyBridge: false,
    // Minimum SDK version
    minWebViewVersion: 60,
    // Build options
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'helparo',
    },
    // Override user agent to identify as mobile app
    overrideUserAgent: 'Helparo Android App',
    // Background color while loading
    backgroundColor: '#00C3B4',
    // Enable WebView debugging in dev
    webContentsDebuggingEnabled: true,
  },

  // iOS-specific configuration (for future)
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#00C3B4',
  },

  // Plugin configurations
  plugins: {
    // Splash screen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#00C3B4',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status bar configuration
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00C3B4',
      overlaysWebView: false,
    },

    // Push notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // Geolocation
    Geolocation: {
      // Request high accuracy for helper tracking
    },
  },
};

export default config;
