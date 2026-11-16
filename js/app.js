'use strict';
/* =========================================================
   뿅뿅 게임랜드 - 화면(UI)과 이동
   #/            → 홈 (장르 고르기)
   #/g/<장르>    → 게임 목록
   #/p/<게임>    → 게임 플레이
   ========================================================= */

const $app = document.getElementById('app');
let runner = null;
let resizeObs = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------------- 닉네임 ---------------- */
const BAD_WORDS = ['씨발', '시발', 'ㅅㅂ', '병신', 'ㅂㅅ', '개새', '좆', '존나', 'ㅈㄴ', '미친', '꺼져', '닥쳐', '애미', '느금', 'fuck', 'shit', 'bitch'];
const NICK_A = ['번개', '반짝', '용감한', '날쌘', '씩씩한', '신나는', '똑똑한', '우주', '무지개', '초코', '구름', '불꽃'];
const NICK_B = ['토끼', '호랑이', '펭귄', '고양이', '강아지', '여우', '판다', '돌고래', '다람쥐', '공룡', '부엉이', '햄스터'];

function getName() { return Store.get('name', ''); }
function checkName(n) {
  if (!n) return '닉네임을 입력해 주세요!';
  if (n.length > 10) return '10글자까지만 쓸 수 있어요.';
  const low = n.toLowerCase().replace(/\s/g, '');
  if (BAD_WORDS.some((w) => low.includes(w))) return '앗! 고운 말로 지어 주세요 🙂';
  return '';
}

function renderName(isChange) {
  destroyRunner();
  const cur = getName();
  $app.innerHTML = `
    <div class="center-screen">
      <div class="name-card">
        <div class="logo-big">🕹️</div>
        <h1>뿅뿅 게임랜드</h1>
        <p>게임에서 쓸 <b>닉네임</b>을 정해 주세요!</p>
        <div class="name-row">
          <input id="nm" maxlength="10" autocomplete="off" placeholder="예: 번개토끼" value="${esc(cur)}" aria-label="닉네임">
          <button class="icon-btn" id="dice" title="랜덤 별명" aria-label="랜덤 별명 만들기">🎲</button>
        </div>
        <p class="hint">🔒 진짜 이름 말고 <b>별명</b>을 써요.<br>닉네임과 점수는 이 기기에만 저장돼요.</p>
        <button class="big-btn" id="go">${isChange ? '바꾸기 ✔' : '입장하기 ▶'}</button>
        ${isChange ? '<button class="big-btn white" id="cancel" style="margin-top:12px">취소</button>' : ''}
        <p class="err" id="err"></p>
      </div>
    </div>`;
  const input = document.getElementById('nm');
  const err = document.getElementById('err');
  const submit = () => {
    const n = input.value.trim();
    const e = checkName(n);
    if (e) { err.textContent = e; input.focus(); return; }
    Store.set('name', n);
    Sound.play('start');
    location.hash = '#/';
    route();
  };
  document.getElementById('go').onclick = submit;
  input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  document.getElementById('dice').onclick = () => {
    input.value = U.pick(NICK_A) + U.pick(NICK_B);
    err.textContent = '';
  };
  const cancel = document.getElementById('cancel');
  if (cancel) cancel.onclick = () => { location.hash = '#/'; route(); };
  if (!isChange) setTimeout(() => input.focus(), 50);
}

/* ---------------- 홈 ---------------- */
function soundIcon() { return Sound.muted ? '🔇' : '🔊'; }

function topbar(left, title) {
  return `
    <div class="topbar">
      ${left}
      <div class="logo">${title}</div>
      <button class="icon-btn" id="snd" aria-label="소리 켜기/끄기">${soundIcon()}</button>
    </div>`;
}
function bindSound() {
  const b = document.getElementById('snd');
  if (b) b.onclick = () => { Sound.toggle(); b.textContent = soundIcon(); if (!Sound.muted) Sound.play('point'); };
}

function renderHome() {
  destroyRunner();
  const name = getName();
  const played = GAMES.filter((g) => Best.plays(g.id) > 0).length;
  const records = GAMES.filter((g) => Best.get(g.id) > 0).length;
  $app.innerHTML = `
    <div class="wrap">
      ${topbar('', '🕹️ <span>뿅뿅 게임랜드</span>')}
      <h1 class="hello">안녕, <b>${esc(name)}</b>! 👋</h1>
      <p class="sub">오늘은 어떤 게임을 해 볼까?</p>
      <div class="stats">
        <div class="stat">🎮 해 본 게임 <b>${played}</b>개</div>
        <div class="stat">🏆 내 기록 <b>${records}</b>개</div>
        <button class="chip-btn" id="rename">✏️ 닉네임 바꾸기</button>
      </div>
      <h2 class="section-title">장르를 골라 보세요</h2>
      <div class="genre-grid">
        ${GENRES.map((g) => {
          const n = GAMES.filter((x) => x.genre === g.id).length;
          return `
          <button class="genre-card ${n ? '' : 'locked'}" style="--c:${g.color}" data-g="${g.id}">
            <span class="em">${g.emoji}</span>
            <span class="nm">${g.name}</span>
            <span class="cnt">${n ? `게임 ${n}개` : '🔒 곧 열려요'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  bindSound();
  document.getElementById('rename').onclick = () => renderName(true);
  $app.querySelectorAll('.genre-card').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.g;
      if (!GAMES.some((x) => x.genre === id)) { toast('🔒 이 장르는 곧 열려요!'); return; }
      Sound.play('point');
      location.hash = '#/g/' + id;
    };
  });
}

