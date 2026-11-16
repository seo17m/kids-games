/* 🎨 색 물들이기 - 정해진 횟수 안에 판 전체를 한 색으로 만드는 퍼즐 */
registerGame({
  id: 'flood', genre: 'puzzle', name: '색 물들이기', emoji: '🎨', color: '#6BCB77',
  desc: '판 전체를 한 가지 색으로 물들여요',
  howto: ['⭐ 칸에서 시작! 아래 색 버튼을 눌러요', '⭐ 과 이어진 칸들이 그 색으로 바뀌며 넓어져요', '정해진 횟수 안에 전체를 한 색으로 만들면 성공'],
  init(api) {
    const { U, W } = api;
    const N = 12, C = 30, OX = (W - N * C) / 2, OY = 96;
    const COL = ['#FF6B6B', '#4D96FF', '#FFD23F', '#6BCB77', '#B36BFF', '#FF9F43'];
    let g, moves, level = 1, wait = 0, msg = '', pulse = 0, size = 1;
    const pops = [];

    const limit = () => Math.max(24, 31 - level);
    function build() {
      g = Array.from({ length: N }, () => Array.from({ length: N }, () => U.randInt(0, 5)));
      moves = limit(); msg = '';
      size = region(g[0][0]).length;
    }
    function region(col) {
      const seen = new Set([0]), out = [[0, 0]];
      for (let k = 0; k < out.length; k++) {
        const [r, c] = out[k];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= N || nc >= N || seen.has(nr * N + nc) || g[nr][nc] !== col) continue;
          seen.add(nr * N + nc); out.push([nr, nc]);
        }
      }
      return out;
    }
    function paint(col) {
      if (wait > 0 || col === g[0][0]) return;
      for (const [r, c] of region(g[0][0])) g[r][c] = col;
      moves--; pulse = 0.2;
      const now = region(col).length;
      api.sfx(now - size >= 8 ? 'coin' : 'point');
      size = now;
      if (now === N * N) {
        const pts = 100 + moves * 20;
        api.add(pts); api.sfx('best');
        msg = `성공! +${pts}`; wait = 1.3;
      } else if (moves <= 0) { msg = '횟수를 다 썼어요…'; wait = 1.2; }
    }
    build();

    return {
      down(x, y) {
        if (y < 470) return;
        const i = COL.findIndex((_, k) => U.dist(x, y, 40 + k * 64, 520) < 30);
        if (i >= 0) paint(i);
      },
      update(dt) {
        pulse = Math.max(0, pulse - dt);
        U.popups.update(pops, dt);
        if (wait > 0) {
          wait -= dt;
          if (wait <= 0) {
            if (size === N * N) { level++; build(); }
            else { api.sfx('hit'); api.end(); }
          }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#F1FFF0'; ctx.fillRect(0, 0, W, 600);
        U.text(ctx, `${level}단계`, 24, 36, 26, '#1B5E20', 'left');
        U.text(ctx, `남은 횟수 ${moves}`, W - 24, 36, 26, moves <= 5 ? '#D62828' : '#1B5E20', 'right');
        U.text(ctx, `물든 칸 ${Math.round((size / (N * N)) * 100)}%`, W / 2, 72, 18, '#4E7D4E');
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, OX - 5, OY - 5, N * C + 10, N * C + 10, 10); ctx.fill();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          ctx.fillStyle = COL[g[r][c]];
          ctx.fillRect(OX + c * C, OY + r * C, C + 0.5, C + 0.5);
        }
        if (pulse > 0) { ctx.fillStyle = `rgba(255,255,255,${pulse * 1.5})`; for (const [r, c] of region(g[0][0])) ctx.fillRect(OX + c * C, OY + r * C, C, C); }
        U.emoji(ctx, '⭐', OX + C / 2, OY + C / 2 + 1, 20);
        COL.forEach((col, k) => {
          const x = 40 + k * 64, cur = g[0][0] === k;
          ctx.fillStyle = '#2B2D42'; ctx.beginPath(); ctx.arc(x, 524, 27, 0, 7); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, cur ? 524 : 520, 27, 0, 7); ctx.fill();
          ctx.globalAlpha = cur ? 0.35 : 1;
          ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(x - 8, 510, 7, 0, 7); ctx.fill();
          ctx.globalAlpha = 1;
          if (cur) U.text(ctx, '지금', x, 526, 15, '#fff', 'center', '#2B2D42');
        });
        U.text(ctx, '색을 골라 눌러요', W / 2, 574, 17, '#4E7D4E');
        if (msg) {
          ctx.fillStyle = 'rgba(43,45,66,.8)'; U.rr(ctx, 40, 240, W - 80, 80, 20); ctx.fill();
          U.text(ctx, msg, W / 2, 280, 26, '#fff');
        }
      },
    };
  },
});
