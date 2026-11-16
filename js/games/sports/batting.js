/* ⚾ 홈런 타자 - 날아오는 공을 타이밍 맞춰 치는 게임 */
registerGame({
  id: 'batting', genre: 'sports', name: '딱! 홈런 타자', emoji: '⚾', color: '#A9E34B',
  desc: '공이 오는 순간 딱! 담장을 넘겨라',
  howto: ['공이 아래 하얀 홈 위에 올 때 톡! 휘둘러요', '딱 맞으면 홈런, 조금 빗나가면 안타나 파울', '헛스윙이나 그냥 보내면 아웃! 3아웃이면 끝'],
  init(api) {
    const { U, W } = api;
    const PY = 150, HY = 480;
    let ball = null, wait = 1, outs = 0, hits = 0, hr = 0, swing = 0, msg = { s: '', t: 0, c: '#fff' }, flyB = null, streak = 0;
    const parts = [], pops = [];

    function pitch() {
      const slow = hits >= 3 && Math.random() < 0.25;
      const dur = slow ? U.rand(1.15, 1.35) : Math.max(0.5, U.rand(0.8, 1.0) - hits * 0.015);
      ball = { t: 0, dur, x: U.rand(-14, 14), slow, swung: false }; api.sfx('flap');
    }
    function out(s) { outs++; streak = 0; msg = { s, t: 1, c: '#FFE3E3' }; api.sfx('hit'); ball = null; wait = 1.2; if (outs >= 3) api.end(); }
    function doSwing() {
      if (swing > 0) return;
      swing = 0.28;
      if (!ball || ball.swung) return;
      ball.swung = true;
      const y = U.lerp(PY, HY + 50, ball.t), e = Math.abs(y - HY);
      if (e > 78) { out('헛스윙! 😵'); return; }
      const kind = e < 17 ? 'hr' : e < 44 ? 'hit' : 'foul';
      const dirX = (y < HY ? 1 : -1) * U.rand(0.2, 1) * (kind === 'foul' ? 2.2 : 1);
      flyB = { x: W / 2, y: HY, vx: dirX * 220, vy: kind === 'hr' ? -900 : kind === 'hit' ? -620 : -380, s: 1, t: 0 };
      ball = null; wait = 1.3;
      U.burst(parts, W / 2, HY, '#fff', kind === 'hr' ? 22 : 10, 260);
      if (kind === 'foul') { api.add(5); api.sfx('bounce'); msg = { s: '파울~ 한 번 더!', t: 1, c: '#fff' }; return; }
      hits++; streak++;
      const pts = (kind === 'hr' ? 50 : 20) + Math.min(streak - 1, 5) * 5;
      if (kind === 'hr') hr++;
      api.add(pts); api.sfx(kind === 'hr' ? 'best' : 'coin');
      U.popups.add(pops, W / 2, HY - 90, '+' + pts, '#FFD43B');
      msg = { s: kind === 'hr' ? '홈~런!! 🎆' : '안타! 👏', t: 1.1, c: '#FFD43B' };
    }

    return {
      down: doSwing,
      key(k) { if (k === 'action') doSwing(); },
      update(dt) {
        msg.t -= dt; swing = Math.max(0, swing - dt); U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (flyB) { flyB.t += dt; flyB.x += flyB.vx * dt; flyB.y += flyB.vy * dt; flyB.s = Math.max(0.2, 1 - flyB.t * 0.8); if (flyB.t > 1.2) flyB = null; }
        if (ball) { ball.t += dt / ball.dur; if (ball.t >= 1) out(ball.swung ? '헛스윙! 😵' : '스트라이크 아웃!'); }
        else if (wait > 0) { wait -= dt; if (wait <= 0 && outs < 3) pitch(); }
      },
      afterEnd(dt) { U.updateParticles(parts, dt); },
      draw(ctx) {
        ctx.fillStyle = '#4DABF7'; ctx.fillRect(0, 0, W, 110);
        ctx.fillStyle = '#1864AB'; ctx.fillRect(0, 84, W, 30);
        for (let i = 0; i < 12; i++) U.emoji(ctx, ['🙋', '🙌', '👏'][i % 3], 18 + i * 34, 70, 26);
        ctx.fillStyle = '#51CF66'; ctx.fillRect(0, 114, W, 486);
        ctx.fillStyle = '#D9A066'; ctx.beginPath(); ctx.moveTo(W / 2, 100); ctx.lineTo(W + 80, 600); ctx.lineTo(-80, 600); ctx.fill();
        ctx.fillStyle = '#C68B4E'; ctx.beginPath(); ctx.ellipse(W / 2, PY + 14, 40, 14, 0, 0, 7); ctx.fill();
        U.emoji(ctx, '🧢', W / 2, PY - 26, 30); U.emoji(ctx, '🙂', W / 2, PY - 8, 30);
        // 홈과 맞히는 자리
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(W / 2 - 34, HY - 12); ctx.lineTo(W / 2 + 34, HY - 12); ctx.lineTo(W / 2 + 34, HY + 8); ctx.lineTo(W / 2, HY + 28); ctx.lineTo(W / 2 - 34, HY + 8); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(W / 2, HY, 40, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        if (ball) {
          const y = U.lerp(PY, HY + 50, ball.t), s = 0.35 + ball.t * 0.75, x = W / 2 + ball.x * ball.t;
          ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 26 * s, 16 * s, 5 * s, 0, 0, 7); ctx.fill();
          U.emoji(ctx, '⚾', x, y, 40 * s);
        }
        if (flyB) U.emoji(ctx, '⚾', flyB.x, flyB.y, 44 * flyB.s);
        // 방망이
        ctx.save(); ctx.translate(W / 2 + 74, HY + 34);
        ctx.rotate(swing > 0 ? -2.6 * (1 - swing / 0.28) - 0.3 : 0.5);
        ctx.fillStyle = '#A0785A'; U.rr(ctx, -110, -9, 110, 18, 9); ctx.fill();
        ctx.fillStyle = '#7A5230'; U.rr(ctx, -30, -6, 34, 12, 6); ctx.fill();
        ctx.restore();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < outs ? '#FA5252' : 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(26 + i * 28, 30, 10, 0, 7); ctx.fill(); }
        U.text(ctx, '아웃', 112, 31, 18, '#fff', 'left');
        U.text(ctx, `안타 ${hits} · 홈런 ${hr}`, W - 16, 31, 20, '#fff', 'right');
        if (msg.t > 0) U.text(ctx, msg.s, W / 2, 300, 40, msg.c, 'center', '#2B2D42');
        U.text(ctx, '화면을 톡! 치면 휘둘러요', W / 2, 578, 18, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
