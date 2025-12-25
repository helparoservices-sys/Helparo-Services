package in.helparo.app;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Full-screen Job Alert Activity - Rapido/Uber style
 * 
 * Shows on lock screen with:
 * - Continuous loud alarm sound
 * - Continuous vibration
 * - Accept/Reject buttons
 * 
 * The user MUST interact - cannot be dismissed by back button.
 */
public class JobAlertActivity extends AppCompatActivity {

    private static final String TAG = "JobAlertActivity";
    
    private Vibrator vibrator;
    private Ringtone ringtone;
    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private Handler handler;
    private Runnable vibrationRunnable;
    private boolean isAlertActive = true;
    
    // Job data
    private String jobId;
    private String jobTitle;
    private String jobDescription;
    private String jobPrice;
    private String jobLocation;
    private String customerName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "JobAlertActivity onCreate");
        
        // CRITICAL: Set up window flags BEFORE setContentView
        setupWindowForLockScreen();
        
        setContentView(R.layout.activity_job_alert);
        
        // Get job data from intent
        Intent intent = getIntent();
        jobId = intent.getStringExtra("jobId");
        jobTitle = intent.getStringExtra("title");
        jobDescription = intent.getStringExtra("description");
        jobPrice = intent.getStringExtra("price");
        jobLocation = intent.getStringExtra("location");
        customerName = intent.getStringExtra("customerName");
        
        Log.d(TAG, "Job: " + jobTitle + " - ₹" + jobPrice);
        
        // Set up UI
        setupUI();
        
        // Initialize handler for repeating tasks
        handler = new Handler(Looper.getMainLooper());
        
        // Start alert effects
        startContinuousVibration();
        startAlarmSound();
        
        // Cancel the notification since we're now showing the activity
        cancelNotification();
    }

    /**
     * Configure window to show on lock screen and wake up device
     */
    private void setupWindowForLockScreen() {
        Log.d(TAG, "Setting up window for lock screen display");
        
        // For Android O_MR1 (8.1) and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        }
        
        // Set window flags for all versions
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );
        
        // Acquire wake lock to ensure screen stays on
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "helparo:jobalert"
            );
            wakeLock.acquire(120 * 1000L); // 2 minutes max
            Log.d(TAG, "WakeLock acquired");
        }
    }

    private void setupUI() {
        // Find views
        TextView titleView = findViewById(R.id.alert_title);
        TextView priceView = findViewById(R.id.alert_price);
        TextView locationView = findViewById(R.id.alert_location);
        TextView customerView = findViewById(R.id.alert_customer);
        TextView descriptionView = findViewById(R.id.alert_description);
        Button acceptButton = findViewById(R.id.btn_accept);
        Button rejectButton = findViewById(R.id.btn_reject);
        
        // Set data
        if (titleView != null) {
            titleView.setText(jobTitle != null ? jobTitle : "New Job Alert!");
        }
        if (priceView != null) {
            priceView.setText("₹" + (jobPrice != null ? jobPrice : "0"));
        }
        if (locationView != null) {
            locationView.setText(jobLocation != null ? jobLocation : "Nearby");
        }
        if (customerView != null && customerName != null && !customerName.isEmpty()) {
            customerView.setText("Customer: " + customerName);
        }
        if (descriptionView != null && jobDescription != null) {
            descriptionView.setText(jobDescription);
        }
        
        // Accept button - opens app to show full details popup
        if (acceptButton != null) {
            acceptButton.setOnClickListener(v -> {
                Log.d(TAG, "View & Accept button clicked for job: " + jobId);
                stopAllAlerts();
                
                // Open main app - the web popup will show with full details
                Intent mainIntent = new Intent(this, MainActivity.class);
                mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                // Pass job ID so web app can highlight this job
                mainIntent.putExtra("jobId", jobId);
                startActivity(mainIntent);
                finish();
            });
        }
        
        // Reject button - just dismiss and go back
        if (rejectButton != null) {
            rejectButton.setOnClickListener(v -> {
                Log.d(TAG, "Reject button clicked - dismissing alert");
                stopAllAlerts();
                // Don't open app, just close this screen
                finish();
            });
        }
    }

    /**
     * Start continuous vibration that repeats until stopped
     */
    private void startContinuousVibration() {
        Log.d(TAG, "Starting continuous vibration");
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vibratorManager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vibratorManager.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }
            
            if (vibrator != null && vibrator.hasVibrator()) {
                // Vibration pattern: wait 0ms, vibrate 800ms, wait 400ms, vibrate 800ms...
                // Index 0 = repeat from beginning
                long[] pattern = {0, 800, 400, 800, 400, 800, 400};
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    VibrationEffect effect = VibrationEffect.createWaveform(pattern, 0);
                    vibrator.vibrate(effect);
                } else {
                    vibrator.vibrate(pattern, 0); // 0 = repeat from index 0
                }
                Log.d(TAG, "Vibration started successfully");
            } else {
                Log.w(TAG, "No vibrator available on this device");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting vibration: " + e.getMessage());
        }
    }

    /**
     * Start loud alarm sound that loops
     */
    private void startAlarmSound() {
        Log.d(TAG, "Starting alarm sound");
        
        try {
            // Set volume to maximum
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);
                Log.d(TAG, "Volume set to max: " + maxVolume);
            }
            
            // Get alarm sound URI
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            
            Log.d(TAG, "Using sound URI: " + alarmUri);
            
            // Use MediaPlayer for better control
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(this, alarmUri);
            
            // Set audio attributes for alarm
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                mediaPlayer.setAudioAttributes(audioAttributes);
            } else {
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            }
            
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
            
            Log.d(TAG, "Alarm sound started");
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting alarm sound: " + e.getMessage());
            
            // Fallback to Ringtone API
            try {
                Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                ringtone = RingtoneManager.getRingtone(this, uri);
                if (ringtone != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        ringtone.setLooping(true);
                    }
                    ringtone.play();
                    Log.d(TAG, "Fallback ringtone started");
                }
            } catch (Exception e2) {
                Log.e(TAG, "Fallback ringtone also failed: " + e2.getMessage());
            }
        }
    }

    /**
     * Cancel the notification that triggered this activity
     */
    private void cancelNotification() {
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(999); // Same ID used in FCM service
            Log.d(TAG, "Notification cancelled");
        }
    }

    /**
     * Stop all alert effects (sound, vibration, wake lock)
     */
    private void stopAllAlerts() {
        Log.d(TAG, "Stopping all alerts");
        isAlertActive = false;
        
        // Stop vibration
        if (vibrator != null) {
            vibrator.cancel();
            Log.d(TAG, "Vibration stopped");
        }
        
        // Stop MediaPlayer
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                Log.e(TAG, "Error stopping MediaPlayer: " + e.getMessage());
            }
            mediaPlayer = null;
        }
        
        // Stop Ringtone
        if (ringtone != null) {
            try {
                ringtone.stop();
            } catch (Exception e) {
                Log.e(TAG, "Error stopping ringtone: " + e.getMessage());
            }
            ringtone = null;
        }
        
        // Cancel handler callbacks
        if (handler != null && vibrationRunnable != null) {
            handler.removeCallbacks(vibrationRunnable);
        }
        
        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "WakeLock released");
        }
        
        // Cancel notification
        cancelNotification();
    }

    @Override
    protected void onDestroy() {
        Log.d(TAG, "onDestroy called");
        stopAllAlerts();
        super.onDestroy();
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Don't stop alerts on pause - user might have just locked screen
        Log.d(TAG, "onPause - alerts still active");
    }

    @Override
    public void onBackPressed() {
        // Prevent back button from dismissing - user MUST Accept or Reject
        Log.d(TAG, "Back button pressed - ignored");
    }
}
