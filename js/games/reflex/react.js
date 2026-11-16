/* ⚡ 번개 반응 - 초록불이 켜지는 순간 누르는 반응 속도 게임 */
registerGame({
  id: 'react', genre: 'reflex', name: '번개 반응', emoji: '⚡', color: '#FFD43B',
  desc: '초록불이 켜지는 순간 톡! 내 반응 속도는?',
  howto: ['빨간 화면에서는 꾹 참고 기다려요', '초록색으로 바뀌는 순간 재빨리 톡!', '5번 도전해요. 빠를수록 점수가 높아요 (미리 누르면 0점)'],
  init(api) {
    const { U, W } = api;
    const ROUNDS = 5;
    let phase = 'wait', timer = U.rand(1.5, 3.2), t0 = 0, results = [], last = 0, early = false, pts = 0;

    function arm() { phase = 'wait'; timer = U.rand(1.3, 3.6); }
    function finish(ms, isEarly) {
      early = isEarly; last = ms;
      pts = isEarly ? 0 : U.clamp(Math.round((650 - ms) / 4.5), 5, 100);
      results.push(isEarly ? null : ms);
      if (pts) api.add(pts);
      api.sfx(isEarly ? 'hit' : ms < 300 ? 'coin' : 'point');
      phase = 'result'; timer = 1.6;
    }
    const press = () => {
      if (phase === 'wait') finish(0, true);
      else if (phase === 'go') finish(Math.round(performance.now() - t0), false);
    };

    return {
      down: press,
      key(k) { if (k === 'action') press(); },
      update(dt) {
        if (phase === 'wait') { timer -= dt; if (timer <= 0) { phase = 'go'; t0 = performance.now(); api.note(880, 0.1); } }
        else if (phase === 'go') { if (performance.now() - t0 > 2000) finish(2000, false); }
        else { timer -= dt; if (timer <= 0) { if (results.length >= ROUNDS) api.end(); else arm(); } }
      },
      draw(ctx) {
        ctx.fillStyle = phase === 'wait' ? '#E03131' : phase === 'go' ? '#2F9E44' : '#1C7ED6';
        ctx.fillRect(0, 0, W, 600);
        for (let i = 0; i < ROUNDS; i++) {
          const x = W / 2 + (i - 2) * 44;
          ctx.fillStyle = i < results.length ? '#fff' : 'rgba(255,255,255,.3)';
          ctx.beginPath(); ctx.arc(x, 50, 14, 0, 7); ctx.fill();
          if (i < results.length) U.text(ctx, results[i] === null ? '✕' : '✓', x, 52, 18, '#1C7ED6');
        }
        if (phase === 'wait') {
          U.emoji(ctx, '✋', W / 2, 250, 130);
          U.text(ctx, '기다려…', W / 2, 380, 52, '#fff');
          U.text(ctx, '초록색이 되면 눌러요', W / 2, 440, 22, '#FFC9C9');
        } else if (phase === 'go') {
          U.emoji(ctx, '👆', W / 2, 250, 130);
          U.text(ctx, '지금!!', W / 2, 380, 72, '#fff');
        } else if (early) {
          U.emoji(ctx, '🙈', W / 2, 240, 120);
          U.text(ctx, '너무 빨랐어요!', W / 2, 360, 40, '#fff');
          U.text(ctx, '초록색이 될 때까지 기다려요', W / 2, 410, 20, '#D0EBFF');
        } else {
          const msg = last < 250 ? '⚡ 번개처럼 빨라요!' : last < 350 ? '🐇 아주 빨라요!' : last < 500 ? '👍 좋아요!' : '🐢 조금 더 빨리!';
          U.text(ctx, `${(last / 1000).toFixed(3)}초`, W / 2, 250, 76, '#fff');
          U.text(ctx, msg, W / 2, 340, 30, '#FFE066');
          U.text(ctx, `+${pts}점`, W / 2, 400, 34, '#fff');
        }
        const ok = results.filter((r) => r !== null);
        if (ok.length) U.text(ctx, `평균 ${(ok.reduce((a, b) => a + b, 0) / ok.length / 1000).toFixed(3)}초`, W / 2, 550, 22, 'rgba(255,255,255,.85)');
      },
    };
  },
});
