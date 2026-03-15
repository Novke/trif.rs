/**
 * SPA Router — navigation, transitions, page loading
 */
(function() {
    'use strict';

    var container = document.getElementById('page-container');
    var currentPage = null;
    var cache = {};
    var pageCleanups = {};
    var isNavigating = false;

    // ---- Page loading ----

    function loadPage(page, callback) {
        if (cache[page]) return callback(cache[page]);

        var url = 'pages/' + page + '.html';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                    cache[page] = xhr.responseText;
                    callback(xhr.responseText);
                } else {
                    console.error('[Router] Failed to load ' + url + ' (status: ' + xhr.status + ')');
                    isNavigating = false;
                }
            }
        };
        xhr.send();
    }

    // ---- Show page content ----

    function showPage(html, page) {
        container.innerHTML = html;
        window.scrollTo(0, 0);

        var newEl = container.firstElementChild;
        if (newEl) {
            void newEl.offsetHeight;
            newEl.classList.add('page-visible');
        }

        // Run page-specific init (from page-init.js)
        if (window.PageInit && PageInit[page]) {
            PageInit[page](pageCleanups);
        }

        // Show navbar CTA on non-home pages
        var navbarCta = document.getElementById('navbar-cta');
        if (navbarCta && page !== 'home') {
            navbarCta.classList.add('visible');
        }

        currentPage = page;
        isNavigating = false;
    }

    // ---- Navigation ----

    window.navigateTo = function(page, opts) {
        opts = opts || {};
        var zoom = opts.zoom || false;
        var pushHistory = opts.pushHistory !== false;
        var sc = document.getElementById('star-container');

        if (page === currentPage || isNavigating) return;
        isNavigating = true;

        // Cleanup previous page
        if (currentPage && pageCleanups[currentPage]) {
            pageCleanups[currentPage]();
            pageCleanups[currentPage] = null;
        }

        // Fade out current content
        var currentEl = container.firstElementChild;
        var hasCurrentContent = currentEl && currentPage;

        if (hasCurrentContent) {
            currentEl.classList.add('page-exit');
        }

        // Handle star zoom
        if (sc) {
            if (zoom) {
                sc.classList.add('zoomed');
            } else {
                sc.classList.remove('zoomed');
            }
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update URL
        if (pushHistory) {
            history.pushState({ page: page }, '', '#' + page);
        }

        // Load and show
        var delay = hasCurrentContent ? 450 : 0;

        setTimeout(function() {
            loadPage(page, function(html) {
                showPage(html, page);
            });
        }, delay);
    };

    // ---- Delegated click handler for SPA links ----

    document.addEventListener('click', function(e) {
        var link = e.target.closest('.spa-link, .nav-link[data-page]');
        if (!link) return;

        var page = link.dataset.page;
        if (!page) return;

        e.preventDefault();
        var zoom = link.dataset.zoom === 'true';
        navigateTo(page, { zoom: zoom });
    });

    // ---- Browser back/forward ----

    window.addEventListener('popstate', function() {
        var page = location.hash.replace('#', '') || 'home';
        var zoom = page === 'copywriting';
        currentPage = null;
        navigateTo(page, { zoom: zoom, pushHistory: false });
    });

    // ---- Initial load ----

    var startPage = location.hash.replace('#', '') || 'home';
    var startZoom = startPage === 'copywriting';
    navigateTo(startPage, { zoom: startZoom });
})();
