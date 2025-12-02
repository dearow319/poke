// ===================== 기본 상수/유틸 =====================

const DEFAULT_ROSTER = (() => {
  const arr = [];
  for (let t = 1; t <= 30; t++) {
    arr.push({
      name: `트레이너${t}`,
      team: [1, 2, 3, 4, 5, 6].map(i => ({
        origName: `포켓몬${i}`,
        nickName: `포켓몬${i}`,
      })),
    });
  }
  return arr;
})();

const TYPES = [
  "노말","불꽃","물","전기","풀","얼음","격투","독","땅","비행",
  "에스퍼","벌레","바위","고스트","드래곤","악","강철","페어리"
];

// 타입 상성(공격->방어)
const TYPE_CHART = (() => {
  const M = {};
  const set = (atk, def, mul) => { (M[atk] ??= {})[def] = mul; };

  set("노말","바위",0.5); set("노말","강철",0.5); set("노말","고스트",0);

  ["풀","얼음","벌레","강철"].forEach(d=>set("불꽃",d,2));
  ["불꽃","물","바위","드래곤"].forEach(d=>set("불꽃",d,0.5));

  ["불꽃","땅","바위"].forEach(d=>set("물",d,2));
  ["물","풀","드래곤"].forEach(d=>set("물",d,0.5));

  ["물","비행"].forEach(d=>set("전기",d,2));
  ["전기","풀","드래곤"].forEach(d=>set("전기",d,0.5));
  set("전기","땅",0);

  ["물","땅","바위"].forEach(d=>set("풀",d,2));
  ["불꽃","풀","독","비행","벌레","드래곤","강철"].forEach(d=>set("풀",d,0.5));

  ["풀","땅","비행","드래곤"].forEach(d=>set("얼음",d,2));
  ["불꽃","물","얼음","강철"].forEach(d=>set("얼음",d,0.5));

  ["노말","얼음","바위","악","강철"].forEach(d=>set("격투",d,2));
  ["독","비행","에스퍼","벌레","페어리"].forEach(d=>set("격투",d,0.5));
  set("격투","고스트",0);

  ["풀","페어리"].forEach(d=>set("독",d,2));
  ["독","땅","바위","고스트"].forEach(d=>set("독",d,0.5));
  set("독","강철",0);

  ["불꽃","전기","독","바위","강철"].forEach(d=>set("땅",d,2));
  ["풀","벌레"].forEach(d=>set("땅",d,0.5));
  set("땅","비행",0);

  ["풀","격투","벌레"].forEach(d=>set("비행",d,2));
  ["전기","바위","강철"].forEach(d=>set("비행",d,0.5));

  ["격투","독"].forEach(d=>set("에스퍼",d,2));
  ["에스퍼","강철"].forEach(d=>set("에스퍼",d,0.5));
  set("에스퍼","악",0);

  ["풀","에스퍼","악"].forEach(d=>set("벌레",d,2));
  ["불꽃","격투","독","비행","고스트","강철","페어리"].forEach(d=>set("벌레",d,0.5));

  ["불꽃","얼음","비행","벌레"].forEach(d=>set("바위",d,2));
  ["격투","땅","강철"].forEach(d=>set("바위",d,0.5));

  ["에스퍼","고스트"].forEach(d=>set("고스트",d,2));
  set("고스트","악",0.5);
  set("고스트","노말",0);

  set("드래곤","드래곤",2);
  set("드래곤","강철",0.5);
  set("드래곤","페어리",0);

  ["에스퍼","고스트"].forEach(d=>set("악",d,2));
  ["격투","악","페어리"].forEach(d=>set("악",d,0.5));

  ["얼음","바위","페어리"].forEach(d=>set("강철",d,2));
  ["불꽃","물","전기","강철"].forEach(d=>set("강철",d,0.5));

  ["격투","드래곤","악"].forEach(d=>set("페어리",d,2));
  ["불꽃","독","강철"].forEach(d=>set("페어리",d,0.5));

  return M;
})();

function typeMul(atkType, defType){
  return (TYPE_CHART[atkType] && TYPE_CHART[atkType][defType] != null) ? TYPE_CHART[atkType][defType] : 1;
}
function typeEffect(atkType, def1, def2){
  const m1 = def1 ? typeMul(atkType, def1) : 1;
  const m2 = def2 ? typeMul(atkType, def2) : 1;
  return m1*m2;
}
function effText(eff){
  if (eff === 0) return "효과가 없다!";
  if (eff >= 2) return "효과가 굉장했다!";
  if (eff > 1) return "효과가 제법 있는 편이다!";
  if (eff === 1) return "";
  return "효과가 별로다...";
}

