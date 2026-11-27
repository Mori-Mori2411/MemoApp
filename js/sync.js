/* クラウド同期: Google ログインと Firestore でメモを保存し、端末どうしで同期する */
// 保存先: users/{uid}（タグ一覧） と users/{uid}/notes/{メモID}（メモ1件ずつ）
const sync={
  on:false,       // Firebase が使える状態か
  user:null,      // ログイン中のユーザー
  db:null,
  unsubs:[],      // リアルタイム受信の解除関数
  last:{},        // メモID → 最後にクラウドと一致していた内容（差分チェック用）
  lastTags:null,
  firstNotes:true,firstTags:true, // ログイン直後の初回読み込みが済んだか
  pristine:false, // ログイン時点でサンプルのままだったか
  timer:null,status:'off',pendingRender:false,
  deferred:new Map() // 入力中だったため反映を待っているクラウドの変更
};
const SYNC_DELAY=1500; // 入力が止まってからクラウドに書き込むまでの待ち時間(ms)

function initSync(){
  if(typeof FIREBASE_CONFIG==='undefined'||!FIREBASE_CONFIG||typeof firebase==='undefined'){renderAccount();return}
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    sync.db=firebase.firestore();
    sync.db.settings({ignoreUndefinedProperties:true});
    // オフラインでも読み書きでき、つながったときに自動で送られる
    sync.db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
    sync.on=true;
    firebase.auth().onAuthStateChanged(u=>{u?startSync(u):stopSync()});
  }catch(e){console.error(e);sync.on=false}
  renderAccount();
}

/* ---------- ログイン・ログアウト ---------- */
function login(){
  const p=new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(p).catch(e=>{
    if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')return firebase.auth().signInWithRedirect(p);
    if(e.code==='auth/unauthorized-domain')return toast('このURLはFirebaseで許可されていません（承認済みドメインを確認）');
    if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')toast('ログインできませんでした（'+e.code+'）');
  });
}
function logout(){
  confirmBox('ログアウトしますか？この端末に表示しているメモは消えますが、クラウドのメモはそのまま残ります。','ログアウト',async()=>{
    try{await flushSync()}catch(e){}
    await firebase.auth().signOut();
  });
}
function startSync(u){
  stopListening();
  Object.assign(sync,{user:u,last:{},lastTags:null,firstNotes:true,firstTags:true,pristine:isPristineSample()});
  setStatus('sync');
  const base=userDoc();
  sync.unsubs.push(base.collection('notes').onSnapshot(onNotes,onSyncError));
  sync.unsubs.push(base.onSnapshot(onTags,onSyncError));
  renderAccount();renderEditor();
}
function stopSync(){
  const was=!!sync.user;
  stopListening();
  sync.user=null;sync.last={};sync.lastTags=null;setStatus('off');
  if(was){ // 別のアカウントとメモが混ざらないよう、ログアウト時は端末内の表示を空にする
    state={tags:[],notes:[]};ui.cur=null;ui.tag=null;save();renderSide();renderEditor();
  }
  renderAccount();
}
function stopListening(){sync.unsubs.forEach(f=>f());sync.unsubs=[];clearTimeout(sync.timer);sync.deferred.clear()}
const userDoc=()=>sync.db.collection('users').doc(sync.user.uid);

/* ---------- クラウドから受け取る ---------- */
const fixNote=r=>({...r,tags:Array.isArray(r.tags)?r.tags:[],blocks:Array.isArray(r.blocks)?r.blocks:[]});
function onNotes(snap){
  if(sync.firstNotes){
    // 初回: クラウドと端末のメモを合体（同じメモは新しい方を採用、端末にしかないメモはこのあとアップロード）
    sync.firstNotes=false;
    const remote=[];snap.forEach(d=>remote.push(fixNote(d.data())));
    if(remote.length&&sync.pristine){ // サンプルは捨ててクラウドのメモを使う
      state.notes=[];ui.cur=null;
      if(sync.firstTags||sync.lastTags===null)state.tags=[];
    }
    for(const r of remote){
      const i=state.notes.findIndex(n=>n.id===r.id);
      if(i<0)state.notes.push(r);
      else if((r.updatedAt||0)>=(state.notes[i].updatedAt||0))state.notes[i]=r;
      sync.last[r.id]=canon(r);
    }
    delete state.sampleSig;
  }else{
    snap.docChanges().forEach(ch=>{
      if(ch.doc.metadata.hasPendingWrites)return; // 自分が送った変更の折り返しは無視
      const id=ch.doc.id,r=ch.type==='removed'?null:fixNote(ch.doc.data());
      // いま入力中のメモは、入力欄から離れるまで反映を待つ（入力内容が消えないように）
      if(id===ui.cur&&editingNow()){sync.deferred.set(id,r);sync.pendingRender=true;return}
      applyRemote(id,r);
    });
  }
  afterReceive();
}
function applyRemote(id,r){
  const i=state.notes.findIndex(n=>n.id===id),local=state.notes[i];
  if(r===null){state.notes=state.notes.filter(n=>n.id!==id);delete sync.last[id];if(ui.cur===id)ui.cur=null;return}
  sync.last[id]=canon(r);
  // 更新時刻が新しい方を採用（こちらの方が新しければ、次の送信でクラウドを上書きする）
  if(!local)state.notes.push(r);
  else if((r.updatedAt||0)>=(local.updatedAt||0))state.notes[i]=r;
}
const editingNow=()=>{const ed=document.querySelector('.editor');return !!(ed&&ed.contains(document.activeElement))};
function onTags(doc){
  if(doc.metadata.hasPendingWrites)return;
  const r=doc.exists&&Array.isArray(doc.data().tags)?doc.data().tags:null;
  if(sync.firstTags){
    sync.firstTags=false;
    if(r){
      if(sync.pristine)state.tags=r;
      else{const m=new Map(r.map(t=>[t.id,t]));state.tags.forEach(t=>{if(!m.has(t.id))m.set(t.id,t)});state.tags=[...m.values()]}
      sync.lastTags=canon(r);
    }
  }else if(r){
    const localEdited=sync.lastTags!==canon(state.tags);
    sync.lastTags=canon(r);
    if(!localEdited)state.tags=r;
  }
  afterReceive();
}
function afterReceive(){
  try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
  if(!sync.firstNotes&&!sync.firstTags){if(sync.status==='sync')setStatus(navigator.onLine?'ok':'offline');scheduleSync()}
  refreshViews();
}
// 入力中のエディタは作り直さない（カーソルが飛ぶため）。入力欄から離れたら反映する
function refreshViews(){
  renderSide();
  if(editingNow()&&curNote()){sync.pendingRender=true;return}
  const main=$('main'),y=main.scrollTop;renderEditor();main.scrollTop=y;
}
document.addEventListener('focusout',()=>setTimeout(()=>{
  if(!sync.pendingRender||editingNow())return;
  sync.pendingRender=false;
  if(sync.deferred.size){sync.deferred.forEach((r,id)=>applyRemote(id,r));sync.deferred.clear();try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}renderSide();scheduleSync()}const main=$('main'),y=main.scrollTop;renderEditor();main.scrollTop=y;
},0));

