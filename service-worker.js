// ========================================
// ACOUSTIC DOPPLER TRAINER
// SERVICE WORKER
// Offline Cache
// ========================================

const CACHE_NAME =
    "acoustic-doppler-trainer-v1";


// ========================================
// FILES REQUIRED FOR OFFLINE USE
// ========================================

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./simulation.js",
    "./tactical.js",
    "./app.js",
    "./manifest.webmanifest"
];


// ========================================
// INSTALL
// Cache application files
// ========================================

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    function (cache) {

                        return cache.addAll(
                            APP_FILES
                        );
                    }
                )
        );

        self.skipWaiting();
    }
);


// ========================================
// ACTIVATE
// Remove old caches
// ========================================

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches
                .keys()
                .then(
                    function (cacheNames) {

                        return Promise.all(

                            cacheNames.map(
                                function (cacheName) {

                                    if (
                                        cacheName !==
                                        CACHE_NAME
                                    ) {

                                        return caches.delete(
                                            cacheName
                                        );
                                    }
                                }
                            )
                        );
                    }
                )
        );

        self.clients.claim();
    }
);


// ========================================
// FETCH
//
// Network first.
// If network unavailable,
// use cached version.
// ========================================

self.addEventListener(
    "fetch",
    function (event) {

        if (
            event.request.method !== "GET"
        ) {
            return;
        }


        event.respondWith(

            fetch(event.request)

                .then(
                    function (networkResponse) {

                        // Save newest version
                        const responseClone =
                            networkResponse.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(
                                function (cache) {

                                    cache.put(
                                        event.request,
                                        responseClone
                                    );
                                }
                            );

                        return networkResponse;
                    }
                )

                .catch(
                    function () {

                        return caches.match(
                            event.request
                        );
                    }
                )
        );
    }
);