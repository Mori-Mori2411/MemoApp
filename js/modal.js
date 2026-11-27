/* ダイアログ: 汎用モーダル・確認・トースト通知 */
let veil=null;
function modal(...content){closeModal();veil=h('div',{class:'veil',onmousedown:e=>{if(e.target===veil)closeModal()}},h('div',{class:'modal',role:'dialog'},...content));document.body.append(veil);return veil}
function closeModal(){veil?.remove();veil=null}
function confirmBox(msg,ok,fn){modal(h('h2',{},'確認'),h('p',{style:'margin:0'},msg),h('div',{class:'acts'},h('button',{class:'ghost',onclick:closeModal},'キャンセル'),h('button',{class:'primary',style:'background:#c0392b',onclick:()=>{closeModal();fn()}},ok)))}
function toast(msg){const t=h('div',{class:'toast'},msg);document.body.append(t);setTimeout(()=>t.remove(),1800)}
