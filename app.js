/* ---------- Datos de ejemplo (simulan la base de datos) ---------- */
const hoy=new Date();const d=n=>{const x=new Date(hoy);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const USERS={"operario@alicorp.demo":{pass:"Operario#2026",rol:"Operario",rolId:"operario",nombre:"Luis Quispe"},"supervisor@alicorp.demo":{pass:"Supervisor#2026",rol:"Supervisor",rolId:"supervisor",nombre:"Marta Rojas"}};
const PRODUCTOS=[
 {ean:"7750885000011",nombre:"Aceite Primor Clásico 1 L",marca:"Primor",cat:"Aceites",peso:"0.92 kg",cajas:"12 und/caja",alm:"Ambiente seco"},
 {ean:"7750885000028",nombre:"Fideos Don Vittorio Spaghetti 500 g",marca:"Don Vittorio",cat:"Pastas",peso:"0.50 kg",cajas:"20 und/caja",alm:"Ambiente seco"},
 {ean:"7750885000035",nombre:"Detergente Bolívar 2 kg",marca:"Bolívar",cat:"Cuidado del hogar",peso:"2.00 kg",cajas:"6 und/caja",alm:"Ambiente seco"},
 {ean:"7750885000042",nombre:"Galletas Casino Fresa 6 pack",marca:"Casino",cat:"Galletas",peso:"0.17 kg",cajas:"24 und/caja",alm:"Ambiente fresco"},
 {ean:"7750885000059",nombre:"Mayonesa Alacena Clásica 200 g",marca:"Alacena",cat:"Salsas",peso:"0.21 kg",cajas:"24 und/caja",alm:"Ambiente fresco"}];
let LOTES=[
 {id:"L-2411-A",ean:"7750885000011",venc:d(18),stock:40,ubic:"A-01-03"},
 {id:"L-2503-B",ean:"7750885000011",venc:d(160),stock:120,ubic:"A-02-01"},
 {id:"L-2410-C",ean:"7750885000028",venc:d(-3),stock:15,ubic:"B-01-02"},
 {id:"L-2506-D",ean:"7750885000028",venc:d(240),stock:200,ubic:"B-03-04"},
 {id:"L-2504-E",ean:"7750885000035",venc:d(300),stock:80,ubic:"C-02-02"},
 {id:"L-2412-F",ean:"7750885000042",venc:d(25),stock:30,ubic:"D-01-01"},
 {id:"L-2507-G",ean:"7750885000042",venc:d(120),stock:90,ubic:"D-02-03"},
 {id:"L-2508-H",ean:"7750885000059",venc:d(200),stock:60,ubic:"E-01-02"}];
let PEDIDOS=[
 {id:"PED-1001",cliente:"Distribuidora San Martín S.A.C.",destino:"Av. Argentina 1520, Callao",ruta:"R-01 Callao",camion:"ABC-123",salida:"08:30",estado:"Pendiente",
  items:[{ean:"7750885000011",qty:10,picked:0},{ean:"7750885000042",qty:6,picked:0},{ean:"7750885000059",qty:5,picked:0}],
  paradas:["Almacén central Alicorp","Puerto del Callao","Av. Argentina 1520"]},
 {id:"PED-1002",cliente:"Supermercados Wong Surco",destino:"Av. Primavera 645, Surco",ruta:"R-02 Lima Sur",camion:"XYZ-908",salida:"10:15",estado:"Pendiente",
  items:[{ean:"7750885000028",qty:12,picked:0},{ean:"7750885000035",qty:4,picked:0}],
  paradas:["Almacén central Alicorp","Panamericana Sur","Av. Primavera 645"]},
 {id:"PED-1003",cliente:"Mayorista Santa Rosa E.I.R.L.",destino:"Jr. Gamarra 410, La Victoria",ruta:"R-03 Lima Centro",camion:"QWE-445",salida:"13:00",estado:"Cargado",
  items:[{ean:"7750885000035",qty:8,picked:8}],paradas:["Almacén central Alicorp","Av. Grau","Jr. Gamarra 410"]}];
let ACTUALIZACIONES=[];let user=null,view="escaneo",pedidoSel="PED-1001",scanner=null,ultimo=null;
const ESTADOS=["Pendiente","En picking","Cargado","En ruta","Entregado"];
const prod=e=>PRODUCTOS.find(p=>p.ean===e);
const PH="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e8edf2"/><path d="M12 22l20-10 20 10v22L32 54 12 44zM12 22l20 10 20-10M32 32v22" fill="none" stroke="#7b8b9b" stroke-width="2.5" stroke-linejoin="round"/></svg>');
const foto=(x,c)=>`<img class="thumb ${c||""}" src="${x.img||"img/"+x.ean+".jpg"}" alt="${x.nombre}" loading="lazy" onerror="this.onerror=null;this.src=PH">`;
const dias=f=>Math.ceil((new Date(f)-new Date(d(0)))/864e5);
function estLote(l){const n=dias(l.venc);if(l.stock<=0)return["Agotado","info"];if(n<0)return["Vencido","bad"];if(n<=30)return["Por vencer ("+n+" d)","warn"];return["Vigente","ok"]}
const fifo=e=>LOTES.filter(l=>l.ean===e&&l.stock>0&&dias(l.venc)>=0).sort((a,b)=>a.venc.localeCompare(b.venc))[0];
const pill=(t,c)=>`<span class="pill ${c}">${t}</span>`;
const clsEnvio=e=>({Pendiente:"info","En picking":"warn",Cargado:"warn","En ruta":"info",Entregado:"ok"}[e]);
function toast(t){const e=document.getElementById("toast");e.textContent=t;e.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.add("hidden"),2600)}

