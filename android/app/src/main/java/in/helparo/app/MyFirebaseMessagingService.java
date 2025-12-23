package in.helparo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Handles FCM push notifications for Helparo
 * 
 * For job alerts (Rapido-style):
 * - Uses high-priority notification with fullScreenIntent
 * - Android automatically shows the JobAlertActivity on lock screen
 * - Or shows heads-up notification if user is actively using phone
 * - Plays alarm sound and vibrates continuously
 * 
 * This approach works on Android 10+ where background activity starts are restricted.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "HelparoFCM";
    private static final String JOB_ALERT_CHANNEL = "job_alerts";
    private static final String DEFAULT_CHANNEL = "default";
    private static final int JOB_ALERT_NOTIFICATION_ID = 999;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "========================================");
        Log.d(TAG, "FCM Message Received!");
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        
        Map<String, String> data = remoteMessage.getData();
        Log.d(TAG, "Data payload: " + data.toString());
        
        // Check if this is a job notification
        String type = data.get("type");
        Log.d(TAG, "Message type: " + type);
        
        if ("new_job".equals(type) || "urgent_job".equals(type)) {
            Log.d(TAG, "🚨 JOB ALERT - Showing full screen notification");
            showJobAlertNotification(data);
        } else {
            Log.d(TAG, "📬 Regular notification");
            showRegularNotification(remoteMessage);
        }
        
        Log.d(TAG, "========================================");
    }

    /**
     * Shows a high-priority notification with full-screen intent for job alerts.
     * 
     * On Android 10+:
     * - If screen is OFF/LOCKED: Activity launches automatically (full screen)
     * - If screen is ON and user is using phone: Shows heads-up notification
     * 
     * The JobAlertActivity handles the sound and vibration when it opens.
     * We also trigger vibration here as backup.
     */
    private void showJobAlertNotification(Map<String, String> data) {
        // First, ensure notification channel exists
        createJobAlertChannel();
        
        // Wake up the device
        wakeUpDevice();
        
        // Start vibration immediately (activity will also vibrate)
        startVibration();
        
        // Extract job data
        String jobId = data.get("jobId");
        if (jobId == null) jobId = data.get("job_id");
        String title = data.get("title");
        String description = data.get("description");
        String price = data.get("price");
        String location = data.get("location");
        String customerName = data.get("customerName");
        if (customerName == null) customerName = data.get("customer_name");
        String urgency = data.get("urgency");
        
        if (title == null) title = "New Job Alert!";
        String body = "₹" + (price != null ? price : "0") + " • " + (location != null ? location : "Nearby");
        
        Log.d(TAG, "Job: " + title + " - " + body);
        
        // Create intent for JobAlertActivity
        Intent fullScreenIntent = new Intent(this, JobAlertActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                                  Intent.FLAG_ACTIVITY_CLEAR_TOP |
                                  Intent.FLAG_ACTIVITY_SINGLE_TOP |
                                  Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        fullScreenIntent.putExtra("jobId", jobId);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("description", description);
        fullScreenIntent.putExtra("price", price);
        fullScreenIntent.putExtra("location", location);
        fullScreenIntent.putExtra("customerName", customerName);
        fullScreenIntent.putExtra("urgency", urgency);
        
        // Use unique request code based on jobId to avoid PendingIntent collisions
        int requestCode = jobId != null ? jobId.hashCode() : (int) System.currentTimeMillis();
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            requestCode,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Content intent (when user taps notification)
        PendingIntent contentIntent = PendingIntent.getActivity(
            this,
            requestCode + 1,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Get alarm sound
        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmSound == null) {
            alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }
        
        // Build the notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, JOB_ALERT_CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🚨 " + title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText(body + "\n\n" + (description != null ? description : "Tap to view details"))
                .setBigContentTitle("🚨 NEW JOB ALERT"))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL) // Treat like incoming call
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(contentIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true) // KEY: This triggers the activity
            .setSound(alarmSound)
            .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000})
            .setLights(Color.RED, 500, 500)
            .setAutoCancel(false) // Don't auto-cancel - user must interact
            .setOngoing(true) // Can't be swiped away
            .setTimeoutAfter(60000); // Auto-dismiss after 60 seconds
        
        // Add action buttons directly on notification
        Intent acceptIntent = new Intent(this, MainActivity.class);
        acceptIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        acceptIntent.putExtra("openJob", jobId);
        acceptIntent.putExtra("action", "accept");
        PendingIntent acceptPendingIntent = PendingIntent.getActivity(this, requestCode + 2, acceptIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        Intent rejectIntent = new Intent(this, NotificationDismissReceiver.class);
        rejectIntent.putExtra("notificationId", JOB_ALERT_NOTIFICATION_ID);
        PendingIntent rejectPendingIntent = PendingIntent.getBroadcast(this, requestCode + 3, rejectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        builder.addAction(android.R.drawable.ic_menu_send, "✅ ACCEPT", acceptPendingIntent);
        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "❌ REJECT", rejectPendingIntent);
        
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            Log.d(TAG, "Showing notification with fullScreenIntent");
            notificationManager.notify(JOB_ALERT_NOTIFICATION_ID, builder.build());
        }
    }

    /**
     * Wake up the device screen
     */
    private void wakeUpDevice() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                boolean isScreenOn = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH
                    ? powerManager.isInteractive()
                    : powerManager.isScreenOn();
                
                Log.d(TAG, "Screen is currently: " + (isScreenOn ? "ON" : "OFF"));
                
                if (!isScreenOn) {
                    PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK |
                        PowerManager.ACQUIRE_CAUSES_WAKEUP |
                        PowerManager.ON_AFTER_RELEASE,
                        "helparo:jobalert"
                    );
                    wakeLock.acquire(30 * 1000L); // 30 seconds
                    Log.d(TAG, "WakeLock acquired to turn on screen");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error waking up device: " + e.getMessage());
        }
    }

    /**
     * Start vibration pattern for job alert
     */
    private void startVibration() {
        try {
            Vibrator vibrator;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vibratorManager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vibratorManager.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            
            if (vibrator != null && vibrator.hasVibrator()) {
                // Strong vibration pattern: vibrate 1s, pause 0.5s, repeat 3 times
                long[] pattern = {0, 1000, 500, 1000, 500, 1000, 500, 1000};
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1)); // -1 = don't repeat
                } else {
                    vibrator.vibrate(pattern, -1);
                }
                Log.d(TAG, "Vibration started");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting vibration: " + e.getMessage());
        }
    }

    /**
     * Create the job alert notification channel with high importance
     */
    private void createJobAlertChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager == null) return;
            
            // Delete old channel if exists (to apply new settings)
            notificationManager.deleteNotificationChannel(JOB_ALERT_CHANNEL);
            
            NotificationChannel channel = new NotificationChannel(
                JOB_ALERT_CHANNEL,
                "Job Alerts",
                NotificationManager.IMPORTANCE_HIGH // HIGH allows heads-up and sound
            );
            
            channel.setDescription("Urgent job notifications - shows on lock screen with sound and vibration");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
            channel.enableLights(true);
            channel.setLightColor(Color.RED);
            channel.setBypassDnd(true); // Bypass Do Not Disturb
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setShowBadge(true);
            
            // Set alarm sound
            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmSound != null) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                channel.setSound(alarmSound, audioAttributes);
            }
            
            notificationManager.createNotificationChannel(channel);
            Log.d(TAG, "Job alert notification channel created");
        }
    }

    /**
     * Show regular notification (non-job alerts)
     */
    private void showRegularNotification(RemoteMessage remoteMessage) {
        createDefaultChannel();
        
        String title = "Helparo";
        String body = "";
        
        // Try to get from notification payload first
        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }
        
        // Fall back to data payload
        if (title == null || title.isEmpty()) {
            title = remoteMessage.getData().get("title");
        }
        if (body == null || body.isEmpty()) {
            body = remoteMessage.getData().get("body");
        }
        if (body == null) body = "";
        
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, DEFAULT_CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);
        
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.notify((int) System.currentTimeMillis(), builder.build());
        }
    }

    /**
     * Create default notification channel
     */
    private void createDefaultChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                DEFAULT_CHANNEL,
                "General Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("General app notifications");
            
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
