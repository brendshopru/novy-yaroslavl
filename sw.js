const CACHE='ny-shell-c0475626e7a41512';
const STATIC=['./','./manifest.webmanifest','./icons/icon-192-c0475626e7a41512.png','./icons/icon-512-c0475626e7a41512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const r=event.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  const u=new URL(r.url);
  // Always get site data/scripts from network so admin/GitHub updates appear immediately.
  if(u.pathname.endsWith('/data.js')||u.pathname.endsWith('/app.js')||u.pathname.endsWith('/styles.css')||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/manifest.webmanifest')){
    event.respondWith(fetch(r,{cache:'no-store'}).catch(()=>caches.match(r).then(x=>x||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy));return res}).catch(()=>cached)));
});