/* ---------- Login ---------- */
document.getElementById("lb").onclick=()=>{
 const u=document.getElementById("u").value.trim().toLowerCase(),p=document.getElementById("p").value;
 if(USERS[u]&&USERS[u].pass===p){user={...USERS[u],id:USERS[u].rolId};document.getElementById("login").classList.add("hidden");document.getElementById("app").classList.remove("hidden");view=USERS[u].rolId==="supervisor"?"envio":"escaneo";menu();render()}
 else document.getElementById("le").textContent="Correo o contraseña incorrectos. Revisa las cuentas de prueba."};
document.getElementById("p").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("lb").click()});

/* ---------- Navegación ---------- */
const I={escaneo:'<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M4 12h16"/>',lote:'<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',ruta:'<path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>',actualizado:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',envio:'<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/>',producto:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>',espec:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h6"/>',catalogo:'<path d="M4 6v12M7 6v12M10 6v12M14 6v12M17 6v12M20 6v12"/>',reportes:'<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6"/>'};
const svg=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const LO='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/></svg>';
const SECC=[["escaneo","Escanear"],["lote","Lote a enviar"],["ruta","Ruta"],["actualizado","Lote actualizado"],["envio","Estado envío"],["producto","Estado producto"],["espec","Especificación"],["catalogo","Catálogo"],["reportes","Reportes"]];
const SUB={escaneo:"Lee el código de barras para registrar el picking.",lote:"Lotes sugeridos por FIFO para el pedido activo.",ruta:"Recorrido y camión asignado.",actualizado:"Historial del stock descontado.",envio:"Seguimiento de todos los pedidos.",producto:"Vigencia y stock de cada lote.",espec:"Cliente y productos del envío.",catalogo:"Productos registrados y sus códigos de barras.",reportes:"Descarga o comparte el resumen de operaciones."};
const ini=()=>user.nombre.split(" ").map(x=>x[0]).join("");
document.addEventListener("click",e=>{if(e.target.closest("[data-out]"))location.reload()});
function menu(){
 const nav=document.getElementById("nav");
 nav.innerHTML=`<div class="brand"><i>A</i><div><b>WMS Alicorp</b><small>Picking y lotes</small></div></div>`+SECC.filter(s=>s[0]!=="reportes"||user.id==="supervisor").map(s=>`<button data-v="${s[0]}">${svg(s[0])}<span>${s[1]}</span></button>`).join("")+`<div class="who"><span class="av">${ini()}</span><div><b>${user.nombre}</b><small>${user.rol}</small></div><button data-out aria-label="Cerrar sesión" title="Cerrar sesión">${LO}</button></div>`;
 nav.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{stopScan();view=b.dataset.v;render()});
}
function selPedido(){return `<label for="ps">Pedido activo</label><select id="ps">${PEDIDOS.map(p=>`<option value="${p.id}" ${p.id===pedidoSel?"selected":""}>${p.id} · ${p.cliente}</option>`).join("")}</select>`}
function bindSel(){const s=document.getElementById("ps");if(s)s.onchange=()=>{pedidoSel=s.value;render()}}
const ped=()=>PEDIDOS.find(p=>p.id===pedidoSel);

