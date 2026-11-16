/* 🥁 리듬 톡톡 - 떨어지는 음표가 선에 닿을 때 맞춰 누르는 게임 */
registerGame({
  id: 'rhythm', genre: 'reflex', name: '리듬 톡톡', emoji: '🥁', color: '#DA77F2',
  desc: '음표가 선에 닿는 순간 톡!',
  howto: ['음표가 아래 하얀 선에 닿을 때 그 칸을 눌러요', '딱 맞으면 PERFECT! 연속으로 맞히면 점수가 커져요', '음표를 5번 놓치면 끝 (키보드: ← ↓ ↑ →)'],
  init(api) {
    const { U, W } = api;
    const LW = 100, LINE = 470, COL = ['#FF6B6B', '#FFD43B', '#51CF66', '#4DABF7'];
    const SCALE = [262, 294, 330, 392, 440, 523, 587, 659], KEY = { left: 0, down: 1, up: 2, right: 3 };
    let t = 0, spawnT = 0.8, lives = 5, combo = 0, step = 0, judge = { s: '', t: 0, c: '#fff' };
    const notes = [], press = [0, 0, 0, 0], parts = [];

    const speed = () => Math.min(470, 250 + t * 3.5);
    function hit(lane) {
      if (lane < 0 || lane > 3) return;
      press[lane] = 0.12;
      let best = null;
      for (const n of notes) if (n.lane === lane && (!best || Math.abs(n.y - LINE) < Math.abs(best.y - LINE))) best = n;
      const d = best ? Math.abs(best.y - LINE) : 999;
      if (d > 62) { api.sfx('step'); return; }
      notes.splice(notes.indexOf(best), 1);
      combo++;
      const perfect = d < 24, pts = (perfect ? 20 : 10) + Math.min(combo, 20);
      api.add(pts); api.note(SCALE[(step++ * 3 + lane) % SCALE.length], 0.18);
      judge = { s: perfect ? 'PERFECT!' : 'GOOD', t: 0.4, c: perfect ? '#FFD43B' : '#8CE99A' };
      U.burst(parts, lane * LW + LW / 2, LINE, COL[lane], perfect ? 14 : 7, 200);
    }

    return {
      down(x) { hit(Math.floor(x / LW)); },
      key(k) { if (k in KEY) hit(KEY[k]); },
      update(dt) {
        t += dt; judge.t -= dt;
        for (let i = 0; i < 4; i++) press[i] = Math.max(0, press[i] - dt);
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = Math.max(0.3, 0.62 - t * 0.004) * U.pick([1, 1, 1, 2]);
          const lane = U.randInt(0, 3);
          notes.push({ lane, y: -30 });
          if (t > 25 && Math.random() < 0.2) notes.push({ lane: (lane + U.randInt(1, 3)) % 4, y: -30 });
        }
        for (let i = notes.length - 1; i >= 0; i--) {
          notes[i].y += speed() * dt;
          if (notes[i].y > LINE + 70) {
            notes.splice(i, 1); lives--; combo = 0; api.sfx('hit');
            judge = { s: 'MISS', t: 0.4, c: '#FF8787' };
            if (lives <= 0) { api.end(); return; }
          }
        }
        U.updateParticles(parts, dt);
      },
      draw(ctx) {
        ctx.fillStyle = '#1A1033'; ctx.fillRect(0, 0, W, 600);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)'; ctx.fillRect(i * LW, 0, LW, 600);
          if (press[i] > 0) { const g = ctx.createLinearGradient(0, LINE - 200, 0, LINE); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, COL[i] + '88'); ctx.fillStyle = g; ctx.fillRect(i * LW, LINE - 200, LW, 200); }
        }
        ctx.fillStyle = '#fff'; ctx.fillRect(0, LINE - 3, W, 6);
        for (let i = 0; i < 4; i++) { ctx.strokeStyle = COL[i]; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(i * LW + LW / 2, LINE, 34, 0, 7); ctx.stroke(); }
        for (const n of notes) {
          const x = n.lane * LW + LW / 2;
          ctx.fillStyle = COL[n.lane]; ctx.beginPath(); ctx.arc(x, n.y, 30, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(x - 9, n.y - 10, 8, 0, 7); ctx.fill();
          U.text(ctx, '♪', x, n.y + 3, 30, '#fff');
        }
        for (let i = 0; i < 4; i++) {
          const o = press[i] > 0 ? 4 : 0;
          ctx.fillStyle = '#0D0820'; U.rr(ctx, i * LW + 6, 520, LW - 12, 72, 16); ctx.fill();
          ctx.fillStyle = COL[i]; U.rr(ctx, i * LW + 6, 514 + o, LW - 12, 72, 16); ctx.fill();
          U.text(ctx, ['←', '↓', '↑', '→'][i], i * LW + LW / 2, 552 + o, 30, 'rgba(0,0,0,.45)');
        }
        U.drawParticles(ctx, parts);
        U.hearts(ctx, lives, 5, 26, 32);
        if (combo >= 2) U.text(ctx, `${combo} 콤보`, W - 20, 32, 24, '#FFD43B', 'right');
        if (judge.t > 0) { ctx.globalAlpha = Math.min(1, judge.t * 4); U.text(ctx, judge.s, W / 2, 380, 40, judge.c, 'center', '#1A1033'); ctx.globalAlpha = 1; }
      },
    };
  },
});
