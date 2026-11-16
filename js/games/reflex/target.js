/* 🎯 과녁 톡톡 - 나타났다 사라지는 과녁을 빠르게 맞히는 게임 */
registerGame({
  id: 'target', genre: 'reflex', name: '과녁 톡톡', emoji: '🎯', color: '#FF8787',
  desc: '금방 사라지는 과녁을 재빨리 톡!',
  howto: ['과녁이 나타나면 사라지기 전에 톡!', '한가운데를 맞히면 2배 점수', '30초 도전! 빗나가면 연속 기록이 끊겨요'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 30;
    let left = LIMIT, t = 0, spawnT = 0.3, combo = 0, hits = 0, shots = 0;
    const targets = [], parts = [], pops = [];

    function spawn() {
      const r = Math.max(22, 36 - t * 0.4);
      for (let k = 0; k < 20; k++) {
        const x = U.rand(r + 10, W - r - 10), y = U.rand(100 + r, 570 - r);
        if (targets.every((o) => U.dist(x, y, o.x, o.y) > o.r + r + 8)) {
          const life = Math.max(0.9, 1.7 - t * 0.02);
          targets.push({ x, y, r, life, max: life }); return;
        }
      }
    }

    return {
      down(x, y) {
        shots++;
        for (let i = targets.length - 1; i >= 0; i--) {
          const o = targets[i], d = U.dist(x, y, o.x, o.y);
          if (d > o.r + 6) continue;
          targets.splice(i, 1);
          combo++; hits++;
          const bull = d < o.r * 0.38, pts = (bull ? 20 : 10) + Math.min(combo, 10);
          api.add(pts); api.sfx(bull ? 'coin' : 'point');
          U.burst(parts, o.x, o.y, bull ? '#FFD43B' : '#FF6B6B', 12);
          U.popups.add(pops, o.x, o.y - 20, (bull ? '명중! ' : '') + '+' + pts, bull ? '#FFD43B' : '#fff');
          return;
        }
        combo = 0; api.sfx('step');
      },
      update(dt) {
        t += dt; left -= dt;
        if (left <= 0) { left = 0; api.end(); return; }
        spawnT -= dt;
        if (spawnT <= 0 && targets.length < 5) { spawnT = Math.max(0.3, 0.75 - t * 0.012); spawn(); }
        for (let i = targets.length - 1; i >= 0; i--) { targets[i].life -= dt; if (targets[i].life <= 0) { targets.splice(i, 1); combo = 0; } }
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#22343F'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#fff', 'left');
        U.text(ctx, combo >= 2 ? `🔥 ${combo}연속` : `명중 ${hits}번`, W - 24, 66, 22, '#fff', 'right');
        for (const o of targets) {
          const k = o.life / o.max, s = Math.min(1, (o.max - o.life) * 8);
          ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
          ['#fff', '#FF6B6B', '#fff', '#FF6B6B'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, o.r * (1 - i * 0.22), 0, 7); ctx.fill(); });
          ctx.fillStyle = '#FFD43B'; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.2, 0, 7); ctx.fill();
          ctx.strokeStyle = k > 0.4 ? '#8CE99A' : '#FFA8A8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(0, 0, o.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
          ctx.restore();
        }
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
      },
    };
  },
});
