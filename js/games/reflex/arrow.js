/* ↗️ 화살표 휙휙 - 화살표 방향대로(빨간색은 반대로!) 미는 게임 */
registerGame({
  id: 'arrow', genre: 'reflex', name: '화살표 휙휙', emoji: '↗️', color: '#4DABF7',
  desc: '파랑은 그대로, 빨강은 반대로!',
  howto: ['파란 화살표: 가리키는 쪽으로 화면을 밀어요', '빨간 화살표: 반대쪽으로 밀어요!', '45초 도전 (방향키도 돼요). 틀리면 -2초'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 45, DIRS = ['up', 'right', 'down', 'left'], OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
    const KO = { up: '위', down: '아래', left: '왼쪽', right: '오른쪽' };
    let q, left = LIMIT, n = 0, streak = 0, fb = { t: 0, ok: true }, swiped = false, pop = 0, fly = null;
    const pops = [];

    function gen() {
      const dir = U.pick(DIRS), red = n >= 6 && Math.random() < Math.min(0.5, 0.25 + n * 0.01);
      q = { dir, red, ans: red ? OPP[dir] : dir }; pop = 0.15;
    }
    function answer(d) {
      if (d === 'action') return;
      if (d === q.ans) {
        streak++; n++;
        const pts = 10 + Math.min(streak - 1, 10) * 2;
        api.add(pts); api.sfx(streak % 5 === 0 ? 'coin' : 'point');
        U.popups.add(pops, W / 2, 150, '+' + pts, '#fff');
        fly = { ...q, to: d, t: 0 };
      } else {
        streak = 0; left -= 2; api.sfx('hit'); fb = { t: 0.4, ok: false };
        U.popups.add(pops, W / 2, 150, `${KO[q.ans]}이었어요 (-2초)`, '#FFC9C9');
      }
      gen();
    }
    function arrow(ctx, x, y, dir, red, s, alpha = 1) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
      ctx.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir]);
      ctx.beginPath();
      ctx.moveTo(0, -110); ctx.lineTo(90, -10); ctx.lineTo(38, -10); ctx.lineTo(38, 100); ctx.lineTo(-38, 100); ctx.lineTo(-38, -10); ctx.lineTo(-90, -10);
      ctx.closePath();
      ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.fillStyle = red ? '#F03E3E' : '#228BE6'; ctx.fill();
      ctx.restore();
    }
    gen();

    return {
      down() { swiped = false; },
      swipe(d) { if (!swiped) { swiped = true; answer(d); } },
      key: answer,
      update(dt) {
        fb.t -= dt; pop = Math.max(0, pop - dt); U.popups.update(pops, dt);
        if (fly) { fly.t += dt * 4; if (fly.t >= 1) fly = null; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = q.red ? '#3B1F2B' : '#1B2B4B'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#fff', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `${n}개 성공`, W - 24, 66, 22, '#fff', 'right');
        U.text(ctx, q.red ? '🔴 빨강은 반대로!' : '🔵 파랑은 그대로!', W / 2, 112, 26, q.red ? '#FFA8A8' : '#A5D8FF');
        if (fly) {
          const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[fly.to];
          arrow(ctx, W / 2 + v[0] * fly.t * 260, 320 + v[1] * fly.t * 260, fly.dir, fly.red, 1 - fly.t * 0.4, 1 - fly.t);
        }
        arrow(ctx, W / 2, 320, q.dir, q.red, 1 - pop * 2);
        U.mark(ctx, fb, 320); U.popups.draw(ctx, pops);
        U.text(ctx, '👆 화면을 밀어요  ·  ⌨️ 방향키', W / 2, 550, 18, 'rgba(255,255,255,.7)');
      },
    };
  },
});
