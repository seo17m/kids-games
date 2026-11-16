/* 🔍 다른 하나 - 비슷한 그림들 속에서 딱 하나 다른 그림을 찾는 게임 */
registerGame({
  id: 'odd', genre: 'brain', name: '다른 하나 찾기', emoji: '🔍', color: '#69DB7C',
  desc: '똑같아 보여도 하나는 달라요!',
  howto: ['똑같은 그림들 사이에 다른 그림이 딱 하나!', '찾아서 톡 치면 다음 문제로', '45초 도전! 틀리면 -3초, 갈수록 그림이 많아져요'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 45, OY = 130, AREA = 352;
    const PAIRS = [['🙂', '🙃'], ['😺', '😸'], ['🍎', '🍅'], ['🕐', '🕓'], ['🌕', '🌖'], ['👆', '👇'], ['🐻', '🐨'], ['🍊', '🍑'], ['🔒', '🔓'],
      ['😐', '😑'], ['🙈', '🙉'], ['🌲', '🌳'], ['🥝', '🥑'], ['🐶', '🐕'], ['⭐', '🌟'], ['😀', '😃'], ['🌼', '🌻'], ['🐠', '🐟'], ['📕', '📙'], ['🌙', '🌛']];
    let n, C, OX, base, odd, at, level = 1, left = LIMIT, fb = { t: 0, ok: true }, wrongAt = -1;
    const parts = [], pops = [];

    function build() {
      n = Math.min(6, 3 + Math.floor((level - 1) / 2));
      C = Math.floor(AREA / n); OX = (W - n * C) / 2;
      const p = U.pick(PAIRS), flip = Math.random() < 0.5;
      base = flip ? p[1] : p[0]; odd = flip ? p[0] : p[1];
      at = U.randInt(0, n * n - 1); wrongAt = -1;
    }
    build();

    return {
      down(x, y) {
        const c = Math.floor((x - OX) / C), r = Math.floor((y - OY) / C);
        if (c < 0 || r < 0 || c >= n || r >= n) return;
        const i = r * n + c;
        if (i === at) {
          const pts = 10 + level * 2;
          api.add(pts); api.sfx('point');
          U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, '#FFD23F', 12);
          U.popups.add(pops, OX + c * C + C / 2, OY + r * C, '+' + pts, '#2B8A3E');
          level++; build();
        } else { wrongAt = i; left -= 3; api.sfx('hit'); fb = { t: 0.35, ok: false }; U.popups.add(pops, W / 2, 100, '-3초', '#C92A2A'); }
      },
      update(dt) {
        fb.t -= dt; U.updateParticles(parts, dt); U.popups.update(pops, dt);
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#EBFBEE'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#2B8A3E', 'left');
        U.text(ctx, `${level}번째 문제`, W - 24, 66, 22, '#2B8A3E', 'right');
        U.text(ctx, '🔍 다른 그림 하나를 찾아요', W / 2, 104, 20, '#37B24D');
        ctx.fillStyle = '#fff'; U.rr(ctx, OX - 8, OY - 8, n * C + 16, n * C + 16, 20); ctx.fill();
        for (let i = 0; i < n * n; i++) {
          const x = OX + (i % n) * C + C / 2, y = OY + Math.floor(i / n) * C + C / 2;
          if (i === wrongAt) { ctx.fillStyle = '#FFE3E3'; U.rr(ctx, x - C / 2 + 3, y - C / 2 + 3, C - 6, C - 6, 10); ctx.fill(); }
          U.emoji(ctx, i === at ? odd : base, x, y + 2, C * 0.66);
        }
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.text(ctx, `${n}×${n} = 그림 ${n * n}개`, W / 2, 545, 20, '#37B24D');
      },
    };
  },
});
