/* 新規メモ作成ダイアログ */
function newNoteModal(){
  const sel=new Set(ui.tag?[ui.tag]:[]);
  const title=h('input',{class:'inp',placeholder:'例：SF6'});
  const tabsIn=h('input',{class:'inp',placeholder:'例：ルーク、ジェイミー（空欄ならタブなし）'});
  const pick=h('div',{class:'pick'});
  const drawPick=()=>{pick.replaceChildren(...state.tags.map(t=>h('button',{type:'button',class:'chip'+(sel.has(t.id)?' on':''),onclick:()=>{sel.has(t.id)?sel.delete(t.id):sel.add(t.id);drawPick()}},h('span',{class:'dot',style:'background:'+t.color}),t.name)));if(!state.tags.length)pick.append(h('span',{style:'font-size:13px;color:var(--muted)'},'まだタグがありません'))};
  drawPick();
  const tagIn=h('input',{class:'inp',placeholder:'新しいタグ（例：ゲーム、仕事）'});
  const addTag=()=>{const t=newTag(tagIn.value);if(t){sel.add(t.id);tagIn.value='';save();drawPick();renderTagbar()}};
  tagIn.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();addTag()}});
  const create=()=>{
    const now=Date.now();
    const n={id:uid(),title:title.value.trim(),tags:[...sel],pinned:false,createdAt:now,updatedAt:now,blocks:[newToggle()]};
    // タブ名は「、」「,」区切りで複数作れる
    const names=tabsIn.value.split(/[、,，]/).map(x=>x.trim()).filter(Boolean);
    if(names.length){n.tabs=names.map(name=>({id:uid(),name,blocks:[newToggle()]}));n.blocks=[]}
    state.notes.push(n);save();closeModal();ui.q='';$('q').value='';openNote(n.id);renderSide();
    document.querySelector('.ttitle')?.focus();
  };
  title.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();create()}});
  modal(h('h2',{},'新規メモ'),
    h('label',{class:'field'},h('span',{},'タイトル'),title),
    h('div',{class:'field'},h('span',{},'タグ（複数選択できます）'),pick),
    h('div',{class:'row'},tagIn,h('button',{class:'ghost',onclick:addTag},'追加')),
    h('label',{class:'field',style:'margin-top:14px'},h('span',{},'タブ（任意・キャラ名など。「、」で区切ると複数作れます）'),tabsIn),
    h('div',{class:'acts'},h('button',{class:'ghost',onclick:closeModal},'キャンセル'),h('button',{class:'primary',onclick:create},'作成')));
  title.focus();
}
