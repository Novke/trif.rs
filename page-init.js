/**
 * Page-specific init & cleanup functions
 * Called by the router after a page fragment is inserted into #page-container
 */
(function() {
    'use strict';

    // ---- Home page ----

    function initHome(cleanups) {
        setTimeout(function() {
            drawWtLines();
        }, 50);
        window.addEventListener('resize', drawWtLines);

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

            cleanups.home = function() {
                observer.disconnect();
                window.removeEventListener('resize', drawWtLines);
            };
        }
    }

    // SVG connecting lines for "How we work together" diamond

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

        function shorten(x1, y1, x2, y2, m1, m2) {
            if (m2 === undefined) m2 = m1;
            var dx = x2 - x1;
            var dy = y2 - y1;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len < m1 + m2) return { x1: x1, y1: y1, x2: x2, y2: y2 };
            var ux = dx / len;
            var uy = dy / len;
            return {
                x1: x1 + ux * m1,
                y1: y1 + uy * m1,
                x2: x2 - ux * m2,
                y2: y2 - uy * m2
            };
        }

        function line(x1, y1, x2, y2) {
            return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
                   ' stroke="' + c + '" stroke-width="1.5" stroke-opacity="' + op + '" stroke-dasharray="5 8" stroke-linecap="round"/>' +
                   '<circle cx="' + x1 + '" cy="' + y1 + '" r="' + dot + '" fill="' + c + '" fill-opacity="' + op + '"/>' +
                   '<circle cx="' + x2 + '" cy="' + y2 + '" r="' + dot + '" fill="' + c + '" fill-opacity="' + op + '"/>';
        }

        // Diagonals: 60px from top node, 100px from bottom nodes
        var dTL = shorten(pTop.x, pTop.y, pLeft.x, pLeft.y, 60, 100);
        var dTR = shorten(pTop.x, pTop.y, pRight.x, pRight.y, 60, 100);
        // Horizontal line
        var dLR = shorten(pLright.x, pLright.y, pRleft.x, pRleft.y, 10);
        // Vertical line to bottom
        var dMB = shorten(midX, midY, pBot.x, pBot.y, 40, 60);

        svg.innerHTML =
            line(dTL.x1, dTL.y1, dTL.x2, dTL.y2) +
            line(dTR.x1, dTR.y1, dTR.x2, dTR.y2) +
            line(dLR.x1, dLR.y1, dLR.x2, dLR.y2) +
            line(dMB.x1, dMB.y1, dMB.x2, dMB.y2);
    }

    // ---- Usluge page ----

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

    // ---- Expose to router ----

    window.PageInit = {
        home: initHome,
        usluge: initUsluge
    };
})();
