/* 🃏 짝꿍 카드 - 뒤집어서 같은 그림 두 장을 찾는 기억 게임 */
registerGame({
  id: 'pairs', genre: 'brain', name: '짝꿍 카드', emoji: '🃏', color: '#B197FC',
  desc: '같은 그림 카드 두 장을 찾아라!',
  howto: ['처음에 잠깐 보여 주는 그림을 잘 기억해요', '카드를 두 장씩 뒤집어 같은 그림을 찾아요', '연속으로 맞히면 보너스! 다 찾으면 카드가 늘어나요'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 90, GAP = 8;
    const EM = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦁', '🐧', '🐙', '🦄', '🍕', '🍩', '🍉', '🚀', '⚽', '🎸', '🌈', '🎁', '🚲', '🌻'];
    let cards = [], cols, rows, cw, ch, ox, oy, open = [], lock = 0, peek = 0, level = 1, left = LIMIT, combo = 0, wait = 0;
    const parts = [], pops = [];

    function build() {
      [cols, rows] = level === 1 ? [3, 4] : level === 2 ? [4, 4] : [4, 5];
      cw = Math.min(100, Math.floor(368 / cols) - GAP); ch = Math.min(104, Math.floor(456 / rows) - GAP);
      ox = (W - (cols * (cw + GAP) - GAP)) / 2; oy = 96 + (456 - (rows * (ch + GAP) - GAP)) / 2;
      const pick = U.shuffle(EM.slice()).slice(0, (cols * rows) / 2);
      cards = U.shuffle([...pick, ...pick]).map((e) => ({ e, up: false, done: false, f: 1 }));
      open = []; lock = 0; peek = 1.2 + cols * rows * 0.06;
    }
    const pos = (i) => ({ x: ox + (i % cols) * (cw + GAP), y: oy + Math.floor(i / cols) * (ch + GAP) });
    build();

    return {
      down(x, y) {
        if (peek > 0 || lock > 0 || wait > 0) return;
        const i = cards.findIndex((_, k) => { const p = pos(k); return x >= p.x && x <= p.x + cw && y >= p.y && y <= p.y + ch; });
        if (i < 0 || cards[i].up || cards[i].done) return;
        cards[i].up = true; open.push(i); api.sfx('step');
        if (open.length < 2) return;
        const [a, b] = open;
        if (cards[a].e === cards[b].e) {
          cards[a].done = cards[b].done = true; open = [];
          combo++;
          const pts = 20 + (combo - 1) * 5;
          api.add(pts); api.sfx('coin');
          const p = pos(b);
          U.burst(parts, p.x + cw / 2, p.y + ch / 2, '#FFD23F', 12);
          U.popups.add(pops, p.x + cw / 2, p.y, (combo > 1 ? `${combo}연속 ` : '') + '+' + pts, '#FFD23F');
          if (cards.every((c) => c.done)) {
            const bonus = 50 * level;
            api.add(bonus); api.sfx('best');
            U.popups.add(pops, W / 2, 300, `모두 찾았다! +${bonus}`, '#fff');
            left = Math.min(LIMIT, left + 20); wait = 1.2;
          }
        } else { lock = 0.7; combo = 0; }
      },
      update(dt) {
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
        for (const c of cards) { const t = c.up || c.done || peek > 0 ? 1 : 0; c.f += U.clamp(t - c.f, -dt * 7, dt * 7); }
        if (wait > 0) { wait -= dt; if (wait <= 0) { level++; build(); } return; }
        if (peek > 0) { peek -= dt; return; }
        if (lock > 0) { lock -= dt; if (lock <= 0) { open.forEach((i) => { cards[i].up = false; }); open = []; api.sfx('hit'); } }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#F3EEFF'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `${level}단계`, 24, 64, 24, '#5F3DC4', 'left');
        U.text(ctx, peek > 0 ? '👀 잘 기억해요!' : `⏰ ${Math.ceil(left)}초`, W - 24, 64, 22, '#5F3DC4', 'right');
        cards.forEach((c, i) => {
          const p = pos(i), sx = Math.abs(c.f * 2 - 1), face = c.f > 0.5;
          ctx.save();
          ctx.translate(p.x + cw / 2, p.y + ch / 2); ctx.scale(Math.max(0.04, sx), 1);
          ctx.fillStyle = '#2B2D42'; U.rr(ctx, -cw / 2, -ch / 2 + 4, cw, ch, 14); ctx.fill();
          ctx.fillStyle = face ? (c.done ? '#D3F9D8' : '#fff') : '#7950F2';
          U.rr(ctx, -cw / 2, -ch / 2, cw, ch, 14); ctx.fill();
          if (face) U.emoji(ctx, c.e, 0, 2, Math.min(cw, ch) * 0.58);
          else U.text(ctx, '?', 0, 4, Math.min(cw, ch) * 0.5, '#D0BFFF');
          ctx.restore();
        });
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
      },
    };
  },
});
