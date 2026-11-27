/* 検索: キーワード一致の判定とハイライト */
const norm=s=>(s||'').normalize('NFKC').toLowerCase();
const terms=()=>norm(ui.q).split(/\s+/).filter(Boolean);
function match(n,ts){
  if(!ts.length)return{ok:true,hits:new Set(),snip:null};
  const tagNames=n.tags.map(id=>tagById(id)?.name||'').join(' ');
  const list=allBlocks(n),tabNames=hasTabs(n)?n.tabs.map(t=>t.name||'').join(' '):'';
  const all=norm([n.title,tagNames,tabNames,...list.map(({b})=>(b.title||'')+'\n'+(b.body||''))].join('\n'));
  if(!ts.every(t=>all.includes(t)))return{ok:false};
  const hits=new Set();let snip=null;
  for(const {b,tab} of list){
    const tt=norm(b.title),bb=norm(b.body);
    const t=ts.find(t=>tt.includes(t)||bb.includes(t));
    if(!t)continue;
    hits.add(b.id);
    if(!snip){
      const i=bb.indexOf(t);
      let text=i<0?'':(i>18?'…':'')+(b.body||'').slice(Math.max(0,i-18),i+50).replace(/\n/g,' ');
      snip={label:(tab?'['+(tab.name||'無題のタブ')+'] ':'')+(b.title||''),text};
    }
  }
  return{ok:true,hits,snip};
}
function marked(text,ts){
  const f=document.createDocumentFragment();if(!ts.length){f.append(text);return f}
  const n=norm(text);let i=0;
  while(i<text.length){
    let best=-1,len=0;
    for(const t of ts){const j=n.indexOf(t,i);if(j>=0&&(best<0||j<best)){best=j;len=t.length}}
    if(best<0){f.append(text.slice(i));break}
    f.append(text.slice(i,best),h('mark',{},text.slice(best,best+len)));i=best+len;
  }
  return f;
}
