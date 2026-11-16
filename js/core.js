'use strict';
/* =========================================================
   뿅뿅 게임랜드 - 공통 엔진
   - Store : 이 기기에 저장 (닉네임, 최고 점수, 소리 설정)
   - Sound : 효과음 (파일 없이 소리를 직접 만듦)
   - U     : 게임에서 자주 쓰는 도우미 함수
   - GameRunner : 캔버스 크기 맞추기, 입력, 게임 루프
   ========================================================= */

const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('kg_' + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('kg_' + key, JSON.stringify(value)); } catch (e) { /* 저장 불가 환경 */ }
  },
};

const Best = {
  get(id) { return Store.get('best_' + id, 0); },
  submit(id, score) {
    const prev = Best.get(id);
    if (score > prev) { Store.set('best_' + id, score); return true; }
    return false;
  },
  plays(id) { return Store.get('plays_' + id, 0); },
  addPlay(id) { Store.set('plays_' + id, Best.plays(id) + 1); },
};

/* ---------------- 효과음 ---------------- */
const Sound = (() => {
  let ac = null;
  let muted = Store.get('muted', false);
  function ensure() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function tone(freq, dur, type = 'square', vol = 0.06, slide = 0) {
    if (muted) return;
    ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const seq = (notes, gap, type, vol) => notes.forEach((f, i) => setTimeout(() => tone(f, gap / 1000 + 0.05, type, vol), i * gap));
  const sfx = {
    point: () => tone(880, 0.08, 'square', 0.04),
    coin: () => seq([988, 1319], 60, 'square', 0.04),
    jump: () => tone(380, 0.15, 'square', 0.04, 380),
    flap: () => tone(500, 0.08, 'triangle', 0.08, 250),
    bounce: () => tone(520, 0.05, 'triangle', 0.09),
    shoot: () => tone(1200, 0.06, 'square', 0.02, -700),
    hit: () => tone(220, 0.22, 'sawtooth', 0.06, -140),
    boom: () => tone(110, 0.35, 'sawtooth', 0.07, -60),
    step: () => tone(660, 0.04, 'triangle', 0.07),
    start: () => seq([523, 659, 784], 100, 'square', 0.04),
    over: () => seq([392, 330, 262], 150, 'triangle', 0.08),
    best: () => seq([523, 659, 784, 1047], 90, 'square', 0.04),
  };
  return {
    play(name) { if (sfx[name]) sfx[name](); },
    note(freq, dur = 0.3) { tone(freq, dur, 'triangle', 0.12); },
    unlock: ensure,
    get muted() { return muted; },
    toggle() { muted = !muted; Store.set('muted', muted); return muted; },
  };
})();

/* ---------------- 장르 & 게임 등록 ---------------- */
const GENRES = [
  { id: 'arcade', name: '아케이드', emoji: '🕹️', color: '#FF6B6B', desc: '오락실 느낌 그대로! 피하고, 쏘고, 달려요' },
  { id: 'puzzle', name: '퍼즐', emoji: '🧩', color: '#4D96FF', desc: '머리를 굴려 딱 맞춰요' },
  { id: 'brain', name: '두뇌·기억', emoji: '🧠', color: '#9B5DE5', desc: '기억력과 계산력 대결' },
  { id: 'reflex', name: '순발력', emoji: '⚡', color: '#F4A300', desc: '누가 누가 더 빠를까?' },
  { id: 'sports', name: '스포츠', emoji: '⚽', color: '#2EC4B6', desc: '공 차고, 던지고, 넣어요' },
];
const GAMES = [];
function registerGame(def) { GAMES.push(def); }

/* ---------------- 도우미 ---------------- */
const W = 400, H = 600;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Segoe UI Symbol",sans-serif';
const U = {
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rectHit: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  emoji(ctx, ch, x, y, size) {
    ctx.save();
    ctx.font = `${size}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(ch, x, y);
    ctx.restore();
  },
  text(ctx, str, x, y, size, color = '#2B2D42', align = 'center', stroke) {
    ctx.save();
    ctx.font = `${size}px Jua, 'Malgun Gothic', sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    if (stroke) { ctx.lineWidth = 5; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  },
  rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
  hearts(ctx, n, max, x = 22, y = 24) {
    for (let i = 0; i < max; i++) U.emoji(ctx, i < n ? '❤️' : '🤍', x + i * 26, y, 20);
  },
  /* 버튼: b = {x, y, w, h, label, color, size, tc} */
  hit: (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  quad: (i) => ({ x: 16 + (i % 2) * 192, y: 392 + Math.floor(i / 2) * 98, w: 176, h: 84 }),
  btn(ctx, b, down) {
    const r = b.r || 18, o = down ? 4 : 0;
    ctx.fillStyle = '#2B2D42'; U.rr(ctx, b.x, b.y + 5, b.w, b.h, r); ctx.fill();
    ctx.fillStyle = b.color || '#fff'; U.rr(ctx, b.x, b.y + o, b.w, b.h, r); ctx.fill();
    if (b.label) U.text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + o + 2, b.size || 30, b.tc || '#2B2D42');
  },
  /* 맞았어요/틀렸어요 표시: fb = {t, ok} */
  mark(ctx, fb, y = 250) {
    if (!fb || fb.t <= 0) return;
    ctx.globalAlpha = Math.min(1, fb.t * 4);
    U.emoji(ctx, fb.ok ? '⭕' : '❌', W / 2, y, 110);
    ctx.globalAlpha = 1;
  },
  shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  /* 남은 시간 막대 (frac: 0~1) */
  timeBar(ctx, frac, y = 16) {
    frac = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = 'rgba(255,255,255,.95)'; U.rr(ctx, 20, y, W - 40, 22, 11); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#00B894' : frac > 0.25 ? '#FDCB6E' : '#FF7675';
    if (frac > 0.02) { U.rr(ctx, 23, y + 3, (W - 46) * frac, 16, 8); ctx.fill(); }
  },
  /* 터지는 효과 */
  burst(list, x, y, color, n = 10, speed = 180) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = U.rand(speed * 0.3, speed);
      list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(0.3, 0.6), color, r: U.rand(2, 5) });
    }
  },
  updateParticles(list, dt, gravity = 300) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += gravity * dt; p.life -= dt;
      if (p.life <= 0) list.splice(i, 1);
    }
  },
  drawParticles(ctx, list) {
    for (const p of list) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2.5));
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  /* 떠오르는 점수 글자 */
  popups: {
    add(list, x, y, str, color = '#fff') { list.push({ x, y, str, color, life: 0.8 }); },
    update(list, dt) { for (let i = list.length - 1; i >= 0; i--) { list[i].y -= 50 * dt; list[i].life -= dt; if (list[i].life <= 0) list.splice(i, 1); } },
    draw(ctx, list) {
      for (const p of list) { ctx.globalAlpha = Math.min(1, p.life * 2); U.text(ctx, p.str, p.x, p.y, 24, p.color, 'center', '#2B2D42'); }
      ctx.globalAlpha = 1;
    },
  },
};

