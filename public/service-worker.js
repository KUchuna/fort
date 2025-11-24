importScripts("https://js.pusher.com/beams/service-worker.js");

PusherPushNotifications.onNotificationReceived = ({ pushEvent, payload }) => {
  const promise = clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then((windowClients) => {
      let isFocused = false;
      
      for (let client of windowClients) {
        if (client.focused) {
          isFocused = true;
          break;
        }
      }

      if (isFocused) {
        return Promise.resolve();
      }

      return pushEvent.waitUntil(
        self.registration.showNotification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon,
          data: payload.data
        })
      );
    });

  return promise;
};