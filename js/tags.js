/* タグ: 作成・付け外しポップアップ・タグ管理 */
function newTag(name){
  name=name.trim();if(!name)return null;
  const ex=state.tags.find(t=>t.name===name);if(ex)return ex;
  const t={id:uid(),name,color:COLORS[state.tags.length%COLORS.length]};state.tags.push(t);return t;
}
let pop=null;
function closePop(){pop?.remove();pop=null}
function tagPop(anchor,n){
  closePop();
  pop=h('div',{class:'pop'});
  const draw=()=>{
    pop.replaceChildren();
    for(const t of state.tags){
      const on=n.tags.includes(t.id);
      pop.append(h('button',{class:'opt',onclick:()=>{n.tags=on?n.tags.filter(x=>x!==t.id):[...n.tags,t.id];touch(n);draw();renderEditorKeepPop(anchor,n)}},h('span',{class:'dot',style:`width:9px;height:9px;border-radius:50%;background:${t.color}`}),t.name,on?h('span',{class:'ck'},svg('check')):null));
    }
    const inp=h('input',{class:'inp',placeholder:'新しいタグ名を入力して Enter'});
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){const t=newTag(inp.value);if(t&&!n.tags.includes(t.id))n.tags.push(t.id);touch(n);renderEditorKeepPop(anchor,n,true)}});
    pop.append(inp);
    return inp;
  };
  const inp=draw();
  document.body.append(pop);
  const r=anchor.getBoundingClientRect();
  pop.style.left=Math.max(8,Math.min(r.left,innerWidth-258))+'px';
  pop.style.top=Math.min(r.bottom+6,innerHeight-pop.offsetHeight-8)+'px';
  if(!state.tags.length)inp.focus();
}
function renderEditorKeepPop(_a,n,focus){
  renderEditor();renderSide();
  const a=document.querySelector('.addtag');if(a){tagPop(a,n);if(focus)pop.querySelector('input')?.focus()}
}
document.addEventListener('mousedown',e=>{if(pop&&!pop.contains(e.target)&&!e.target.closest('.addtag'))closePop()});


function tagManager(){
  const box=h('div',{});
  const draw=()=>{
    box.replaceChildren();
    if(!state.tags.length)box.append(h('p',{style:'color:var(--muted);font-size:14px'},'タグはまだありません。メモ作成時に追加できます。'));
    for(const t of state.tags){
      const inp=h('input',{class:'inp',value:t.name});
      inp.addEventListener('change',()=>{const v=inp.value.trim();if(v){t.name=v;save();renderSide();renderEditor()}else inp.value=t.name});
      box.append(h('div',{class:'tagrow'},
        h('button',{class:'swatch',title:'色を変える','aria-label':'色を変える',style:'background:'+t.color,onclick:()=>{t.color=COLORS[(COLORS.indexOf(t.color)+1)%COLORS.length];save();draw();renderSide();renderEditor()}}),
        inp,
        iconBtn('trash','タグを削除',()=>{const c=state.notes.filter(n=>n.tags.includes(t.id)).length;const del=()=>{state.tags=state.tags.filter(x=>x!==t);state.notes.forEach(n=>n.tags=n.tags.filter(x=>x!==t.id));if(ui.tag===t.id)ui.tag=null;save();renderSide();renderEditor();tagManager()};c?confirmBox(`タグ「${t.name}」を削除しますか？（${c}件のメモから外れます。メモ自体は残ります）`,'削除',del):del()})));
    }
  };
  draw();
  const tagIn=h('input',{class:'inp',placeholder:'新しいタグ名'});
  const add=()=>{if(newTag(tagIn.value)){tagIn.value='';save();draw();renderSide()}};
  tagIn.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing)add()});
  modal(h('h2',{},'タグ管理'),h('p',{style:'margin:-6px 0 14px;font-size:12.5px;color:var(--muted)'},'丸をクリックすると色が変わります。'),box,h('div',{class:'row',style:'margin-top:6px'},tagIn,h('button',{class:'ghost',onclick:add},'追加')),h('div',{class:'acts'},h('button',{class:'primary',onclick:closeModal},'閉じる')));
}
