/* ---------- Datos de ejemplo (simulan la base de datos) ---------- */
const hoy=new Date();const d=n=>{const x=new Date(hoy);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const USERS={operario:{pass:"op123",rol:"Operario",nombre:"Luis Quispe"},supervisor:{pass:"sup123",rol:"Supervisor",nombre:"Marta Rojas"}};
const PRODUCTOS=[
 {ean:"7750885000011",nombre:"Aceite Primor Clásico 1 L",marca:"Primor",cat:"Aceites",peso:"0.92 kg",cajas:"12 und/caja",alm:"Ambiente seco"},
 {ean:"7750885000028",nombre:"Fideos Don Vittorio Spaghetti 500 g",marca:"Don Vittorio",cat:"Pastas",peso:"0.50 kg",cajas:"20 und/caja",alm:"Ambiente seco"},
 {ean:"7750885000035",nombre:"Detergente Bolívar 2 kg",marca:"Bolívar",cat:"Cuidado del hogar",peso:"2.00 kg",cajas:"6 und/caja",alm:"Ambiente seco"},
 {ean:"7750885000042",nombre:"Galletas Casino Fresa 6 pack",marca:"Casino",cat:"Galletas",peso:"0.17 kg",cajas:"24 und/caja",alm:"Ambiente fresco"}];
let LOTES=[
 {id:"L-2411-A",ean:"7750885000011",venc:d(18),stock:40,ubic:"A-01-03"},
 {id:"L-2503-B",ean:"7750885000011",venc:d(160),stock:120,ubic:"A-02-01"},
 {id:"L-2410-C",ean:"7750885000028",venc:d(-3),stock:15,ubic:"B-01-02"},
 {id:"L-2506-D",ean:"7750885000028",venc:d(240),stock:200,ubic:"B-03-04"},
 {id:"L-2504-E",ean:"7750885000035",venc:d(300),stock:80,ubic:"C-02-02"},
 {id:"L-2412-F",ean:"7750885000042",venc:d(25),stock:30,ubic:"D-01-01"},
 {id:"L-2507-G",ean:"7750885000042",venc:d(120),stock:90,ubic:"D-02-03"}];
let PEDIDOS=[
 {id:"PED-1001",cliente:"Distribuidora San Martín S.A.C.",destino:"Av. Argentina 1520, Callao",ruta:"R-01 Callao",camion:"ABC-123",salida:"08:30",estado:"Pendiente",
  items:[{ean:"7750885000011",qty:10,picked:0},{ean:"7750885000042",qty:6,picked:0}],
  paradas:["Almacén central Alicorp","Puerto del Callao","Av. Argentina 1520"]},
 {id:"PED-1002",cliente:"Supermercados Wong Surco",destino:"Av. Primavera 645, Surco",ruta:"R-02 Lima Sur",camion:"XYZ-908",salida:"10:15",estado:"Pendiente",
  items:[{ean:"7750885000028",qty:12,picked:0},{ean:"7750885000035",qty:4,picked:0}],
  paradas:["Almacén central Alicorp","Panamericana Sur","Av. Primavera 645"]},
 {id:"PED-1003",cliente:"Mayorista Santa Rosa E.I.R.L.",destino:"Jr. Gamarra 410, La Victoria",ruta:"R-03 Lima Centro",camion:"QWE-445",salida:"13:00",estado:"Cargado",
  items:[{ean:"7750885000035",qty:8,picked:8}],paradas:["Almacén central Alicorp","Av. Grau","Jr. Gamarra 410"]}];
let ACTUALIZACIONES=[];let user=null,view="escaneo",pedidoSel="PED-1001",scanner=null,ultimo=null;
const ESTADOS=["Pendiente","En picking","Cargado","En ruta","Entregado"];
const prod=e=>PRODUCTOS.find(p=>p.ean===e);
const dias=f=>Math.ceil((new Date(f)-new Date(d(0)))/864e5);
function estLote(l){const n=dias(l.venc);if(l.stock<=0)return["Agotado","info"];if(n<0)return["Vencido","bad"];if(n<=30)return["Por vencer ("+n+" d)","warn"];return["Vigente","ok"]}
const fifo=e=>LOTES.filter(l=>l.ean===e&&l.stock>0&&dias(l.venc)>=0).sort((a,b)=>a.venc.localeCompare(b.venc))[0];
const pill=(t,c)=>`<span class="pill ${c}">${t}</span>`;
const clsEnvio=e=>({Pendiente:"info","En picking":"warn",Cargado:"warn","En ruta":"info",Entregado:"ok"}[e]);
function toast(t){const e=document.getElementById("toast");e.textContent=t;e.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.add("hidden"),2600)}