function render(){
 document.querySelectorAll("#nav [data-v]").forEach(b=>b.setAttribute("aria-current",b.dataset.v===view?"page":"false"));
 const m=document.getElementById("main"),p=ped();
 const head=t=>`<div class="top"><div><h2>${t}</h2><p class="sub">${SUB[view]||""}</p></div><div class="chip"><span class="av">${ini()}</span><span>${user.nombre}<small>${user.rol}</small></span><button class="lo" data-out aria-label="Cerrar sesión">${LO}</button></div></div>`;
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
  m.innerHTML=head("Lote a enviar")+selPedido()+`<div class="tw" style="margin-top:14px"><table><tr><th>Producto</th><th>Lote sugerido (FIFO)</th><th>Vence</th><th>Ubicación</th><th>Avance</th></tr>${p.items.map(i=>{const l=fifo(i.ean),pr=prod(i.ean);return`<tr><td><div class="pn">${foto(pr)}${pr.nombre}</div></td><td>${l?l.id:"Sin stock"}</td><td>${l?l.venc:"-"}</td><td>${l?l.ubic:"-"}</td><td>${i.picked}/${i.qty} ${i.picked>=i.qty?pill("Completo","ok"):i.picked>0?pill("Parcial","warn"):pill("Pendiente","info")}</td></tr>`}).join("")}</table></div>
  <p style="color:var(--mute)">El sistema siempre sugiere el lote más antiguo que aún no vence.</p>`;bindSel()}
 if(view==="ruta"){
  m.innerHTML=head("Ruta de distribución")+selPedido()+`<div class="card" style="margin-top:14px"><h3>${p.ruta}</h3>
   <dl><dt>Camión</dt><dd>${p.camion}</dd><dt>Salida</dt><dd>${p.salida}</dd><dt>Destino</dt><dd>${p.destino}</dd></dl>
   <ul class="route">${p.paradas.map((x,i)=>`<li class="${ESTADOS.indexOf(p.estado)>=4||(ESTADOS.indexOf(p.estado)>=3&&i<2)?"done":""}">${x}</li>`).join("")}</ul></div>`+seguimiento(p);bindSel();bindSeg()}
 if(view==="actualizado"){
  m.innerHTML=head("Lote actualizado")+(ACTUALIZACIONES.length?`<div class="tw"><table><tr><th>Hora</th><th>Pedido</th><th>Lote</th><th>Cantidad</th><th>Stock anterior</th><th>Stock nuevo</th><th>Usuario</th></tr>${ACTUALIZACIONES.map(a=>`<tr><td>${a.h}</td><td>${a.ped}</td><td>${a.lote}</td><td>-${a.q}</td><td>${a.ant}</td><td>${a.nue}</td><td>${a.u}</td></tr>`).join("")}</table></div>`:`<div class="card">Aún no hay movimientos. Escanea un producto y confirma el picking para ver aquí el stock actualizado.</div>`)}
 if(view==="envio"){
  const c=e=>PEDIDOS.filter(x=>x.estado===e).length;
  m.innerHTML=head("Estado del envío")+`<div class="kpis">${ESTADOS.map(e=>`<div class="kpi"><b>${c(e)}</b><span>${e}</span></div>`).join("")}</div>
  <div class="tw"><table><tr><th>Pedido</th><th>Cliente</th><th>Ruta</th><th>Avance</th><th>Estado</th><th></th></tr>${PEDIDOS.map(x=>{const t=x.items.reduce((a,i)=>a+i.qty,0),k=x.items.reduce((a,i)=>a+i.picked,0),pc=Math.round(k/t*100);
   return`<tr><td>${x.id}</td><td>${x.cliente}</td><td>${x.ruta}</td><td style="min-width:110px">${pc}%<div class="bar"><div style="width:${pc}%"></div></div></td><td>${user.id==="supervisor"?`<select data-p="${x.id}" aria-label="Estado de ${x.id}">${ESTADOS.map(e=>`<option ${e===x.estado?"selected":""}>${e}</option>`).join("")}</select>`:pill(x.estado,clsEnvio(x.estado))}</td><td><button class="btn sec" data-g="${x.id}">Gestionar</button></td></tr>`}).join("")}</table></div>
  ${user.id==="supervisor"?"":`<p style="color:var(--mute)">Solo el supervisor puede cambiar el estado del envío.</p>`}`;
  m.querySelectorAll("[data-p]").forEach(s=>s.onchange=()=>{setEstado(PEDIDOS.find(x=>x.id===s.dataset.p),s.value,"Estado cambiado por el supervisor a "+s.value);toast("Estado actualizado");render()});m.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{pedidoSel=b.dataset.g;view="ruta";render()})}


 if(view==="catalogo"){
  const form=`<form class="card noprint" id="pf" style="margin-top:16px"><h3>Registrar producto nuevo</h3><div class="fgrid">
  <div><label for="f_ean">Código de barras</label><input id="f_ean" required inputmode="numeric" placeholder="7750885000066"></div>
  <div><label for="f_nom">Nombre del producto</label><input id="f_nom" required></div>
  <div><label for="f_mar">Marca</label><input id="f_mar" required></div>
  <div><label for="f_cat">Categoría</label><input id="f_cat" required></div>
  <div><label for="f_pes">Peso</label><input id="f_pes" required placeholder="0.50 kg"></div>
  <div><label for="f_pre">Presentación</label><input id="f_pre" required placeholder="12 und/caja"></div>
  <div><label for="f_alm">Almacenaje</label><select id="f_alm"><option>Ambiente seco</option><option>Ambiente fresco</option><option>Refrigerado</option></select></div>
  <div><label for="f_lot">Lote inicial</label><input id="f_lot" required placeholder="L-2511-X"></div>
  <div><label for="f_ven">Vencimiento</label><input id="f_ven" type="date" required></div>
  <div><label for="f_stk">Stock</label><input id="f_stk" type="number" min="1" required></div>
  <div><label for="f_ubi">Ubicación</label><input id="f_ubi" required placeholder="A-01-03"></div>
  <div><label for="f_img">Foto referencial (opcional)</label><input id="f_img" type="file" accept="image/*"></div></div>
  <button class="btn go full" type="submit">Registrar producto</button></form>`;
  m.innerHTML=head("Catálogo de productos")+`<div class="row noprint" style="margin-bottom:14px"><button class="btn sec" id="bpr">Imprimir códigos</button></div><div class="grid">${PRODUCTOS.map((x,i)=>`<div class="card pc">${foto(x,"lg")}<h3>${x.nombre}</h3><svg class="bc" id="bc-${i}"></svg><dl><dt>Marca</dt><dd>${x.marca}</dd><dt>Categoría</dt><dd>${x.cat}</dd><dt>Peso</dt><dd>${x.peso}</dd><dt>Presentación</dt><dd>${x.cajas}</dd><dt>Almacenaje</dt><dd>${x.alm}</dd><dt>Stock total</dt><dd>${LOTES.filter(l=>l.ean===x.ean).reduce((a,l)=>a+l.stock,0)} und</dd></dl></div>`).join("")}</div>`+(user.id==="supervisor"?form:"");
  PRODUCTOS.forEach((x,i)=>{try{JsBarcode("#bc-"+i,x.ean,{format:"CODE128",height:56,fontSize:14,margin:4})}catch(e){}});
  document.getElementById("bpr").onclick=()=>window.print();
  const f=document.getElementById("pf");
  if(f)f.onsubmit=e=>{e.preventDefault();const v=k=>document.getElementById("f_"+k).value.trim();
   if(prod(v("ean"))){toast("Ese código ya está registrado");return}
   const fin=img=>{PRODUCTOS.push({ean:v("ean"),nombre:v("nom"),marca:v("mar"),cat:v("cat"),peso:v("pes"),cajas:v("pre"),alm:v("alm"),img});
    LOTES.push({id:v("lot"),ean:v("ean"),venc:v("ven"),stock:parseInt(v("stk")),ubic:v("ubi")});toast("Producto registrado");render()};
   const fi=document.getElementById("f_img").files[0];
   if(fi){const rd=new FileReader();rd.onload=()=>fin(rd.result);rd.readAsDataURL(fi)}else fin(null)}}
 if(view==="reportes"){
  const por=LOTES.filter(l=>l.stock>0&&dias(l.venc)>=0&&dias(l.venc)<=30).length,ven=LOTES.filter(l=>l.stock>0&&dias(l.venc)<0).length;
  m.innerHTML=head("Reportes")+`<div class="kpis"><div class="kpi"><b>${PEDIDOS.length}</b><span>Pedidos</span></div><div class="kpi"><b>${ACTUALIZACIONES.length}</b><span>Movimientos</span></div><div class="kpi"><b>${por}</b><span>Lotes por vencer</span></div><div class="kpi"><b>${ven}</b><span>Lotes vencidos</span></div></div>
  <div class="grid"><div class="card"><h3>Descargar</h3><p style="color:var(--mute)">Incluye estado de los envíos, movimientos de lotes y estado de los lotes.</p><div class="row"><button class="btn go" id="bpdf">Descargar PDF</button><button class="btn sec" id="bcsv">Descargar Excel (CSV)</button></div></div>
  <div class="card"><h3>Enviar por correo</h3><label for="dest">Correo del destinatario</label><input id="dest" type="email" placeholder="jefe.almacen@empresa.com"><button class="btn full" id="bmail">Preparar correo</button><p style="color:var(--mute);font-size:.9rem">Se abre tu programa de correo con el resumen. Adjunta el PDF descargado antes de enviar.</p></div></div>`;
  document.getElementById("bpdf").onclick=descargarPDF;document.getElementById("bcsv").onclick=descargarCSV;document.getElementById("bmail").onclick=enviarCorreo}
 if(view==="producto"){
  m.innerHTML=head("Estado del producto")+`<div class="tw"><table><tr><th>Lote</th><th>Producto</th><th>Vence</th><th>Stock</th><th>Ubicación</th><th>Estado</th></tr>${[...LOTES].sort((a,b)=>a.venc.localeCompare(b.venc)).map(l=>{const[t,c]=estLote(l);return`<tr><td>${l.id}</td><td>${prod(l.ean).nombre}</td><td>${l.venc}</td><td>${l.stock}</td><td>${l.ubic}</td><td>${pill(t,c)}</td></tr>`}).join("")}</table></div>
  <p style="color:var(--mute)">Ordenado por fecha de vencimiento: los primeros lotes son los que deben salir antes.</p>`}
 if(view==="espec"){
  m.innerHTML=head("Especificación del envío")+selPedido()+`<div class="grid" style="margin-top:14px"><div class="card"><h3>Cliente</h3><dl><dt>Razón social</dt><dd>${p.cliente}</dd><dt>Dirección</dt><dd>${p.destino}</dd><dt>Pedido</dt><dd>${p.id}</dd><dt>Estado</dt><dd>${pill(p.estado,clsEnvio(p.estado))}</dd></dl></div>
  <div class="card"><h3>Productos enviados</h3>${p.items.map(i=>{const pr=prod(i.ean);return`<div class="pn" style="margin-top:12px">${foto(pr)}<p style="margin:0"><b>${pr.nombre}</b><br><span style="color:var(--mute)">${i.picked} de ${i.qty} und · ${pr.cajas} · ${pr.peso}</span></p></div>`}).join("")}</div></div>`;bindSel()}
}

