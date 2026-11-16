/* 🔢 1부터 50 - 숫자를 순서대로 최대한 빨리 누르는 게임 */
registerGame({
  id: 'count', genre: 'reflex', name: '1부터 50', emoji: '🔢', color: '#74C0FC',
  desc: '1, 2, 3… 50까지 누가 제일 빠를까?',
  howto: ['1부터 순서대로 숫자를 눌러요', '누른 자리에 더 큰 숫자가 새로 나와요', '45초 안에 50까지! 빨리 끝내면 남은 시간이 보너스'],
  init(api) {
    const { U, W } = api;
    const N = 5, C = 70, OX = (W - N * C) / 2, OY = 150, LIMIT = 45;
    const cells = U.shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
    const popT = Array(25).fill(0);
    let next = 1, left = LIMIT, bad = -1, badT = 0;
    const parts = [], pops = [];

    return {
      down(x, y) {
        const c = Math.floor((x - OX) / C), r = Math.floor((y - OY) / C);
        if (c < 0 || r < 0 || c >= N || r >= N) return;
        const i = r * N + c;
        if (cells[i] === next) {
          cells[i] = next + 25 <= 50 ? next + 25 : 0;
          popT[i] = 0.2; next++;
          api.add(10); api.note(300 + (next % 12) * 40, 0.08);
          U.burst(parts, OX + c * C + C / 2, OY + r * C + C / 2, '#74C0FC', 6, 130);
          if (next > 50) {
            const bonus = Math.ceil(left) * 10;
            api.add(bonus); api.sfx('best');
            U.popups.add(pops, W / 2, 300, `완주! 보너스 +${bonus}`, '#FFD43B');
            api.end();
          }
        } else if (cells[i]) { bad = i; badT = 0.3; left -= 1; api.sfx('hit'); }
      },
      update(dt) {
        left -= dt; badT -= dt;
        for (let i = 0; i < 25; i++) popT[i] = Math.max(0, popT[i] - dt);
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (left <= 0) { left = 0; api.end(); }
      },
      afterEnd(dt) { U.updateParticles(parts, dt); U.popups.update(pops, dt); },
      draw(ctx) {
        ctx.fillStyle = '#E7F5FF'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#1864AB', 'left');
        U.text(ctx, `${Math.min(next - 1, 50)} / 50`, W - 24, 66, 24, '#1864AB', 'right');
        U.text(ctx, next <= 50 ? `다음 숫자: ${next}` : '끝!', W / 2, 114, 30, '#E8590C');
        for (let i = 0; i < 25; i++) {
          const x = OX + (i % N) * C, y = OY + Math.floor(i / N) * C, v = cells[i];
          if (!v) { ctx.fillStyle = '#D0EBFF'; U.rr(ctx, x + 4, y + 4, C - 8, C - 8, 14); ctx.fill(); continue; }
          const s = 1 - popT[i] * 1.5, isBad = bad === i && badT > 0;
          ctx.save(); ctx.translate(x + C / 2, y + C / 2); ctx.scale(s, s);
          ctx.fillStyle = '#2B2D42'; U.rr(ctx, -C / 2 + 4, -C / 2 + 8, C - 8, C - 8, 14); ctx.fill();
          ctx.fillStyle = isBad ? '#FFA8A8' : v > 25 ? '#FFEC99' : '#fff'; U.rr(ctx, -C / 2 + 4, -C / 2 + 4, C - 8, C - 8, 14); ctx.fill();
          U.text(ctx, String(v), 0, 4, 32, '#1864AB');
          ctx.restore();
        }
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.text(ctx, '틀리면 -1초', W / 2, 545, 18, '#74A9D8');
      },
    };
  },
});
