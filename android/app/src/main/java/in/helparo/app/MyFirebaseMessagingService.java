package in.helparo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Handles FCM push notifications
 * Launches full-screen JobAlertActivity for job notifications
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String JOB_ALERT_CHANNEL = "job_alerts";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "FCM message received from: " + remoteMessage.getFrom());
        
        Map<String, String> data = remoteMessage.getData();
        
        // Check if this is a job notification
        String type = data.get("type");
        if ("new_job".equals(type) || "urgent_job".equals(type)) {
            Log.d(TAG, "Job notification detected - launching full screen alert");
            launchJobAlert(data);
        } else {
            // Regular notification - show as normal
            showRegularNotification(remoteMessage);
        }
    }

    private void launchJobAlert(Map<String, String> data) {
        // Wake up the device
        wakeUpDevice();
        
        // Create intent for JobAlertActivity
        Intent intent = new Intent(getApplicationContext(), JobAlertActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                       Intent.FLAG_ACTIVITY_CLEAR_TOP |
                       Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        // Pass job data
        intent.putExtra("jobId", data.get("jobId"));
        intent.putExtra("title", data.get("title"));
        intent.putExtra("description", data.get("description"));
        intent.putExtra("price", data.get("price"));
        intent.putExtra("location", data.get("location"));
        intent.putExtra("customerName", data.get("customerName"));
        intent.putExtra("urgency", data.get("urgency"));
        
        // Start the activity
        startActivity(intent);
        
        // Also show a notification as backup
        showJobNotification(data);
    }

    private void wakeUpDevice() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "helparo:fcmwakeup"
            );
            wakeLock.acquire(10 * 1000L); // 10 seconds
        }
    }

    private void showJobNotification(Map<String, String> data) {
        String title = data.get("title");
        String price = data.get("price");
        String location = data.get("location");
        String jobId = data.get("jobId");
        
        if (title == null) title = "New Job Alert!";
        String body = "₹" + (price != null ? price : "0") + " • " + (location != null ? location : "");
        
        // Create notification channel
        createNotificationChannel();
        
        // Intent for when notification is tapped
        Intent intent = new Intent(getApplicationContext(), JobAlertActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("jobId", jobId);
        intent.putExtra("title", data.get("title"));
        intent.putExtra("description", data.get("description"));
        intent.putExtra("price", price);
        intent.putExtra("location", location);
        intent.putExtra("customerName", data.get("customerName"));
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            getApplicationContext(), 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Full screen intent for lock screen
        PendingIntent fullScreenIntent = PendingIntent.getActivity(
            getApplicationContext(), 1, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Build notification
        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getApplicationContext(), JOB_ALERT_CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🚨 " + title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setFullScreenIntent(fullScreenIntent, true)  // Shows on lock screen
            .setSound(alarmSound)
            .setVibrate(new long[]{0, 500, 200, 500, 200, 500})
            .setOngoing(true);  // Can't be swiped away
        
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.notify(jobId != null ? jobId.hashCode() : 1, builder.build());
        }
    }

    private void showRegularNotification(RemoteMessage remoteMessage) {
        String title = "Helparo";
        String body = "";
        
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }
        
        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            getApplicationContext(), 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(getApplicationContext(), "default")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);
        
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.notify(0, builder.build());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                JOB_ALERT_CHANNEL,
                "Job Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Urgent job notifications with full screen alerts");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500, 200, 500});
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            
            // Set alarm sound
            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            channel.setSound(alarmSound, audioAttributes);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "FCM Token refreshed: " + token);
        // Token will be picked up by Capacitor Push Notifications plugin
    }
}