const STORAGE_KEY = "pkcalc_sv_best_ui_v3";
const $ = (id) => document.getElementById(id);

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function deepClone(obj){
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}
function clampInt(v, min, max){
  const n = Number(v);
  if(!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
function cryptoRandomId(){
  if (globalThis.crypto?.getRandomValues){
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return `${Date.now()}_${a[0].toString(16)}${a[1].toString(16)}`;
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function baseOr100(x){
  const s = String(x ?? "").trim();
  if(s === "") return 100;
  const n = Number(s);
  if(!Number.isFinite(n)) return 100;
  return clampInt(n, 1, 255);
}
function normName(s, fallback){
  const v = String(s ?? "").trim();
  return v ? v : fallback;
}
function pokeNick(p){
  return normName(p?.nickName, normName(p?.origName, "포켓몬"));
}
function pokeOrig(p){
  return normName(p?.origName, pokeNick(p));
}
function trainerPokeLabel(t, p){
  return `${t.name} / ${pokeNick(p)}(${pokeOrig(p)})`;
}

// ===================== 상태/날씨 =====================

const WEATHER = [
  { key:"none", label:"없음" },
  { key:"sun",  label:"쾌청" },
  { key:"rain", label:"비" },
  { key:"sand", label:"모래바람" },
  { key:"snow", label:"설경" },
];

const STATUS = [
  { key:"none", label:"없음" },
  { key:"par",  label:"마비" },
  { key:"brn",  label:"화상" },
  { key:"psn",  label:"독" },
  { key:"tox",  label:"맹독" },
  { key:"slp",  label:"잠듦" },
  { key:"frz",  label:"얼음" },
];

function makeStatusState(){
  return { major:"none", sleepTurns:0, toxicCount:0, flinch:false };
}

// ===================== 기본 스탯/기술 =====================

function defaultMoves(){
  return [
    { name:"", type:"노말", cat:"physical", power:40 },
    { name:"", type:"노말", cat:"physical", power:40 },
    { name:"", type:"노말", cat:"special",  power:40 },
    { name:"", type:"노말", cat:"status",   power:0  },
  ];
}

function ensureMoves(p){
  if(!Array.isArray(p.moves)) p.moves = [];
  for(let i=0;i<4;i++){
    if(!p.moves[i]) p.moves[i] = { name:"", type:"노말", cat:"physical", power:40 };
    p.moves[i].name  = String(p.moves[i].name ?? "");
    p.moves[i].type  = p.moves[i].type || "노말";
    p.moves[i].cat   = p.moves[i].cat || "physical";
    p.moves[i].power = Number.isFinite(+p.moves[i].power) ? +p.moves[i].power : 40;
  }
}

function makeDefaultState(){
  const trainers = DEFAULT_ROSTER.map(t => ({
    id: cryptoRandomId(),
    name: t.name,
    team: t.team.map(p => ({
      origName: p.origName,
      nickName: p.nickName,
      input: {
        type1: "노말",
        type2: "",
        baseHp: 100,
        baseAtk: 100,
        baseDef: 100,
        baseSpA: 100,
        baseSpD: 100,
        baseSpe: 100,
        level: 50
      },
      moves: defaultMoves()
    }))
  }));
  return { version: 5, trainers };
}

function migratePokemon(p, fallbackOrig){
  if (!("origName" in p)) p.origName = normName(p.name, fallbackOrig);
  if (!("nickName" in p)) p.nickName = normName(p.name, p.origName);

  p.input ??= {};
  p.input.type1 ??= "노말";
  p.input.type2 ??= "";
  p.input.level ??= 50;

  ["baseHp","baseAtk","baseDef","baseSpA","baseSpD","baseSpe"].forEach(k=>{
    p.input[k] = baseOr100(p.input[k]);
  });

  ensureMoves(p);
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return makeDefaultState();
  try{
    const st = JSON.parse(raw);
    if(!st || !st.trainers) return makeDefaultState();

    st.trainers.forEach((tr, trIdx)=>{
      tr.id ??= cryptoRandomId();
      tr.name ??= `트레이너${trIdx+1}`;
      tr.team ??= [];

      while (tr.team.length < 6){
        const i = tr.team.length + 1;
        tr.team.push({
          origName:`포켓몬${i}`,
          nickName:`포켓몬${i}`,
          input:{ type1:"노말", type2:"", baseHp:100, baseAtk:100, baseDef:100, baseSpA:100, baseSpD:100, baseSpe:100, level:50 },
          moves: defaultMoves()
        });
      }
      if (tr.team.length > 6) tr.team = tr.team.slice(0,6);

      tr.team.forEach((p, i)=>{
        migratePokemon(p, `포켓몬${i+1}`);
      });
    });

    return st;
  }catch{
    return makeDefaultState();
  }
}
function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// ===== 능력치(IV31/EV0/중립) =====
function calcHP(base, level){
  const B = clampInt(base, 1, 255);
  const L = clampInt(level, 1, 100);
  const IV = 31, EV = 0;
  return Math.floor(((2*B + IV + Math.floor(EV/4)) * L) / 100) + L + 10;
}
function calcOther(base, level){
  const B = clampInt(base, 1, 255);
  const L = clampInt(level, 1, 100);
  const IV = 31, EV = 0;
  const nature = 1.0;
  return Math.floor((Math.floor(((2*B + IV + Math.floor(EV/4)) * L) / 100) + 5) * nature);
}
function derivedStats(p){
  const i = p.input;
  const L = clampInt(i.level,1,100);
  return {
    level: L,
    type1: (i.type1||"").trim() || "노말",
    type2: (i.type2||"").trim(),
    hp: calcHP(baseOr100(i.baseHp), L),
    atk: calcOther(baseOr100(i.baseAtk), L),
    def: calcOther(baseOr100(i.baseDef), L),
    spa: calcOther(baseOr100(i.baseSpA), L),
    spd: calcOther(baseOr100(i.baseSpD), L),
    spe: calcOther(baseOr100(i.baseSpe), L),
  };
}
function isFilledPokemon(p){
  const i = p.input;
  return String(i.type1 ?? "").trim() !== "" && String(i.level ?? "").trim() !== "";
}

// ===================== 배틀 런타임 =====================

function makeSideCond(){
  return {
    A:{ reflect:false, lightscreen:false, auroraveil:false, protect:false },
    B:{ reflect:false, lightscreen:false, auroraveil:false, protect:false },
  };
}

function makeBattleRuntime(){
  return {
    started:false,
    startedOnceLogged:false,
    turn:1,
    viewSwapped:false,
    actedInTurn:0,
    leftBase:"A",
    rightBase:"B",

    aTrainerId:null,
    bTrainerId:null,
    aActive:0,
    bActive:0,

    aHp:[0,0,0,0,0,0],
    bHp:[0,0,0,0,0,0],
    aStatus:Array.from({length:6},()=>makeStatusState()),
    bStatus:Array.from({length:6},()=>makeStatusState()),

    weather:{ kind:"none", turns:0 },
    sideCond: makeSideCond(),
    log:[],
    history:[]
  };
}

// ===== 전역 =====
let state = loadState();
let ui = {
  tab:"data",
  tabHistory: [],
  selectedTrainerId: state.trainers[0]?.id ?? null,
  selectedPokemonIndex: 0,
  battle: makeBattleRuntime()
};

function battle(){ return ui.battle; }
function getSideCond(k){ return battle().sideCond[k]; }

// 공용
function getTrainerById(id){
  return state.trainers.find(t=>t.id===id) || state.trainers[0];
}
function trainerOptions(){
  return state.trainers.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("");
}
function pokemonOptions(team){
  return team.map((p,i)=>`<option value="${i}">${i+1}. ${escapeHtml(pokeNick(p))}</option>`).join("");
}

// ===================== 탭/뒤로가기 =====================

function setTab(tab){
  if(ui.tab !== tab){
    ui.tabHistory.push(ui.tab);
    if(ui.tabHistory.length > 20) ui.tabHistory.shift();
  }
  ui.tab = tab;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  $("tab-data").classList.toggle("hidden", tab!=="data");
  $("tab-battle").classList.toggle("hidden", tab!=="battle");
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click", ()=>setTab(b.dataset.tab)));

$("btn-back").onclick = ()=>{
  const prev = ui.tabHistory.pop();
  if(!prev) return toast("뒤로갈 화면이 없습니다.");
  ui.tab = prev;
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===prev));
  $("tab-data").classList.toggle("hidden", prev!=="data");
  $("tab-battle").classList.toggle("hidden", prev!=="battle");
};

// ===================== Undo =====================

function pushUndo(label){
  ui.battle.history.push({ label, snapshot: deepClone(ui.battle) });
}
function undo(){
  const last = ui.battle.history.pop();
  if(!last) return toast("되돌릴 기록이 없습니다.");
  ui.battle = last.snapshot;
  toast(`되돌림: ${last.label}`);
  renderBattleAll();
}
$("btn-undo").onclick = undo;

// ===================== 로그 =====================

function logAdd(line){
  ui.battle.log.push(line);
  renderLog();
}
function renderLog(){
  const el = $("battle-log");
  if(!el) return;
  el.innerHTML = ui.battle.log.map((l, idx)=>`
    <div class="logline">
      <div class="logrow">
        <div class="logtext">${escapeHtml(l)}</div>
        <button class="iconbtn" title="복사" aria-label="복사" data-idx="${idx}">📋</button>
      </div>
    </div>
  `).join("");

  el.querySelectorAll(".iconbtn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const i = Number(btn.dataset.idx);
      const text = ui.battle.log[i] ?? "";
      try{
        await navigator.clipboard.writeText(text);
        toast("복사됨");
      }catch{
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        toast("복사됨");
      }
    });
  });

  el.scrollTop = el.scrollHeight;
}

// ===================== UI 헬퍼 =====================

function fillTypeSelect(sel){
  sel.innerHTML = TYPES.map(t => `<option value="${t}">${t}</option>`).join("");
}
function fillWeatherSelect(){
  $("weather-kind").innerHTML = WEATHER.map(w=>`<option value="${w.key}">${w.label}</option>`).join("");
}
function fillStatusSelect(){
  $("status-kind").innerHTML = STATUS.map(s=>`<option value="${s.key}">${s.label}</option>`).join("");
}
function syncSleepUI(){
  $("sleep-row").style.display = ($("status-kind").value==="slp") ? "" : "none";
}
if ($("status-kind")) $("status-kind").addEventListener("change", syncSleepUI);