/* ---------- Login ---------- */
document.getElementById("lb").onclick=()=>{
 const u=document.getElementById("u").value.trim().toLowerCase(),p=document.getElementById("p").value;
 if(USERS[u]&&USERS[u].pass===p){user={...USERS[u],id:u};document.getElementById("login").classList.add("hidden");document.getElementById("app").classList.remove("hidden");view=u==="supervisor"?"envio":"escaneo";menu();render()}
 else document.getElementById("le").textContent="Usuario o contraseña incorrectos. Revisa las cuentas de prueba."};
document.getElementById("p").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("lb").click()});

/* ---------- Navegación ---------- */
const SECC=[["escaneo","📷","Escanear"],["lote","📦","Lote a enviar"],["ruta","🗺️","Ruta"],["actualizado","🔄","Lote actualizado"],["envio","🚚","Estado envío"],["producto","🏷️","Estado producto"],["espec","📋","Especificación"]];
function menu(){
 const nav=document.getElementById("nav");
 nav.innerHTML=`<div class="logo"><i>A</i><h1>WMS</h1></div>`+SECC.map(s=>`<button data-v="${s[0]}"><span aria-hidden="true">${s[1]}</span>${s[2]}</button>`).join("")+`<div class="who">${user.nombre}<br>${user.rol}<br><button id="out" style="padding:6px 0">Cerrar sesión</button></div>`;
 nav.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{stopScan();view=b.dataset.v;render()});
 document.getElementById("out").onclick=()=>location.reload()}
function selPedido(){return `<label for="ps">Pedido activo</label><select id="ps">${PEDIDOS.map(p=>`<option value="${p.id}" ${p.id===pedidoSel?"selected":""}>${p.id} · ${p.cliente}</option>`).join("")}</select>`}
function bindSel(){const s=document.getElementById("ps");if(s)s.onchange=()=>{pedidoSel=s.value;render()}}
const ped=()=>PEDIDOS.find(p=>p.id===pedidoSel);

