// Service worker do Treino: deixa o app abrir sem internet (academia sem sinal).
// Páginas: rede primeiro com limite de 3 s, depois cache — atualizações chegam sozinhas.
// Fontes do Google: cache primeiro, porque não mudam.
const CACHE="treino-v5",FONTS="treino-fonts";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FONTS).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
const withTimeout=(p,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>no(new Error("timeout")),ms);p.then(r=>{clearTimeout(t);ok(r);},err=>{clearTimeout(t);no(err);});});

self.addEventListener("fetch",e=>{
  const req=e.request;if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(FONTS).then(async c=>{
      const hit=await c.match(req);
      if(hit)return hit;
      const r=await fetch(req);
      if(r&&(r.ok||r.type==="opaque"))c.put(req,r.clone());
      return r;
    }));
    return;
  }
  if(url.origin!==self.location.origin)return;
  e.respondWith(
    withTimeout(fetch(req),3000).then(r=>{
      if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp));}
      return r;
    }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match("./index.html")))
  );
});