// 텍스트/배치 수정 (HTML 건드리지 않고 교정)
function polishStaticTexts(){
  const titleEl = document.querySelector(".h1");
  if(titleEl) titleEl.textContent = "포켓몬 배틀 간이 계산기";

  const subEl = document.querySelector(".sub");
  if(subEl) subEl.textContent = "";

  // 트레이너/포켓몬 이름 안내 제거
  Array.from(document.querySelectorAll(".hint")).forEach(h=>{
    if(h.textContent.includes("트레이너/포켓몬 이름은 화면에서 수정 후 저장됩니다")){
      h.textContent = "";
    }
  });

  // 결과값/뒤로가기(취소)
  const logTitle = Array.from(document.querySelectorAll(".box-title")).find(el=>el.textContent.includes("한국어 로그"));
  if(logTitle) logTitle.textContent = "결과값";
  if($("btn-undo")) $("btn-undo").textContent = "뒤로가기(취소)";

  // 결과값 설명 제거
  const logHint = $("battle-log")?.previousElementSibling;
  if(logHint && logHint.classList.contains("hint")) logHint.textContent = "";

  // 환경/상태/지속 상단 설명 제거
  Array.from(document.querySelectorAll(".box-title")).forEach(bt=>{
    if(bt.textContent.includes("환경 / 상태 / 지속")){
      const h = bt.parentElement.querySelector(".hint");
      if(h) h.textContent = "";
    }
  });

  // 현재 상태 설명 제거
  Array.from(document.querySelectorAll(".mini-title")).forEach(t=>{
    if(t.textContent.trim() === "현재 상태"){
      const h = t.nextElementSibling;
      if(h && h.classList.contains("hint")) h.textContent = "";
    }
  });

  // 우측 액션 카드 설명 제거
  const rightHint = document.querySelector("#right-move-title + .hint");
  if(rightHint) rightHint.textContent = "";

  // 배틀 세팅 설명 문구 교체
  Array.from(document.querySelectorAll(".box-title")).forEach(bt=>{
    if(bt.textContent.trim() === "배틀 세팅"){
      const h = bt.parentElement.querySelector(".hint");
      if(h) h.textContent = "선공/후공 트레이너 선택 후 '행동 실행' 버튼을 클릭해주세요.";
    }
  });

  // 선공/후공 타이틀 괄호 제거
  const leftSetupTitle = document.querySelector(".battle-top .side-left .mini-title");
  if(leftSetupTitle) leftSetupTitle.textContent = "선공";
  const rightSetupTitle = document.querySelector(".battle-top .side-right .mini-title");
  if(rightSetupTitle) rightSetupTitle.textContent = "후공";

  // '트너' 라벨 제거
  Array.from(document.querySelectorAll(".battle-top .rowlabel")).forEach(lb=>{
    if(lb.textContent.includes("트너")) lb.textContent = "";
  });

  // 표시: 선공=좌/우 pill 숨기기
  const pillSwap = $("pill-swap");
  if(pillSwap) pillSwap.style.display = "none";

  // 공격측/수비측 카드 폭 반반 맞추기
  document.querySelectorAll(".grid3").forEach(g=>{
    g.style.gridTemplateColumns = "1fr 1fr 1.1fr";
  });
}

// 상태 요약 pill 추가
function ensureStatusSummaryPill(){
  const head = document.querySelector(".battle-head");
  if(!head) return;
  if(!$("battle-status-summary")){
    const div = document.createElement("div");
    div.className = "pill";
    div.id = "battle-status-summary";
    div.textContent = "상태: -";
    head.appendChild(div);
  }
}

// ===================== 데이터 탭 UI =====================

function renderTrainerSelect(){
  $("trainer-select").innerHTML = trainerOptions();
  $("trainer-select").value = ui.selectedTrainerId;
  const t = getTrainerById(ui.selectedTrainerId);
  $("trainer-name").value = t?.name ?? "";
}
if ($("trainer-select")){
  $("trainer-select").addEventListener("change", e=>{
    ui.selectedTrainerId = e.target.value;
    ui.selectedPokemonIndex = 0;
    renderTrainerSelect();
    renderTeamList();
    renderPokemonEditor();
  });
}

if($("btn-save-trainer-name")){
  $("btn-save-trainer-name").onclick = ()=>{
    const t = getTrainerById(ui.selectedTrainerId);
    const v = $("trainer-name").value.trim();
    if(!v) return toast("트레이너 이름이 비어있습니다.");
    t.name = v;
    saveState(state);
    renderTrainerSelect();
    renderBattleSelectors();
    renderBattleAll();
    toast("저장됨");
  };
}

function renderTeamList(){
  const t = getTrainerById(ui.selectedTrainerId);
  const html = t.team.map((p, idx) => {
    const d = derivedStats(p);
    const types = [d.type1, d.type2].filter(Boolean).join("/") || "(미입력)";
    const meta = `포켓몬: ${pokeOrig(p)} · ${types} · Lv${d.level}`;
    return `
      <div class="team-item ${idx===ui.selectedPokemonIndex?'active':''}" data-idx="${idx}">
        <div class="team-name">${idx+1}. ${escapeHtml(pokeNick(p))}</div>
        <div class="team-meta">${escapeHtml(meta)}</div>
      </div>
    `;
  }).join("");
  $("team-list").innerHTML = html;
  document.querySelectorAll(".team-item").forEach(el=>{
    el.addEventListener("click", ()=>{
      ui.selectedPokemonIndex = Number(el.dataset.idx);
      renderTeamList();
      renderPokemonEditor();
    });
  });
}

