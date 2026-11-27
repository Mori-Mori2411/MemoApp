/* 新規メモ作成ダイアログ */
function newNoteModal(){
  const sel=new Set(ui.tag?[ui.tag]:[]);
  const title=h('input',{class:'inp',placeholder:'例：SF6 ルーク'});
  const pick=h('div',{class:'pick'});
  const drawPick=()=>{pick.replaceChildren(...state.tags.map(t=>h('button',{type:'button',class:'chip'+(sel.has(t.id)?' on':''),onclick:()=>{sel.has(t.id)?sel.delete(t.id):sel.add(t.id);drawPick()}},h('span',{class:'dot',style:'background:'+t.color}),t.name)));if(!state.tags.length)pick.append(h('span',{style:'font-size:13px;color:var(--muted)'},'まだタグがありません'))};
  drawPick();
  const tagIn=h('input',{class:'inp',placeholder:'新しいタグ（例：ゲーム、仕事）'});
  const addTag=()=>{const t=newTag(tagIn.value);if(t){sel.add(t.id);tagIn.value='';save();drawPick();renderTagbar()}};
  tagIn.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();addTag()}});
  const create=()=>{
    const now=Date.now();
    const n={id:uid(),title:title.value.trim(),tags:[...sel],pinned:false,createdAt:now,updatedAt:now,blocks:[{id:uid(),type:'toggle',title:'',body:'',open:true}]};
    state.notes.push(n);save();closeModal();ui.q='';$('q').value='';openNote(n.id);renderSide();
    document.querySelector('.ttitle')?.focus();
  };
  title.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();create()}});
  modal(h('h2',{},'新規メモ'),
    h('label',{class:'field'},h('span',{},'タイトル'),title),
    h('div',{class:'field'},h('span',{},'タグ（複数選択できます）'),pick),
    h('div',{class:'row'},tagIn,h('button',{class:'ghost',onclick:addTag},'追加')),
    h('div',{class:'acts'},h('button',{class:'ghost',onclick:closeModal},'キャンセル'),h('button',{class:'primary',onclick:create},'作成')));
  title.focus();
}
