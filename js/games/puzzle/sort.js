/* 🧪 색깔 정리 - 구슬을 옮겨 같은 색끼리 모으는 퍼즐 */
registerGame({
  id: 'sort', genre: 'puzzle', name: '색깔 정리', emoji: '🧪', color: '#A29BFE',
  desc: '뒤죽박죽 구슬을 색깔별로 착착!',
  howto: ['병을 톡 치면 맨 위 구슬이 들려요', '빈 병이나 같은 색 구슬 위로 옮길 수 있어요', '병마다 한 가지 색만 모으면 성공! 막히면 🔀 다시 섞기'],
  init(api) {
    const { U, W } = api;
    const CAP = 4, BR = 20, TW = 52, TH = 176, LIMIT = 120;
    const COL = ['#FF6B6B', '#4D96FF', '#FFD23F', '#6BCB77', '#B36BFF', '#FF9F43', '#00CEC9'];
    const MARK = ['●', '■', '▲', '◆', '★', '♥', '✚'];
    let tubes = [], sel = null, level = 1, left = LIMIT, wait = 0, moves = 0;
    const parts = [], pops = [];

    const solved = () => tubes.every((t) => !t.length || (t.length === CAP && t.every((b) => b === t[0])));
    function deal() {
      const n = Math.min(2 + level, 7);
      do {
        const balls = [];
        for (let c = 0; c < n; c++) for (let k = 0; k < CAP; k++) balls.push(c);
        for (let i = balls.length - 1; i > 0; i--) { const j = U.randInt(0, i); [balls[i], balls[j]] = [balls[j], balls[i]]; }
        tubes = [];
        for (let c = 0; c < n; c++) tubes.push(balls.slice(c * CAP, c * CAP + CAP));
        tubes.push([], []);
      } while (solved());
      sel = null; moves = 0;
    }
    function layout(i) {
      const n = tubes.length;
      if (n <= 5) return { x: (W / (n + 1)) * (i + 1), y: 190 };
      const top = Math.ceil(n / 2), row = i < top ? 0 : 1, cnt = row ? n - top : top, k = row ? i - top : i;
      return { x: (W / (cnt + 1)) * (k + 1), y: row ? 330 : 90 };
    }
    deal();

    return {
      down(x, y) {
        if (wait > 0) return;
        if (y > 535 && x > 100 && x < 300) { deal(); api.sfx('step'); U.popups.add(pops, W / 2, 500, '다시 섞었어요!', '#fff'); return; }
        const i = tubes.findIndex((_, k) => { const p = layout(k); return Math.abs(x - p.x) < 34 && y > p.y - 40 && y < p.y + TH + 20; });
        if (i < 0) { sel = null; return; }
        if (sel === null) { if (tubes[i].length) { sel = i; api.sfx('point'); } return; }
        if (i === sel) { sel = null; return; }
        const from = tubes[sel], to = tubes[i], b = from[from.length - 1];
        if (to.length < CAP && (!to.length || to[to.length - 1] === b)) {
          to.push(from.pop()); sel = null; moves++; api.sfx('bounce');
          if (to.length === CAP && to.every((v) => v === b)) {
            const p = layout(i); U.burst(parts, p.x, p.y + TH / 2, COL[b], 16); api.add(20); api.sfx('coin');
          }
          if (solved()) {
            const pts = 100 * level;
            api.add(pts); api.sfx('best');
            U.popups.add(pops, W / 2, 280, `성공! +${pts}`, '#FFD23F');
            left = Math.min(LIMIT, left + 30);
            wait = 1.1;
          }
        } else { sel = to.length ? i : null; api.sfx('step'); }
      },
      update(dt) {
        U.updateParticles(parts, dt);
        U.popups.update(pops, dt);
        if (wait > 0) { wait -= dt; if (wait <= 0) { level++; deal(); } return; }
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#EEE9FF'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `${level}단계`, 24, 60, 24, '#4B3F9E', 'left');
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, W - 24, 60, 22, '#4B3F9E', 'right');
        tubes.forEach((t, i) => {
          const p = layout(i), on = sel === i;
          ctx.fillStyle = 'rgba(255,255,255,.85)';
          ctx.strokeStyle = on ? '#6C5CE7' : '#B8B0E8'; ctx.lineWidth = on ? 5 : 4;
          ctx.beginPath();
          ctx.moveTo(p.x - TW / 2, p.y); ctx.lineTo(p.x - TW / 2, p.y + TH - 26);
          ctx.arc(p.x, p.y + TH - 26, TW / 2, Math.PI, 0, true);
          ctx.lineTo(p.x + TW / 2, p.y);
          ctx.fill(); ctx.stroke();
          t.forEach((b, k) => {
            const lifted = on && k === t.length - 1;
            const by = lifted ? p.y - 26 : p.y + TH - 28 - k * (BR * 2 + 1);
            ctx.fillStyle = COL[b];
            ctx.beginPath(); ctx.arc(p.x, by, BR, 0, 7); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.45)';
            ctx.beginPath(); ctx.arc(p.x - 6, by - 7, 5, 0, 7); ctx.fill();
            U.text(ctx, MARK[b], p.x, by + 2, 16, 'rgba(0,0,0,.35)');
          });
        });
        ctx.fillStyle = '#4B3F9E'; U.rr(ctx, 100, 544, 200, 46, 23); ctx.fill();
        ctx.fillStyle = '#6C5CE7'; U.rr(ctx, 100, 540, 200, 46, 23); ctx.fill();
        U.text(ctx, '🔀 다시 섞기', W / 2, 564, 22, '#fff');
        U.drawParticles(ctx, parts);
        U.popups.draw(ctx, pops);
      },
    };
  },
});
