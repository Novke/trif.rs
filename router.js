/**
 * SPA Router — navigacija, tranzicije, page init
 */
(function() {
    'use strict';

    var container = document.getElementById('page-container');
    var currentPage = null;
    var cache = {};
    var pageCleanups = {};
    var isNavigating = false;

    // ---- Page-specific init functions ----

    function initHome() {
        // Small delay to ensure DOM is laid out before measuring
        setTimeout(function() {
            drawWtLines();
        }, 50);
        window.addEventListener('resize', drawWtLines);

        // Navbar CTA visibility based on hero CTA scroll
        var ctaWrapper = document.getElementById('cta-wrapper');
        var navbarCta = document.getElementById('navbar-cta');
        if (ctaWrapper && navbarCta) {
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        navbarCta.classList.remove('visible');
                    } else {
                        navbarCta.classList.add('visible');
                    }
                });
            }, { threshold: 0 });
            observer.observe(ctaWrapper);

            pageCleanups.home = function() {
                observer.disconnect();
                window.removeEventListener('resize', drawWtLines);
            };
        }
    }

    function initUsluge() {
        document.querySelectorAll('.service-balloon').forEach(function(balloon) {
            balloon.addEventListener('click', function() {
                document.querySelectorAll('.service-balloon').forEach(function(b) {
                    b.classList.remove('active');
                });
                balloon.classList.add('active');

                document.querySelectorAll('.service-category').forEach(function(cat) {
                    cat.classList.remove('active');
                });
                var target = balloon.dataset.target;
                var el = document.getElementById(target);
                if (el) el.classList.add('active');
            });
        });
    }

    // ---- SVG connecting lines ----

    function drawWtLines() {
        var wtContainer = document.getElementById('wt-container');
        var svg = document.getElementById('wt-svg');
        if (!wtContainer || !svg) return;

        if (window.getComputedStyle(svg).display === 'none') return;

        var cr = wtContainer.getBoundingClientRect();

        function pt(el, edge) {
            var r = el.getBoundingClientRect();
            var cx = r.left - cr.left + r.width / 2;
            var cy = r.top - cr.top + r.height / 2;
            if (edge === 'bottom') return { x: cx, y: r.top - cr.top + r.height };
            if (edge === 'top')    return { x: cx, y: r.top - cr.top };
            if (edge === 'left')   return { x: r.left - cr.left, y: cy };
            if (edge === 'right')  return { x: r.left - cr.left + r.width, y: cy };
            return { x: cx, y: cy };
        }

        var top    = document.getElementById('wt-top');
        var left   = document.getElementById('wt-left');
        var right  = document.getElementById('wt-right');
        var bottom = document.getElementById('wt-bottom');

        if (!top || !left || !right || !bottom) return;

        var pTop     = pt(top,    'center');
        var pLeft    = pt(left,   'center');
        var pRight   = pt(right,  'center');
        var pLright  = pt(left,   'right');
        var pRleft   = pt(right,  'left');
        var pBot     = pt(bottom, 'top');

        var midX = (pLeft.x + pRight.x) / 2;
        var midY = pLeft.y;

        var W = cr.width;
        var H = cr.height;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('width', W);
        svg.setAttribute('height', H);

        var c = '#11cece';
        var op = '0.45';
        var dot = 3;

        function line(x1, y1, x2, y2) {
            return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
                   ' stroke="' + c + '" stroke-width="1.5" stroke-opacity="' + op + '" stroke-dasharray="5 8" stroke-linecap="round"/>' +
                   '<circle cx="' + x1 + '" cy="' + y1 + '" r="' + dot + '" fill="' + c + '" fill-opacity="' + op + '"/>' +
                   '<circle cx="' + x2 + '" cy="' + y2 + '" r="' + dot + '" fill="' + c + '" fill-opacity="' + op + '"/>';
        }

        svg.innerHTML =
            line(pTop.x, pTop.y, pLeft.x,  pLeft.y) +
            line(pTop.x, pTop.y, pRight.x, pRight.y) +
            line(pLright.x, pLright.y, pRleft.x, pRleft.y) +
            line(midX, midY, pBot.x, pBot.y);
    }

    // ---- Page loading ----

    function loadPage(page, callback) {
        if (cache[page]) return callback(cache[page]);

        var url = 'pages/' + page + '.html';

        // Use XMLHttpRequest for broader compatibility (works with file:// in some browsers)
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                    // status 0 with responseText = successful file:// load
                    cache[page] = xhr.responseText;
                    callback(xhr.responseText);
                } else {
                    console.error('[Router] Failed to load ' + url + ' (status: ' + xhr.status + ')');
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
            // Force reflow so the transition from opacity:0 → 1 fires
            void newEl.offsetHeight;
            newEl.classList.add('page-visible');
        }

        // Run page-specific init
        if (page === 'home') initHome();
        if (page === 'usluge') initUsluge();

        // Show navbar CTA on non-home pages (home manages it via IntersectionObserver)
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
        var pushHistory = opts.pushHistory !== false; // default true
        var sc = document.getElementById('star-container');

        // Don't navigate to same page
        if (page === currentPage || isNavigating) return;
        isNavigating = true;

        // Cleanup previous page
        if (currentPage && pageCleanups[currentPage]) {
            pageCleanups[currentPage]();
            pageCleanups[currentPage] = null;
        }

        // Fade out current content (if any)
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

        // Load and show — with delay if fading out old content, immediately if first load
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

    window.addEventListener('popstate', function(e) {
        var page = location.hash.replace('#', '') || 'home';
        var zoom = page === 'copywriting';
        // Use pushHistory: false to avoid pushing a new state during popstate
        currentPage = null; // Reset so navigateTo doesn't skip
        navigateTo(page, { zoom: zoom, pushHistory: false });
    });

    // ---- Initial load ----

    var startPage = location.hash.replace('#', '') || 'home';
    var startZoom = startPage === 'copywriting';
    navigateTo(startPage, { zoom: startZoom });
})();