/* ---------------- 게임 목록 ---------------- */
function renderGenre(id) {
  destroyRunner();
  const g = GENRES.find((x) => x.id === id);
  const list = GAMES.filter((x) => x.genre === id);
  if (!g || !list.length) { location.hash = '#/'; return; }
  $app.innerHTML = `
    <div class="wrap">
      ${topbar('<button class="icon-btn" id="back" aria-label="뒤로">←</button>', `<span>${g.emoji} ${g.name}</span>`)}
      <div class="genre-head" style="--c:${g.color}">
        <div class="em">${g.emoji}</div>
        <div><h2>${g.name}</h2><p>${g.desc}</p></div>
      </div>
      <div class="game-grid">
        ${list.map((x, i) => {
          const best = Best.get(x.id);
          return `
          <button class="game-card" style="--c:${x.color}" data-p="${x.id}">
            <span class="no">${i + 1}</span>
            <span class="gi">${x.emoji}</span>
            <span class="gt">
              <span class="gn">${x.name}</span>
              <span class="gd">${x.desc}</span>
              <span class="gb">${best ? `🏆 최고 ${best.toLocaleString()}점` : '✨ 아직 안 해 봤어요'}</span>
            </span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
  bindSound();
  document.getElementById('back').onclick = () => { location.hash = '#/'; };
  $app.querySelectorAll('.game-card').forEach((b) => {
    b.onclick = () => { Sound.play('point'); location.hash = '#/p/' + b.dataset.p; };
  });
}

/* ---------------- 플레이 ---------------- */
function destroyRunner() {
  if (runner) { runner.destroy(); runner = null; }
  if (resizeObs) { resizeObs.disconnect(); resizeObs = null; }
  window.onkeydown = null;
}

function renderPlay(id) {
  destroyRunner();
  const def = GAMES.find((x) => x.id === id);
  if (!def) { location.hash = '#/'; return; }
  $app.innerHTML = `
    <div class="play">
      <div class="play-bar">
        <button class="icon-btn" id="back" aria-label="목록으로">←</button>
        <div class="play-title">${def.emoji} ${def.name}</div>
        <div class="score-box"><span>점수</span><b id="score">0</b></div>
        <div class="score-box best"><span>최고</span><b id="best">${Best.get(def.id).toLocaleString()}</b></div>
        <button class="icon-btn" id="snd" aria-label="소리 켜기/끄기">${soundIcon()}</button>
      </div>
      <div class="stage" id="stage">
        <canvas id="cv"></canvas>
        <div class="overlay" id="ov"></div>
      </div>
    </div>`;
  bindSound();
  const $score = document.getElementById('score');
  const $best = document.getElementById('best');
  const $ov = document.getElementById('ov');
  const stage = document.getElementById('stage');
  document.getElementById('back').onclick = () => { location.hash = '#/g/' + def.genre; };

  runner = new GameRunner(document.getElementById('cv'), stage, {
    onScore: (n) => { $score.textContent = n.toLocaleString(); },
    onOver: (score) => showOver(score),
  });
  resizeObs = new ResizeObserver(() => runner && runner.fit());
  resizeObs.observe(stage);
  runner.prepare(def);

  const start = () => {
    Sound.unlock();
    Sound.play('start');
    $ov.classList.add('hide');
    Best.addPlay(def.id);
    runner.run();
  };

  // 키보드로도 버튼 누르기 (스페이스/엔터)
  window.onkeydown = (e) => {
    if ($ov.classList.contains('hide')) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      const b = $ov.querySelector('[data-primary]');
      if (b) b.click();
    }
  };

  function showStart() {
    $ov.innerHTML = `
      <div class="ov-card">
        <div class="ov-emoji">${def.emoji}</div>
        <h2>${def.name}</h2>
        <ul class="howto">${def.howto.map((h) => `<li>${h}</li>`).join('')}</ul>
        <button class="big-btn" data-primary id="st">▶ 시작!</button>
        <p class="key-hint">⌨️ 스페이스바를 눌러도 시작돼요</p>
      </div>`;
    $ov.classList.remove('hide');
    document.getElementById('st').onclick = start;
  }

  function showOver(score) {
    const isNew = score > 0 && Best.submit(def.id, score);
    const best = Best.get(def.id);
    $best.textContent = best.toLocaleString();
    Sound.play(isNew ? 'best' : 'over');
    $ov.innerHTML = `
      <div class="ov-card">
        ${isNew ? '<div class="new-record">🎉 새 기록!</div>' : '<div class="ov-emoji">' + def.emoji + '</div>'}
        <h2>게임 끝!</h2>
        <div class="ov-score">${score.toLocaleString()}</div>
        <p class="ov-best">${esc(getName())}의 최고 기록: 🏆 ${best.toLocaleString()}점</p>
        <div class="btn-col">
          <button class="big-btn" data-primary id="again">🔄 다시 하기</button>
          <button class="big-btn white" id="list">📋 다른 게임 고르기</button>
        </div>
      </div>`;
    $ov.classList.remove('hide');
    document.getElementById('again').onclick = () => { runner.prepare(def); start(); };
    document.getElementById('list').onclick = () => { location.hash = '#/g/' + def.genre; };
  }

  showStart();
}

/* ---------------- 이동 ---------------- */
function route() {
  if (!getName()) { renderName(false); return; }
  const h = location.hash.replace(/^#\/?/, '');
  const [kind, id] = h.split('/');
  if (kind === 'g' && id) renderGenre(id);
  else if (kind === 'p' && id) renderPlay(id);
  else renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
// 글꼴이 늦게 로드되면 캔버스 글씨를 다시 그림
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => runner && runner.fit());
route();
