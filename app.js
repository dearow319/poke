// ---- 타입, 상성, 공통 유틸 ----
const TYPE_KO_TO_EN={
  "노말":"Normal","불꽃":"Fire","물":"Water","전기":"Electric","풀":"Grass","얼음":"Ice",
  "격투":"Fighting","독":"Poison","땅":"Ground","비행":"Flying","에스퍼":"Psychic",
  "벌레":"Bug","바위":"Rock","고스트":"Ghost","드래곤":"Dragon","악":"Dark",
  "강철":"Steel","페어리":"Fairy",
  "Normal":"Normal","Fire":"Fire","Water":"Water","Electric":"Electric","Grass":"Grass","Ice":"Ice",
  "Fighting":"Fighting","Poison":"Poison","Ground":"Ground","Flying":"Flying","Psychic":"Psychic",
  "Bug":"Bug","Rock":"Rock","Ghost":"Ghost","Dragon":"Dragon","Dark":"Dark","Steel":"Steel","Fairy":"Fairy"
};
const TYPE_EN_TO_KO = Object.fromEntries(
  Object.entries(TYPE_KO_TO_EN)
    .map(([k,v])=>[v,k])
    .filter(([k,_],i,self)=>self.findIndex(([x,_y])=>x===k)===i)
);

const TYPE_CHART={
  Normal:{Rock:.5,Ghost:0,Steel:.5},
  Fire:{Fire:.5,Water:.5,Rock:.5,Dragon:.5,Grass:2,Ice:2,Bug:2,Steel:2},
  Water:{Water:.5,Grass:.5,Dragon:.5,Fire:2,Ground:2,Rock:2},
  Electric:{Electric:.5,Grass:.5,Dragon:.5,Ground:0,Water:2,Flying:2},
  Grass:{Fire:.5,Grass:.5,Poison:.5,Flying:.5,Bug:.5,Dragon:.5,Steel:.5,Water:2,Ground:2,Rock:2},
  Ice:{Fire:.5,Water:.5,Ice:.5,Steel:.5,Grass:2,Ground:2,Flying:2,Dragon:2},
  Fighting:{Poison:.5,Flying:.5,Psychic:.5,Bug:.5,Fairy:.5,Ghost:0,Normal:2,Ice:2,Rock:2,Dark:2,Steel:2},
  Poison:{Poison:.5,Ground:.5,Rock:.5,Ghost:.5,Steel:0,Grass:2,Fairy:2},
  Ground:{Grass:.5,Bug:.5,Flying:0,Fire:2,Electric:2,Poison:2,Rock:2,Steel:2},
  Flying:{Electric:.5,Rock:.5,Steel:.5,Grass:2,Fighting:2,Bug:2,Ground:1},
  Psychic:{Psychic:.5,Steel:.5,Dark:0,Fighting:2,Poison:2},
  Bug:{Fire:.5,Fighting:.5,Poison:.5,Flying:.5,Ghost:.5,Steel:.5,Fairy:.5,Grass:2,Psychic:2,Dark:2},
  Rock:{Fighting:.5,Ground:.5,Steel:.5,Fire:2,Ice:2,Flying:2,Bug:2},
  Ghost:{Dark:.5,Normal:0,Psychic:2,Ghost:2},
  Dragon:{Steel:.5,Fairy:0,Dragon:2},
  Dark:{Fighting:.5,Dark:.5,Fairy:.5,Psychic:2,Ghost:2},
  Steel:{Fire:.5,Water:.5,Electric:.5,Steel:.5,Ice:2,Rock:2,Fairy:2},
  Fairy:{Fire:.5,Poison:.5,Steel:.5,Fighting:2,Dragon:2,Dark:2}
};

const API_BASE="https://pokeapi.co/api/v2";
const ROLLS = Array.from({length:16},(_,i)=>(85+i)/100);
const num = v => Number(v??0)||0;
const cache={
  koPokeList:[],
  koMoveList:[],
  ko2enPoke:{},
  en2koPoke:{},
  ko2enMove:{},
  en2koMove:{},
  baseStats:{},
  abilityKo:{},
  abilityEn:{},
  heldItemList:[],
  itemKo2En:{},
  itemEn2Ko:{}
};
const itemUsed={atk:false,def:false};
let toxicStage={atk:0,def:0}; // 맹독 스택은 양측 별도 관리

function strip(s){return (s||"").toLowerCase().replace(/\s+/g,"");}
function cap(s){return (s||"").charAt(0).toUpperCase()+(s||"").slice(1);}
function el(id){return document.getElementById(id);}
function pct(x){return Math.round(x*100)+"%";}
function toENType(v){const t=(v||"").trim();return TYPE_KO_TO_EN[t]||cap(t.toLowerCase());}

// 한글 조사 처리
function hasBatchim(word){
  if(!word) return false;
  for(let i=word.length-1;i>=0;i--){
    const ch=word.charCodeAt(i);
    if(ch<0xac00 || ch>0xd7a3) continue;
    const jong = (ch - 0xac00) % 28;
    return jong>0;
  }
  return false;
}
function withParticle(word, pBatchim, pNoBatchim){
  return word + (hasBatchim(word)?pBatchim:pNoBatchim);
}

function persist(){
  try{
    for(const k of [
      "koPokeList","koMoveList",
      "ko2enPoke","en2koPoke",
      "ko2enMove","en2koMove",
      "baseStats","abilityKo","abilityEn",
      "heldItemList","itemKo2En","itemEn2Ko"
    ]){
      localStorage.setItem(k,JSON.stringify(cache[k]));
    }
  }catch{}
}

