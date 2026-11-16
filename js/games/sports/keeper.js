/* 🧤 철벽 골키퍼 - 날아오는 공을 장갑으로 막아 내는 게임 */
registerGame({
  id: 'keeper', genre: 'sports', name: '철벽 골키퍼', emoji: '🧤', color: '#FFD43B',
  desc: '슛이 날아온다! 장갑으로 막아라',
  howto: ['손가락(마우스)을 움직이면 장갑이 따라와요', '공이 커지면서 날아오는 곳에 장갑을 대요', '점점 빨라지고 공이 많아져요. 3골 먹으면 끝'],
  init(api) {
    const { U, W } = api;
    const glove = { x: W / 2, y: 380 };
    let lives = 3, saves = 0, t = 0, spawnT = 1, flash = 0;
    const balls = [], parts = [], pops = [];

    function shoot() {
      const dur = Math.max(0.62, 1.35 - saves * 0.025);
      balls.push({ tx: U.rand(60, 340), ty: U.rand(230, 500), t: 0, dur, sx: U.rand(150, 250), curve: U.rand(-60, 60) });
      api.sfx('flap');
    }
    const follow = (x, y) => { glove.x = U.clamp(x, 40, W - 40); glove.y = U.clamp(y, 200, 540); };

    return {
      down: follow, move: follow,
      update(dt) {
        t += dt; flash = Math.max(0, flash - dt);
        if (api.keys.has('left')) glove.x = Math.max(40, glove.x - 420 * dt);
        if (api.keys.has('right')) glove.x = Math.min(W - 40, glove.x + 420 * dt);
        if (api.keys.has('up')) glove.y = Math.max(200, glove.y - 420 * dt);
        if (api.keys.has('down')) glove.y = Math.min(540, glove.y + 420 * dt);
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = Math.max(0.6, 1.7 - saves * 0.04); shoot(); }
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i]; b.t += dt / b.dur;
          if (b.t < 1) continue;
          balls.splice(i, 1);
          if (U.dist(b.tx, b.ty, glove.x, glove.y) < 62) {
            saves++; const pts = 10 + Math.min(saves, 20);
            api.add(pts); api.sfx('coin');
            U.burst(parts, b.tx, b.ty, '#FFD43B', 12); U.popups.add(pops, b.tx, b.ty - 40, '막았다! +' + pts, '#FFD43B');
          } else {
            lives--; flash = 0.35; api.sfx('hit'); U.popups.add(pops, b.tx, b.ty - 40, '골…', '#FFE3E3');
            if (lives <= 0) { api.end(); return; }
          }
        }
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#74C0FC'; ctx.fillRect(0, 0, W, 170);
        for (let i = 0; i < 12; i++) U.emoji(ctx, ['🙋', '🙌', '👏'][i % 3], 18 + i * 34, 118, 26);
        ctx.fillStyle = '#1864AB'; ctx.fillRect(0, 134, W, 40);
        for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#40A84F' : '#48B95A'; ctx.fillRect(0, 170 + i * 43, W, 43); }
        // 멀리 있는 선수
        U.emoji(ctx, '🧍', W / 2, 176, 34);
        // 골대 틀 (내가 지키는 쪽)
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 10; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(14, 600); ctx.lineTo(14, 210); ctx.lineTo(W - 14, 210); ctx.lineTo(W - 14, 600); ctx.stroke();
        for (const b of balls) {
          const e = b.t * b.t;
          ctx.strokeStyle = `rgba(255,255,255,${0.25 + b.t * 0.6})`; ctx.lineWidth = 4; ctx.setLineDash([6, 6]);
          ctx.beginPath(); ctx.arc(b.tx, b.ty, 14 + (1 - b.t) * 40, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          const x = U.lerp(b.sx, b.tx, e) + Math.sin(b.t * Math.PI) * b.curve, y = U.lerp(190, b.ty, e) - Math.sin(b.t * Math.PI) * 50;
          ctx.save(); ctx.translate(x, y); ctx.rotate(b.t * 9); U.emoji(ctx, '⚽', 0, 0, 14 + e * 56); ctx.restore();
        }
        U.emoji(ctx, '🧤', glove.x - 26, glove.y, 58);
        ctx.save(); ctx.translate(glove.x + 26, glove.y); ctx.scale(-1, 1); U.emoji(ctx, '🧤', 0, 0, 58); ctx.restore();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        if (flash > 0) { ctx.fillStyle = `rgba(255,80,80,${flash})`; ctx.fillRect(0, 0, W, 600); }
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `🧤 ${saves}번 막음`, W - 20, 36, 24, '#fff', 'right', '#2B2D42');
      },
    };
  },
});