function renderPokemonEditor(){
  const t = getTrainerById(ui.selectedTrainerId);
  const p = t.team[ui.selectedPokemonIndex];
  if(!p) { $("poke-editor").innerHTML = `<div class="hint">선택 엔트리 없음</div>`; return; }

  migratePokemon(p, `포켓몬${ui.selectedPokemonIndex+1}`);
  ensureMoves(p);

  const i = p.input;
  const type1Options = TYPES.map(tp => `<option value="${tp}" ${tp===(i.type1||"노말")?'selected':''}>${tp}</option>`).join("");
  const type2Options = `<option value="" ${i.type2?``:`selected`}>(없음)</option>` +
    TYPES.map(tp => `<option value="${tp}" ${tp===(i.type2||"")?'selected':''}>${tp}</option>`).join("");

  const movesHtml = p.moves.map((m, idx)=>{
    const tOps = TYPES.map(tp=>`<option value="${tp}" ${tp===m.type?'selected':''}>${tp}</option>`).join("");
    return `
      <div class="mini">
        <div class="mini-title">기술 ${idx+1}</div>
        <div class="row"><label class="rowlabel">이름</label><input id="ed-move-name-${idx}" value="${escapeHtml(m.name)}" placeholder="기술 이름"></div>
        <div class="row"><label class="rowlabel">타입</label><select id="ed-move-type-${idx}">${tOps}</select></div>
        <div class="row">
          <label class="rowlabel">분류</label>
          <select id="ed-move-cat-${idx}">
            <option value="physical" ${m.cat==="physical"?"selected":""}>물리</option>
            <option value="special"  ${m.cat==="special" ?"selected":""}>특수</option>
            <option value="status"   ${m.cat==="status"  ?"selected":""}>변화</option>
          </select>
        </div>
        <div class="row"><label class="rowlabel">위력</label><input id="ed-move-power-${idx}" type="number" min="0" max="999" value="${escapeHtml(String(m.power))}"></div>
      </div>
    `;
  }).join("");

  $("poke-editor").innerHTML = `
    <div class="grid2">
      <div class="mini">
        <div class="mini-title">포켓몬 정보</div>
        <div class="row"><label class="rowlabel">포켓몬</label><input id="ed-orig" value="${escapeHtml(pokeOrig(p))}" placeholder="예: 피카츄"></div>
        <div class="row"><label class="rowlabel">이름</label><input id="ed-nick" value="${escapeHtml(pokeNick(p))}" placeholder="내가 지은 이름"></div>
        <div class="row"><label class="rowlabel">타입1</label><select id="ed-type1">${type1Options}</select></div>
        <div class="row"><label class="rowlabel">타입2</label><select id="ed-type2">${type2Options}</select></div>
        <div class="row"><label class="rowlabel">레벨</label><input id="ed-level" type="number" min="1" max="100" value="${escapeHtml(i.level??50)}"></div>
      </div>

      <div class="mini">
        <div class="mini-title">종족값(6)</div>
        <div class="row"><label class="rowlabel">HP</label><input id="ed-bhp" type="number" min="1" max="255" value="${baseOr100(i.baseHp)}"></div>
        <div class="row"><label class="rowlabel">공격</label><input id="ed-batk" type="number" min="1" max="255" value="${baseOr100(i.baseAtk)}"></div>
        <div class="row"><label class="rowlabel">방어</label><input id="ed-bdef" type="number" min="1" max="255" value="${baseOr100(i.baseDef)}"></div>
        <div class="row"><label class="rowlabel">특공</label><input id="ed-bspa" type="number" min="1" max="255" value="${baseOr100(i.baseSpA)}"></div>
        <div class="row"><label class="rowlabel">특방</label><input id="ed-bspd" type="number" min="1" max="255" value="${baseOr100(i.baseSpD)}"></div>
        <div class="row"><label class="rowlabel">스피드</label><input id="ed-bspe" type="number" min="1" max="255" value="${baseOr100(i.baseSpe)}"></div>
        <div class="hint">빈칸은 자동으로 100 처리됩니다.</div>
      </div>
    </div>

    <div class="grid2" style="margin-top:8px;">
      ${movesHtml}
    </div>

    <div class="mini" style="margin-top:8px;">
      <div class="mini-title">자동 계산(IV31/EV0/중립)</div>
      <div id="ed-derived" class="hint"></div>
    </div>
  `;

  const preview = ()=>{
    const tmp = {
      origName: $("ed-orig").value,
      nickName: $("ed-nick").value,
      input:{
        type1: $("ed-type1").value,
        type2: $("ed-type2").value,
        level: $("ed-level").value,
        baseHp: $("ed-bhp").value,
        baseAtk: $("ed-batk").value,
        baseDef: $("ed-bdef").value,
        baseSpA: $("ed-bspa").value,
        baseSpD: $("ed-bspd").value,
        baseSpe: $("ed-bspe").value,
      }
    };
    migratePokemon(tmp, `포켓몬${ui.selectedPokemonIndex+1}`);
    const d = derivedStats(tmp);
    $("ed-derived").textContent =
      `포켓몬 ${pokeOrig(tmp)} / 이름 ${pokeNick(tmp)} · ` +
      `타입 ${[d.type1,d.type2].filter(Boolean).join("/")||"(미입력)"} · Lv${d.level} · ` +
      `HP${d.hp} 공격${d.atk} 방어${d.def} 특공${d.spa} 특방${d.spd} 스피드${d.spe}`;
  };

  [
    "ed-orig","ed-nick","ed-type1","ed-type2","ed-level",
    "ed-bhp","ed-batk","ed-bdef","ed-bspa","ed-bspd","ed-bspe"
  ].forEach(id=>{
    const el = $(id);
    if(el){
      el.addEventListener("input", preview);
      el.addEventListener("change", preview);
    }
  });

  preview();

  if($("btn-save-poke")){
    $("btn-save-poke").onclick = ()=>{
      const orig = $("ed-orig").value.trim();
      const nick = $("ed-nick").value.trim();
      if(!orig) return toast("포켓몬 이름(종)이 비어있습니다.");
      if(!nick) return toast("이름이 비어있습니다.");

      p.origName = orig;
      p.nickName = nick;

      p.input.type1 = $("ed-type1").value;
      p.input.type2 = $("ed-type2").value || "";
      p.input.level = clampInt($("ed-level").value,1,100);

      p.input.baseHp  = baseOr100($("ed-bhp").value);
      p.input.baseAtk = baseOr100($("ed-batk").value);
      p.input.baseDef = baseOr100($("ed-bdef").value);
      p.input.baseSpA = baseOr100($("ed-bspa").value);
      p.input.baseSpD = baseOr100($("ed-bspd").value);
      p.input.baseSpe = baseOr100($("ed-bspe").value);

      ensureMoves(p);
      p.moves.forEach((m, idx)=>{
        m.name  = $(`ed-move-name-${idx}`).value.trim();
        m.type  = $(`ed-move-type-${idx}`).value;
        m.cat   = $(`ed-move-cat-${idx}`).value;
        m.power = clampInt($(`ed-move-power-${idx}`).value, 0, 999);
      });

      saveState(state);
      renderTeamList();
      renderPokemonEditor();
      renderBattleSelectors();
      renderBattleAll();
      toast("저장됨");
    };
  }
}

// ===================== 배틀 매핑 =====================

function leftKey(){ return battle().viewSwapped ? battle().rightBase : battle().leftBase; }
function rightKey(){ return battle().viewSwapped ? battle().leftBase : battle().rightBase; }
function keyToTrainerId(k){ return k==="A" ? battle().aTrainerId : battle().bTrainerId; }
function keyToActiveIndex(k){ return k==="A" ? battle().aActive : battle().bActive; }
function keyToHpArr(k){ return k==="A" ? battle().aHp : battle().bHp; }
function keyToStatusArr(k){ return k==="A" ? battle().aStatus : battle().bStatus; }

function getActiveDataByKey(k){
  const tid = keyToTrainerId(k);
  const t = getTrainerById(tid);
  const idx = keyToActiveIndex(k);
  const p = t.team[idx];
  const stArr = keyToStatusArr(k);
  const hpArr = keyToHpArr(k);
  return { k, t, idx, p, st: stArr[idx], stArr, hpArr };
}

// ===================== 배틀 셀렉터 =====================

function renderBattleSelectors(){
  if(!$("battle-a-trainer") || !$("battle-b-trainer")) return;

  $("battle-a-trainer").innerHTML = trainerOptions();
  $("battle-b-trainer").innerHTML = trainerOptions();

  if(!battle().aTrainerId) battle().aTrainerId = state.trainers[0]?.id ?? null;
  if(!battle().bTrainerId) battle().bTrainerId = state.trainers[1]?.id ?? state.trainers[0]?.id ?? null;

  $("battle-a-trainer").value = battle().aTrainerId;
  $("battle-b-trainer").value = battle().bTrainerId;

  const ta = getTrainerById(battle().aTrainerId);
  const tb = getTrainerById(battle().bTrainerId);

  if($("battle-a-active")){
    $("battle-a-active").innerHTML = pokemonOptions(ta.team);
    $("battle-a-active").value = String(battle().aActive);
  }
  if($("battle-b-active")){
    $("battle-b-active").innerHTML = pokemonOptions(tb.team);
    $("battle-b-active").value = String(battle().bActive);
  }
}

if ($("battle-a-trainer")) {
  $("battle-a-trainer").addEventListener("change", e=>{
    battle().aTrainerId = e.target.value;
    battle().aActive = 0;
    renderBattleSelectors();
    renderBattleAll();
  });
}
if ($("battle-b-trainer")) {
  $("battle-b-trainer").addEventListener("change", e=>{
    battle().bTrainerId = e.target.value;
    battle().bActive = 0;
    renderBattleSelectors();
    renderBattleAll();
  });
}
if ($("battle-a-active")) {
  $("battle-a-active").addEventListener("change", e=>{
    battle().aActive = clampInt(e.target.value,0,5);
    renderBattleAll();
  });
}
if ($("battle-b-active")) {
  $("battle-b-active").addEventListener("change", e=>{
    battle().bActive = clampInt(e.target.value,0,5);
    renderBattleAll();
  });
}

