(function () {
    'use strict';

    const subscriptions = new Map();

    function subscribe(name, url, callback, options) {
        if (subscriptions.has(name)) return;
        const settings = Object.assign({ fallbackMs: 300000, debounceMs: 250 }, options || {});
        let refreshTimer = null;
        let fallbackTimer = null;
        let source = null;
        let callbackRunning = false;
        let callbackPending = false;

        function runCallback() {
            if (callbackRunning) {
                callbackPending = true;
                return;
            }
            callbackRunning = true;
            Promise.resolve(callback()).finally(function () {
                callbackRunning = false;
                if (callbackPending) {
                    callbackPending = false;
                    runCallback();
                }
            });
        }

        function scheduleRefresh() {
            if (refreshTimer) return;
            refreshTimer = setTimeout(function () {
                refreshTimer = null;
                runCallback();
            }, settings.debounceMs);
        }

        function scheduleFallback() {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            fallbackTimer = setTimeout(function () {
                runCallback();
                scheduleFallback();
            }, settings.fallbackMs);
        }

        if (typeof EventSource !== 'undefined') {
            source = new EventSource(url);
            source.addEventListener('put', scheduleRefresh);
            source.addEventListener('patch', scheduleRefresh);
            source.addEventListener('cancel', function () {
                console.error('Firebase stream cancelled:', name);
                scheduleRefresh();
            });
            source.onerror = function () {
                console.error('Firebase stream disconnected:', name);
            };
        }

        scheduleFallback();
        subscriptions.set(name, {
            source: source,
            close: function () {
                if (refreshTimer) clearTimeout(refreshTimer);
                if (fallbackTimer) clearTimeout(fallbackTimer);
                if (source) source.close();
            }
        });
    }

    window.addEventListener('pagehide', function () {
        subscriptions.forEach(function (subscription) {
            subscription.close();
        });
        subscriptions.clear();
    });

    window.SkinwalkerFirebaseStream = { subscribe: subscribe };
})();