/* ---------- Escaneo ---------- */
function showRes(){
 const r=document.getElementById("res");if(!r)return;
 if(!ultimo){r.innerHTML=`<h3>Producto escaneado</h3><p style="color:var(--mute)">Apunta la cámara al código de barras o usa una lectura simulada. Aquí verás las características del producto.</p>`;return}
 const pr=prod(ultimo),l=fifo(ultimo),it=ped().items.find(i=>i.ean===ultimo);
 r.innerHTML=`${foto(pr,"lg")}<h3 style="margin-top:10px">${pr.nombre}</h3><dl><dt>Código</dt><dd>${pr.ean}</dd><dt>Marca</dt><dd>${pr.marca}</dd><dt>Categoría</dt><dd>${pr.cat}</dd><dt>Peso</dt><dd>${pr.peso}</dd><dt>Presentación</dt><dd>${pr.cajas}</dd><dt>Almacenaje</dt><dd>${pr.alm}</dd></dl>
 <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
 ${l?`<p><b>Toma del lote ${l.id}</b> (FIFO)<br>Vence ${l.venc} · Ubicación ${l.ubic} · Stock ${l.stock}</p>`:`<p>${pill("Sin stock vigente","bad")}</p>`}
 ${it?`<p>Pedido ${ped().id}: ${it.picked}/${it.qty} recolectadas</p><div class="row"><input id="q" type="number" min="1" value="1" style="width:90px" aria-label="Cantidad"><button class="btn go" id="ok" ${l&&it.picked<it.qty&&!["En ruta","Entregado"].includes(ped().estado)?"":"disabled"}>Confirmar picking</button></div>`:`<p>${pill("Este producto no pertenece al pedido activo","warn")}</p>`}`;
 const ok=document.getElementById("ok");if(ok)ok.onclick=confirmar}
