/* 🍉 싹둑 과일 - 튀어 오르는 과일을 손가락으로 그어 자르는 게임 */
registerGame({
  id: 'slice', genre: 'reflex', name: '싹둑 과일', emoji: '🍉', color: '#FF8FAB',
  desc: '휙! 그어서 과일을 싹둑싹둑',
  howto: ['튀어 오르는 과일을 손가락(마우스)으로 휙 그어요', '한 번에 여러 개를 자르면 콤보 보너스!', '💣 폭탄을 자르면 ❤️가 줄어요. 60초 도전'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 60, FRUITS = ['🍉', '🍎', '🍊', '🍋', '🍑', '🥝', '🍍', '🥥', '🍓'];
    const JUICE = { '🍉': '#FF6B6B', '🍎': '#FA5252', '🍊': '#FF922B', '🍋': '#FFD43B', '🍑': '#FFA8A8', '🥝': '#94D82D', '🍍': '#FCC419', '🥥': '#F1F3F5', '🍓': '#F03E3E' };
    let left = LIMIT, t = 0, spawnT = 0.6, lives = 3, last = null, stroke = 0, flash = 0;
    const items = [], halves = [], trail = [], parts = [], pops = [];

    function toss() {
      const n = U.randInt(1, t > 20 ? 4 : t > 8 ? 3 : 2);
      for (let i = 0; i < n; i++) {
        const bomb = Math.random() < Math.min(0.22, 0.08 + t * 0.003), x = U.rand(60, W - 60);
        items.push({ x, y: 630, vx: (W / 2 - x) * U.rand(0.3, 0.9) + U.rand(-40, 40), vy: -U.rand(760, 900), rot: 0, vr: U.rand(-4, 4), bomb, e: bomb ? '💣' : U.pick(FRUITS) });
      }
      api.sfx('flap');
    }
    function segDist(px, py, ax, ay, bx, by) {
      const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
      const k = l ? U.clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
      return Math.hypot(px - ax - dx * k, py - ay - dy * k);
    }
    function cut(x, y) {
      if (last) {
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (segDist(it.x, it.y, last.x, last.y, x, y) > 30) continue;
          items.splice(i, 1);
          if (it.bomb) {
            lives--; flash = 0.3; api.sfx('boom'); U.burst(parts, it.x, it.y, '#495057', 24, 300);
            if (lives <= 0) api.end();
            continue;
          }
          stroke++;
          const pts = 10 + (stroke - 1) * 5;
          api.add(pts); api.sfx(stroke > 1 ? 'coin' : 'point');
          U.burst(parts, it.x, it.y, JUICE[it.e], 12, 220);
          U.popups.add(pops, it.x, it.y - 30, (stroke > 1 ? `${stroke}콤보 ` : '') + '+' + pts, '#fff');
          for (const s of [-1, 1]) halves.push({ x: it.x, y: it.y, vx: it.vx + s * 110, vy: it.vy * 0.4 - 80, rot: it.rot, vr: s * 5, s, e: it.e });
        }
      }
      last = { x, y }; trail.push({ x, y, life: 0.22 });
    }

    return {
      down(x, y) { last = null; stroke = 0; cut(x, y); },
      move(x, y) { if (api.pointer.down) cut(x, y); },
      up() { last = null; },
      update(dt) {
        t += dt; left -= dt; flash = Math.max(0, flash - dt);
        if (left <= 0) { left = 0; api.end(); return; }
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = Math.max(0.75, 1.5 - t * 0.012); toss(); }
        for (const list of [items, halves]) for (let i = list.length - 1; i >= 0; i--) {
          const o = list[i];
          o.vy += 1150 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
          if (o.y > 680 && o.vy > 0) list.splice(i, 1);
        }
        for (let i = trail.length - 1; i >= 0; i--) { trail[i].life -= dt; if (trail[i].life <= 0) trail.splice(i, 1); }
        U.updateParticles(parts, dt, 700); U.popups.update(pops, dt);
      },
      draw(ctx) {
        const bg = ctx.createLinearGradient(0, 0, 0, 600);
        bg.addColorStop(0, '#5C3D2E'); bg.addColorStop(1, '#3B2518');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 600);
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 3;
        for (let x = 50; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
        U.timeBar(ctx, left / LIMIT);
        U.hearts(ctx, lives, 3, 30, 66);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W - 24, 66, 24, '#fff', 'right');
        for (const h of halves) {
          ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
          ctx.beginPath(); ctx.rect(h.s < 0 ? -34 : 0, -34, 34, 68); ctx.clip();
          U.emoji(ctx, h.e, 0, 0, 54); ctx.restore();
        }
        for (const it of items) { ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); U.emoji(ctx, it.e, 0, 0, 56); ctx.restore(); }
        U.drawParticles(ctx, parts);
        ctx.lineCap = 'round'; ctx.strokeStyle = '#fff';
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1], b = trail[i];
          if (U.dist(a.x, a.y, b.x, b.y) > 120) continue;
          ctx.globalAlpha = Math.max(0, b.life / 0.22); ctx.lineWidth = 2 + (b.life / 0.22) * 8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (flash > 0) { ctx.fillStyle = `rgba(255,80,80,${flash * 1.5})`; ctx.fillRect(0, 0, W, 600); }
        U.popups.draw(ctx, pops);
      },
    };
  },
});
