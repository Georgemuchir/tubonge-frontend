package com.pinglo.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridges the incoming-call Intent extras (set by TubongeMessagingService's
 * full-screen notification, see that file's comment) back to the JS side.
 *
 * Two paths, since a singleTask activity behaves differently depending on
 * whether it already exists:
 *   - Cold start (app was fully closed): JS calls getPendingCall() once on
 *     boot to check "was I launched from a call notification?"
 *   - Already running (app was backgrounded): MainActivity.onNewIntent()
 *     fires instead of a fresh launch, so this emits an event instead.
 */
@CapacitorPlugin(name = "IncomingCall")
public class IncomingCallPlugin extends Plugin {

    @PluginMethod
    public void getPendingCall(PluginCall call) {
        Intent intent = getActivity().getIntent();
        JSObject result = extractCallData(intent);
        // Consumed — clear it so re-checking (e.g. on a later resume)
        // doesn't replay the same call.
        if (result != null) {
            intent.removeExtra("tubonge_incoming_call");
        }
        call.resolve(result != null ? result : new JSObject());
    }

    void onNewIntentReceived(Intent intent) {
        JSObject data = extractCallData(intent);
        if (data != null) {
            notifyListeners("incomingCall", data);
            intent.removeExtra("tubonge_incoming_call");
        }
    }

    private JSObject extractCallData(Intent intent) {
        if (intent == null || !intent.getBooleanExtra("tubonge_incoming_call", false)) {
            return null;
        }
        JSObject data = new JSObject();
        data.put("callerId", intent.getStringExtra("caller_id"));
        data.put("callerName", intent.getStringExtra("caller_name"));
        data.put("callType", intent.getStringExtra("call_type"));
        data.put("action", intent.getStringExtra("tubonge_call_action")); // "answer" | "decline" | null
        return data;
    }
}