// ---- PokéAPI ----
async function fetchPokemonList(){
  const key="pb-list-2000";
  try{const c=localStorage.getItem(key);if(c)return JSON.parse(c);}catch{}
  const r=await fetch(`${API_BASE}/pokemon?limit=2000`);
  const d=await r.json();
  localStorage.setItem(key,JSON.stringify(d.results));
  return d.results;
}
async function fetchPokemon(en){
  const k=`pb-poke-${en}`;
  try{const c=localStorage.getItem(k);if(c)return JSON.parse(c);}catch{}
  const r=await fetch(`${API_BASE}/pokemon/${en}`);
  const d=await r.json();
  localStorage.setItem(k,JSON.stringify(d));
  return d;
}
async function fetchSpecies(en){
  const k=`pb-species-${en}`;
  try{const c=localStorage.getItem(k);if(c)return JSON.parse(c);}catch{}
  const p=await fetchPokemon(en);
  const r=await fetch(p.species.url);
  const d=await r.json();
  localStorage.setItem(k,JSON.stringify(d));
  return d;
}
async function fetchMoveList(){
  const key="pb-move-list-2000";
  try{const c=localStorage.getItem(key);if(c)return JSON.parse(c);}catch{}
  const r=await fetch(`${API_BASE}/move?limit=2000`);
  const d=await r.json();
  localStorage.setItem(key,JSON.stringify(d.results));
  return d.results;
}
async function fetchMove(en){
  const k=`pb-move-${en}`;
  try{const c=localStorage.getItem(k);if(c)return JSON.parse(c);}catch{}
  const r=await fetch(`${API_BASE}/move/${en}`);
  const d=await r.json();
  localStorage.setItem(k,JSON.stringify(d));
  return d;
}
async function fetchAbility(en){
  const k=`pb-ability-${en}`;
  try{const c=localStorage.getItem(k);if(c)return JSON.parse(c);}catch{}
  const r=await fetch(`${API_BASE}/ability/${en}`);
  const d=await r.json();
  localStorage.setItem(k,JSON.stringify(d));
  return d;
}
async function fetchItem(nameOrUrl){
  let keyName;
  if(typeof nameOrUrl==="string" && !nameOrUrl.startsWith("http")){
    keyName=nameOrUrl;
  }else{
    const parts=String(nameOrUrl).split("/").filter(Boolean);
    keyName=parts[parts.length-1];
  }
  const k=`pb-item-${keyName}`;
  try{const c=localStorage.getItem(k);if(c)return JSON.parse(c);}catch{}
  const r=await fetch(typeof nameOrUrl==="string" && !nameOrUrl.startsWith("http") ? `${API_BASE}/item/${keyName}` : nameOrUrl);
  const d=await r.json();
  localStorage.setItem(k,JSON.stringify(d));
  return d;
}

// ---- 한글 리스트 로딩 ----
async function preloadKOLists(){
  try{
    Object.assign(cache,{
      koPokeList:JSON.parse(localStorage.getItem("koPokeList")||"[]"),
      koMoveList:JSON.parse(localStorage.getItem("koMoveList")||"[]"),
      ko2enPoke:JSON.parse(localStorage.getItem("ko2enPoke")||"{}"),
      en2koPoke:JSON.parse(localStorage.getItem("en2koPoke")||"{}"),
      ko2enMove:JSON.parse(localStorage.getItem("ko2enMove")||"{}"),
      en2koMove:JSON.parse(localStorage.getItem("en2koMove")||"{}"),
      baseStats:JSON.parse(localStorage.getItem("baseStats")||"{}"),
      abilityKo:JSON.parse(localStorage.getItem("abilityKo")||"{}"),
      abilityEn:JSON.parse(localStorage.getItem("abilityEn")||"{}"),
      heldItemList:JSON.parse(localStorage.getItem("heldItemList")||"[]"),
      itemKo2En:JSON.parse(localStorage.getItem("itemKo2En")||"{}"),
      itemEn2Ko:JSON.parse(localStorage.getItem("itemEn2Ko")||"{}")
    });
  }catch{}
  refreshDeckList();
  if(cache.heldItemList && cache.heldItemList.length){
    populateItemSelects();
  }
  buildKoPokeListBatched().catch(()=>{});
  buildKoMoveListBatched().catch(()=>{});
  buildHeldItemListBatched().catch(()=>{});
}

async function buildKoPokeListBatched(batch=150){
  const status=el("koFillStatus");
  const list=await fetchPokemonList();
  const total=list.length;
  for(let i=0;i<total;i++){
    const en=list[i].name;
    if(!cache.en2koPoke[en]){
      try{
        const sp=await fetchSpecies(en);
        const ko=(sp.names||[]).find(n=>n.language?.name==="ko")?.name;
        if(ko){
          cache.en2koPoke[en]=ko;
          cache.ko2enPoke[ko]=en;
          cache.koPokeList.push(ko);
        }
      }catch{}
    }else{
      const ko=cache.en2koPoke[en];
      if(ko && !cache.koPokeList.includes(ko)) cache.koPokeList.push(ko);
    }
    if(!cache.baseStats[en]){
      try{
        const p=await fetchPokemon(en);
        const s={};
        p.stats.forEach(st=>s[st.stat.name]=st.base_stat);
        cache.baseStats[en]={hp:s.hp,atk:s["attack"],def:s["defense"],spa:s["special-attack"],spd:s["special-defense"],spe:s["speed"]};
      }catch{}
    }
    if(i%batch===0){
      persist();
      if(status)status.textContent=`포켓몬 ${i+1}/${total} 로딩 중`;
      await new Promise(r=>setTimeout(r,0));
    }
  }
  persist();
  if(status)status.textContent=`포켓몬 ${total}/${total} 로딩 완료`;
}

