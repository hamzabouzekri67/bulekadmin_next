package bulekcapitaine.com;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // إنشاء قناة إشعارات مخصصة لأندرويد 8.0 فصاعداً
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String channelId = "fcm_fallback_notification_channel"; // هذا هو الـ channel_id الذي ستستخدمه
      CharSequence channelName = "Bulek Eats Notifications";
      int importance = NotificationManager.IMPORTANCE_HIGH;
      
      NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);
      channel.setDescription("قناة إشعارات مخصصة لتطبيق بولي إيتس");
      
      // ربط ملف الصوت المخصص بالـ Channel (تأكد أن اسم الملف مطابق بدون اللاحقة)
      Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/notfications");
      AudioAttributes audioAttributes = new AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_NOTIFICATION)
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .build();
      
      channel.setSound(soundUri, audioAttributes);
      channel.enableVibration(true);

      // تسجيل القناة في نظام أندرويد
      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      if (notificationManager != null) {
        notificationManager.createNotificationChannel(channel);
      }
    }
  }
}