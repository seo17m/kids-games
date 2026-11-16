/* 🐧 하늘 계단 - 방향을 잘 바꾸며 계단을 끝없이 오르는 게임 */
registerGame({
  id: 'stairs', genre: 'arcade', name: '하늘 계단', emoji: '🐧', color: '#74B9FF',
  desc: '방향을 바꾸며 하늘 끝까지 올라가요',
  howto: ['오른쪽 버튼(→ 키): 보는 쪽으로 한 칸 오르기', '왼쪽 버튼(← 키): 방향 바꿔서 오르기', '시간 막대가 다 줄거나 헛디디면 끝!'],
  init(api) {
    const { U, W, H } = api;
    const SX = 46, SY = 40, BASE_Y = 400;
    const stairs = [0];
    let lastDir = 1, p = 0, face = 1, timer = 1, camI = 0, camX = 0, dead = false, fall = 0, press = { l: 0, r: 0 };

    function ensure() {
      while (stairs.length < p + 30) {
        if (stairs.length > 2 && Math.random() < 0.35) lastDir = -lastDir;
        stairs.push(stairs[stairs.length - 1] + lastDir);
      }
    }
    ensure();

    function climb(turn) {
      if (dead) return;
      if (turn) { face = -face; press.l = 0.12; } else press.r = 0.12;
      const need = stairs[p + 1] - stairs[p];
      if (need !== face) {
        dead = true; api.sfx('hit');
        api.end(); return;
      }
      p++;
      api.set(p);
      api.sfx('step');
      timer = Math.min(1, timer + 0.09);
      ensure();
    }

    return {
      down(x) { climb(x < W / 2); },
      key(k) {
        if (k === 'left') climb(true);
        else if (k === 'right' || k === 'up' || k === 'action') climb(false);
      },
      update(dt) {
        timer -= dt * (0.22 + Math.min(0.55, p * 0.0045));
        if (timer <= 0) { timer = 0; dead = true; api.sfx('hit'); api.end(); }
        camI = U.lerp(camI, p, Math.min(1, dt * 14));
        camX = U.lerp(camX, stairs[p], Math.min(1, dt * 14));
        press.l = Math.max(0, press.l - dt); press.r = Math.max(0, press.r - dt);
      },
      afterEnd(dt) { fall += dt; },
      draw(ctx) {
        // 높이 올라갈수록 하늘색이 변해요
        const k = Math.min(1, p / 300);
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, `hsl(${210 + k * 50}, 70%, ${70 - k * 45}%)`);
        sky.addColorStop(1, `hsl(${200 + k * 30}, 80%, ${88 - k * 40}%)`);
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        if (k > 0.5) { ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { ctx.globalAlpha = (k - 0.5) * 2 * 0.8; ctx.fillRect((i * 83) % W, (i * 47 + camI * 3) % 400, 2, 2); } ctx.globalAlpha = 1; }
        for (let i = 0; i < 4; i++) U.emoji(ctx, '☁️', (i * 130 + 40) % W, ((i * 160 + camI * 12) % 760) - 80, 56);

        const toX = (col) => W / 2 + (col - camX) * SX;
        const toY = (i) => BASE_Y - (i - camI) * SY;
        for (let i = Math.max(0, p - 8); i < p + 14 && i < stairs.length; i++) {
          const x = toX(stairs[i]), y = toY(i);
          if (y < -30 || y > H + 30) continue;
          ctx.fillStyle = i % 10 === 0 && i > 0 ? '#FDCB6E' : '#fff';
          U.rr(ctx, x - 26, y, 52, 16, 6); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,.15)';
          U.rr(ctx, x - 26, y + 11, 52, 5, 3); ctx.fill();
          if (i % 10 === 0 && i > 0) U.text(ctx, String(i), x, y + 8, 14, '#8a5a00');
        }
        // 펭귄
        const px = toX(stairs[p]) + (dead ? face * fall * 120 : 0);
        const py = toY(p) - 22 + (dead ? fall * fall * 900 : 0);
        ctx.save(); ctx.translate(px, py);
        if (face > 0) ctx.scale(-1, 1);
        if (dead) ctx.rotate(fall * 8);
        U.emoji(ctx, '🐧', 0, 0, 42);
        ctx.restore();

        // 시간 막대
        ctx.fillStyle = 'rgba(255,255,255,.9)'; U.rr(ctx, 20, 20, W - 40, 22, 11); ctx.fill();
        ctx.fillStyle = timer > 0.5 ? '#00B894' : timer > 0.25 ? '#FDCB6E' : '#FF7675';
        U.rr(ctx, 23, 23, (W - 46) * timer, 16, 8); ctx.fill();
        U.text(ctx, `${p}층`, W / 2, 72, 34, '#fff', 'center', '#2B2D42');

        // 버튼
        const btn = (x, label, sub, pressed, color) => {
          const y = 500 + (pressed ? 4 : 0);
          ctx.fillStyle = '#2B2D42'; U.rr(ctx, x, 504, 170, 80, 20); ctx.fill();
          ctx.fillStyle = color; U.rr(ctx, x, y, 170, 76, 20); ctx.fill();
          U.text(ctx, label, x + 85, y + 30, 26, '#fff', 'center', '#2B2D42');
          U.text(ctx, sub, x + 85, y + 58, 15, '#fff');
        };
        btn(20, '🔄 방향', '← 키', press.l > 0, '#FF7675');
        btn(210, '⬆️ 오르기', '→ 키', press.r > 0, '#0984E3');
      },
    };
  },
});
