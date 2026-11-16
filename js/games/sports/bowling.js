/* 🎳 데굴데굴 볼링 - 화살표 타이밍을 맞춰 핀을 쓰러뜨리는 게임 */
registerGame({
  id: 'bowling', genre: 'sports', name: '데굴데굴 볼링', emoji: '🎳', color: '#B197FC',
  desc: '핀 10개를 한 번에 와르르! 스트라이크',
  howto: ['공을 좌우로 끌어서 자리를 잡아요', '화살표가 원하는 쪽을 가리킬 때 "굴리기!"', '5판, 한 판에 두 번씩! 스트라이크는 보너스'],
  init(api) {
    const { U, W } = api;
    const FRAMES = 5, BTN = { x: 110, y: 536, w: 180, h: 54, color: '#7950F2', label: '굴리기!', tc: '#fff', size: 26 };
    let pins = [], ball = null, bx = 200, ang = 0, at = 0, frame = 1, roll = 1, wait = 0, msg = { s: '', t: 0 }, dragging = false, standingBefore = 10;
    const parts = [], pops = [];

    function rack() {
      pins = [];
      for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) pins.push({ x: 200 + (i - r / 2) * 36, y: 170 - r * 31, up: true, vx: 0, vy: 0, t: 0, rot: 0 });
      standingBefore = 10;
    }
    const standing = () => pins.filter((p) => p.up).length;
    function knock(p, vx, vy) { p.up = false; p.vx = vx; p.vy = vy; p.t = 0.45; api.sfx('bounce'); U.burst(parts, p.x, p.y, '#fff', 4, 120); }
    function settle() {
      const now = standing(), down = standingBefore - now;
      let pts = down * 10;
      if (now === 0) {
        pts += roll === 1 ? 100 : 50;
        msg = { s: roll === 1 ? '스트라이크! 🎉' : '스페어! 👏', t: 1.3 }; api.sfx('best');
      } else msg = { s: down ? `${down}개 쓰러뜨렸어요` : '아쉬워요…', t: 1.1 };
      if (pts) { api.add(pts); U.popups.add(pops, 200, 240, '+' + pts, '#FFD43B'); }
      if (now === 0 || roll === 2) { frame++; roll = 1; if (frame > FRAMES) { api.end(); return; } rack(); }
      else { roll = 2; standingBefore = now; pins = pins.filter((p) => p.up); }
      ball = null; bx = 200;
    }
    function launch() {
      if (ball || wait > 0) return;
      ball = { x: bx, y: 470, vx: Math.sin(ang) * 560, vy: -Math.cos(ang) * 560, rot: 0 };
      api.sfx('jump');
    }
    rack();

    return {
      down(x, y) { if (U.hit(x, y, BTN)) launch(); else if (!ball && y > 400 && y < 530) { dragging = true; bx = U.clamp(x, 110, 290); } },
      move(x) { if (dragging && api.pointer.down && !ball) bx = U.clamp(x, 110, 290); },
      up() { dragging = false; },
      key(k) { if (k === 'action' || k === 'up') launch(); },
      update(dt) {
        msg.t -= dt; U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (!ball) {
          if (api.keys.has('left')) bx = Math.max(110, bx - 160 * dt);
          if (api.keys.has('right')) bx = Math.min(290, bx + 160 * dt);
          at += dt * (1.6 + frame * 0.25); ang = Math.sin(at) * 0.36;
        }
        if (wait > 0) { wait -= dt; if (wait <= 0) settle(); }
        if (ball) {
          ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += dt * 10;
          if (ball.x < 84 || ball.x > 316) { ball.x = U.clamp(ball.x, 84, 316); ball.vx = 0; }
          for (const p of pins) if (p.up && U.dist(p.x, p.y, ball.x, ball.y) < 27) {
            const dx = p.x - ball.x, dy = p.y - ball.y, d = Math.hypot(dx, dy) || 1;
            knock(p, (dx / d) * 230 + ball.vx * 0.25, (dy / d) * 230 + ball.vy * 0.35);
            ball.vx -= (dx / d) * 40;
          }
          if (ball.y < 20 && wait <= 0) wait = 0.9;
        }
        for (const p of pins) {
          if (p.up || p.t <= 0) continue;
          p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 9;
          for (const q of pins) if (q.up && U.dist(p.x, p.y, q.x, q.y) < 25) {
            const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
            knock(q, (dx / d) * 170 + p.vx * 0.4, (dy / d) * 170 + p.vy * 0.4);
          }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#2B2D42'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#495057'; ctx.fillRect(56, 0, 288, 600);
        const lane = ctx.createLinearGradient(0, 0, 0, 600); lane.addColorStop(0, '#F1C27D'); lane.addColorStop(1, '#E0A458');
        ctx.fillStyle = lane; ctx.fillRect(80, 0, 240, 600);
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2;
        for (let x = 110; x < 320; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
        for (const p of pins) {
          ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = p.up ? 1 : Math.max(0, p.t * 2.2);
          if (!p.up) ctx.rotate(p.rot);
          ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(2, 12, 10, 4, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 2, 9, 13, 0, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(0, -14, 6, 0, 7); ctx.fill();
          ctx.fillStyle = '#FA5252'; ctx.fillRect(-6, -9, 12, 3);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        const x = ball ? ball.x : bx, y = ball ? ball.y : 470;
        if (!ball && wait <= 0) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.setLineDash([12, 10]);
          ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -170); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -196); ctx.lineTo(-14, -168); ctx.lineTo(14, -168); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, 19, 17, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#4C6EF5'; ctx.beginPath(); ctx.arc(x, y, 19, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(x, y); ctx.rotate(ball ? ball.rot : 0); ctx.fillStyle = '#1C2A6B';
        for (const [hx, hy] of [[-5, -7], [5, -7], [0, 1]]) { ctx.beginPath(); ctx.arc(hx, hy, 2.6, 0, 7); ctx.fill(); }
        ctx.restore();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.text(ctx, `${Math.min(frame, FRAMES)}/${FRAMES}판 · ${roll}번째`, W / 2, 30, 22, '#fff', 'center', '#2B2D42');
        if (msg.t > 0) U.text(ctx, msg.s, W / 2, 300, 38, '#FFD43B', 'center', '#2B2D42');
        if (!ball && wait <= 0) U.btn(ctx, BTN);
      },
    };
  },
});