/* ---------------- 게임 실행기 ---------------- */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'action', Enter: 'action',
};

class GameRunner {
  constructor(canvas, stage, hooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stage = stage;
    this.hooks = hooks; // { onScore(n), onOver(score) }
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, down: false };
    this.running = false;
    this.game = null;
    this.score = 0;
    this.scale = 1;
    this._tick = this._tick.bind(this);
    this._bind();
    this.fit();
  }

  _toLocal(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }

  _bind() {
    const c = this.canvas;
    this._down = (e) => {
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      const p = this._toLocal(e);
      Object.assign(this.pointer, p, { down: true });
      this._swipe = { x: p.x, y: p.y, t: performance.now() };
      if (this.running && this.game.down) this.game.down(p.x, p.y);
    };
    this._move = (e) => {
      const p = this._toLocal(e);
      Object.assign(this.pointer, p);
      if (this.running && this.game.move) this.game.move(p.x, p.y);
    };
    this._up = (e) => {
      const p = this._toLocal(e);
      this.pointer.down = false;
      if (this.running && this.game.up) this.game.up(p.x, p.y);
      const s = this._swipe;
      this._swipe = null;
      if (s && this.running && this.game.swipe) {
        const dx = p.x - s.x, dy = p.y - s.y;
        if (Math.hypot(dx, dy) > 25 && performance.now() - s.t < 600) {
          this.game.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }
      }
    };
    this._moveSwipe = (e) => {
      // 손가락을 떼지 않아도 충분히 밀면 바로 방향 전환 (지렁이 게임처럼 빠른 게임용)
      const s = this._swipe;
      if (!s || !this.running || !this.game.swipe) return;
      const p = this._toLocal(e);
      const dx = p.x - s.x, dy = p.y - s.y;
      if (Math.hypot(dx, dy) > 30) {
        this.game.swipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        this._swipe = { x: p.x, y: p.y, t: performance.now(), used: true };
      }
    };
    this._keydown = (e) => {
      const k = KEYMAP[e.code];
      if (!k || !this.running) return;
      e.preventDefault();
      if (!this.keys.has(k)) {
        this.keys.add(k);
        if (this.game.key) this.game.key(k);
      }
    };
    this._keyup = (e) => {
      const k = KEYMAP[e.code];
      if (k) { this.keys.delete(k); if (this.running && this.game.keyup) this.game.keyup(k); }
    };
    this._blur = () => this.keys.clear();
    c.addEventListener('pointerdown', this._down);
    c.addEventListener('pointermove', this._move);
    c.addEventListener('pointermove', this._moveSwipe);
    c.addEventListener('pointerup', this._up);
    c.addEventListener('pointercancel', this._up);
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    window.addEventListener('blur', this._blur);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.overTimer);
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    window.removeEventListener('blur', this._blur);
  }

  fit() {
    const r = this.stage.getBoundingClientRect();
    const availW = Math.max(100, r.width - 20 - 6);
    const availH = Math.max(100, r.height - 20 - 6 - 6);
    const s = Math.min(availW / W, availH / H);
    const cssW = Math.floor(W * s), cssH = Math.floor(H * s);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.scale = this.canvas.width / W;
    this._draw();
  }

  /* 게임 준비 (화면에 첫 모습만 그림) */
  prepare(def) {
    this.def = def;
    this.running = false;
    this.ended = false;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.overTimer);
    this.score = 0;
    this.keys.clear();
    const self = this;
    const api = {
      W, H, U,
      keys: this.keys,
      pointer: this.pointer,
      sfx: (n) => Sound.play(n),
      note: (f, d) => Sound.note(f, d),
      get score() { return self.score; },
      set(n) { n = Math.max(0, Math.floor(n)); if (n !== self.score) { self.score = n; self.hooks.onScore(n); } },
      add(n) { api.set(self.score + n); },
      end() { self._end(); },
    };
    this.game = def.init(api);
    this.hooks.onScore(0);
    this._draw();
  }

  run() {
    if (!this.game) return;
    this.running = true;
    this.last = performance.now();
    if (this.game.start) this.game.start();
    this.raf = requestAnimationFrame(this._tick);
  }

  _end() {
    if (this.ended) return;
    this.ended = true;
    // 부딪히는 장면을 잠깐 보여준 뒤 결과 화면으로
    this.overTimer = setTimeout(() => {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.hooks.onOver(this.score);
    }, 700);
  }

  _tick(now) {
    if (!this.running) return;
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    if (!this.ended) this.game.update(dt);
    else if (this.game.afterEnd) this.game.afterEnd(dt);
    this._draw();
    this.raf = requestAnimationFrame(this._tick);
  }

  _draw() {
    if (!this.game) return;
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    this.game.draw(ctx);
    ctx.restore();
  }
}
