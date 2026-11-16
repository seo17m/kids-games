/* 🎈 풍선 팡팡 - 붙어 있는 같은 색 풍선을 한꺼번에 터뜨리는 퍼즐 */
registerGame({
  id: 'pop', genre: 'puzzle', name: '풍선 팡팡', emoji: '🎈', color: '#FF7675',
  desc: '같은 색 풍선을 많이 모아서 한 번에 팡!',
  howto: ['같은 색이 2개 이상 붙어 있는 풍선을 톡!', '한 번에 많이 터뜨릴수록 점수가 쑥쑥', '풍선이 8개 이하로 남으면 다음 판으로!'],
  init(api) {
    const { U, W } = api;
    const COLS = 8, ROWS = 10, C = 46, OX = (W - COLS * C) / 2, BOTTOM = 570, PASS = 8;
    const COL = ['#FF6B6B', '#4D96FF', '#FFD23F', '#6BCB77', '#B36BFF'];
    let g = [], stage = 1, wait = 0, result = '', hover = null;
    const parts = [], pops = [];

    function build() {
      const n = stage <= 2 ? 4 : 5;
      g = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => U.randInt(0, n - 1)));
    }
    function group(c, i) {
      const col = g[c] && g[c][i];
      if (col === undefined) return [];
      const seen = new Set([c * 100 + i]), out = [[c, i]];
      for (let k = 0; k < out.length; k++) {
        const [x, y] = out[k];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (g[nx] && g[nx][ny] === col && !seen.has(nx * 100 + ny)) { seen.add(nx * 100 + ny); out.push([nx, ny]); }
        }
      }
      return out;
    }
    const remaining = () => g.reduce((s, c) => s + c.length, 0);
    function hasMove() {
      for (let c = 0; c < g.length; c++) for (let i = 0; i < g[c].length; i++) {
        if (g[c][i] === g[c][i + 1] || (g[c + 1] && g[c + 1][i] === g[c][i])) return true;
      }
      return false;
    }
    const pos = (c, i) => [OX + c * C + C / 2, BOTTOM - i * C - C / 2];
    const cellAt = (x, y) => [Math.floor((x - OX) / C), Math.floor((BOTTOM - y) / C)];
    build();

    return {
      down(x, y) {
        if (wait > 0) return;
        const [c, i] = cellAt(x, y);
        const grp = group(c, i);
        if (grp.length < 2) { if (grp.length) api.sfx('step'); return; }
        const color = COL[g[c][i]];
        for (const [gx, gy] of grp) { const [px, py] = pos(gx, gy); U.burst(parts, px, py, color, 5, 160); }
        // 위에서부터 지워야 순서가 꼬이지 않아요
        grp.sort((a, b) => b[1] - a[1]).forEach(([gx, gy]) => g[gx].splice(gy, 1));
        g = g.filter((col) => col.length);
        const n = grp.length, pts = n * (n - 1) * 5;
        api.add(pts);
        api.sfx(n >= 6 ? 'coin' : 'point');
        U.popups.add(pops, x, y - 20, `${n}개 +${pts}`, '#fff');
        if (!hasMove()) {
          const rest = remaining(), bonus = Math.max(0, 200 - rest * 20);
          if (bonus) api.add(bonus);
          result = rest <= PASS ? `통과! 보너스 +${bonus}` : `${rest}개나 남았어요…`;
          wait = 1.4;
          if (rest <= PASS) api.sfx('best');
        }
      },
      move(x, y) { hover = cellAt(x, y); },
      update(dt) {
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            if (remaining() <= PASS) { stage++; build(); result = ''; }
            else { api.sfx('hit'); api.end(); }
          }
        }
      },
      draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, 600);
        sky.addColorStop(0, '#A0E7FF'); sky.addColorStop(1, '#E8FAFF');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
        U.text(ctx, `${stage}판`, 24, 34, 28, '#2B2D42', 'left');
        const rest = remaining();
        U.text(ctx, `남은 풍선 ${rest}개`, W - 24, 28, 20, rest <= PASS ? '#00916E' : '#2B2D42', 'right');
        U.text(ctx, `${PASS}개 이하면 통과!`, W - 24, 54, 15, '#5C7C8A', 'right');
        const hl = hover && wait <= 0 ? group(hover[0], hover[1]) : [];
        const hs = new Set(hl.length >= 2 ? hl.map(([c, i]) => c * 100 + i) : []);
        for (let c = 0; c < g.length; c++) for (let i = 0; i < g[c].length; i++) {
          const [x, y] = pos(c, i), on = hs.has(c * 100 + i), r = C / 2 - 3 + (on ? 2 : 0);
          ctx.fillStyle = COL[g[c][i]];
          ctx.beginPath(); ctx.ellipse(x, y, r - 1, r, 0, 0, 7); ctx.fill();
          if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
          ctx.fillStyle = 'rgba(255,255,255,.5)';
          ctx.beginPath(); ctx.ellipse(x - 7, y - 8, 5, 8, -0.5, 0, 7); ctx.fill();
        }
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        if (result) {
          ctx.fillStyle = 'rgba(43,45,66,.75)'; U.rr(ctx, 40, 250, W - 80, 80, 20); ctx.fill();
          U.text(ctx, result, W / 2, 290, 26, '#fff');
        }
      },
    };
  },
});
