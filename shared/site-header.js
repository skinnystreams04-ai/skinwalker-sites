(function () {
    'use strict';

    const sites = [
        {
            id: 'auction',
            title: 'Skinwalker Аукцион',
            shortTitle: 'Аукцион',
            url: '../auction/',
            color: '#b8a87b'
        },
        {
            id: 'games',
            title: 'Skinwalker Игры',
            shortTitle: 'Игры',
            url: '../game/',
            color: '#ffd700'
        },
        {
            id: 'anime',
            title: 'Skinwalker Аниме',
            shortTitle: 'Аниме',
            url: '../anime/',
            color: '#a6e3a1'
        }
    ];

    function normalizePath(path) {
        return path.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
    }

    function getCurrentSite() {
        const path = normalizePath(window.location.pathname).toLowerCase();
        if (path.indexOf('/game') !== -1) return sites[1];
        if (path.indexOf('/anime') !== -1) return sites[2];
        return sites.find(function (site) {
            const sitePath = normalizePath(new URL(site.url, window.location.origin).pathname);
            return path === sitePath || path.indexOf(sitePath + '/') === 0 ||
                (site.id === 'auction' && path.endsWith('/auction'));
        }) || sites[0];
    }

    function createSiteSwitcher(currentSite) {
        const switcher = document.createElement('div');
        switcher.className = 'shared-site-switcher';
        switcher.innerHTML = '<div class="shared-site-title" tabindex="0" aria-haspopup="true" aria-expanded="false">' +
            escapeHtml(currentSite.title) +
            '<span class="shared-site-arrow" aria-hidden="true">▼</span></div>' +
            '<div class="shared-site-menu" role="menu"></div>';

        const menu = switcher.querySelector('.shared-site-menu');
        sites.forEach(function (site) {
            const link = document.createElement('a');
            link.className = 'shared-site-link' + (site.id === currentSite.id ? ' active' : '');
            link.href = site.url;
            link.setAttribute('role', 'menuitem');
            link.style.setProperty('--site-color', site.color);
            link.innerHTML = '<span aria-hidden="true">▶</span>' + escapeHtml(site.shortTitle);
            menu.appendChild(link);
        });

        const title = switcher.querySelector('.shared-site-title');
        switcher.addEventListener('mouseenter', function () {
            title.setAttribute('aria-expanded', 'true');
        });
        switcher.addEventListener('mouseleave', function () {
            title.setAttribute('aria-expanded', 'false');
        });
        title.addEventListener('focus', function () {
            title.setAttribute('aria-expanded', 'true');
        });
        return switcher;
    }

    function replaceSiteSwitcher() {
        const currentSite = getCurrentSite();
        const legacy = document.querySelector('.logo-dropdown');
        const auctionButton = document.querySelector('.phase-bar .left-btn');
        const source = legacy || auctionButton;
        if (!source) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'shared-site-header';
        wrapper.appendChild(createSiteSwitcher(currentSite));
        source.replaceWith(wrapper);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceSiteSwitcher);
    } else {
        replaceSiteSwitcher();
    }
})();