function onCode(c){
 if(!prod(c)){toast("Código no registrado: "+c);return}
 ultimo=c;if(navigator.vibrate)navigator.vibrate(60);showRes()}
function confirmar(){
 const p=ped(),it=p.items.find(i=>i.ean===ultimo),l=fifo(ultimo);let q=parseInt(document.getElementById("q").value)||1;
 q=Math.min(q,it.qty-it.picked,l.stock);const ant=l.stock;l.stock-=q;it.picked+=q;
 ACTUALIZACIONES.unshift({h:new Date().toLocaleTimeString("es-PE"),ped:p.id,lote:l.id,q,ant,nue:l.stock,u:user.nombre});
 const todo=p.items.every(i=>i.picked>=i.qty);if(p.estado==="Pendiente"||p.estado==="En picking"){const n=todo?"Cargado":"En picking";if(n!==p.estado)setEstado(p,n,todo?"Picking completo: pedido cargado":"Inicio de picking")}
 toast(todo?"Pedido completo y listo para carga":"Picking registrado");showRes()}
/* ---------- Reportes (PDF, CSV y correo) ---------- */
const H={env:["Pedido","Cliente","Ruta","Camión","Avance","Estado"],mov:["Hora","Pedido","Lote","Cantidad","Stock anterior","Stock nuevo","Usuario"],lot:["Lote","Producto","Vence","Stock","Ubicación","Estado"]};
function datosReporte(){
 return{env:PEDIDOS.map(x=>{const t=x.items.reduce((a,i)=>a+i.qty,0),k=x.items.reduce((a,i)=>a+i.picked,0);return[x.id,x.cliente,x.ruta,x.camion,k+"/"+t,x.estado+(x.entrega?" ("+x.entrega.fecha+")":"")]}),
  mov:ACTUALIZACIONES.map(a=>[a.h,a.ped,a.lote,"-"+a.q,a.ant,a.nue,a.u]),
  lot:[...LOTES].sort((a,b)=>a.venc.localeCompare(b.venc)).map(l=>[l.id,prod(l.ean).nombre,l.venc,l.stock,l.ubic,estLote(l)[0]])}}
