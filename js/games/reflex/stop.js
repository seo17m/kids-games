/* ⏱️ 딱! 멈춰 - 빙글빙글 도는 바늘을 색칠된 칸에 딱 멈추는 게임 */
registerGame({
  id: 'stop', genre: 'reflex', name: '딱! 멈춰', emoji: '⏱️', color: '#63E6BE',
  desc: '빙글빙글 바늘을 초록 칸에 딱!',
  howto: ['바늘이 초록 칸 위에 올 때 톡!', '노란 한가운데에 멈추면 PERFECT 2배 점수', '성공할수록 빨라지고 칸이 좁아져요. 3번 놓치면 끝'],
  init(api) {
    const { U, W } = api;
    const CX = W / 2, CY = 310, R = 130, TAU = Math.PI * 2;
    let a = 0, dir = 1, speed = 2.4, arc = { s: 1.5, w: 1.1 }, lives = 3, level = 1, flash = 0, fb = { t: 0, ok: true };
    const parts = [], pops = [];

    const norm = (v) => ((v % TAU) + TAU) % TAU;
    function newArc() {
      arc = { w: Math.max(0.36, 1.1 - level * 0.05), s: norm(a + dir * U.rand(1.6, 4.4)) };
    }
    function press() {
      const d = norm(a - arc.s);
      if (d <= arc.w) {
        const perfect = Math.abs(d - arc.w / 2) < arc.w * 0.18, pts = (perfect ? 20 : 10) + level;
        api.add(pts); api.sfx(perfect ? 'coin' : 'point');
        const px = CX + Math.cos(a) * R, py = CY + Math.sin(a) * R;
        U.burst(parts, px, py, perfect ? '#FFD43B' : '#51CF66', 14);
        U.popups.add(pops, CX, CY - 20, (perfect ? 'PERFECT! ' : '') + '+' + pts, perfect ? '#FFD43B' : '#fff');
        level++; speed = Math.min(6.2, speed + 0.18); dir = -dir; flash = 0.15;
        newArc();
      } else {
        lives--; api.sfx('hit'); fb = { t: 0.5, ok: false };
        if (lives <= 0) api.end();
      }
    }

    return {
      down: press,
      key(k) { if (k === 'action') press(); },
      update(dt) {
        a = norm(a + dir * speed * dt); flash = Math.max(0, flash - dt); fb.t -= dt;
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#0B3B36'; ctx.fillRect(0, 0, W, 600);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `${level}단계`, W - 24, 36, 26, '#fff', 'right');
        U.text(ctx, '초록 칸에서 톡!', W / 2, 104, 24, '#96F2D7');
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#145C54'; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#51CF66'; ctx.lineWidth = 34; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.arc(CX, CY, R, arc.s, arc.s + arc.w); ctx.stroke();
        ctx.strokeStyle = '#FFD43B';
        ctx.beginPath(); ctx.arc(CX, CY, R, arc.s + arc.w * 0.32, arc.s + arc.w * 0.68); ctx.stroke();
        if (flash > 0) { ctx.strokeStyle = `rgba(255,255,255,${flash * 5})`; ctx.lineWidth = 44; ctx.beginPath(); ctx.arc(CX, CY, R, 0, TAU); ctx.stroke(); }
        // 바늘
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(a) * (R + 14), CY + Math.sin(a) * (R + 14)); ctx.stroke();
        ctx.fillStyle = '#FF6B6B'; ctx.beginPath(); ctx.arc(CX + Math.cos(a) * R, CY + Math.sin(a) * R, 13, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(CX, CY, 16, 0, TAU); ctx.fill();
        U.drawParticles(ctx, parts); U.mark(ctx, fb, CY); U.popups.draw(ctx, pops);
        ctx.fillStyle = '#062925'; U.rr(ctx, 100, 506, 200, 70, 35); ctx.fill();
        ctx.fillStyle = '#20C997'; U.rr(ctx, 100, 500, 200, 70, 35); ctx.fill();
        U.text(ctx, '딱!', W / 2, 537, 38, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
