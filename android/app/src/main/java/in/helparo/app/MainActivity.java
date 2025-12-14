package in.helparo.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.net.Uri;
import android.os.Build;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure the WebView for OAuth after bridge is initialized
        WebView webView = getBridge().getWebView();
        
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                return handleUrl(view, url);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(view, url);
            }
            
            private boolean handleUrl(WebView view, String url) {
                // Keep these domains in WebView (don't open external browser)
                if (url.contains("accounts.google.com") || 
                    url.contains("google.com/o/oauth") ||
                    url.contains("supabase.co") ||
                    url.contains("helparo.in") ||
                    url.contains("gstatic.com") ||
                    url.contains("googleapis.com")) {
                    // Return false = load in WebView
                    view.loadUrl(url);
                    return true;
                }
                // For other URLs, use default Capacitor behavior
                return false;
            }
        });
        
        // Configure WebView settings for OAuth
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setSupportMultipleWindows(false);
        
        // Enable third-party cookies for OAuth
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }
    }
}
