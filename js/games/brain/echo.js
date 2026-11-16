/* 🎶 동물 메아리 - 동물들이 낸 소리 순서를 기억해 따라 하는 게임 */
registerGame({
  id: 'echo', genre: 'brain', name: '동물 메아리', emoji: '🎶', color: '#63E6BE',
  desc: '반짝이는 순서를 기억해서 따라 해요',
  howto: ['동물들이 반짝이는 순서를 잘 봐요', '끝나면 똑같은 순서로 눌러요', '한 번 성공할 때마다 하나씩 길어져요. 틀리면 끝!'],
  init(api) {
    const { U, W } = api;
    const PAD = [
      { e: '🐶', c: '#FF6B6B', f: 262 }, { e: '🐱', c: '#4D96FF', f: 330 },
      { e: '🐸', c: '#51CF66', f: 392 }, { e: '🐥', c: '#FFD43B', f: 523 },
    ].map((p, i) => ({ ...p, x: 22 + (i % 2) * 186, y: 150 + Math.floor(i / 2) * 186, w: 170, h: 170 }));
    const seq = [];
    let phase = 'gap', timer = 0.7, idx = 0, pos = 0, lit = -1, litT = 0, wrong = -1;

    const stepDur = () => Math.max(0.3, 0.62 - seq.length * 0.02);
    function flash(i, d) { lit = i; litT = d; api.note(PAD[i].f, d); }

    return {
      down(x, y) {
        if (phase !== 'input') return;
        const i = PAD.findIndex((p) => U.hit(x, y, p));
        if (i < 0) return;
        if (i !== seq[pos]) {
          wrong = i; lit = seq[pos]; litT = 9; phase = 'over';
          api.sfx('hit'); api.end(); return;
        }
        flash(i, 0.22); pos++;
        if (pos === seq.length) { api.add(10 + seq.length * 2); phase = 'gap'; timer = 0.9; api.sfx('coin'); }
      },
      update(dt) {
        if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
        if (phase === 'gap') {
          timer -= dt;
          if (timer <= 0) { seq.push(U.randInt(0, 3)); phase = 'show'; idx = 0; timer = 0; }
        } else if (phase === 'show') {
          timer -= dt;
          if (timer <= 0) {
            if (idx >= seq.length) { phase = 'input'; pos = 0; }
            else { const d = stepDur(); flash(seq[idx], d * 0.7); idx++; timer = d; }
          }
        }
      },
      draw(ctx) {
        ctx.fillStyle = '#12263A'; ctx.fillRect(0, 0, W, 600);
        U.text(ctx, `${Math.max(1, seq.length)}단계`, W / 2, 50, 36, '#fff');
        const msg = phase === 'input' ? `👉 따라 눌러요 (${pos}/${seq.length})` : phase === 'over' ? '앗! 정답은 여기였어요' : '👀 잘 보세요…';
        U.text(ctx, msg, W / 2, 104, 22, phase === 'input' ? '#FFD43B' : '#A5D8FF');
        PAD.forEach((p, i) => {
          const on = lit === i;
          ctx.fillStyle = '#0B1826'; U.rr(ctx, p.x, p.y + 6, p.w, p.h, 28); ctx.fill();
          ctx.globalAlpha = on ? 1 : phase === 'input' ? 0.75 : 0.4;
          ctx.fillStyle = p.c; U.rr(ctx, p.x, p.y + (on ? 4 : 0), p.w, p.h, 28); ctx.fill();
          ctx.globalAlpha = 1;
          if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; U.rr(ctx, p.x + 3, p.y + 7, p.w - 6, p.h - 6, 25); ctx.stroke(); }
          U.emoji(ctx, p.e, p.x + p.w / 2, p.y + p.h / 2 + (on ? 4 : 0), on ? 96 : 80);
          if (wrong === i) U.emoji(ctx, '❌', p.x + p.w / 2, p.y + p.h / 2, 110);
        });
        U.text(ctx, `외운 개수: ${Math.max(0, seq.length - (phase === 'gap' ? 0 : 1))}`, W / 2, 560, 20, '#A5D8FF');
      },
    };
  },
});
