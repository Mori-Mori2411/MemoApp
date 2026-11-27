/* バックアップ: 書き出し・コピー・ファイルから復元 */
function backupModal(){
  const json=JSON.stringify(state,null,1);
  const ta=h('textarea',{class:'json',readonly:true,value:json});
  modal(h('h2',{},'バックアップ'),
    h('p',{style:'margin:0 0 12px;font-size:13.5px;color:var(--muted)'},'メモはこのブラウザ内に保存されています。別の端末に移すときや念のための控えに使ってください。'),
    ta,
    h('div',{class:'acts',style:'flex-wrap:wrap'},
      h('button',{class:'ghost',onclick:()=>$('file').click()},'ファイルから復元'),
      h('button',{class:'ghost',onclick:()=>{try{const a=h('a',{href:URL.createObjectURL(new Blob([json],{type:'application/json'})),download:'hansei-note-'+new Date().toISOString().slice(0,10)+'.json'});document.body.append(a);a.click();a.remove()}catch(e){toast('この画面ではダウンロードできません。コピーを使ってください')}}},'ダウンロード'),
      h('button',{class:'primary',onclick:async()=>{try{await navigator.clipboard.writeText(json);toast('コピーしました')}catch(e){ta.select();toast('選択しました。Ctrl+C でコピーしてください')}}},'コピー')));
}
$('file').addEventListener('change',async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const s=JSON.parse(await f.text());if(!Array.isArray(s.notes)||!Array.isArray(s.tags))throw 0;
    confirmBox(`${s.notes.length}件のメモで今のデータを置き換えますか？`,'置き換える',()=>{state=s;ui.cur=null;save();renderSide();renderEditor();toast('復元しました')});
  }catch(err){toast('読み込めないファイルです')}
});
