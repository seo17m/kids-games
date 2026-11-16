/* 🔢 숫자 숨바꼭질 - 숫자 위치를 외운 뒤 1부터 차례로 누르는 게임 */
registerGame({
  id: 'order', genre: 'brain', name: '숫자 숨바꼭질', emoji: '🙈', color: '#74C0FC',
  desc: '숫자가 숨기 전에 자리를 외워요',
  howto: ['숫자들이 어디 있는지 잘 봐요', '1을 누르면 나머지 숫자가 숨어요!', '2, 3, 4… 순서대로 눌러요. 3번 틀리면 끝'],
  init(api) {
    const { U, W } = api;
    const COLS = 5, ROWS = 6, C = 70, OX = (W - COLS * C) / 2, OY = 120;
    let cells = [], N = 4, next = 1, hidden = false, lives = 3, wait = 0, okWait = 0, fb = { t: 0, ok: true };
    const parts = [], pops = [];

    function build() {
      const slots = U.shuffle(Array.from({ length: COLS * ROWS }, (_, i) => i)).slice(0, N);
      cells = slots.map((s, i) => ({ n: i + 1, c: s % COLS, r: Math.floor(s / COLS), done: false }));
      next = 1; hidden = false;
    }
    build();

    return {
      down(x, y) {
        if (wait > 0 || okWait > 0) return;
        const c = Math.floor((x - OX) / C), r = Math.floor((y - OY) / C);
        const cell = cells.find((k) => k.c === c && k.r === r && !k.done);
        if (!cell) return;
        if (cell.n === next) {
          cell.done = true; next++; hidden = true;
          api.note(300 + cell.n * 45, 0.15);
          U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, '#74C0FC', 8);
          if (next > N) {
            const pts = N * 10;
            api.add(pts); api.sfx('coin');
            U.popups.add(pops, W / 2, 300, `${N}개 성공! +${pts}`, '#FFD23F');
            fb = { t: 0.5, ok: true }; okWait = 0.8;
          }
        } else {
          lives--; hidden = false; api.sfx('hit'); fb = { t: 0.6, ok: false }; wait = 1.2;
          if (lives <= 0) api.end();
        }
      },
      update(dt) {
        fb.t -= dt; U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (okWait > 0) { okWait -= dt; if (okWait <= 0) { N = Math.min(14, N + 1); build(); } }
        if (wait > 0) { wait -= dt; if (wait <= 0) build(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#E7F5FF'; ctx.fillRect(0, 0, W, 600);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `숫자 ${N}개`, W - 24, 36, 24, '#1864AB', 'right');
        U.text(ctx, hidden ? `다음은 ${next}번!` : '자리를 외우고 1을 눌러요', W / 2, 84, 22, '#1864AB');
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = '#D0EBFF'; U.rr(ctx, OX + c * C + 3, OY + r * C + 3, C - 6, C - 6, 12); ctx.fill();
        }
        for (const k of cells) {
          if (k.done) continue;
          const x = OX + k.c * C, y = OY + k.r * C, show = !hidden;
          ctx.fillStyle = '#2B2D42'; U.rr(ctx, x + 4, y + 8, C - 8, C - 8, 14); ctx.fill();
          ctx.fillStyle = show ? '#fff' : '#339AF0'; U.rr(ctx, x + 4, y + 4, C - 8, C - 8, 14); ctx.fill();
          if (show) U.text(ctx, String(k.n), x + C / 2, y + C / 2 + 4, 36, k.n === next ? '#E8590C' : '#1864AB');
          else U.text(ctx, '?', x + C / 2, y + C / 2 + 4, 32, '#D0EBFF');
        }
        U.drawParticles(ctx, parts); U.mark(ctx, fb, 300); U.popups.draw(ctx, pops);
      },
    };
  },
});
