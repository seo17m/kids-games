/* ➕ 번개 계산 - 60초 동안 빠르게 계산 문제를 푸는 게임 */
registerGame({
  id: 'math', genre: 'brain', name: '번개 계산', emoji: '➕', color: '#FFA94D',
  desc: '60초 동안 몇 문제나 풀 수 있을까?',
  howto: ['문제를 보고 맞는 답을 골라요', '연속으로 맞히면 점수가 더 커져요', '틀리면 3초가 줄어들어요. 뒤로 갈수록 어려워져요!'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 60;
    const BC = ['#FF8787', '#74C0FC', '#FFD43B', '#8CE99A'];
    let q, left = LIMIT, n = 0, streak = 0, fb = { t: 0, ok: true }, pressed = -1;
    const pops = [];

    function gen() {
      let a, b, op, ans;
      const kind = n < 5 ? 0 : n < 10 ? U.randInt(0, 1) : n < 18 ? U.randInt(0, 2) : U.randInt(0, 3);
      const big = n < 10 ? 10 : n < 18 ? 30 : 60;
      if (kind === 0) { a = U.randInt(2, big + 5); b = U.randInt(2, big); op = '+'; ans = a + b; }
      else if (kind === 1) { a = U.randInt(5, big + 10); b = U.randInt(1, a - 1); op = '−'; ans = a - b; }
      else if (kind === 2) { a = U.randInt(2, 9); b = U.randInt(2, n < 18 ? 9 : 12); op = '×'; ans = a * b; }
      else { b = U.randInt(2, 9); ans = U.randInt(2, 9); a = b * ans; op = '÷'; }
      const set = new Set([ans]);
      while (set.size < 4) {
        const d = U.pick([-10, -3, -2, -1, 1, 2, 3, 10]);
        if (ans + d >= 0) set.add(ans + d);
      }
      q = { text: `${a} ${op} ${b}`, ans, choices: U.shuffle([...set]) };
    }
    gen();

    return {
      down(x, y) {
        const i = [0, 1, 2, 3].findIndex((k) => U.hit(x, y, U.quad(k)));
        if (i < 0) return;
        pressed = i;
        if (q.choices[i] === q.ans) {
          streak++; n++;
          const pts = 10 + Math.min(streak - 1, 10) * 2;
          api.add(pts); api.sfx(streak % 5 === 0 ? 'coin' : 'point');
          U.popups.add(pops, W / 2, 300, '+' + pts, '#fff');
          fb = { t: 0.3, ok: true };
        } else {
          streak = 0; left -= 3; api.sfx('hit');
          U.popups.add(pops, W / 2, 300, `정답은 ${q.ans}  (-3초)`, '#FFE3E3');
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
        ctx.fillStyle = '#FFF4E6'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#D9480F', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `${n}문제 성공`, W - 24, 66, 22, '#D9480F', 'right');
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, 24, 116, W - 48, 210, 28); ctx.fill();
        ctx.fillStyle = '#fff'; U.rr(ctx, 24, 110, W - 48, 210, 28); ctx.fill();
        U.text(ctx, q.text, W / 2, 196, q.text.length > 7 ? 60 : 72, '#2B2D42');
        U.text(ctx, '= ?', W / 2, 272, 40, '#FD7E14');
        q.choices.forEach((c, i) => U.btn(ctx, { ...U.quad(i), label: String(c), color: BC[i], size: 42 }, pressed === i));
        U.mark(ctx, fb, 215);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
