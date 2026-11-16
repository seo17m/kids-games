/* 🚀 별빛 방어대 - 내려오는 외계인을 쏘는 슈팅 게임 */
registerGame({
  id: 'shooter', genre: 'arcade', name: '별빛 방어대', emoji: '🚀', color: '#6C5CE7',
  desc: '외계인이 내려와요! 지구를 지켜라',
  howto: ['손가락으로 끌거나 ←→ 키로 움직여요', '총알은 자동으로 발사돼요', '외계인이 땅에 닿거나 부딪히면 ❤️가 줄어요'],
  init(api) {
    const { U, W, H } = api;
    const ship = { x: W / 2, y: 530 };
    let target = ship.x, lives = 3, time = 0, fireT = 0, spawnT = 1, inv = 0, power = 0;
    const bullets = [], enemies = [], parts = [], pops = [], items = [];
    const stars = Array.from({ length: 60 }, () => ({ x: U.rand(0, W), y: U.rand(0, H), s: U.rand(20, 90), r: U.rand(0.5, 2) }));

    function hurt() {
      if (inv > 0) return;
      lives--; inv = 1.2; api.sfx('hit');
      U.burst(parts, ship.x, ship.y, '#FF7675', 16);
      if (lives <= 0) api.end();
    }

    return {
      down(x) { target = x; },
      move(x) { if (api.pointer.down) target = x; },
      update(dt) {
        time += dt;
        if (api.keys.has('left')) target = ship.x - 40;
        if (api.keys.has('right')) target = ship.x + 40;
        const maxMove = 520 * dt;
        ship.x += U.clamp(target - ship.x, -maxMove, maxMove);
        ship.x = U.clamp(ship.x, 22, W - 22);
        inv = Math.max(0, inv - dt);
        power = Math.max(0, power - dt);
        for (const s of stars) { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = U.rand(0, W); } }

        // 발사
        fireT -= dt;
        if (fireT <= 0) {
          fireT = power > 0 ? 0.14 : 0.24;
          bullets.push({ x: ship.x, y: ship.y - 26, vx: 0 });
          if (power > 0) { bullets.push({ x: ship.x - 10, y: ship.y - 20, vx: -90 }); bullets.push({ x: ship.x + 10, y: ship.y - 20, vx: 90 }); }
          api.sfx('shoot');
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y -= 620 * dt; b.x += b.vx * dt;
          if (b.y < -10) bullets.splice(i, 1);
        }
        // 적 등장
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.32, 1.1 - time * 0.012);
          const big = Math.random() < 0.18;
          enemies.push({
            x: U.rand(30, W - 30), y: -30, bx: 0, t: U.rand(0, 6),
            vy: (big ? 60 : 80) + time * 1.4 + U.rand(0, 40),
            hp: big ? 3 : 1, big, ch: big ? '🛸' : U.pick(['👾', '👽', '🐙']), flash: 0,
          });
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.t += dt; e.y += e.vy * dt; e.flash = Math.max(0, e.flash - dt);
          e.bx = e.big ? Math.sin(e.t * 2) * 60 : Math.sin(e.t * 3) * 14;
          const ex = U.clamp(e.x + e.bx, 20, W - 20);
          const r = e.big ? 24 : 17;
          let killed = false;
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (U.dist(b.x, b.y, ex, e.y) < r + 4) {
              bullets.splice(j, 1);
              e.hp--; e.flash = 0.08;
              if (e.hp <= 0) { killed = true; break; }
            }
          }
          if (killed) {
            const pts = e.big ? 50 : 10;
            api.add(pts); api.sfx('point');
            U.burst(parts, ex, e.y, e.big ? '#74B9FF' : '#A29BFE', 14);
            U.popups.add(pops, ex, e.y, '+' + pts);
            if (e.big || Math.random() < 0.05) items.push({ x: ex, y: e.y });
            enemies.splice(i, 1); continue;
          }
          if (U.dist(ex, e.y, ship.x, ship.y) < r + 16) { enemies.splice(i, 1); hurt(); continue; }
          if (e.y > H + 20) { enemies.splice(i, 1); hurt(); }
        }
        // 아이템 (⭐ 3방향 총알)
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += 120 * dt;
          if (U.dist(it.x, it.y, ship.x, ship.y) < 30) { power = 6; api.sfx('coin'); U.popups.add(pops, it.x, it.y, '파워업!', '#FFD23F'); items.splice(i, 1); }
          else if (it.y > H + 20) items.splice(i, 1);
        }
        U.updateParticles(parts, dt, 0);
        U.popups.update(pops, dt);
      },
      afterEnd(dt) { U.updateParticles(parts, dt, 0); },
      draw(ctx) {
        ctx.fillStyle = '#0B0B2B'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        for (const s of stars) { ctx.globalAlpha = s.r / 2; ctx.fillRect(s.x, s.y, s.r, s.r); }
        ctx.globalAlpha = 1;
        // 땅(지구)
        ctx.fillStyle = '#2E86DE';
        ctx.beginPath(); ctx.ellipse(W / 2, H + 300, 380, 320, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#10AC84';
        ctx.beginPath(); ctx.ellipse(W / 2 - 80, H + 10, 90, 30, 0.2, 0, 7); ctx.fill();

        ctx.fillStyle = '#FFE066';
        for (const b of bullets) { U.rr(ctx, b.x - 3, b.y - 9, 6, 18, 3); ctx.fill(); }
        for (const e of enemies) {
          const ex = U.clamp(e.x + e.bx, 20, W - 20);
          if (e.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(ex, e.y, e.big ? 26 : 18, 0, 7); ctx.fill(); }
          U.emoji(ctx, e.ch, ex, e.y, e.big ? 46 : 34);
        }
        for (const it of items) U.emoji(ctx, '⭐', it.x, it.y, 28);
        // 우주선
        if (!(inv > 0 && Math.floor(inv * 10) % 2) && lives > 0) {
          const x = ship.x, y = ship.y;
          ctx.fillStyle = '#FF7675';
          ctx.beginPath(); ctx.moveTo(x - 22, y + 18); ctx.lineTo(x - 8, y); ctx.lineTo(x - 8, y + 18); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x + 22, y + 18); ctx.lineTo(x + 8, y); ctx.lineTo(x + 8, y + 18); ctx.fill();
          ctx.fillStyle = power > 0 ? '#FFD23F' : '#DFE6E9';
          ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.quadraticCurveTo(x + 14, y - 8, x + 11, y + 20); ctx.lineTo(x - 11, y + 20); ctx.quadraticCurveTo(x - 14, y - 8, x, y - 28); ctx.fill();
          ctx.fillStyle = '#74B9FF';
          ctx.beginPath(); ctx.arc(x, y - 6, 6, 0, 7); ctx.fill();
          ctx.fillStyle = '#FDCB6E';
          ctx.beginPath(); ctx.moveTo(x - 7, y + 20); ctx.lineTo(x, y + 30 + Math.random() * 8); ctx.lineTo(x + 7, y + 20); ctx.fill();
        }
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        U.hearts(ctx, lives, 3);
        if (power > 0) U.text(ctx, `⭐ ${Math.ceil(power)}`, W - 12, 24, 20, '#FFD23F', 'right');
      },
    };
  },
});