// ===================== 배틀 시작/출전 =====================

function battleInitHPAndStatus(){
  const ta = getTrainerById(battle().aTrainerId);
  const tb = getTrainerById(battle().bTrainerId);
  battle().aHp = ta.team.map(p => derivedStats(p).hp);
  battle().bHp = tb.team.map(p => derivedStats(p).hp);
  battle().aStatus = Array.from({length:6},()=>makeStatusState());
  battle().bStatus = Array.from({length:6},()=>makeStatusState());
  battle().sideCond = makeSideCond();
}

function sendOutByKey(k, idx){
  const tid = keyToTrainerId(k);
  const t = getTrainerById(tid);
  const p = t.team[idx];
  logAdd(`${t.name}은(는) ${pokeNick(p)}(${pokeOrig(p)})을(를) 내보냈다!`);
}

function ensureBattleStarted(){
  if(battle().started) return true;

  if(!battle().aTrainerId) battle().aTrainerId = state.trainers[0]?.id ?? null;
  if(!battle().bTrainerId) battle().bTrainerId = state.trainers[1]?.id ?? state.trainers[0]?.id ?? null;

  const ta = getTrainerById(battle().aTrainerId);
  const tb = getTrainerById(battle().bTrainerId);

  const aP = ta.team[battle().aActive];
  const bP = tb.team[battle().bActive];

  if(!aP || !bP) return false;
  if(!isFilledPokemon(aP)) { toast("선공 출전 포켓몬: 타입/레벨 필요"); return false; }
  if(!isFilledPokemon(bP)) { toast("후공 출전 포켓몬: 타입/레벨 필요"); return false; }

  battleInitHPAndStatus();
  battle().started = true;
  battle().turn = 1;
  battle().viewSwapped = false;
  battle().actedInTurn = 0;
  battle().leftBase = "A";
  battle().rightBase = "B";

  if(!battle().startedOnceLogged){
    battle().startedOnceLogged = true;
    logAdd(`배틀 시작!`);
    logAdd(`${ta.name} VS ${tb.name}`);
    logAdd(`${ta.name}은(는) ${pokeNick(aP)}(${pokeOrig(aP)})을(를) 내보냈다!`);
    logAdd(`${tb.name}은(는) ${pokeNick(bP)}(${pokeOrig(bP)})을(를) 내보냈다!`);
  }
  return true;
}

// ===================== 지속/턴 종료 =====================

function firstAliveIndex(hp){
  for(let i=0;i<hp.length;i++) if(hp[i] > 0) return i;
  return -1;
}
function weatherTickLine(kind){
  switch(kind){
    case "sun": return "햇살이 쨍쨍하다!";
    case "rain": return "비가 내린다!";
    case "sand": return "모래바람이 휘몰아친다!";
    case "snow": return "설경이 이어지고 있다!";
    default: return "";
  }
}
function weatherEndLine(kind){
  switch(kind){
    case "sun": return "햇살이 약해졌다!";
    case "rain": return "비가 그쳤다!";
    case "sand": return "모래바람이 잦아들었다!";
    case "snow": return "설경이 끝났다!";
    default: return "";
  }
}

function maybeSwitchInAfterFaint(k){
  const hpArr = keyToHpArr(k);
  const next = firstAliveIndex(hpArr);
  if(next < 0) return;

  if(k==="A") battle().aActive = next;
  else battle().bActive = next;

  sendOutByKey(k, next);
}

function applyResidualForKey(k){
  const { idx, p, hpArr, stArr } = getActiveDataByKey(k);
  if(!p) return;
  if(hpArr[idx] <= 0) return;

  const d = derivedStats(p);
  const st = stArr[idx];
  const name = pokeNick(p);

  if(st.major==="brn"){
    const dmg = Math.max(1, Math.floor(d.hp / 16));
    hpArr[idx] = Math.max(0, hpArr[idx] - dmg);
    logAdd(`${name}은(는) 화상 때문에 ${dmg}의 대미지를 입었다!`);
    logAdd(`${name}의 남은 HP: ${hpArr[idx]}/${d.hp}`);
  }
  if(st.major==="psn"){
    const dmg = Math.max(1, Math.floor(d.hp / 8));
    hpArr[idx] = Math.max(0, hpArr[idx] - dmg);
    logAdd(`${name}은(는) 독 때문에 ${dmg}의 대미지를 입었다!`);
    logAdd(`${name}의 남은 HP: ${hpArr[idx]}/${d.hp}`);
  }
  if(st.major==="tox"){
    if(st.toxicCount < 1) st.toxicCount = 1;
    const dmg = Math.max(1, Math.floor(d.hp / 16) * st.toxicCount);
    hpArr[idx] = Math.max(0, hpArr[idx] - dmg);
    logAdd(`${name}은(는) 맹독 때문에 ${dmg}의 대미지를 입었다!`);
    logAdd(`${name}의 남은 HP: ${hpArr[idx]}/${d.hp}`);
    st.toxicCount += 1;
  }

  const w = battle().weather.kind;
  if(w==="sand"){
    const types = [d.type1,d.type2].filter(Boolean);
    const immune = (types.includes("바위") || types.includes("땅") || types.includes("강철"));
    if(!immune){
      const dmg = Math.max(1, Math.floor(d.hp / 16));
      hpArr[idx] = Math.max(0, hpArr[idx] - dmg);
      logAdd(`${name}은(는) 모래바람 때문에 ${dmg}의 대미지를 입었다!`);
      logAdd(`${name}의 남은 HP: ${hpArr[idx]}/${d.hp}`);
    }
  }

  if(hpArr[idx] === 0){
    logAdd(`${name}은(는) 쓰러졌다!`);
    maybeSwitchInAfterFaint(k);
  }
}

function endOfTurnTick(){
  const kind = battle().weather.kind;
  if(kind!=="none"){
    const line = weatherTickLine(kind);
    if(line) logAdd(line);
  }

  applyResidualForKey("A");
  applyResidualForKey("B");

  if(battle().weather.kind!=="none" && battle().weather.turns > 0){
    battle().weather.turns -= 1;
    if(battle().weather.turns <= 0){
      const endLine = weatherEndLine(battle().weather.kind);
      battle().weather = { kind:"none", turns:0 };
      if(endLine) logAdd(endLine);
    }
  }

  battle().turn += 1;

  const aAlive = battle().aHp.some(h=>h>0);
  const bAlive = battle().bHp.some(h=>h>0);
  if(!aAlive || !bAlive){
    logAdd(`배틀 종료! 승자: ${aAlive ? "선공" : bAlive ? "후공" : "무승부"}`);
    battle().started = false;
  }
}

// ===================== 상태/행동불능 =====================

function statusApplyLine(name, st, sleepTurns){
  switch(st){
    case "par": return `${name}은(는) 마비에 걸렸다!`;
    case "brn": return `${name}은(는) 화상을 입었다!`;
    case "psn": return `${name}은(는) 독에 걸렸다!`;
    case "tox": return `${name}은(는) 맹독에 걸렸다!`;
    case "slp": return `${name}은(는) 잠들어 버렸다! (수면 ${sleepTurns}턴)`;
    case "frz": return `${name}은(는) 얼어붙었다!`;
    default: return `${name}의 상태가 회복되었다!`;
  }
}
function canActByKey(k){
  const { p, st } = getActiveDataByKey(k);
  const pName = pokeNick(p);

  if(st.flinch){
    st.flinch = false;
    logAdd(`${pName}은(는) 풀죽어서 움직일 수 없었다!`);
    return false;
  }
  if(st.major==="slp"){
    if(st.sleepTurns > 0){
      logAdd(`${pName}은(는) 잠들어 있다!`);
      st.sleepTurns -= 1;
      if(st.sleepTurns <= 0){
        st.major = "none";
        logAdd(`${pName}은(는) 잠에서 깼다!`);
        return true;
      }
      return false;
    }else{
      st.major = "none";
      logAdd(`${pName}은(는) 잠에서 깼다!`);
      return true;
    }
  }
  if(st.major==="frz"){
    if(Math.random() < 0.2){
      st.major = "none";
      logAdd(`${pName}은(는) 얼음 상태에서 풀렸다!`);
      return true;
    }
    logAdd(`${pName}은(는) 얼어붙어 움직일 수 없었다!`);
    return false;
  }
  if(st.major==="par"){
    if(Math.random() < 0.25){
      logAdd(`${pName}은(는) 몸이 마비되어 움직일 수 없었다!`);
      return false;
    }
  }
  return true;
}

