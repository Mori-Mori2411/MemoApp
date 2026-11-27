/* 共通の道具: 要素作成・アイコン・ID生成・日付表示など */
const COLORS=['#c4613f','#d4a03a','#5f9a5b','#3f86b8','#8a6bc4','#c45a8a','#7a7568','#2f9c95'];
const ICON={
  chev:'<path d="m9 6 6 6-6 6"/>',
  up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  pin:'<path d="M9 4h6l-1 6 4 4H6l4-4zM12 14v6"/>',
  expand:'<path d="m7 10 5 5 5-5"/><path d="M7 5h10"/>',collapse:'<path d="m7 14 5-5 5 5"/><path d="M7 19h10"/>',
  toggle:'<path d="m8 8 4 4-4 4"/><path d="M14 12h6"/>',text:'<path d="M5 7h14M5 12h14M5 17h9"/>',
  menu:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
  check:'<path d="m5 12 5 5 9-10"/>'
};
const svg=n=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.innerHTML=ICON[n];return s};
function h(tag,props,...kids){const el=document.createElement(tag);for(const[k,v]of Object.entries(props||{})){if(v==null||v===false)continue;if(k==='class')el.className=v;else if(k==='value')el.value=v;else if(k==='style')el.style.cssText=v;else if(k.startsWith('on'))el.addEventListener(k.slice(2),v);else el.setAttribute(k,v===true?'':v)}for(const c of kids.flat(Infinity)){if(c==null||c===false)continue;el.append(c instanceof Node?c:document.createTextNode(String(c)))}return el}
const uid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const $=id=>document.getElementById(id);
const mobile=()=>matchMedia('(max-width:760px)').matches;
function autosize(t){t.style.height='auto';t.style.height=t.scrollHeight+'px'}
function iconBtn(name,label,fn,cls){return h('button',{class:'ib'+(cls?' '+cls:''),title:label,'aria-label':label,onclick:fn},svg(name))}
function fmt(ts){const d=new Date(ts),n=new Date();if(d.toDateString()===n.toDateString())return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');return (d.getFullYear()!==n.getFullYear()?d.getFullYear()+'/':'')+(d.getMonth()+1)+'/'+d.getDate()}
// オブジェクトのキー順をそろえて文字列化（同期の差分チェック用）
const canon=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
