/* 3F Solutions — interakcije */
(function () {
    'use strict';

    var html = document.documentElement;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = matchMedia('(pointer: fine)').matches;
    var PF = window.PinField;
    var EASE = 'cubic-bezier(.2,.8,.2,1)';

    /* ---------- polje ---------- */
    var hasGL = PF && PF.init($('#field'));
    if (!hasGL) html.classList.add('no-gl');

    /* ---------- deljenje teksta ---------- */
    $$('[data-split]').forEach(function (el) {
        var words = el.textContent.trim().split(/\s+/), out = '';
        words.forEach(function (w, i) { out += '<span class="w"><span style="--i:' + i + '">' + w + '</span></span> '; });
        el.setAttribute('aria-label', el.textContent.trim());
        el.innerHTML = out;
    });

    // slova naslova (promenljiva debljina)
    var chars = [];
    $$('.hero-title .ln-in').forEach(function (ln) {
        Array.prototype.slice.call(ln.childNodes).forEach(function (n) {
            if (n.nodeType === 3) {
                var f = document.createDocumentFragment();
                n.textContent.split('').forEach(function (c) {
                    var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; f.appendChild(s); chars.push(s);
                });
                ln.replaceChild(f, n);
            } else { n.classList.add('ch'); chars.push(n); }
        });
    });

    // manifest reči
    var mwords = [];
    var man = $('[data-manifest]');
    if (man) {
        var frag = document.createDocumentFragment();
        Array.prototype.slice.call(man.childNodes).forEach(function (n) {
            var cls = n.nodeType === 1 ? n.className : '';
            n.textContent.split(/(\s+)/).forEach(function (part) {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                var s = document.createElement('span');
                s.className = 'mw' + (cls ? ' ' + cls : '');
                s.textContent = part;
                frag.appendChild(s); mwords.push(s);
            });
        });
        man.innerHTML = ''; man.appendChild(frag);
    }

    /* ---------- otkrivanje ---------- */
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            if (e.target.hasAttribute('data-rewrite')) typeRewrite(e.target);
            io.unobserve(e.target);
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    $$('[data-reveal], [data-split], [data-flow]').forEach(function (el) { io.observe(el); });

    function typeRewrite(box) {
        var p = $('[data-type]', box);
        if (!p || reduced) return;
        var txt = p.textContent, i = 0;
        p.textContent = '';
        var t = document.createTextNode(''), caret = document.createElement('span');
        caret.className = 'type-caret';
        p.appendChild(t); p.appendChild(caret);
        setTimeout(function tick() {
            t.textContent = txt.slice(0, ++i);
            if (i < txt.length) setTimeout(tick, txt[i - 1] === '.' ? 260 : 26 + Math.random() * 30);
        }, 700);
    }

    /* ---------- glatki skrol ---------- */
    var sm = { y: scrollY, t: scrollY, active: false, on: fine && !reduced };
    var lock = false;
    var maxY = function () { return document.documentElement.scrollHeight - innerHeight; };
    if (sm.on) {
        html.classList.add('has-smooth');
        addEventListener('wheel', function (e) {
            if (e.ctrlKey || lock || html.classList.contains('menu-open')) return;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            e.preventDefault();
            var d = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
            if (!sm.active) sm.y = scrollY;
            sm.t = clamp((sm.active ? sm.t : scrollY) + d, 0, maxY());
            sm.active = true;
        }, { passive: false });
        addEventListener('scroll', function () { if (!sm.active) sm.y = sm.t = scrollY; }, { passive: true });
        addEventListener('keydown', function () { sm.active = false; });
        addEventListener('pointerdown', function (e) { if (e.target === html) sm.active = false; });
    }
    function scrollToY(y) {
        y = clamp(y, 0, maxY());
        if (sm.on) { sm.y = scrollY; sm.t = y; sm.active = true; }
        else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
    $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var id = a.getAttribute('href');
            var el = id === '#top' ? null : $(id);
            if (id !== '#top' && !el) return;
            e.preventDefault();
            html.classList.remove('menu-open');
            $('.burger').setAttribute('aria-expanded', 'false');
            scrollToY(el ? el.getBoundingClientRect().top + scrollY : 0);
        });
    });

    /* ---------- meni ---------- */
    $('.burger').addEventListener('click', function () {
        var open = html.classList.toggle('menu-open');
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* ---------- sekcije -> polje ---------- */
    var nav = $('#nav');
    var fieldEls = $$('[data-field]'), solids = $$('[data-solid]'), lights = $$('[data-light]');
    var navLinks = $$('.nav-links a');
    var linkTargets = navLinks.map(function (a) { return $(a.getAttribute('href')); });
    var lastKey = '';
    function sections() {
        var vh = innerHeight, mid = vh * 0.5, mobile = innerWidth < 760;
        var covered = false;
        solids.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 1 && r.bottom >= vh - 1) covered = true; });
        if (hasGL) PF.run(!covered && !document.hidden);
        var cur = null;
        fieldEls.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) cur = s; });
        if (cur && hasGL) {
            var shape = cur.getAttribute('data-field'), place = cur.getAttribute('data-place') || 'center';
            var dim = parseFloat((mobile && cur.getAttribute('data-dim-m')) || cur.getAttribute('data-dim') || 0);
            var key = shape + '|' + place + '|' + dim + '|' + mobile;
            if (key !== lastKey) {
                lastKey = key;
                PF.shape(shape, place);
                PF.view({ dim: dim, yaw: parseFloat(cur.getAttribute('data-yaw') || 0) });
            }
        }
        var light = false;
        lights.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) light = true; });
        nav.classList.toggle('is-light', light);
        nav.classList.toggle('is-compact', scrollY > 40);
        var on = -1;
        linkTargets.forEach(function (t, i) { if (t) { var r = t.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) on = i; } });
        navLinks.forEach(function (a, i) { a.classList.toggle('is-on', i === on); });
    }
    document.addEventListener('visibilitychange', sections);

    /* ---------- manifest ---------- */
    var manSec = $('.manifest');
    function manifest() {
        if (!manSec || !mwords.length) return;
        var r = manSec.getBoundingClientRect();
        var p = clamp((innerHeight * 0.55 - r.top) / (r.height - innerHeight * 0.45), 0, 1);
        var lit = Math.round(p * mwords.length * 1.08);
        for (var i = 0; i < mwords.length; i++) mwords[i].classList.toggle('lit', i < lit);
    }

    /* ---------- marquee ---------- */
    var rows = $$('[data-mq]').map(function (row) {
        var seg = document.createElement('div');
        seg.className = 'mq-seg';
        while (row.firstChild) seg.appendChild(row.firstChild);
        row.appendChild(seg);
        for (var i = 0; i < 3; i++) row.appendChild(seg.cloneNode(true));
        return { el: row, seg: seg, dir: parseFloat(row.getAttribute('data-mq')), x: 0, w: 1 };
    });
    function mqMeasure() { rows.forEach(function (r) { r.w = r.seg.getBoundingClientRect().width || 1; }); }
    var skew = 0, lastY = scrollY;
    function marquee(dt) {
        var v = scrollY - lastY; lastY = scrollY;
        skew += (clamp(v * 0.25, -10, 10) - skew) * 0.12;
        rows.forEach(function (r, i) {
            var sp = (i === 0 ? 70 : 45) * dt + Math.abs(v) * 0.35;
            r.x -= sp * r.dir;
            if (r.x <= -r.w) r.x += r.w;
            if (r.x > 0) r.x -= r.w;
            r.el.style.transform = 'translate3d(' + r.x.toFixed(2) + 'px,0,0) skewX(' + (-skew * r.dir).toFixed(2) + 'deg)';
        });
    }

    /* ---------- kursor + slova + magnet ---------- */
    var cursor = $('.cursor'), ring = $('.cursor-ring'), dot = $('.cursor-dot'), clabel = $('.cursor-label');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, moved = false;
    if (fine && !reduced) html.classList.add('has-cursor');
    addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        mx = e.clientX; my = e.clientY; moved = true;
        var t = e.target;
        var hov = t.closest && t.closest('a, button, [data-cursor], .member');
        var lab = t.closest && t.closest('[data-cursor]');
        cursor.classList.toggle('is-hover', !!hov && !lab);
        cursor.classList.toggle('is-label', !!lab);
        if (lab) clabel.textContent = lab.getAttribute('data-cursor');
        cursor.classList.toggle('is-light', !!(t.closest && t.closest('[data-light]')));
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.classList.add('is-hidden'); });
    document.addEventListener('pointerenter', function () { cursor.classList.remove('is-hidden'); });

    var heroEl = $('.hero');
    function letters() {
        if (!fine || reduced || !moved) return;
        var hr = heroEl.getBoundingClientRect();
        if (hr.bottom < 0) return;
        for (var i = 0; i < chars.length; i++) {
            var r = chars[i].getBoundingClientRect();
            var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
            var g = Math.exp(-(dx * dx + dy * dy) / (2 * 150 * 150));
            chars[i].style.setProperty('--w', Math.round(560 + 340 * g));
        }
    }

    $$('[data-magnetic]').forEach(function (b) {
        if (!fine || reduced) return;
        b.addEventListener('pointermove', function (e) {
            var r = b.getBoundingClientRect();
            var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
            b.style.transform = 'translate(' + (x * 0.28).toFixed(1) + 'px,' + (y * 0.38).toFixed(1) + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });

    /* ---------- tim ---------- */
    var members = $$('.member');
    function openMember(m) { members.forEach(function (x) { x.classList.toggle('is-open', x === m); }); }
    members.forEach(function (m) {
        m.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') openMember(m); });
        m.addEventListener('focusin', function () { openMember(m); });
        m.addEventListener('click', function () { openMember(m); });
        if (!fine || reduced) return;
        m.addEventListener('pointermove', function (e) {
            var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            m.style.setProperty('--ry', ((x - 0.5) * 5).toFixed(2) + 'deg');
            m.style.setProperty('--rx', ((0.5 - y) * 4).toFixed(2) + 'deg');
            m.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
            m.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        });
        m.addEventListener('pointerleave', function () {
            m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg');
        });
    });

    /* ---------- talas na klik ---------- */
    addEventListener('pointerdown', function (e) {
        if (!hasGL || e.button > 0) return;
        var t = e.target;
        if (t.closest('a, button, input, textarea, [data-solid], .member, .chapter-in, .direct, .intro')) return;
        PF.pulse(e.clientX, e.clientY);
    });

    /* ---------- glavna petlja ---------- */
    var lastT = performance.now();
    function frame(now) {
        var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
        if (sm.active) {
            sm.y += (sm.t - sm.y) * 0.105;
            if (Math.abs(sm.t - sm.y) < 0.4) { sm.y = sm.t; sm.active = false; }
            window.scrollTo(0, sm.y);
        }
        if (fine) {
            rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
            dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
            ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
        }
        sections();
        manifest();
        marquee(dt);
        letters();
        requestAnimationFrame(frame);
    }

    var rt;
    addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { mqMeasure(); lastKey = ''; }, 200); });

    /* ---------- intro ---------- */
    function ready() {
        html.classList.add('is-ready');
    }
    function startField() { if (hasGL) PF.start(); }

    function boot() {
        mqMeasure();
        sections();
        requestAnimationFrame(frame);
        if (!html.classList.contains('is-intro')) {
            startField();
            requestAnimationFrame(function () { requestAnimationFrame(ready); });
            return;
        }
        intro();
    }

    function intro() {
        var box = $('#intro'), mark = $('.intro-mark', box), bg = $('.intro-bg', box);
        var anims = [], timers = [], done = false;
        try { sessionStorage.setItem('3f-intro', '1'); } catch (e) {}
        lock = true;
        html.style.overflow = 'hidden';
        box.classList.add('is-on');
        $$('.b', mark).forEach(function (b, i) {
            anims.push(b.animate([
                { transform: 'scaleY(0)' },
                { transform: 'scaleY(1.14)', offset: 0.68 },
                { transform: 'scaleY(1)' }
            ], { duration: 620, delay: 90 + i * 95, easing: EASE, fill: 'forwards' }));
        });
        $$('.a', mark).forEach(function (a, i) {
            anims.push(a.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
                { duration: 480, delay: 560 + i * 90, easing: EASE, fill: 'forwards' }));
        });
        anims.push($('.sweep', mark).animate([{ transform: 'translateX(0)' }, { transform: 'translateX(1060px)' }],
            { duration: 640, delay: 860, easing: 'cubic-bezier(.55,0,.3,1)', fill: 'forwards' }));

        timers.push(setTimeout(fly, 1320));

        function fly() {
            if (done) return;
            var target = $('.nav-logo svg').getBoundingClientRect(), r = mark.getBoundingClientRect();
            mark.style.left = r.left + 'px'; mark.style.top = r.top + 'px';
            mark.style.height = r.height + 'px'; mark.style.width = r.width + 'px';
            mark.style.transform = 'none';
            var s = target.height / r.height;
            anims.push(mark.animate([
                { transform: 'translate(0,0) scale(1)' },
                { transform: 'translate(' + (target.left - r.left) + 'px,' + (target.top - r.top) + 'px) scale(' + s + ')' }
            ], { duration: 720, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }));
            anims.push(bg.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
                { duration: 760, delay: 60, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }));
            startField();
            timers.push(setTimeout(ready, 260));
            timers.push(setTimeout(finish, 760));
        }

        function finish() {
            if (done) return;
            done = true;
            timers.forEach(clearTimeout);
            anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
            box.style.display = 'none';
            html.classList.remove('is-intro');
            html.style.overflow = '';
            lock = false;
            startField();
            ready();
            removeEventListener('keydown', skip);
        }
        function skip() { finish(); }
        bg.addEventListener('pointerdown', skip);
        addEventListener('keydown', skip);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
