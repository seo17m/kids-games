/* 🧊 차곡차곡 블록 - 떨어지는 블록을 돌려 줄을 채우는 퍼즐 */
registerGame({
  id: 'drop', genre: 'puzzle', name: '차곡차곡 블록', emoji: '🧊', color: '#48DBFB',
  desc: '떨어지는 블록을 돌려서 빈틈없이!',
  howto: ['⬅️➡️ 로 옮기고 🔄 로 돌려요 (판을 톡 쳐도 돌아가요)', '가로 한 줄을 꽉 채우면 사라져요', '키보드: ←→ 이동, ↑ 돌리기, ↓ 빨리, 스페이스 뚝!'],
  init(api) {
    const { U, W } = api;
    const COLS = 10, ROWS = 18, C = 25, OX = 14, OY = 14;
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const P = [
      { m: [[1, 1, 1, 1]], c: '#48DBFB' }, { m: [[1, 1], [1, 1]], c: '#FECA57' },
      { m: [[0, 1, 0], [1, 1, 1]], c: '#A55EEA' }, { m: [[0, 0, 1], [1, 1, 1]], c: '#FF9F43' },
      { m: [[1, 0, 0], [1, 1, 1]], c: '#54A0FF' }, { m: [[0, 1, 1], [1, 1, 0]], c: '#1DD1A1' },
      { m: [[1, 1, 0], [0, 1, 1]], c: '#FF6B6B' },
    ];
    const BT = [{ x: 10, l: '⬅️', a: 'L' }, { x: 107, l: '➡️', a: 'R' }, { x: 204, l: '🔄', a: 'T' }, { x: 301, l: '⬇️', a: 'D' }];
    const rot = (m) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
    const rnd = () => { const p = U.pick(P); return { m: p.m, c: p.c }; };
    let cur, next = rnd(), acc = 0, level = 1, lines = 0, rep = 0, hold = 0, soft = false, dead = false, pressed = '';
    const parts = [], pops = [];

    function fits(m, x, y) {
      for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const gx = x + c, gy = y + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
        if (gy >= 0 && grid[gy][gx]) return false;
      }
      return true;
    }
    function spawn() {
      cur = { m: next.m, c: next.c, x: Math.floor((COLS - next.m[0].length) / 2), y: 0 };
      next = rnd();
      if (!fits(cur.m, cur.x, cur.y)) { dead = true; api.sfx('hit'); api.end(); }
    }
    function move(d) { if (!dead && fits(cur.m, cur.x + d, cur.y)) { cur.x += d; api.sfx('step'); } }
    function rotate() {
      if (dead) return;
      const m = rot(cur.m);
      for (const k of [0, -1, 1, -2, 2]) if (fits(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; api.sfx('step'); return; }
    }
    function lock() {
      cur.m.forEach((row, r) => row.forEach((v, c) => { if (v && cur.y + r >= 0) grid[cur.y + r][cur.x + c] = cur.c; }));
      let n = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (grid[r].every(Boolean)) {
          for (let c = 0; c < COLS; c++) U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, grid[r][c], 3, 140);
          grid.splice(r, 1); grid.unshift(Array(COLS).fill(null));
          n++; r++;
        }
      }
      if (n) {
        const pts = [0, 100, 300, 500, 800][n] * level;
        api.add(pts); lines += n;
        api.sfx(n >= 2 ? 'best' : 'coin');
        U.popups.add(pops, OX + COLS * C / 2, 200, (n >= 2 ? `${n}줄! ` : '') + '+' + pts, '#FFD23F');
        level = 1 + Math.floor(lines / 5);
      } else api.sfx('bounce');
      acc = 0;
      spawn();
    }
    function hard() {
      if (dead) return;
      let n = 0;
      while (fits(cur.m, cur.x, cur.y + 1)) { cur.y++; n++; }
      api.add(n);
      lock();
    }
    function block(ctx, x, y, c, s = C, a = 1) {
      ctx.globalAlpha = a;
      ctx.fillStyle = c; U.rr(ctx, x + 1, y + 1, s - 2, s - 2, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; U.rr(ctx, x + 4, y + 3, s - 8, 5, 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    spawn();

    return {
      down(x, y) {
        if (y > 485) {
          const b = BT.find((t) => x >= t.x && x <= t.x + 89);
          if (!b) return;
          pressed = b.a;
          if (b.a === 'L') { move(-1); hold = -1; rep = 0.22; }
          else if (b.a === 'R') { move(1); hold = 1; rep = 0.22; }
          else if (b.a === 'T') rotate();
          else soft = true;
        } else if (x < OX + COLS * C + 6) rotate();
      },
      up() { hold = 0; soft = false; pressed = ''; },
      key(k) {
        if (k === 'left') { move(-1); rep = 0.22; }
        else if (k === 'right') { move(1); rep = 0.22; }
        else if (k === 'up') rotate();
        else if (k === 'action') hard();
      },
      update(dt) {
        const dir = hold || (api.keys.has('left') ? -1 : api.keys.has('right') ? 1 : 0);
        if (dir) { rep -= dt; if (rep <= 0) { move(dir); rep = 0.06; } }
        const fast = soft || api.keys.has('down');
        const interval = fast ? 0.04 : Math.max(0.09, 0.7 - (level - 1) * 0.06);
        acc += dt;
        while (acc >= interval && !dead) {
          acc -= interval;
          if (fits(cur.m, cur.x, cur.y + 1)) { cur.y++; if (fast) api.add(1); }
          else { lock(); break; }
        }
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#1B2A49'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#0F1B33'; U.rr(ctx, OX - 4, OY - 4, COLS * C + 8, ROWS * C + 8, 10); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if ((r + c) % 2) ctx.fillRect(OX + c * C, OY + r * C, C, C);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) block(ctx, OX + c * C, OY + r * C, grid[r][c]);
        if (cur && !dead) {
          let gy = cur.y;
          while (fits(cur.m, cur.x, gy + 1)) gy++;
          cur.m.forEach((row, r) => row.forEach((v, c) => {
            if (!v) return;
            block(ctx, OX + (cur.x + c) * C, OY + (gy + r) * C, cur.c, C, 0.22);
            block(ctx, OX + (cur.x + c) * C, OY + (cur.y + r) * C, cur.c);
          }));
        }
        // 오른쪽 정보
        const px = 282;
        ctx.fillStyle = '#0F1B33'; U.rr(ctx, px, 10, 108, 110, 12); ctx.fill();
        U.text(ctx, '다음', px + 54, 28, 18, '#9FB3D9');
        const nw = next.m[0].length * 20, nh = next.m.length * 20;
        next.m.forEach((row, r) => row.forEach((v, c) => { if (v) block(ctx, px + 54 - nw / 2 + c * 20, 74 - nh / 2 + r * 20, next.c, 20); }));
        ctx.fillStyle = '#0F1B33'; U.rr(ctx, px, 130, 108, 130, 12); ctx.fill();
        U.text(ctx, '레벨', px + 54, 150, 18, '#9FB3D9'); U.text(ctx, String(level), px + 54, 180, 32, '#fff');
        U.text(ctx, '지운 줄', px + 54, 214, 18, '#9FB3D9'); U.text(ctx, String(lines), px + 54, 240, 28, '#fff');
        // 버튼
        for (const b of BT) {
          const on = pressed === b.a;
          ctx.fillStyle = '#0B1220'; U.rr(ctx, b.x, 496, 89, 92, 18); ctx.fill();
          ctx.fillStyle = on ? '#5C7CFA' : '#3B5BDB'; U.rr(ctx, b.x, 490 + (on ? 4 : 0), 89, 92, 18); ctx.fill();
          U.emoji(ctx, b.l, b.x + 44, 536 + (on ? 4 : 0), 40);
        }
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
