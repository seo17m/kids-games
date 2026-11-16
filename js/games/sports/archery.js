/* 🏹 명중! 양궁 - 흔들리는 조준점과 바람을 읽고 과녁을 맞히는 게임 */
registerGame({
  id: 'archery', genre: 'sports', name: '명중! 양궁', emoji: '🏹', color: '#FFD43B',
  desc: '흔들리는 조준점! 한가운데 10점을 노려라',
  howto: ['조준점이 과녁 한가운데에 올 때 톡!', '바람이 불면 화살이 그쪽으로 밀려요', '화살 10발! 가운데에 가까울수록 높은 점수'],
  init(api) {
    const { U, W } = api;
    const CX = W / 2, CY = 250, RING = 13, SHOTS = 10;
    const RC = ['#FFE066', '#FFE066', '#FF6B6B', '#FF6B6B', '#4DABF7', '#4DABF7', '#343A40', '#343A40', '#F8F9FA', '#F8F9FA'];
    let t = U.rand(0, 9), shot = 0, wind = 0, fly = null, wait = 0, lastPts = -1, total = 0, ph = [U.rand(0, 6), U.rand(0, 6)];
    const holes = [], pops = [];

    function newWind() { wind = shot < 2 ? 0 : U.randInt(-4, 4); ph = [U.rand(0, 6), U.rand(0, 6)]; }
    function cross() {
      const amp = 60 + shot * 7, sp = 1.5 + shot * 0.12;
      return { x: CX + Math.sin(t * sp + ph[0]) * amp + Math.sin(t * sp * 2.3) * 14, y: CY + Math.sin(t * sp * 1.37 + ph[1]) * amp * 0.8 + Math.cos(t * sp * 1.9) * 12 };
    }
    function shoot() {
      if (fly || wait > 0 || shot >= SHOTS) return;
      const c = cross();
      fly = { x: c.x + wind * 9, y: c.y, t: 0 }; api.sfx('shoot');
    }

    return {
      down: shoot,
      key(k) { if (k === 'action') shoot(); },
      update(dt) {
        t += dt; U.popups.update(pops, dt);
        if (fly) {
          fly.t += dt * 4;
          if (fly.t >= 1) {
            const d = U.dist(fly.x, fly.y, CX, CY), pts = Math.max(0, 10 - Math.floor(d / RING));
            holes.push({ x: fly.x, y: fly.y }); lastPts = pts; total += pts; shot++;
            api.add(pts * 10); api.sfx(pts >= 9 ? 'best' : pts >= 6 ? 'coin' : pts ? 'point' : 'hit');
            U.popups.add(pops, fly.x, fly.y - 24, pts ? `${pts}점!` : '빗나감', pts >= 9 ? '#FFD43B' : '#fff');
            fly = null; wait = 0.9;
          }
        } else if (wait > 0) { wait -= dt; if (wait <= 0) { if (shot >= SHOTS) api.end(); else newWind(); } }
      },
      draw(ctx) {
        const sky = ctx.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, '#A5D8FF'); sky.addColorStop(0.7, '#E7F5FF');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 600);
        ctx.fillStyle = '#8CE99A'; ctx.fillRect(0, 430, W, 170);
        ctx.fillStyle = '#A0785A'; ctx.fillRect(CX - 70, 370, 12, 90); ctx.fillRect(CX + 58, 370, 12, 90);
        for (let i = 9; i >= 0; i--) {
          ctx.fillStyle = RC[i]; ctx.beginPath(); ctx.arc(CX, CY, (i + 1) * RING, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
        }
        for (const h of holes) {
          ctx.fillStyle = '#2B2D42'; ctx.beginPath(); ctx.arc(h.x, h.y, 4, 0, 7); ctx.fill();
          ctx.strokeStyle = '#E8590C'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + 9, h.y + 14); ctx.stroke();
        }
        if (fly) { const s = 3 - fly.t * 2; ctx.fillStyle = '#E8590C'; ctx.beginPath(); ctx.arc(fly.x, U.lerp(560, fly.y, fly.t), 5 * s, 0, 7); ctx.fill(); }
        else if (wait <= 0 && shot < SHOTS) {
          const c = cross();
          ctx.strokeStyle = '#E03131'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, 7); ctx.moveTo(c.x - 26, c.y); ctx.lineTo(c.x + 26, c.y); ctx.moveTo(c.x, c.y - 26); ctx.lineTo(c.x, c.y + 26); ctx.stroke();
        }
        U.popups.draw(ctx, pops);
        U.text(ctx, `🏹 ${Math.min(shot + 1, SHOTS)} / ${SHOTS}발`, 20, 34, 24, '#1864AB', 'left');
        U.text(ctx, `합계 ${total}점`, W - 20, 34, 24, '#1864AB', 'right');
        ctx.fillStyle = 'rgba(255,255,255,.85)'; U.rr(ctx, 90, 470, 220, 50, 25); ctx.fill();
        const wtxt = wind === 0 ? '🍃 바람 없음' : wind > 0 ? `바람 ${'→'.repeat(Math.min(3, Math.ceil(wind / 1.4)))} ${wind}` : `${-wind} ${'←'.repeat(Math.min(3, Math.ceil(-wind / 1.4)))} 바람`;
        U.text(ctx, wtxt, W / 2, 497, 22, wind ? '#E8590C' : '#2B8A3E');
        U.text(ctx, '화면을 톡 치면 발사!', W / 2, 560, 20, '#2B8A3E');
      },
    };
  },
});
