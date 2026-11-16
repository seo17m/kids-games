/* 🎨 헷갈려 색깔 - 글자의 뜻과 색이 달라서 헷갈리는 집중력 게임 */
registerGame({
  id: 'stroop', genre: 'brain', name: '헷갈려 색깔', emoji: '🌈', color: '#FF8787',
  desc: '글자에 속지 마! 진짜 색깔을 골라요',
  howto: ['글자가 무슨 "색깔"로 쓰여 있는지 골라요', '예: 파란색으로 쓴 "빨강" → 파란 버튼!', '나중엔 글자의 "뜻"을 묻기도 해요. 틀리면 -3초'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 45;
    const COL = [{ n: '빨강', c: '#E63946' }, { n: '파랑', c: '#1D6FE0' }, { n: '노랑', c: '#F4B400' }, { n: '초록', c: '#2BA84A' }];
    let q, left = LIMIT, n = 0, streak = 0, fb = { t: 0, ok: true }, pressed = -1, order = [0, 1, 2, 3];
    const pops = [];

    function gen() {
      const word = U.randInt(0, 3);
      let ink = U.randInt(0, 3);
      if (Math.random() < 0.8) while (ink === word) ink = U.randInt(0, 3);
      const rule = n >= 8 && Math.random() < 0.35 ? 'word' : 'ink';
      q = { word, ink, rule, ans: rule === 'ink' ? ink : word };
      if (n >= 15) order = U.shuffle([0, 1, 2, 3]);
    }
    gen();

    return {
      down(x, y) {
        const i = [0, 1, 2, 3].findIndex((k) => U.hit(x, y, U.quad(k)));
        if (i < 0) return;
        pressed = i;
        if (order[i] === q.ans) {
          streak++; n++;
          const pts = 10 + Math.min(streak - 1, 10) * 2;
          api.add(pts); api.sfx(streak % 5 === 0 ? 'coin' : 'point');
          U.popups.add(pops, W / 2, 330, '+' + pts, '#2B2D42');
          fb = { t: 0.3, ok: true };
        } else {
          streak = 0; left -= 3; api.sfx('hit');
          U.popups.add(pops, W / 2, 330, `정답은 ${COL[q.ans].n}  (-3초)`, '#C92A2A');
          fb = { t: 0.4, ok: false };
        }
        gen();
      },
      up() { pressed = -1; },
      update(dt) {
        fb.t -= dt; U.popups.update(pops, dt);
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#F8F9FA'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#495057', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `${n}문제 성공`, W - 24, 66, 22, '#495057', 'right');
        const ink = q.rule === 'ink';
        ctx.fillStyle = ink ? '#2B2D42' : '#7048E8'; U.rr(ctx, 50, 96, W - 100, 46, 23); ctx.fill();
        U.text(ctx, ink ? '🎨 글자의 색깔은?' : '📖 글자의 뜻은?', W / 2, 121, 24, '#fff');
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, 24, 166, W - 48, 190, 28); ctx.fill();
        ctx.fillStyle = '#fff'; U.rr(ctx, 24, 160, W - 48, 190, 28); ctx.fill();
        U.text(ctx, COL[q.word].n, W / 2, 262, 110, COL[q.ink].c);
        order.forEach((ci, i) => U.btn(ctx, { ...U.quad(i), color: COL[ci].c }, pressed === i));
        U.mark(ctx, fb, 255);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