// ===================== 데미지 계산 =====================

function weatherMoveMultiplier(weatherKind, moveType){
  if(weatherKind === "rain"){
    if(moveType==="물") return 1.5;
    if(moveType==="불꽃") return 0.5;
  }
  if(weatherKind === "sun"){
    if(moveType==="불꽃") return 1.5;
    if(moveType==="물") return 0.5;
  }
  return 1.0;
}
function weatherDefMultiplier(weatherKind, defenderTypes, moveCat){
  if(weatherKind === "snow" && moveCat==="physical"){
    if(defenderTypes.includes("얼음")) return 1.5;
  }
  if(weatherKind === "sand" && moveCat==="special"){
    if(defenderTypes.includes("바위")) return 1.5;
  }
  return 1.0;
}
function burnAtkMultiplier(attackerStatus, moveCat){
  if(attackerStatus.major==="brn" && moveCat==="physical") return 0.5;
  return 1.0;
}
function screenMultiplierFor(move, cond){
  if(!cond) return 1.0;
  if(move.cat === "status" || move.power === 0) return 1.0;
  if(cond.auroraveil) return 0.5;
  if(move.cat === "physical" && cond.reflect) return 0.5;
  if(move.cat === "special"  && cond.lightscreen) return 0.5;
  return 1.0;
}

function calcDamage({att, def, move, attStatus, weather, screenMul=1, rand=null}){
  const L = att.level;
  const P = clampInt(move.power, 0, 999);
  if(move.cat === "status" || P === 0) return { damage: 0, eff: 1 };

  let A = (move.cat === "physical") ? att.atk : att.spa;
  let D = (move.cat === "physical") ? def.def : def.spd;

  A = Math.floor(A * burnAtkMultiplier(attStatus, move.cat));
  D = Math.floor(D * weatherDefMultiplier(weather.kind, [def.type1, def.type2].filter(Boolean), move.cat));
  if(D < 1) D = 1;

  const base1 = Math.floor((Math.floor((2 * L) / 5) + 2) * P * A / D);
  const base2 = Math.floor(base1 / 50) + 2;

  const stab = (move.type && (move.type === att.type1 || move.type === att.type2)) ? 1.5 : 1.0;
  const eff  = typeEffect(move.type, def.type1, def.type2);
  const wMul = weatherMoveMultiplier(weather.kind, move.type);
  const r    = (rand == null) ? (0.85 + Math.random() * 0.15) : rand;

  let dmg = Math.floor(base2 * stab * eff * wMul * screenMul * r);
  if (eff === 0) dmg = 0;
  if (eff > 0 && dmg < 1) dmg = 1;

  return { damage: dmg, eff };
}

// 현재 좌측(공격측) 선택 기술
function getCurrentLeftMove(){
  const LK = leftKey();
  const { p } = getActiveDataByKey(LK);
  if(!p){
    return { name:"기술", type:"노말", cat:"physical", power:0 };
  }
  ensureMoves(p);
  const sel = $("move-l-slot");
  const idx = sel ? clampInt(sel.value, 0, 3) : 0;
  const m = p.moves[idx] || {};
  return {
    name: (m.name ?? "").trim() || "기술",
    type: m.type || "노말",
    cat:  m.cat  || "physical",
    power: clampInt(m.power ?? 0, 0, 999)
  };
}

function moveCatLabel(cat){
  if(cat==="physical") return "물리";
  if(cat==="special")  return "특수";
  return "변화";
}

// ===================== 배틀 UI =====================

function statusLabel(st, cond){
  const baseLabel = STATUS.find(x=>x.key===st.major)?.label ?? "없음";
  const parts = [];
  if(st.major!=="none") parts.push(baseLabel);
  if(st.major==="slp") parts.push(`(${st.sleepTurns}턴)`);
  if(st.major==="tox") parts.push(`(${st.toxicCount})`);
  if(st.flinch) parts.push("풀죽음");
  if(cond?.protect) parts.push("방어(1회)");
  return parts.length ? parts.join(" ") : "없음";
}
function shortMajorStatus(st){
  if(!st || st.major==="none") return "없음";
  return STATUS.find(x=>x.key===st.major)?.label ?? "없음";
}
function typeLabel(d){
  return [d.type1,d.type2].filter(Boolean).join("/") || "(미입력)";
}
function hpPercent(cur, max){
  if(max<=0) return 0;
  return Math.max(0, Math.min(100, Math.round((cur/max)*100)));
}

function renderStatusCards(){
  if(!$("battle-current-status")) return;

  const LK = leftKey();
  const RK = rightKey();

  const Lt = getTrainerById(keyToTrainerId(LK));
  const Rt = getTrainerById(keyToTrainerId(RK));

  const Li = keyToActiveIndex(LK);
  const Ri = keyToActiveIndex(RK);

  const Lp = Lt.team[Li];
  const Rp = Rt.team[Ri];

  const Ld = derivedStats(Lp);
  const Rd = derivedStats(Rp);

  const LhpArr = keyToHpArr(LK);
  const RhpArr = keyToHpArr(RK);
  const LsArr = keyToStatusArr(LK);
  const RsArr = keyToStatusArr(RK);

  const Lcur = battle().started ? LhpArr[Li] : Ld.hp;
  const Rcur = battle().started ? RhpArr[Ri] : Rd.hp;

  const Lmax = Ld.hp;
  const Rmax = Rd.hp;

  const Lst = battle().started ? LsArr[Li] : makeStatusState();
  const Rst = battle().started ? RsArr[Ri] : makeStatusState();

  const Lcond = getSideCond(LK);
  const Rcond = getSideCond(RK);

  $("battle-current-status").innerHTML = `
    <div class="scard attacker">
      <div class="sc-head">
        <div>
          <div class="sc-title">공격측</div>
          <div class="sc-sub">${escapeHtml(trainerPokeLabel(Lt, Lp))}</div>
        </div>
      </div>
      <div class="badges">
        <div class="badge">포켓몬: ${escapeHtml(pokeOrig(Lp))}</div>
        <div class="badge">타입: ${escapeHtml(typeLabel(Ld))}</div>
        <div class="badge">상태: ${escapeHtml(statusLabel(Lst, Lcond))}</div>
        <div class="badge">Lv: ${escapeHtml(String(Ld.level))}</div>
      </div>
      <div class="hpbar"><div class="hpfill" style="width:${hpPercent(Lcur,Lmax)}%"></div></div>
      <div class="hptext">HP ${battle().started ? `${Lcur}/${Lmax}` : `${Lmax}`}</div>
    </div>

    <div class="scard">
      <div class="sc-head">
        <div>
          <div class="sc-title">수비측</div>
          <div class="sc-sub">${escapeHtml(trainerPokeLabel(Rt, Rp))}</div>
        </div>
      </div>
      <div class="badges">
        <div class="badge">포켓몬: ${escapeHtml(pokeOrig(Rp))}</div>
        <div class="badge">타입: ${escapeHtml(typeLabel(Rd))}</div>
        <div class="badge">상태: ${escapeHtml(statusLabel(Rst, Rcond))}</div>
        <div class="badge">Lv: ${escapeHtml(String(Rd.level))}</div>
      </div>
      <div class="hpbar"><div class="hpfill" style="width:${hpPercent(Rcur,Rmax)}%"></div></div>
      <div class="hptext">HP ${battle().started ? `${Rcur}/${Rmax}` : `${Rmax}`}</div>
    </div>
  `;
}