async function buildKoMoveListBatched(batch=150){
  const status=el("koFillStatus");
  const list=await fetchMoveList();
  const total=list.length;
  for(let i=0;i<total;i++){
    const en=list[i].name;
    if(!cache.en2koMove[en]){
      try{
        const m=await fetchMove(en);
        const ko=(m.names||[]).find(n=>n.language?.name==="ko")?.name;
        if(ko){
          cache.en2koMove[en]=ko;
          cache.ko2enMove[ko]=en;
          cache.koMoveList.push(ko);
        }
      }catch{}
    }else{
      const ko=cache.en2koMove[en];
      if(ko && !cache.koMoveList.includes(ko)) cache.koMoveList.push(ko);
    }
    if(i%batch===0){
      persist();
      if(status)status.textContent=`기술 ${i+1}/${total} 로딩 중`;
      await new Promise(r=>setTimeout(r,0));
    }
  }
  persist();
  if(status)status.textContent=`기술 목록 로딩 완료`;
}

async function buildHeldItemListBatched(batch=60){
  // 이미 있으면 그대로 사용
  if(cache.heldItemList && cache.heldItemList.length){
    populateItemSelects();
    return;
  }
  const status=el("koFillStatus");
  const attrs=["holdable","holdable-active","holdable-passive"];
  const itemSet=new Set();
  for(const attr of attrs){
    try{
      const key=`pb-item-attr-${attr}`;
      let data;
      try{
        const c=localStorage.getItem(key);
        if(c)data=JSON.parse(c);
      }catch{}
      if(!data){
        const r=await fetch(`${API_BASE}/item-attribute/${attr}`);
        data=await r.json();
        localStorage.setItem(key,JSON.stringify(data));
      }
      (data.items||[]).forEach(it=>itemSet.add(it.name));
    }catch{}
  }
  const names=[...itemSet];
  const listKO=[];
  for(let i=0;i<names.length;i++){
    const en=names[i];
    try{
      const item=await fetchItem(en);
      const ko=(item.names||[]).find(n=>n.language?.name==="ko")?.name || en;
      cache.itemEn2Ko[en]=ko;
      cache.itemKo2En[ko]=en;
      listKO.push(ko);
    }catch{}
    if(i%batch===0){
      cache.heldItemList=listKO.slice();
      persist();
      if(status)status.textContent=`아이템 ${i+1}/${names.length} 로딩 중`;
      await new Promise(r=>setTimeout(r,0));
    }
  }
  cache.heldItemList=listKO.slice().sort((a,b)=>a.localeCompare(b,"ko-KR"));
  persist();
  if(status)status.textContent=`아이템 목록 로딩 완료`;
  populateItemSelects();
}

function populateItemSelects(){
  const list=cache.heldItemList||[];
  if(!list.length)return;
  const selects=[el("atkItem"),el("defItem")];
  selects.forEach(sel=>{
    if(!sel)return;
    const current=sel.value;
    sel.innerHTML="";
    const none=document.createElement("option");
    none.value="없음";
    none.textContent="없음";
    sel.appendChild(none);
    list.forEach(ko=>{
      const opt=document.createElement("option");
      opt.value=ko;
      opt.textContent=ko;
      sel.appendChild(opt);
    });
    if(current) sel.value=current;
  });
}

function itemKoToEn(ko){
  if(!ko || ko==="없음")return "";
  return cache.itemKo2En[ko] || "";
}

// ---- 추천 드롭다운 ----
function attachSuggest(inputId, getList, onPick){
  const input=el(inputId);
  const boxId=inputId==="moveName"?"moveSuggest":(inputId==="atkSearch"?"atkSuggest":"defSuggest");
  const box=el(boxId);
  function render(q){
    const src=getList();
    const v=(q||"").trim();
    if(!v){box.classList.remove("show");box.innerHTML="";return;}
    const key=strip(v);
    const arr=src.filter(x=>strip(x).startsWith(key)).slice(0,15);
    if(!arr.length){box.classList.remove("show");box.innerHTML="";return;}
    box.innerHTML=arr.map(x=>`<div data-v="${x}">${x}</div>`).join("");
    box.classList.add("show");
  }
  input.addEventListener("input",e=>render(e.target.value));
  input.addEventListener("focus",e=>render(e.target.value));
  input.addEventListener("blur",()=>setTimeout(()=>box.classList.remove("show"),150));
  box.addEventListener("click",e=>{
    const v=e.target.getAttribute("data-v");
    if(!v)return;
    input.value=v;
    box.classList.remove("show");
    onPick(v);
  });
}

// ---- 이름 해석 ----
async function resolvePokemonKO(q){
  if(cache.ko2enPoke[q])return{en:cache.ko2enPoke[q],ko:q};
  const list=await fetchPokemonList();
  for(const it of list){
    const sp=await fetchSpecies(it.name);
    const ko=(sp.names||[]).find(n=>n.language?.name==="ko")?.name;
    if(ko){
      cache.en2koPoke[it.name]=ko;
      cache.ko2enPoke[ko]=it.name;
      if(strip(ko)===strip(q))return{en:it.name,ko};
    }
  }
  throw new Error("포켓몬을 찾을 수 없음");
}
async function resolveMoveKO(q){
  if(cache.ko2enMove[q])return{en:cache.ko2enMove[q],ko:q};
  const list=await fetchMoveList();
  for(const it of list){
    const m=await fetchMove(it.name);
    const ko=(m.names||[]).find(n=>n.language?.name==="ko")?.name;
    if(ko){
      cache.en2koMove[it.name]=ko;
      cache.ko2enMove[ko]=it.name;
      if(strip(ko)===strip(q))return{en:it.name,ko};
    }
  }
  throw new Error("기술을 찾을 수 없음");
}

