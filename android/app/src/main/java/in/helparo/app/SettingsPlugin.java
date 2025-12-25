package in.helparo.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native Capacitor Plugin to open Android Settings directly
 * Used for job alert permission setup
 */
@CapacitorPlugin(name = "SettingsPlugin")
public class SettingsPlugin extends Plugin {

    /**
     * Open App Notification Settings
     * Takes user directly to the app's notification settings page
     */
    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            } else {
                intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
                intent.putExtra("app_package", getContext().getPackageName());
                intent.putExtra("app_uid", getContext().getApplicationInfo().uid);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open notification settings: " + e.getMessage());
        }
    }

    /**
     * Open Display Over Other Apps (Overlay) Settings
     * Takes user to the overlay permission settings for this app
     */
    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intent.setAction(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            } else {
                // Fallback for older devices
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open overlay settings: " + e.getMessage());
        }
    }

    /**
     * Open Battery Optimization Settings
     * Takes user to the battery optimization settings to exempt this app
     * Uses direct dialog first, falls back to battery settings list if that fails
     */
    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        try {
            Intent intent = new Intent();
            String packageName = getContext().getPackageName();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // First try to show direct "Allow" dialog for this app
                android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
                
                if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                    // Show the direct dialog to exempt this app
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    
                    try {
                        getContext().startActivity(intent);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        call.resolve(ret);
                        return;
                    } catch (Exception e) {
                        // Direct dialog failed, fall through to battery settings list
                        android.util.Log.w("SettingsPlugin", "Direct battery dialog failed, trying fallback: " + e.getMessage());
                    }
                }
                
                // Fallback: Open battery optimization settings list
                intent = new Intent();
                intent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } else {
                // For older devices, open app details
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + packageName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            android.util.Log.e("SettingsPlugin", "Failed to open battery settings: " + e.getMessage());
            call.reject("Failed to open battery settings: " + e.getMessage());
        }
    }

    /**
     * Open App Details Settings
     * Takes user to the general app info/settings page
     */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open app settings: " + e.getMessage());
        }
    }

    /**
     * Check if overlay permission is granted
     */
    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ret.put("granted", Settings.canDrawOverlays(getContext()));
        } else {
            ret.put("granted", true); // Older devices don't need this permission
        }
        call.resolve(ret);
    }

    /**
     * Check if battery optimization is disabled for this app
     */
    @PluginMethod
    public void isBatteryOptimizationDisabled(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
            if (pm != null) {
                ret.put("disabled", pm.isIgnoringBatteryOptimizations(getContext().getPackageName()));
            } else {
                ret.put("disabled", false);
            }
        } else {
            ret.put("disabled", true); // Older devices don't have battery optimization
        }
        call.resolve(ret);
    }
}
