/* 🃏 같다 다르다 - 방금 본 그림과 같은지 빠르게 판단하는 게임 */
registerGame({
  id: 'same', genre: 'reflex', name: '같다! 다르다!', emoji: '🙆', color: '#FFA94D',
  desc: '바로 앞 그림과 같을까 다를까?',
  howto: ['그림이 한 장씩 나와요', '"바로 앞" 그림과 같으면 ⭕, 다르면 ❌', '45초 도전 (키보드 ← ⭕, → ❌). 틀리면 -3초'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 45, SET = ['🍎', '⭐', '🐶', '🚗', '🌙', '🎈'];
    const BO = { x: 16, y: 440, w: 176, h: 120, color: '#69DB7C' }, BX = { x: 208, y: 440, w: 176, h: 120, color: '#FF8787' };
    let prev = null, cur = U.pick(SET), first = 1.4, left = LIMIT, n = 0, streak = 0, fb = { t: 0, ok: true }, pressed = '', slide = 0;
    const pops = [];

    function next() {
      prev = cur;
      const kinds = Math.min(SET.length, 3 + Math.floor(n / 8));
      cur = Math.random() < 0.45 ? prev : U.pick(SET.slice(0, kinds).filter((e) => e !== prev));
      slide = 1;
    }
    function answer(same) {
      if (first > 0) return;
      pressed = same ? 'o' : 'x';
      if ((cur === prev) === same) {
        streak++; n++;
        const pts = 10 + Math.min(streak - 1, 10) * 2;
        api.add(pts); api.sfx(streak % 5 === 0 ? 'coin' : 'point');
        U.popups.add(pops, W / 2, 120, '+' + pts, '#E8590C');
        fb = { t: 0.25, ok: true };
      } else { streak = 0; left -= 3; api.sfx('hit'); fb = { t: 0.4, ok: false }; U.popups.add(pops, W / 2, 120, '-3초', '#C92A2A'); }
      next();
    }

    return {
      down(x, y) { if (U.hit(x, y, BO)) answer(true); else if (U.hit(x, y, BX)) answer(false); },
      up() { pressed = ''; },
      key(k) { if (k === 'left') answer(true); else if (k === 'right') answer(false); },
      keyup() { pressed = ''; },
      update(dt) {
        fb.t -= dt; slide = Math.max(0, slide - dt * 6); U.popups.update(pops, dt);
        if (first > 0) { first -= dt; if (first <= 0) next(); return; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#FFF4E6'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#D9480F', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `${n}개 성공`, W - 24, 66, 22, '#D9480F', 'right');
        U.text(ctx, first > 0 ? '👀 이 그림을 기억해요!' : '바로 앞 그림과 같나요?', W / 2, 150, 24, '#D9480F');
        const x = W / 2 + slide * 260;
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, x - 100, 186, 200, 220, 28); ctx.fill();
        ctx.fillStyle = '#fff'; U.rr(ctx, x - 100, 180, 200, 220, 28); ctx.fill();
        U.emoji(ctx, cur, x, 292, 120);
        ctx.globalAlpha = first > 0 ? 0.35 : 1;
        U.btn(ctx, BO, pressed === 'o'); U.btn(ctx, BX, pressed === 'x');
        U.emoji(ctx, '⭕', BO.x + 88, BO.y + 44 + (pressed === 'o' ? 4 : 0), 54); U.text(ctx, '같다', BO.x + 88, BO.y + 96, 24, '#2B2D42');
        U.emoji(ctx, '❌', BX.x + 88, BX.y + 44 + (pressed === 'x' ? 4 : 0), 54); U.text(ctx, '다르다', BX.x + 88, BX.y + 96, 24, '#2B2D42');
        ctx.globalAlpha = 1;
        U.mark(ctx, fb, 292); U.popups.draw(ctx, pops);
      },
    };
  },
});
