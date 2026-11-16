/* 🏀 슛! 농구왕 - 공을 밀어 올려 골대에 넣는 게임 */
registerGame({
  id: 'hoops', genre: 'sports', name: '슛! 농구왕', emoji: '🏀', color: '#FFA94D',
  desc: '포물선을 그리며 깨끗하게 쏙!',
  howto: ['공을 위쪽으로 끌면 점선으로 날아갈 길이 보여요', '점선이 골대에 들어가게 맞추고 손을 떼요', '45초 도전! 넣을수록 골대가 움직여요'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 45, G = 1500, HY = 200, SX = W / 2, SY = 500;
    let left = LIMIT, hx = 200, hv = 0, ball = null, start = null, made = 0, streak = 0, rest = 0, shake = 0;
    const parts = [], pops = [];

    const vel = (dx, dy) => ({ vx: U.clamp(dx * 1.7, -420, 420), vy: U.clamp(dy * 6, -1350, 0) });

    return {
      down(x, y) { if (!ball) start = { x, y }; },
      up(x, y) {
        if (!start || ball) { start = null; return; }
        const dx = x - start.x, dy = y - start.y; start = null;
        if (dy > -30) return;
        ball = { x: SX, y: SY, ...vel(dx, dy), rot: 0, done: false }; api.sfx('jump');
      },
      update(dt) {
        left -= dt; shake = Math.max(0, shake - dt);
        if (left <= 0) { left = 0; api.end(); return; }
        if (hv) { hx += hv * dt; if (hx < 80 || hx > 320) { hv = -hv; hx = U.clamp(hx, 80, 320); } }
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (!ball) return;
        const py = ball.y;
        ball.vy += G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += ball.vx * dt * 0.02;
        if (ball.x < 22 || ball.x > W - 22) { ball.vx = -ball.vx * 0.7; ball.x = U.clamp(ball.x, 22, W - 22); }
        if (!ball.done && ball.vy > 0 && py < HY && ball.y >= HY) {
          const d = Math.abs(ball.x - hx);
          if (d < 28) {
            ball.done = true; made++; streak++;
            const clean = d < 11, pts = (clean ? 20 : 10) + Math.min(streak - 1, 5) * 5;
            api.add(pts); api.sfx(clean ? 'best' : 'coin'); shake = 0.25;
            U.burst(parts, hx, HY + 20, '#FFD43B', 14);
            U.popups.add(pops, hx, HY - 50, (clean ? '깨끗해! ' : '') + '+' + pts, '#FFD43B');
            ball.vx *= 0.2;
            hx = U.rand(90, 310); if (made >= 3) hv = (Math.random() < 0.5 ? -1 : 1) * Math.min(150, 40 + made * 10);
          } else if (d < 46) { ball.vx = (ball.x < hx ? -1 : 1) * 160; ball.vy = -260; api.sfx('bounce'); }
        }
        if (ball.y > 660) { if (!ball.done) streak = 0; ball = null; rest = 0.1; }
      },
      draw(ctx) {
        ctx.fillStyle = '#FFE8CC'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#E8B77D'; ctx.fillRect(0, 540, W, 60);
        ctx.fillStyle = '#D9A066'; for (let x = 0; x < W; x += 50) ctx.fillRect(x, 540, 3, 60);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#D9480F', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `🏀 ${made}골`, W - 24, 66, 22, '#D9480F', 'right');
        // 백보드와 림 뒤쪽
        ctx.fillStyle = '#fff'; U.rr(ctx, hx - 56, HY - 96, 112, 84, 8); ctx.fill();
        ctx.strokeStyle = '#E8590C'; ctx.lineWidth = 4; ctx.strokeRect(hx - 22, HY - 52, 44, 34);
        ctx.strokeStyle = '#ADB5BD'; ctx.lineWidth = 2; ctx.beginPath();
        const sw = shake > 0 ? Math.sin(shake * 60) * 4 : 0;
        for (let i = -3; i <= 3; i++) { ctx.moveTo(hx + i * 10, HY); ctx.lineTo(hx + i * 7 + sw, HY + 44); }
        ctx.stroke();
        const drawBall = (x, y, r) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); U.emoji(ctx, '🏀', 0, 0, 46); ctx.restore(); };
        if (ball) drawBall(ball.x, ball.y, ball.rot);
        else {
          drawBall(SX, SY, 0);
          if (start && api.pointer.down) {
            const dx = api.pointer.x - start.x, dy = api.pointer.y - start.y;
            if (dy < -30) {
              const v = vel(dx, dy); ctx.fillStyle = 'rgba(232,89,12,.65)';
              for (let t = 0.06; t < 1.4; t += 0.06) {
                const x = SX + v.vx * t, y = SY + v.vy * t + 0.5 * G * t * t;
                if (y > SY + 10) break;
                ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
              }
            }
          } else U.text(ctx, '👆 공을 위로 끌어요', W / 2, 578, 20, '#8D5524');
        }
        // 림 앞쪽
        ctx.strokeStyle = '#E8590C'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(hx - 34, HY); ctx.lineTo(hx + 34, HY); ctx.stroke();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
      },
    };
  },
});
