// Capacitor native plugin utilities
// This file provides easy access to native features

import { Capacitor } from '@capacitor/core';

// Check if running in native app
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Check platform
export const getPlatform = (): 'android' | 'ios' | 'web' => {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};

// Check if plugin is available
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

// Initialize all native plugins
export async function initializeNativePlugins() {
  if (!isNativeApp()) return;

  try {
    // Initialize Status Bar
    if (isPluginAvailable('StatusBar')) {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#00C3B4' });
    }

    // Initialize Splash Screen
    if (isPluginAvailable('SplashScreen')) {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      // Hide splash screen after app is ready
      setTimeout(() => {
        SplashScreen.hide();
      }, 1500);
    }

    // Initialize App plugin for back button handling and deep links
    if (isPluginAvailable('App')) {
      const { App } = await import('@capacitor/app');
      
      // Handle hardware back button on Android
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          // Show exit confirmation or minimize app
          App.minimizeApp();
        }
      });

      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active:', isActive);
        
        // When app becomes active again (returning from browser), check auth
        if (isActive) {
          checkAuthAfterOAuth();
        }
      });

      // Handle deep links (e.g., helparo://auth/callback)
      App.addListener('appUrlOpen', ({ url }) => {
        console.log('App opened with URL:', url);
        handleDeepLink(url);
      });
    }

    // Initialize Keyboard plugin
    if (isPluginAvailable('Keyboard')) {
      const { Keyboard } = await import('@capacitor/keyboard');
      
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.setProperty('--keyboard-height', '0px');
      });
    }

    // Initialize Network plugin
    if (isPluginAvailable('Network')) {
      const { Network } = await import('@capacitor/network');
      
      Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
        // You can dispatch a global event or update store
        if (!status.connected) {
          // Show offline notification
          window.dispatchEvent(new CustomEvent('offline'));
        } else {
          window.dispatchEvent(new CustomEvent('online'));
        }
      });
    }

    console.log('Native plugins initialized successfully');
  } catch (error) {
    console.error('Error initializing native plugins:', error);
  }
}

// Haptic feedback utilities
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!isNativeApp() || !isPluginAvailable('Haptics')) return;
  
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }[style];
    await Haptics.impact({ style: impactStyle });
  } catch (error) {
    console.error('Haptic feedback error:', error);
  }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!isNativeApp() || !isPluginAvailable('Haptics')) return;
  
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    const notificationType = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    }[type];
    await Haptics.notification({ type: notificationType });
  } catch (error) {
    console.error('Haptic notification error:', error);
  }
}

// Push notification utilities
export async function requestPushPermissions(): Promise<boolean> {
  if (!isNativeApp() || !isPluginAvailable('PushNotifications')) return false;
  
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const result = await PushNotifications.requestPermissions();
    
    if (result.receive === 'granted') {
      await PushNotifications.register();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Push permission error:', error);
    return false;
  }
}

export async function getPushToken(): Promise<string | null> {
  if (!isNativeApp() || !isPluginAvailable('PushNotifications')) return null;
  
  return new Promise((resolve) => {
    import('@capacitor/push-notifications').then(({ PushNotifications }) => {
      PushNotifications.addListener('registration', (token) => {
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });
    });
  });
}

// Geolocation utilities
export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  if (!isNativeApp() || !isPluginAvailable('Geolocation')) {
    // Fall back to web geolocation
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  }
  
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return null;
  }
}

// Camera utilities
export async function takePhoto(): Promise<string | null> {
  if (!isNativeApp() || !isPluginAvailable('Camera')) return null;
  
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
    });
    return photo.webPath || null;
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
}

export async function pickPhoto(): Promise<string | null> {
  if (!isNativeApp() || !isPluginAvailable('Camera')) return null;
  
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
      quality: 90,
    });
    return photo.webPath || null;
  } catch (error) {
    console.error('Photo picker error:', error);
    return null;
  }
}

// Open external URLs in browser
export async function openExternalUrl(url: string) {
  if (!isNativeApp() || !isPluginAvailable('Browser')) {
    window.open(url, '_blank');
    return;
  }
  
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch (error) {
    console.error('Browser error:', error);
    window.open(url, '_blank');
  }
}

// Handle deep links from OAuth redirects
export function handleDeepLink(url: string) {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    
    // Handle auth callback
    if (path.includes('/auth/callback')) {
      // The WebView should handle this automatically since we're loading from helparo.in
      // But if using custom scheme, navigate to the callback
      const code = parsedUrl.searchParams.get('code');
      if (code) {
        window.location.href = `/auth/callback?code=${code}`;
      }
    }
    
    // Handle other deep links
    if (path.startsWith('/customer/') || path.startsWith('/helper/')) {
      window.location.href = path;
    }
  } catch (error) {
    console.error('Deep link handling error:', error);
  }
}

// Check auth status when returning from OAuth browser
export async function checkAuthAfterOAuth() {
  try {
    // Dynamic import to avoid SSR issues
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: session } = await supabase.auth.getSession();
    
    if (session?.session) {
      // User is logged in, close any open browser
      if (isPluginAvailable('Browser')) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
      }
      
      // Redirect based on role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.session.user.id)
        .single();
      
      const role = profile?.role || 'customer';
      const currentPath = window.location.pathname;
      
      // Only redirect if on auth pages
      if (currentPath.includes('/auth/') || currentPath === '/') {
        window.location.href = `/${role}/dashboard`;
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}
