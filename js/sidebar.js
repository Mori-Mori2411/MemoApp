/* サイドバー: タグ絞り込みとメモ一覧の描画・開閉 */
function renderTagbar(){
  const bar=$('tagbar');bar.replaceChildren();
  if(!state.tags.length)return;
  bar.append(h('button',{class:'chip'+(ui.tag?'':' on'),onclick:()=>{ui.tag=null;renderSide()}},'すべて'));
  for(const t of state.tags){
    const cnt=state.notes.filter(n=>n.tags.includes(t.id)).length;
    bar.append(h('button',{class:'chip'+(ui.tag===t.id?' on':''),onclick:()=>{ui.tag=ui.tag===t.id?null:t.id;renderSide()}},h('span',{class:'dot',style:'background:'+t.color}),t.name,h('span',{style:'opacity:.6'},cnt)));
  }
}
function renderList(){
  const list=$('list'),ts=terms();list.replaceChildren();
  const rows=state.notes.filter(n=>!ui.tag||n.tags.includes(ui.tag)).map(n=>({n,m:match(n,ts)})).filter(r=>r.m.ok)
    .sort((a,b)=>(b.n.pinned-a.n.pinned)||(b.n.updatedAt-a.n.updatedAt));
  if(!rows.length){list.append(h('div',{class:'empty-list'},ts.length||ui.tag?'条件に合うメモはありません':'まだメモがありません。「新規メモ」から作成できます。'));return}
  let sec=null;
  for(const {n,m} of rows){
    const s=n.pinned?'ピン留め':(ts.length?'検索結果':'メモ');
    if(s!==sec){sec=s;list.append(h('div',{class:'sec'},s))}
    const tags=n.tags.map(tagById).filter(Boolean);
    list.append(h('button',{class:'item'+(n.id===ui.cur?' cur':''),onclick:()=>openNote(n.id,m.hits)},
      h('span',{class:'t'},marked(n.title||'無題のメモ',ts)),
      h('span',{class:'m'},tags.map(t=>[h('span',{class:'dot',style:'background:'+t.color}),t.name]),h('span',{style:'margin-left:auto'},fmt(n.updatedAt))),
      m.snip&&(m.snip.label||m.snip.text)?h('span',{class:'s'},m.snip.label?'▸ '+m.snip.label+(m.snip.text?'：':''):'',marked(m.snip.text,ts)):null
    ));
  }
}
function renderSide(){renderTagbar();renderList()}
let sideT=null;const renderSideSoon=()=>{clearTimeout(sideT);sideT=setTimeout(renderList,250)};

function setSide(open){$('app').classList.toggle('side-closed',!open)}
