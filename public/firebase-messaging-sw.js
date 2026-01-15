/* public/firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

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
    icon: "./logo.png",
    }

    //console.log(parsedData);
    
   self.registration.showNotification(notificationTitle, notificationOptions);
});
