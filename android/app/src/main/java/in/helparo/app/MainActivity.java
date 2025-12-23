package in.helparo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Create notification channels
    createNotificationChannels();
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
