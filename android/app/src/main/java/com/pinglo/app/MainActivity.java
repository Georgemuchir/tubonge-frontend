package com.pinglo.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(IncomingCallPlugin.class);
        super.onCreate(savedInstanceState);
        // Manifest showWhenLocked/turnScreenOn cover most cases, but the
        // programmatic calls (API 27+) are what actually let an incoming
        // call notification's full-screen intent reliably show this
        // activity over the lock screen on some OEM builds that ignore the
        // manifest attributes alone.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // singleTask launchMode means a call notification tapped while the
        // app is already running (backgrounded, not killed) lands here
        // instead of a fresh onCreate() — forward it to the plugin so JS
        // still finds out about it.
        PluginHandle handle = getBridge().getPlugin("IncomingCall");
        if (handle != null) {
            Object instance = handle.getInstance();
            if (instance instanceof IncomingCallPlugin) {
                ((IncomingCallPlugin) instance).onNewIntentReceived(intent);
            }
        }
    }
}
