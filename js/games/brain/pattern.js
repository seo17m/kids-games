/* ✨ 반짝 기억 - 잠깐 반짝인 칸의 위치를 기억해 누르는 게임 */
registerGame({
  id: 'pattern', genre: 'brain', name: '반짝 기억', emoji: '✨', color: '#FFD43B',
  desc: '반짝인 칸이 어디였더라?',
  howto: ['칸 몇 개가 잠깐 반짝여요', '불이 꺼지면 반짝였던 칸을 모두 눌러요', '성공하면 칸이 늘어나요. 3번 틀리면 끝'],
  init(api) {
    const { U, W } = api;
    let n, k, C, OX, OY, target = new Set(), found = new Set(), bad = -1, level = 1, lives = 3, phase = 'show', timer = 0;
    const parts = [], pops = [];

    function build() {
      n = level < 3 ? 3 : level < 7 ? 4 : 5;
      k = Math.min(Math.floor((n * n) / 2), 2 + level);
      C = Math.floor(348 / n); OX = (W - n * C) / 2; OY = 150;
      target = new Set(U.shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, k));
      found = new Set(); bad = -1; phase = 'show'; timer = 0.9 + k * 0.18;
    }
    build();

    return {
      down(x, y) {
        if (phase !== 'input') return;
        const c = Math.floor((x - OX) / C), r = Math.floor((y - OY) / C);
        if (c < 0 || r < 0 || c >= n || r >= n) return;
        const i = r * n + c;
        if (found.has(i)) return;
        if (target.has(i)) {
          found.add(i); api.note(400 + found.size * 50, 0.12);
          U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, '#FFD43B', 8);
          if (found.size === k) {
            const pts = k * 10;
            api.add(pts); api.sfx('coin');
            U.popups.add(pops, W / 2, 120, `완벽해요! +${pts}`, '#FFD43B');
            phase = 'ok'; timer = 0.9;
          }
        } else { bad = i; lives--; api.sfx('hit'); phase = 'fail'; timer = 1.3; if (lives <= 0) api.end(); }
      },
      update(dt) {
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (phase === 'input') return;
        timer -= dt;
        if (timer > 0) return;
        if (phase === 'show') phase = 'input';
        else { if (phase === 'ok') level++; build(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#212A3E'; ctx.fillRect(0, 0, W, 600);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `${level}단계`, W - 24, 36, 26, '#fff', 'right');
        const msg = phase === 'show' ? '👀 반짝이는 칸을 기억해요' : phase === 'input' ? `👉 눌러요 (${found.size}/${k})` : phase === 'ok' ? '잘했어요! 🎉' : '정답은 여기였어요';
        U.text(ctx, msg, W / 2, 96, 24, phase === 'input' ? '#FFD43B' : '#BAC8FF');
        for (let i = 0; i < n * n; i++) {
          const x = OX + (i % n) * C, y = OY + Math.floor(i / n) * C;
          const lit = found.has(i) || ((phase === 'show' || phase === 'fail') && target.has(i));
          ctx.fillStyle = '#131A2A'; U.rr(ctx, x + 4, y + 8, C - 8, C - 8, 14); ctx.fill();
          ctx.fillStyle = i === bad ? '#FF6B6B' : lit ? '#FFD43B' : '#394867';
          U.rr(ctx, x + 4, y + 4, C - 8, C - 8, 14); ctx.fill();
          if (lit) { ctx.fillStyle = 'rgba(255,255,255,.4)'; U.rr(ctx, x + 12, y + 10, C - 24, 10, 5); ctx.fill(); }
          if (i === bad) U.emoji(ctx, '❌', x + C / 2, y + C / 2 + 4, C * 0.5);
        }
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.text(ctx, `${n}×${n} 판에서 ${k}칸`, W / 2, 545, 20, '#BAC8FF');
      },
    };
  },
});
