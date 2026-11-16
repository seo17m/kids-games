/* ↔️ 왼쪽 오른쪽 - 나오는 그림을 종류에 맞게 양쪽으로 빠르게 나누는 게임 */
registerGame({
  id: 'sortlr', genre: 'reflex', name: '왼쪽! 오른쪽!', emoji: '↔️', color: '#38D9A9',
  desc: '동물은 이쪽, 음식은 저쪽! 휙휙 나눠요',
  howto: ['그림이 동물인지 음식인지 보고 맞는 쪽을 눌러요', '화면을 옆으로 밀거나 ← → 키도 돼요', '가끔 양쪽 자리가 바뀌어요! 45초 도전, 틀리면 -3초'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 45;
    const CAT = [
      { n: '동물', e: '🐾', c: '#74C0FC', list: ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐸', '🐵', '🐧', '🐘', '🦁', '🐷', '🐮', '🐔', '🐢', '🐬'] },
      { n: '음식', e: '🍴', c: '#FFC078', list: ['🍎', '🍕', '🍔', '🍩', '🍦', '🍉', '🍌', '🍇', '🍓', '🥕', '🍞', '🍗', '🍙', '🍪', '🌽', '🥐'] },
    ];
    let side = [0, 1], cur, left = LIMIT, n = 0, streak = 0, fb = { t: 0, ok: true }, fly = null, banner = 0, swiped = false, pressed = -1, pop = 0;
    const pops = [];
    const BTN = [{ x: 12, y: 440, w: 182, h: 130 }, { x: 206, y: 440, w: 182, h: 130 }];

    function next() { const cat = U.randInt(0, 1); let e; do { e = U.pick(CAT[cat].list); } while (cur && e === cur.e); cur = { cat, e }; pop = 0.15; }
    function answer(s) {
      if (banner > 0.6) return;
      pressed = s;
      if (side[s] === cur.cat) {
        streak++; n++;
        const pts = 10 + Math.min(streak - 1, 10) * 2;
        api.add(pts); api.sfx(streak % 5 === 0 ? 'coin' : 'point');
        U.popups.add(pops, W / 2, 130, '+' + pts, '#087F5B');
        fly = { e: cur.e, dir: s ? 1 : -1, t: 0 };
        if (n % 12 === 0) { side = [side[1], side[0]]; banner = 1.2; api.sfx('best'); }
      } else { streak = 0; left -= 3; api.sfx('hit'); fb = { t: 0.4, ok: false }; U.popups.add(pops, W / 2, 130, `${CAT[cur.cat].n}이에요! (-3초)`, '#C92A2A'); }
      next();
    }
    next();

    return {
      down(x, y) { swiped = false; const i = BTN.findIndex((b) => U.hit(x, y, b)); if (i >= 0) { swiped = true; answer(i); } },
      up() { pressed = -1; },
      swipe(d) { if (swiped) return; if (d === 'left') { swiped = true; answer(0); } else if (d === 'right') { swiped = true; answer(1); } },
      key(k) { if (k === 'left') answer(0); else if (k === 'right') answer(1); },
      keyup() { pressed = -1; },
      update(dt) {
        fb.t -= dt; pop = Math.max(0, pop - dt); banner = Math.max(0, banner - dt); U.popups.update(pops, dt);
        if (fly) { fly.t += dt * 4; if (fly.t >= 1) fly = null; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#E6FCF5'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = CAT[side[0]].c + '55'; ctx.fillRect(0, 90, W / 2, 510);
        ctx.fillStyle = CAT[side[1]].c + '55'; ctx.fillRect(W / 2, 90, W / 2, 510);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#087F5B', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `${n}개 성공`, W - 24, 66, 22, '#087F5B', 'right');
        if (fly) { ctx.globalAlpha = 1 - fly.t; U.emoji(ctx, fly.e, W / 2 + fly.dir * fly.t * 220, 290, 110 * (1 - fly.t * 0.5)); ctx.globalAlpha = 1; }
        const s = 1 - pop * 2;
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, W / 2 - 90 * s, 206, 180 * s, 180 * s, 30); ctx.fill();
        ctx.fillStyle = '#fff'; U.rr(ctx, W / 2 - 90 * s, 200, 180 * s, 180 * s, 30); ctx.fill();
        U.emoji(ctx, cur.e, W / 2, 292, 110 * s);
        BTN.forEach((b, i) => {
          const c = CAT[side[i]], o = pressed === i ? 4 : 0;
          U.btn(ctx, { ...b, color: c.c }, pressed === i);
          U.emoji(ctx, c.e, b.x + b.w / 2, b.y + 46 + o, 50);
          U.text(ctx, (i ? '' : '← ') + c.n + (i ? ' →' : ''), b.x + b.w / 2, b.y + 100 + o, 28, '#2B2D42');
        });
        if (banner > 0) {
          ctx.globalAlpha = Math.min(1, banner * 3);
          ctx.fillStyle = '#7048E8'; U.rr(ctx, 40, 120, W - 80, 60, 30); ctx.fill();
          U.text(ctx, '🔀 자리가 바뀌었어요!', W / 2, 152, 26, '#fff');
          ctx.globalAlpha = 1;
        }
        U.mark(ctx, fb, 292); U.popups.draw(ctx, pops);
      },
    };
  },
});