function render(){
 document.querySelectorAll("#nav [data-v]").forEach(b=>b.setAttribute("aria-current",b.dataset.v===view?"page":"false"));
 const m=document.getElementById("main"),p=ped();
 const head=t=>`<div class="top"><h2>${t}</h2><span class="pill info">${user.rol}: ${user.nombre}</span></div>`;
 if(view==="escaneo"){
  m.innerHTML=head("Escanear producto")+`<div class="grid"><div class="card"><h3>Cámara</h3>${selPedido()}
   <div id="reader"></div><div class="row"><button class="btn" id="go">Activar cámara</button><button class="btn sec" id="stop">Detener</button></div>
   <label for="man">O escribe el código de barras</label><div class="row"><input id="man" inputmode="numeric" placeholder="7750885000011" style="flex:1"><button class="btn sec" id="mb">Buscar</button></div>
   <div class="chips row" style="margin-top:10px"><span style="color:var(--mute);font-size:.85rem">Simular lectura:</span>${PRODUCTOS.map(x=>`<button data-e="${x.ean}">${x.marca}</button>`).join("")}</div></div>
   <div class="card" id="res"></div></div>`;
  bindSel();showRes();
  document.getElementById("go").onclick=startScan;document.getElementById("stop").onclick=stopScan;
  document.getElementById("mb").onclick=()=>onCode(document.getElementById("man").value.trim());
  m.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>onCode(b.dataset.e));
 }
 if(view==="lote"){
  m.innerHTML=head("Lote a enviar")+selPedido()+`<div class="tw" style="margin-top:14px"><table><tr><th>Producto</th><th>Lote sugerido (FIFO)</th><th>Vence</th><th>Ubicación</th><th>Avance</th></tr>${p.items.map(i=>{const l=fifo(i.ean),pr=prod(i.ean);return`<tr><td>${pr.nombre}</td><td>${l?l.id:"Sin stock"}</td><td>${l?l.venc:"-"}</td><td>${l?l.ubic:"-"}</td><td>${i.picked}/${i.qty} ${pill(i.picked>=i.qty?"Completo":"Pendiente",i.picked>=i.qty?"ok":"warn")}</td></tr>`}).join("")}</table></div>
  <p style="color:var(--mute)">El sistema siempre sugiere el lote más antiguo que aún no vence.</p>`;bindSel()}
 if(view==="ruta"){
  m.innerHTML=head("Ruta de distribución")+selPedido()+`<div class="card" style="margin-top:14px"><h3>${p.ruta}</h3>
   <dl><dt>Camión</dt><dd>${p.camion}</dd><dt>Salida</dt><dd>${p.salida}</dd><dt>Destino</dt><dd>${p.destino}</dd></dl>
   <ul class="route">${p.paradas.map((x,i)=>`<li class="${ESTADOS.indexOf(p.estado)>=3&&i<2?"done":""}">${x}</li>`).join("")}</ul></div>`;bindSel()}
 if(view==="actualizado"){
  m.innerHTML=head("Lote actualizado")+(ACTUALIZACIONES.length?`<div class="tw"><table><tr><th>Hora</th><th>Pedido</th><th>Lote</th><th>Cantidad</th><th>Stock anterior</th><th>Stock nuevo</th><th>Usuario</th></tr>${ACTUALIZACIONES.map(a=>`<tr><td>${a.h}</td><td>${a.ped}</td><td>${a.lote}</td><td>-${a.q}</td><td>${a.ant}</td><td>${a.nue}</td><td>${a.u}</td></tr>`).join("")}</table></div>`:`<div class="card">Aún no hay movimientos. Escanea un producto y confirma el picking para ver aquí el stock actualizado.</div>`)}
 if(view==="envio"){
  const c=e=>PEDIDOS.filter(x=>x.estado===e).length;
  m.innerHTML=head("Estado del envío")+`<div class="kpis">${ESTADOS.map(e=>`<div class="kpi"><b>${c(e)}</b><span>${e}</span></div>`).join("")}</div>
  <div class="tw"><table><tr><th>Pedido</th><th>Cliente</th><th>Ruta</th><th>Avance</th><th>Estado</th></tr>${PEDIDOS.map(x=>{const t=x.items.reduce((a,i)=>a+i.qty,0),k=x.items.reduce((a,i)=>a+i.picked,0),pc=Math.round(k/t*100);
   return`<tr><td>${x.id}</td><td>${x.cliente}</td><td>${x.ruta}</td><td style="min-width:110px">${pc}%<div class="bar"><div style="width:${pc}%"></div></div></td><td>${user.id==="supervisor"?`<select data-p="${x.id}" aria-label="Estado de ${x.id}">${ESTADOS.map(e=>`<option ${e===x.estado?"selected":""}>${e}</option>`).join("")}</select>`:pill(x.estado,clsEnvio(x.estado))}</td></tr>`}).join("")}</table></div>
  ${user.id==="supervisor"?"":`<p style="color:var(--mute)">Solo el supervisor puede cambiar el estado del envío.</p>`}`;
  m.querySelectorAll("[data-p]").forEach(s=>s.onchange=()=>{PEDIDOS.find(x=>x.id===s.dataset.p).estado=s.value;toast("Estado actualizado");render()})}
 if(view==="producto"){
  m.innerHTML=head("Estado del producto")+`<div class="tw"><table><tr><th>Lote</th><th>Producto</th><th>Vence</th><th>Stock</th><th>Ubicación</th><th>Estado</th></tr>${[...LOTES].sort((a,b)=>a.venc.localeCompare(b.venc)).map(l=>{const[t,c]=estLote(l);return`<tr><td>${l.id}</td><td>${prod(l.ean).nombre}</td><td>${l.venc}</td><td>${l.stock}</td><td>${l.ubic}</td><td>${pill(t,c)}</td></tr>`}).join("")}</table></div>
  <p style="color:var(--mute)">Ordenado por fecha de vencimiento: los primeros lotes son los que deben salir antes.</p>`}
 if(view==="espec"){
  m.innerHTML=head("Especificación del envío")+selPedido()+`<div class="grid" style="margin-top:14px"><div class="card"><h3>Cliente</h3><dl><dt>Razón social</dt><dd>${p.cliente}</dd><dt>Dirección</dt><dd>${p.destino}</dd><dt>Pedido</dt><dd>${p.id}</dd><dt>Estado</dt><dd>${pill(p.estado,clsEnvio(p.estado))}</dd></dl></div>
  <div class="card"><h3>Productos enviados</h3>${p.items.map(i=>{const pr=prod(i.ean);return`<p style="margin:10px 0 0"><b>${pr.nombre}</b><br><span style="color:var(--mute)">${i.picked} de ${i.qty} und · ${pr.cajas} · ${pr.peso}</span></p>`}).join("")}</div></div>`;bindSel()}
}

