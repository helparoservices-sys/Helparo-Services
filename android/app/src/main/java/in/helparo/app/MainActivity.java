package in.helparo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Register custom plugins BEFORE super.onCreate
    registerPlugin(SettingsPlugin.class);
    
    super.onCreate(savedInstanceState);
    
    // CRITICAL: Force status bar configuration for light theme visibility
    configureStatusBar();
    
    // Create notification channels
    createNotificationChannels();
  }
  
  /**
   * Configure status bar to show dark icons on light background
   * This ensures status bar icons are VISIBLE in light theme
   */
  private void configureStatusBar() {
    Window window = getWindow();
    
    // Clear any translucent flags that might cause issues
    window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    
    // Add flag to draw behind status bar if needed
    window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
    
    // Set status bar color to TEAL (matches app header gradient)
    window.setStatusBarColor(Color.parseColor("#14B8A6"));
    
    // Use LIGHT status bar icons (white) on teal background
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      View decorView = window.getDecorView();
      int flags = decorView.getSystemUiVisibility();
      // REMOVE SYSTEM_UI_FLAG_LIGHT_STATUS_BAR for WHITE icons on teal
      flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      decorView.setSystemUiVisibility(flags);
    }
  }
  
  private void createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      
      // 1. Default channel for general notifications
      NotificationChannel defaultChannel = new NotificationChannel(
        "default",
        "General Notifications",
        NotificationManager.IMPORTANCE_DEFAULT
      );
      defaultChannel.setDescription("General app notifications");
      notificationManager.createNotificationChannel(defaultChannel);
      
      // 2. HIGH PRIORITY channel for urgent job alerts (like Rapido)
      NotificationChannel jobAlertChannel = new NotificationChannel(
        "job_alerts",
        "New Job Alerts",
        NotificationManager.IMPORTANCE_HIGH
      );
      jobAlertChannel.setDescription("Urgent alerts for new job requests");
      jobAlertChannel.enableVibration(true);
      jobAlertChannel.setVibrationPattern(new long[]{0, 500, 200, 500, 200, 500, 200, 500});
      jobAlertChannel.enableLights(true);
      jobAlertChannel.setLightColor(android.graphics.Color.GREEN);
      jobAlertChannel.setBypassDnd(true); // Bypass Do Not Disturb
      jobAlertChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
      
      // Set custom sound for job alerts
      Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/job_alert");
      AudioAttributes audioAttributes = new AudioAttributes.Builder()
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
        .build();
      jobAlertChannel.setSound(soundUri, audioAttributes);
      
      notificationManager.createNotificationChannel(jobAlertChannel);
      
      // 3. SOS Emergency channel
      NotificationChannel sosChannel = new NotificationChannel(
        "sos_alerts",
        "SOS Emergency Alerts",
        NotificationManager.IMPORTANCE_HIGH
      );
      sosChannel.setDescription("Emergency SOS alerts");
      sosChannel.enableVibration(true);
      sosChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
      sosChannel.setBypassDnd(true);
      notificationManager.createNotificationChannel(sosChannel);
    }
  }
}
