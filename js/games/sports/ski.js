/* ⛷️ 씽씽 스키 - 깃발 사이를 통과하며 눈 언덕을 내려가는 게임 */
registerGame({
  id: 'ski', genre: 'sports', name: '씽씽 스키', emoji: '⛷️', color: '#A5D8FF',
  desc: '깃발 사이로 요리조리! 눈 위를 달려요',
  howto: ['손가락으로 끌거나 ←→ 키로 스키 선수를 움직여요', '빨강·파랑 깃발 사이를 통과하면 점수!', '깃발을 놓치거나 🌲 나무에 부딪히면 ❤️가 줄어요'],
  init(api) {
    const { U, W } = api;
    const SY = 170;
    const me = { x: W / 2, tx: W / 2, lean: 0 };
    let lives = 3, t = 0, dist = 0, nextGate = 300, nextTree = 180, passed = 0, inv = 0, streak = 0;
    const gates = [], trees = [], trail = [], parts = [], pops = [];

    const speed = () => Math.min(520, 230 + t * 5);
    function hurt(msg, x) {
      if (inv > 0) return;
      lives--; inv = 1; streak = 0; api.sfx('hit'); U.popups.add(pops, x, SY + 60, msg, '#C92A2A');
      if (lives <= 0) api.end();
    }

    return {
      down(x) { me.tx = x; },
      move(x) { if (api.pointer.down) me.tx = x; },
      update(dt) {
        t += dt; inv = Math.max(0, inv - dt);
        if (api.keys.has('left')) me.tx = me.x - 60;
        if (api.keys.has('right')) me.tx = me.x + 60;
        me.tx = U.clamp(me.tx, 30, W - 30);
        const mv = U.clamp(me.tx - me.x, -430 * dt, 430 * dt);
        me.x += mv; me.lean = U.lerp(me.lean, U.clamp(mv / dt / 430, -1, 1), Math.min(1, dt * 10));
        const dy = speed() * dt; dist += dy;
        nextGate -= dy; nextTree -= dy;
        if (nextGate <= 0) {
          const gap = Math.max(84, 130 - passed * 1.5), prev = gates.length ? gates[gates.length - 1].x : W / 2;
          gates.push({ x: U.clamp(prev + U.rand(-170, 170), 70 + gap / 2, W - 70 - gap / 2), y: 640, gap, done: false });
          nextGate = Math.max(210, 330 - t * 2);
        }
        if (nextTree <= 0) {
          const x = U.rand(20, W - 20);
          if (gates.every((g) => Math.abs(g.y - 640) > 70 || Math.abs(g.x - x) > g.gap / 2 + 40)) trees.push({ x, y: 640, hit: false });
          nextTree = U.rand(120, 260);
        }
        for (let i = gates.length - 1; i >= 0; i--) {
          const g = gates[i]; g.y -= dy;
          if (!g.done && g.y <= SY) {
            g.done = true;
            if (Math.abs(me.x - g.x) < g.gap / 2) {
              passed++; streak++; const pts = 10 + Math.min(streak - 1, 10) * 2;
              api.add(pts); api.sfx('point'); U.popups.add(pops, g.x, SY - 30, '+' + pts, '#1864AB');
            } else hurt('깃발을 놓쳤어요!', me.x);
          }
          if (g.y < -40) gates.splice(i, 1);
        }
        for (let i = trees.length - 1; i >= 0; i--) {
          const tr = trees[i]; tr.y -= dy;
          if (!tr.hit && Math.abs(tr.y - SY) < 20 && Math.abs(tr.x - me.x) < 24) { tr.hit = true; U.burst(parts, tr.x, tr.y, '#fff', 14); hurt('쿵! 🌲', me.x); }
          if (tr.y < -50) trees.splice(i, 1);
        }
        trail.push({ x: me.x, y: SY + 14 });
        for (let i = trail.length - 1; i >= 0; i--) { trail[i].y -= dy; if (trail[i].y < -10) trail.splice(i, 1); }
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#F1F8FF'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#DCEEFB';
        for (let i = 0; i < 8; i++) { const y = ((i * 90 - dist) % 720 + 720) % 720 - 60; ctx.beginPath(); ctx.ellipse((i * 137) % W, y, 70, 14, 0, 0, 7); ctx.fill(); }
        ctx.strokeStyle = '#C5DCEE'; ctx.lineWidth = 3;
        for (const off of [-7, 7]) { ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(p.x + off, p.y) : ctx.moveTo(p.x + off, p.y))); ctx.stroke(); }
        for (const g of gates) {
          ctx.globalAlpha = g.done ? 0.4 : 1;
          ctx.fillStyle = 'rgba(77,171,247,.14)'; ctx.fillRect(g.x - g.gap / 2, g.y - 4, g.gap, 8);
          for (const [s, c] of [[-1, '#FA5252'], [1, '#339AF0']]) {
            const x = g.x + (s * g.gap) / 2;
            ctx.fillStyle = '#495057'; ctx.fillRect(x - 2, g.y - 44, 4, 48);
            ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, g.y - 44); ctx.lineTo(x - s * 24, g.y - 34); ctx.lineTo(x, g.y - 24); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        for (const tr of trees) U.emoji(ctx, '🌲', tr.x, tr.y - 14, 46);
        if (!(inv > 0 && Math.floor(inv * 10) % 2)) {
          ctx.save(); ctx.translate(me.x, SY); ctx.rotate(me.lean * 0.45); if (me.lean > 0) ctx.scale(-1, 1);
          U.emoji(ctx, '⛷️', 0, 0, 50); ctx.restore();
        }
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `🚩 ${passed}개 통과`, W - 20, 36, 24, '#1864AB', 'right');
        U.text(ctx, `${Math.floor(dist / 30)}m`, W / 2, 36, 20, '#74A9D8');
      },
    };
  },
});
