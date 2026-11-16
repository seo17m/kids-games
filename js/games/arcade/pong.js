/* 🏓 로봇 탁구 - 로봇과 겨루는 탁구 게임 */
registerGame({
  id: 'pong', genre: 'arcade', name: '로봇 탁구', emoji: '🏓', color: '#00CEC9',
  desc: '점점 강해지는 로봇을 이겨라!',
  howto: ['손가락으로 끌거나 ←→ 키로 라켓을 움직여요', '공을 받아치면 +10, 로봇이 놓치면 +100', '공을 3번 놓치면 끝!'],
  init(api) {
    const { U, W, H } = api;
    const me = { x: 160, y: 548, w: 84, h: 14 };
    const bot = { x: 160, y: 40, w: 84, h: 14 };
    const R = 9;
    const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    let lives = 3, wins = 0, speed = 300, serveT = 1, aimOff = 0, flash = 0, msg = '';
    const parts = [];

    function serve(toMe) {
      ball.x = W / 2; ball.y = H / 2; ball.vx = 0; ball.vy = 0;
      speed = 300 + wins * 12;
      serveT = 1;
      ball.dir = toMe ? 1 : -1;
    }
    function bounce(pad, dirY) {
      const off = U.clamp((ball.x - (pad.x + pad.w / 2)) / (pad.w / 2), -1, 1);
      const a = off * 1.0;
      speed = Math.min(680, speed * 1.04);
      ball.vx = Math.sin(a) * speed;
      ball.vy = Math.cos(a) * speed * dirY;
      api.sfx('bounce');
      U.burst(parts, ball.x, ball.y, '#fff', 6, 120);
    }
    serve(true);

    return {
      down(x) { me.x = U.clamp(x - me.w / 2, 0, W - me.w); },
      move(x) { if (api.pointer.down) me.x = U.clamp(x - me.w / 2, 0, W - me.w); },
      update(dt) {
        if (api.keys.has('left')) me.x -= 480 * dt;
        if (api.keys.has('right')) me.x += 480 * dt;
        me.x = U.clamp(me.x, 0, W - me.w);
        flash = Math.max(0, flash - dt);
        U.updateParticles(parts, dt, 0);

        // 로봇 움직임 (이길수록 빨라져요)
        const botSpeed = Math.min(430, 190 + wins * 28);
        const tx = (ball.vy < 0 ? ball.x + aimOff : W / 2) - bot.w / 2;
        bot.x += U.clamp(tx - bot.x, -botSpeed * dt, botSpeed * dt);
        bot.x = U.clamp(bot.x, 0, W - bot.w);

        if (serveT > 0) {
          serveT -= dt;
          if (serveT <= 0) {
            const a = U.rand(-0.5, 0.5);
            ball.vx = Math.sin(a) * speed; ball.vy = Math.cos(a) * speed * ball.dir;
            aimOff = U.rand(-40, 40);
          }
          return;
        }
        const steps = Math.ceil((speed * dt) / 5), sdt = dt / steps;
        for (let s = 0; s < steps; s++) {
          ball.x += ball.vx * sdt; ball.y += ball.vy * sdt;
          if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
          if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
          if (ball.vy > 0 && ball.y + R >= me.y && ball.y + R <= me.y + me.h + 10 && ball.x > me.x - R && ball.x < me.x + me.w + R) {
            ball.y = me.y - R; bounce(me, -1); api.add(10);
            aimOff = U.rand(-55, 55) * (1 - Math.min(0.7, wins * 0.08));
          }
          if (ball.vy < 0 && ball.y - R <= bot.y + bot.h && ball.y - R >= bot.y - 10 && ball.x > bot.x - R && ball.x < bot.x + bot.w + R) {
            ball.y = bot.y + bot.h + R; bounce(bot, 1);
          }
        }
        if (ball.y < -20) {
          wins++; api.add(100); api.sfx('coin'); flash = 0.3; msg = '득점! 🎉';
          serve(false);
        } else if (ball.y > H + 20) {
          lives--; api.sfx('hit'); msg = '앗, 놓쳤다!';
          if (lives <= 0) { api.end(); return; }
          serve(true);
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#0A7D5E'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, W - 24, H - 24);
        ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(12, H / 2); ctx.lineTo(W - 12, H / 2); ctx.stroke();
        ctx.setLineDash([]);
        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }

        ctx.fillStyle = '#FF7675'; U.rr(ctx, bot.x, bot.y, bot.w, bot.h, 7); ctx.fill();
        U.emoji(ctx, '🤖', bot.x + bot.w / 2, bot.y - 2, 26);
        ctx.fillStyle = '#FFD23F'; U.rr(ctx, me.x, me.y, me.w, me.h, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 7); ctx.fill();
        U.drawParticles(ctx, parts);

        U.hearts(ctx, lives, 3, 30, H - 24);
        U.text(ctx, `🤖 레벨 ${wins + 1}`, W - 24, H - 24, 18, '#fff', 'right');
        if (serveT > 0) U.text(ctx, msg || '준비!', W / 2, H / 2 - 40, 30, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
