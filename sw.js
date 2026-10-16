/* Service worker do App do Corretor: abre sem internet e guarda as fotos das fichas. */
const VERSAO = 'corretor-20261015c';
const CASCA = [
  './', 'index.html', 'app.css?v=20261015b', 'app.js?v=20261015b', 'manifest.webmanifest',
  'img/logo-fortal.png', 'icons/icon-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'
];
const FOTOS = 'corretor-fotos';
const MAX_FOTOS = 250;

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  // só apaga caches do próprio app: o Cache Storage é do site inteiro e o app dos Espelhos usa o mesmo endereço
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('corretor-') && k !== VERSAO && k !== FOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function aparar(){
  const c = await caches.open(FOTOS), ks = await c.keys();
  for(let i = 0; i < ks.length - MAX_FOTOS; i++) await c.delete(ks[i]);
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if(req.method !== 'GET') return;   // consultas ao servidor (POST) passam direto
  const url = new URL(req.url);
  // páginas: rede primeiro, casca salva sem internet
  if(req.mode === 'navigate' && url.origin === location.origin && url.pathname.startsWith('/corretor/')){
    ev.respondWith(fetch(req).then(r => { if(r.ok){ const cp = r.clone(); ev.waitUntil(caches.open(VERSAO).then(c => c.put('index.html', cp))); } return r; })
      .catch(() => caches.match('index.html', {ignoreSearch: true}).then(r => r || Response.error())));
    return;
  }
  // arquivos do app: cache primeiro
  if(url.origin === location.origin && url.pathname.startsWith('/corretor/')){
    ev.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if(res.ok){ const cp = res.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); }
      return res;
    })));
    return;
  }
  // fontes do Google: a salva primeiro (o endereço muda quando a fonte muda)
  if(url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com'){
    ev.respondWith(caches.open(FOTOS).then(async c => {
      const salvo = await c.match(req);
      if(salvo) return salvo;
      return fetch(req).then(res => { if(res.ok){ c.put(req, res.clone()); } return res; }).catch(() => Response.error());
    }));
    return;
  }
  // fotos e fichas da central (mesmo site, /espelhos/nex/): usa a salva e atualiza por trás
  if(url.origin === location.origin && url.pathname.startsWith('/espelhos/nex/') && /\.(jpg|jpeg|png|webp|json)$/i.test(url.pathname)){
    ev.respondWith(caches.open(FOTOS).then(async c => {
      const salvo = await c.match(req);
      const rede = fetch(req).then(res => { if(res.ok){ c.put(req, res.clone()).then(aparar); } return res; }).catch(() => salvo || Response.error());
      if(/\.json$/i.test(url.pathname)) return rede;   // ficha: prefere a da rede (sem internet, a salva)
      if(salvo){ ev.waitUntil(rede.catch(() => {})); return salvo; }
      return rede;
    }));
  }
});
