/* 🔢 숫자 합체 - 같은 숫자를 밀어서 합치는 퍼즐 */
registerGame({
  id: 'merge', genre: 'puzzle', name: '숫자 합체', emoji: '🔢', color: '#FDCB6E',
  desc: '같은 숫자끼리 쾅! 더 큰 숫자로',
  howto: ['화면을 밀거나 방향키로 모든 숫자를 움직여요', '같은 숫자가 만나면 합쳐져서 2배!', '칸이 꽉 차서 못 움직이면 끝'],
  init(api) {
    const { U, W } = api;
    const N = 4, C = 84, G = 8, OX = (W - (N * C + (N + 1) * G)) / 2, OY = 130;
    const g = Array.from({ length: N }, () => Array(N).fill(0));
    const pop = Array.from({ length: N }, () => Array(N).fill(0));
    let swiped = false, dead = false, top = 2;

    function add() {
      const e = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!g[r][c]) e.push([r, c]);
      if (!e.length) return;
      const [r, c] = U.pick(e);
      g[r][c] = Math.random() < 0.9 ? 2 : 4;
      pop[r][c] = 0.15;
    }
    function canMove() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (!g[r][c]) return true;
        if (c < N - 1 && g[r][c] === g[r][c + 1]) return true;
        if (r < N - 1 && g[r][c] === g[r + 1][c]) return true;
      }
      return false;
    }
    function slide(dir) {
      if (dead) return;
      let moved = false, gained = 0;
      for (let i = 0; i < N; i++) {
        const cells = [];
        for (let j = 0; j < N; j++) cells.push(dir === 'left' ? [i, j] : dir === 'right' ? [i, N - 1 - j] : dir === 'up' ? [j, i] : [N - 1 - j, i]);
        const vals = cells.map(([r, c]) => g[r][c]).filter(Boolean);
        const out = [], merged = [];
        for (let k = 0; k < vals.length; k++) {
          if (vals[k] === vals[k + 1]) { out.push(vals[k] * 2); merged.push(out.length - 1); gained += vals[k] * 2; k++; }
          else out.push(vals[k]);
        }
        for (let j = 0; j < N; j++) {
          const [r, c] = cells[j], v = out[j] || 0;
          if (g[r][c] !== v) moved = true;
          g[r][c] = v;
          if (merged.includes(j)) { pop[r][c] = 0.18; top = Math.max(top, v); }
        }
      }
      if (!moved) return;
      if (gained) { api.add(gained); api.sfx(gained >= 64 ? 'coin' : 'point'); } else api.sfx('step');
      add();
      if (!canMove()) { dead = true; api.sfx('hit'); api.end(); }
    }
    add(); add();

    return {
      down() { swiped = false; },
      swipe(d) { if (!swiped) { swiped = true; slide(d); } },
      key(k) { if (k !== 'action') slide(k); },
      update(dt) { for (const row of pop) for (let c = 0; c < N; c++) row[c] = Math.max(0, row[c] - dt); },
      draw(ctx) {
        ctx.fillStyle = '#FFF3D6'; ctx.fillRect(0, 0, W, 600);
        U.text(ctx, `가장 큰 숫자: ${top}`, W / 2, 60, 26, '#8a5a00');
        U.text(ctx, '👆 밀어서 합쳐요', W / 2, 96, 18, '#B08A4A');
        ctx.fillStyle = '#C9A66B'; U.rr(ctx, OX, OY, N * C + (N + 1) * G, N * C + (N + 1) * G, 16); ctx.fill();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = OX + G + c * (C + G), y = OY + G + r * (C + G), v = g[r][c];
          ctx.fillStyle = '#DDBF8C'; U.rr(ctx, x, y, C, C, 12); ctx.fill();
          if (!v) continue;
          const lv = Math.log2(v), s = 1 + Math.sin((pop[r][c] / 0.18) * Math.PI) * 0.12;
          ctx.save();
          ctx.translate(x + C / 2, y + C / 2); ctx.scale(s, s);
          ctx.fillStyle = `hsl(${(48 - lv * 26 + 720) % 360}, 85%, ${lv > 6 ? 55 : 68}%)`;
          U.rr(ctx, -C / 2, -C / 2, C, C, 12); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.3)'; U.rr(ctx, -C / 2 + 8, -C / 2 + 6, C - 16, 10, 5); ctx.fill();
          U.text(ctx, String(v), 0, 4, v < 100 ? 40 : v < 1000 ? 32 : 25, '#fff', 'center', '#2B2D42');
          ctx.restore();
        }
      },
    };
  },
});
