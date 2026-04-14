self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Serenity Diary';
  const options = {
    body: data.body || 'Hai un nuovo ricordo da scoprire!',
    icon: '/manifest.json',
    badge: '/manifest.json'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
