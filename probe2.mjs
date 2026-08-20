const res = await fetch('http://localhost:9333/json/new?http://dansolam.test/', { method: 'PUT' });
const tab = await res.json(); const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id=0; const pending=new Map();
const send=(m,p={})=>{const i=++id;return new Promise(r=>{pending.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:p}));});};
await new Promise(r=>{ws.addEventListener('open',r);ws.addEventListener('message',e=>{const d=JSON.parse(e.data);if(d.id&&pending.has(d.id)){pending.get(d.id)(d.result);pending.delete(d.id);}});});
await send('Runtime.enable');
await new Promise(r=>setTimeout(r,4000));
const out=await send('Runtime.evaluate',{expression:`
(()=>{const rows=[];
document.querySelectorAll('main section, main > div').forEach((el,i)=>{
  const cs=getComputedStyle(el);
  const bg=cs.backgroundColor, bi=cs.backgroundImage;
  if(bg!=='rgba(0, 0, 0, 0)'||bi!=='none'){
    rows.push({i, tag:el.tagName, cls:(el.className||'').toString().slice(0,90), bg, bi:bi.slice(0,70)});
  }});
return JSON.stringify(rows.slice(0,14),null,1);})()`,returnByValue:true});
console.log(out.result.value);
process.exit(0);
