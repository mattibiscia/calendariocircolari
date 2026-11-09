const KEY="belluzzi-calendar-v1";
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const now=new Date();
const ym=(d)=>now.getFullYear()+"-"+pad(now.getMonth()+1)+"-"+pad(d);
let events=[],view=new Date(now.getFullYear(),now.getMonth(),1),sel=iso(now);

function load(){
  try{const r=localStorage.getItem(KEY);if(r){events=JSON.parse(r);return}}catch(e){}
  events=[
    {id:1,title:"Collegio docenti",date:ym(8),type:"riunione",aud:"Docenti",num:"45",desc:"Ordine del giorno: PTOF, adozioni libri di testo, varie ed eventuali.",sign:true,signed:[]},
    {id:2,title:"Sciopero generale del personale",date:ym(12),type:"circolare",aud:"Tutti",num:"52",desc:"Si comunica l’adesione allo sciopero. Possibili variazioni di orario.",sign:true,signed:[]},
    {id:3,title:"Open Day",date:ym(15),type:"evento",aud:"Studenti",num:"",desc:"Giornata di orientamento per le famiglie, dalle 15:00 alle 18:00.",sign:false,signed:[]},
    {id:4,title:"Consegna programmazioni",date:ym(20),type:"scadenza",aud:"Docenti",num:"58",desc:"Termine ultimo per il caricamento delle programmazioni su Argo.",sign:true,signed:[]},
    {id:5,title:"Consiglio di classe 4A",date:ym(20),type:"riunione",aud:"Docenti",num:"",desc:"Aula 12, ore 14:30.",sign:false,signed:[]}
  ];save();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(events))}catch(e){}}
function who(){return document.getElementById("who").value.trim()}
const $=id=>document.getElementById(id);

function render(){
  const f=$("filter").value, vis=events.filter(e=>!f||e.type===f);
  $("title").textContent=view.toLocaleDateString("it-IT",{month:"long",year:"numeric"});
  const g=$("grid");g.innerHTML="";
  ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].forEach(d=>g.insertAdjacentHTML("beforeend",`<div class="dow">${d}</div>`));
  const first=new Date(view.getFullYear(),view.getMonth(),1);
  const start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
  for(let i=0;i<42;i++){
    const d=new Date(start);d.setDate(start.getDate()+i);const k=iso(d);
    const ev=vis.filter(e=>e.date===k);
    const b=document.createElement("button");b.type="button";
    b.className="day"+(d.getMonth()!==view.getMonth()?" out":"")+(k===iso(now)?" today":"")+(k===sel?" sel":"");
    b.innerHTML=`<span class="n">${d.getDate()}</span>`+
      ev.slice(0,2).map(e=>`<span class="chip t-${e.type}">${esc(e.title)}</span>`).join("")+
      (ev.length>2?`<span class="more">+${ev.length-2} altri</span>`:"")+
      `<span class="dots">${ev.map(e=>`<span class="dot t-${e.type}"></span>`).join("")}</span>`;
    b.onclick=()=>{sel=k;render()};
    g.appendChild(b);
  }
  const pending=events.filter(e=>e.sign&&!e.signed.some(s=>s.name===who())).length;
  $("stat").textContent=who()?`Hai ${pending} document${pending===1?"o":"i"} da firmare.`:"Inserisci il tuo nome per poter firmare le circolari.";
  renderDay(vis);
}
function renderDay(vis){
  const d=new Date(sel+"T00:00:00");
  $("dayTitle").textContent=d.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
  const ev=vis.filter(e=>e.date===sel), l=$("list");
  if(!ev.length){l.innerHTML='<p class="empty">Nessuna circolare o impegno in questa data.</p>';return}
  l.innerHTML=ev.map(e=>{
    const me=e.signed.find(s=>s.name===who()&&who());
    return `<div class="ev t-${e.type}">
      <h4>${esc(e.title)}</h4>
      <span class="badge">${e.type}</span><span class="badge">${esc(e.aud)}</span>${e.num?`<span class="badge">Circ. n° ${esc(e.num)}</span>`:""}
      ${e.desc?`<p>${esc(e.desc)}</p>`:""}
      ${e.sign?`<div class="${e.signed.length?"ok":"warn"}">${e.signed.length?"✔ Firmato da "+e.signed.length+": "+esc(e.signed.map(s=>s.name).join(", ")):"⚠ Nessuna firma"}</div>`:""}
      <div class="act">
        ${e.sign?`<button class="pri" data-sign="${e.id}" ${me?"disabled":""}>${me?"Già firmata":"✍ Firma presa visione"}</button>`:""}
        <button class="del" data-del="${e.id}">🗑 Elimina</button>
      </div></div>`}).join("");
  l.querySelectorAll("[data-sign]").forEach(b=>b.onclick=()=>sign(+b.dataset.sign));
  l.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>del(+b.dataset.del));
}
function sign(id){
  if(!who()){alert("Inserisci prima il tuo nome in alto.");$("who").focus();return}
  const e=events.find(x=>x.id===id);
  if(!e.signed.some(s=>s.name===who()))e.signed.push({name:who(),at:new Date().toISOString()});
  save();render();
}
function del(id){
  const e=events.find(x=>x.id===id);
  if(confirm("Eliminare “"+e.title+"”?")){events=events.filter(x=>x.id!==id);save();render()}
}
$("form").onsubmit=ev=>{
  ev.preventDefault();
  events.push({id:Date.now(),title:$("f-title").value.trim(),date:$("f-date").value,type:$("f-type").value,aud:$("f-aud").value,num:$("f-num").value.trim(),desc:$("f-desc").value.trim(),sign:$("f-sign").checked,signed:[]});
  sel=$("f-date").value;const d=new Date(sel+"T00:00:00");view=new Date(d.getFullYear(),d.getMonth(),1);
  save();ev.target.reset();$("f-sign").checked=true;render();
};
$("prev").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
$("next").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
$("today").onclick=()=>{view=new Date(now.getFullYear(),now.getMonth(),1);sel=iso(now);render()};
$("filter").onchange=render;
try{$("who").value=localStorage.getItem(KEY+"-user")||""}catch(e){}
$("who").oninput=()=>{try{localStorage.setItem(KEY+"-user",$("who").value)}catch(e){}render()};
$("f-date").value=sel;
load();render();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}