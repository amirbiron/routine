// Service Worker לתזכורות push
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "שגרה בחוסר שגרה";
  const options = {
    body: data.body || "הגיע הזמן!",
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    dir: "rtl",
    lang: "he",
    tag: data.tag || "routine-reminder",
    data: {
      url: data.url || "/",
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// לחיצה על ההתראה פותחת את האפליקציה
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // אם יש חלון פתוח — נתמקד בו
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // אחרת נפתח חלון חדש
      return clients.openWindow(url);
    })
  );
});
