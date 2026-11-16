/* 🏗️ 높이높이 탑쌓기 - 타이밍 맞춰 블록을 쌓는 게임 */
registerGame({
  id: 'stack', genre: 'arcade', name: '높이높이 탑쌓기', emoji: '🏗️', color: '#55EFC4',
  desc: '딱 맞춰 쌓아서 구름 위까지!',
  howto: ['움직이는 블록이 아래와 겹칠 때 톡!', '삐져나온 부분은 잘려서 떨어져요', '딱 맞추면 PERFECT 보너스 +2점'],
  init(api) {
    const { U, W, H } = api;
    const BH = 30, BASE = 540;
    const stack = [{ x: 100, w: 200 }];
    let cur = { x: 0, w: 200, dir: 1 }, cam = 0, dead = false, perfect = 0, combo = 0;
    const falling = [], pops = [];

    const color = (i) => `hsl(${(i * 14 + 170) % 360}, 72%, 62%)`;
    const yOf = (i) => BASE - i * BH + cam;
    function next() {
      const top = stack[stack.length - 1];
      cur = { x: Math.random() < 0.5 ? -top.w : W, w: top.w, dir: 1 };
      cur.dir = cur.x < 0 ? 1 : -1;
    }
    next();

    function drop() {
      if (dead) return;
      const top = stack[stack.length - 1];
      const i = stack.length;
      if (Math.abs(cur.x - top.x) < 6) {
        cur.x = top.x;
        combo++; perfect = 0.6;
        api.add(3); api.sfx('coin');
        U.popups.add(pops, W / 2, yOf(i) - 20, combo > 1 ? `PERFECT x${combo}` : 'PERFECT!', '#FFD23F');
        stack.push({ x: top.x, w: Math.min(200, top.w + (combo >= 3 ? 6 : 0)) });
      } else {
        const l = Math.max(cur.x, top.x), r = Math.min(cur.x + cur.w, top.x + top.w);
        const ov = r - l;
        if (ov <= 0) {
          falling.push({ x: cur.x, w: cur.w, y: yOf(i), vy: 0, c: color(i) });
          dead = true; api.sfx('hit'); api.end(); return;
        }
        combo = 0;
        if (cur.x < top.x) falling.push({ x: cur.x, w: top.x - cur.x, y: yOf(i), vy: 0, c: color(i) });
        else falling.push({ x: r, w: cur.x + cur.w - r, y: yOf(i), vy: 0, c: color(i) });
        stack.push({ x: l, w: ov });
        api.add(1); api.sfx('step');
      }
      next();
    }

    return {
      down: drop,
      key(k) { if (k === 'action' || k === 'down' || k === 'up') drop(); },
      update(dt) {
        const speed = Math.min(380, 150 + stack.length * 7);
        cur.x += cur.dir * speed * dt;
        if (cur.x > W - cur.w * 0.3) { cur.x = W - cur.w * 0.3; cur.dir = -1; }
        if (cur.x < -cur.w * 0.7) { cur.x = -cur.w * 0.7; cur.dir = 1; }
        const target = Math.max(0, (stack.length - 11) * BH);
        cam = U.lerp(cam, target, Math.min(1, dt * 6));
        perfect = Math.max(0, perfect - dt);
        for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.vy += 1200 * dt; f.y += f.vy * dt; if (f.y > H + 50) falling.splice(i, 1); }
        U.popups.update(pops, dt);
      },
      afterEnd(dt) { for (const f of falling) { f.vy += 1200 * dt; f.y += f.vy * dt; } },
      draw(ctx) {
        const h = Math.min(1, stack.length / 60);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, `hsl(${200 + h * 60}, 70%, ${80 - h * 50}%)`);
        sky.addColorStop(1, `hsl(${190 + h * 30}, 80%, ${92 - h * 40}%)`);
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) U.emoji(ctx, '☁️', (i * 97 + 30) % W, ((i * 130 + cam * 0.5) % 700) - 60, 48);
        // 땅
        ctx.fillStyle = '#6AB04C'; ctx.fillRect(0, BASE + BH + cam, W, 400);
        for (let i = 0; i < stack.length; i++) {
          const s = stack[i], y = yOf(i);
          if (y > H + BH || y < -BH) continue;
          ctx.fillStyle = color(i); ctx.fillRect(s.x, y, s.w, BH);
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(s.x, y, s.w, 6);
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(s.x, y + BH - 4, s.w, 4);
        }
        if (!dead) {
          const y = yOf(stack.length);
          ctx.fillStyle = color(stack.length); ctx.fillRect(cur.x, y, cur.w, BH);
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(cur.x, y, cur.w, 6);
        }
        for (const f of falling) { ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, f.w, BH); }
        if (perfect > 0) {
          const top = stack[stack.length - 1];
          ctx.strokeStyle = `rgba(255,255,255,${perfect * 1.6})`; ctx.lineWidth = 4;
          ctx.strokeRect(top.x - 4, yOf(stack.length - 1) - 4, top.w + 8, BH + 8);
        }
        U.popups.draw(ctx, pops);
        U.text(ctx, `${stack.length - 1}층`, W / 2, 50, 44, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
