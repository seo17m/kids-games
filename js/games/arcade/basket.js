/* 🧺 과일 바구니 - 떨어지는 과일을 받는 게임 */
registerGame({
  id: 'basket', genre: 'arcade', name: '과일 바구니', emoji: '🧺', color: '#FF7979',
  desc: '과일은 쏙! 폭탄은 피해요',
  howto: ['손가락으로 끌거나 ←→ 키로 바구니를 움직여요', '과일 +10, 🌟 +50점', '💣 폭탄을 받거나 과일을 놓치면 ❤️가 줄어요'],
  init(api) {
    const { U, W, H } = api;
    const bk = { x: W / 2, y: 545 };
    let target = bk.x, lives = 3, t = 0, spawnT = 0.6, shake = 0, combo = 0;
    const items = [], pops = [], parts = [];
    const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🍍'];

    function lose(x, y, msg) {
      lives--; shake = 0.25; combo = 0; api.sfx('hit');
      U.popups.add(pops, x, y, msg, '#FF7675');
      if (lives <= 0) api.end();
    }

    return {
      down(x) { target = x; },
      move(x) { if (api.pointer.down) target = x; },
      update(dt) {
        t += dt;
        if (api.keys.has('left')) target = bk.x - 50;
        if (api.keys.has('right')) target = bk.x + 50;
        const m = 560 * dt;
        bk.x = U.clamp(bk.x + U.clamp(target - bk.x, -m, m), 36, W - 36);
        shake = Math.max(0, shake - dt);

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.33, 0.95 - t * 0.01);
          const r = Math.random();
          const type = r < Math.min(0.32, 0.14 + t * 0.003) ? 'bomb' : r > 0.96 ? 'star' : 'fruit';
          items.push({
            x: U.rand(30, W - 30), y: -30, type, rot: U.rand(-1, 1),
            vy: 150 + t * 3 + U.rand(0, 60),
            ch: type === 'bomb' ? '💣' : type === 'star' ? '🌟' : U.pick(FRUITS),
          });
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.vy * dt; it.rot += dt * 2;
          if (it.y > bk.y - 30 && it.y < bk.y + 6 && Math.abs(it.x - bk.x) < 44) {
            items.splice(i, 1);
            if (it.type === 'bomb') { U.burst(parts, it.x, it.y, '#636E72', 16); api.sfx('boom'); lose(it.x, it.y - 20, '앗!'); }
            else {
              combo++;
              const pts = (it.type === 'star' ? 50 : 10) + Math.min(combo, 10);
              api.add(pts); api.sfx(it.type === 'star' ? 'coin' : 'point');
              U.burst(parts, it.x, it.y, it.type === 'star' ? '#FFD23F' : '#FF7979', 8);
              U.popups.add(pops, it.x, it.y - 20, '+' + pts, '#fff');
            }
            continue;
          }
          if (it.y > H + 30) {
            items.splice(i, 1);
            if (it.type !== 'bomb') lose(it.x, H - 40, '놓쳤다!');
          }
        }
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.save();
        if (shake > 0) ctx.translate(U.rand(-5, 5), U.rand(-5, 5));
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#FFEAA7'); g.addColorStop(1, '#FAB1A0');
        ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
        // 과일 나무 잎
        ctx.fillStyle = '#55A630';
        for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(i * 60, -10, 50, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#80B918';
        for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(30 + i * 60, 10, 34, 0, 7); ctx.fill(); }
        // 바닥
        ctx.fillStyle = '#B8E994'; ctx.fillRect(0, 565, W, 40);
        for (const it of items) {
          ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(Math.sin(it.rot) * 0.3);
          U.emoji(ctx, it.ch, 0, 0, 38); ctx.restore();
        }
        U.emoji(ctx, '🧺', bk.x, bk.y, 70);
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        ctx.restore();
        U.hearts(ctx, lives, 3, 22, 80);
        if (combo >= 3) U.text(ctx, `${combo} 콤보!`, W - 14, 80, 22, '#fff', 'right', '#E17055');
      },
    };
  },
});
