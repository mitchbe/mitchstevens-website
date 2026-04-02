'use strict';

/**
 * <x-song> — animated orrery-style sine-wave banner.
 *
 * Perf features:
 *  - Cached front/back draw orders (recompute on body changes).
 *  - 256-entry LUT for |cos|^0.9 (luminance).
 *  - Precomputed cos/sin step & half-step per body; exact mid-angle.
 *  - Stashed per-frame constants; minimal inner-loop branching.
 *  - Hover easing pause when near target.
 *
 * Throttling / gating:
 *  - If the tab is HIDDEN: fully STOP animation (0 fps).
 *  - If the element is OFF-SCREEN (IO not intersecting) and motion="auto": STOP.
 *  - Only animates when: document is visible AND (IO intersecting OR motion="force").
 *
 * Visual-stability:
 *  - luminance buckets, bucket hysteresis (>=2), exact mid-angle splits.
 *
 *  Copyright 2025 - Mitch Stevens @ Trefen Inc.
 */
customElements.define('x-song', class extends HTMLElement {
  static get observedAttributes() {
    return [
      'height','hue','speed','amp','motion','minamp',
      'outercycles','cyclesgamma','maxcycles','hover-speed','hover-sat',
      'count','contrast','brightness','sat'
    ];
  }

  static get L_BUCKETS()   { return 64; }
  static get BUCKET_HYST() { return 2; }

  constructor(){
    super();
    this.attachShadow({ mode:'open' }).innerHTML = `
      <style>
        :host { display:block; pointer-events:auto; }
        canvas { width:100%; display:block; background:transparent; pointer-events:auto; }
        @media (prefers-reduced-motion: reduce) {
          :host([motion="auto"]) canvas { opacity:.85; }
        }
      </style>
      <canvas></canvas>
    `;

    // State
    this._connected = false;
    this._hover = false;

    // Motion prefs
    this._mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reduced = this._mediaReduced.matches;
    this._mediaReduced.addEventListener?.('change', e => { this._reduced = e.matches; this._evaluateMotion(); });

    // Rendering
    this.canvas = null;
    this._ctx = null;
    this._running = false;
    this._raf = null;

    // Timing
    this._targetFps = 30;              // active cadence
    this._frameInterval = 1000 / 30;   // ms per frame

    // Dynamics
    this._effSpeed = 1;
    this._effTarget = 1;

    // Model
    this._rand = (s=>()=>((s^=s<<13,s^=s>>>17,s^=s<<5)>>>0)/4294967296)(1337);
    this.bodies = [];
    this.maxA = 1;
    this.axis = 0;
    this.breath = 0;

    // Cached orders
    this._orderBack = [];   // big -> small
    this._orderFront = [];  // small -> big

    // Per-frame precompute
    this._env = null;
    this._widthPx = 0;

    // HSL suffix cache
    this._lSuffixCache = null;

    // LUT for |cos|^0.9
    this._magLut = null;

    // IO / visibility flags
    this._intersecting = true; // assume true until IO fires to avoid early stop loops
  }

  // ---------- Attribute helpers ----------
  
  get COUNT()       { return Math.max(1, parseInt(this.getAttribute('count') || '6', 10)); }
  get HUE()         { return parseFloat(this.getAttribute('hue')   || '200'); }
  get SPEED()       { return parseFloat(this.getAttribute('speed') || '0.6'); }
  get AMP()         { return Math.max(0, Math.min(1, parseFloat(this.getAttribute('amp') || '0.9'))); }
  get MOTION()      { return (this.getAttribute('motion') || 'auto').toLowerCase(); }
  get MINAMP()      { return Math.max(0, parseFloat(this.getAttribute('minamp') || '3')); }
  get OUTERCYCLES() { return Math.max(0.2, parseFloat(this.getAttribute('outercycles') || '1.2')); }
  get CYCLESGAMMA() { return Math.max(0,   parseFloat(this.getAttribute('cyclesgamma') || '0.8')); }
  get MAXCYCLES()   { return Math.max(1,   parseFloat(this.getAttribute('maxcycles')   || '56')); }
  get HOVERSPEED()  { return parseFloat(this.getAttribute('hover-speed') || '1'); }
  get HOVERSAT()    { return parseFloat(this.getAttribute('hover-sat')   || '12'); }
  get CONTRAST()    { return Math.max(0, parseFloat(this.getAttribute('contrast')   || '24')); }
  get BRIGHTNESS()  { const v = parseFloat(this.getAttribute('brightness') || '50'); return Math.min(100, Math.max(0, v)); }
  get SAT()         { const v = parseFloat(this.getAttribute('sat') || '42'); return Math.min(100, Math.max(0, v)); }

  get heightPx() {
    const raw = (this.getAttribute('height') || '32').trim();
    if (raw.endsWith('vh')) return innerHeight * parseFloat(raw) / 100;
    if (raw.endsWith('vw')) return innerWidth  * parseFloat(raw) / 100;
    return parseInt(raw, 10);
  }

  // ---------- Lifecycle ----------
  
  connectedCallback() {
    this.canvas = this.shadowRoot.querySelector('canvas');
    this._ctx = this.canvas.getContext('2d', { alpha:true, desynchronized:true });
    this._connected = true;

    // Hover -> adjust speed/sat
    const onEnter = () => { this._hover = true;  this._retargetSpeed(); };
    const onLeave = () => { this._hover = false; this._retargetSpeed(); };
    this.canvas.addEventListener('pointerenter', onEnter);
    this.canvas.addEventListener('pointerleave', onLeave);
    this.canvas.addEventListener('mouseenter', onEnter);
    this.canvas.addEventListener('mouseleave', onLeave);

    // Resize
    this._onResize = () => this._reframe();
    window.addEventListener('resize', this._onResize, { passive:true });

    // Document visibility -> hard stop at 0 fps when hidden
    this._onVisibility = () => {
      if (document.hidden) {
        // 0 fps: stop loop entirely
        this._stop();
      } else {
        // visible: if we're supposed to be animating, (re)start
        this._evaluateMotion(); // decides start vs stop based on IO/mode
      }
    };
    document.addEventListener('visibilitychange', this._onVisibility, { passive:true });

    // Viewport visibility (IO)
    this._setupIntersection();

    // Init model + caches
    this._buildBodies();
    this._ensureLSuffixCache();
    this._ensureMagLut();
    this._reframe();
    this._retargetSpeed();
    this._evaluateMotion();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this._io) this._io.disconnect();
    this._stop();
    this._connected = false;
  }

  attributeChangedCallback() {
    if (!this._connected) return;
    this._buildBodies();
    this._reframe();
    this._evaluateMotion();
    this._retargetSpeed();
  }

  // ---------- Motion / visibility ----------
  
  _setupIntersection() {
    if (this._io) this._io.disconnect();
    this._io = new IntersectionObserver(([entry])=>{
      this._intersecting = !!entry?.isIntersecting;
      if (this.MOTION !== 'auto') return; // honor explicit modes elsewhere
      // Auto-mode: start only if element is on-screen AND document visible
      if (this._intersecting && !document.hidden) this._start();
      else this._stop();
    }, { threshold:0 });
    this._io.observe(this);
  }

  _evaluateMotion() {
    const mode = this.MOTION;

    // If hidden, always stop (0 fps).
    if (document.hidden) { this._stop(); return; }

    // Respect user/system motion prefs
    if (mode==='reduce' || this._reduced){ this._stop(); this._drawStatic(); return; }
    if (mode==='force'){ this._start(); return; }

    // Auto: only run if on-screen
    if (mode==='auto'){
      if (this._intersecting) this._start();
      else this._stop();
      return;
    }

    // Default fallback
    this._start();
  }

  // ---------- Reframe ----------
  
  _reframe() {
    const dpr = Math.max(1, Math.floor(devicePixelRatio || 1));
    const cssH = Math.max(1, this.heightPx);
    const cssW = this.offsetWidth || this.clientWidth || 300;

    // CSS size
    this.canvas.style.height = `${cssH}px`;
    this.canvas.style.width  = `100%`;

    // Backing store size (device pixels)
    const width  = Math.floor(cssW * dpr);
    const height = Math.floor(cssH * dpr);
    this.canvas.width  = width;
    this.canvas.height = height;

    // 2D transform to CSS pixels
    const ctx = this._ctx; if (!ctx) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);

    this.axis = cssH / 2;
    this.breath = this.axis * 0.98;

    // Envelope LUT over CSS pixels
    const w = Math.max(1, Math.floor(width / dpr));
    this._widthPx = w;

    const env = new Float32Array(w);
    if (w === 1) env[0] = 0;
    else {
      const denom = (w - 1);
      for (let x=0; x<w; x++){
        const t = x / denom;
        env[x]  = Math.sin(Math.PI * t);
      }
    }
    this._env = env;

    // Body precompute
    const maxA = this.maxA || 1;
    const oc = this.OUTERCYCLES;
    const cg = this.CYCLESGAMMA;
    const maxCycles = this.MAXCYCLES;
    const ampScale  = this.breath * this.AMP;

    for (const b of this.bodies) {
      const ratio      = maxA / b.a;
      const cyclesRaw  = oc * Math.pow(ratio, 1.5 * cg);
      const cycles     = Math.min(maxCycles, cyclesRaw);
      b.kx             = (2*Math.PI*cycles)/w;
      b.A0             = ampScale * (b.a / maxA);
      b.hue            = this._hue(b.index);
      b.baseL          = this._baseLum(b.index);
      b._styleCacheSat = null;
      b._styleCache    = null;

      // Precompute step and half-step sines/cosines (math trims)
      b.cos_d = Math.cos(b.kx);
      b.sin_d = Math.sin(b.kx);
      b.cos_h = Math.cos(b.kx * 0.5);
      b.sin_h = Math.sin(b.kx * 0.5);
    }

    // Rebuild cached draw orders (perf)
    this._orderBack  = [...this.bodies].sort((a,b)=> b.a - a.a); // big→small
    this._orderFront = [...this.bodies].sort((a,b)=> a.a - b.a); // small→big

    this._drawStatic();
  }

  // ---------- Math / color helpers ----------
  
  _omegaKepler(a) { return Math.pow(a, -1.5); }
  _baseSat()      { const base = this.SAT; return this._hover ? Math.min(100, base + this.HOVERSAT) : base; }
  _baseLum(i)     { return this.BRIGHTNESS - i*1.2; }
  _hue(i)         { return this.HUE + i*6; }
  _titiusBodeA(i) { if (i===0) return 0.4; return 0.4 + 0.3 * Math.pow(2, i-1); }

  _ensureLSuffixCache(){
    if (this._lSuffixCache) return;
    const N     = this.constructor.L_BUCKETS;
    const cache = new Array(N);
    for (let i=0; i<N; i++){
      const L  = Math.round((i*100)/(N-1));
      cache[i] = `${L}%)`;
    }
    this._lSuffixCache = cache;
  }

  _ensureMagLut(){
    if (this._magLut) return;
    const lut = new Float32Array(256);
    for (let i=0; i<256; i++){
      const x = i / 255;           // x in [0,1]
      lut[i]  = Math.pow(x, 0.9);  // |cos|^0.9
    }
    this._magLut = lut;
  }

  _magFromCos(c) { // fast |cos|^0.9 via LUT
    const x   = Math.abs(c);
    const idx = (x * 255) | 0; // 0..255
    return this._magLut[idx];
  }

  _lToBucket(L) {
    const N       = this.constructor.L_BUCKETS;
    const clamped = Math.max(0, Math.min(100, L));
    return Math.round((clamped * (N - 1)) / 100);
  }

  _ensureBodyStyleCacheForSat(b, satNow) {
    if (b._styleCache && b._styleCacheSat === satNow) return;
    const N        = this.constructor.L_BUCKETS;
    const arr      = new Array(N);
    const prefix   = `hsl(${b.hue}, ${satNow}%, `;
    const suffixes = this._lSuffixCache;
    for (let i=0; i<N; i++) arr[i] = prefix + suffixes[i];
    b._styleCache    = arr;
    b._styleCacheSat = satNow;
  }

  _shadeLumFromCos(L0, c, contrast) {
    const mag     = this._magFromCos(c); // LUT
    const rising  = (c < 0);
    const kBright = this.BRIGHTNESS / 50;
    const kDark   = (100 - this.BRIGHTNESS) / 50;
    const k       = rising ? kBright : kDark;
    const sign    = rising ? +1 : -1;
    return L0 + sign * contrast * k * mag;
  }

  // ---------- Model ----------
  
  _buildBodies() {
    const n = this.COUNT;
    this.bodies = Array.from({length:n}, (_,i)=>({
      index:i, a:this._titiusBodeA(i), phase:this._rand()*1000, dir:+1,
      kx:0, A0:0, hue:0, baseL:0, _styleCacheSat:null, _styleCache:null,
      cos_d:1, sin_d:0, cos_h:1, sin_h:0
    }));

    // Spin smallest three in opposite direction
    const bySmallest = [...this.bodies].sort((a,b)=>a.a-b.a);
    for (let i=0; i<Math.min(3, bySmallest.length); i++) bySmallest[i].dir = -1;
    this.maxA = this.bodies.reduce((m,b)=>Math.max(m,b.a), 0) || 1;

    // Orders will be set on next _reframe
    this._orderBack.length  = 0;
    this._orderFront.length = 0;
  }

  _retargetSpeed() {
    const base = Number.isFinite(this.SPEED) ? this.SPEED : 1;
    const hov  = Number.isFinite(this.HOVERSPEED) ? this.HOVERSPEED : base;
    this._effTarget = this._hover ? hov : base;
    if (!Number.isFinite(this._effSpeed)) this._effSpeed = this._effTarget;
  }

  // ---------- Animation (main-thread) ----------
  
  _start() {
    // Don’t start if hidden or already running
    if (this._running || document.hidden) return;
    this._running = true;
    let last = performance.now();
    const loop = (t) => {
      if (!this._running) return;
      if (document.hidden) { // hard stop if the tab becomes hidden mid-loop
        this._stop();
        return;
      }
      if (t - last >= this._frameInterval) {
        last = t;
        this._drawFrame();
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  _stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _drawStatic() { this._drawFrame(); }

  _drawFrame() {
    const ctx = this._ctx; if (!ctx) return;
    const dpr = Math.max(1, Math.floor(devicePixelRatio || 1));
    const w   = this._widthPx || Math.floor(this.canvas.width / dpr);
    const h   = Math.floor(this.canvas.height / dpr);

    ctx.clearRect(0,0,w,h);
    // Integer-ish width to keep AA cost down on Chrome
    ctx.lineWidth = 2 
    ctx.lineCap   = 'round'; ctx.lineJoin = 'round';

    // Ease speed (skip work if already converged)
    if (Math.abs(this._effTarget - this._effSpeed) > 1e-4) {
      this._effSpeed += (this._effTarget - this._effSpeed) * 0.25;
    }
    const baseTempo = this._effSpeed * 0.008;

    // Stash per-frame constants
    const env      = this._env || new Float32Array(w);
    const minAmp   = this.MINAMP;
    const axis     = this.axis;
    const eps      = 1e-6;
    const contrast = this.CONTRAST;
    const satNow   = this._baseSat();

    // Ensure per-body style caches for the current saturation
    for (const b of this.bodies) this._ensureBodyStyleCacheForSat(b, satNow);

    const backOrder  = this._orderBack.length  ? this._orderBack  : [...this.bodies].sort((a,b)=> b.a - a.a);
    const frontOrder = this._orderFront.length ? this._orderFront : [...this.bodies].sort((a,b)=> a.a - b.a);

    // BACK — batched strokes with bucket hysteresis + exact mid-angle check
    for (const b of backOrder) {
      const kx=b.kx, A0=b.A0, L0=b.baseL, styles=b._styleCache;
      const cos_d=b.cos_d, sin_d=b.sin_d, cos_h=b.cos_h, sin_h=b.sin_h;

      let theta_prev = b.phase;
      let sin_prev   = Math.sin(theta_prev), cos_prev = Math.cos(theta_prev);
      let envPrev    = env[0], ampPrev = Math.max(A0*envPrev, minAmp*envPrev);
      let yPrev      = axis + sin_prev*ampPrev;

      let runActive=false, runBucket=-1;

      for (let x=1; x<w; x++) {
        // Recurrence step
        const sin_curr = sin_prev * cos_d + cos_prev * sin_d;
        const cos_curr = cos_prev * cos_d - sin_prev * sin_d;

        const envCurr = env[x];
        const ampCurr = Math.max(A0*envCurr, minAmp*envCurr);
        const yCurr   = axis + sin_curr*ampCurr;

        // Exact mid-angle via cos_h/sin_h
        const cMidExact = (cos_prev * cos_h) - (sin_prev * sin_h);
        let L           = this._shadeLumFromCos(L0, cMidExact, contrast);
        let bucket      = this._lToBucket(L);

        if (!runActive){
          ctx.beginPath(); ctx.strokeStyle = styles[bucket];
          ctx.moveTo(x-1, yPrev); ctx.lineTo(x, yCurr);
          runActive = true; runBucket = bucket;
        } else {
          if (Math.abs(bucket - runBucket) < this.constructor.BUCKET_HYST) {
            ctx.lineTo(x, yCurr);
          } else {
            ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = styles[bucket];
            ctx.moveTo(x-1, yPrev); ctx.lineTo(x, yCurr);
            runBucket = bucket;
          }
        }

        // Slide window
        sin_prev = sin_curr; cos_prev = cos_curr;
        envPrev  = envCurr; ampPrev = ampCurr; yPrev = yCurr;
      }
      if (runActive) ctx.stroke();
    }

    // FRONT — rising-only (cos < -eps), also batched
    for (const b of frontOrder) {
      const kx=b.kx, A0=b.A0, L0=b.baseL, styles=b._styleCache;
      const cos_d=b.cos_d, sin_d=b.sin_d, cos_h=b.cos_h, sin_h=b.sin_h;

      let theta_prev = b.phase;
      let sin_prev   = Math.sin(theta_prev), cos_prev = Math.cos(theta_prev);

      let havePrev=false, xPrev=0, yPrev=0;
      let runActive=false, runBucket=-1;

      for (let x=0; x<w; x++) {
        const envCurr = env[x];
        const ampCurr = Math.max(A0*envCurr, minAmp*envCurr);
        const yCurr   = axis + sin_prev*ampCurr;

        const isFrontRising = (cos_prev < -eps);
        if (isFrontRising) {
          if (!havePrev) { havePrev=true; xPrev=x; yPrev=yCurr; }
          else {
            // Mid-angle exact using cos_h/sin_h
            const cMidExact = (cos_prev * cos_h) - (sin_prev * sin_h);
            let L      = this._shadeLumFromCos(L0, cMidExact, contrast);
            let bucket = this._lToBucket(L);

            if (!runActive) {
              ctx.beginPath(); ctx.strokeStyle = styles[bucket];
              ctx.moveTo(xPrev, yPrev); ctx.lineTo(x, yCurr);
              runActive = true; runBucket = bucket;
            } else {
              if (Math.abs(bucket - runBucket) < this.constructor.BUCKET_HYST) {
                ctx.lineTo(x, yCurr);
              } else {
                ctx.stroke();
                ctx.beginPath(); ctx.strokeStyle = styles[bucket];
                ctx.moveTo(xPrev, yPrev); ctx.lineTo(x, yCurr);
                runBucket = bucket;
              }
            }

            xPrev=x; yPrev=yCurr;
          }
        } else {
          havePrev = false;
          if (runActive){ ctx.stroke(); runActive=false; runBucket=-1; }
        }

        // Advance via recurrence
        const sin_next = sin_prev * cos_d + cos_prev * sin_d;
        const cos_next = cos_prev * cos_d - sin_prev * sin_d;
              sin_prev = sin_next; cos_prev = cos_next;
      }
      if (runActive) ctx.stroke();
    }

    // Advance phases
    for (const b of this.bodies) {
      b.phase += b.dir * baseTempo * this._omegaKepler(b.a);
    }
  }
});

