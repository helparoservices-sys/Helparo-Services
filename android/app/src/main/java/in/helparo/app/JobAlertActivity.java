package in.helparo.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.util.Timer;
import java.util.TimerTask;

/**
 * Full-screen Job Alert Activity
 * Shows on lock screen, over other apps
 * Like Rapido/Uber driver app
 */
public class JobAlertActivity extends AppCompatActivity {

    private Vibrator vibrator;
    private MediaPlayer mediaPlayer;
    private Timer soundTimer;
    private PowerManager.WakeLock wakeLock;
    
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
        
        // Wake up screen and show on lock screen
        wakeUpScreen();
        
        setContentView(R.layout.activity_job_alert);
        
        // Get job data from intent
        Intent intent = getIntent();
        jobId = intent.getStringExtra("jobId");
        jobTitle = intent.getStringExtra("title");
        jobDescription = intent.getStringExtra("description");
        jobPrice = intent.getStringExtra("price");
        jobLocation = intent.getStringExtra("location");
        customerName = intent.getStringExtra("customerName");
        
        // Set up UI
        setupUI();
        
        // Start alert effects
        startVibration();
        startAlertSound();
    }

    private void wakeUpScreen() {
        // Show on lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
        
        // Keep screen on
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Wake lock to turn on screen
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "helparo:jobalert"
            );
            wakeLock.acquire(60 * 1000L); // 60 seconds max
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
        if (titleView != null && jobTitle != null) {
            titleView.setText(jobTitle);
        }
        if (priceView != null && jobPrice != null) {
            priceView.setText("₹" + jobPrice);
        }
        if (locationView != null && jobLocation != null) {
            locationView.setText(jobLocation);
        }
        if (customerView != null && customerName != null) {
            customerView.setText(customerName);
        }
        if (descriptionView != null && jobDescription != null) {
            descriptionView.setText(jobDescription);
        }
        
        // Accept button
        if (acceptButton != null) {
            acceptButton.setOnClickListener(v -> {
                stopAlertEffects();
                // Open main app with job ID
                Intent mainIntent = new Intent(this, MainActivity.class);
                mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                mainIntent.putExtra("openJob", jobId);
                mainIntent.putExtra("action", "accept");
                startActivity(mainIntent);
                finish();
            });
        }
        
        // Reject button
        if (rejectButton != null) {
            rejectButton.setOnClickListener(v -> {
                stopAlertEffects();
                finish();
            });
        }
    }

    private void startVibration() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vibratorManager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            vibrator = vibratorManager.getDefaultVibrator();
        } else {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        }
        
        if (vibrator != null && vibrator.hasVibrator()) {
            // Long continuous vibration pattern: vibrate 500ms, pause 200ms, repeat
            long[] pattern = {0, 500, 200, 500, 200, 500, 200};
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)); // 0 = repeat from start
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }
    }

    private void startAlertSound() {
        try {
            // Get alarm sound
            Uri alertSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alertSound == null) {
                alertSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(this, alertSound);
            
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
            
            // Also set volume to max
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopAlertEffects() {
        // Stop vibration
        if (vibrator != null) {
            vibrator.cancel();
        }
        
        // Stop sound
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
            mediaPlayer = null;
        }
        
        // Stop timer
        if (soundTimer != null) {
            soundTimer.cancel();
            soundTimer = null;
        }
        
        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlertEffects();
    }

    @Override
    public void onBackPressed() {
        // Prevent back button from dismissing - user must Accept or Reject
    }
}
