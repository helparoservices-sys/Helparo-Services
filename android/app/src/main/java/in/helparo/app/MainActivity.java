package in.helparo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Status bar is configured via capacitor.config.ts
    // No need to register plugin here - Capacitor 8.0 handles it automatically
  }
}
