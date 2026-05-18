self.addEventListener('push', function (event) {
  var data = {};
  if (event.data) {
    data = event.data.json();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Shift OS', {
      body: data.body || 'You have a new update.',
      icon: '/api/icons/192',
      badge: '/api/icons/192',
      data: {
        url: data.url
      }
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  event.waitUntil(clients.openWindow(data.url || '/dashboard'));
});
