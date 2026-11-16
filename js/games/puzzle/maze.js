/* 🐭 미로 탈출 - 시간 안에 치즈까지 길을 찾는 퍼즐 */
registerGame({
  id: 'maze', genre: 'puzzle', name: '미로 탈출', emoji: '🐭', color: '#FAB1A0',
  desc: '생쥐를 치즈까지! 미로가 점점 커져요',
  howto: ['화면을 밀거나 방향키로 움직여요', '갈림길이 나올 때까지 쭉 달려가요', '🧀 에 도착하면 다음 미로! ⭐ 은 보너스 점수'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 60, AW = 364, AH = 440, TOP = 104;
    const VEC = { 1: [0, -1], 2: [1, 0], 4: [0, 1], 8: [-1, 0] }, OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
    const BIT = { up: 1, right: 2, down: 4, left: 8 };
    let cols, rows, C, OX, OY, cells, px, py, fx, fy, path = [], pending = null, stars = [];
    let level = 1, left = LIMIT, wait = 0, face = 1;
    const parts = [], pops = [];

    function gen() {
      cols = Math.min(5 + level, 12); rows = Math.min(6 + level, 14);
      C = Math.floor(Math.min(AW / cols, AH / rows));
      OX = (W - cols * C) / 2; OY = TOP + (AH - rows * C) / 2;
      cells = Array(cols * rows).fill(0);
      const stack = [0], seen = new Set([0]);
      while (stack.length) {
        const cur = stack[stack.length - 1], cx = cur % cols, cy = (cur - cx) / cols;
        const opts = [1, 2, 4, 8].filter((b) => {
          const nx = cx + VEC[b][0], ny = cy + VEC[b][1];
          return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen.has(ny * cols + nx);
        });
        if (!opts.length) { stack.pop(); continue; }
        const b = U.pick(opts), n = (cy + VEC[b][1]) * cols + cx + VEC[b][0];
        cells[cur] |= b; cells[n] |= OPP[b]; seen.add(n); stack.push(n);
      }
      px = py = fx = fy = 0; path = []; pending = null;
      stars = [];
      while (stars.length < 3) {
        const s = U.randInt(1, cols * rows - 2);
        if (!stars.includes(s)) stars.push(s);
      }
    }
    function go(dir) {
      if (wait > 0) return;
      if (path.length) { pending = dir; return; }
      let b = BIT[dir], x = px, y = py;
      if (!(cells[y * cols + x] & b)) return;
      if (dir === 'left') face = -1; if (dir === 'right') face = 1;
      for (;;) {
        x += VEC[b][0]; y += VEC[b][1];
        path.push([x, y]);
        if (x === cols - 1 && y === rows - 1) break;
        const others = [1, 2, 4, 8].filter((k) => (cells[y * cols + x] & k) && k !== OPP[b]);
        if (others.length !== 1) break;
        b = others[0];
      }
      api.sfx('step');
    }
    gen();

    return {
      swipe: go,
      key(k) { if (k !== 'action') go(k); },
      update(dt) {
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
        if (wait > 0) { wait -= dt; if (wait <= 0) { level++; gen(); } return; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); return; }
        let step = 11 * dt;
        while (path.length && step > 0) {
          const [tx, ty] = path[0], d = Math.hypot(tx - fx, ty - fy);
          if (tx !== fx) face = tx > fx ? 1 : -1;
          if (d <= step) {
            fx = px = tx; fy = py = ty; step -= d; path.shift();
            const si = stars.indexOf(py * cols + px);
            if (si >= 0) { stars.splice(si, 1); api.add(30); api.sfx('coin'); U.popups.add(pops, OX + px * C + C / 2, OY + py * C, '+30', '#FFD23F'); }
            if (px === cols - 1 && py === rows - 1) {
              const pts = 100 + level * 20;
              api.add(pts); api.sfx('best');
              U.burst(parts, OX + px * C + C / 2, OY + py * C + C / 2, '#FFD23F', 20);
              U.popups.add(pops, W / 2, 300, `탈출! +${pts}`, '#FFD23F');
              left = Math.min(LIMIT, left + 15); path = []; pending = null; wait = 1; return;
            }
          } else { fx += ((tx - fx) / d) * step; fy += ((ty - fy) / d) * step; step = 0; }
        }
        if (!path.length && pending) { const p = pending; pending = null; go(p); }
      },
      draw(ctx) {
        ctx.fillStyle = '#FFF1E6'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `${level}번째 미로`, 24, 64, 24, '#7F4F24', 'left');
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W - 24, 64, 22, '#7F4F24', 'right');
        ctx.fillStyle = '#FFE0C2'; ctx.fillRect(OX, OY, cols * C, rows * C);
        const es = Math.min(34, C * 0.72);
        U.emoji(ctx, '🧀', OX + (cols - 0.5) * C, OY + (rows - 0.5) * C + 1, es);
        for (const s of stars) U.emoji(ctx, '⭐', OX + (s % cols + 0.5) * C, OY + (Math.floor(s / cols) + 0.5) * C + 1, es * 0.75);
        ctx.strokeStyle = '#7F4F24'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const o = cells[y * cols + x], X = OX + x * C, Y = OY + y * C;
          if (!(o & 1)) { ctx.moveTo(X, Y); ctx.lineTo(X + C, Y); }
          if (!(o & 8)) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + C); }
        }
        ctx.moveTo(OX, OY + rows * C); ctx.lineTo(OX + cols * C, OY + rows * C); ctx.lineTo(OX + cols * C, OY);
        ctx.stroke();
        ctx.save();
        ctx.translate(OX + (fx + 0.5) * C, OY + (fy + 0.5) * C + 1);
        if (face > 0) ctx.scale(-1, 1);
        U.emoji(ctx, '🐭', 0, 0, es);
        ctx.restore();
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
        U.text(ctx, '👆 가고 싶은 쪽으로 밀어요', W / 2, 572, 18, '#A47148');
      },
    };
  },
});