// ---- 스탯, 데미지 계산 ----
function calcHP(base,iv,ev,lvl){
  if(base<=1)return 1;
  return Math.floor(((2*base+iv+Math.floor(ev/4))*lvl)/100)+lvl+10;
}
function calcOther(base,iv,ev,lvl,nature=1.0){
  const v=Math.floor(((2*base+iv+Math.floor(ev/4))*lvl)/100)+5;
  return Math.floor(v*nature);
}
function typeMultiplier(moveTypeEN,defTypesEN){
  let m=1.0;
  for(const dt of defTypesEN){
    const row=TYPE_CHART[moveTypeEN]||{};
    m*=(row?.[dt]??1.0);
  }
  return m;
}
function stabMultiplier(moveTypeEN,atkTypesEN,modeKO){
  if(modeKO==="끄기")return 1.0;
  return atkTypesEN.includes(moveTypeEN)?1.5:1.0;
}
function burnMultiplier(categoryKO,isBurn,hasGuts){
  const cat=(categoryKO==="물리")?"Physical":"Special";
  if(cat==="Physical"&&isBurn&&!hasGuts)return 0.5;
  return 1.0;
}
function critMultiplier(isCrit){return isCrit?1.5:1.0;}
function weatherMultiplier(moveTypeEN,weatherKO){
  if(weatherKO==="쾌청"){
    if(moveTypeEN==="Fire")return 1.5;
    if(moveTypeEN==="Water")return 0.5;
  }
  if(weatherKO==="비"){
    if(moveTypeEN==="Water")return 1.5;
    if(moveTypeEN==="Fire")return 0.5;
  }
  return 1.0;
}
function screenMultiplier(){ return 1.0; } // 싱글 기준, 스크린은 옵션화 가능

function computeDamage({level,power,attack,defense,categoryKO,moveTypeEN,atkTypesEN,defTypesEN,opts}){
  const {
    isCrit,
    stabModeKO,
    isBurn,
    hasGuts,
    weatherKO="없음",
    isStatused=false,
    moveNameEN="",
    moveMod=1.0
  }=opts||{};
  let pow=power;
  // Facade(객기) 계열: 상태이상 시 위력 2배(간이)
  if(isStatused && /facade|객기/i.test(moveNameEN))pow=power*2;

  const base=Math.floor(Math.floor(((2*level)/5+2)*pow*(attack)/Math.max(1,defense))/50)+2;
  const burn=(/facade|객기/i.test(moveNameEN)&&isStatused)?1.0:burnMultiplier(categoryKO,isBurn,hasGuts);
  const stab=stabMultiplier(moveTypeEN,atkTypesEN,stabModeKO);
  const eff=typeMultiplier(moveTypeEN,defTypesEN);
  const crit=critMultiplier(isCrit);
  const wthr=weatherMultiplier(moveTypeEN,weatherKO);
  const screen=screenMultiplier();
  const mod=stab*eff*burn*crit*wthr*screen*moveMod;
  const damages=ROLLS.map(r=>Math.floor(Math.floor(base*mod)*r));
  return {damages,eff,crit:isCrit,weatherKO};
}
function koChances(dmg,hp){
  dmg=dmg.slice().sort((a,b)=>a-b);
  const min=dmg[0],max=dmg[dmg.length-1];
  const oh=dmg.filter(d=>d>=hp).length/16;
  let two=0;
  for(const d1 of dmg){for(const d2 of dmg){if(d1+d2>=hp)two++;}}
  two/=256;
  return {range:[min,max],oneHit:oh,twoHit:two};
}
function effectText(mult){
  if(mult===0)return "그러나 효과가 없는 것 같다……";
  if(mult>=2)return "효과가 굉장했다!";
  if(mult>1)return "효과는 좋은 편이다!";
  if(mult===1)return "";
  return "효과가 별로인 듯하다……";
}
function critText(isCrit){return isCrit?"급소에 맞았다!":"";}
function hpText(cur,max){return `HP ${cur}/${max}`;}

function friendshipLine(name,friend){
  if(friend<160) return null;
  if(Math.random()>0.18) return null; // 가끔만
  const sub = withParticle(name,"은","는");
  const lines=[
    `${sub} 쓰러지지 않으려고 악착같이 버티고 있다!`,
    `${sub} 당신을 실망시키고 싶지 않은 듯하다!`,
    `${sub} 칭찬받고 싶어서 필사적으로 공격했다!`,
    `${sub} 당신을 위해 온 힘을 쏟고 있다!`
  ];
  return lines[Math.floor(Math.random()*lines.length)];
}

// ---- 엔트리 수집 ----
function collectSide(p){
  const nameKO=el(p+"Name").value || (p==="atk"?"공격측":"수비측");
  const level=num(el(p+"Level").value||50);
  const typesEN=[toENType(el(p+"Type1").value),toENType(el(p+"Type2").value)].filter(Boolean);
  const curHP=num(el(p+"CurHP").value||1);
  const maxHP=num(el(p+"HP").value||1);
  const A=num(el(p+"A").value||1);
  const B=num(el(p+"B").value||1);
  const friend=num(el(p+"Friend").value||0);
  const itemKO = el(p+"Item") ? el(p+"Item").value : "없음";
  const itemEN = itemKoToEn(itemKO);
  const status = el(p+"Status") ? el(p+"Status").value || "없음" : "없음";
  return {nameKO,level,typesEN,stats:{curHP,maxHP,A,B},friend,itemKO,itemEN,status};
}

