/* エディタ: メモ本文・トグル項目の描画と編集 */
function openNote(id,hits){
  ui.cur=id;ui.hits=hits||new Set();
  const n=curNote();if(n&&ui.hits.size){n.blocks.forEach(b=>{if(ui.hits.has(b.id))b.open=true})}
  renderEditor();renderList();
  if(mobile())setSide(false);
}
function topbar(n){
  const bar=h('div',{class:'topbar'},iconBtn('menu','サイドバーを開く',()=>setSide(true),'open-side'),h('span',{class:'sp'}));
  if(n){
    bar.append(
      iconBtn('expand','すべて開く',()=>{n.blocks.forEach(b=>b.open=true);touch(n,false);renderEditor()}),
      iconBtn('collapse','すべて閉じる',()=>{n.blocks.forEach(b=>b.open=false);touch(n,false);renderEditor()}),
      h('button',{class:'ib',title:n.pinned?'ピンを外す':'ピン留め','aria-label':'ピン留め',style:n.pinned?'color:var(--accent)':'',onclick:()=>{n.pinned=!n.pinned;touch(n,false);renderEditor();renderList()}},svg('pin')),
      iconBtn('trash','メモを削除',()=>confirmBox(`「${n.title||'無題のメモ'}」を削除しますか？`,'削除',()=>{state.notes=state.notes.filter(x=>x!==n);ui.cur=null;save();renderEditor();renderSide()}))
    );
  }
  return bar;
}
function renderEditor(){
  const main=$('main');main.replaceChildren();
  const n=curNote();
  main.append(topbar(n));
  if(!n){
    main.append(h('div',{class:'welcome'},h('h1',{},'振り返りを、すぐ見つかる形で。'),h('p',{},'メモにタグを付けて、内容は「項目」ごとに折りたためます。キャラ対策や反省点を項目に分けておくと、必要なところだけ開いて読めます。'),h('button',{class:'primary',onclick:newNoteModal},'新規メモを作成')));
    return;
  }
  const ed=h('div',{class:'editor'});
  const title=h('input',{class:'title',value:n.title,placeholder:'無題のメモ','aria-label':'タイトル'});
  title.addEventListener('input',()=>{n.title=title.value;touch(n)});
  title.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();ed.querySelector('.ttitle,textarea')?.focus()}});
  const meta=h('div',{class:'meta'});
  for(const id of n.tags){const t=tagById(id);if(!t)continue;
    meta.append(h('span',{class:'chip'},h('span',{class:'dot',style:'background:'+t.color}),t.name,h('button',{title:'タグを外す','aria-label':t.name+'を外す',onclick:()=>{n.tags=n.tags.filter(x=>x!==id);touch(n);renderEditor();renderSide()}},svg('x'))));
  }
  const add=h('button',{class:'chip addtag',onclick:e=>tagPop(e.currentTarget,n)},'＋ タグ');
  meta.append(add,h('span',{class:'date'},'更新 '+fmt(n.updatedAt)));
  const blocks=h('div',{});
  n.blocks.forEach((b,i)=>blocks.append(renderBlock(n,b,i)));
  const adds=h('div',{class:'adds'},
    h('button',{onclick:()=>addBlock(n,'toggle')},svg('toggle'),'項目（トグル）を追加'),
    h('button',{onclick:()=>addBlock(n,'text')},svg('text'),'テキストを追加'));
  ed.append(title,meta,blocks,adds,h('p',{class:'hint'},'項目名で Enter を押すと中身に移動します。'+(typeof sync!=='undefined'&&sync.user?'入力内容はクラウドに自動保存され、ほかの端末にも反映されます。':'入力内容はこのブラウザに自動保存されます。ログインするとクラウドに保存できます。')));
  main.append(ed);
  requestAnimationFrame(()=>ed.querySelectorAll('textarea').forEach(autosize));
}
function renderBlock(n,b,i){
  const wrap=h('div',{class:'block '+b.type+(b.type==='toggle'&&b.open?' open':'')+(ui.hits.has(b.id)?' hit':''),'data-id':b.id});
  const acts=h('div',{class:'bactions'},
    i>0?iconBtn('up','上へ移動',()=>move(n,i,-1)):null,
    i<n.blocks.length-1?iconBtn('down','下へ移動',()=>move(n,i,1)):null,
    iconBtn('trash','削除',()=>{const empty=!(b.title||'').trim()&&!(b.body||'').trim();const del=()=>{n.blocks=n.blocks.filter(x=>x!==b);touch(n);renderEditor()};empty?del():confirmBox(`項目「${b.title||'テキスト'}」を削除しますか？`,'削除',del)}));
  const body=h('textarea',{rows:1,placeholder:b.type==='toggle'?'内容を書く…':'自由にメモ…',value:b.body||''});
  body.addEventListener('input',()=>{b.body=body.value;autosize(body);touch(n)});
  if(b.type==='toggle'){
    const title=h('input',{class:'ttitle',value:b.title||'',placeholder:'項目名（例：画面端でやること）'});
    title.addEventListener('input',()=>{b.title=title.value;touch(n)});
    title.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();b.open=true;wrap.classList.add('open');autosize(body);body.focus();touch(n,false)}});
    const chev=h('button',{class:'chev',title:'開く／閉じる','aria-label':'開く／閉じる',onclick:()=>{b.open=!b.open;wrap.classList.toggle('open',b.open);if(b.open)autosize(body);touch(n,false)}},svg('chev'));
    wrap.append(h('div',{class:'thead'},chev,title,acts),h('div',{class:'tcontent'},body));
  }else{
    wrap.append(body,acts);
  }
  return wrap;
}
function move(n,i,d){const j=i+d;[n.blocks[i],n.blocks[j]]=[n.blocks[j],n.blocks[i]];touch(n);renderEditor()}
function addBlock(n,type){
  const b=type==='toggle'?{id:uid(),type,title:'',body:'',open:true}:{id:uid(),type,body:''};
  n.blocks.push(b);touch(n);renderEditor();
  const el=document.querySelector(`[data-id="${b.id}"]`);el?.querySelector(type==='toggle'?'.ttitle':'textarea')?.focus();
}
