/* 🍓 과일 세 개 - 자리를 바꿔 같은 과일 3개를 맞추는 퍼즐 */
registerGame({
  id: 'match', genre: 'puzzle', name: '과일 세 개', emoji: '🍓', color: '#FF8FAB',
  desc: '같은 과일 3개를 나란히! 60초 도전',
  howto: ['과일을 옆 칸으로 밀어서 자리를 바꿔요', '같은 과일이 3개 이상 나란히 놓이면 팡!', '연속으로 터지면 점수가 2배, 3배! 시간은 60초'],
  init(api) {
    const { U, W } = api;
    const COLS = 7, ROWS = 8, C = 52, OX = (W - COLS * C) / 2, OY = 120, LIMIT = 60;
    const T = [['🍓', '#FFB3B3'], ['🍊', '#FFD8A8'], ['🍌', '#FFF3A3'], ['🥝', '#C8F0A8'], ['🍇', '#DCC6FF'], ['💎', '#B8E4FF']];
    let g, phase = 'idle', timer = 0, chain = 1, left = LIMIT, sel = null, drag = null;
    const parts = [], pops = [];

    function matches() {
      const m = new Set();
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const t = g[r][c].t;
        if (c + 2 < COLS && g[r][c + 1].t === t && g[r][c + 2].t === t) { m.add(r * COLS + c); m.add(r * COLS + c + 1); m.add(r * COLS + c + 2); }
        if (r + 2 < ROWS && g[r + 1][c].t === t && g[r + 2][c].t === t) { m.add(r * COLS + c); m.add((r + 1) * COLS + c); m.add((r + 2) * COLS + c); }
      }
      return m;
    }
    function swap(r1, c1, r2, c2) { const a = g[r1][c1]; g[r1][c1] = g[r2][c2]; g[r2][c2] = a; }
    function hasMove() {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          if (r + dr >= ROWS || c + dc >= COLS) continue;
          swap(r, c, r + dr, c + dc);
          const ok = matches().size > 0;
          swap(r, c, r + dr, c + dc);
          if (ok) return true;
        }
      }
      return false;
    }
    function build() {
      do {
        g = [];
        for (let r = 0; r < ROWS; r++) {
          g.push([]);
          for (let c = 0; c < COLS; c++) {
            let t;
            do { t = U.randInt(0, 5); }
            while ((c >= 2 && g[r][c - 1].t === t && g[r][c - 2].t === t) || (r >= 2 && g[r - 1][c].t === t && g[r - 2][c].t === t));
            g[r].push({ t, off: 0, rm: false });
          }
        }
      } while (!hasMove());
    }
    function startClear() {
      const m = matches();
      if (!m.size) {
        phase = 'idle';
        if (!hasMove()) { build(); U.popups.add(pops, W / 2, 300, '다시 섞었어요!', '#fff'); }
        return;
      }
      for (const k of m) {
        const r = Math.floor(k / COLS), c = k % COLS;
        g[r][c].rm = true;
        U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, T[g[r][c].t][1], 5, 150);
      }
      const pts = m.size * 10 * chain;
      api.add(pts);
      api.sfx(chain > 1 ? 'coin' : 'point');
      const k0 = [...m][0];
      U.popups.add(pops, OX + (k0 % COLS) * C + C / 2, OY + Math.floor(k0 / COLS) * C, (chain > 1 ? `${chain}연속! ` : '') + '+' + pts, '#FFD23F');
      phase = 'clearing'; timer = 0.2;
    }
    function collapse() {
      for (let c = 0; c < COLS; c++) {
        let w = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          const cell = g[r][c];
          if (cell.rm) continue;
          if (w !== r) { cell.off += (w - r) * C; g[w][c] = cell; }
          w--;
        }
        const n = w + 1;
        for (let r = w; r >= 0; r--) g[r][c] = { t: U.randInt(0, 5), off: n * C, rm: false };
      }
      phase = 'falling';
    }
    function trySwap(r, c, dr, dc) {
      const r2 = r + dr, c2 = c + dc;
      if (phase !== 'idle' || r2 < 0 || c2 < 0 || r2 >= ROWS || c2 >= COLS) return;
      swap(r, c, r2, c2);
      if (!matches().size) { swap(r, c, r2, c2); api.sfx('step'); return; }
      chain = 1;
      startClear();
    }
    const cellAt = (x, y) => {
      const c = Math.floor((x - OX) / C), r = Math.floor((y - OY) / C);
      return r >= 0 && c >= 0 && r < ROWS && c < COLS ? { r, c } : null;
    };
    build();

    return {
      down(x, y) {
        const p = cellAt(x, y);
        if (!p || phase !== 'idle') { sel = null; return; }
        if (sel && Math.abs(sel.r - p.r) + Math.abs(sel.c - p.c) === 1) { trySwap(sel.r, sel.c, p.r - sel.r, p.c - sel.c); sel = null; drag = null; return; }
        sel = p; drag = { x, y, r: p.r, c: p.c };
      },
      move(x, y) {
        if (!drag || !api.pointer.down) return;
        const dx = x - drag.x, dy = y - drag.y;
        if (Math.hypot(dx, dy) < 22) return;
        const d = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
        trySwap(drag.r, drag.c, d[0], d[1]);
        drag = null; sel = null;
      },
      up() { drag = null; },
      update(dt) {
        left -= dt;
        if (left <= 0) { left = 0; api.end(); return; }
        if (phase === 'clearing') { timer -= dt; if (timer <= 0) collapse(); }
        else if (phase === 'falling') {
          let moving = false;
          for (const row of g) for (const cell of row) if (cell.off > 0) { cell.off = Math.max(0, cell.off - 620 * dt); if (cell.off > 0) moving = true; }
          if (!moving) { chain++; startClear(); }
        }
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#FFE5EC'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W / 2, 72, 28, '#C9184A');
        ctx.fillStyle = '#FFB3C6'; U.rr(ctx, OX - 8, OY - 8, COLS * C + 16, ROWS * C + 16, 16); ctx.fill();
        ctx.save();
        ctx.beginPath(); ctx.rect(OX - 4, OY - 4, COLS * C + 8, ROWS * C + 8); ctx.clip();
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const cell = g[r][c], x = OX + c * C, y = OY + r * C - cell.off;
          const s = cell.rm ? Math.max(0, timer / 0.2) : 1;
          ctx.save(); ctx.translate(x + C / 2, y + C / 2); ctx.scale(s, s);
          ctx.fillStyle = T[cell.t][1]; U.rr(ctx, -C / 2 + 2, -C / 2 + 2, C - 4, C - 4, 12); ctx.fill();
          if (sel && sel.r === r && sel.c === c) { ctx.strokeStyle = '#2B2D42'; ctx.lineWidth = 4; U.rr(ctx, -C / 2 + 3, -C / 2 + 3, C - 6, C - 6, 11); ctx.stroke(); }
          U.emoji(ctx, T[cell.t][0], 0, 2, 32);
          ctx.restore();
        }
        ctx.restore();
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