function logLineKR(ctx){
  const {atk,def,moveNameKO,range,eff,crit,weatherKO,atkStatus,atkItemEN,defStatus,defItemEN} = ctx;
  const lines=[];
  const subj = withParticle(atk.nameKO,"은","는");
  const obj  = withParticle(moveNameKO,"을","를");
  lines.push(`${subj} ${obj} 사용했다!`);

  // 날씨 보정 안내
  const moveTypeEN = ctx.moveTypeEN;
  const wMult = weatherMultiplier(moveTypeEN,weatherKO);
  if(weatherKO!=="없음" && wMult>1){
    if(weatherKO==="쾌청" && moveTypeEN==="Fire"){
      lines.push("쾌청한 날씨의 영향으로 불꽃 기술의 위력이 올라갔다!");
    }else if(weatherKO==="비" && moveTypeEN==="Water"){
      lines.push("비의 영향으로 물 타입 기술의 위력이 올라갔다!");
    }else{
      lines.push("날씨의 영향을 받아 위력이 올라갔다!");
    }
  }else if(weatherKO!=="없음" && wMult<1){
    lines.push("날씨 탓인지 기술의 위력이 줄어든 것 같다.");
  }

  // 상태/특성 관련 안내
  if(atkStatus==="화상" && ctx.categoryKO==="물리" && !ctx.hasGuts){
    lines.push(`${withParticle(atk.nameKO,"은","는")} 화상으로 인해 공격력이 떨어져 있다.`);
  }
  if(atkStatus!=="없음" && /facade|객기/i.test(ctx.moveNameEN)){
    lines.push("상태이상 덕분에 기술의 위력이 올라갔다!");
  }

  const e=effectText(eff);if(e)lines.push(e);
  const c=critText(crit);if(c)lines.push(c);

  const [minD,maxD]=range;
  const minPct=Math.round(minD/def.stats.maxHP*100);
  const maxPct=Math.round(maxD/def.stats.maxHP*100);
  lines.push(`${def.nameKO}에게 ${minD} ~ ${maxD}의 데미지!  (${minPct}% ~ ${maxPct}%)`);

  const remain=Math.max(0,def.stats.curHP-maxD);
  const p=Math.round(remain/def.stats.maxHP*100);
  lines.push(`남은 체력(최소): ${remain} / ${def.stats.maxHP} (${p}%)`);

  const fLine=friendshipLine(atk.nameKO,atk.friend);
  if(fLine)lines.push(fLine);

  return lines.join("\n");
}

function renderResult(ctx){
  const {atk,def,range,oneHit,twoHit,eff,crit}=ctx;
  const minPct=Math.round(range[0]/def.stats.maxHP*100);
  const maxPct=Math.round(range[1]/def.stats.maxHP*100);
  el("outRange").textContent = `${range[0]} ~ ${range[1]} (${minPct}% ~ ${maxPct}%)`;
  el("outOHKO").textContent = pct(oneHit);
  el("out2HKO").textContent = pct(twoHit);
  const msg=logLineKR(ctx);
  el("outLog").textContent = msg;
  const hist=el("hist");
  hist.textContent = (hist.textContent?(hist.textContent+"\n"):"")+msg;
}

function updateTypeBadge(moveTypeEN){
  const def=collectSide("def");
  if(!moveTypeEN || def.typesEN.length===0){el("effNow").textContent="-";return;}
  const eff=typeMultiplier(moveTypeEN,def.typesEN);
  el("effNow").textContent = eff===0?"무효 ×0":(eff>=2?`상성 유리 ×${eff}`:(eff<1?`상성 불리 ×${eff}`:`보통 ×1`));
}

// ---- onPick 핸들러 ----
async function onPickPokemon(side,koName){
  try{
    const {en,ko}=await resolvePokemonKO(koName);
    const p=await fetchPokemon(en);
    const types=p.types.map(t=>cap(t.type.name));
    el(side+"Name").value=ko;
    el(side+"Type1").value=TYPE_EN_TO_KO[types[0]]||types[0]||"";
    el(side+"Type2").value=TYPE_EN_TO_KO[types[1]]||"";

    const lvl=num(el(side+"Level").value||50);
    const bs=cache.baseStats[en]||{hp:1,atk:1,def:1};
    const hp=calcHP(
      bs.hp,
      31,
      num(side==="def"?el("defHPEV").value:el("atkAEV").value),
      lvl
    );
    el(side+"HP").value=hp;
    if(!el(side+"CurHP").value)el(side+"CurHP").value=hp;
    const A=calcOther(
      bs.atk,
      31,
      num(side==="atk"?el("atkAEV").value:0),
      lvl
    );
    const B=calcOther(
      bs.def,
      31,
      num(side==="def"?el("defBEV").value:0),
      lvl
    );
    el(side+"A").value=A;
    el(side+"B").value=B;

    // 특성 자동 채우기 (한국어 이름 우선)
    const abilityENs = (p.abilities||[]).map(a=>a.ability.name);
    const abilityNamesKO=[];
    for(const abEn of abilityENs){
      try{
        let koName = cache.abilityKo[abEn];
        if(!koName){
          const ab = await fetchAbility(abEn);
          koName = (ab.names||[]).find(n=>n.language?.name==="ko")?.name || abEn;
          cache.abilityKo[abEn]=koName;
          cache.abilityEn[koName]=abEn;
        }
        abilityNamesKO.push(koName);
      }catch{
        abilityNamesKO.push(abEn);
      }
    }
    if(el(side+"Ability")) el(side+"Ability").value = abilityNamesKO.join(" / ");
    persist();
  }catch{}
}

