/* 🐹 두더지 콩콩 - 튀어나오는 친구를 콩! 때리는 게임 */
registerGame({
  id: 'mole', genre: 'arcade', name: '두더지 콩콩', emoji: '🐹', color: '#A0785A',
  desc: '30초 동안 쏙쏙 나오는 두더지를 콩!',
  howto: ['구멍에서 나온 🐹를 톡 쳐요 (+10점)', '🐰 황금 토끼는 +30점!', '💣 폭탄을 치면 -20점, 시간은 30초'],
  init(api) {
    const { U, W, H } = api;
    const LIMIT = 30;
    let left = LIMIT, spawnT = 0.5, hammer = null, combo = 0, lastTick = LIMIT;
    const holes = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) holes.push({ x: 80 + c * 120, y: 210 + r * 130, kind: null, up: 0, stay: 0, hit: 0 });
    const pops = [], parts = [];

    function spawn() {
      const empty = holes.filter((h) => !h.kind && h.hit <= 0);
      if (!empty.length) return;
      const h = U.pick(empty);
      const r = Math.random();
      h.kind = r < 0.16 ? 'bomb' : r > 0.92 ? 'gold' : 'mole';
      h.stay = Math.max(0.55, 1.15 - (LIMIT - left) * 0.02);
      h.up = 0;
    }

    return {
      down(x, y) {
        hammer = { x, y, t: 0.15 };
        for (const h of holes) {
          if (!h.kind || h.up < 0.4) continue;
          if (Math.abs(x - h.x) < 52 && y > h.y - 80 && y < h.y + 30) {
            if (h.kind === 'bomb') {
              api.set(api.score - 20); combo = 0; api.sfx('boom');
              U.burst(parts, h.x, h.y - 20, '#636E72', 14);
              U.popups.add(pops, h.x, h.y - 60, '-20', '#FF7675');
            } else {
              combo++;
              const pts = (h.kind === 'gold' ? 30 : 10) + (combo >= 5 ? 5 : 0);
              api.add(pts); api.sfx(h.kind === 'gold' ? 'coin' : 'point');
              U.burst(parts, h.x, h.y - 30, h.kind === 'gold' ? '#FFD23F' : '#E17055', 10);
              U.popups.add(pops, h.x, h.y - 60, '+' + pts, '#fff');
            }
            h.kind = null; h.hit = 0.3;
            return;
          }
        }
        combo = 0;
      },
      update(dt) {
        left -= dt;
        if (left <= 0) { left = 0; api.end(); return; }
        if (left <= 5 && Math.ceil(left) !== lastTick) { lastTick = Math.ceil(left); api.sfx('step'); }
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.28, 0.65 - (LIMIT - left) * 0.012);
          spawn();
          if (left < 15 && Math.random() < 0.4) spawn();
        }
        for (const h of holes) {
          h.hit = Math.max(0, h.hit - dt);
          if (!h.kind) continue;
          h.up = Math.min(1, h.up + dt * 6);
          h.stay -= dt;
          if (h.stay <= 0) { if (h.kind !== 'bomb') combo = 0; h.kind = null; }
        }
        if (hammer) { hammer.t -= dt; if (hammer.t <= 0) hammer = null; }
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#7BC950'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#6AB04C';
        for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = (i * 61) % H; ctx.fillRect(x, y, 4, 10); ctx.fillRect(x + 6, y + 2, 4, 8); }
        // 남은 시간 막대
        ctx.fillStyle = '#fff'; U.rr(ctx, 20, 70, W - 40, 22, 11); ctx.fill();
        ctx.fillStyle = left > 10 ? '#00B894' : left > 5 ? '#FDCB6E' : '#FF7675';
        U.rr(ctx, 23, 73, (W - 46) * (left / LIMIT), 16, 8); ctx.fill();
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W / 2, 40, 26, '#fff', 'center', '#2B2D42');

        for (const h of holes) {
          ctx.fillStyle = '#5D4037';
          ctx.beginPath(); ctx.ellipse(h.x, h.y, 50, 20, 0, 0, 7); ctx.fill();
          if (h.kind) {
            const rise = h.up * 46;
            ctx.save();
            ctx.beginPath(); ctx.rect(h.x - 60, h.y - 120, 120, 120); ctx.clip();
            U.emoji(ctx, h.kind === 'bomb' ? '💣' : h.kind === 'gold' ? '🐰' : '🐹', h.x, h.y + 20 - rise, 56);
            ctx.restore();
          }
          if (h.hit > 0) U.emoji(ctx, '💫', h.x, h.y - 40, 34);
          ctx.fillStyle = '#8D6E63';
          ctx.beginPath(); ctx.ellipse(h.x, h.y + 6, 56, 14, 0, 0, Math.PI); ctx.fill();
        }
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        if (hammer) {
          ctx.save(); ctx.translate(hammer.x + 16, hammer.y - 16); ctx.rotate(-0.6 + (0.15 - hammer.t) * 6);
          U.emoji(ctx, '🔨', 0, 0, 48); ctx.restore();
        }
        if (combo >= 5) U.text(ctx, `🔥 ${combo} 콤보!`, W / 2, 575, 24, '#fff', 'center', '#D35400');
      },
    };
  },
});
