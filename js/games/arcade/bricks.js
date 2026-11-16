/* 🧱 블록 부수기 - 공을 튕겨 블록을 깨는 게임 */
registerGame({
  id: 'bricks', genre: 'arcade', name: '블록 부수기', emoji: '🧱', color: '#FF9F68',
  desc: '공을 튕겨서 블록을 와장창!',
  howto: ['손가락으로 끌거나 ←→ 키로 받침대를 움직여요', '화면을 톡 치면 공이 날아가요', '블록을 다 깨면 다음 판! 공을 3번 놓치면 끝'],
  init(api) {
    const { U, W, H } = api;
    const pad = { x: 160, y: 548, w: 84, h: 14 };
    const R = 8;
    let speed = 340, lives = 3, level = 1, stuck = true;
    const ball = { x: 0, y: 0, vx: 0, vy: 0 };
    let bricks = [];
    const parts = [], pops = [];
    const COLORS = ['#FF5E5E', '#FF9F43', '#FECA57', '#1DD1A1', '#54A0FF', '#A55EEA'];

    function build() {
      bricks = [];
      const cols = 8, bw = 44, bh = 20, gap = 4;
      const ox = (W - (cols * bw + (cols - 1) * gap)) / 2;
      const rows = Math.min(8, 4 + level);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        // 레벨이 오르면 2번 맞아야 깨지는 블록도 등장
        const hp = level >= 2 && r < level - 1 && (r + c) % 3 === 0 ? 2 : 1;
        bricks.push({ x: ox + c * (bw + gap), y: 70 + r * (bh + gap), w: bw, h: bh, hp, color: COLORS[r % COLORS.length] });
      }
    }
    function launch() {
      if (!stuck) return;
      stuck = false;
      const a = U.rand(-0.5, 0.5);
      ball.vx = Math.sin(a) * speed; ball.vy = -Math.cos(a) * speed;
      api.sfx('bounce');
    }
    function movePad(x) { pad.x = U.clamp(x - pad.w / 2, 0, W - pad.w); }
    build();

    return {
      down(x) { movePad(x); launch(); },
      move(x) { if (api.pointer.down) movePad(x); },
      key(k) { if (k === 'action' || k === 'up') launch(); },
      update(dt) {
        if (api.keys.has('left')) pad.x -= 460 * dt;
        if (api.keys.has('right')) pad.x += 460 * dt;
        pad.x = U.clamp(pad.x, 0, W - pad.w);
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
        if (stuck) { ball.x = pad.x + pad.w / 2; ball.y = pad.y - R - 1; return; }

        const steps = Math.ceil((speed * dt) / 4);
        const sdt = dt / steps;
        for (let s = 0; s < steps; s++) {
          ball.x += ball.vx * sdt; ball.y += ball.vy * sdt;
          if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); api.sfx('bounce'); }
          if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); api.sfx('bounce'); }
          if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); api.sfx('bounce'); }
          // 받침대
          if (ball.vy > 0 && ball.y + R >= pad.y && ball.y + R <= pad.y + pad.h + 8 && ball.x > pad.x - R && ball.x < pad.x + pad.w + R) {
            const off = U.clamp((ball.x - (pad.x + pad.w / 2)) / (pad.w / 2), -1, 1);
            const a = off * 1.05;
            ball.vx = Math.sin(a) * speed; ball.vy = -Math.cos(a) * speed;
            ball.y = pad.y - R;
            api.sfx('bounce');
          }
          // 블록
          for (const b of bricks) {
            if (b.hp <= 0) continue;
            if (ball.x + R > b.x && ball.x - R < b.x + b.w && ball.y + R > b.y && ball.y - R < b.y + b.h) {
              const ox = Math.min(ball.x + R - b.x, b.x + b.w - (ball.x - R));
              const oy = Math.min(ball.y + R - b.y, b.y + b.h - (ball.y - R));
              if (ox < oy) ball.vx *= -1; else ball.vy *= -1;
              b.hp--;
              if (b.hp <= 0) {
                api.add(10 * level); api.sfx('point');
                U.burst(parts, b.x + b.w / 2, b.y + b.h / 2, b.color, 10);
                U.popups.add(pops, b.x + b.w / 2, b.y, '+' + 10 * level);
              } else api.sfx('bounce');
              break;
            }
          }
        }
        if (ball.y > H + 20) {
          lives--; api.sfx('hit');
          if (lives <= 0) { api.end(); return; }
          stuck = true;
        }
        if (bricks.every((b) => b.hp <= 0)) {
          level++; speed = Math.min(560, speed * 1.08);
          api.add(100); api.sfx('best'); build(); stuck = true;
          U.popups.add(pops, W / 2, H / 2, `레벨 ${level}!`, '#FFD23F');
        }
      },
      draw(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#2C2A4A'); g.addColorStop(1, '#4F518C');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        for (const b of bricks) {
          if (b.hp <= 0) continue;
          ctx.fillStyle = b.color;
          U.rr(ctx, b.x, b.y, b.w, b.h, 5); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.35)';
          U.rr(ctx, b.x + 3, b.y + 3, b.w - 6, 5, 3); ctx.fill();
          if (b.hp > 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; U.rr(ctx, b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3, 5); ctx.stroke(); }
        }
        ctx.fillStyle = '#FFD23F';
        U.rr(ctx, pad.x, pad.y, pad.w, pad.h, 7); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 7); ctx.fill();
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        U.hearts(ctx, lives, 3);
        U.text(ctx, `레벨 ${level}`, W - 12, 24, 20, '#fff', 'right');
        if (stuck) U.text(ctx, '톡! 눌러서 발사', W / 2, 470, 24, '#fff', 'center', '#2C2A4A');
      },
    };
  },
});