async function onPickMove(koName){
  try{
    const {en,ko}=await resolveMoveKO(koName);
    const m=await fetchMove(en);
    el("moveName").value=ko;
    const typeEN=cap(m.type.name);
    el("moveType").value = TYPE_EN_TO_KO[typeEN]||typeEN;
    el("moveCat").value = m.damage_class.name==="physical"?"물리":(m.damage_class.name==="special"?"특수":"물리");
    el("movePower").value = m.power||0;
    updateTypeBadge(typeEN);
  }catch{}
}

// ---- 덱 저장/목록 ----
function captureState(){
  const ids=[
    "atkSearch","atkLevel","atkName","atkType1","atkType2","atkCurHP","atkHP","atkFriend","atkA","atkB","atkAbility","atkAEV","atkBEV","atkItem","atkStatus",
    "atkGuts","atkStab","atkMod",
    "defSearch","defLevel","defName","defType1","defType2","defCurHP","defHP","defFriend","defB","defA","defAbility",
    "defBEV","defHPEV","defItem","defStatus",
    "weather",
    "moveName","moveType","moveCat","movePower","isCrit","moveMod"
  ];
  const o={};
  ids.forEach(id=>o[id]=el(id)?.value??"");
  return o;
}
function restoreState(o){
  Object.keys(o||{}).forEach(id=>{
    if(el(id))el(id).value=o[id];
  });
  updateTypeBadge(toENType(el("moveType").value||""));
}
function refreshDeckList(){
  const sel=el("deckList");
  if(!sel)return;
  const keys=Object.keys(localStorage).filter(k=>k.startsWith("deck-")).sort();
  sel.innerHTML='<option value="">저장된 덱 목록</option>';
  keys.forEach(k=>{
    const opt=document.createElement("option");
    opt.value=k;
    opt.textContent=k.slice(5);
    sel.appendChild(opt);
  });
}
function saveDeck(){
  const name=(el("slotName").value||"default").trim();
  const key="deck-"+(name||"default");
  localStorage.setItem(key,JSON.stringify(captureState()));
  refreshDeckList();
  alert("저장됨: "+name);
}
function loadDeckByKey(key){
  const st=JSON.parse(localStorage.getItem(key)||"{}");
  if(!Object.keys(st).length){alert("불러올 데이터 없음");return;}
  restoreState(st);
}
function loadSelectedDeck(){
  const sel=el("deckList").value;
  if(!sel){alert("덱을 선택하세요.");return;}
  loadDeckByKey(sel);
}
function loadDeckToSide(side){
  const key=el("deckList").value;
  if(!key){alert("덱을 선택하세요.");return;}
  const st=JSON.parse(localStorage.getItem(key)||"{}");
  const prefix=side==="atk"?"atk":"def";
  Object.entries(st).forEach(([id,val])=>{
    if(id.startsWith(prefix) && el(id)) el(id).value=val;
  });
}
function deleteDeck(){
  const key=el("deckList").value;
  if(!key){alert("삭제할 덱을 선택하세요.");return;}
  const name=key.slice(5);
  if(!confirm(`덱 '${name}'을(를) 삭제할까요?`))return;
  localStorage.removeItem(key);
  refreshDeckList();
}

// ---- 메인 계산 ----
let lastRoll=null;
function computeCore(){
  const atk=collectSide("atk");
  const def=collectSide("def");
  const moveNameKO=el("moveName").value||"기술";
  const moveTypeEN=toENType(el("moveType").value||"Normal");
  const power=num(el("movePower").value||1);
  const categoryKO=el("moveCat").value||"물리";
  const isCrit=el("isCrit").value==="예";
  const stabModeKO=el("atkStab").value||"자동";
  const atkStatus=atk.status;
  const defStatus=def.status;
  const hasGuts=el("atkGuts").value==="예";
  const weatherKO=el("weather").value||"없음";
  const moveModInput=num(el("moveMod").value||1.0);

  // 기본 공격/방어값
  let attack=(categoryKO==="물리")?atk.stats.A:atk.stats.A;
  let defense=(categoryKO==="물리")?def.stats.B:def.stats.B;

  // 공격측 아이템 보정
  const atkItemEN = atk.itemEN;
  if(atkItemEN==="life-orb"){
    // 생명의구슬: 위력 1.3배, 반동은 피해 적용 시 처리
    attack=Math.floor(attack*1.3);
  }
  if(atkItemEN==="choice-band" && categoryKO==="물리"){
    attack=Math.floor(attack*1.5);
  }
  if(atkItemEN==="choice-specs" && categoryKO==="특수"){
    attack=Math.floor(attack*1.5);
  }
  // 수비측 아이템 보정
  const defItemEN = def.itemEN;
  if(defItemEN==="assault-vest" && categoryKO==="특수"){
    defense=Math.floor(defense*1.5);
  }
  if(defItemEN==="eviolite"){
    defense=Math.floor(defense*1.5);
  }

  const moveNameEN = el("moveName").value;
  const isBurn = atkStatus==="화상";
  const isStatused = ["독","맹독","화상","마비"].includes(atkStatus);
  const moveMod = moveModInput;

  const {damages,eff,crit,weatherKO:weatherOut}=computeDamage({
    level:atk.level,
    power,
    attack,
    defense,
    categoryKO,
    moveTypeEN,
    atkTypesEN:atk.typesEN,
    defTypesEN:def.typesEN,
    opts:{
      isCrit,
      stabModeKO,
      isBurn,
      hasGuts,
      weatherKO,
      isStatused,
      moveNameEN,
      moveMod
    }
  });
  const {range,oneHit,twoHit}=koChances(damages,def.stats.curHP);
  return {
    atk,def,moveNameKO,
    range,oneHit,twoHit,eff,crit,damages,
    weatherKO,
    atkStatus,
    defStatus,
    atkItemEN,
    defItemEN,
    moveTypeEN,
    moveNameEN,
    categoryKO,
    hasGuts
  };
}

