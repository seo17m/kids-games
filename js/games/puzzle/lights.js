/* 💡 전구 끄기 - 누르면 주변까지 바뀌는 전구를 모두 끄는 퍼즐 */
registerGame({
  id: 'lights', genre: 'puzzle', name: '전구 끄기', emoji: '💡', color: '#FFE066',
  desc: '누르면 십자 모양으로 켜졌다 꺼졌다!',
  howto: ['전구를 누르면 그 칸과 위·아래·양옆이 함께 바뀌어요', '모든 전구를 끄면 다음 단계!', '시간은 90초, 성공할 때마다 +10초'],
  init(api) {
    const { U, W } = api;
    const N = 5, C = 68, OX = (W - N * C) / 2, OY = 140, LIMIT = 90;
    let g, level = 1, left = LIMIT, wait = 0, taps = 0, need = 0;
    const parts = [], pops = [];

    function toggle(r, c) {
      for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nc >= 0 && nr < N && nc < N) g[nr][nc] = !g[nr][nc];
      }
    }
    const allOff = () => g.every((row) => row.every((v) => !v));
    function build() {
      // 꺼진 판에서 아무 칸이나 눌러 만들기 때문에 항상 풀 수 있어요
      need = Math.min(2 + level, 12);
      do {
        g = Array.from({ length: N }, () => Array(N).fill(false));
        const picks = new Set();
        while (picks.size < need) picks.add(U.randInt(0, N * N - 1));
        for (const k of picks) toggle(Math.floor(k / N), k % N);
      } while (allOff());
      taps = 0;
    }
    build();

    return {
      down(x, y) {
        if (wait > 0) return;
        const c = Math.floor((x - OX) / C), r = Math.floor((y - OY) / C);
        if (r < 0 || c < 0 || r >= N || c >= N) return;
        toggle(r, c); taps++; api.sfx('step');
        if (allOff()) {
          const pts = 100 + level * 20 + (taps <= need ? 50 : 0);
          api.add(pts); api.sfx('best');
          U.burst(parts, W / 2, OY + (N * C) / 2, '#FFD23F', 24, 260);
          U.popups.add(pops, W / 2, OY + (N * C) / 2, (taps <= need ? '완벽! ' : '') + `+${pts}`, '#FFD23F');
          left = Math.min(LIMIT, left + 10);
          wait = 1;
        }
      },
      update(dt) {
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
        if (wait > 0) { wait -= dt; if (wait <= 0) { level++; build(); } return; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#1A1A2E'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `${level}단계`, 28, 72, 26, '#fff', 'left');
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W - 28, 72, 24, '#fff', 'right');
        U.text(ctx, `${need}번 만에 끄면 완벽!  (지금 ${taps}번)`, W / 2, 112, 17, '#9FA8DA');
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const x = OX + c * C, y = OY + r * C, on = g[r][c];
          if (on) { ctx.fillStyle = 'rgba(255,224,102,.25)'; U.rr(ctx, x - 3, y - 3, C + 6, C + 6, 18); ctx.fill(); }
          ctx.fillStyle = on ? '#FFE066' : '#2E2E4D';
          U.rr(ctx, x + 4, y + 4, C - 8, C - 8, 14); ctx.fill();
          ctx.globalAlpha = on ? 1 : 0.25;
          U.emoji(ctx, '💡', x + C / 2, y + C / 2 + 2, 36);
          ctx.globalAlpha = 1;
        }
        const lit = g.flat().filter(Boolean).length;
        U.text(ctx, `켜진 전구 ${lit}개`, W / 2, 530, 24, '#FFE066');
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
