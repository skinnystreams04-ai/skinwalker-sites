(function () {
    'use strict';

    const clientId = 'gko3y2nhxg0ocvte0ru970pbau3eiq';
    const tokenKey = 'twitch_token';
    const legacyTokenKey = 'tw_token';
    const scopes = {
        auction: 'user:read:subscriptions user:write:chat user:read:follows',
        default: 'user:read:follows'
    };

    function getSiteId() {
        const path = window.location.pathname.toLowerCase();
        if (path.indexOf('/game') !== -1) return 'games';
        if (path.indexOf('/anime') !== -1) return 'anime';
        return 'auction';
    }

    function getRedirectUri() {
        const siteId = getSiteId();
        if (siteId === 'games') return 'https://skinnystreams04-ai.github.io/skinwalker-sites/game/';
        if (siteId === 'anime') return 'https://skinnystreams04-ai.github.io/skinwalker-sites/anime/';
        return 'https://skinnystreams04-ai.github.io/skinwalker-sites/auction/';
    }

    function getToken() {
        let token = localStorage.getItem(tokenKey);
        if (!token) {
            token = localStorage.getItem(legacyTokenKey);
            if (token) {
                localStorage.setItem(tokenKey, token);
                localStorage.removeItem(legacyTokenKey);
            }
        }
        if (token) {
            return token;
        }
        return null;
    }

    function saveToken(token) {
        if (!token) return;
        localStorage.setItem(tokenKey, token);
        localStorage.removeItem(legacyTokenKey);
    }

    function clearToken() {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(legacyTokenKey);
    }

    function consumeRedirectToken() {
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token=')) return getToken();
        const token = new URLSearchParams(hash.substring(1)).get('access_token');
        if (token) saveToken(token);
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        return token || getToken();
    }

    function login() {
        const siteId = getSiteId();
        const scope = scopes[siteId] || scopes.default;
        const authUrl = 'https://id.twitch.tv/oauth2/authorize?client_id=' +
            encodeURIComponent(clientId) +
            '&redirect_uri=' + encodeURIComponent(getRedirectUri()) +
            '&response_type=token&scope=' + encodeURIComponent(scope);
        window.location.href = authUrl;
    }

    function logout() {
        clearToken();
        window.location.reload();
    }

    async function api(path, options) {
        const token = getToken();
        if (!token) return null;
        const response = await fetch('https://api.twitch.tv/helix/' + path, Object.assign({}, options || {}, {
            headers: Object.assign({}, options && options.headers, {
                'Client-ID': clientId,
                'Authorization': 'Bearer ' + token
            })
        }));
        if (response.status === 401) {
            clearToken();
            return null;
        }
        return response;
    }

    async function getUser() {
        const response = await api('users');
        if (!response || !response.ok) return null;
        const json = await response.json();
        return json.data && json.data[0] ? json.data[0] : null;
    }

    window.SkinwalkerTwitch = {
        clientId: clientId,
        getToken: getToken,
        saveToken: saveToken,
        clearToken: clearToken,
        consumeRedirectToken: consumeRedirectToken,
        getRedirectUri: getRedirectUri,
        login: login,
        logout: logout,
        api: api,
        getUser: getUser
    };
})();