/* ---------- クラウドへ送る ---------- */
function scheduleSync(){if(!sync.user)return;clearTimeout(sync.timer);sync.timer=setTimeout(()=>flushSync().catch(()=>{}),SYNC_DELAY)}
async function flushSync(){
  clearTimeout(sync.timer);
  if(!sync.user||sync.firstNotes||sync.firstTags)return; // 初回読み込みが終わるまで送らない
  const base=userDoc(),ops=[],ids=new Set();
  for(const n of state.notes){
    ids.add(n.id);const c=canon(n);
    if(sync.last[n.id]!==c)ops.push({type:'set',id:n.id,c,prev:sync.last[n.id]});
  }
  for(const id of Object.keys(sync.last))if(!ids.has(id))ops.push({type:'del',id,prev:sync.last[id]});
  const ct=canon(state.tags),prevTags=sync.lastTags;
  const tagsChanged=ct!==prevTags;
  if(!ops.length&&!tagsChanged)return;
  // 送る前に「送信済み」として記録（送信中の再編集は次回の差分で送られる）
  ops.forEach(o=>{if(o.type==='set')sync.last[o.id]=o.c;else delete sync.last[o.id]});
  if(tagsChanged)sync.lastTags=ct;
  setStatus('sync');
  try{
    const all=[...ops];if(tagsChanged)all.push({type:'tags'});
    for(let i=0;i<all.length;i+=450){ // Firestore の一括書き込みは1回500件まで
      const b=sync.db.batch();
      for(const o of all.slice(i,i+450)){
        if(o.type==='set')b.set(base.collection('notes').doc(o.id),JSON.parse(o.c));
        else if(o.type==='del')b.delete(base.collection('notes').doc(o.id));
        else b.set(base,{tags:JSON.parse(ct),updatedAt:Date.now()},{merge:true});
      }
      await b.commit();
    }
    setStatus(navigator.onLine?'ok':'offline');
  }catch(e){
    // 失敗した分は次回また送る
    ops.forEach(o=>{if(o.prev===undefined)delete sync.last[o.id];else sync.last[o.id]=o.prev});
    if(tagsChanged)sync.lastTags=prevTags;
    onSyncError(e);
  }
}
function onSyncError(e){
  console.error(e);setStatus('error');
  if(e&&e.code==='permission-denied')toast('クラウドへのアクセスが拒否されました（Firestoreのルールを確認）');
}

/* ---------- サイドバーのアカウント表示 ---------- */
const STATUS={ok:'同期済み',sync:'同期中…',offline:'オフライン（つながったら同期）',error:'同期エラー',off:''};
function setStatus(s){sync.status=s;const el=document.querySelector('.acc-status');if(el){el.textContent=STATUS[s];el.dataset.s=s}}
function renderAccount(){
  const box=$('account');box.replaceChildren();
  if(!sync.on){box.append(h('div',{class:'acc-off'},'クラウド同期は未設定です'));return}
  if(!sync.user){
    box.append(h('button',{class:'acc-login',onclick:login},h('span',{class:'g'},'G'),'Googleでログインして同期'));
    box.append(h('div',{class:'acc-note'},'ログインするとメモがクラウドに保存され、どの端末からでも見られます'));
    return;
  }
  const u=sync.user,name=u.displayName||u.email||'ログイン中';
  box.append(h('div',{class:'acc-user'},
    h('span',{class:'avatar'},name.slice(0,1).toUpperCase()),
    h('span',{class:'acc-text'},h('span',{class:'acc-name'},name),h('span',{class:'acc-status','data-s':sync.status},STATUS[sync.status])),
    h('button',{class:'acc-out',onclick:logout},'ログアウト')));
}
window.addEventListener('online',()=>{if(sync.user){setStatus('ok');scheduleSync()}});
window.addEventListener('offline',()=>{if(sync.user)setStatus('offline')});
window.addEventListener('beforeunload',()=>{if(sync.user)flushSync()});
