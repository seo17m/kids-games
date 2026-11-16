/* 🥤 컵 속 구슬 - 섞이는 컵을 눈으로 따라가 구슬을 찾는 게임 */
registerGame({
  id: 'cups', genre: 'brain', name: '컵 속 구슬', emoji: '🥤', color: '#F783AC',
  desc: '휙휙 섞이는 컵! 구슬은 어디에?',
  howto: ['구슬이 들어 있는 컵을 잘 봐 둬요', '컵이 섞이는 동안 눈으로 따라가요', '구슬이 든 컵을 톡! 점점 빨라져요. 3번 틀리면 끝'],
  init(api) {
    const { U, W } = api;
    const BASE = 330;
    let cups = [], level = 1, lives = 3, phase = 'show', timer = 1.2, swaps = 0, sw = null, picked = -1, lift = 1, ok = false;
    const parts = [], pops = [];

    const slots = (n) => (n === 3 ? [80, 200, 320] : [56, 152, 248, 344]);
    const dur = () => Math.max(0.15, 0.5 - level * 0.035);
    function setup() {
      const n = level >= 6 ? 4 : 3, xs = slots(n), ball = U.randInt(0, n - 1);
      cups = xs.map((x, i) => ({ x, y: BASE, ball: i === ball }));
      phase = 'show'; timer = 1.2; lift = 1; swaps = 3 + level; picked = -1; sw = null;
    }
    function nextSwap() {
      const a = U.randInt(0, cups.length - 1);
      let b = U.randInt(0, cups.length - 1);
      while (b === a) b = U.randInt(0, cups.length - 1);
      sw = { a: cups[a], b: cups[b], ax: cups[a].x, bx: cups[b].x, t: 0 };
    }
    setup();

    return {
      down(x, y) {
        if (phase !== 'pick' || y < BASE - 130 || y > BASE + 40) return;
        const i = cups.findIndex((c) => Math.abs(x - c.x) < 44);
        if (i < 0) return;
        picked = i; ok = cups[i].ball; phase = 'reveal'; timer = 1.4;
        if (ok) {
          const pts = 20 + level * 10;
          api.add(pts); api.sfx('coin');
          U.burst(parts, cups[i].x, BASE - 10, '#FFD23F', 18);
          U.popups.add(pops, cups[i].x, BASE - 130, '+' + pts, '#FFD23F');
        } else { lives--; api.sfx('hit'); }
      },
      update(dt) {
        U.updateParticles(parts, dt); U.popups.update(pops, dt);
        if (phase === 'show') {
          timer -= dt;
          lift = timer > 0.35 ? 1 : Math.max(0, timer / 0.35);
          if (timer <= 0) { phase = 'shuffle'; nextSwap(); }
        } else if (phase === 'shuffle') {
          sw.t += dt / dur();
          const t = Math.min(1, sw.t), e = t * t * (3 - 2 * t), arc = Math.sin(Math.PI * t) * 34;
          sw.a.x = U.lerp(sw.ax, sw.bx, e); sw.b.x = U.lerp(sw.bx, sw.ax, e);
          sw.a.y = BASE - arc; sw.b.y = BASE + arc;
          if (t >= 1) {
            api.sfx('step'); swaps--;
            if (swaps > 0) nextSwap(); else { phase = 'pick'; sw = null; }
          }
        } else if (phase === 'reveal') {
          timer -= dt; lift = Math.min(1, lift + dt * 5);
          if (timer <= 0) {
            if (lives <= 0) { api.end(); return; }
            if (ok) level++;
            setup();
          }
        }
      },
      draw(ctx) {
        const bg = ctx.createLinearGradient(0, 0, 0, 600);
        bg.addColorStop(0, '#FFF0F6'); bg.addColorStop(1, '#FFDEEB');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, 600);
        U.hearts(ctx, lives, 3, 30, 36);
        U.text(ctx, `${level}단계`, W - 24, 36, 26, '#A61E4D', 'right');
        const msg = { show: '👀 구슬이 여기 있어요!', shuffle: '휙휙~ 잘 따라가요', pick: '👉 어느 컵일까요?', reveal: ok ? '정답! 🎉' : '아쉬워요…' }[phase];
        U.text(ctx, msg, W / 2, 110, 26, '#A61E4D');
        ctx.fillStyle = '#C2255C'; U.rr(ctx, 10, BASE + 30, W - 20, 26, 13); ctx.fill();
        ctx.fillStyle = '#E64980'; U.rr(ctx, 10, BASE + 24, W - 20, 26, 13); ctx.fill();
        const order = cups.slice().sort((a, b) => a.y - b.y);
        for (const c of order) {
          const i = cups.indexOf(c);
          const up = (phase === 'show' && c.ball) || (phase === 'reveal' && (c.ball || i === picked)) ? lift * 70 : 0;
          if (c.ball && up > 0) {
            ctx.fillStyle = '#FFD43B'; ctx.beginPath(); ctx.arc(c.x, BASE + 8, 18, 0, 7); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(c.x - 6, BASE + 2, 5, 0, 7); ctx.fill();
          }
          const y = c.y - up;
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 28, 40, 8, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#4DABF7';
          ctx.beginPath(); ctx.moveTo(c.x - 26, y - 80); ctx.lineTo(c.x + 26, y - 80); ctx.lineTo(c.x + 40, y + 26); ctx.lineTo(c.x - 40, y + 26); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#1C7ED6';
          ctx.beginPath(); ctx.moveTo(c.x - 36, y - 4); ctx.lineTo(c.x + 36, y - 4); ctx.lineTo(c.x + 38.5, y + 12); ctx.lineTo(c.x - 38.5, y + 12); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.35)'; U.rr(ctx, c.x - 18, y - 72, 8, 60, 4); ctx.fill();
        }
        U.drawParticles(ctx, parts); U.popups.draw(ctx, pops);
        U.text(ctx, `섞는 횟수 ${3 + level}번`, W / 2, 470, 20, '#C2255C');
      },
    };
  },
});
