const CACHE_VERSION = "v5";
const CACHE_NAME = `gtc-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gtc-runtime-${CACHE_VERSION}`;

// ✅ Ressources essentielles à mettre en cache
const ESSENTIAL_RESOURCES = [
  "/",
  "/offline",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/manifest.webmanifest",
  "/fonts/"
];

// 🚫 Domaines et patterns à JAMAIS intercepter
const NEVER_CACHE_PATTERNS = [
  // APIs
  /\/api\//,
  
  // Services d'authentification
  /auth\//,
  /sign-in/,
  /sign-up/,
  
  // WebSockets et temps réel
  /socket/,
  /ws:/,
  /wss:/,
  
  // Analytics
  /analytics/,
  /gtag/,
  
  // Dev
  /_next\/webpack/,
  /_next\/static\/hmr/,
  
  // Service Worker lui-même
  /sw\.js$/,
];

// 📦 Patterns de ressources à mettre en cache
const CACHE_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:js|css|woff|woff2|ttf|png|jpg|jpeg|svg|ico|webp)$/i,
  /\/images\//,
  /\/fonts\//,
];

// Installation
self.addEventListener("install", (event) => {
  console.log("🔧 Installation Service Worker v5");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("📦 Mise en cache des ressources essentielles");
        return cache.addAll(ESSENTIAL_RESOURCES.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log("✅ Toutes les ressources sont en cache");
      })
      .catch(err => console.error("❌ Erreur installation SW:", err))
  );
});

// Activation
self.addEventListener("activate", (event) => {
  console.log("🎯 Activation Service Worker v5");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => 
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME && key !== RUNTIME_CACHE) {
              console.log("🗑️ Suppression ancien cache:", key);
              return caches.delete(key);
            }
          })
        )
      ),
      // Nettoyer les données périmées
      caches.open(CACHE_NAME).then(cache => 
        cache.keys().then(requests => 
          Promise.all(
            requests.map(request => {
              return cache.match(request).then(response => {
                if (!response || response.status === 404) {
                  console.log("🧹 Nettoyage ressource invalide:", request.url);
                  return cache.delete(request);
                }
              });
            })
          )
        )
      )
    ]).then(() => {
      console.log("✨ Service Worker prêt");
    })
  );
});

// Stratégie de fetch intelligente
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 🚫 Ne JAMAIS intercepter certains patterns
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    return; // Laisser passer directement
  }

  // 🚫 Ne jamais intercepter les méthodes non-GET
  if (request.method !== "GET") {
    return;
  }

  // Pour les pages de navigation, stratégie Network First
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Pour les ressources statiques, stratégie Cache First
  if (CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(handleStaticResource(request));
    return;
  }

  // Pour le reste, stratégie Network First
  event.respondWith(handleGenericRequest(request));
});

async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache si réussite
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone()).catch(err => 
        console.warn("⚠️ Erreur mise en cache navigation:", err)
      );
    }
    return networkResponse;
  } catch (error) {
    console.log("📴 Hors ligne - Recherche navigation en cache:", request.url);
    
    // Chercher en cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("✅ Navigation trouvée en cache:", request.url);
      return cachedResponse;
    }

    // Page offline
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response('Hors ligne - Contenu non disponible', { 
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function handleStaticResource(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Vérifier si le cache n'est pas trop vieux (1 semaine)
    const cacheDate = new Date(cachedResponse.headers.get('date') || Date.now());
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    if (cacheDate.getTime() > oneWeekAgo) {
      return cachedResponse;
    }
  }
  
  // Si pas en cache ou trop vieux, aller sur le réseau
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone()).catch(err => 
        console.warn("⚠️ Erreur mise en cache ressource:", err)
      );
    }
    return networkResponse;
  } catch (error) {
    // Retourner le cache même s'il est vieux plutôt que rien
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleGenericRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone()).catch(err => 
        console.warn("⚠️ Erreur mise en cache générique:", err)
      );
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 🔔 Notifications Push améliorées
self.addEventListener("push", (event) => {
  console.log("🔔 Notification push reçue");
  
  let notificationData;
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (err) {
    notificationData = { 
      title: "Games Trafics", 
      body: "Nouvelle notification",
      tag: "general"
    };
  }

  const options = {
    body: notificationData.body || "Vous avez une nouvelle notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    image: notificationData.image,
    data: { 
      url: notificationData.url || "/",
      timestamp: Date.now(),
      ...notificationData
    },
    tag: notificationData.tag || "general",
    requireInteraction: notificationData.persistent || false,
    actions: notificationData.actions || [],
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || "Games Trafics", 
      options
    )
  );
});

// 👆 Clic sur notification amélioré
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || "/";
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then(clientsArray => {
      // Chercher un onglet déjà ouvert sur l'URL
      const existingClient = clientsArray.find(client => 
        client.url === urlToOpen || 
        client.url.includes(new URL(urlToOpen).pathname)
      );
      
      if (existingClient) {
        existingClient.focus();
        return existingClient;
      }
      
      // Sinon ouvrir un nouvel onglet
      return clients.openWindow(urlToOpen);
    })
    .then(client => {
      // Envoyer un message à la page si besoin
      if (client && client.postMessage) {
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          data: notificationData
        });
      }
    })
  );
});

// 📱 Gestion des mises à jour
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "UPDATE_CACHE") {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.data.url)
          .then(response => {
            if (response.ok) {
              cache.put(event.data.url, response);
            }
          });
      })
    );
  }
});

// 📊 Background Sync (optionnel pour les données hors ligne)
self.addEventListener("sync", (event) => {
  if (event.tag === 'sync-data') {
    console.log("🔄 Synchronisation en arrière-plan");
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Implémentation de la synchro des données hors ligne
  console.log("🔄 Synchro des données hors ligne");
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === 'periodic-sync') {
    console.log("⏰ Synchro périodique");
    event.waitUntil(periodicSync());
  }
});

async function periodicSync() {
  // Implémentation de la synchro périodique
}
