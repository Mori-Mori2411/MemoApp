/* データ: 保存・読み込み・サンプルデータ・画面の状態 */
const KEY='hansei-note-v1';
function sample(){
  const t1={id:uid(),name:'ゲーム',color:COLORS[3]},t2={id:uid(),name:'SF6',color:COLORS[0]},t3={id:uid(),name:'仕事',color:COLORS[2]};
  const now=Date.now();
  return {tags:[t1,t2,t3],notes:[
    {id:uid(),title:'SF6 ルーク',tags:[t1.id,t2.id],pinned:true,createdAt:now,updatedAt:now,blocks:[
      {id:uid(),type:'text',body:'サンプルのメモです。自由に書き換えたり削除したりしてください。'},
      {id:uid(),type:'toggle',title:'画面端でやること',open:true,body:'・ここに画面端で狙う連携を書く\n・起き攻めの択\n・逃げられたときの対応'},
      {id:uid(),type:'toggle',title:'JP対策',open:false,body:'・近づき方\n・飛び道具への対応\n・反省点'},
      {id:uid(),type:'toggle',title:'今日の反省',open:false,body:''}
    ]},
    {id:uid(),title:'週次ふりかえり',tags:[t3.id],pinned:false,createdAt:now-864e5,updatedAt:now-864e5,blocks:[
      {id:uid(),type:'toggle',title:'よかったこと',open:true,body:''},
      {id:uid(),type:'toggle',title:'次に改善すること',open:false,body:''}
    ]}
  ]};
}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.notes)&&Array.isArray(s.tags))return s}catch(e){}return sample()}
let state=load();
let saveT=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(save,300)}
window.addEventListener('beforeunload',save);

const ui={cur:null,q:'',tag:null,hits:new Set()};
const tagById=id=>state.tags.find(t=>t.id===id);
const curNote=()=>state.notes.find(n=>n.id===ui.cur);

function touch(n,bump=true){if(bump){n.updatedAt=Date.now();renderSideSoon()}saveSoon()}