function renderWeatherBar(){
  if(!$("battle-weather")) return;
  const w = battle().weather;
  const label = WEATHER.find(x=>x.key===w.kind)?.label ?? "없음";
  $("battle-weather").textContent = (w.kind==="none") ? `날씨: 없음` : `날씨: ${label} (남은 ${w.turns})`;
}

function renderStatusSummary(){
  const el = $("battle-status-summary");
  if(!el) return;
  if(!battle().started){
    el.textContent = "상태: -";
    return;
  }
  const LK = leftKey();
  const RK = rightKey();
  const Li = keyToActiveIndex(LK);
  const Ri = keyToActiveIndex(RK);
  const Lst = keyToStatusArr(LK)[Li];
  const Rst = keyToStatusArr(RK)[Ri];
  el.textContent = `상태: 공격측 ${shortMajorStatus(Lst)} / 수비측 ${shortMajorStatus(Rst)}`;
}

function renderPills(){
  if($("pill-turn")) $("pill-turn").textContent = battle().started ? `턴: ${battle().turn}` : `턴: -`;

  if(!battle().started){
    if($("pill-facing")) $("pill-facing").textContent = `현재: -`;
    if($("act-hint")) $("act-hint").textContent = `행동 실행을 누르면 자동으로 배틀이 시작됩니다.`;
    renderStatusSummary();
    return;
  }

  const LK = leftKey();
  const RK = rightKey();
  const Lt = getTrainerById(keyToTrainerId(LK));
  const Rt = getTrainerById(keyToTrainerId(RK));
  const Li = keyToActiveIndex(LK);
  const Ri = keyToActiveIndex(RK);
  const Lp = Lt.team[Li];
  const Rp = Rt.team[Ri];

  if($("pill-facing")) $("pill-facing").textContent = `현재: ${trainerPokeLabel(Lt,Lp)} → ${trainerPokeLabel(Rt,Rp)}`;

  if($("act-hint")) {
    $("act-hint").textContent =
      `이번 클릭: ${pokeNick(Lp)} 공격 → 이후 자동 좌우 교대`;
  }

  renderStatusSummary();
}

function renderMoveTitles(){
  if(!$("left-move-title")) return;

  const LK = leftKey();
  const RK = rightKey();
  const Lt = getTrainerById(keyToTrainerId(LK));
  const Rt = getTrainerById(keyToTrainerId(RK));
  const Li = keyToActiveIndex(LK);
  const Ri = keyToActiveIndex(RK);
  const Lp = Lt.team[Li];
  const Rp = Rt.team[Ri];

  $("left-move-title").textContent = `공격측: ${trainerPokeLabel(Lt, Lp)}`;
  if($("right-move-title")) $("right-move-title").textContent = `수비측: ${trainerPokeLabel(Rt, Rp)}`;
}

// 공격측 기술 선택 UI
function renderMoveSelector(){
  const sel = $("move-l-slot");
  if(!sel) return;

  const LK = leftKey();
  const { p } = getActiveDataByKey(LK);

  if(!p){
    sel.innerHTML = `<option value="0">기술 없음</option>`;
    $("move-l-type-label").textContent   = "-";
    $("move-l-cat-label").textContent    = "-";
    $("move-l-power-label").textContent  = "-";
    return;
  }

  ensureMoves(p);
  const prev = clampInt(sel.value, 0, 3);

  sel.innerHTML = p.moves.map((m, i)=>{
    const name = (m.name ?? "").trim() || `기술${i+1}`;
    const type = m.type || "-";
    const cat  = moveCatLabel(m.cat);
    const pow  = m.power ?? 0;
    return `<option value="${i}">${i+1}. ${escapeHtml(name)} (${type}/${cat}/${pow})</option>`;
  }).join("");

  sel.value = String(Math.min(prev, 3));
  updateMoveLabels();
}

function updateMoveLabels(){
  const info = getCurrentLeftMove();
  if($("move-l-type-label"))  $("move-l-type-label").textContent  = info.type;
  if($("move-l-cat-label"))   $("move-l-cat-label").textContent   = moveCatLabel(info.cat);
  if($("move-l-power-label")) $("move-l-power-label").textContent = String(info.power);
}

// 상태 대상 셀렉트 라벨
function updateStatusTargetLabels(){
  const sel = $("status-target");
  if(!sel) return;

  const LK = leftKey();
  const RK = rightKey();

  const Lt = getTrainerById(keyToTrainerId(LK));
  const Rt = getTrainerById(keyToTrainerId(RK));

  const Li = keyToActiveIndex(LK);
  const Ri = keyToActiveIndex(RK);

  const Lp = Lt.team[Li];
  const Rp = Rt.team[Ri];

  const opts = sel.options;
  if(opts.length >= 1 && Lp){
    opts[0].textContent = `공격측: ${trainerPokeLabel(Lt, Lp)}`;
  }
  if(opts.length >= 2 && Rp){
    opts[1].textContent = `수비측: ${trainerPokeLabel(Rt, Rp)}`;
  }
}

function renderBattleAll(){
  renderBattleSelectors();
  renderWeatherBar();
  renderPills();
  renderMoveTitles();
  renderStatusCards();
  updateStatusTargetLabels();
  renderMoveSelector();
  renderLog();
}

// ===================== 날씨/상태 버튼 =====================

function getSideByLR(lr){
  return (lr==="L") ? leftKey() : rightKey();
}

if($("btn-apply-weather")) $("btn-apply-weather").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("날씨 적용");

  const kind = $("weather-kind").value;
  const turns = clampInt($("weather-turns").value, 0, 999);

  battle().weather.kind = kind;
  battle().weather.turns = (kind==="none") ? 0 : turns;

  const startLine = (()=>{
    switch(kind){
      case "sun": return "햇살이 강해지기 시작했다!";
      case "rain": return "비가 내리기 시작했다!";
      case "sand": return "모래바람이 몰아치기 시작했다!";
      case "snow": return "설경이 시작되었다!";
      default: return "날씨가 평온해졌다!";
    }
  })();
  logAdd(startLine);
  renderBattleAll();
};

if($("btn-clear-weather")) $("btn-clear-weather").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("날씨 해제");
  const prev = battle().weather.kind;
  battle().weather = { kind:"none", turns:0 };
  logAdd(prev==="none" ? "날씨는 이미 없다." : "날씨가 평온해졌다!");
  renderBattleAll();
};

if($("btn-apply-status")) $("btn-apply-status").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("상태 적용");

  const lr = $("status-target").value;
  const kind = $("status-kind").value;
  const sleepTurns = clampInt($("sleep-turns").value, 1, 10);

  const k = getSideByLR(lr);
  const { p, st } = getActiveDataByKey(k);
  if(!p) return;

  const name = pokeNick(p);

  st.major = kind;
  st.sleepTurns = (kind==="slp") ? sleepTurns : 0;
  st.toxicCount = (kind==="tox") ? 1 : 0;
  if(kind==="none"){ st.sleepTurns=0; st.toxicCount=0; }

  logAdd(statusApplyLine(name, kind, sleepTurns));
  renderBattleAll();
};

