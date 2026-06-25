package de.derdruckpilot.starodyssey.tv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

public class MainActivity extends Activity {
    private static final String PREFS_NAME = "star_odyssey_tv";
    private static final String PREF_URL = "url";
    private static final String GITHUB_PAGES_URL = "https://derdruckpilot.github.io/Star-Odyssey/";
    private static final String LAN_PLACEHOLDER_URL = "http://192.168.178.20:5173/";

    private WebView webView;
    private LinearLayout controls;
    private Button toggleButton;
    private SharedPreferences preferences;
    private String currentUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        currentUrl = preferences.getString(PREF_URL, GITHUB_PAGES_URL);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        hideSystemUi();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        webView = new WebView(this);
        configureWebView(webView);
        root.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        controls = createControls();
        FrameLayout.LayoutParams controlsParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.RIGHT
        );
        controlsParams.setMargins(dp(12), dp(12), dp(12), dp(12));
        root.addView(controls, controlsParams);
        controls.setVisibility(View.GONE);

        toggleButton = createButton("TV");
        toggleButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                toggleControls();
            }
        });
        FrameLayout.LayoutParams toggleParams = new FrameLayout.LayoutParams(dp(54), dp(44), Gravity.TOP | Gravity.RIGHT);
        toggleParams.setMargins(dp(12), dp(12), dp(12), dp(12));
        root.addView(toggleButton, toggleParams);

        setContentView(root);
        loadCurrentUrl(false);

        if (!preferences.contains(PREF_URL)) {
            root.postDelayed(new Runnable() {
                @Override
                public void run() {
                    showUrlDialog();
                }
            }, 600);
        }
    }

    private void configureWebView(WebView view) {
        WebView.setWebContentsDebuggingEnabled(true);
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        view.addJavascriptInterface(new FireTvBridge(), "FireTvBridge");
        view.setWebViewClient(new WebViewClient());
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);
    }

    private class FireTvBridge {
        @JavascriptInterface
        public void closeApp() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    finish();
                }
            });
        }
    }

    private LinearLayout createControls() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.setGravity(Gravity.CENTER);
        layout.setPadding(dp(8), dp(8), dp(8), dp(8));
        layout.setBackground(createPanelBackground());

        Button reload = createButton("Reload");
        reload.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                loadCurrentUrl(false);
                hideControls();
            }
        });

        Button hardReload = createButton("Hard Reload");
        hardReload.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                webView.clearCache(true);
                webView.clearHistory();
                loadCurrentUrl(true);
                hideControls();
            }
        });

        Button url = createButton("URL / Modus");
        url.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showUrlDialog();
            }
        });

        Button close = createButton("Schließen");
        close.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finish();
            }
        });

        layout.addView(reload);
        layout.addView(hardReload);
        layout.addView(url);
        layout.addView(close);
        return layout;
    }

    private void showUrlDialog() {
        final EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setText(currentUrl.startsWith("http") ? currentUrl : LAN_PLACEHOLDER_URL);
        input.setSelectAllOnFocus(true);

        AlertDialog dialog = new AlertDialog.Builder(this)
            .setTitle("Star Odyssey URL")
            .setMessage("LAN-Beispiel: " + LAN_PLACEHOLDER_URL)
            .setView(input)
            .setPositiveButton("Speichern", null)
            .setNeutralButton("GitHub Pages", null)
            .setNegativeButton("Abbrechen", null)
            .create();

        dialog.setOnShowListener(dialogInterface -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    String nextUrl = input.getText().toString().trim();
                    if (!nextUrl.startsWith("http://") && !nextUrl.startsWith("https://")) {
                        input.setError("URL muss mit http:// oder https:// beginnen.");
                        return;
                    }
                    saveAndLoadUrl(nextUrl);
                    hideKeyboard(input);
                    dialog.dismiss();
                    hideControls();
                }
            });
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    saveAndLoadUrl(GITHUB_PAGES_URL);
                    hideKeyboard(input);
                    dialog.dismiss();
                    hideControls();
                }
            });
        });

        dialog.show();
    }

    private void saveAndLoadUrl(String url) {
        currentUrl = normalizeUrl(url);
        preferences.edit().putString(PREF_URL, currentUrl).apply();
        loadCurrentUrl(true);
    }

    private String normalizeUrl(String url) {
        if (url.endsWith("/")) return url;
        return url + "/";
    }

    private void loadCurrentUrl(boolean cacheBust) {
        webView.loadUrl(cacheBust ? withCacheBust(currentUrl) : currentUrl);
    }

    private String withCacheBust(String url) {
        String separator = url.contains("?") ? "&" : "?";
        return url + separator + "tvReload=" + System.currentTimeMillis();
    }

    private Button createButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setTextColor(Color.WHITE);
        button.setTextSize(14);
        button.setBackground(createButtonBackground());
        button.setPadding(dp(12), 0, dp(12), 0);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            dp(44)
        );
        params.setMargins(dp(4), 0, dp(4), 0);
        button.setLayoutParams(params);
        return button;
    }

    private GradientDrawable createPanelBackground() {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(Color.argb(232, 15, 23, 42));
        drawable.setStroke(dp(1), Color.argb(150, 148, 163, 184));
        drawable.setCornerRadius(dp(4));
        return drawable;
    }

    private GradientDrawable createButtonBackground() {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(Color.argb(210, 30, 41, 59));
        drawable.setStroke(dp(1), Color.argb(210, 250, 204, 21));
        drawable.setCornerRadius(dp(2));
        return drawable;
    }

    private void toggleControls() {
        controls.setVisibility(controls.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE);
    }

    private void hideControls() {
        controls.setVisibility(View.GONE);
    }

    private void hideKeyboard(View view) {
        InputMethodManager manager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (manager != null) {
            manager.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_UP && event.getKeyCode() == KeyEvent.KEYCODE_MENU) {
            toggleControls();
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (controls.getVisibility() == View.VISIBLE) {
            hideControls();
        } else if (webView.canGoBack()) {
            webView.goBack();
        } else {
            toggleControls();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }
}