// ---- 턴 처리 보조 ----
function processItemHeal(side, sideInfo){
  const name=sideInfo?.nameKO || el(side+"Name").value || (side==="atk"?"공격측":"수비측");
  let cur=num(el(side+"CurHP").value||0);
  const max=num(el(side+"HP").value||1);
  const itemKO=sideInfo?.itemKO || (el(side+"Item")?.value || "없음");
  const itemEN=itemKoToEn(itemKO);
  const logs=[];
  if(cur<=0) return {cur,logs};

  if(itemEN==="leftovers" && cur<max){
    const heal=Math.floor(max/16);
    if(heal>0){
      cur=Math.min(max,cur+heal);
      logs.push(`${withParticle(name,"은","는")} 먹다 남은 음식의 효과로 HP가 조금 회복되었다!`);
    }
  }
  if(itemEN==="sitrus-berry" && !itemUsed[side] && cur<=Math.floor(max/2)){
    const heal=Math.floor(max/4);
    cur=Math.min(max,cur+heal);
    itemUsed[side]=true;
    logs.push(`${withParticle(name,"은","는")} 시트러스열매를 먹고 HP가 회복되었다!`);
  }
  if(itemEN==="black-sludge"){
    const isPoison = (sideInfo?.typesEN||[]).some(t=>t==="Poison");
    if(isPoison){
      const heal=Math.floor(max/16);
      cur=Math.min(max,cur+heal);
      logs.push(`${withParticle(name,"은","는")} 검은 진흙의 효과로 HP가 조금 회복되었다!`);
    }else{
      const dmg=Math.floor(max/8);
      cur=Math.max(0,cur-dmg);
      logs.push(`${withParticle(name,"은","는")} 검은 진흙의 독으로 ${dmg}의 데미지를 입었다!`);
    }
  }

  el(side+"CurHP").value=cur;
  return {cur,logs};
}

