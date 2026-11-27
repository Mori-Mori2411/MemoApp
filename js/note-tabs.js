/* メモ内タブ: 1つのメモの中を「ルーク」「ジェイミー」のようにタブで分ける */
// タブがあるメモは n.tabs=[{id,name,blocks}]、ないメモは今までどおり n.blocks を使う
// どのタブを開いているかは端末ごとに覚える（クラウドには送らない）
const TABKEY='hansei-note-open-tabs';
let openTabs={};try{openTabs=JSON.parse(localStorage.getItem(TABKEY))||{}}catch(e){}
const hasTabs=n=>Array.isArray(n.tabs)&&n.tabs.length>0;
const newToggle=()=>({id:uid(),type:'toggle',title:'',body:'',open:true});
function activeTab(n){return hasTabs(n)?(n.tabs.find(t=>t.id===openTabs[n.id])||n.tabs[0]):null}
function setActiveTab(n,id){openTabs[n.id]=id;try{localStorage.setItem(TABKEY,JSON.stringify(openTabs))}catch(e){}}
// いま画面に出している項目の配列（タブありなら開いているタブの中身）
function curBlocks(n){
  const t=activeTab(n);
  if(t){if(!Array.isArray(t.blocks))t.blocks=[];return t.blocks}
  if(!Array.isArray(n.blocks))n.blocks=[];return n.blocks;
}
// 検索用: メモ内のすべての項目を、どのタブのものかと一緒に返す
function allBlocks(n){
  const out=(n.blocks||[]).map(b=>({b,tab:null}));
  if(hasTabs(n))n.tabs.forEach(t=>(t.blocks||[]).forEach(b=>out.push({b,tab:t})));
  return out;
}
const isFilled=b=>!!((b.title||'').trim()||(b.body||'').trim());

/* ---------- タブバーの表示 ---------- */
function renderTabbar(n){
  if(!hasTabs(n))return h('div',{class:'tabbar none'},h('button',{class:'tab-add-first',onclick:()=>addTabModal(n)},svg('tabs'),'タブで分ける（キャラ別など）'));
  const cur=activeTab(n);
  const bar=h('div',{class:'tabbar',role:'tablist'});
  for(const t of n.tabs){
    const on=t===cur;
    const hit=ui.hits.size>0&&(t.blocks||[]).some(b=>ui.hits.has(b.id));
    const tab=h('div',{class:'tab'+(on?' on':'')+(hit?' hit':'')});
    tab.append(h('button',{class:'tab-name',role:'tab','aria-selected':on?'true':'false',title:on?'クリックで名前を変更':t.name,
      onclick:()=>{if(on)startRename(n,t,tab);else{setActiveTab(n,t.id);renderEditor()}}},t.name||'無題のタブ'));
    if(on)tab.append(
      n.tabs.length>1?iconBtn('left','左へ移動',()=>moveTab(n,t,-1),'tab-ic'):null,
      n.tabs.length>1?iconBtn('right','右へ移動',()=>moveTab(n,t,1),'tab-ic'):null,
      iconBtn('x','このタブを削除',()=>deleteTab(n,t),'tab-ic'));
    bar.append(tab);
  }
  bar.append(iconBtn('plus','タブを追加',()=>addTabModal(n),'tab-plus'));
  requestAnimationFrame(()=>{const a=bar.querySelector('.tab.on');if(a)bar.scrollLeft=Math.max(0,a.offsetLeft-bar.clientWidth/2+a.offsetWidth/2)});
  return bar;
}
function startRename(n,t,tab){
  const inp=h('input',{class:'tab-input',value:t.name||'','aria-label':'タブの名前'});
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.isComposing){e.preventDefault();inp.blur()}
    if(e.key==='Escape'){inp.value=t.name||'';inp.blur()}
  });
  inp.addEventListener('blur',()=>{const v=inp.value.trim();if(v&&v!==t.name){t.name=v;touch(n)}renderEditor()});
  tab.replaceChildren(inp);inp.focus();inp.select();
}
function moveTab(n,t,d){
  const i=n.tabs.indexOf(t),j=i+d;if(j<0||j>=n.tabs.length)return;
  [n.tabs[i],n.tabs[j]]=[n.tabs[j],n.tabs[i]];touch(n);renderEditor();
}

/* ---------- タブの追加・削除 ---------- */
function addTabModal(n){
  const first=!hasTabs(n);
  const keep=first&&(n.blocks||[]).some(isFilled); // 最初のタブ化で、今ある項目を残すか
  const name=h('input',{class:'inp',placeholder:'例：ルーク'});
  const old=keep?h('input',{class:'inp',value:'共通'}):null;
  const create=()=>{
    const v=name.value.trim();if(!v){name.focus();return}
    if(first){
      n.tabs=[];
      if(keep)n.tabs.push({id:uid(),name:old.value.trim()||'共通',blocks:n.blocks});
      n.blocks=[];
    }
    const t={id:uid(),name:v,blocks:[newToggle()]};
    n.tabs.push(t);setActiveTab(n,t.id);
    touch(n);closeModal();renderEditor();renderSide();
    document.querySelector('.ttitle')?.focus();
  };
  name.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();create()}});
  modal(h('h2',{},first?'タブで分ける':'タブを追加'),
    first?h('p',{class:'mnote'},'1つのメモの中を「ルーク」「ジェイミー」のようにタブで分けられます。タブごとに別々の項目を書けます。'):null,
    h('label',{class:'field'},h('span',{},'新しいタブの名前'),name),
    old?h('label',{class:'field'},h('span',{},'今ある項目を入れるタブの名前'),old):null,
    h('div',{class:'acts'},h('button',{class:'ghost',onclick:closeModal},'キャンセル'),h('button',{class:'primary',onclick:create},'追加')));
  name.focus();
}
function deleteTab(n,t){
  const del=()=>{
    const i=n.tabs.indexOf(t);n.tabs.splice(i,1);
    if(!n.tabs.length){delete n.tabs;n.blocks=[newToggle()]} // 最後のタブを消したら通常のメモに戻す
    else setActiveTab(n,n.tabs[Math.max(0,i-1)].id);
    touch(n);renderEditor();renderSide();
  };
  (t.blocks||[]).some(isFilled)?confirmBox(`タブ「${t.name||'無題のタブ'}」と、その中の項目をすべて削除しますか？`,'削除',del):del();
}
