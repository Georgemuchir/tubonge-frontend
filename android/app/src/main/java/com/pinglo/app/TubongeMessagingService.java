package com.pinglo.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Handles FCM messages natively so incoming calls can show a real,
 * full-screen ringing UI even when the app is fully closed — a plain
 * Capacitor push-notification listener only fires while JS is running,
 * which defeats the point (the whole reason this exists is for when it
 * isn't). The backend only sends a push at all when it already knows the
 * recipient's socket isn't connected (see app/utils/push.py), so this
 * service can assume "the app isn't already showing this via the live
 * socket connection" and always act on what it's given.
 *
 * Two message "type" values are handled, set by the backend's payload:
 *   "call"    -> CallStyle notification with a full-screen intent, so it
 *                rings over the lock screen like a real phone call.
 *   "message" -> a normal notification.
 * Anything else is ignored.
 */
public class TubongeMessagingService extends FirebaseMessagingService {
    private static final String CALL_CHANNEL_ID = "tubonge_calls";
    private static final String MESSAGE_CHANNEL_ID = "tubonge_messages";
    public static final String PREFS = "tubonge_push";
    public static final String PREF_TOKEN = "fcm_token";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Stashed locally; the JS side pulls this once after login (via the
        // TubongeNotifications plugin) and registers it with the backend
        // using the already-authenticated API client, rather than this
        // service trying to make its own authenticated HTTP call.
        SharedPreferences prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(PREF_TOKEN, token).apply();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);
        Map<String, String> data = message.getData();
        String type = data.get("type");
        if (type == null) return;

        ensureChannels();

        if ("call".equals(type)) {
            showIncomingCall(data);
        } else if ("message".equals(type)) {
            showMessageNotification(data);
        }
    }

    private void ensureChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel callChannel = new NotificationChannel(
                CALL_CHANNEL_ID, "Incoming calls", NotificationManager.IMPORTANCE_HIGH);
        callChannel.setDescription("Ringing for incoming Tubonge calls");
        callChannel.enableVibration(true);
        callChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
        callChannel.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                new android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
        nm.createNotificationChannel(callChannel);

        NotificationChannel messageChannel = new NotificationChannel(
                MESSAGE_CHANNEL_ID, "Messages", NotificationManager.IMPORTANCE_DEFAULT);
        messageChannel.setDescription("New Tubonge messages");
        nm.createNotificationChannel(messageChannel);
    }

    private void showIncomingCall(Map<String, String> data) {
        String callerName = data.getOrDefault("caller_name", "Someone");
        String callerId = data.get("caller_id");
        String callType = data.getOrDefault("call_type", "video");

        // Launches straight into the app's existing React incoming-call UI
        // via a deep link — CallManager.jsx already has this UI built for
        // the socket-connected case, this just needs to reach the same
        // screen from a cold start.
        Intent fullScreenIntent = new Intent(this, MainActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        fullScreenIntent.putExtra("tubonge_incoming_call", true);
        fullScreenIntent.putExtra("caller_id", callerId);
        fullScreenIntent.putExtra("caller_name", callerName);
        fullScreenIntent.putExtra("call_type", callType);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this, callerId != null ? callerId.hashCode() : 0, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CALL_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.sym_call_incoming)
                .setContentTitle(callerName)
                .setContentText("video".equals(callType) ? "Incoming video call" : "Incoming call")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setAutoCancel(true)
                .setOngoing(true)
                .setColor(Color.parseColor("#7c3aed"));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // CallStyle gives the real full-width answer/decline call UI —
            // only available API 31+; older versions still get the
            // full-screen intent above, just with a standard notification
            // layout instead of the dedicated call one.
            Person caller = new Person.Builder().setName(callerName).build();
            builder.setStyle(NotificationCompat.CallStyle.forIncomingCall(
                    caller, declineIntent(callerId), answerIntent(callerId, callType)));
        }

        androidx.core.app.NotificationManagerCompat.from(this)
                .notify(callerId != null ? callerId.hashCode() : 1001, builder.build());
    }

    private PendingIntent answerIntent(String callerId, String callType) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("tubonge_incoming_call", true);
        intent.putExtra("caller_id", callerId);
        intent.putExtra("call_type", callType);
        intent.putExtra("tubonge_call_action", "answer");
        return PendingIntent.getActivity(this, (callerId + "answer").hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent declineIntent(String callerId) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("tubonge_incoming_call", true);
        intent.putExtra("caller_id", callerId);
        intent.putExtra("tubonge_call_action", "decline");
        return PendingIntent.getActivity(this, (callerId + "decline").hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void showMessageNotification(Map<String, String> data) {
        String senderName = data.getOrDefault("sender_name", "Someone");
        String body = data.getOrDefault("preview", "Sent you a message");
        String senderId = data.get("sender_id");

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("tubonge_open_conversation", senderId);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, senderId != null ? senderId.hashCode() : 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, MESSAGE_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_email)
                .setContentTitle(senderName)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setColor(Color.parseColor("#7c3aed"));

        androidx.core.app.NotificationManagerCompat.from(this)
                .notify(senderId != null ? senderId.hashCode() : 2001, builder.build());
    }
}
