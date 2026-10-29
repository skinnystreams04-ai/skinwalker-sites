(function () {
    'use strict';

    const subscriptions = new Map();

    function subscribe(name, url, callback, options) {
        if (subscriptions.has(name)) return;
        const settings = Object.assign({ fallbackMs: 300000, debounceMs: 250 }, options || {});
        let refreshTimer = null;
        let fallbackTimer = null;
        let source = null;

        function scheduleRefresh() {
            if (refreshTimer) return;
            refreshTimer = setTimeout(function () {
                refreshTimer = null;
                callback();
            }, settings.debounceMs);
        }

        function scheduleFallback() {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            fallbackTimer = setTimeout(function () {
                callback();
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
        subscriptions.set(name, { source: source });
    }

    window.SkinwalkerFirebaseStream = { subscribe: subscribe };
})();
