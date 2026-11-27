/* 3F Solutions — pin field
   Polje iglica (WebGL2, instancirano). Oblici (3F znak, </>, pero, tekst) se
   utiskuju u polje, kursor podiže iglice i ostavlja trag, klik pušta talas. */
(function () {
    'use strict';

    var CYAN = [0x11 / 255, 0xce / 255, 0xce / 255];
    var INFRA = [1.0, 0x3e / 255, 0x6c / 255];
    var BG = [5 / 255, 9 / 255, 11 / 255];

    var VS = '#version 300 es\n' +
        'layout(location=0) in vec3 aPos;\n' +
        'layout(location=1) in vec3 aNor;\n' +
        'layout(location=2) in vec2 aGrid;\n' +
        'layout(location=3) in vec3 aDyn;\n' +
        'uniform mat4 uVP; uniform vec2 uGrid; uniform float uSize, uBase, uDepth;\n' +
        'out vec3 vNor; out vec3 vW; out vec3 vDyn; out float vZ;\n' +
        'void main(){\n' +
        '  float h = max(uBase + aDyn.x * uDepth, 0.08);\n' +
        '  vec3 p = vec3(aGrid.x - uGrid.x*0.5 + 0.5 + aPos.x*uSize, aGrid.y - uGrid.y*0.5 + 0.5 + aPos.y*uSize, aPos.z*h);\n' +
        '  vW = p; vNor = aNor; vDyn = aDyn; vZ = aPos.z;\n' +
        '  gl_Position = uVP * vec4(p, 1.0);\n' +
        '}';

    var FS = '#version 300 es\n' +
        'precision highp float;\n' +
        'in vec3 vNor; in vec3 vW; in vec3 vDyn; in float vZ;\n' +
        'uniform vec3 uCyan, uInfra, uBg, uEye, uMouse; uniform vec2 uRes; uniform float uDim, uFade;\n' +
        'out vec4 o;\n' +
        'void main(){\n' +
        '  vec3 n = normalize(vNor);\n' +
        '  vec3 L = normalize(vec3(-0.42, 0.62, 0.78));\n' +
        '  vec3 V = normalize(uEye - vW);\n' +
        '  float dif = max(dot(n, L), 0.0);\n' +
        '  float top = step(0.5, n.z);\n' +
        '  float h = clamp(vDyn.x, 0.0, 1.25);\n' +
        '  float heat = clamp(vDyn.y, 0.0, 1.0);\n' +
        '  float tint = clamp(vDyn.z, 0.0, 1.0);\n' +
        '  float glow = smoothstep(0.05, 0.95, h);\n' +
        '  float hot = max(heat, tint * glow);\n' +
        '  vec3 graph = vec3(0.050, 0.078, 0.086);\n' +
        '  vec3 tipC = mix(graph * 1.45, uCyan * 1.12, glow);\n' +
        '  tipC = mix(tipC, uInfra * 1.08, hot);\n' +
        '  vec3 sideC = graph * (0.30 + 0.80 * vZ);\n' +
        '  sideC += mix(uCyan * glow, uInfra, hot) * 0.50 * vZ * vZ;\n' +
        '  vec3 col = top > 0.5 ? tipC * (0.60 + 0.52 * dif) : sideC * (0.40 + 0.95 * dif);\n' +
        '  vec3 Hh = normalize(L + V);\n' +
        '  col += pow(max(dot(n, Hh), 0.0), 48.0) * (0.08 + 0.55 * glow) * top;\n' +
        '  float md = length(vW.xy - uMouse.xy);\n' +
        '  col += uInfra * 0.16 * uMouse.z * exp(-md * md / 70.0) * (0.35 + top);\n' +
        '  vec2 s = gl_FragCoord.xy / uRes - 0.5; s.x *= uRes.x / uRes.y;\n' +
        '  float vig = 1.0 - smoothstep(0.42, 1.05, length(s * vec2(0.82, 1.0)));\n' +
        '  col = mix(uBg, col, vig * (1.0 - uDim * 0.62) * uFade);\n' +
        '  float r = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);\n' +
        '  col += (r - 0.5) / 200.0;\n' +
        '  o = vec4(col, 1.0);\n' +
        '}';

    /* ---------- male matrice (column-major) ---------- */
    function persp(fovy, asp, n, f) {
        var t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
        return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
    }
    function lookAt(e, c, u) {
        var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz);
        zx /= l; zy /= l; zz /= l;
        var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
        l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
        var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
        return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
            -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
    }
    function mul(a, b) {
        var o = new Array(16);
        for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
            o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
        return o;
    }
    function inv(m) {
        var a = m, o = new Array(16);
        var b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4];
        var b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
        var b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12];
        var b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
        var d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
        o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d;
        o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
        o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d;
        o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
        o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d;
        o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
        o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d;
        o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
        return o;
    }
    function xf(m, x, y, z) {
        var w = m[3] * x + m[7] * y + m[11] * z + m[15];
        return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w];
    }

    /* ---------- oblici ---------- */
    function px(c, v, t) { c.fillStyle = c.strokeStyle = 'rgb(' + Math.round(v * 255) + ',' + Math.round((t || 0) * 255) + ',0)'; }

    var SHAPES = {
        logo: {
            w: 720, h: 752,
            draw: function (c) {
                c.translate(-180, -135);
                px(c, 0.6); c.fillRect(200.34, 305.69, 52.36, 427.75);
                px(c, 0.8); c.fillRect(324.26, 222, 52.36, 595.13);
                px(c, 1); c.fillRect(446.22, 155.06, 52.36, 711.88);
                c.fillRect(566.81, 155.26, 312.85, 52.36);
                px(c, 0.92); c.fillRect(566.81, 451.02, 223.33, 52.36);
            }
        },
        bars: {
            w: 1000, h: 760,
            draw: function (c, t) {
                var hs = [[0.6, 190, 380], [0.8, 110, 540], [1, 30, 700]];
                for (var i = 0; i < 3; i++) {
                    var b = hs[i], k = 0.06 * Math.sin(t * 1.3 + i * 1.7);
                    px(c, b[0] + k); c.fillRect(120 + i * 300, b[1] + 380 - b[2] / 2 - 190 + 190, 160, b[2]);
                }
            }
        },
        code: {
            w: 1000, h: 760,
            draw: function (c) {
                c.lineJoin = 'miter'; c.lineCap = 'butt'; c.lineWidth = 92;
                px(c, 1);
                c.beginPath(); c.moveTo(330, 100); c.lineTo(80, 380); c.lineTo(330, 660); c.stroke();
                c.beginPath(); c.moveTo(670, 100); c.lineTo(920, 380); c.lineTo(670, 660); c.stroke();
                px(c, 0.82, 1); c.lineWidth = 74;
                c.beginPath(); c.moveTo(585, 40); c.lineTo(415, 720); c.stroke();
            }
        },
        design: {
            w: 1000, h: 760, dynamic: true,
            draw: function (c, t) {
                var a0 = [110, 610], a1 = [890, 150];
                var c1 = [330 + 120 * Math.sin(t * 0.8), 90 + 60 * Math.cos(t * 1.1)];
                var c2 = [670 - 120 * Math.sin(t * 0.7 + 1.2), 670 - 60 * Math.cos(t * 0.9 + 0.4)];
                c.lineCap = 'round';
                px(c, 0.42); c.lineWidth = 16;
                c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(c1[0], c1[1]); c.stroke();
                c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(c2[0], c2[1]); c.stroke();
                px(c, 1); c.lineWidth = 66;
                c.beginPath(); c.moveTo(a0[0], a0[1]); c.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], a1[0], a1[1]); c.stroke();
                px(c, 0.7);
                c.beginPath(); c.arc(c1[0], c1[1], 34, 0, 6.3); c.fill();
                c.beginPath(); c.arc(c2[0], c2[1], 34, 0, 6.3); c.fill();
                px(c, 0.88, 1);
                c.fillRect(a0[0] - 52, a0[1] - 52, 104, 104);
                c.fillRect(a1[0] - 52, a1[1] - 52, 104, 104);
            }
        },
        copy: {
            w: 1000, h: 760, dynamic: true,
            draw: function (c, t) {
                var L = [[40, 120, 880, 1], [255, 66, 960, 0.55], [365, 66, 830, 0.55], [475, 66, 910, 0.55], [585, 66, 540, 0.55]];
                var total = 0, i;
                for (i = 0; i < L.length; i++) total += L[i][2];
                var cyc = 7.5, ph = t % cyc, p = Math.min(1, ph / 5.2), hold = ph > 5.2;
                var left = p * total, cx = 20, cy = L[0][0], ch = L[0][1];
                for (i = 0; i < L.length; i++) {
                    var w = Math.max(0, Math.min(L[i][2], left));
                    left -= L[i][2];
                    if (w > 0) { px(c, L[i][3]); c.fillRect(20, L[i][0], w, L[i][1]); cx = 20 + w; cy = L[i][0]; ch = L[i][1]; }
                }
                if (!hold || Math.floor(t * 2.2) % 2 === 0) {
                    px(c, 1, 1); c.fillRect(cx + 16, cy - ch * 0.2, 28, ch * 1.4);
                }
            }
        }
    };

    // gde stoji oblik: [x0, y0, x1, y1] u delovima ekrana (y nadole)
    var PLACES = {
        hero: { d: [0.5, 0.13, 0.95, 0.9], m: [0.06, 0.5, 0.94, 0.95] },
        right: { d: [0.55, 0.2, 0.95, 0.82], m: [0.14, 0.36, 0.86, 0.74] },
        center: { d: [0.16, 0.18, 0.84, 0.86], m: [0.04, 0.24, 0.96, 0.78] },
        contact: { d: [0.62, 0.12, 0.94, 0.6], m: [0.18, 0.56, 0.82, 0.94] }
    };

    /* ---------- stanje ---------- */
    var canvas, gl, prog, U = {}, vao, gridBuf, dynBuf, cubeN = 0;
    var NX = 0, NY = 0, N = 0, W = 0, HH = 0, dpr = 1;
    var hgt, vel, from, to, tintFrom, tintTo, heat, tint, delay, dyn;
    var cur = { shape: null, place: null, t0: 0 };
    var VP, IVP, eye = [0, 0, 1], D = 50;
    var cam = { yaw: 0, pitch: 0.36, ty: 0, tp: 0.36, my: 0, mp: 0 };
    var mouse = { sx: -1, sy: -1, gx: -1e4, gy: -1e4, on: 0, str: 0, last: 0, speed: 0 };
    var ripples = [];
    var dim = 0, dimT = 0, fade = 1, fadeT = 1;
    var running = false, raf = 0, lastT = 0, clock = 0, acc = 0, rasterAt = 0;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rc = document.createElement('canvas'), rx = rc.getContext('2d', { willReadFrequently: true });
    var RS = 3;
    var started = false;

    function shader(type, src) {
        var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    }

    function cube() {
        var P = [];
        function add(a, b, c, d, n) { [a, b, c, a, c, d].forEach(function (v) { P.push(v[0], v[1], v[2], n[0], n[1], n[2]); }); }
        var x0 = -0.5, x1 = 0.5, y0 = -0.5, y1 = 0.5;
        add([x0, y0, 1], [x1, y0, 1], [x1, y1, 1], [x0, y1, 1], [0, 0, 1]);
        add([x1, y0, 0], [x1, y1, 0], [x1, y1, 1], [x1, y0, 1], [1, 0, 0]);
        add([x0, y1, 0], [x0, y0, 0], [x0, y0, 1], [x0, y1, 1], [-1, 0, 0]);
        add([x1, y1, 0], [x0, y1, 0], [x0, y1, 1], [x1, y1, 1], [0, 1, 0]);
        add([x0, y0, 0], [x1, y0, 0], [x1, y0, 1], [x0, y0, 1], [0, -1, 0]);
        return new Float32Array(P);
    }

    function isMobile() { return W < 760; }

    function camera(yaw, pitch) {
        var fov = 26 * Math.PI / 180;
        var visH = HH / pitchPx();
        D = (visH / 2) / Math.tan(fov / 2);
        eye = [D * Math.sin(yaw) * Math.cos(pitch), D * Math.sin(pitch), D * Math.cos(yaw) * Math.cos(pitch)];
        var v = lookAt(eye, [0, 0, 0], [0, 1, 0]);
        var p = persp(fov, W / HH, D * 0.3, D * 3);
        return mul(p, v);
    }

    function pitchPx() { return Math.max(9, Math.min(14, W / 128)); }

    function screenToGrid(sx, sy, ivp) {
        var nx = sx * 2 - 1, ny = 1 - sy * 2;
        var a = xf(ivp, nx, ny, -1), b = xf(ivp, nx, ny, 1);
        var t = -a[2] / (b[2] - a[2]);
        var wx = a[0] + (b[0] - a[0]) * t, wy = a[1] + (b[1] - a[1]) * t;
        return [wx + NX / 2 - 0.5, wy + NY / 2 - 0.5];
    }

    function build() {
        W = canvas.clientWidth || innerWidth || 1280; HH = canvas.clientHeight || innerHeight || 800;
        dpr = Math.min(window.devicePixelRatio || 1, 1.6);
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(HH * dpr);
        var pp = pitchPx();
        NX = Math.ceil(W / pp * 1.3); NY = Math.ceil(HH / pp * 1.6);
        N = NX * NY;
        var g = new Float32Array(N * 2), i = 0;
        for (var y = 0; y < NY; y++) for (var x = 0; x < NX; x++) { g[i++] = x; g[i++] = y; }
        var old = hgt;
        hgt = new Float32Array(N); vel = new Float32Array(N);
        from = new Float32Array(N); to = new Float32Array(N);
        tintFrom = new Float32Array(N); tintTo = new Float32Array(N);
        heat = new Float32Array(N); tint = new Float32Array(N);
        delay = new Float32Array(N); dyn = new Float32Array(N * 3);
        for (i = 0; i < N; i++) {
            var gx = i % NX;
            var h = Math.sin(i * 12.9898) * 43758.5453; h -= Math.floor(h);
            delay[i] = (gx / NX) * 0.55 + h * 0.14;
        }
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf); gl.bufferData(gl.ARRAY_BUFFER, g, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf); gl.bufferData(gl.ARRAY_BUFFER, dyn, gl.DYNAMIC_DRAW);
        VP = camera(cam.yaw, cam.pitch); IVP = inv(VP);
        if (cur.shape != null) {
            raster(cur.shape, cur.place, to, tintTo);
            if (old && started) { hgt.set(to); from.set(to); tintFrom.set(tintTo); tint.set(tintTo); }
        }
    }

    function raster(name, place, outH, outT) {
        var def = SHAPES[name];
        outH.fill(0); outT.fill(0);
        if (!def || !NX || !NY) return;
        var box = PLACES[place] ? PLACES[place][isMobile() ? 'm' : 'd'] : PLACES.center.d;
        var ivp = inv(camera(0, cam.pitch));
        var cy = (box[1] + box[3]) / 2, cx = (box[0] + box[2]) / 2;
        var gl0 = screenToGrid(box[0], cy, ivp), gr = screenToGrid(box[2], cy, ivp);
        var gt = screenToGrid(cx, box[1], ivp), gb = screenToGrid(cx, box[3], ivp);
        // kontinualne koordinate mreže -> platno (y nadole)
        var X0 = (gl0[0] + 0.5) * RS, X1 = (gr[0] + 0.5) * RS;
        var Y0 = (NY - (gt[1] + 0.5)) * RS, Y1 = (NY - (gb[1] + 0.5)) * RS;
        var bw = X1 - X0, bh = Y1 - Y0;
        rc.width = NX * RS; rc.height = NY * RS;
        rx.setTransform(1, 0, 0, 1, 0, 0);
        rx.fillStyle = '#000'; rx.fillRect(0, 0, rc.width, rc.height);
        var sc = Math.min(bw / def.w, bh / def.h);
        rx.setTransform(sc, 0, 0, sc, X0 + (bw - def.w * sc) / 2, Y0 + (bh - def.h * sc) / 2);
        def.draw(rx, clock);
        var d = rx.getImageData(0, 0, rc.width, rc.height).data, rw = rc.width, k = 1 / (RS * RS * 255);
        for (var gy = 0; gy < NY; gy++) {
            var row0 = (NY - 1 - gy) * RS;
            for (var gx = 0; gx < NX; gx++) {
                var sr = 0, sg = 0;
                for (var yy = 0; yy < RS; yy++) {
                    var o = ((row0 + yy) * rw + gx * RS) * 4;
                    for (var xx = 0; xx < RS; xx++, o += 4) { sr += d[o]; sg += d[o + 1]; }
                }
                var j = gy * NX + gx;
                outH[j] = sr * k; outT[j] = sr > 0 ? sg / sr : 0;
            }
        }
    }

    function setShape(name, place) {
        if (cur.shape === name && cur.place === place) return;
        if (!gl) { cur.shape = name; cur.place = place; return; }
        // trenutni cilj postaje polazni (da prekinuti prelaz ne skoči)
        var now = clock;
        if (cur.shape != null) {
            for (var i = 0; i < N; i++) {
                var on = now - cur.t0 >= delay[i];
                from[i] = on ? to[i] : from[i];
                tintFrom[i] = on ? tintTo[i] : tintFrom[i];
            }
        }
        cur.shape = name; cur.place = place; cur.t0 = now;
        raster(name, place, to, tintTo);
        rasterAt = now;
    }

    /* ---------- simulacija ---------- */
    function step(dt) {
        clock += dt;
        var t = clock, i;
        var def = SHAPES[cur.shape];
        if (def && def.dynamic && t - rasterAt > 1 / 30) { raster(cur.shape, cur.place, to, tintTo); rasterAt = t; }

        cam.yaw += (cam.ty + cam.my - cam.yaw) * 0.05;
        cam.pitch += (cam.tp + cam.mp - cam.pitch) * 0.05;
        dim += (dimT - dim) * 0.06;
        fade += (fadeT - fade) * 0.08;

        // kursor -> mreža
        VP = camera(cam.yaw, cam.pitch); IVP = inv(VP);
        if (mouse.on) {
            var gp = screenToGrid(mouse.sx, mouse.sy, IVP);
            mouse.gx = gp[0]; mouse.gy = gp[1];
        }
        mouse.str += ((mouse.on ? 1 : 0) - mouse.str) * 0.08;
        mouse.speed *= 0.9;

        var since = t - cur.t0, idle = reduced ? 0 : 0.035;
        var K = 0.075, DA = 0.855;
        for (i = 0; i < N; i++) {
            var on = since >= delay[i] || !started;
            var goal = started ? (on ? to[i] : from[i]) : 0;
            var tg = on ? tintTo[i] : tintFrom[i];
            if (idle) {
                var gx = i % NX, gy = (i / NX) | 0;
                goal += idle * (Math.sin(gx * 0.19 + t * 1.05) + Math.sin(gy * 0.16 - t * 0.83 + gx * 0.05));
            }
            dyn[i * 3 + 1] = goal; // privremeno
            tint[i] += (tg - tint[i]) * 0.08;
            heat[i] *= 0.955;
        }
        // kursor: lokalno podizanje + trag
        if (mouse.str > 0.01) {
            var R = 7, cx = Math.round(mouse.gx), cy = Math.round(mouse.gy), s2 = 2 * 2.6 * 2.6;
            var gain = Math.min(1, 0.18 + mouse.speed / 900);
            for (var y = Math.max(0, cy - R); y <= Math.min(NY - 1, cy + R); y++) {
                for (var x = Math.max(0, cx - R); x <= Math.min(NX - 1, cx + R); x++) {
                    var dx = x - mouse.gx, dy = y - mouse.gy, g = Math.exp(-(dx * dx + dy * dy) / s2) * mouse.str;
                    var j = y * NX + x;
                    dyn[j * 3 + 1] += 0.5 * g;
                    if (g * gain > heat[j]) heat[j] = g * gain;
                }
            }
        }
        // talasi
        for (var r = ripples.length - 1; r >= 0; r--) {
            var rp = ripples[r], age = t - rp.t;
            if (age > 2.2) { ripples.splice(r, 1); continue; }
            var rad = age * 34, amp = 0.75 * Math.exp(-age * 1.7), w2 = 2 * 1.6 * 1.6;
            var y0 = Math.max(0, Math.floor(rp.gy - rad - 5)), y1 = Math.min(NY - 1, Math.ceil(rp.gy + rad + 5));
            var x0 = Math.max(0, Math.floor(rp.gx - rad - 5)), x1 = Math.min(NX - 1, Math.ceil(rp.gx + rad + 5));
            for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) {
                var ddx = xx - rp.gx, ddy = yy - rp.gy, dd = Math.sqrt(ddx * ddx + ddy * ddy) - rad;
                if (dd > 5 || dd < -5) continue;
                var gg = amp * Math.exp(-(dd * dd) / w2), jj = yy * NX + xx;
                dyn[jj * 3 + 1] += gg;
                if (gg * 0.9 > heat[jj]) heat[jj] = gg * 0.9;
            }
        }
        for (i = 0; i < N; i++) {
            var gl2 = dyn[i * 3 + 1];
            if (reduced) { hgt[i] = gl2; }
            else { vel[i] = (vel[i] + (gl2 - hgt[i]) * K) * DA; hgt[i] += vel[i]; }
            dyn[i * 3] = hgt[i];
            dyn[i * 3 + 1] = heat[i];
            dyn[i * 3 + 2] = tint[i];
        }
    }

    function draw() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(BG[0], BG[1], BG[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(prog);
        gl.uniformMatrix4fv(U.uVP, false, VP);
        gl.uniform2f(U.uGrid, NX, NY);
        gl.uniform1f(U.uSize, 0.74);
        gl.uniform1f(U.uBase, 0.55);
        gl.uniform1f(U.uDepth, 7.5);
        gl.uniform3fv(U.uCyan, CYAN); gl.uniform3fv(U.uInfra, INFRA); gl.uniform3fv(U.uBg, BG);
        gl.uniform3fv(U.uEye, eye);
        gl.uniform3f(U.uMouse, mouse.gx - NX / 2 + 0.5, mouse.gy - NY / 2 + 0.5, mouse.str);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform1f(U.uDim, dim); gl.uniform1f(U.uFade, fade);
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, dyn);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, cubeN, N);
    }

    function loop(ts) {
        raf = requestAnimationFrame(loop);
        var dt = Math.min(0.05, (ts - (lastT || ts)) / 1000);
        lastT = ts;
        acc += dt;
        var steps = 0;
        while (acc >= 1 / 60 && steps < 3) { step(1 / 60); acc -= 1 / 60; steps++; }
        if (steps === 3) acc = 0;
        draw();
    }

    /* ---------- javni API ---------- */
    var PF = {
        ok: false,
        init: function (el) {
            canvas = el;
            try {
                gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
            } catch (e) { gl = null; }
            if (!gl) return false;
            try {
                prog = gl.createProgram();
                gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
                gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
            } catch (e) { console.warn(e); gl = null; return false; }
            ['uVP', 'uGrid', 'uSize', 'uBase', 'uDepth', 'uCyan', 'uInfra', 'uBg', 'uEye', 'uMouse', 'uRes', 'uDim', 'uFade']
                .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
            vao = gl.createVertexArray(); gl.bindVertexArray(vao);
            var cb = cube(); cubeN = cb.length / 6;
            var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, cb, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
            gridBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
            gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
            dynBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, dynBuf);
            gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(3, 1);
            gl.enable(gl.DEPTH_TEST);
            build();
            var rt;
            window.addEventListener('resize', function () {
                clearTimeout(rt);
                rt = setTimeout(function () { if (canvas.clientWidth !== W || Math.abs(canvas.clientHeight - HH) > 120) build(); }, 180);
            });
            window.addEventListener('pointermove', function (e) {
                var now = performance.now(), sx = e.clientX / W, sy = e.clientY / HH;
                if (mouse.on && mouse.last) {
                    var dts = Math.max(1, now - mouse.last) / 1000;
                    var sp = Math.hypot((sx - mouse.sx) * W, (sy - mouse.sy) * HH) / dts;
                    mouse.speed = Math.max(mouse.speed, Math.min(sp, 3000));
                }
                mouse.sx = sx; mouse.sy = sy; mouse.on = e.pointerType === 'mouse' ? 1 : mouse.on; mouse.last = now;
                if (e.pointerType === 'mouse') {
                    cam.my = (sx - 0.5) * 0.09; cam.mp = (sy - 0.5) * 0.05;
                }
            }, { passive: true });
            document.addEventListener('pointerleave', function () { mouse.on = 0; });
            window.addEventListener('blur', function () { mouse.on = 0; });
            PF.ok = true;
            return true;
        },
        start: function () {
            if (!gl || started) return;
            started = true;
            from.fill(0); tintFrom.fill(0);
            cur.t0 = clock;
            if (reduced) { hgt.set(to); }
        },
        shape: function (name, place) { setShape(name, place); },
        pulse: function (clientX, clientY) {
            if (!gl || !IVP) return;
            var g = screenToGrid(clientX / W, clientY / HH, IVP);
            ripples.push({ gx: g[0], gy: g[1], t: clock });
            if (ripples.length > 5) ripples.shift();
        },
        view: function (o) {
            if (o.yaw != null) cam.ty = o.yaw;
            if (o.pitch != null) cam.tp = o.pitch;
            if (o.dim != null) dimT = o.dim;
            if (o.fade != null) fadeT = o.fade;
        },
        run: function (on) {
            if (!gl) return;
            if (on && !running) { running = true; lastT = 0; raf = requestAnimationFrame(loop); }
            else if (!on && running) { running = false; cancelAnimationFrame(raf); }
        }
    };
    window.PinField = PF;
})();
