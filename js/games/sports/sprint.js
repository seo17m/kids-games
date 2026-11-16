/* 🏃 100m 달리기 - 왼발 오른발을 번갈아 눌러 달리는 게임 */
registerGame({
  id: 'sprint', genre: 'sports', name: '다다다 100m', emoji: '🏃', color: '#FF8787',
  desc: '왼발! 오른발! 번갈아 눌러 1등으로',
  howto: ['"땅!" 하면 왼발·오른발 버튼을 번갈아 빨리 눌러요', '같은 발을 두 번 누르면 삐끗! 느려져요', '100m를 빨리 달릴수록 높은 점수 (키보드 ← →)'],
  init(api) {
    const { U, W } = api;
    const GOAL = 100, PX = 30; // 1m = 30px
    const BL = { x: 12, y: 470, w: 182, h: 110, color: '#74C0FC' }, BR = { x: 206, y: 470, w: 182, h: 110, color: '#FFA94D' };
    const cpu = [{ m: 0, v: U.rand(5.6, 6.3), e: '🐢', lane: 0 }, { m: 0, v: U.rand(6.6, 7.3), e: '🐇', lane: 1 }, { m: 0, v: U.rand(7.6, 8.4), e: '🐆', lane: 3 }];
    let m = 0, v = 0, last = '', ready = 1.6, time = 0, done = false, stumble = 0, leg = 0, pressed = '', rank = 0;
    const pops = [];

    function step(side) {
      pressed = side;
      if (ready > 0 || done) return;
      if (side === last) { v *= 0.55; stumble = 0.3; api.sfx('hit'); return; }
      last = side; leg++;
      v = Math.min(11.5, v + 1.15); api.sfx('step');
    }

    return {
      down(x, y) { if (U.hit(x, y, BL)) step('L'); else if (U.hit(x, y, BR)) step('R'); },
      up() { pressed = ''; },
      key(k) { if (k === 'left') step('L'); else if (k === 'right') step('R'); },
      keyup() { pressed = ''; },
      update(dt) {
        U.popups.update(pops, dt); stumble = Math.max(0, stumble - dt);
        if (ready > 0) { ready -= dt; if (ready <= 0) api.sfx('start'); return; }
        if (done) return;
        time += dt;
        if (time > 45) { done = true; rank = 4; api.end(); return; } // 너무 오래 걸리면 끝
        v *= Math.pow(0.42, dt); m += v * dt;
        for (const c of cpu) if (c.m < GOAL) c.m = Math.min(GOAL, c.m + c.v * dt * (0.5 + Math.min(1, time / 2) * 0.5));
        if (m >= GOAL) {
          m = GOAL; done = true;
          rank = 1 + cpu.filter((c) => c.m >= GOAL).length;
          const pts = Math.max(50, Math.round((34 - time) * 40)) + (4 - rank) * 50;
          api.add(pts); api.sfx(rank === 1 ? 'best' : 'coin'); api.end();
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#74C0FC'; ctx.fillRect(0, 0, W, 150);
        ctx.fillStyle = '#51CF66'; ctx.fillRect(0, 150, W, 40);
        for (let i = 0; i < 9; i++) U.emoji(ctx, ['🙋', '🙌', '👏'][i % 3], ((i * 70 - m * PX * 0.3) % 630 + 630) % 630 - 40, 150, 34);
        const cam = m * PX - 110;
        for (let l = 0; l < 4; l++) {
          ctx.fillStyle = l % 2 ? '#E8590C' : '#F76707'; ctx.fillRect(0, 190 + l * 64, W, 64);
          ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 190 + l * 64, W, 2);
        }
        for (let d = 0; d <= GOAL; d += 10) {
          const x = d * PX - cam;
          if (x < -40 || x > W + 40) continue;
          ctx.fillStyle = d === GOAL ? '#fff' : 'rgba(255,255,255,.35)'; ctx.fillRect(x, 190, d === GOAL ? 10 : 3, 256);
          U.text(ctx, d === GOAL ? '🏁' : `${d}m`, x + 4, 176, d === GOAL ? 26 : 15, '#fff');
        }
        const runner = (mm, lane, e, me) => {
          const x = mm * PX - cam, y = 222 + lane * 64;
          if (x < -40 || x > W + 40) return;
          const bob = me ? Math.abs(Math.sin(leg * 1.6)) * 6 : Math.abs(Math.sin(mm * 2)) * 5;
          ctx.save(); ctx.translate(x, y - bob); if (me) { ctx.scale(-1, 1); if (stumble > 0) ctx.rotate(-0.5); }
          U.emoji(ctx, e, 0, 0, me ? 50 : 40); ctx.restore();
        };
        cpu.forEach((c) => runner(c.m, c.lane, c.e, false));
        runner(m, 2, '🏃', true);
        U.text(ctx, `${m.toFixed(1)}m`, 20, 36, 30, '#fff', 'left', '#2B2D42');
        U.text(ctx, `⏱ ${time.toFixed(2)}초`, W - 20, 36, 26, '#fff', 'right', '#2B2D42');
        if (ready > 0) U.text(ctx, ready > 0.6 ? '준비…' : '땅!', W / 2, 100, 60, '#fff', 'center', '#2B2D42');
        else if (done) U.text(ctx, `${rank}등으로 골인! ${time.toFixed(2)}초`, W / 2, 100, 30, '#FFD43B', 'center', '#2B2D42');
        else if (stumble > 0) U.text(ctx, '삐끗! 번갈아 눌러요', W / 2, 100, 28, '#FFE3E3', 'center', '#2B2D42');
        U.btn(ctx, BL, pressed === 'L'); U.btn(ctx, BR, pressed === 'R');
        const hl = (b, s, lab) => { const o = pressed === s ? 4 : 0, nx = last !== s && ready <= 0; U.emoji(ctx, '🦶', b.x + b.w / 2, b.y + 42 + o, nx ? 52 : 40); U.text(ctx, lab, b.x + b.w / 2, b.y + 88 + o, 24, '#2B2D42'); };
        hl(BL, 'L', '← 왼발'); hl(BR, 'R', '오른발 →');
        U.popups.draw(ctx, pops);
      },
    };
  },
});
