/* public/firebase-messaging-sw.js */

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyDhQzleEYaDfmFqgmNvGyjOAkB_knLx0QY",
  authDomain: "veni-eats.firebaseapp.com",
  projectId: "veni-eats",
  storageBucket: "veni-eats.appspot.com",
  messagingSenderId: "760966248764",
  appId: "1:760966248764:web:7382d50ee2a4764f9b4639",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  let parsedData = {};

  try {
    if (payload.data?.data) {
      parsedData = JSON.parse(payload.data.data);
    }
  } catch (e) {
    console.error("Error parsing payload data:", e);
  }

  const notificationTitle = parsedData.title || "إشعار جديد";
  const notificationOptions = {
    body: parsedData.content || "لديك رسالة جديدة",
    icon: "/logo.png", // تم تعديل المسار ليتوافق مع Next.js بشكل صحيح
    // هنا نمرر البيانات الإضافية مثل الرابط لكي نستخدمها عند النقر
    data: {
      url: parsedData.url || "https://new.bulekeats.com/dashboard",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- الجزء الجديد المسؤول عن فتح الموقع عند النقر ---
self.addEventListener("notificationclick", function (event) {
  // جلب الرابط المخزن في خيارات الإشعار (الذي وضعناه في الأعلى)
  const targetUrl =
    event.notification.data?.url || "https://new.bulekeats.com/dashboard";

  event.notification.close(); // إغلاق مربع الإشعار فوراً بعد الضغط

  // التحقق مما إذا كان الموقع مفتوحاً بالفعل في المتصفح
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          // إذا كان الموقع مفتوحاً، قم بالتركيز عليه وتحويله للرابط مباشرة بدل فتح تبويب جديد
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // إذا كان الموقع مغلقاً، افتح تبويب جديد بالرابط المستهدف
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