// ---- 초기화 ----
function setup(){
  preloadKOLists();
  attachSuggest("atkSearch",()=>cache.koPokeList, v=>onPickPokemon("atk",v));
  attachSuggest("defSearch",()=>cache.koPokeList, v=>onPickPokemon("def",v));
  attachSuggest("moveName",()=>cache.koMoveList, v=>onPickMove(v));

  el("btnSwap").addEventListener("click",()=>{
    const ids=["Name","Level","Type1","Type2","CurHP","HP","Friend","A","B","Ability","AEV","BEV","Item","Status"];
    for(const id of ids){
      const a=el("atk"+id), d=el("def"+id);
      const t=a.value; a.value=d.value; d.value=t;
    }
    const tmpStage=toxicStage.atk;
    toxicStage.atk=toxicStage.def;
    toxicStage.def=tmpStage;
    itemUsed.atk=false; itemUsed.def=false;
    updateTypeBadge(toENType(el("moveType").value||""));
  });

  el("swapAtk").addEventListener("click",()=>{
    const hist=el("hist");
    hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+`${withParticle(el("atkName").value||"공격측","은","는")} 포켓몬을 교체했다.`;
    toxicStage.atk=0;
  });
  el("swapDef").addEventListener("click",()=>{
    const hist=el("hist");
    hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+`${withParticle(el("defName").value||"수비측","은","는")} 포켓몬을 교체했다.`;
    toxicStage.def=0;
  });

  el("btnSave").addEventListener("click",saveDeck);
  el("btnLoadSel").addEventListener("click",loadSelectedDeck);
  el("btnLoadAtk").addEventListener("click",()=>loadDeckToSide("atk"));
  el("btnLoadDef").addEventListener("click",()=>loadDeckToSide("def"));
  el("btnDelDeck").addEventListener("click",deleteDeck);

  el("btnCalc").addEventListener("click",()=>{
    const ctx=computeCore();
    renderResult(ctx);
    updateTypeBadge(ctx.moveTypeEN);
  });

  el("btnRoll").addEventListener("click",()=>{
    const ctx=computeCore();
    const dmg=ctx.damages[Math.floor(Math.random()*16)];
    lastRoll=dmg;
    const defCur=num(el("defCurHP").value||ctx.def.stats.curHP);
    const remain=Math.max(0,defCur-dmg);
    const subj=withParticle(ctx.atk.nameKO,"은","는");
    const obj=withParticle(ctx.moveNameKO,"을","를");
    const lines=[
      `${subj} ${obj} 사용했다!`,
      `${ctx.def.nameKO}에게 ${dmg}의 데미지! [HP ${defCur}/${ctx.def.stats.maxHP} → ${remain}/${ctx.def.stats.maxHP}]`
    ];
    const effLine=effectText(ctx.eff); if(effLine)lines.push(effLine);
    const critLine=critText(ctx.crit); if(critLine)lines.push(critLine);
    const fLine=friendshipLine(ctx.atk.nameKO,ctx.atk.friend);
    if(fLine)lines.push(fLine);
    const text=lines.join("\n");
    el("outLog").textContent=text;
    const hist=el("hist");
    hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+text;
  });

  el("btnApply").addEventListener("click",()=>{
    if(lastRoll==null){alert("먼저 '랜덤 롤 1회'를 실행하세요.");return;}
    const defCur=num(el("defCurHP").value||0);
    const defMax=num(el("defHP").value||1);
    const defName=el("defName").value||"수비측";
    const defItemEN=itemKoToEn(el("defItem").value||"");
    let newHP;

    // 기합의띠 처리: 풀피에서 맞으면 1HP로 버팀
    if(defItemEN==="focus-sash" && defCur===defMax && lastRoll>=defCur){
      newHP=1;
      const line=`${withParticle(defName,"은","는")} 기합의띠의 힘으로 간신히 버텼다!`;
      const hist=el("hist");
      hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+line;
    }else{
      newHP=Math.max(0,defCur-lastRoll);
    }

    el("defCurHP").value=newHP;

    // 생명의구슬 반동 (공격측)
    const atkItemEN=itemKoToEn(el("atkItem").value||"");
    if(atkItemEN==="life-orb"){
      const atkName=el("atkName").value||"공격측";
      const atkCur=num(el("atkCurHP").value||0);
      const atkMax=num(el("atkHP").value||1);
      const recoil=Math.max(1,Math.floor(atkMax/10));
      const after=Math.max(0,atkCur-recoil);
      el("atkCurHP").value=after;
      const hist=el("hist");
      const line=`${withParticle(atkName,"은","는")} 생명의구슬의 반동으로 ${recoil}의 데미지를 입었다!`;
      hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+line;
      if(atkCur>0 && after===0){
        const faint=`${withParticle(atkName,"은","는")} 쓰러졌다!`;
        hist.textContent+="\n"+faint;
      }
    }

    // 쓰러짐 판정
    if(defCur>0 && newHP===0){
      const hist=el("hist");
      const line=`${withParticle(defName,"은","는")} 쓰러졌다!`;
      hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+line;
    }

    lastRoll=null;
  });

  el("btnClear").addEventListener("click",()=>{el("hist").textContent="";});

  // 턴 종료 처리: 상태이상/날씨/아이템 회복/피해
  el("btnTurn").addEventListener("click",()=>{
    const atkSide=collectSide("atk");
    const defSide=collectSide("def");
    const weather=el("weather").value||"없음";

    const prevAtk=num(el("atkCurHP").value||0);
    const prevDef=num(el("defCurHP").value||0);
    const logs=[];

    // 상태이상 데미지 (양측)
    ["atk","def"].forEach(side=>{
      const info = side==="atk"?atkSide:defSide;
      let cur=num(el(side+"CurHP").value||0);
      const max=num(el(side+"HP").value||1);
      const st=info.status||"없음";
      if(cur>0){
        if(st==="독"){
          const d=Math.floor(max/8);
          cur=Math.max(0,cur-d);
          logs.push(`${withParticle(info.nameKO,"은","는")} 독의 데미지를 입었다!`);
        }
        if(st==="화상"){
          const d=Math.floor(max/16);
          cur=Math.max(0,cur-d);
          logs.push(`${withParticle(info.nameKO,"은","는")} 화상의 데미지를 입었다!`);
        }
        if(st==="맹독"){
          const key = side==="atk"?"atk":"def";
          if(toxicStage[key]<=0) toxicStage[key]=1;
          const d=Math.floor(max*Math.max(1,toxicStage[key])/16);
          cur=Math.max(0,cur-d);
          logs.push(`${withParticle(info.nameKO,"은","는")} 맹독의 데미지를 입었다!`);
          toxicStage[key]=Math.min(toxicStage[key]+1,15);
        }
      }
      el(side+"CurHP").value=cur;
    });

    // 날씨 잔류 데미지
    if(weather==="모래바람"){
      [ ["atk",atkSide],["def",defSide] ].forEach(([side,info])=>{
        let cur=num(el(side+"CurHP").value||0);
        const maxHP=num(el(side+"HP").value||1);
        if(cur<=0)return;
        const safeTypes=["Rock","Ground","Steel"];
        const immune = (info.typesEN||[]).some(t=>safeTypes.includes(t));
        if(!immune){
          const d=Math.floor(maxHP/16);
          cur=Math.max(0,cur-d);
          el(side+"CurHP").value=cur;
          logs.push(`${withParticle(info.nameKO,"은","는")} 모래바람으로 ${d}의 데미지를 입었다!`);
        }
      });
    }
    if(weather==="싸라기눈"){
      [ ["atk",atkSide],["def",defSide] ].forEach(([side,info])=>{
        let cur=num(el(side+"CurHP").value||0);
        const maxHP=num(el(side+"HP").value||1);
        if(cur<=0)return;
        const immune = (info.typesEN||[]).includes("Ice");
        if(!immune){
          const d=Math.floor(maxHP/16);
          cur=Math.max(0,cur-d);
          el(side+"CurHP").value=cur;
          logs.push(`${withParticle(info.nameKO,"은","는")} 싸라기눈으로 ${d}의 데미지를 입었다!`);
        }
      });
    }

    // 아이템 회복/데미지
    const atkHeal=processItemHeal("atk",atkSide);
    const defHeal=processItemHeal("def",defSide);
    logs.push(...atkHeal.logs,...defHeal.logs);

    const atkNow=num(el("atkCurHP").value||0);
    const defNow=num(el("defCurHP").value||0);
    const atkName=el("atkName").value||"공격측";
    const defName=el("defName").value||"수비측";
    if(prevAtk>0 && atkNow===0){
      logs.push(`${withParticle(atkName,"은","는")} 쓰러졌다!`);
    }
    if(prevDef>0 && defNow===0){
      logs.push(`${withParticle(defName,"은","는")} 쓰러졌다!`);
    }

    const hist=el("hist");
    const baseLine=`턴 종료 처리 → [공격 HP ${atkNow}/${el("atkHP").value||1}, 수비 HP ${defNow}/${el("defHP").value||1}]`;
    const text=[baseLine,...logs].join("\n");
    hist.textContent=(hist.textContent?(hist.textContent+"\n"):"")+text;
  });
}

window.addEventListener("DOMContentLoaded",setup);