function descargarPDF(){
 if(!window.jspdf){toast("No cargó la librería PDF. Revisa tu conexión a internet.");return}
 const doc=new window.jspdf.jsPDF(),r=datosReporte();
 doc.setFontSize(16);doc.text("WMS Alicorp - Reporte de picking y lotes",14,16);
 doc.setFontSize(10);doc.text("Generado: "+new Date().toLocaleString("es-PE")+"  |  Por: "+user.nombre+" ("+user.rol+")",14,23);
 let y=32;
 [["Estado de los envíos","env"],["Movimientos de lotes","mov"],["Estado de los lotes","lot"]].forEach(([t,k])=>{
  if(y>250){doc.addPage();y=16}
  doc.setFontSize(12);doc.text(t,14,y);
  doc.autoTable({startY:y+3,head:[H[k]],body:r[k].length?r[k]:[["Sin registros"]],styles:{fontSize:9},headStyles:{fillColor:[11,79,124]}});
  y=doc.lastAutoTable.finalY+12});
 doc.save("reporte-wms-alicorp.pdf");toast("PDF descargado")}
function descargarCSV(){
 const r=datosReporte(),f=a=>a.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(";");
 const txt=["ENVIOS",f(H.env),...r.env.map(f),"","MOVIMIENTOS",f(H.mov),...r.mov.map(f),"","LOTES",f(H.lot),...r.lot.map(f)].join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+txt],{type:"text/csv;charset=utf-8"}));a.download="reporte-wms-alicorp.csv";a.click();URL.revokeObjectURL(a.href);toast("Archivo descargado")}
