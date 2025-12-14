package in.helparo.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // After the bridge is initialized, configure the WebView for OAuth
        getBridge().getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Keep Google OAuth and Supabase auth in WebView
                if (url.contains("accounts.google.com") || 
                    url.contains("supabase.co") ||
                    url.contains("helparo.in")) {
                    // Load in WebView, don't open external browser
                    return false;
                }
                // For other URLs, use default behavior
                return super.shouldOverrideUrlLoading(view, url);
            }
        });
        
        // Enable JavaScript and DOM storage for OAuth
        WebSettings webSettings = getBridge().getWebView().getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
    }
}
