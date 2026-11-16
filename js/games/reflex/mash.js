/* 🚀 다다다 로켓 - 10초 동안 최대한 빨리 눌러 로켓을 쏘아 올리는 게임 */
registerGame({
  id: 'mash', genre: 'reflex', name: '다다다 로켓', emoji: '🚀', color: '#B197FC',
  desc: '10초 동안 다다다다! 로켓을 우주로',
  howto: ['화면 아무 데나 최대한 빨리 연속으로 눌러요', '누를 때마다 로켓이 높이 올라가요', '10초 동안 누른 횟수가 점수! (스페이스바도 돼요)'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 10;
    let left = LIMIT, taps = 0, vel = 0, scroll = 0, shake = 0, recent = [];
    const stars = Array.from({ length: 50 }, () => ({ x: U.rand(0, W), y: U.rand(0, 600), r: U.rand(1, 3) }));
    const parts = [];

    function tap() {
      if (left <= 0) return;
      taps++; api.add(1); vel = Math.min(1400, vel + 90); shake = 0.08;
      recent.push(LIMIT - left);
      api.note(220 + Math.min(taps, 120) * 6, 0.05);
      U.burst(parts, W / 2 + U.rand(-10, 10), 370, U.pick(['#FFD43B', '#FF922B', '#FF6B6B']), 3, 160);
    }

    return {
      down: tap,
      key(k) { if (k === 'action') tap(); },
      update(dt) {
        left -= dt;
        if (left <= 0) { left = 0; api.end(); return; }
        vel *= Math.pow(0.12, dt); scroll += vel * dt; shake = Math.max(0, shake - dt);
        const now = LIMIT - left;
        recent = recent.filter((r) => now - r < 1);
        U.updateParticles(parts, dt, 900);
      },
      draw(ctx) {
        const h = Math.min(1, taps / 120);
        const sky = ctx.createLinearGradient(0, 0, 0, 600);
        sky.addColorStop(0, `hsl(${220 + h * 40}, 65%, ${55 - h * 45}%)`);
        sky.addColorStop(1, `hsl(${200 + h * 50}, 75%, ${80 - h * 55}%)`);
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#fff';
        for (const s of stars) {
          ctx.globalAlpha = 0.25 + h * 0.75;
          const y = (s.y + scroll * (0.3 + s.r * 0.2)) % 600;
          ctx.fillRect(s.x, y, s.r, s.r + Math.min(30, vel * 0.02 * s.r));
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < 3; i++) U.emoji(ctx, h < 0.5 ? '☁️' : '🪐', 60 + i * 140, ((i * 230 + scroll * 0.6) % 760) - 80, 60);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${left.toFixed(1)}초`, W / 2, 70, 30, '#fff', 'center', '#2B2D42');
        U.text(ctx, String(taps), W / 2, 150, 90, '#fff', 'center', '#2B2D42');
        U.text(ctx, `1초에 ${recent.length}번!`, W / 2, 212, 22, '#FFE066', 'center', '#2B2D42');
        U.drawParticles(ctx, parts);
        ctx.save();
        ctx.translate(W / 2 + (shake > 0 ? U.rand(-4, 4) : 0), 320 - Math.min(40, vel * 0.03));
        ctx.rotate(-Math.PI / 4);
        U.emoji(ctx, '🚀', 0, 0, 96);
        ctx.restore();
        const on = shake > 0;
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, 60, 466, 280, 100, 50); ctx.fill();
        ctx.fillStyle = on ? '#FF8787' : '#FF6B6B'; U.rr(ctx, 60, 458 + (on ? 6 : 0), 280, 100, 50); ctx.fill();
        U.text(ctx, '다다다다!', W / 2, 510 + (on ? 6 : 0), 40, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
