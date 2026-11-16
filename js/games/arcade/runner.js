/* 🦊 여우 달리기 - 장애물을 뛰어넘는 끝없는 달리기 */
registerGame({
  id: 'runner', genre: 'arcade', name: '여우 달리기', emoji: '🦊', color: '#FDCB6E',
  desc: '선인장을 폴짝! 얼마나 멀리 갈까?',
  howto: ['화면을 톡 치거나 스페이스바로 점프!', '공중에서 한 번 더 누르면 2단 점프', '🪙 동전을 먹으면 +20점'],
  init(api) {
    const { U, W, H } = api;
    const GY = 470;
    const p = { x: 90, y: GY, vy: 0, jumps: 0 };
    let speed = 280, dist = 0, coins = 0, gap = 300, since = 0, t = 0, dead = false;
    const obs = [], coinList = [], pops = [], parts = [];
    const clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 110, y: U.rand(60, 220), s: U.rand(0.6, 1.2) }));
    const hills = Array.from({ length: 4 }, (_, i) => ({ x: i * 160, h: U.rand(60, 120) }));

    function jump() {
      if (dead) return;
      if (p.jumps < 2) {
        p.vy = p.jumps === 0 ? -760 : -620;
        p.jumps++;
        api.sfx('jump');
      }
    }
    function spawn() {
      const n = U.randInt(1, speed > 420 ? 3 : 2);
      const kind = U.pick(['🌵', '🌵', '🪨', '🍄']);
      obs.push({ x: W + 20, n, kind, w: n * 30 });
      // 장애물 위로 동전 아치
      if (Math.random() < 0.6) {
        for (let i = 0; i < 4; i++) coinList.push({ x: W + 20 + n * 15 - 45 + i * 30, y: GY - 120 - Math.sin((i / 3) * Math.PI) * 50, got: false });
      }
    }

    return {
      down: jump,
      key(k) { if (k === 'action' || k === 'up') jump(); },
      update(dt) {
        t += dt;
        speed = Math.min(640, 280 + t * 7);
        const dx = speed * dt;
        dist += dx; since += dx;
        if (since >= gap) { since = 0; gap = U.rand(260, 480) * (speed / 300); spawn(); }

        p.vy += 2100 * dt;
        p.y += p.vy * dt;
        if (p.y >= GY) { p.y = GY; p.vy = 0; p.jumps = 0; }

        const box = { x: p.x - 15, y: p.y - 38, w: 30, h: 34 };
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i];
          o.x -= dx;
          if (o.x + o.w < -20) { obs.splice(i, 1); continue; }
          if (U.rectHit(box, { x: o.x + 5, y: GY - 30, w: o.w - 10, h: 30 })) {
            dead = true; api.sfx('hit');
            U.burst(parts, p.x, p.y - 20, '#FF9F43', 16);
            api.end(); return;
          }
        }
        for (let i = coinList.length - 1; i >= 0; i--) {
          const c = coinList[i];
          c.x -= dx;
          if (c.x < -20) { coinList.splice(i, 1); continue; }
          if (U.dist(c.x, c.y, p.x, p.y - 20) < 28) {
            coinList.splice(i, 1); coins++; api.sfx('coin');
            U.popups.add(pops, c.x, c.y, '+20', '#FFD23F');
          }
        }
        for (const c of clouds) { c.x -= dx * 0.15 * c.s; if (c.x < -60) { c.x = W + 60; c.y = U.rand(60, 220); } }
        for (const h of hills) { h.x -= dx * 0.4; if (h.x < -160) { h.x += 640; h.h = U.rand(60, 120); } }
        U.popups.update(pops, dt);
        api.set(Math.floor(dist / 10) + coins * 20);
      },
      afterEnd(dt) { U.updateParticles(parts, dt); },
      draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, GY);
        sky.addColorStop(0, '#74B9FF'); sky.addColorStop(1, '#DFF3FF');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        U.emoji(ctx, '☀️', 330, 80, 54);
        for (const c of clouds) U.emoji(ctx, '☁️', c.x, c.y, 40 * c.s + 10);
        ctx.fillStyle = '#A3D977';
        for (const h of hills) { ctx.beginPath(); ctx.ellipse(h.x + 80, GY, 110, h.h, 0, Math.PI, 0); ctx.fill(); }
        // 땅
        ctx.fillStyle = '#6AB04C'; ctx.fillRect(0, GY, W, 16);
        ctx.fillStyle = '#C69C6D'; ctx.fillRect(0, GY + 16, W, H - GY);
        ctx.fillStyle = '#B5835A';
        const off = dist % 60;
        for (let x = -off; x < W; x += 60) { ctx.fillRect(x, GY + 40, 26, 6); ctx.fillRect(x + 30, GY + 80, 18, 6); }

        for (const c of coinList) U.emoji(ctx, '🪙', c.x, c.y, 24);
        for (const o of obs) for (let i = 0; i < o.n; i++) U.emoji(ctx, o.kind, o.x + 15 + i * 30, GY - 16, 36);

        // 여우 (달릴 때 통통 튀는 느낌)
        const bob = p.y === GY ? Math.abs(Math.sin(t * 16)) * 4 : 0;
        ctx.fillStyle = 'rgba(0,0,0,.15)';
        ctx.beginPath(); ctx.ellipse(p.x, GY + 4, 18 - (GY - p.y) / 20, 5, 0, 0, 7); ctx.fill();
        U.emoji(ctx, '🦊', p.x, p.y - 22 - bob, 44);
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        U.text(ctx, `${Math.floor(dist / 10)}m`, 14, 24, 22, '#2B2D42', 'left');
        U.text(ctx, `🪙 ${coins}`, W - 14, 24, 22, '#2B2D42', 'right');
      },
    };
  },
});
