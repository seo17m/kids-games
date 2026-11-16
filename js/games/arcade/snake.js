/* 🐛 꿈틀 지렁이 - 먹이를 먹고 길어지는 게임 */
registerGame({
  id: 'snake', genre: 'arcade', name: '꿈틀 지렁이', emoji: '🐛', color: '#7BD389',
  desc: '사과를 먹고 몸을 길게 길게!',
  howto: ['화면을 밀거나(스와이프) 방향키로 움직여요', '🍎 사과를 먹으면 몸이 길어져요', '벽이나 내 몸에 부딪히면 끝!'],
  init(api) {
    const { U } = api;
    const C = 20, COLS = 20, ROWS = 30;
    const snake = [{ x: 10, y: 20 }, { x: 10, y: 21 }, { x: 10, y: 22 }];
    let dir = { x: 0, y: -1 }, next = dir;
    let acc = 0, interval = 0.16, food, fruit = '🍎', dead = false, pulse = 0;
    const fruits = ['🍎', '🍓', '🍇', '🍊', '🍒', '🍌'];
    const parts = [];
    spawn();

    function spawn() {
      let p;
      do { p = { x: U.randInt(1, COLS - 2), y: U.randInt(2, ROWS - 2) }; }
      while (snake.some((s) => s.x === p.x && s.y === p.y));
      food = p; fruit = U.pick(fruits);
    }
    function turn(d) {
      const m = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } }[d];
      if (!m || (m.x === -dir.x && m.y === -dir.y)) return;
      next = m;
    }
    function step() {
      dir = next;
      const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const eat = h.x === food.x && h.y === food.y;
      const body = eat ? snake : snake.slice(0, -1);
      if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS || body.some((s) => s.x === h.x && s.y === h.y)) {
        dead = true; api.sfx('hit'); api.end(); return;
      }
      snake.unshift(h);
      if (eat) {
        api.add(10); api.sfx('coin');
        U.burst(parts, food.x * C + C / 2, food.y * C + C / 2, '#FF5E5E', 12);
        spawn();
        interval = Math.max(0.07, interval - 0.004);
        pulse = 0.25;
      } else snake.pop();
    }

    return {
      key: turn, swipe: turn,
      update(dt) {
        if (dead) return;
        acc += dt;
        while (acc >= interval && !dead) { acc -= interval; step(); }
        pulse = Math.max(0, pulse - dt);
        U.updateParticles(parts, dt, 0);
      },
      draw(ctx) {
        // 잔디 바둑판
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#B8E994' : '#A8E082';
          ctx.fillRect(x * C, y * C, C, C);
        }
        U.emoji(ctx, fruit, food.x * C + C / 2, food.y * C + C / 2 + 1, 18 + Math.sin(performance.now() / 150) * 2);
        // 몸통 (꼬리부터 그리기)
        for (let i = snake.length - 1; i >= 0; i--) {
          const s = snake[i];
          const t = i / Math.max(1, snake.length - 1);
          ctx.fillStyle = `hsl(${330 - t * 40}, 75%, ${62 + t * 10}%)`;
          const pad = i === 0 ? 0 : 2 + t * 2;
          U.rr(ctx, s.x * C + pad, s.y * C + pad, C - pad * 2, C - pad * 2, 7);
          ctx.fill();
        }
        // 머리 눈
        const h = snake[0];
        const cx = h.x * C + C / 2, cy = h.y * C + C / 2;
        const ex = dir.y !== 0 ? 5 : 0, ey = dir.x !== 0 ? 5 : 0;
        for (const s of [-1, 1]) {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(cx + ex * s + dir.x * 3, cy + ey * s + dir.y * 3, 4, 0, 7); ctx.fill();
          ctx.fillStyle = '#222';
          ctx.beginPath(); ctx.arc(cx + ex * s + dir.x * 4, cy + ey * s + dir.y * 4, 2, 0, 7); ctx.fill();
        }
        if (pulse > 0) { ctx.strokeStyle = `rgba(255,255,255,${pulse * 3})`; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 396, 596); }
        U.drawParticles(ctx, parts);
        U.text(ctx, `길이 ${snake.length}`, 390, 18, 18, '#2E6B30', 'right');
      },
    };
  },
});
