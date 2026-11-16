/* ⛳ 미니 골프 - 공을 당겼다 놓아 벽에 튕기며 홀에 넣는 게임 */
registerGame({
  id: 'golf', genre: 'sports', name: '통통 미니 골프', emoji: '⛳', color: '#8CE99A',
  desc: '당겼다 놓으면 슝~ 홀인원 도전!',
  howto: ['화면을 누른 채 뒤로 당겼다 놓으면 반대쪽으로 굴러가요', '길게 당길수록 세게! 벽에 튕겨서 넣어도 돼요', '5개 홀, 적게 칠수록 높은 점수 (홀마다 최대 6번)'],
  init(api) {
    const { U, W } = api;
    const L = 24, R = 376, T = 84, B = 566, BR = 10, HOLES = 5, MAXS = 6;
    let ball, hole, walls = [], strokes = 0, n = 1, start = null, wait = 0, msg = { s: '', t: 0 }, moving = false;
    const parts = [], pops = [];

    function build() {
      ball = { x: U.rand(90, 310), y: 510, vx: 0, vy: 0 };
      hole = { x: U.rand(70, 330), y: U.rand(120, 190) };
      walls = [];
      const cnt = Math.min(5, 1 + n);
      for (let k = 0; k < 60 && walls.length < cnt; k++) {
        const horiz = Math.random() < 0.6, w = horiz ? U.rand(80, 170) : 22, h = horiz ? 22 : U.rand(70, 140);
        const r = { x: U.rand(L + 10, R - w - 10), y: U.rand(230, 440 - h + 20), w, h };
        if (walls.every((o) => !U.rectHit({ x: r.x - 46, y: r.y - 46, w: r.w + 92, h: r.h + 92 }, o))) walls.push(r);
      }
      strokes = 0; moving = false;
    }
    const inWall = (x, y) => walls.some((r) => x + BR > r.x && x - BR < r.x + r.w && y + BR > r.y && y - BR < r.y + r.h);
    function pull() {
      const dx = start.x - api.pointer.x, dy = start.y - api.pointer.y, d = Math.hypot(dx, dy);
      const p = Math.min(170, d);
      return d < 12 ? null : { dx: dx / d, dy: dy / d, p };
    }
    function finish(pts, s) {
      if (pts) { api.add(pts); U.popups.add(pops, hole.x, hole.y - 30, '+' + pts, '#FFD43B'); }
      msg = { s, t: 1.3 }; wait = 1.3;
    }
    build();

    return {
      down(x, y) { if (!moving && wait <= 0) start = { x, y }; },
      up() {
        if (!start) return;
        const a = pull(); start = null;
        if (!a || moving) return;
        ball.vx = a.dx * a.p * 5.6; ball.vy = a.dy * a.p * 5.6; moving = true; strokes++; api.sfx('bounce');
      },
      update(dt) {
        msg.t -= dt; U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (wait > 0) { wait -= dt; if (wait <= 0) { n++; if (n > HOLES) api.end(); else build(); } return; }
        if (!moving) return;
        const steps = 4, sdt = dt / steps;
        for (let s = 0; s < steps; s++) {
          ball.x += ball.vx * sdt;
          if (ball.x < L + BR || ball.x > R - BR || inWall(ball.x, ball.y)) { ball.x -= ball.vx * sdt; ball.vx = -ball.vx * 0.82; api.sfx('step'); }
          ball.y += ball.vy * sdt;
          if (ball.y < T + BR || ball.y > B - BR || inWall(ball.x, ball.y)) { ball.y -= ball.vy * sdt; ball.vy = -ball.vy * 0.82; api.sfx('step'); }
        }
        const f = Math.pow(0.3, dt); ball.vx *= f; ball.vy *= f;
        const sp = Math.hypot(ball.vx, ball.vy);
        if (U.dist(ball.x, ball.y, hole.x, hole.y) < 15 && sp < 520) {
          moving = false; ball.x = hole.x; ball.y = hole.y; ball.vx = ball.vy = 0;
          api.sfx('best'); U.burst(parts, hole.x, hole.y, '#FFD43B', 22, 240);
          finish(Math.max(20, 120 - (strokes - 1) * 20), strokes === 1 ? '홀인원!! 🎉' : `${strokes}번 만에 성공!`);
        } else if (sp < 14) {
          ball.vx = ball.vy = 0; moving = false;
          if (strokes >= MAXS) { api.sfx('hit'); finish(0, '다음 홀로 넘어가요'); }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#2F9E44'; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#A0785A'; U.rr(ctx, L - 10, T - 10, R - L + 20, B - T + 20, 16); ctx.fill();
        ctx.fillStyle = '#69DB7C'; ctx.fillRect(L, T, R - L, B - T);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        for (let y = T; y < B; y += 60) ctx.fillRect(L, y, R - L, 30);
        for (const r of walls) {
          ctx.fillStyle = '#7A5230'; U.rr(ctx, r.x, r.y + 4, r.w, r.h, 6); ctx.fill();
          ctx.fillStyle = '#C69C6D'; U.rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
        }
        ctx.fillStyle = '#1B4332'; ctx.beginPath(); ctx.arc(hole.x, hole.y, 15, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hole.x, hole.y); ctx.lineTo(hole.x, hole.y - 44); ctx.stroke();
        ctx.fillStyle = '#FA5252'; ctx.beginPath(); ctx.moveTo(hole.x, hole.y - 44); ctx.lineTo(hole.x + 24, hole.y - 35); ctx.lineTo(hole.x, hole.y - 26); ctx.fill();
        if (start && api.pointer.down && !moving) {
          const a = pull();
          if (a) {
            ctx.fillStyle = a.p > 130 ? '#FF6B6B' : a.p > 70 ? '#FFD43B' : '#fff';
            for (let i = 1; i <= 7; i++) { ctx.globalAlpha = 1 - i * 0.1; ctx.beginPath(); ctx.arc(ball.x + a.dx * a.p * i * 0.2, ball.y + a.dy * a.p * i * 0.2, 5, 0, 7); ctx.fill(); }
            ctx.globalAlpha = 1;
          }
        }
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(ball.x + 2, ball.y + 3, BR, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, BR, 0, 7); ctx.fill();
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.text(ctx, `⛳ ${Math.min(n, HOLES)} / ${HOLES}홀`, 20, 40, 24, '#fff', 'left');
        U.text(ctx, `친 횟수 ${strokes} / ${MAXS}`, W - 20, 40, 22, strokes >= MAXS - 1 ? '#FFE066' : '#fff', 'right');
        if (msg.t > 0) U.text(ctx, msg.s, W / 2, 320, 36, '#fff', 'center', '#2B2D42');
        else if (!moving && strokes === 0) U.text(ctx, '👇 뒤로 당겼다 놓아요', W / 2, 588, 17, '#fff');
      },
    };
  },
});
