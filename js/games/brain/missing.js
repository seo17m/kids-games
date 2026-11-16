/* 🫥 뭐가 없어졌지 - 여러 물건을 외운 뒤 사라진 하나를 맞히는 게임 */
registerGame({
  id: 'missing', genre: 'brain', name: '뭐가 없어졌지?', emoji: '🫥', color: '#FFA8A8',
  desc: '눈 깜짝할 새 하나가 사라졌어요!',
  howto: ['물건들을 잘 보고 외워요', '잠깐 가려졌다가 하나가 사라져요', '사라진 물건을 아래에서 골라요. 3번 틀리면 끝'],
  init(api) {
    const { U, W } = api;
    const POOL = ['🍎', '🍌', '🍇', '🍓', '🍉', '🥕', '🍕', '🍩', '🧁', '🍦', '⚽', '🏀', '🎈', '🎁', '🚗', '🚲', '✏️', '📚', '⏰', '🔑',
      '☂️', '🎸', '🧸', '👟', '🧢', '🐶', '🐱', '🐸', '🐥', '🦋', '🌻', '⭐'];
    const BC = ['#FFC9C9', '#A5D8FF', '#FFEC99', '#B2F2BB'];
    let items = [], gone = null, choices = [], level = 1, lives = 3, phase = 'show', timer = 0, total = 1, fb = { t: 0, ok: true }, pressed = -1;
    const pops = [];

    const slotPos = (s) => ({ x: 80 + (s % 3) * 120, y: 150 + Math.floor(s / 3) * 82 });
    function build() {
      const k = Math.min(9, 3 + level);
      const pool = U.shuffle(POOL.slice()), slots = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      items = pool.slice(0, k).map((e, i) => ({ e, s: slots[i] }));
      gone = U.pick(items);
      choices = U.shuffle([gone.e, ...pool.slice(k, k + 3)]);
      phase = 'show'; total = timer = 1.4 + k * 0.4;
    }
    build();

    return {
      down(x, y) {
        if (phase !== 'ask') return;
        const i = [0, 1, 2, 3].findIndex((q) => U.hit(x, y, U.quad(q)));
        if (i < 0) return;
        pressed = i;
        const ok = choices[i] === gone.e;
        fb = { t: 0.6, ok };
        if (ok) {
          const pts = items.length * 5 + 10;
          api.add(pts); api.sfx('coin');
          U.popups.add(pops, W / 2, 330, '+' + pts, '#2B2D42');
        } else { lives--; api.sfx('hit'); if (lives <= 0) api.end(); }
        phase = ok ? 'ok' : 'fail'; timer = 1.3;
      },
      up() { pressed = -1; },
      update(dt) {
        fb.t -= dt; U.popups.update(pops, dt);
        if (phase === 'ask') return;
        timer -= dt;
        if (timer > 0) return;
        if (phase === 'show') { phase = 'hide'; timer = 0.7; }
        else if (phase === 'hide') {
          const slots = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
          items.forEach((it, i) => { it.s = slots[i]; });
          phase = 'ask';
        } else { if (phase === 'ok') level++; build(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#FFF5F5'; ctx.fillRect(0, 0, W, 600);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `${level}단계 · ${items.length}개`, W - 24, 36, 22, '#C92A2A', 'right');
        const msg = { show: '👀 잘 외워 두세요!', hide: '🙈 가리는 중…', ask: '❓ 뭐가 없어졌을까요?', ok: '정답! 🎉', fail: `정답은 ${gone.e} 였어요` }[phase];
        U.text(ctx, msg, W / 2, 80, 24, '#C92A2A');
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, 16, 112, W - 32, 258, 24); ctx.fill();
        ctx.fillStyle = '#fff'; U.rr(ctx, 16, 106, W - 32, 258, 24); ctx.fill();
        if (phase === 'hide') U.emoji(ctx, '🙈', W / 2, 236, 130);
        else {
          for (const it of items) {
            const p = slotPos(it.s), isGone = it === gone;
            if (isGone && phase === 'ask') continue;
            if (isGone && (phase === 'ok' || phase === 'fail')) { ctx.fillStyle = '#FFF3BF'; ctx.beginPath(); ctx.arc(p.x, p.y, 38, 0, 7); ctx.fill(); }
            U.emoji(ctx, it.e, p.x, p.y + 2, 54);
          }
        }
        if (phase === 'show') { ctx.fillStyle = '#FFA8A8'; U.rr(ctx, 30, 348, (W - 60) * Math.max(0, timer / total), 8, 4); ctx.fill(); }
        if (phase === 'ask' || phase === 'ok' || phase === 'fail') {
          choices.forEach((e, i) => {
            const b = U.quad(i), o = pressed === i ? 4 : 0;
            U.btn(ctx, { ...b, color: BC[i] }, pressed === i);
            U.emoji(ctx, e, b.x + b.w / 2, b.y + b.h / 2 + o + 2, 50);
          });
        } else U.text(ctx, '조금만 기다려요…', W / 2, 480, 22, '#E8A0A0');
        U.mark(ctx, fb, 236); U.popups.draw(ctx, pops);
      },
    };
  },
});
