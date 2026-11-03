// ws.js
const CACHE_VERSION = "v6";
const CACHE_NAME = `gtc-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gtc-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `gtc-images-${CACHE_VERSION}`;
const MAX_IMAGE_AGE = 14 * 24 * 60 * 60 * 1000; // 14 jours

const IMAGE_PATTERNS = [
  /\.(png|jpg|jpeg|webp|gif|avif)$/i,
  /\/uploads\//,
  /\/avatars\//,
  /\/covers\//,
  /\/clips\//,
  /firebasestorage\.googleapis\.com/,
  /res\.cloudinary\.com/,
];



// ✅ Ressources essentielles à mettre en cache
const ESSENTIAL_RESOURCES = [
  "/",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",

  // 🖼️ fallback image offline
  "/icons/offline.png",
  "/icons/gt-primary.png",

  // Fonts
  "/fonts/",
];


// 🚫 Domaines et patterns à JAMAIS intercepter
const NEVER_CACHE_PATTERNS = [
  // APIs
  /\/api\//,
  
  // Services d'authentification
  /auth\//,
  /sign-in/,
  /sign-up/,

  // 💰 Contextes financiers & transactions (JAMAIS mis en cache pour intégrité et confidentialité)
  /\/wallet(\/|\?|$)/i,
  /\/wallets(\/|\?|$)/i,
  /\/transactions(\/|\?|$)/i,
  /\/checkout(\/|\?|$)/i,
  /\/payments(\/|\?|$)/i,
  /\/shops\/[^\/]+\/dashboard\/wallet/i,
  /\/tournaments\/[^\/]+\/editions\/[^\/]+\/dashboard\/payments/i,
  /\/admin\/transactions/i,
  /\/admin\/wallets/i,



  
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
  /\/icons\//,
];

// Installation
self.addEventListener("install", (event) => {
  console.log("🔧 Installation Service Worker v6");
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
  console.log("🎯 Activation Service Worker v6");
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

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Vérifier l'âge
    const dateHeader = cached.headers.get("date");
    if (dateHeader) {
      const age = Date.now() - new Date(dateHeader).getTime();
      if (age < MAX_IMAGE_AGE) {
        return cached;
      }
    }
  }

  try {
    const networkResponse = await fetch(request, { mode: "cors" });

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Offline fallback
    if (cached) return cached;

    return caches.match("/icons/offline.png");
  }
}


// Stratégie de fetch intelligente
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // 🚫 Ne jamais intercepter les Server Actions
  if (request.headers.get('Next-Action') || request.headers.get('x-action')) {
    return;
  }

  // 🎮 Images → Cache First (style cached_network_image)
if (IMAGE_PATTERNS.some(pattern => pattern.test(request.url))) {
  event.respondWith(handleImageRequest(request));
  return;
}


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
  const navUrl = new URL(request.url);
  const isPrivateOrFinancial = /(wallet|transaction|payment|checkout|admin|auth|account|settings)/i.test(navUrl.pathname);
  try {
    const networkResponse = await fetch(request);
    
    // Mettre en cache si réussite
    if (networkResponse.ok && !isPrivateOrFinancial) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone()).catch(err => 
        console.warn("⚠️ Erreur mise en cache navigation:", err)
      );
    }
    return networkResponse;
  } catch (error) {
    console.log("📴 Hors ligne - Recherche navigation en cache:", request.url);
    
    // Si route financière ou privée, ne JAMAIS servir de cache obsolète
    if (isPrivateOrFinancial) {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) return offlineResponse;
      return new Response('Section sécurisée nécessitant une connexion internet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

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
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
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
  try {
    console.log("🔄 Synchronisation des données hors ligne en cours...");

    // Récupérer les requêtes en attente depuis IndexedDB ou localStorage
    const pendingRequests = await getPendingRequests();

    if (pendingRequests.length === 0) {
      console.log("✅ Aucune donnée en attente de synchronisation.");
      return;
    }

    console.log(`📤 ${pendingRequests.length} requêtes à synchroniser.`);

    // Traiter chaque requête en attente
    for (const request of pendingRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method || 'POST',
          headers: request.headers || { 'Content-Type': 'application/json' },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          console.log(`✅ Requête synchronisée: ${request.url}`);
          await removePendingRequest(request.id);
        } else {
          console.warn(`⚠️ Échec de la synchronisation: ${request.url}`, response.status);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la synchronisation de ${request.url}:`, error);
      }
    }

    // Notifier les clients de la fin de la synchronisation
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: pendingRequests.length,
      });
    });

    console.log("🔄 Synchronisation terminée.");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation hors ligne:", error);
  }
}

// Helper: Récupérer les requêtes en attente (Service Worker n'a pas accès à localStorage)
async function getPendingRequests() {
  return [];
}

// Helper: Supprimer une requête synchronisée
async function removePendingRequest(id) {
  // no-op en l'absence de file persistante
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === 'periodic-sync') {
    console.log("⏰ Synchro périodique");
    event.waitUntil(periodicSync());
  }
});

async function periodicSync() {
  try {
    console.log("⏰ Début de la synchronisation périodique");

    // 1. Nettoyer les caches d'images expirées
    const imageCache = await caches.open(IMAGE_CACHE);
    const imageRequests = await imageCache.keys();
    
    const now = Date.now();
    
    await Promise.all(
      imageRequests.map(async (request) => {
        const response = await imageCache.match(request);
        if (response) {
          const dateHeader = response.headers.get("date");
          if (dateHeader) {
            const age = now - new Date(dateHeader).getTime();
            if (age > MAX_IMAGE_AGE) {
              console.log("🗑️ Image expirée supprimée:", request.url);
              await imageCache.delete(request);
            }
          }
        }
      })
    );

    // 2. Mettre à jour les ressources essentielles
    const cache = await caches.open(CACHE_NAME);
    const essentialPromises = ESSENTIAL_RESOURCES.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          const cachedResponse = await cache.match(url);
          if (!cachedResponse) {
            console.log("📦 Mise en cache ressource essentielle manquante:", url);
            const fullResponse = await fetch(url);
            if (fullResponse.ok) {
              await cache.put(url, fullResponse);
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Impossible de vérifier la ressource:", url, error);
      }
    });

    await Promise.allSettled(essentialPromises);

    // 3. Nettoyer le cache runtime des entrées non utilisées depuis longtemps
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    const runtimeRequests = await runtimeCache.keys();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    await Promise.all(
      runtimeRequests.map(async (request) => {
        const response = await runtimeCache.match(request);
        if (response) {
          const dateHeader = response.headers.get("date");
          if (dateHeader && new Date(dateHeader).getTime() < oneMonthAgo) {
            console.log("🧹 Suppression entrée runtime obsolète:", request.url);
            await runtimeCache.delete(request);
          }
        }
      })
    );

    // 4. Précharger les ressources critiques pour la PWA
    const criticalResources = [
      "/offline",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/gt-primary.png",
    ];

    const preloadPromises = criticalResources.map(async (url) => {
      try {
        const cached = await cache.match(url);
        if (!cached) {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
            console.log("✅ Ressource critique préchargée:", url);
          }
        }
      } catch (error) {
        console.warn("⚠️ Échec préchargement:", url, error);
      }
    });

    await Promise.allSettled(preloadPromises);

    // 5. Envoyer un message aux clients pour informer de la fin
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC_COMPLETE',
        timestamp: now
      });
    });

    console.log("✅ Synchronisation périodique terminée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation périodique:", error);
  }
}