if($("btn-clear-status")) $("btn-clear-status").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("상태 해제");

  const lr = $("status-target").value;
  const k = getSideByLR(lr);
  const { p, st } = getActiveDataByKey(k);
  if(!p) return;

  const name = pokeNick(p);

  st.major = "none";
  st.sleepTurns = 0;
  st.toxicCount = 0;
  st.flinch = false;

  logAdd(`${name}의 상태가 회복되었다!`);
  renderBattleAll();
};

// 리플렉터/빛의장막/오로라베일/방어(1회)
if($("btn-toggle-reflect")) $("btn-toggle-reflect").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("리플렉터");
  const lr = $("status-target").value;
  const k = getSideByLR(lr);
  const cond = getSideCond(k);
  cond.reflect = !cond.reflect;
  const { p } = getActiveDataByKey(k);
  const name = pokeNick(p);
  logAdd(`${name}의 리플렉터가 ${cond.reflect ? "전개되었다!" : "사라졌다!"}`);
  renderBattleAll();
};

if($("btn-toggle-lightscreen")) $("btn-toggle-lightscreen").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("빛의장막");
  const lr = $("status-target").value;
  const k = getSideByLR(lr);
  const cond = getSideCond(k);
  cond.lightscreen = !cond.lightscreen;
  const { p } = getActiveDataByKey(k);
  const name = pokeNick(p);
  logAdd(`${name}의 빛의장막이 ${cond.lightscreen ? "전개되었다!" : "사라졌다!"}`);
  renderBattleAll();
};

if($("btn-toggle-auroraveil")) $("btn-toggle-auroraveil").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("오로라베일");
  const lr = $("status-target").value;
  const k = getSideByLR(lr);
  const cond = getSideCond(k);
  cond.auroraveil = !cond.auroraveil;
  const { p } = getActiveDataByKey(k);
  const name = pokeNick(p);
  logAdd(`${name}의 오로라베일이 ${cond.auroraveil ? "전개되었다!" : "사라졌다!"}`);
  renderBattleAll();
};

if($("btn-apply-protect")) $("btn-apply-protect").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("방어(1회)");
  const lr = $("status-target").value;
  const k = getSideByLR(lr);
  const cond = getSideCond(k);
  cond.protect = true;
  renderBattleAll();
};

if($("btn-tick-only")) $("btn-tick-only").onclick = ()=>{
  if(!ensureBattleStarted()) return;
  pushUndo("턴 종료 처리(수동)");
  logAdd(`--- ${battle().turn}턴 종료 처리(수동) ---`);
  endOfTurnTick();
  battle().actedInTurn = 0;
  battle().viewSwapped = false;
  renderBattleAll();
};

// ===================== 버튼: 스왑 + 행동 실행 =====================

function swapActionButtons(){
  const btnSwap = $("btn-quick-range");
  const btnAct = $("btn-act");
  if(!btnSwap || !btnAct) return;

  btnSwap.textContent = "좌/우 스왑";
  btnSwap.onclick = ()=>{
    if(!ensureBattleStarted()) return;
    pushUndo("좌/우 스왑");
    battle().viewSwapped = !battle().viewSwapped;
    renderBattleAll();
  };

  btnAct.textContent = "행동 실행";
  btnAct.onclick = ()=>{
    if(!ensureBattleStarted()) return;
    pushUndo("행동 실행(대미지+좌우 스왑)");

    const LK = leftKey();
    const RK = rightKey();

    const L = getActiveDataByKey(LK);
    const R = getActiveDataByKey(RK);

    if(L.hpArr[L.idx] <= 0) return toast("공격측 포켓몬이 이미 쓰러져 있습니다.");
    if(R.hpArr[R.idx] <= 0) return toast("수비측 포켓몬이 이미 쓰러져 있습니다.");

    const move = getCurrentLeftMove();
    logAdd(`--- ${battle().turn}턴 (${battle().actedInTurn===0 ? "1번째 행동" : "2번째 행동"}) ---`);

    const atkName = pokeNick(L.p);
    const defName = pokeNick(R.p);

    if(!canActByKey(LK)){
      // 행동불능: 대사만 출력됨
    } else {
      logAdd(`${atkName}은(는) ${move.name}을(를) 사용했다!`);

      if(move.cat==="status" || move.power===0){
        // 변화기: 효과는 수동으로 처리
      } else {
        const defCond = getSideCond(RK);

        // 방어(1회)
        if(defCond && defCond.protect){
          defCond.protect = false;
          // 실제 게임 대사에 최대한 맞춰서, 공격 무효화만 출력
          logAdd(`${defName}은(는) 몸을 지켜 공격을 막았다!`);
        } else {
          const Ld = derivedStats(L.p);
          const Rd = derivedStats(R.p);
          const screenMul = screenMultiplierFor(move, defCond);

          const res = calcDamage({
            att: Ld, def: Rd, move,
            attStatus: L.st,
            weather: battle().weather,
            screenMul
          });

          if(res.eff===0){
            logAdd(`하지만 ${defName}에게는 효과가 없었다!`);
          } else {
            R.hpArr[R.idx] = Math.max(0, R.hpArr[R.idx] - res.damage);
            logAdd(`${defName}은(는) ${res.damage}의 대미지를 입었다!`);

            const t = effText(res.eff);
            if(t) logAdd(t);

            const maxHp = derivedStats(R.p).hp;
            logAdd(`${defName}의 남은 HP: ${R.hpArr[R.idx]}/${maxHp}`);

            if(R.hpArr[R.idx]===0){
              logAdd(`${defName}은(는) 쓰러졌다!`);
              maybeSwitchInAfterFaint(RK);
            }
          }
        }
      }
    }

    battle().viewSwapped = !battle().viewSwapped;
    battle().actedInTurn += 1;

    if(battle().started && battle().actedInTurn >= 2){
      logAdd(`--- ${battle().turn}턴 종료 ---`);
      endOfTurnTick();
      battle().actedInTurn = 0;
      battle().viewSwapped = false;
    }

    renderBattleAll();
  };
}

// ===================== 초기화 =====================

function syncAll(){
  polishStaticTexts();
  ensureStatusSummaryPill();

  if($("move-l-slot")){
    if(!$("move-l-type-label")){}
  }
  if($("weather-kind")) fillWeatherSelect();
  if($("status-kind")) { fillStatusSelect(); syncSleepUI(); }

  if(!ui.selectedTrainerId || !state.trainers.some(t=>t.id===ui.selectedTrainerId)){
    ui.selectedTrainerId = state.trainers[0]?.id ?? null;
  }

  if($("trainer-select")) renderTrainerSelect();
  if($("team-list")) renderTeamList();
  if($("poke-editor")) renderPokemonEditor();

  if(!battle().aTrainerId) battle().aTrainerId = state.trainers[0]?.id ?? null;
  if(!battle().bTrainerId) battle().bTrainerId = state.trainers[1]?.id ?? state.trainers[0]?.id ?? null;

  renderBattleAll();
  swapActionButtons();
  setTab("data");

  if($("move-l-slot")){
    $("move-l-slot").addEventListener("change", updateMoveLabels);
  }

  if($("move-l-type")){
    fillTypeSelect($("move-l-type"));
    $("move-l-type").value = "노말";
  }
}
syncAll();

// ===================== 토스트 =====================

let toastTimer = null;
function toast(msg){
  clearTimeout(toastTimer);
  let el = document.getElementById("toast");
  if(!el){
    el = document.createElement("div");
    el.id = "toast";
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "16px";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "10px";
    el.style.border = "1px solid #e5e5e5";
    el.style.background = "#111";
    el.style.color = "#fff";
    el.style.fontWeight = "900";
    el.style.fontSize = "13px";
    el.style.zIndex = "9999";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  toastTimer = setTimeout(()=>{ el.style.opacity = "0"; }, 1200);
}
 