function enviarCorreo(){
 const to=document.getElementById("dest").value.trim();
 if(!/^\S+@\S+\.\S+$/.test(to)){toast("Escribe un correo válido");return}
 const r=datosReporte(),cuerpo="Reporte WMS Alicorp\n\n"+r.env.map(x=>x[0]+" - "+x[1]+": "+x[5]+" (avance "+x[4]+")").join("\n")+"\n\nAdjunto el PDF completo.";
 location.href="mailto:"+to+"?subject="+encodeURIComponent("Reporte WMS Alicorp")+"&body="+encodeURIComponent(cuerpo)}
/* ---------- Seguimiento del envío ---------- */
function setEstado(p,e,txt){p.estado=e;(p.hist=p.hist||[]).unshift({h:new Date().toLocaleString("es-PE"),txt:txt||"Estado: "+e,u:user.nombre})}
function seguimiento(p){
 const k=ESTADOS.indexOf(p.estado);
 const pasos=`<ul class="steps">${ESTADOS.map((e,i)=>`<li class="${i<=k?"on":""}">${e}</li>`).join("")}</ul>`;
 let acc;
 if(p.estado==="Cargado")acc=`<p>El pedido está cargado. Registra la salida cuando el camión parta.</p><button class="btn go" id="bsal">Registrar salida del camión</button>`;
 else if(p.estado==="En ruta")acc=`<label for="rec">Recibido por (nombre de quien recibe)</label><input id="rec" placeholder="Nombre y apellido"><button class="btn go full" id="bent">Confirmar entrega</button>`;
 else if(p.estado==="Entregado")acc=`<p>${pill("Entregado","ok")} ${p.entrega?p.entrega.fecha+" · recibido por <b>"+p.entrega.receptor+"</b>":"Marcado por el supervisor"}</p>`;
 else acc=`<p style="color:var(--mute)">Completa el picking de todos los productos para habilitar la salida del camión.</p>`;
 const hist=(p.hist&&p.hist.length)?`<h3 style="margin-top:20px">Historial</h3><ul class="route">${p.hist.map(x=>`<li class="done"><b>${x.txt}</b><br><small style="color:var(--mute)">${x.h} · ${x.u}</small></li>`).join("")}</ul>`:"";
 return`<div class="card" style="margin-top:14px"><h3>Seguimiento del envío</h3>${pasos}${acc}${hist}</div>`}
function bindSeg(){
 const p=ped(),s=document.getElementById("bsal"),e=document.getElementById("bent");
 if(s)s.onclick=()=>{setEstado(p,"En ruta","Salida del camión "+p.camion);toast("Salida registrada");render()};
 if(e)e.onclick=()=>{const r=document.getElementById("rec").value.trim();if(!r){toast("Escribe quién recibió el pedido");return}
  p.entrega={fecha:new Date().toLocaleString("es-PE"),receptor:r};setEstado(p,"Entregado","Entregado a "+r);toast("Entrega confirmada");render()}}
async function startScan(){
 try{stopScan();scanner=new Html5Qrcode("reader",{formatsToSupport:[Html5QrcodeSupportedFormats.CODE_128,Html5QrcodeSupportedFormats.EAN_13,Html5QrcodeSupportedFormats.QR_CODE],verbose:false});
  await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:280,height:120}},t=>{onCode(t)},()=>{})}
 catch(e){toast("No se pudo abrir la cámara. Revisa los permisos o usa el ingreso manual.")}}
function stopScan(){if(scanner){const s=scanner;scanner=null;s.stop().then(()=>s.clear()).catch(()=>{})}}