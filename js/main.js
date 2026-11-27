/* 起動: ボタンやキー操作の登録と初期表示 */
$('closeSide').onclick=()=>setSide(false);
$('scrim').onclick=()=>setSide(false);
$('newBtn').onclick=newNoteModal;
$('tagMgr').onclick=tagManager;
$('backup').onclick=backupModal;
$('q').addEventListener('input',e=>{ui.q=e.target.value;renderList();
  const n=curNote();if(n){const m=match(n,terms());ui.hits=m.ok?m.hits:new Set();document.querySelectorAll('.block').forEach(el=>el.classList.toggle('hit',ui.hits.has(el.dataset.id)))}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closePop();closeModal()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSide(true);$('q').focus()}
});
if(mobile())setSide(false);
else{const first=[...state.notes].sort((a,b)=>(b.pinned-a.pinned)||(b.updatedAt-a.updatedAt))[0];if(first)ui.cur=first.id}
renderSide();renderEditor();
initSync();
