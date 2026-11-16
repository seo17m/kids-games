/* 🔤 초성 퀴즈 - 첫소리(초성)만 보고 낱말을 맞히는 게임 */
registerGame({
  id: 'chosung', genre: 'brain', name: '초성 퀴즈', emoji: '🔤', color: '#91A7FF',
  desc: 'ㄱㅇㅇ? 초성만 보고 낱말을 맞혀요',
  howto: ['낱말의 첫소리(초성)만 보여 줘요', '예: ㄱㅇㅇ → 고양이', '맞는 낱말을 골라요. 60초 도전! 틀리면 -3초'],
  init(api) {
    const { U, W } = api;
    const LIMIT = 60;
    const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
    const WORDS = {
      '🐾 동물': ['강아지', '고양이', '호랑이', '코끼리', '기린', '토끼', '거북이', '다람쥐', '펭귄', '돌고래', '사자', '원숭이', '판다', '여우', '늑대', '악어', '하마', '고래', '독수리', '부엉이', '개구리', '얼룩말', '캥거루', '고슴도치'],
      '🍽️ 음식': ['떡볶이', '김밥', '라면', '치킨', '피자', '햄버거', '불고기', '비빔밥', '만두', '순대', '짜장면', '돈가스', '아이스크림', '초콜릿', '수박', '딸기', '바나나', '포도', '사과', '복숭아', '샌드위치', '팝콘', '솜사탕', '붕어빵'],
      '🏫 학교': ['연필', '지우개', '공책', '가방', '칠판', '교실', '운동장', '도서관', '급식', '선생님', '필통', '색연필', '가위', '체육복', '실내화', '교과서', '방학', '소풍', '운동회', '쉬는시간'],
      '🧸 물건': ['자전거', '비행기', '기차', '우산', '시계', '안경', '축구공', '컴퓨터', '냉장고', '텔레비전', '휴대폰', '이어폰', '선풍기', '칫솔', '모자', '운동화', '로봇', '풍선', '줄넘기', '킥보드'],
    };
    const BC = ['#FFC9C9', '#A5D8FF', '#FFEC99', '#B2F2BB'];
    const cho = (w) => [...w].map((ch) => { const k = ch.charCodeAt(0) - 0xAC00; return k >= 0 && k < 11172 ? CHO[Math.floor(k / 588)] : ch; }).join('');
    let q, left = LIMIT, n = 0, streak = 0, fb = { t: 0, ok: true }, pressed = -1, last = '';
    const pops = [];

    function gen() {
      const cat = U.pick(Object.keys(WORDS));
      let ans;
      do { ans = U.pick(WORDS[cat]); } while (ans === last);
      last = ans;
      const key = cho(ans), set = [ans];
      // 처음엔 같은 종류에서, 나중엔 글자 수가 같은 낱말로 헷갈리게
      const others = U.shuffle(WORDS[cat].filter((w) => cho(w) !== key));
      if (n >= 8) others.sort((a, b) => Math.abs(a.length - ans.length) - Math.abs(b.length - ans.length));
      set.push(...others.slice(0, 3));
      q = { cat, key, ans, choices: U.shuffle(set) };
    }
    gen();

    return {
      down(x, y) {
        const i = [0, 1, 2, 3].findIndex((k) => U.hit(x, y, U.quad(k)));
        if (i < 0) return;
        pressed = i;
        if (q.choices[i] === q.ans) {
          streak++; n++;
          const pts = 10 + Math.min(streak - 1, 10) * 2;
          api.add(pts); api.sfx(streak % 5 === 0 ? 'coin' : 'point');
          U.popups.add(pops, W / 2, 340, '+' + pts, '#364FC7');
          fb = { t: 0.3, ok: true };
        } else {
          streak = 0; left -= 3; api.sfx('hit');
          U.popups.add(pops, W / 2, 340, `정답은 ${q.ans}  (-3초)`, '#C92A2A');
          fb = { t: 0.4, ok: false };
        }
        gen();
      },
      up() { pressed = -1; },
      update(dt) {
        fb.t -= dt; U.popups.update(pops, dt);
        left -= dt;
        if (left <= 0) { left = 0; api.end(); }
      },
      draw(ctx) {
        ctx.fillStyle = '#EDF2FF'; ctx.fillRect(0, 0, W, 600);
        U.timeBar(ctx, left / LIMIT);
        U.text(ctx, `⏰ ${Math.ceil(left)}초`, 24, 66, 24, '#364FC7', 'left');
        U.text(ctx, streak >= 2 ? `🔥 ${streak}연속` : `${n}문제 성공`, W - 24, 66, 22, '#364FC7', 'right');
        ctx.fillStyle = '#2B2D42'; U.rr(ctx, 24, 106, W - 48, 250, 28); ctx.fill();
        ctx.fillStyle = '#fff'; U.rr(ctx, 24, 100, W - 48, 250, 28); ctx.fill();
        ctx.fillStyle = '#DBE4FF'; U.rr(ctx, 120, 120, 160, 40, 20); ctx.fill();
        U.text(ctx, q.cat, W / 2, 141, 22, '#364FC7');
        const size = q.key.length <= 3 ? 96 : q.key.length === 4 ? 78 : 62;
        ctx.save();
        ctx.font = `${size}px Jua, 'Malgun Gothic', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#2B2D42'; ctx.fillText([...q.key].join(' '), W / 2, 250);
        ctx.restore();
        q.choices.forEach((c, i) => U.btn(ctx, { ...U.quad(i), label: c, color: BC[i], size: c.length > 4 ? 24 : 30 }, pressed === i));
        U.mark(ctx, fb, 240); U.popups.draw(ctx, pops);
      },
    };
  },
});
