/* 🟦 블록 팡팡 - 블록을 판에 놓아 가로·세로 줄을 채우는 퍼즐 */
registerGame({
  id: 'blocks', genre: 'puzzle', name: '블록 팡팡', emoji: '🟦', color: '#74B9FF',
  desc: '블록을 놓아 한 줄을 채우면 팡!',
  howto: ['아래 블록을 끌어서 판 위에 놓아요', '가로나 세로 한 줄이 꽉 차면 사라져요', '놓을 곳이 없으면 끝! 여러 줄을 한 번에 지우면 보너스'],
  init(api) {
    const { U, W } = api;
    const N = 8, C = 42, OX = (W - N * C) / 2, OY = 56, TC = 20;
    const grid = Array.from({ length: N }, () => Array(N).fill(null));
    const line = (n, v) => Array.from({ length: n }, (_, i) => (v ? [0, i] : [i, 0]));
    const SHAPES = [
      [[0, 0]], line(2), line(2, 1), line(3), line(3, 1), line(4), line(4, 1), line(5), line(5, 1),
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], [[2, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]],
    ];
    const COLORS = ['#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1', '#54A0FF', '#A55EEA', '#FF78C4'];
    const SLOT_X = [70, 200, 330], SLOT_Y = 525;
    let tray = [], drag = null, dead = false, combo = 0;
    const parts = [], pops = [];

    function make() {
      const cells = U.pick(SHAPES);
      return { cells, color: U.pick(COLORS), w: Math.max(...cells.map((c) => c[0])) + 1, h: Math.max(...cells.map((c) => c[1])) + 1, used: false };
    }
    function can(p, gx, gy) {
      return p.cells.every(([x, y]) => gx + x >= 0 && gy + y >= 0 && gx + x < N && gy + y < N && !grid[gy + y][gx + x]);
    }
    function fitsAnywhere(p) {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (can(p, x, y)) return true;
      return false;
    }
    function refill() {
      for (let t = 0; t < 30; t++) {
        tray = [make(), make(), make()];
        if (tray.some(fitsAnywhere)) break;
      }
    }
    function dragCell() {
      const p = tray[drag.i];
      const px = drag.x - (p.w * C) / 2, py = drag.y - 90 - (p.h * C) / 2;
      return { gx: Math.round((px - OX) / C), gy: Math.round((py - OY) / C), px, py };
    }
    function place(p, gx, gy) {
      for (const [x, y] of p.cells) grid[gy + y][gx + x] = p.color;
      p.used = true;
      api.add(p.cells.length);
      const rows = [], cols = [];
      for (let i = 0; i < N; i++) {
        if (grid[i].every(Boolean)) rows.push(i);
        if (grid.every((r) => r[i])) cols.push(i);
      }
      const n = rows.length + cols.length;
      if (n) {
        combo++;
        const kill = new Set();
        rows.forEach((r) => { for (let c = 0; c < N; c++) kill.add(r * N + c); });
        cols.forEach((c) => { for (let r = 0; r < N; r++) kill.add(r * N + c); });
        for (const k of kill) {
          const r = Math.floor(k / N), c = k % N;
          U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, grid[r][c], 4, 140);
          grid[r][c] = null;
        }
        const pts = 10 * n * n + (combo > 1 ? combo * 5 : 0);
        api.add(pts);
        api.sfx(n > 1 ? 'best' : 'coin');
        U.popups.add(pops, W / 2, OY + N * C / 2, (n > 1 ? `${n}줄! ` : '') + '+' + pts, '#FFD23F');
      } else { combo = 0; api.sfx('step'); }
      if (tray.every((t) => t.used)) refill();
      if (!tray.some((t) => !t.used && fitsAnywhere(t))) { dead = true; api.sfx('hit'); api.end(); }
    }
    function drawPiece(ctx, p, x, y, c, alpha = 1) {
      ctx.globalAlpha = alpha;
      for (const [cx, cy] of p.cells) {
        ctx.fillStyle = p.color; U.rr(ctx, x + cx * c + 1, y + cy * c + 1, c - 2, c - 2, c * 0.2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; U.rr(ctx, x + cx * c + c * 0.15, y + cy * c + c * 0.12, c * 0.7, c * 0.18, 3); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    refill();

    return {
      down(x, y) {
        if (dead || y < 450) return;
        const i = SLOT_X.findIndex((sx) => Math.abs(x - sx) < 64);
        if (i >= 0 && !tray[i].used) { drag = { i, x, y }; api.sfx('point'); }
      },
      move(x, y) { if (drag) { drag.x = x; drag.y = y; } },
      up() {
        if (!drag) return;
        const p = tray[drag.i], { gx, gy } = dragCell();
        drag = null;
        if (can(p, gx, gy)) place(p, gx, gy);
      },
      update(dt) { U.updateParticles(parts, dt); U.popups.update(pops, dt); },
      afterEnd(dt) { U.updateParticles(parts, dt); },
      draw(ctx) {
        ctx.fillStyle = '#2D3561'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#232A52'; U.rr(ctx, OX - 8, OY - 8, N * C + 16, N * C + 16, 14); ctx.fill();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = OX + c * C, y = OY + r * C;
          ctx.fillStyle = grid[r][c] || '#3A4374';
          U.rr(ctx, x + 1, y + 1, C - 2, C - 2, 8); ctx.fill();
          if (grid[r][c]) { ctx.fillStyle = 'rgba(255,255,255,.3)'; U.rr(ctx, x + 6, y + 5, C - 12, 7, 3); ctx.fill(); }
        }
        // 받침 칸
        ctx.fillStyle = '#232A52'; U.rr(ctx, 8, 450, W - 16, 142, 18); ctx.fill();
        tray.forEach((p, i) => {
          if (p.used || (drag && drag.i === i)) return;
          drawPiece(ctx, p, SLOT_X[i] - (p.w * TC) / 2, SLOT_Y - (p.h * TC) / 2, TC, fitsAnywhere(p) ? 1 : 0.35);
        });
        if (drag) {
          const p = tray[drag.i], d = dragCell();
          if (can(p, d.gx, d.gy)) drawPiece(ctx, p, OX + d.gx * C, OY + d.gy * C, C, 0.4);
          drawPiece(ctx, p, d.px, d.py, C);
        }
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        U.text(ctx, combo > 1 ? `🔥 ${combo}연속!` : '블록을 끌어다 놓아요', W / 2, 26, 20, '#fff');
      },
    };
  },
});
