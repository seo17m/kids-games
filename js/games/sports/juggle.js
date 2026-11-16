/* ⚽ 통통 리프팅 - 공이 땅에 떨어지지 않게 계속 차 올리는 게임 */
registerGame({
  id: 'juggle', genre: 'sports', name: '통통 리프팅', emoji: '🦶', color: '#74C0FC',
  desc: '공을 떨어뜨리지 마! 몇 번 찰 수 있을까?',
  howto: ['떨어지는 공을 톡 쳐서 위로 차 올려요', '공의 왼쪽을 치면 오른쪽으로, 오른쪽을 치면 왼쪽으로 가요', '땅에 닿으면 끝! 찬 횟수가 점수'],
  init(api) {
    const { U, W } = api;
    const R = 34, GROUND = 560;
    const ball = { x: W / 2, y: 200, vx: 0, vy: 0, rot: 0 };
    let n = 0, started = false, dead = false, best = 0;
    const parts = [], pops = [];

    return {
      down(x, y) {
        // 방금 찬 공(아직 빠르게 올라가는 중)은 다시 찰 수 없어요
        if (dead || U.dist(x, y, ball.x, ball.y) > R + 34 || (started && ball.vy < -350)) return;
        started = true; n++; api.add(1);
        ball.vy = -(700 + Math.min(n, 40) * 3);
        ball.vx = U.clamp((ball.x - x) * 9 + U.rand(-40, 40), -330, 330);
        best = Math.max(best, n);
        api.note(330 + (n % 8) * 40, 0.08);
        U.burst(parts, x, y, '#fff', 6, 150);
        if (n % 10 === 0) { U.popups.add(pops, ball.x, ball.y - 50, `${n}번! 👏`, '#FFD43B'); api.sfx('coin'); }
      },
      update(dt) {
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (!started) { ball.y = 200 + Math.sin(performance.now() / 300) * 8; return; }
        ball.vy += (1300 + Math.min(n, 50) * 12) * dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += ball.vx * dt * 0.02;
        if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx) * 0.8; api.sfx('step'); }
        if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx) * 0.8; api.sfx('step'); }
        if (ball.y < R + 60) { ball.y = R + 60; ball.vy = Math.abs(ball.vy) * 0.5; }
        if (ball.y > GROUND - R) { ball.y = GROUND - R; dead = true; api.sfx('hit'); U.burst(parts, ball.x, GROUND, '#8CE99A', 14); api.end(); }
      },
      afterEnd(dt) { U.updateParticles(parts, dt); },
      draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#74C0FC'); sky.addColorStop(1, '#E7F5FF');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
        U.emoji(ctx, '☁️', 80, 130, 60); U.emoji(ctx, '☁️', 320, 220, 44);
        ctx.fillStyle = '#51CF66'; ctx.fillRect(0, GROUND, W, 40);
        ctx.fillStyle = '#40C057'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, GROUND, 20, 40);
        U.text(ctx, String(n), W / 2, 330, 180, 'rgba(255,255,255,.55)');
        const k = 1 - (GROUND - R - ball.y) / 500;
        ctx.fillStyle = `rgba(0,0,0,${0.08 + k * 0.15})`; ctx.beginPath(); ctx.ellipse(ball.x, GROUND + 4, R * (0.5 + k * 0.5), 7, 0, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.rot); U.emoji(ctx, '⚽', 0, 0, R * 2); ctx.restore();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        if (!started) U.text(ctx, '👆 공을 톡 쳐서 시작!', W / 2, 470, 26, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