/* ---------- Escaneo ---------- */
function showRes(){
 const r=document.getElementById("res");if(!r)return;
 if(!ultimo){r.innerHTML=`<h3>Producto escaneado</h3><p style="color:var(--mute)">Apunta la cámara al código de barras o usa una lectura simulada. Aquí verás las características del producto.</p>`;return}
 const pr=prod(ultimo),l=fifo(ultimo),it=ped().items.find(i=>i.ean===ultimo);
 r.innerHTML=`<h3>${pr.nombre}</h3><dl><dt>Código</dt><dd>${pr.ean}</dd><dt>Marca</dt><dd>${pr.marca}</dd><dt>Categoría</dt><dd>${pr.cat}</dd><dt>Peso</dt><dd>${pr.peso}</dd><dt>Presentación</dt><dd>${pr.cajas}</dd><dt>Almacenaje</dt><dd>${pr.alm}</dd></dl>
 <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
 ${l?`<p><b>Toma del lote ${l.id}</b> (FIFO)<br>Vence ${l.venc} · Ubicación ${l.ubic} · Stock ${l.stock}</p>`:`<p>${pill("Sin stock vigente","bad")}</p>`}
 ${it?`<p>Pedido ${ped().id}: ${it.picked}/${it.qty} recolectadas</p><div class="row"><input id="q" type="number" min="1" value="1" style="width:90px" aria-label="Cantidad"><button class="btn go" id="ok" ${l&&it.picked<it.qty?"":"disabled"}>Confirmar picking</button></div>`:`<p>${pill("Este producto no pertenece al pedido activo","warn")}</p>`}`;
 const ok=document.getElementById("ok");if(ok)ok.onclick=confirmar}
function onCode(c){
 if(!prod(c)){toast("Código no registrado: "+c);return}
 ultimo=c;if(navigator.vibrate)navigator.vibrate(60);showRes()}
function confirmar(){
 const p=ped(),it=p.items.find(i=>i.ean===ultimo),l=fifo(ultimo);let q=parseInt(document.getElementById("q").value)||1;
 q=Math.min(q,it.qty-it.picked,l.stock);const ant=l.stock;l.stock-=q;it.picked+=q;
 ACTUALIZACIONES.unshift({h:new Date().toLocaleTimeString("es-PE"),ped:p.id,lote:l.id,q,ant,nue:l.stock,u:user.nombre});
 const todo=p.items.every(i=>i.picked>=i.qty);if(p.estado==="Pendiente"||p.estado==="En picking")p.estado=todo?"Cargado":"En picking";
 toast(todo?"Pedido completo y listo para carga":"Picking registrado");showRes()}
async function startScan(){
 try{stopScan();scanner=new Html5Qrcode("reader");
  await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:260,height:130}},t=>{onCode(t)},()=>{})}
 catch(e){toast("No se pudo abrir la cámara. Revisa los permisos o usa el ingreso manual.")}}
function stopScan(){if(scanner){const s=scanner;scanner=null;s.stop().then(()=>s.clear()).catch(()=>{})}}