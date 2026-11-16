/* 🐤 팔랑 병아리 - 톡톡 눌러 나무 사이를 날아가는 게임 */
registerGame({
  id: 'chick', genre: 'arcade', name: '팔랑 병아리', emoji: '🐤', color: '#FFE066',
  desc: '톡톡! 날갯짓으로 나무 사이를 통과',
  howto: ['화면을 톡 치거나 스페이스바로 날갯짓!', '나무 사이를 지나가면 +1점', '나무나 땅에 부딪히면 끝!'],
  init(api) {
    const { U, W, H } = api;
    const GROUND = H - 60;
    const b = { x: 110, y: 260, vy: 0 };
    let started = false, scroll = 0, t = 0, dead = false;
    const pipes = [], parts = [];
    const PW = 66;

    function gapSize() { return Math.max(140, 185 - api.score * 2); }
    function addPipe(x) { pipes.push({ x, gy: U.rand(130, GROUND - 130), passed: false, g: gapSize() }); }
    function flap() {
      if (dead) return;
      started = true;
      b.vy = -390;
      api.sfx('flap');
    }
    addPipe(W + 80);

    return {
      start: flap,
      down: flap,
      key(k) { if (k === 'action' || k === 'up') flap(); },
      update(dt) {
        t += dt;
        if (!started) { b.y = 260 + Math.sin(t * 4) * 8; return; }
        const speed = 165 + Math.min(60, api.score * 2);
        scroll += speed * dt;
        b.vy += 1250 * dt;
        b.y += b.vy * dt;
        if (b.y < 14) { b.y = 14; b.vy = 0; }
        for (const p of pipes) p.x -= speed * dt;
        if (pipes[pipes.length - 1].x < W - 230) addPipe(W + 20);
        if (pipes[0].x < -PW - 10) pipes.shift();

        for (const p of pipes) {
          if (!p.passed && p.x + PW < b.x) { p.passed = true; api.add(1); api.sfx('point'); }
          const inX = b.x + 14 > p.x && b.x - 14 < p.x + PW;
          const inGap = b.y - 12 > p.gy - p.g / 2 && b.y + 12 < p.gy + p.g / 2;
          if (inX && !inGap) return die();
        }
        if (b.y + 14 >= GROUND) { b.y = GROUND - 14; return die(); }
      },
      afterEnd(dt) {
        U.updateParticles(parts, dt);
        if (b.y < GROUND - 14) { b.vy += 1250 * dt; b.y = Math.min(GROUND - 14, b.y + b.vy * dt); }
      },
      draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#81ECEC'); sky.addColorStop(1, '#E8FFF8');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 4; i++) {
          const x = ((i * 140 - scroll * 0.2) % 560 + 560) % 560 - 80;
          U.emoji(ctx, '☁️', x, 80 + (i % 2) * 70, 50);
        }
        // 나무 기둥
        for (const p of pipes) {
          const top = p.gy - p.g / 2, bot = p.gy + p.g / 2;
          ctx.fillStyle = '#8D5524';
          ctx.fillRect(p.x + 8, 0, PW - 16, top);
          ctx.fillRect(p.x + 8, bot, PW - 16, GROUND - bot);
          ctx.fillStyle = '#2ECC71';
          U.rr(ctx, p.x - 4, top - 34, PW + 8, 38, 16); ctx.fill();
          U.rr(ctx, p.x - 4, bot - 4, PW + 8, 38, 16); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.25)';
          U.rr(ctx, p.x + 4, top - 28, 18, 10, 5); ctx.fill();
          U.rr(ctx, p.x + 4, bot + 2, 18, 10, 5); ctx.fill();
        }
        // 땅
        ctx.fillStyle = '#55C26E'; ctx.fillRect(0, GROUND, W, 14);
        ctx.fillStyle = '#E1B866'; ctx.fillRect(0, GROUND + 14, W, H);
        ctx.fillStyle = '#D4A64F';
        for (let x = -(scroll % 40); x < W; x += 40) ctx.fillRect(x, GROUND + 26, 20, 6);

        // 병아리 (속도에 따라 기울기)
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(U.clamp(b.vy / 900, -0.5, 1.2));
        ctx.scale(-1, 1); // 오른쪽을 보도록
        U.emoji(ctx, '🐤', 0, 0, 38);
        ctx.restore();
        U.drawParticles(ctx, parts);
        U.text(ctx, String(api.score), W / 2, 70, 56, '#fff', 'center', '#2B2D42');
        if (!started) U.text(ctx, '톡! 눌러서 날기', W / 2, 360, 26, '#fff', 'center', '#2B2D42');
      },
    };

    function die() {
      dead = true;
      api.sfx('hit');
      U.burst(parts, b.x, b.y, '#FFE066', 14);
      api.end();
    }
  },
});
