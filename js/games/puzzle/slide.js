/* 🔟 숫자 밀기 - 칸을 밀어 숫자를 순서대로 맞추는 퍼즐 */
registerGame({
  id: 'slide', genre: 'puzzle', name: '숫자 밀기', emoji: '🔟', color: '#81ECEC',
  desc: '칸을 밀어서 1부터 8까지 순서대로!',
  howto: ['빈칸 옆의 숫자를 톡 치면 빈칸으로 밀려요', '1 2 3 / 4 5 6 / 7 8 순서로 맞추면 성공', '90초 동안 최대한 많이! 적게 움직이면 보너스'],
  init(api) {
    const { U, W } = api;
    const N = 3, C = 108, G = 8, OX = (W - (N * C + (N + 1) * G)) / 2, OY = 150, LIMIT = 90;
    let t = [], left = LIMIT, moves = 0, done = 0, wait = 0, swiped = false;
    const parts = [], pops = [];

    const solved = () => t.every((v, i) => v === (i + 1) % (N * N));
    function shuffle() {
      t = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));
      let blank = N * N - 1, prev = -1;
      const steps = 30 + Math.min(done, 5) * 10;
      for (let s = 0; s < steps || solved(); s++) {
        const r = Math.floor(blank / N), c = blank % N;
        const opts = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N).map(([a, b]) => a * N + b).filter((k) => k !== prev);
        const k = U.pick(opts);
        t[blank] = t[k]; t[k] = 0; prev = blank; blank = k;
      }
      moves = 0;
    }
    /* idx 칸을 누르면 빈칸까지 같은 줄의 칸들이 함께 밀려요 */
    function push(idx) {
      if (wait > 0 || idx < 0 || idx >= N * N) return;
      const blank = t.indexOf(0), r = Math.floor(idx / N), c = idx % N, br = Math.floor(blank / N), bc = blank % N;
      if (idx === blank || (r !== br && c !== bc)) return;
      const step = r === br ? Math.sign(c - bc) : Math.sign(r - br) * N;
      for (let k = blank; k !== idx; k += step) { t[k] = t[k + step]; moves++; }
      t[idx] = 0;
      api.sfx('step');
      if (solved()) {
        done++;
        const pts = 100 + Math.max(0, 60 - moves);
        api.add(pts); api.sfx('best');
        U.burst(parts, W / 2, OY + 170, '#FFD23F', 24, 260);
        U.popups.add(pops, W / 2, OY + 170, `완성! +${pts}`, '#FFD23F');
        wait = 1;
      }
    }
    function nudge(dir) {
      const b = t.indexOf(0), r = Math.floor(b / N), c = b % N;
      if (dir === 'left' && c < N - 1) push(b + 1);
      else if (dir === 'right' && c > 0) push(b - 1);
      else if (dir === 'up' && r < N - 1) push(b + N);
      else if (dir === 'down' && r > 0) push(b - N);
    }
    shuffle();

    return {
      down(x, y) {
        swiped = false;
        const c = Math.floor((x - OX - G / 2) / (C + G)), r = Math.floor((y - OY - G / 2) / (C + G));
        if (c >= 0 && r >= 0 && c < N && r < N) { push(r * N + c); swiped = true; }
      },
      swipe(d) { if (!swiped) { swiped = true; nudge(d); } },
      key(k) { if (k !== 'action') nudge(k); },
      update(dt) {
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
        if (wait > 0) { wait -= dt; if (wait <= 0) shuffle(); return; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#E3FDFD'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W / 2, 68, 28, '#0B7285');
        U.text(ctx, `완성 ${done}개`, 28, 116, 22, '#0B7285', 'left');
        U.text(ctx, `움직임 ${moves}`, W - 28, 116, 22, '#0B7285', 'right');
        ctx.fillStyle = '#0B7285'; U.rr(ctx, OX, OY, N * C + (N + 1) * G, N * C + (N + 1) * G, 18); ctx.fill();
        for (let i = 0; i < N * N; i++) {
          const x = OX + G + (i % N) * (C + G), y = OY + G + Math.floor(i / N) * (C + G), v = t[i];
          if (!v) { ctx.fillStyle = 'rgba(255,255,255,.12)'; U.rr(ctx, x, y, C, C, 14); ctx.fill(); continue; }
          const ok = v === i + 1;
          ctx.fillStyle = ok ? '#38D9A9' : '#FFD43B'; U.rr(ctx, x, y, C, C, 14); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; U.rr(ctx, x + 10, y + 8, C - 20, 12, 6); ctx.fill();
          U.text(ctx, String(v), x + C / 2, y + C / 2 + 4, 56, '#fff', 'center', '#2B2D42');
        }
        U.text(ctx, '초록색 = 제자리에 있는 숫자', W / 2, 550, 18, '#0B7285');
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
