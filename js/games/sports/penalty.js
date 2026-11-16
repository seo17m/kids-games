/* ⚽ 승부차기 - 골키퍼를 피해 공을 차 넣는 게임 */
registerGame({
  id: 'penalty', genre: 'sports', name: '승부차기', emoji: '⚽', color: '#69DB7C',
  desc: '골키퍼를 피해서 슛~ 골인!',
  howto: ['공에서 차고 싶은 쪽으로 화면을 쓱 밀어요', '골키퍼가 없는 구석을 노려요 (너무 옆은 골대 밖!)', '골을 넣을수록 골키퍼가 빨라져요. 3번 놓치면 끝'],
  init(api) {
    const { U, W } = api;
    const BX = W / 2, BY = 500, GY = 150, GL = 60, GR = 340;
    let kx = 200, kt = 0, ball = null, lives = 3, goals = 0, streak = 0, start = null, wait = 0, msg = { s: '', t: 0, c: '#fff' };
    const parts = [], pops = [];

    const aim = (dx, dy) => U.clamp(BX + (dx / -dy) * (BY - GY), -60, 460);

    return {
      down(x, y) { if (!ball && wait <= 0) start = { x, y }; },
      up(x, y) {
        if (!start || ball) { start = null; return; }
        const dx = x - start.x, dy = y - start.y; start = null;
        if (dy > -25) return;
        ball = { t: 0, tx: aim(dx, dy) }; api.sfx('jump');
      },
      update(dt) {
        U.updateParticles(parts, dt); U.popups.update(pops, dt); msg.t -= dt;
        if (wait > 0) { wait -= dt; if (wait <= 0) { ball = null; if (lives <= 0) api.end(); } return; }
        if (!ball) { kt += dt; kx = 200 + Math.sin(kt * (1.4 + goals * 0.08)) * 95; return; }
        const ks = Math.min(300, 110 + goals * 12);
        kx += U.clamp(ball.tx - kx, -ks * dt, ks * dt);
        ball.t += dt / 0.45;
        if (ball.t < 1) return;
        ball.t = 1; wait = 1;
        const out = ball.tx < GL + 8 || ball.tx > GR - 8, saved = !out && Math.abs(ball.tx - kx) < 44;
        if (out || saved) {
          lives--; streak = 0; api.sfx('hit');
          msg = { s: out ? '골대 밖! 😵' : '막혔다! 🧤', t: 1, c: '#FFE3E3' };
        } else {
          goals++; streak++;
          const pts = 10 + Math.min(streak - 1, 5) * 5;
          api.add(pts); api.sfx('best');
          U.burst(parts, ball.tx, GY, '#fff', 20, 260);
          U.popups.add(pops, ball.tx, GY - 40, '+' + pts, '#FFD43B');
          msg = { s: '골~~인! 🎉', t: 1, c: '#FFD43B' };
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#74C0FC'; ctx.fillRect(0, 0, W, 190);
        for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#40A84F' : '#48B95A'; ctx.fillRect(0, 190 + i * 46, W, 46); }
        // 골대와 그물
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(GL, 70, GR - GL, 120);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = GL; x <= GR; x += 20) { ctx.moveTo(x, 70); ctx.lineTo(x, 190); }
        for (let y = 70; y <= 190; y += 20) { ctx.moveTo(GL, y); ctx.lineTo(GR, y); }
        ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(GL, 190); ctx.lineTo(GL, 70); ctx.lineTo(GR, 70); ctx.lineTo(GR, 190); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.strokeRect(20, 190, W - 40, 150);
        // 골키퍼
        ctx.fillStyle = '#FFD43B'; U.rr(ctx, kx - 22, 122, 44, 56, 12); ctx.fill();
        U.emoji(ctx, '😤', kx, 108, 34);
        U.emoji(ctx, '🧤', kx - 36, 128, 26); U.emoji(ctx, '🧤', kx + 36, 128, 26);
        // 조준선
        if (start && api.pointer.down) {
          const dx = api.pointer.x - start.x, dy = api.pointer.y - start.y;
          if (dy < -25) {
            ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(BX, BY); ctx.lineTo(aim(dx, dy), GY); ctx.stroke(); ctx.setLineDash([]);
          }
        }
        // 공
        const t = ball ? ball.t : 0, e = 1 - (1 - t) * (1 - t);
        const x = ball ? U.lerp(BX, ball.tx, e) : BX, y = U.lerp(BY, GY, e) - Math.sin(t * Math.PI) * 40;
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, U.lerp(BY, GY, e) + 20 * (1 - t * 0.5), 20 * (1 - t * 0.5), 6, 0, 0, 7); ctx.fill();
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 8); U.emoji(ctx, '⚽', 0, 0, 52 * (1 - t * 0.5)); ctx.restore();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `⚽ ${goals}골`, W - 20, 36, 24, '#fff', 'right', '#2B2D42');
        if (msg.t > 0) U.text(ctx, msg.s, W / 2, 300, 44, msg.c, 'center', '#2B2D42');
        else if (!ball) U.text(ctx, '👆 차고 싶은 쪽으로 쓱!', W / 2, 570, 20, '#fff', 'center', '#2B2D42');
      },
    };
  },
});
