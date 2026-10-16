/* App do Corretor · Fortal · 2.0
   Lê os espelhos ao vivo (Supabase do app dos Espelhos) com o código do time.
   Telas: Início, Imóveis (filtro completo por projeto ou por unidade), Pregão, Ficha do projeto,
   Tabelas, Posts e envio ao cliente. Layout de celular (barra embaixo) e de computador (barra lateral). */
'use strict';
(() => {
  // ================= configuração =================
  const CFG = {url: 'https://dptchfjbotmddaniuzvr.supabase.co', key: 'sb_publishable_K9--vOhW8y5ldlbwzo6m_Q_g_gB9rYP'};
  const NO_AR = location.hostname === 'luizmiguel08.github.io';
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);   // teste local: espelho copiado em /espelhos/
  const ESP = (NO_AR || LOCAL) ? '/espelhos/' : 'https://luizmiguel08.github.io/espelhos/';
  const FN_FOTO = CFG.url + '/functions/v1/corretor-foto';
  const VERSAO = '2.2.1, de 16/10/2026';
  const K = {cod: 'espelhos-codigo', cor: 'espelhos-corretor', dono: 'espelhos-dono', cache: 'corretor-resumo-v2', tema: 'corretor-tema', filtro: 'corretor-filtro-v2'};
  const TZ = 'America/Sao_Paulo';
  const MQ_LARGO = matchMedia('(min-width: 1024px)');
  const largo = () => MQ_LARGO.matches;
  const MQ_TABELA = matchMedia('(min-width: 1320px)');   // tabela de 11 colunas do projeto: só com espaço para ela inteira
  const tabelaLarga = () => MQ_TABELA.matches;
  const ehToque = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
  const menosMov = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================= utilidades =================
  const LS = {
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k, v){ try{ localStorage.setItem(k, v); return true; }catch(e){ return false; } },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };
  const SS = {
    get(k){ try{ return JSON.parse(sessionStorage.getItem(k) || 'null'); }catch(e){ return null; } },
    set(k, v){ try{ sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const num = v => (v == null || v === '' || isNaN(+v)) ? null : +v;
  const BRL = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const BRLc = v => v >= 1e6 ? 'R$ ' + (Math.round(v / 1e4) / 100).toLocaleString('pt-BR') + ' mi' : 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  const BRLmi = v => {
    if(!(v > 0)) return 'R$ 0';
    if(v >= 1e7) return 'R$ ' + Math.round(v / 1e6).toLocaleString('pt-BR') + ' mi';
    if(v >= 1e6) return 'R$ ' + (Math.round(v / 1e5) / 10).toLocaleString('pt-BR') + ' mi';
    return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  };
  const milTxt = v => v >= 1e6 ? (Math.round(v / 1e5) / 10).toLocaleString('pt-BR') + ' mi' : Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  const fmtM2 = v => (Number.isInteger(+v) ? String(+v) : (+v).toLocaleString('pt-BR', {maximumFractionDigits: 2})) + ' m²';
  const pct = (a, b) => b > 0 ? Math.round(a / b * 1000) / 10 : 0;
  const pctTxt = v => v.toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';
  const plural = (n, um, varios) => n.toLocaleString('pt-BR') + ' ' + (n === 1 ? um : varios);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const fH = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, hour: '2-digit', minute: '2-digit'});
  const fDia = new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'});
  const fDM = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, day: '2-digit', month: '2-digit'});
  const fDMA = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric'});
  const fLonga = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long'});
  const fSem = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'short'});
  const fHoraNum = new Intl.DateTimeFormat('en-GB', {timeZone: TZ, hour: '2-digit', hour12: false});
  const hora = ms => fH.format(ms);
  const diaKey = ms => fDia.format(ms);
  const maiusc1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const quandoTxt = ms => {
    if(!isFinite(ms)) return '';
    const d = diaKey(ms), h = diaKey(Date.now()), o = diaKey(Date.now() - 864e5);
    return d === h ? hora(ms) : d === o ? 'ontem ' + hora(ms) : fDM.format(ms) + ' ' + hora(ms);
  };
  const mesAno = ym => { if(!ym || !/^\d{4}-\d{2}/.test(ym)) return null; return MESES[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4); };
  const mesAnoCurto = ymd => { if(!ymd || !/^\d{4}-\d{2}/.test(ymd)) return ''; return MES3[+ymd.slice(5, 7) - 1] + '/' + ymd.slice(0, 4); };
  const primeiroNome = s => String(s || '').trim().split(/\s+/)[0] || '';
  const urlImg = u => { if(!u) return null; u = String(u); if(/^https:\/\//i.test(u)) return u; if(/^nex\/[A-Za-z0-9/_.-]+$/.test(u)) return ESP + u; return null; };
  const urlSegura = u => /^https:\/\//i.test(String(u || '')) ? String(u) : null;
  const driveArq = id => 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view';
  const drivePasta = id => 'https://drive.google.com/drive/folders/' + encodeURIComponent(id);
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'arquivo';
  const distKm = (a, b) => {
    const R = 6371, rad = x => x * Math.PI / 180;
    const dLa = rad(b.lat - a.lat), dLo = rad(b.lng - a.lng);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const kmTxt = d => d < 1 ? Math.round(d * 1000 / 50) * 50 + ' m' : (Math.round(d * 10) / 10).toLocaleString('pt-BR') + ' km';

  const svg = (d, sw) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const ICO = {
    voltar: svg('<path d="M15 18l-6-6 6-6"/>', 2),
    seta: svg('<path d="M9 6l6 6-6 6"/>', 2),
    baixo: svg('<path d="M6 9l6 6 6-6"/>', 2),
    lupa: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    filtro: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', 1.9),
    enviar: svg('<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>', 2),
    fechar: svg('<path d="M6 6l12 12M18 6L6 18"/>', 2),
    x: '<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    ok: svg('<path d="M5 12l5 5 9-10"/>', 3),
    zap: svg('<path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z"/>', 1.9),
    nuvem: svg('<path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5.5 12a11 11 0 0 1 13 0"/><path d="M9 15.5a6 6 0 0 1 6 0"/><path d="M3 3l18 18"/>'),
    foto: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'),
    fotos: svg('<rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V7"/><path d="M3 13l4-4 4 4 3-3 3 3"/>'),
    baixar: svg('<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>', 2),
    compartilhar: svg('<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>', 1.9),
    copiar: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>', 1.9),
    arquivo: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>'),
    planilha: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>'),
    mira: svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    pino: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    grade: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    lista: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    ampliar: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    anterior: svg('<path d="M15 18l-6-6 6-6"/>', 2.2),
    proxima: svg('<path d="M9 6l6 6-6 6"/>', 2.2),
    relogio: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 1.9),
    imprimir: svg('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>')
  };

  const GRUPOS = {
    one: {n: 'ONE', l: 'ONE Innovation', s: 'ONE'}, vitacon: {n: 'Vitacon', l: 'Vitacon', s: 'VTC'}, maskan: {n: 'Maskan', l: 'Maskan', s: 'MSK'},
    trisul: {n: 'Trisul', l: 'Trisul', s: 'TRI'}, canopus: {n: 'Canopus', l: 'Canopus', s: 'CNP'}, vitaurbana: {n: 'VitaUrbana', l: 'VitaUrbana', s: 'VU'},
    jra: {n: 'JRA', l: 'JRA', s: 'JRA'}, revenda: {n: 'Revenda ONE', l: 'Revenda ONE', s: 'REV'}, mundoapto: {n: 'Mundo Apto', l: 'Mundo Apto', s: 'MA'}
  };
  const ORDEM_GRUPOS = ['one', 'vitacon', 'maskan', 'trisul', 'canopus', 'vitaurbana', 'mundoapto', 'jra', 'revenda'];
  const nomeGrupo = k => GRUPOS[k] ? GRUPOS[k].n : ((S.P.find(p => p.grupo === k) || {}).construtora || k);
  const gruposPresentes = () => { const ks = new Set(S.P.map(p => p.grupo).filter(Boolean)); return ORDEM_GRUPOS.filter(k => ks.has(k)).concat([...ks].filter(k => !ORDEM_GRUPOS.includes(k)).sort()); };
  const FASE = {lanc: 'Lançamento', breve: 'Breve lançamento', obras: 'Em obras', pronto: 'Pronto para morar'};
  const FASE_CURTA = {lanc: 'Lançamento', breve: 'Breve', obras: 'Em obras', pronto: 'Pronto'};
  const ZONA = {centro: 'Centro', oeste: 'Oeste', sul: 'Sul', leste: 'Leste', norte: 'Norte', gsp: 'Grande SP'};
  const TIPOS = [['S', 'Studio'], ['1', '1 dorm.'], ['2', '2 dorms'], ['3', '3 dorms ou +'], ['L', 'Loja']];
  const CATS = [['R', 'Mercado (R2V)'], ['H1', 'HIS 1'], ['H2', 'HIS 2'], ['H', 'HIS'], ['P', 'HMP'], ['N', 'Não residencial']];
  const CAT_TXT = {R: 'R2V', H1: 'HIS 1', H2: 'HIS 2', H: 'HIS', P: 'HMP', N: 'NR', F: 'Fachada ativa'};
  const EXTRAS = [['mob', 'Mobiliado', 1], ['pcd', 'PCD / adaptável', 2], ['gd', 'Garden', 4], ['cob', 'Cobertura ou duplex', 32], ['promo', 'Em promoção', 16], ['dist', 'Distrato', 8]];
  const BIT = Object.fromEntries(EXTRAS.map(x => [x[0], x[2]]));
  const quemDe = p => p.construtora || (GRUPOS[p.grupo] ? GRUPOS[p.grupo].l : '');
  const siglaDe = p => GRUPOS[p.grupo] ? GRUPOS[p.grupo].s : String(p.nome || '?').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  const nomeCurto = p => p.curto || p.nome;
  const NOS_B = /^(jardins|campos el[ií]seos)$/i;
  const NA_B = /^(vila|bela vista|consola|liberdade|mooca|lapa|penha|aclima|barra funda|sa[uú]de|[aá]gua branca|rep[uú]blica|s[eé]$|luz|ch[aá]cara|granja|cidade|pra[cç]a|aldeia)/i;
  const EM_B = /^(mirand[oó]polis|perdizes|pinheiros|moema|higien[oó]polis|santana|campos el[ií]seos|pomp[eé]ia|indian[oó]polis|interlagos|santa cec[ií]lia|santo amaro|alphaville|osasco|guarulhos|barueri|cotia|cerqueira c[eé]sar|parelheiros|guaianases|itaquera|sapopemba|campinas|sorocaba)/i;
  const noBairro = b => b ? (NOS_B.test(b) ? 'nos ' : NA_B.test(b) ? 'na ' : EM_B.test(b) ? 'em ' : 'no ') + b : '';
  const entregaTxt = p => p.fase === 'pronto' ? 'pronto para morar' : (mesAno(p.entrega) ? 'entrega em ' + mesAno(p.entrega) : 'entrega a definir');
  const entregaCurta = p => p.fase === 'pronto' ? 'Pronto' : (p.entrega ? mesAnoCurto(p.entrega) : 'A definir');
  function tiposTxt(t, amin, amax){
    t = t || ''; const partes = [];
    if(t.includes('S')) partes.push('studios');
    if(t.includes('1')) partes.push('1 dorm.');
    if(t.includes('2')) partes.push('2 dorms');
    if(t.includes('3')) partes.push('3 dorms ou +');
    if(!partes.length && t.includes('L')) partes.push('lojas');
    let txt = partes.length ? (partes.length === 1 ? partes[0] : partes.slice(0, -1).join(', ') + ' e ' + partes[partes.length - 1]) : '';
    if(amin && amax) txt += (txt ? ' de ' : '') + (Math.round(amin) === Math.round(amax) ? fmtM2(Math.round(amin)) : Math.round(amin) + ' a ' + fmtM2(Math.round(amax)));
    return maiusc1(txt);
  }
  const tipoNome = k => ({S: 'Studio', 1: '1 dorm.', 2: '2 dorms', 3: '3 dorms ou +', L: 'Loja'}[k] || '');

  // ================= estado =================
  const F0 = () => ({q: '', cons: [], fases: [], zonas: [], bairros: [], pmin: 0, pmax: 0, modo: 'pp', tipos: [], amin: 0, amax: 0, m2: 0, andar: 0, vaga: 0, ent: '', cats: [], extras: [], mov: '', perto: null, livres: true, ordem: 'vendidos', ver: 'projetos', mostra: 12});
  const S = {
    cod: LS.get(K.cod), carregado: false, offline: false, carregando: null, resumo: null, geradoEm: 0,
    P: [], byId: new Map(), M: [], dias7: [], hoje: '', U: null, Uem: 0, Ucarregando: null, Uerro: false,
    det: new Map(), central: new Map(), centralV: new Map(), sel: new Map(),
    f: Object.assign(F0(), SS.get(K.filtro) || {}),
    ui: {rank: 'vendas', feed: 'tudo', feedMostra: 14, tabModo: {}, tabFiltro: 'livres', tabSel: new Map(), tabAberta: null, tabQ: '', tabTipo: '', listaQ: '', bairroQ: '', unidMostra: 40,
      tabVista: LS.get('corretor-tab-vista') === 'lista' ? 'lista' : 'espelho', espDenso: LS.get('corretor-esp-denso') === '1', espPreco: true, ef: null, efMais: false},
    scroll: {}
  };
  if(S.f.perto && !(S.f.perto.lat && S.f.perto.lng)) S.f.perto = null;
  const perfil = () => { try{ return JSON.parse(LS.get(K.cor) || '{}') || {}; }catch(e){ return {}; } };
  const salvarPerfil = o => LS.set(K.cor, JSON.stringify(Object.assign(perfil(), o || {})));
  function dono(){   // mesmo identificador do app dos Espelhos: os links criados aqui aparecem em "Enviadas" lá
    let d = LS.get(K.dono);
    if(!d || !/^[A-Za-z0-9_-]{16,64}$/.test(d)){
      const a = new Uint8Array(12); crypto.getRandomValues(a);
      d = btoa(String.fromCharCode.apply(null, a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      LS.set(K.dono, d);
    }
    return d;
  }

  // ================= servidor =================
  async function rpc(fn, args, ms){
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctl ? setTimeout(() => ctl.abort(), ms || 25000) : null;
    try{
      const r = await fetch(CFG.url + '/rest/v1/rpc/' + fn, {method: 'POST', headers: {apikey: CFG.key, 'Content-Type': 'application/json'}, body: JSON.stringify(args || {}), cache: 'no-store', signal: ctl ? ctl.signal : undefined});
      const txt = await r.text();
      if(!r.ok){ const e = new Error('rpc ' + fn + ' ' + r.status); e.status = r.status; e.body = txt; throw e; }
      return txt ? JSON.parse(txt) : null;
    }finally{ if(t) clearTimeout(t); }
  }
  const codigoInvalido = e => !!(e && e.body && /codigo_invalido/.test(e.body));

  function aplicarResumo(r){
    const cp = r.campos_p || [], cm = r.campos_m || [];
    const ip = Object.fromEntries(cp.map((k, i) => [k, i])), im = Object.fromEntries(cm.map((k, i) => [k, i]));
    const g = (a, k) => ip[k] == null ? null : a[ip[k]];
    S.P = (r.p || []).map(a => ({
      id: g(a, 'id'), nome: g(a, 'nome') || g(a, 'id'), grupo: g(a, 'grupo'), construtora: g(a, 'construtora'), bairro: g(a, 'bairro'), zona: g(a, 'zona'),
      fase: g(a, 'fase'), entrega: g(a, 'entrega'), livres: +g(a, 'livres') || 0, reservadas: +g(a, 'reservadas') || 0, processo: +g(a, 'processo') || 0,
      vendidas: +g(a, 'vendidas') || 0, total: +g(a, 'total') || 0, preco: num(g(a, 'preco')), avista: num(g(a, 'avista')), tipos: g(a, 'tipos') || '',
      amin: num(g(a, 'area_min')), amax: num(g(a, 'area_max')), capa: urlImg(g(a, 'capa')), destaque: g(a, 'destaque'), tabela: g(a, 'tabela'),
      tabelaEm: g(a, 'tabela_em'), faseTxt: g(a, 'fase_txt'), curto: g(a, 'curto'), endereco: g(a, 'endereco'), atualizadoEm: g(a, 'atualizado_em'),
      lat: num(g(a, 'lat')), lng: num(g(a, 'lng')), cidade: g(a, 'cidade'), vaga: g(a, 'vaga'), pm2: num(g(a, 'pm2')),
      cats: String(g(a, 'cats') || '').split(',').filter(Boolean), flags: g(a, 'flags') || '', nFotos: +g(a, 'n_fotos') || 0,
      v7: 0, r7: 0, p7: 0, vh: 0, rh: 0
    })).filter(p => p.id);
    S.byId = new Map(S.P.map(p => [p.id, p]));
    const gm = (a, k) => im[k] == null ? null : a[im[k]];
    S.M = (r.m || []).map(a => {
      const para = gm(a, 'para');
      return {p: gm(a, 'projeto'), n: String(gm(a, 'n')), de: gm(a, 'de'), para, em: (+gm(a, 'em') || 0) * 1000, preco: num(gm(a, 'preco')), area: num(gm(a, 'area')), tl: gm(a, 'tipologia'), agora: gm(a, 'agora'),
        tipo: para === 'vendida' ? 'venda' : para === 'reservada' ? 'reserva' : para === 'processo_final' ? 'processo' : para === 'disponivel' ? 'voltou' : 'outro'};
    }).filter(m => S.byId.has(m.p)).sort((x, y) => y.em - x.em);
    S.hoje = diaKey(Date.now());
    S.dias7 = []; for(let i = 6; i >= 0; i--) S.dias7.push(diaKey(Date.now() - i * 864e5));
    const set7 = new Set(S.dias7);
    for(const m of S.M){
      m.dia = diaKey(m.em);
      const p = S.byId.get(m.p);
      if(set7.has(m.dia)){ if(m.tipo === 'venda') p.v7++; else if(m.tipo === 'reserva') p.r7++; else if(m.tipo === 'processo') p.p7++; }
      if(m.dia === S.hoje){ if(m.tipo === 'venda') p.vh++; else if(m.tipo === 'reserva') p.rh++; }
    }
    S.resumo = r; S.geradoEm = Date.parse(r.gerado_em) || Date.now();
    const robo = r.robo || {}; let mx = 0; for(const k in robo){ const t = Date.parse(robo[k]); if(t > mx) mx = t; }
    S.lidoEm = mx || S.geradoEm;
    S.carregado = true;
    // unidades marcadas que saíram do espelho
    for(const [k, v] of S.sel){ if(!S.byId.has(v.p)) S.sel.delete(k); }
  }

  async function carregar(motivo){
    if(!S.cod) return;
    if(S.carregando) return S.carregando;
    S.carregando = (async () => {
      const antes = S.carregado ? assinatura() : null;
      try{
        const r = await rpc('corretor_resumo', {p_codigo: S.cod});
        aplicarResumo(r); S.offline = false; S.cacheEm = 0;
        LS.set(K.cache, JSON.stringify({em: Date.now(), r}));
        const mudou = antes === null || assinatura() !== antes;
        if(motivo === 'auto'){ if(mudou) refrescar(); }
        else if(antes === null || rotaAtual === null) render();
        else if(mudou) refrescar();
        if(!S.U || (mudou && Date.now() - S.Uem > 120000)) setTimeout(() => carregarUnidades(), S.U ? 0 : 900);
      }catch(e){
        if(codigoInvalido(e)){ sair('Esse código não vale mais. Peça o código novo ao Luiz e digite de novo.'); return; }
        const era = S.offline; S.offline = true;
        if(!S.carregado){
          const c = cacheLido();
          if(c){ aplicarResumo(c.r); S.cacheEm = c.em; }
          render();
        }else if(!era) refrescar();
      }finally{ S.carregando = null; }
    })();
    return S.carregando;
  }
  function cacheLido(){ try{ const c = JSON.parse(LS.get(K.cache) || 'null'); return c && c.r ? c : null; }catch(e){ return null; } }

  // índice das unidades livres (texto compacto: unidades por ";" e campos por "|")
  function aplicarUnidades(r){
    const mapa = new Map();
    for(const pid in (r.u || {})){
      if(!S.byId.has(pid)) continue;
      const arr = [];
      for(const lin of String(r.u[pid]).split(';')){
        if(!lin) continue;
        const c = lin.split('|');
        const at = c[3] === '' || c[3] == null ? null : c[3];
        arr.push({n: c[0], k: c[1] || null, a: c[2] ? +c[2] : null, at, an: at != null && /^\d+$/.test(at) ? +at : null,
          p: c[4] ? +c[4] : null, pv: c[5] ? +c[5] : null, c: c[6] || null, vg: c[7] === '' || c[7] == null ? null : +c[7], f: c[8] ? +c[8] : 0});
      }
      mapa.set(pid, arr);
    }
    S.U = mapa; S.Uem = Date.now(); S.Uversao = r.versao; S.Uerro = false;
  }
  async function carregarUnidades(forcar){
    if(!S.cod) return null;
    if(S.Ucarregando) return S.Ucarregando;
    if(S.U && !forcar && Date.now() - S.Uem < 120000) return S.U;
    S.Ucarregando = (async () => {
      try{ const r = await rpc('corretor_unidades', {p_codigo: S.cod}, 40000); aplicarUnidades(r); }
      catch(e){ if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return null; } S.Uerro = true; }
      finally{ S.Ucarregando = null; }
      if(location.hash === '#/imoveis' && !document.querySelector('dialog[open]:not(#folha-filtros)')) atualizarImoveis();
      return S.U;
    })();
    return S.Ucarregando;
  }

  async function detalhe(id, forcar){
    const c = S.det.get(id);
    if(c && !forcar && (c.pr || Date.now() - c.em < 60000)) return c.pr || c.v;
    const pr = rpc('corretor_projeto', {p_codigo: S.cod, p_id: id}).then(v => { S.det.set(id, {v, em: Date.now()}); return v; })
      .catch(e => { if(c && c.v){ S.det.set(id, c); return c.v; } S.det.delete(id); throw e; });
    S.det.set(id, {pr, v: c && c.v, em: c ? c.em : 0});
    return pr;
  }
  function fichaCentral(id){   // ficha completa da central de produto (mesmo site, pasta /espelhos/nex/p/)
    if(S.central.has(id)) return S.central.get(id);
    const pr = fetch(ESP + 'nex/p/' + encodeURIComponent(id) + '.json', {cache: 'no-cache'})
      .then(r => r.ok ? r.json() : null)
      .then(v => { const c = (v && v.id === id) ? v : null; S.centralV.set(id, c); return c; })
      .catch(() => { S.central.delete(id); S.centralV.set(id, null); return null; });
    S.central.set(id, pr);
    return pr;
  }
  const imgCentral = (c, id, mini) => c && c.pasta ? ESP + 'nex/' + c.pasta + (mini ? 't' : '') + id + '.jpg' : null;

  // ================= estatísticas =================
  function stats(){
    const vend7 = S.M.filter(m => m.tipo === 'venda' && S.dias7.includes(m.dia));
    const comPreco = vend7.filter(m => m.preco > 0);
    const hoje = S.M.filter(m => m.dia === S.hoje);
    const vendHoje = hoje.filter(m => m.tipo === 'venda');
    return {
      vend7: vend7.length, vgv7: comPreco.reduce((s, m) => s + m.preco, 0), vend7Preco: comPreco.length,
      res7: S.M.filter(m => m.tipo === 'reserva' && S.dias7.includes(m.dia)).length,
      proc7: S.M.filter(m => m.tipo === 'processo' && S.dias7.includes(m.dia)).length,
      hoje, vendHoje: vendHoje.length, vgvHoje: vendHoje.filter(m => m.preco > 0).reduce((s, m) => s + m.preco, 0), vendHojePreco: vendHoje.filter(m => m.preco > 0).length,
      resHoje: hoje.filter(m => m.tipo === 'reserva').length, procHoje: hoje.filter(m => m.tipo === 'processo').length, voltHoje: hoje.filter(m => m.tipo === 'voltou').length
    };
  }
  const rankingDe = modo => {
    const k = modo === 'reservas' ? 'r7' : 'v7', o = modo === 'reservas' ? 'v7' : 'r7';
    return S.P.filter(p => p.v7 + p.r7 > 0).sort((a, b) => (b[k] - a[k]) || (b[o] - a[o]) || (b.livres - a.livres));
  };
  const statusTxt = m => m.tipo === 'venda' ? 'vendida' : m.tipo === 'reserva' ? 'reservada' : m.tipo === 'processo' ? 'em processo' : m.tipo === 'voltou' ? 'voltou' : (m.para || '');
  const statusCls = m => m.tipo === 'venda' ? 'st-vendida' : m.tipo === 'voltou' ? 'st-voltou' : m.tipo === 'processo' ? 'st-processo' : 'st-reservada';
  const vendasPorDia = () => S.dias7.map(d => ({d, n: S.M.filter(m => m.dia === d && m.tipo === 'venda').length}));

  // ================= imagens =================
  const LARG_NEXT = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
  function tamImg(u, w){   // pede a foto do tamanho certo quando o site deixa (Drive e Vitacon)
    if(!u) return u;
    if(/^https:\/\/lh3\.googleusercontent\.com\//.test(u)) return u.replace(/=[swh]\d+[^/]*$/i, '') + '=w' + w;
    const m = /^https:\/\/vitacon\.com\.br\/_next\/image\/?\?(.*)$/.exec(u);
    if(m){ const q = new URLSearchParams(m[1]); q.set('w', String(LARG_NEXT.find(x => x >= w) || 3840)); q.set('q', '82'); return 'https://vitacon.com.br/_next/image/?' + q.toString(); }
    return u;
  }
  function original(u){   // a maior versão, para baixar e mandar ao cliente
    if(/^https:\/\/lh3\.googleusercontent\.com\//.test(u)) return u.replace(/=[swh]\d+[^/]*$/i, '') + '=s0';
    const m = /^https:\/\/vitacon\.com\.br\/_next\/image\/?\?(.*)$/.exec(u);
    if(m){ const q = new URLSearchParams(m[1]); const o = q.get('url'); if(o && /^https:\/\//.test(o)) return o; }
    return u;
  }
  const temTamanhos = u => /^https:\/\/(lh3\.googleusercontent\.com|vitacon\.com\.br\/_next\/image)/.test(u || '');
  function imgTag(src, alt, cls, o){
    if(!src) return '';
    o = o || {};
    const w = o.w || 800;
    const ext = /^https?:/i.test(src) && !src.startsWith(location.origin);
    let a = '<img src="' + esc(tamImg(src, w)) + '"';
    if(temTamanhos(src) && !o.semSet) a += ' srcset="' + esc([Math.round(w / 2), w, w * 2].map(x => tamImg(src, x) + ' ' + x + 'w').join(', ')) + '" sizes="' + esc(o.sizes || '100vw') + '"';
    a += ' alt="' + esc(alt || '') + '"' + (cls ? ' class="' + cls + '"' : '') + (o.prioridade ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' + (ext ? ' referrerpolicy="no-referrer"' : '');
    if(o.sigla != null) a += ' data-sigla="' + esc(o.sigla) + '"';
    if(o.troca) a += ' data-troca="' + esc(o.troca) + '"';
    return a + (o.extra || '') + '>';
  }
  const capaVazia = (p, cls) => '<span class="capa-vazia' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><b>' + esc(siglaDe(p)) + '</b><small>Foto em breve</small></span>';
  function capaProj(p, o){   // foto do projeto com a moldura e a reserva para quando não abre
    o = o || {};
    if(!p.capa) return capaVazia(p, o.cls);
    return imgTag(p.capa, o.alt != null ? o.alt : 'Foto do ' + p.nome, o.cls || '', {w: o.w || 800, sizes: o.sizes, prioridade: o.prioridade, sigla: siglaDe(p)});
  }
  document.addEventListener('error', ev => {   // foto que não abriu vira a moldura com a sigla da construtora
    const t = ev.target;
    if(!t || t.tagName !== 'IMG' || t.dataset.falhou) return;
    t.dataset.falhou = '1';
    if(t.dataset.troca){ const alt = t.dataset.troca; t.removeAttribute('data-troca'); t.removeAttribute('srcset'); t.dataset.falhou = ''; t.src = alt; return; }
    if(t.dataset.sigla != null){
      const d = document.createElement('span'); d.className = 'capa-vazia ' + (t.className || ''); d.setAttribute('aria-hidden', 'true');
      d.innerHTML = '<b>' + esc(t.dataset.sigla) + '</b><small>Foto em breve</small>';
      t.replaceWith(d);
    }else t.classList.add('img-falhou');
  }, true);

  // ================= roteamento =================
  const ROTAS = [
    [/^#?\/?$/, 'inicio', () => telaInicio()],
    [/^#\/imoveis$/, 'imoveis', () => telaImoveis()],
    [/^#\/pregao$/, 'pregao', () => telaPregao()],
    [/^#\/tabelas$/, 'tabelas', () => telaListaProjetos('tabelas')],
    [/^#\/tabelas\/([a-z0-9-]+)$/, 'tabelas', id => telaTabela(id)],
    [/^#\/posts$/, 'posts', () => telaListaProjetos('posts')],
    [/^#\/posts\/([a-z0-9-]+)$/, 'posts', id => telaPost(id)],
    [/^#\/p\/([a-z0-9-]+)$/, 'imoveis', id => telaProjeto(id)],
    [/^#\/comparar(?:\?([^#]*))?$/, 'comparar', qs => telaComparar(qs)],
    [/^#\/perfil$/, 'perfil', () => telaPerfil()]
  ];
  let rotaAtual = null, abaAtual = null;
  function render(){
    const app = $('#app');
    document.body.classList.toggle('sem-casca', !S.cod || !S.carregado);
    if(!S.cod){ rotaAtual = null; app.innerHTML = telaPortao(); ligarPortao(); return; }
    if(!S.carregado){
      if(S.offline) app.innerHTML = '<section class="portao"><img src="img/logo-fortal.png" alt="Fortal" width="160"><h1 class="t-1">Sem conexão</h1><p class="texto-2">Não consegui ler os espelhos e ainda não há nada salvo neste aparelho. Confira a internet e tente de novo.</p><button type="button" class="btn btn-pri btn-alto" data-acao="tentar">Tentar de novo</button></section>';
      return;
    }
    const h = location.hash || '#/';
    let achou = null;
    for(const [re, aba, fn] of ROTAS){ const m = h.match(re); if(m){ achou = {aba, fn, arg: m[1]}; break; } }
    if(!achou){ location.replace('#/'); return; }
    const mesma = rotaAtual === h;
    if(!mesma && rotaAtual) S.scroll[rotaAtual] = window.scrollY;
    const y = mesma ? window.scrollY : (S.scroll[h] || 0);
    rotaAtual = h; abaAtual = achou.aba;
    $$('[data-aba]').forEach(a => { if(a.dataset.aba === achou.aba) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    atualizarLateral();
    pos.length = 0;
    const html = achou.fn(achou.arg);
    if(html == null) return;
    const ROLOS = '.faixa-cards,.pilulas.rola,.escolha-fotos,.miniaturas,.fotos-linha,#gal,.mosaico-movel';
    const lados = mesma ? $$(ROLOS, app).map(e => e.scrollLeft) : [];
    app.innerHTML = (S.offline ? faixaOffline() : '') + '<div class="pagina pg-' + achou.aba + (mesma ? '' : ' vista') + '">' + html + '</div>';
    depoisDeRender();
    if(lados.length) $$(ROLOS, app).forEach((e, i) => { if(lados[i]) e.scrollLeft = lados[i]; });
    window.scrollTo(0, y);
    if(!mesma){ const f = $('#app h1'); if(f && document.activeElement === document.body){ /* foco fica na página */ } }
  }
  // atualização automática: não mexe em campo com foco, folha aberta, ficha ou post
  function refrescar(){
    if(!S.carregado || !S.cod) return render();
    atualizarLateral();
    if(document.querySelector('dialog[open]')) return;
    const h = location.hash || '#/';
    if(h === '#/imoveis') return atualizarImoveis();
    if(h === '#/tabelas' || h === '#/posts') return atualizarLista(h.slice(2));
    if(/^#\/(p|tabelas|posts)\//.test(h) || h === '#/perfil' || /^#\/comparar/.test(h)) return;
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    render();
  }
  const assinatura = () => S.M.length + ':' + (S.M[0] ? S.M[0].em + S.M[0].n : '') + ':' + S.P.reduce((s, p) => s + p.livres * 3 + p.reservadas * 7 + p.vendidas, 0) + ':' + (S.offline ? 1 : 0);
  function faixaOffline(){
    const em = S.cacheEm || S.geradoEm;
    return '<div class="faixa-aviso"><div class="aviso" role="status">' + ICO.nuvem + '<p>Sem internet. Você está vendo o que ficou salvo neste aparelho' + (em ? ' às ' + hora(em) + (diaKey(em) !== S.hoje ? ' de ' + fDM.format(em) : '') : '') + '. Preço e unidades livres podem ter mudado.</p></div></div>';
  }
  const pos = [];   // ações a rodar depois de pintar a tela
  function depoisDeRender(){ const fs = pos.splice(0); fs.forEach(f => { try{ const r = f(); if(r && r.catch) r.catch(e => console.error(e)); }catch(e){ console.error(e); } }); }
  window.addEventListener('hashchange', () => { fecharFolhas(); render(); });
  MQ_LARGO.addEventListener('change', () => { if(S.carregado && S.cod && !document.querySelector('dialog[open]')) render(); });
  MQ_TABELA.addEventListener('change', () => { if(/^#\/tabelas\//.test(location.hash)) atualizarTabela(); });

  // barra lateral do computador: aviso ao vivo e perfil
  function atualizarLateral(){
    const v = $('#lat-vivo'), pf = $('#lat-perfil');
    if(v && S.carregado){
      const st = stats();
      v.innerHTML = '<p class="ao-vivo"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo, ' + esc(hora(S.lidoEm)) + '</p>' +
        '<p class="lat-n"><b class="num ouro">' + esc(BRLmi(st.vgv7)) + '</b><span>vendidos em 7 dias</span></p>' +
        '<p class="lat-mini">' + esc(plural(st.vendHoje, 'venda', 'vendas') + ' e ' + plural(st.resHoje, 'reserva', 'reservas') + ' hoje') + '</p>';
    }
    if(pf){
      const p = perfil(), n = primeiroNome(p.nome);
      pf.innerHTML = '<span class="avatar-c">' + esc((n || 'F').charAt(0).toUpperCase()) + '</span><span class="lat-pf-txt"><b>' + esc(n || 'Seu perfil') + '</b><small>Perfil e ajustes</small></span>';
    }
  }

  // ================= portão (código do time) =================
  function telaPortao(msg){
    msg = msg || S.msgPortao || '';
    return '<section class="portao">' +
      '<img src="img/logo-fortal.png" alt="Fortal Inteligência Imobiliária" width="160">' +
      '<h1 class="t-1">App do Corretor</h1>' +
      '<p class="texto-2">Pregão ao vivo dos espelhos, fichas, tabelas e o link para o cliente. Digite o código do time, o mesmo do app dos Espelhos.</p>' +
      '<form id="f-portao" autocomplete="off">' +
      '<label class="campo">Código do time<input id="cod" name="cod" type="password" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" required minlength="3" maxlength="80"></label>' +
      '<p class="erro-txt" id="cod-erro" role="alert">' + esc(msg) + '</p>' +
      '<button class="btn btn-pri btn-alto" type="submit" id="cod-ok">Entrar</button>' +
      '</form></section>';
  }
  function ligarPortao(){
    const f = $('#f-portao'); if(!f) return;
    setTimeout(() => { const i = $('#cod'); if(i) i.focus(); }, 60);
    f.addEventListener('submit', async ev => {
      ev.preventDefault();
      const c = $('#cod').value.trim(); if(!c) return;
      const b = $('#cod-ok'); b.disabled = true; b.textContent = 'Conferindo…'; $('#cod-erro').textContent = '';
      try{
        const r = await rpc('corretor_resumo', {p_codigo: c});
        S.cod = c; LS.set(K.cod, c); S.msgPortao = ''; S.offline = false; S.cacheEm = 0;
        aplicarResumo(r); LS.set(K.cache, JSON.stringify({em: Date.now(), r}));
        if(!location.hash) location.replace('#/');
        render();
        setTimeout(() => carregarUnidades(), 600);
      }catch(e){
        b.disabled = false; b.textContent = 'Entrar';
        $('#cod-erro').textContent = codigoInvalido(e) ? 'Código errado. Confira com o Luiz e tente de novo.' : 'Sem conexão com o servidor agora. Confira a internet e tente de novo.';
      }
    });
  }
  function sair(msg){
    S.cod = null; LS.del(K.cod); S.carregado = false; S.msgPortao = msg || ''; S.U = null;
    fecharFolhas(); render();
  }

  // ================= cartões =================
  const precoDe = p => (S.f.modo === 'pv' && p.avista != null) ? p.avista : (p.preco != null ? p.preco : p.avista);
  const SIZES_CARD = '(min-width: 1280px) 300px, (min-width: 1024px) 26vw, (min-width: 640px) 44vw, 80vw';
  function cardProj(p, o){
    o = o || {};
    const v = o.min != null ? o.min : precoDe(p);
    const rot = o.min != null ? 'No filtro, a partir de' : (S.f.modo === 'pv' && p.avista != null) || p.preco == null ? 'À vista a partir de' : 'A partir de';
    const selos = [];
    if(p.vh) selos.push('<span class="selo ouro">' + esc(plural(p.vh, 'venda', 'vendas')) + ' hoje</span>');
    else if(p.v7) selos.push('<span class="selo ouro">' + esc(plural(p.v7, 'venda', 'vendas')) + ' na semana</span>');
    if(p.fase && !o.semFase) selos.push('<span class="selo">' + esc(FASE_CURTA[p.fase] || p.fase) + '</span>');
    const info = [tiposTxt(p.tipos, p.amin, p.amax), maiusc1(entregaTxt(p))].filter(Boolean).join('. ');
    return '<a class="card' + (o.cls ? ' ' + o.cls : '') + '" href="#/p/' + esc(p.id) + '">' +
      '<span class="card-foto">' + capaProj(p, {w: 720, sizes: o.sizes || SIZES_CARD, alt: ''}) +
      (selos.length ? '<span class="card-selos">' + selos.join('') + '</span>' : '') +
      (o.dist != null ? '<span class="card-dist">' + ICO.pino + esc(kmTxt(o.dist)) + '</span>' : '') + '</span>' +
      '<span class="card-corpo"><span class="card-quem">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
      '<span class="card-nome">' + esc(p.nome) + '</span>' +
      (v != null ? '<span class="card-preco"><small>' + esc(rot) + '</small><b class="num">' + esc(BRL(v)) + '</b></span>' : '<span class="card-preco sem">Tabela a publicar</span>') +
      '<span class="card-info">' + esc(info) + '.</span>' +
      (o.n != null ? '<span class="card-match">' + esc(plural(o.n, 'unidade livre', 'unidades livres')) + ' no filtro</span>'
        : '<span class="card-est">' + esc(p.livres ? plural(p.livres, 'livre', 'livres') + ' de ' + p.total.toLocaleString('pt-BR') : 'Esgotado no espelho') + '</span>') +
      '</span></a>';
  }
  function miniProj(p, cls){   // foto redonda para listas e ranking
    return '<span class="redonda' + (cls ? ' ' + cls : '') + '">' + (p.capa ? imgTag(p.capa, '', '', {w: 160, sizes: '56px', sigla: siglaDe(p)}) : '<span class="capa-vazia"><b>' + esc(siglaDe(p)) + '</b></span>') + '</span>';
  }

  // ================= INÍCIO =================
  function saudacao(){ const h = +fHoraNum.format(Date.now()); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function fitaHtml(){
    const itens = S.M.slice(0, 16);
    if(!itens.length) return '';
    const item = m => { const p = S.byId.get(m.p); return '<span class="fita-item"><span class="h">' + esc(hora(m.em)) + '</span><b>' + esc(nomeCurto(p)) + ' ' + esc(m.n) + '</b><span class="' + statusCls(m) + '">' + esc(statusTxt(m)) + '</span>' + (m.preco ? '<span class="v">' + esc(BRLc(m.preco)) + '</span>' : '') + '</span>'; };
    const grupo = itens.map(item).join('');
    const dur = Math.max(30, itens.length * 6);
    return '<a class="fita" href="#/pregao" aria-label="Pregão ao vivo: últimas unidades vendidas e reservadas nos espelhos. Abrir o pregão">' +
      '<span class="fita-rot"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo</span>' +
      '<span class="fita-trilho" style="--dur:' + dur + 's"><span class="fita-grupo">' + grupo + '</span><span class="fita-grupo" aria-hidden="true">' + grupo + '</span></span></a>';
  }
  function buscaAtalho(){
    return '<div class="busca-linha"><a class="busca" href="#/imoveis" data-acao="focar-busca">' + ICO.lupa + '<span>Projeto, bairro, rua ou metrô</span></a>' +
      '<a class="btn-filtro" href="#/imoveis" data-acao="abrir-filtros" aria-label="Filtro completo: preço, dormitórios, metragem, entrega, região e mais">' + ICO.filtro + '<span class="so-largo">Filtros</span></a></div>';
  }
  function telaInicio(){
    const pf = perfil(), st = stats(), nome = primeiroNome(pf.nome);
    let h = '<header class="ini-cab">' +
      '<div class="topo-movel"><img class="logo" src="img/logo-fortal.png" alt="Fortal Inteligência Imobiliária" width="45" height="46">' +
      '<a class="avatar" href="#/perfil" aria-label="Seu perfil e ajustes"><span>' + esc((nome || 'F').charAt(0).toUpperCase()) + '</span></a></div>' +
      '<div class="ini-saud"><p class="sub">' + esc(maiusc1(fLonga.format(Date.now()).replace('-feira', ''))) + '</p>' +
      '<h1 class="t-1">' + esc(saudacao() + (nome ? ', ' + nome : '')) + '</h1>' +
      '<p class="sub">Espelhos lidos às ' + esc(hora(S.lidoEm)) + (diaKey(S.lidoEm) !== S.hoje ? ' de ' + esc(fDM.format(S.lidoEm)) : '') + '. ' + esc(plural(S.P.filter(p => p.livres).length, 'projeto com unidade livre', 'projetos com unidade livre')) + '.</p></div>' +
      buscaAtalho() + '</header>';
    h += fitaHtml();
    const rank = rankingDe('vendas');
    const top = rank[0] || S.P.filter(p => p.livres > 0 && (p.fase === 'lanc' || p.fase === 'breve'))[0] || S.P[0];
    h += '<div class="ini-grade">' + (top ? heroHtml(top, !!rank[0]) : '') + '<div class="ini-lado">' + placarHtml(st) + rankingHtml() + '</div></div>';
    const vivos = S.P.filter(p => p.livres > 0);
    const ord = (a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || ((a.preco || 1e12) - (b.preco || 1e12));
    const lanc = vivos.filter(p => p.fase === 'lanc' || p.fase === 'breve').sort(ord);
    const obras = vivos.filter(p => p.fase === 'obras').sort(ord);
    const prontos = vivos.filter(p => p.fase === 'pronto').sort(ord);
    if(lanc.length) h += secaoCards('Lançamentos', 'lanc-t', lanc, 'lanc,breve', 8);
    if(obras.length) h += secaoCards('Em obras', 'obras-t', obras, 'obras', 4);
    if(prontos.length) h += secaoCards('Prontos para morar', 'pront-t', prontos, 'pronto', 4);
    const porG = {}; for(const p of vivos){ const k = p.grupo || '_'; porG[k] = (porG[k] || 0) + 1; }
    const gs = ORDEM_GRUPOS.filter(k => porG[k]).concat(Object.keys(porG).filter(k => k !== '_' && !ORDEM_GRUPOS.includes(k)));
    h += '<section class="sec" aria-labelledby="cons-t"><div class="sec-cab"><h2 class="t-2" id="cons-t">Por construtora</h2></div><div class="pilulas">' +
      gs.map(k => '<a class="pilula" href="#/imoveis" data-acao="ver-cons" data-v="' + esc(k) + '">' + esc(nomeGrupo(k)) + '<span class="n">' + porG[k] + '</span></a>').join('') + '</div></section>';
    return h;
  }
  function secaoCards(titulo, idT, lista, fase, n){
    return '<section class="sec" aria-labelledby="' + idT + '"><div class="sec-cab"><h2 class="t-2" id="' + idT + '">' + esc(titulo) + ' <span class="q">' + lista.length + '</span></h2>' +
      '<a class="link-mais" href="#/imoveis" data-acao="ver-fase" data-v="' + fase + '">Ver todos ' + ICO.seta + '</a></div>' +
      '<div class="faixa-cards' + (n <= 4 ? ' uma-linha' : '') + '">' + lista.slice(0, n).map(p => cardProj(p, {semFase: true})).join('') + '</div></section>';
  }
  function heroHtml(p, primeiro){
    const c = S.centralV.get(p.id);
    if(c === undefined) pos.push(() => trocarHeroCentral(p));
    const src = c && c.hero ? imgCentral(c, c.hero) : p.capa;
    const img = src ? imgTag(src, 'Foto do ' + p.nome, 'hero-img', {w: 1600, sizes: '(min-width: 1024px) 64vw, 100vw', prioridade: true, extra: ' id="hero-img"', sigla: siglaDe(p)}) : capaVazia(p, 'hero-img');
    const tip = tiposTxt(p.tipos, p.amin, p.amax);
    const linha2 = [p.avista && p.preco && p.avista < p.preco ? 'ou ' + BRL(p.avista) + ' à vista.' : '', tip ? tip + ', ' + entregaTxt(p) + '.' : maiusc1(entregaTxt(p)) + '.'].filter(Boolean).join(' ');
    return '<section class="hero" aria-labelledby="hero-t"><a class="hero-foto" href="#/p/' + esc(p.id) + '" tabindex="-1" aria-hidden="true">' + img + '</a><span class="veu-hero" aria-hidden="true"></span>' +
      (primeiro && p.v7 ? '<p class="selo ouro hero-selo">1º em vendas na semana</p>' : '') +
      '<div class="hero-txt"><p class="onde">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p>' +
      '<h2 id="hero-t"><a href="#/p/' + esc(p.id) + '">' + esc(p.nome) + '</a></h2>' +
      (p.preco ? '<p class="hero-preco"><span>Tabela a partir de</span><b class="num">' + esc(BRL(p.preco)) + '</b></p>' : '<p class="hero-preco"><span>Tabela ainda não publicada</span></p>') +
      '<p class="l">' + esc(linha2) + '</p>' +
      '<p class="l"><strong>' + esc(plural(p.v7, 'vendida', 'vendidas')) + '</strong> e ' + esc(plural(p.r7, 'reservada', 'reservadas')) + ' em 7 dias, ' + esc(plural(p.livres, 'livre', 'livres')) + '.</p>' +
      '<div class="hero-btns"><button type="button" class="btn btn-pri" data-acao="enviar" data-id="' + esc(p.id) + '">' + ICO.enviar + 'Mandar pro cliente</button>' +
      '<a class="btn btn-vidro" href="#/p/' + esc(p.id) + '">Ver projeto</a></div></div></section>';
  }
  async function trocarHeroCentral(p){
    const c = await fichaCentral(p.id);
    if(!c || !c.hero) return;
    const im = $('#hero-img'), src = imgCentral(c, c.hero);
    if(im && im.tagName === 'IMG' && src && im.getAttribute('src') !== src){ const n = new Image(); n.onload = () => { const a = $('#hero-img'); if(a && a.tagName === 'IMG'){ a.removeAttribute('srcset'); a.src = src; } }; n.src = src; }
  }
  function placarHtml(st){
    const semPreco = st.vend7 - st.vend7Preco;
    const dias = vendasPorDia(), mx = Math.max(1, ...dias.map(x => x.n));
    const rotDia = d => { const dt = new Date(d + 'T12:00:00-03:00'); return d === S.hoje ? 'hoje' : fSem.format(dt).replace('.', ''); };
    return '<section class="placar" aria-labelledby="placar-t"><h2 id="placar-t" class="rotulo">VGV vendido nos espelhos em 7 dias</h2>' +
      '<p class="grande num' + (st.vgv7 ? '' : ' zero') + '">' + esc(BRLmi(st.vgv7)) + '</p>' +
      '<dl class="placar-n"><div><dt>Vendas</dt><dd class="num">' + st.vend7 + '</dd></div><div><dt>Reservas</dt><dd class="num">' + st.res7 + '</dd></div><div><dt>Em processo</dt><dd class="num">' + st.proc7 + '</dd></div></dl>' +
      '<div class="mini-barras" role="img" aria-label="' + esc('Vendas por dia: ' + dias.map(x => rotDia(x.d) + ' ' + x.n).join(', ')) + '">' +
      dias.map(x => '<span class="' + (x.d === S.hoje ? 'hoje' : '') + '"><i style="height:' + Math.max(3, Math.round(x.n / mx * 56)) + 'px"></i><small>' + esc(rotDia(x.d)) + '</small></span>').join('') + '</div>' +
      (st.vend7 ? '<p class="nota">Soma do preço de tabela ' + (semPreco ? 'de ' + st.vend7Preco + ' das ' + st.vend7 + ' vendas. ' + (semPreco === 1 ? 'A outra não tem preço no espelho.' : 'As outras ' + semPreco + ' não têm preço no espelho.') : (st.vend7 === 1 ? 'da venda.' : 'das ' + st.vend7 + ' vendas.')) + '</p>' : '') +
      '<a class="pilula" href="#/pregao">Abrir o pregão de hoje ' + ICO.seta + '</a></section>';
  }
  function rankingHtml(){
    const modo = S.ui.rank, lst = rankingDe(modo).slice(0, 5);
    if(!lst.length) return '';
    return '<section class="ranking-box" aria-labelledby="rank-t"><div class="sec-cab"><h2 class="t-3" id="rank-t">Quem mais vende</h2><span class="sub">7 dias</span></div>' +
      '<div class="seg" role="group" aria-label="Ordenar o ranking">' +
      ['vendas', 'reservas'].map(k => '<button type="button" data-acao="rank" data-v="' + k + '" aria-pressed="' + (modo === k) + '">' + (k === 'vendas' ? 'Vendas' : 'Reservas') + '</button>').join('') + '</div>' +
      '<ol class="ranking">' + lst.map((p, i) => {
        const n = modo === 'reservas' ? p.r7 : p.v7;
        return '<li><a href="#/p/' + esc(p.id) + '"><span class="pos num">' + (i + 1) + '</span>' + miniProj(p) +
          '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span></span>' +
          '<span class="fim"><b class="num' + (modo === 'vendas' ? ' ouro' : '') + '">' + n + '</b><span>' + (modo === 'vendas' ? (n === 1 ? 'venda' : 'vendas') : (n === 1 ? 'reserva' : 'reservas')) + '</span></span></a></li>';
      }).join('') + '</ol><a class="link-mais" href="#/pregao">Ver o ranking dos 10 ' + ICO.seta + '</a></section>';
  }

  // ================= PREGÃO =================
  function telaPregao(){
    const st = stats();
    let h = '<header class="pg-cab"><div><h1 class="t-1">Pregão</h1><p class="sub">Tudo que mudou hoje nos espelhos.</p></div><p class="ao-vivo"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo, ' + esc(hora(S.lidoEm)) + '</p></header>';
    const semP = st.vendHoje - st.vendHojePreco;
    const placar = '<section class="placar" aria-labelledby="hoje-t"><h2 class="rotulo" id="hoje-t">Vendido hoje</h2>' +
      '<p class="grande num' + (st.vgvHoje ? '' : ' zero') + '">' + esc(BRLmi(st.vgvHoje)) + '</p>' +
      '<dl class="placar-n"><div><dt>Vendas</dt><dd class="num">' + st.vendHoje + '</dd></div><div><dt>Reservas</dt><dd class="num">' + st.resHoje + '</dd></div><div><dt>Em processo</dt><dd class="num">' + st.procHoje + '</dd></div><div><dt>Voltaram</dt><dd class="num">' + st.voltHoje + '</dd></div></dl>' +
      (st.vendHoje ? '<p class="nota">VGV pelo preço de tabela ' + (semP ? 'de ' + st.vendHojePreco + ' das ' + st.vendHoje + ' vendas. ' + (semP === 1 ? 'A outra não tem preço no espelho.' : 'As outras ' + semP + ' não têm preço no espelho.') : (st.vendHoje === 1 ? 'da venda.' : 'das ' + st.vendHoje + ' vendas.')) + '</p>' : '') + '</section>';
    const porDia = vendasPorDia();
    const mx = Math.max(1, ...porDia.map(x => x.n)), tot = porDia.reduce((s, x) => s + x.n, 0);
    const rotDia = d => { const dt = new Date(d + 'T12:00:00-03:00'); return {sem: d === S.hoje ? 'hoje' : fSem.format(dt).replace('.', ''), dm: fDM.format(dt).slice(0, 2)}; };
    const aria = 'Unidades vendidas por dia: ' + porDia.map(x => { const r = rotDia(x.d); return (r.sem === 'hoje' ? 'hoje' : r.sem + ' ' + r.dm) + ', ' + (x.n || 'nenhuma'); }).join('; ');
    const barras = '<section class="caixa" aria-labelledby="sem-t"><div class="sec-cab"><h2 class="t-3" id="sem-t">Vendas por dia</h2><span class="sub num">' + tot + ' em 7 dias</span></div>' +
      '<div class="barras" role="img" aria-label="' + esc(aria) + '">' + porDia.map(x => '<span class="col' + (x.d === S.hoje ? ' hoje' : '') + (x.n ? '' : ' nada') + '" aria-hidden="true"><b class="num">' + x.n + '</b><i style="height:' + Math.max(2, Math.round(x.n / mx * 128)) + 'px"></i></span>').join('') + '</div>' +
      '<div class="barras-dias" aria-hidden="true">' + porDia.map(x => { const r = rotDia(x.d); return '<span' + (x.d === S.hoje ? ' class="hoje"' : '') + '><b>' + esc(r.sem) + '</b>' + esc(r.dm) + '</span>'; }).join('') + '</div></section>';
    let maiores = st.hoje.filter(m => m.tipo === 'venda' && m.preco > 0), rotMaior = 'Maior venda de hoje';
    if(!maiores.length){ maiores = S.M.filter(m => m.tipo === 'venda' && m.preco > 0 && S.dias7.includes(m.dia)); rotMaior = 'Maior venda da semana'; }
    const maior = maiores.sort((a, b) => b.preco - a.preco)[0];
    let maiorH = '';
    if(maior){
      const p = S.byId.get(maior.p);
      maiorH = '<a class="maior" href="#/p/' + esc(p.id) + '">' + (p.capa ? imgTag(p.capa, 'Foto do ' + p.nome, '', {w: 1000, sizes: '(min-width: 1024px) 34vw, 100vw', sigla: siglaDe(p)}) : capaVazia(p)) + '<span class="veu" aria-hidden="true"></span><span class="txt">' +
        '<span class="k">' + esc(rotMaior + (maior.dia === S.hoje ? ', às ' + hora(maior.em) : ', ' + fDM.format(maior.em))) + '</span>' +
        '<span class="t">' + esc(p.nome + ' ' + maior.n) + '</span><span class="d">' + esc([maior.area ? fmtM2(maior.area) : '', maior.tl, quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
        '<span class="v num">' + esc(BRL(maior.preco)) + '</span></span></a>';
    }
    let dia = S.hoje, lista = st.hoje, titulo = 'Movimento de hoje';
    if(!lista.length){ const ontem = diaKey(Date.now() - 864e5); dia = ontem; lista = S.M.filter(m => m.dia === ontem); titulo = 'Movimento de ontem'; }
    const filtros = [['tudo', 'Tudo', lista.length], ['venda', 'Vendas', lista.filter(m => m.tipo === 'venda').length], ['reserva', 'Reservas', lista.filter(m => m.tipo === 'reserva').length], ['processo', 'Em processo', lista.filter(m => m.tipo === 'processo').length], ['voltou', 'Voltaram', lista.filter(m => m.tipo === 'voltou').length]];
    const fl = S.ui.feed, vis = fl === 'tudo' ? lista : lista.filter(m => m.tipo === fl);
    const feed = '<section class="caixa" aria-labelledby="feed-t"><h2 class="t-3" id="feed-t">' + titulo + '</h2>' +
      '<div class="pilulas rola" role="group" aria-label="Filtrar o movimento">' + filtros.map(x => '<button type="button" class="pilula peq" data-acao="feed" data-v="' + x[0] + '" aria-pressed="' + (fl === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>' +
      (vis.length ? '<ul class="feed">' + vis.slice(0, S.ui.feedMostra).map(feedItem).join('') + '</ul>' : '<p class="texto-2">Nada nesse filtro' + (dia === S.hoje ? ' hoje' : ' ontem') + '.</p>') +
      (vis.length > S.ui.feedMostra ? '<button type="button" class="btn btn-largo" data-acao="mais-feed">Mostrar mais ' + Math.min(20, vis.length - S.ui.feedMostra) + ' de ' + (vis.length - S.ui.feedMostra) + '</button>' : '') + '</section>';
    const rk = rankingDe('vendas').slice(0, 10);
    const ranking = rk.length ? '<section class="caixa" aria-labelledby="rk-t"><div class="sec-cab"><h2 class="t-3" id="rk-t">Ranking da semana</h2><span class="sub">7 dias</span></div>' +
      '<div class="tabela-rank" role="table" aria-label="Ranking da semana por vendas"><div class="lin cab" role="row"><span role="columnheader">#</span><span role="columnheader">Projeto</span><span role="columnheader" class="dir">Vendas</span><span role="columnheader" class="dir">Reservas</span></div>' +
      rk.map((p, i) => '<a class="lin" role="row" href="#/p/' + esc(p.id) + '"><span role="cell" class="pos num">' + (i + 1) + '</span><span role="cell" class="nm">' + miniProj(p, 'peq') + '<span><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span></span></span><span role="cell" class="v num">' + p.v7 + '</span><span role="cell" class="r num">' + p.r7 + '</span></a>').join('') + '</div></section>' : '';
    h += '<div class="preg-grade"><div class="preg-a">' + placar + barras + feed + '</div><div class="preg-b">' + maiorH + ranking + '</div></div>';
    return h;
  }
  function feedItem(m){
    const p = S.byId.get(m.p);
    return '<li><span class="h num">' + esc(hora(m.em)) + '</span><span class="meio"><a href="#/p/' + esc(p.id) + '">' + esc(nomeCurto(p)) + ' <span class="u">' + esc(m.n) + '</span></a>' +
      '<span>' + esc([m.area ? fmtM2(m.area) : '', m.tl, quemDe(p)].filter(Boolean).join(', ')) + '</span></span>' +
      '<span class="fim"><span class="st ' + statusCls(m) + '">' + esc(statusTxt(m)) + '</span>' + (m.preco ? '<span class="v num' + (m.tipo === 'venda' ? ' ouro' : '') + '">' + esc(BRLc(m.preco)) + '</span>' : '') + '</span></li>';
  }

  // ================= FILTRO =================
  // Critérios de projeto (construtora, fase, região, entrega, movimento) e de unidade (preço, tipologia, metragem,
  // R$/m², andar, vaga, enquadramento, extras). Os de unidade usam o índice de unidades livres; até ele chegar,
  // vale a conta aproximada pelo resumo do projeto.
  const prU = (u, f) => f.modo === 'pv' ? u.pv : u.p;
  const temFU = (f, ign) => !!((ign !== 'preco' && (f.pmin || f.pmax)) || (ign !== 'tipos' && f.tipos.length) || (ign !== 'area' && (f.amin || f.amax)) || (ign !== 'm2' && f.m2) ||
    (ign !== 'andar' && f.andar) || (ign !== 'vaga' && f.vaga) || (ign !== 'cats' && f.cats.length) || (ign !== 'extras' && f.extras.length));
  const catBate = (c, alvo) => alvo === 'H' ? /^H/.test(c || '') : c === alvo;
  function passaU(u, f, ign){
    const pr = prU(u, f);
    if(ign !== 'preco' && (f.pmin || f.pmax)){ if(!(pr > 0)) return false; if(f.pmin && pr < f.pmin) return false; if(f.pmax && pr > f.pmax) return false; }
    if(ign !== 'tipos' && f.tipos.length && !f.tipos.includes(u.k)) return false;
    if(ign !== 'area' && (f.amin || f.amax)){ if(!(u.a > 0)) return false; if(f.amin && u.a < f.amin) return false; if(f.amax && u.a > f.amax) return false; }
    if(ign !== 'm2' && f.m2){ if(!(pr > 0 && u.a >= 10) || pr / u.a > f.m2) return false; }
    if(ign !== 'andar' && f.andar){ if(!(u.an >= f.andar)) return false; }
    if(ign !== 'vaga' && f.vaga){ if(!(u.vg >= f.vaga)) return false; }
    if(ign !== 'cats' && f.cats.length && !f.cats.some(c => catBate(u.c, c))) return false;
    if(ign !== 'extras' && f.extras.length){ for(const x of f.extras){ if(!(u.f & BIT[x])) return false; } }
    return true;
  }
  const FLAG_P = {mob: 'm', pcd: 'p', gd: 'g', dist: 'd', promo: 'o', cob: 'c'};
  function aproxP(p, f, ign){   // sem o índice de unidades: usa o resumo do projeto
    const pr = f.modo === 'pv' ? p.avista : (p.preco != null ? p.preco : p.avista);
    if(ign !== 'preco' && f.pmax && !(pr > 0 && pr <= f.pmax)) return false;
    if(ign !== 'tipos' && f.tipos.length && !f.tipos.some(k => p.tipos.includes(k))) return false;
    if(ign !== 'area' && (f.amin || f.amax)){ if(f.amin && !(p.amax >= f.amin)) return false; if(f.amax && !(p.amin > 0 && p.amin <= f.amax)) return false; }
    if(ign !== 'm2' && f.m2 && !(p.pm2 > 0 && p.pm2 <= f.m2)) return false;
    if(ign !== 'vaga' && f.vaga && p.vaga === 'nenhuma') return false;
    if(ign !== 'cats' && f.cats.length && !f.cats.some(c => p.cats.some(x => catBate(x, c)))) return false;
    if(ign !== 'extras' && f.extras.length && !f.extras.every(x => p.flags.includes(FLAG_P[x]))) return false;
    return true;
  }
  function passaP(p, f, ign){
    if(f.livres && !p.livres) return false;
    if(ign !== 'cons' && f.cons.length && !f.cons.includes(p.grupo)) return false;
    if(ign !== 'fases' && f.fases.length && !f.fases.includes(p.fase)) return false;
    if(ign !== 'zonas' && f.zonas.length && !f.zonas.includes(p.zona)) return false;
    if(ign !== 'bairros' && f.bairros.length && !f.bairros.includes(p.bairro)) return false;
    if(ign !== 'ent' && f.ent){
      if(f.ent === 'pronto'){ if(p.fase !== 'pronto') return false; }
      else if(p.fase !== 'pronto'){ if(!p.entrega || +p.entrega.slice(0, 4) > +f.ent) return false; }
    }
    if(ign !== 'mov' && f.mov){ if(f.mov === 'hoje' && !(p.vh + p.rh)) return false; if(f.mov === 'semana' && !p.v7) return false; }
    if(ign !== 'perto' && f.perto){ if(p.lat == null || p.lng == null || distKm(f.perto, p) > f.perto.raio) return false; }
    if(f.q){
      const termos = norm(f.q).split(/\s+/).filter(Boolean);
      if(termos.length){
        const alvo = norm([p.nome, p.curto, p.bairro, p.endereco, p.destaque, p.cidade, quemDe(p), GRUPOS[p.grupo] ? GRUPOS[p.grupo].n : '', ZONA[p.zona] ? 'zona ' + ZONA[p.zona] : ''].join(' '));
        if(!termos.every(t => alvo.includes(t))) return false;
      }
    }
    return true;
  }
  function resultado(f, ignP, ignU){
    const fu = temFU(f, ignU), usaU = fu && !!S.U;
    const out = [];
    for(const p of S.P){
      if(!passaP(p, f, ignP)) continue;
      if(fu){
        if(usaU){ const us = (S.U.get(p.id) || []).filter(u => passaU(u, f, ignU)); if(!us.length) continue; out.push({p, us}); }
        else { if(!aproxP(p, f, ignU)) continue; out.push({p, us: null, aprox: true}); }
      }else out.push({p, us: null});
    }
    return out;
  }
  function completar(res, f){
    for(const r of res){
      if(r.us){
        let mn = null, m2 = null;
        for(const u of r.us){ const v = prU(u, f); if(v > 0){ if(mn == null || v < mn) mn = v; if(u.a >= 10){ const x = v / u.a; if(m2 == null || x < m2) m2 = x; } } }
        r.min = mn; r.m2 = m2; r.n = r.us.length;
      }else{ r.min = precoDe(r.p); r.m2 = r.p.pm2; r.n = null; }
      r.dist = f.perto && r.p.lat != null ? distKm(f.perto, r.p) : null;
    }
    return res;
  }
  const chaveEnt = p => p.fase === 'pronto' ? '0000' : (p.entrega || '9999');
  const ORDENS = {
    vendidos: (a, b) => (b.p.v7 - a.p.v7) || (b.p.r7 - a.p.r7) || (b.p.livres - a.p.livres),
    preco: (a, b) => (a.min == null ? 1e12 : a.min) - (b.min == null ? 1e12 : b.min),
    precoDesc: (a, b) => (b.min == null ? -1 : b.min) - (a.min == null ? -1 : a.min),
    m2: (a, b) => (a.m2 == null ? 1e9 : a.m2) - (b.m2 == null ? 1e9 : b.m2),
    entrega: (a, b) => { const x = chaveEnt(a.p), y = chaveEnt(b.p); return x < y ? -1 : x > y ? 1 : (b.p.v7 - a.p.v7); },
    estoque: (a, b) => b.p.livres - a.p.livres,
    perto: (a, b) => (a.dist == null ? 1e9 : a.dist) - (b.dist == null ? 1e9 : b.dist),
    nome: (a, b) => String(a.p.nome).localeCompare(String(b.p.nome), 'pt-BR')
  };
  const ORDEM_TXT = [['vendidos', 'Mais vendidos'], ['preco', 'Menor preço'], ['precoDesc', 'Maior preço'], ['m2', 'Menor R$/m²'], ['entrega', 'Entrega mais cedo'], ['estoque', 'Mais unidades livres'], ['perto', 'Mais perto'], ['nome', 'Nome, de A a Z']];
  const salvarF = () => SS.set(K.filtro, Object.assign({}, S.f, {mostra: 12}));
  function facetas(f){
    const out = {};
    const campo = {cons: 'grupo', fases: 'fase', zonas: 'zona', bairros: 'bairro'};
    for(const g in campo){
      const cnt = {}; for(const r of resultado(f, g, null)){ const v = r.p[campo[g]]; if(v) cnt[v] = (cnt[v] || 0) + 1; }
      out[g] = cnt;
    }
    { const base = resultado(f, 'ent', null), cnt = {}; for(const o of ['pronto', '2026', '2027', '2028', '2029', '2030']) cnt[o] = base.filter(r => passaP(r.p, Object.assign({}, f, {ent: o}), null)).length; out.ent = cnt; }
    { const base = resultado(f, 'mov', null); out.mov = {hoje: base.filter(r => r.p.vh + r.p.rh).length, semana: base.filter(r => r.p.v7).length}; }
    const unidDe = r => r.us || (S.U ? (S.U.get(r.p.id) || []) : null);
    for(const g of ['tipos', 'cats', 'extras']){
      const base = resultado(f, null, g), cnt = {};
      const opcoes = g === 'tipos' ? TIPOS.map(x => x[0]) : g === 'cats' ? CATS.map(x => x[0]) : EXTRAS.map(x => x[0]);
      for(const r of base){
        const us = unidDe(r);
        for(const v of opcoes){
          let ok;
          if(us){ ok = g === 'tipos' ? us.some(u => u.k === v) : g === 'cats' ? us.some(u => catBate(u.c, v)) : us.some(u => u.f & BIT[v]); }
          else ok = g === 'tipos' ? r.p.tipos.includes(v) : g === 'cats' ? r.p.cats.some(x => catBate(x, v)) : r.p.flags.includes(FLAG_P[v]);
          if(ok) cnt[v] = (cnt[v] || 0) + 1;
        }
      }
      out[g] = cnt;
    }
    return out;
  }
  function filtrosAtivos(f){
    const L = [];
    if(f.q.trim()) L.push(['q', '“' + f.q.trim() + '”']);
    if(f.pmin || f.pmax) L.push(['preco', (f.modo === 'pv' ? 'À vista ' : '') + (f.pmin && f.pmax ? milTxt(f.pmin) + ' a ' + milTxt(f.pmax) : f.pmax ? 'até ' + milTxt(f.pmax) : 'a partir de ' + milTxt(f.pmin))]);
    else if(f.modo === 'pv') L.push(['modo', 'Preço à vista']);
    f.tipos.forEach(k => L.push(['tipos:' + k, tipoNome(k)]));
    if(f.amin || f.amax) L.push(['area', f.amin && f.amax ? f.amin + ' a ' + f.amax + ' m²' : f.amax ? 'até ' + f.amax + ' m²' : 'a partir de ' + f.amin + ' m²']);
    if(f.m2) L.push(['m2', 'R$/m² até ' + milTxt(f.m2)]);
    if(f.andar) L.push(['andar', 'A partir do ' + f.andar + 'º andar']);
    if(f.vaga) L.push(['vaga', f.vaga > 1 ? f.vaga + ' vagas ou +' : 'Com vaga']);
    if(f.ent) L.push(['ent', f.ent === 'pronto' ? 'Pronto para morar' : 'Chaves até ' + f.ent]);
    f.fases.forEach(k => L.push(['fases:' + k, FASE[k] || k]));
    f.zonas.forEach(z => L.push(['zonas:' + z, 'Zona ' + (ZONA[z] || z)]));
    f.bairros.forEach(b => L.push(['bairros:' + b, b]));
    if(f.perto) L.push(['perto', 'Até ' + kmTxt(f.perto.raio) + ' de você']);
    f.cons.forEach(c => L.push(['cons:' + c, nomeGrupo(c)]));
    f.cats.forEach(c => L.push(['cats:' + c, (CATS.find(x => x[0] === c) || [c, c])[1]]));
    f.extras.forEach(x => L.push(['extras:' + x, (EXTRAS.find(e => e[0] === x) || [x, x])[1]]));
    if(f.mov) L.push(['mov', f.mov === 'hoje' ? 'Mexeu hoje' : 'Vendeu na semana']);
    if(!f.livres) L.push(['livres', 'Com esgotados']);
    return L;
  }
  function tirarFiltro(k){
    const f = S.f, [g, v] = k.split(/:(.*)/s);
    if(g === 'q') f.q = '';
    else if(g === 'preco'){ f.pmin = 0; f.pmax = 0; }
    else if(g === 'modo') f.modo = 'pp';
    else if(g === 'area'){ f.amin = 0; f.amax = 0; }
    else if(g === 'm2') f.m2 = 0; else if(g === 'andar') f.andar = 0; else if(g === 'vaga') f.vaga = 0;
    else if(g === 'ent') f.ent = ''; else if(g === 'mov') f.mov = ''; else if(g === 'livres') f.livres = true;
    else if(g === 'perto'){ f.perto = null; if(f.ordem === 'perto') f.ordem = 'vendidos'; }
    else if(Array.isArray(f[g])) f[g] = f[g].filter(x => x !== v);
  }
  const nFiltros = f => filtrosAtivos(f).filter(x => x[0] !== 'q').length;
  function textoBusca(f){   // em português corrido, para a seleção do cliente
    const t = f.tipos.map(tipoNome).filter(Boolean);
    const partes = [];
    partes.push((t.length ? t.join(' ou ') : 'Imóveis'));
    if(f.amin || f.amax) partes.push(f.amin && f.amax ? 'de ' + f.amin + ' a ' + f.amax + ' m²' : f.amax ? 'até ' + f.amax + ' m²' : 'a partir de ' + f.amin + ' m²');
    if(f.pmax) partes.push('até ' + BRLc(f.pmax) + (f.modo === 'pv' ? ' à vista' : ''));
    if(f.bairros.length) partes.push(noBairro(f.bairros.slice(0, 3).join(', ')));
    else if(f.zonas.length) partes.push('na zona ' + f.zonas.map(z => ZONA[z] || z).join(' ou '));
    if(f.ent) partes.push(f.ent === 'pronto' ? 'prontos para morar' : 'com chaves até ' + f.ent);
    return partes.join(' ').slice(0, 200);
  }

  // ================= IMÓVEIS =================
  function telaImoveis(){
    const f = S.f;
    pos.push(() => {
      atualizarImoveis();
      if(!S.U) carregarUnidades();
      if(S.focarBusca){ S.focarBusca = false; const i = $('#q'); if(i) i.focus(); }
      if(S.abrirFiltros){ S.abrirFiltros = false; if(!largo()) abrirFiltros(); else { const p = $('#painel-f'); if(p) p.scrollIntoView({block: 'start'}); } }
    });
    const n = nFiltros(f);
    return '<header class="pg-cab"><div><h1 class="t-1">Imóveis</h1><p class="sub" id="imv-sub">' + esc(plural(S.P.length, 'projeto', 'projetos') + ' nos espelhos, ao vivo') + '</p></div>' +
      '<div class="cab-acoes"><a class="btn btn-peq btn-fino" href="#/comparar">' + ICO.comparar + 'Comparar</a><div class="seg seg-ver" role="group" aria-label="Ver por">' + [['projetos', 'Projetos', ICO.grade], ['unidades', 'Unidades', ICO.lista]].map(x => '<button type="button" data-acao="f-ver" data-v="' + x[0] + '" aria-pressed="' + (f.ver === x[0]) + '">' + x[2] + x[1] + '</button>').join('') + '</div></div></header>' +
      '<div class="busca-linha"><label class="busca"><span class="sr">Buscar projeto, bairro, rua ou metrô</span>' + ICO.lupa +
      '<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Projeto, bairro, rua ou metrô" value="' + esc(f.q) + '" data-input="q">' +
      '<button type="button" class="limpar" data-acao="limpar-q" aria-label="Limpar a busca"' + (f.q ? '' : ' hidden') + '>' + ICO.fechar + '</button></label>' +
      '<button type="button" class="btn-filtro so-estreito' + (n ? ' ligado' : '') + '" id="btn-filtros" data-acao="abrir-filtros" aria-label="' + (n ? 'Filtros, ' + n + (n === 1 ? ' ligado' : ' ligados') : 'Filtros') + '">' + ICO.filtro + (n ? '<span class="bolha" aria-hidden="true">' + n + '</span>' : '') + '</button></div>' +
      '<div class="imv-grade">' +
      (largo() ? '<aside class="painel-f" id="painel-f" aria-label="Filtros">' + painelHtml() + '</aside>' : '') +
      '<div class="imv-col"><div id="imv-chips"></div>' +
      '<div class="contagem"><p id="imv-n" aria-live="polite"></p><label class="sr" for="ordem">Ordenar por</label>' +
      '<select id="ordem" data-input="ordem" class="sel">' + ORDEM_TXT.map(o => '<option value="' + o[0] + '"' + (f.ordem === o[0] ? ' selected' : '') + (o[0] === 'perto' && !f.perto ? ' disabled' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '<div id="imv-aviso"></div><div id="imv-res"></div></div></div>';
  }
  function atualizarImoveis(){
    const box = $('#imv-res'); if(!box) return;
    const f = S.f;
    const res = completar(resultado(f), f).sort(ORDENS[f.ordem] || ORDENS.vendidos);
    const L = filtrosAtivos(f);
    $('#imv-chips').innerHTML = L.length ? '<div class="pilulas ativos" aria-label="Filtros ligados">' + L.map(x => '<button type="button" class="pilula peq" data-acao="tirar" data-v="' + esc(x[0]) + '" aria-label="Tirar o filtro ' + esc(x[1]) + '">' + esc(x[1]) + ICO.x + '</button>').join('') +
      '<button type="button" class="link-mais" data-acao="limpar-tudo">Limpar tudo</button></div>' : '';
    const fu = temFU(f);
    const nU = fu && S.U ? res.reduce((s, r) => s + (r.us ? r.us.length : 0), 0) : null;
    const totU = S.U ? res.reduce((s, r) => s + (r.us ? r.us.length : (S.U.get(r.p.id) || []).length), 0) : null;
    $('#imv-n').innerHTML = f.ver === 'unidades' && totU != null
      ? '<b class="num">' + totU.toLocaleString('pt-BR') + '</b> ' + (totU === 1 ? 'unidade livre' : 'unidades livres') + ' em ' + esc(plural(res.length, 'projeto', 'projetos'))
      : '<b class="num">' + res.length.toLocaleString('pt-BR') + '</b> ' + (res.length === 1 ? 'projeto' : 'projetos') + (nU != null ? ', ' + esc(plural(nU, 'unidade livre', 'unidades livres')) + ' no filtro' : (f.livres ? ' com unidade livre' : ''));
    const sub = $('#imv-sub');
    if(sub) sub.textContent = plural(S.P.length, 'projeto', 'projetos') + (S.U ? ', ' + plural([...S.U.values()].reduce((s, a) => s + a.length, 0), 'unidade livre', 'unidades livres') : '') + ' nos espelhos, ao vivo';
    const aviso = $('#imv-aviso');
    if(aviso) aviso.innerHTML = fu && !S.U ? '<p class="aviso fino" role="status">' + (S.Uerro ? 'Não consegui abrir as unidades agora. O filtro está usando o resumo de cada projeto.' : 'Carregando as unidades para filtrar uma por uma…') + '</p>' : '';
    const nf = nFiltros(f), bf = $('#btn-filtros');
    if(bf){ bf.classList.toggle('ligado', !!nf); bf.setAttribute('aria-label', nf ? 'Filtros, ' + nf + (nf === 1 ? ' ligado' : ' ligados') : 'Filtros'); const b = bf.querySelector('.bolha'); if(nf){ if(b) b.textContent = nf; else bf.insertAdjacentHTML('beforeend', '<span class="bolha" aria-hidden="true">' + nf + '</span>'); } else if(b) b.remove(); }
    const sel = $('#ordem'); if(sel){ const o = sel.querySelector('option[value="perto"]'); if(o) o.disabled = !f.perto; if(sel.value !== f.ordem) sel.value = f.ordem; }
    $$('[data-acao="f-ver"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === f.ver));
    if(!res.length){
      const dicas = [];
      if(f.pmin || f.pmax) dicas.push('mudar o preço'); if(f.tipos.length) dicas.push('trocar a tipologia'); if(f.amin || f.amax) dicas.push('abrir a metragem');
      if(f.ent) dicas.push('aceitar entrega mais longe'); if(f.q.trim()) dicas.push('buscar outro nome ou bairro'); if(f.cons.length || f.fases.length || f.zonas.length || f.bairros.length) dicas.push('abrir a construtora ou a região');
      if(f.extras.length || f.cats.length || f.andar || f.vaga || f.m2) dicas.push('tirar algum extra');
      box.innerHTML = '<div class="vazio"><h2 class="t-3">Nada com esses filtros</h2><p class="texto-2">' + esc(dicas.length ? 'Tente ' + (dicas.length === 1 ? dicas[0] : dicas.slice(0, -1).join(', ') + ' ou ' + dicas[dicas.length - 1]) + '.' : 'Tente outra combinação.') + '</p>' +
        '<button type="button" class="btn" data-acao="limpar-tudo">Limpar os filtros</button></div>';
    }else if(f.ver === 'unidades') box.innerHTML = unidadesHtml(res) + barraSelHtml();
    else{
      const mostra = res.slice(0, f.mostra);
      box.innerHTML = '<div class="grade-cards">' + mostra.map(r => cardProj(r.p, {min: r.us ? r.min : null, n: r.us ? r.n : null, dist: r.dist})).join('') + '</div>' +
        (res.length > f.mostra ? '<button type="button" class="btn btn-largo" data-acao="mais-res">Mostrar mais ' + Math.min(12, res.length - f.mostra) + ' de ' + (res.length - f.mostra) + '</button>' : '') + barraSelHtml();
    }
    atualizarPainel();
  }

  // lista por unidade (com seleção para mandar várias ao cliente)
  function unidadesDaLista(res){
    const f = S.f, its = [];
    for(const r of res){ const us = r.us || (S.U ? (S.U.get(r.p.id) || []) : []); for(const u of us) its.push({p: r.p, u, pr: prU(u, f), dist: r.dist}); }
    const pr = x => x.pr > 0 ? x.pr : 1e12;
    const o = f.ordem;
    its.sort(o === 'precoDesc' ? (a, b) => (b.pr || 0) - (a.pr || 0)
      : o === 'm2' ? (a, b) => (a.pr > 0 && a.u.a ? a.pr / a.u.a : 1e9) - (b.pr > 0 && b.u.a ? b.pr / b.u.a : 1e9)
      : o === 'entrega' ? (a, b) => { const x = chaveEnt(a.p), y = chaveEnt(b.p); return x < y ? -1 : x > y ? 1 : pr(a) - pr(b); }
      : o === 'perto' ? (a, b) => ((a.dist == null ? 1e9 : a.dist) - (b.dist == null ? 1e9 : b.dist)) || pr(a) - pr(b)
      : o === 'vendidos' ? (a, b) => (b.p.v7 - a.p.v7) || pr(a) - pr(b)
      : o === 'estoque' ? (a, b) => (b.p.livres - a.p.livres) || pr(a) - pr(b)
      : o === 'nome' ? (a, b) => String(a.p.nome).localeCompare(String(b.p.nome), 'pt-BR') || String(a.u.n).localeCompare(String(b.u.n), 'pt-BR', {numeric: true})
      : (a, b) => pr(a) - pr(b));
    return its;
  }
  const andarCurto = at => at == null ? '' : at === 'T' ? 'Térreo' : at === 'S' ? 'Subsolo' : at === 'L' ? 'Loja' : /^\d+$/.test(at) ? at + 'º' : at;
  const vagaTxt = vg => vg == null ? '' : vg > 1 ? vg + ' vagas' : vg === 1 ? '1 vaga' : 'Sem vaga';
  function unidadesHtml(res){
    if(!S.U) return '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:52px"></div><div class="brilho" style="height:52px"></div><div class="brilho" style="height:52px"></div><p class="sub">' + (S.Uerro ? 'Não consegui abrir as unidades agora.' : 'Carregando as unidades livres…') + '</p></div>';
    const its = unidadesDaLista(res), f = S.f, lim = S.ui.unidMostra || 40;
    // duas linhas por célula (principal em cima, apoio embaixo): cabe sem cortar coluna de 600 px para cima
    const par = (a, b) => a ? '<span>' + esc(a) + '</span>' + (b ? '<small>' + esc(b) + '</small>' : '') : b ? '<span>' + esc(b) + '</span>' : '';
    const lin = x => {
      const k = x.p.id + '|' + x.u.n, mk = S.sel.has(k), m2 = x.pr > 0 && x.u.a ? x.pr / x.u.a : null;
      const tipo = x.u.k ? tipoNome(x.u.k) : '', area = x.u.a ? fmtM2(x.u.a) : '', cat = x.u.c ? CAT_TXT[x.u.c] : '';
      const andar = andarCurto(x.u.at) ? andarCurto(x.u.at) + (/^\d+$/.test(x.u.at || '') ? ' andar' : '') : '', vaga = vagaTxt(x.u.vg);
      const desc = [tipo, area, andar, vaga, cat, x.u.f & 1 ? 'mobiliado' : ''].filter(Boolean).join(', ');
      return '<div class="tu-lin' + (mk ? ' marcada' : '') + '" role="row">' +
        '<span role="cell" class="tu-ck"><button type="button" class="ck-btn" data-acao="sel-u" data-p="' + esc(x.p.id) + '" data-n="' + esc(x.u.n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(x.u.n) + ' do ' + esc(x.p.nome) + '"><span class="ck">' + ICO.ok + '</span></button></span>' +
        '<a role="cell" class="tu-proj" href="#/p/' + esc(x.p.id) + '" title="' + esc(x.p.nome) + '">' + miniProj(x.p, 'peq') + '<span><b>' + esc(x.p.nome) + '</b><small>' + esc([quemDe(x.p), x.p.bairro].filter(Boolean).join(', ')) + '</small></span></a>' +
        '<span role="cell" class="tu-n num"><b>' + esc(x.u.n) + '</b><small class="tu-desc">' + esc(desc) + '</small>' + (cat ? '<small class="tu-cat">' + esc(cat) + '</small>' : '') + '</span>' +
        '<span role="cell" class="tu-x">' + par(tipo, area) + '</span>' +
        '<span role="cell" class="tu-x">' + par(andar, [vaga, x.u.f & 1 ? 'mobiliado' : ''].filter(Boolean).join(', ')) + '</span>' +
        '<span role="cell" class="tu-p num">' + (x.pr > 0 ? '<b>' + esc(BRL(x.pr)) + '</b>' : '<span class="apoio">sem preço</span>') + (m2 ? '<small>' + esc(BRL(m2)) + '/m²</small>' : '') + '</span>' +
        '<span role="cell" class="tu-x tu-e">' + esc(entregaCurta(x.p)) + '</span></div>';
    };
    return '<div class="tab-unid"><div class="tu-corpo" role="table" aria-label="Unidades livres no filtro">' +
      '<div class="tu-lin cab" role="row"><span role="columnheader"><span class="sr">Marcar</span></span><span role="columnheader">Projeto</span><span role="columnheader">Unidade</span><span role="columnheader">Tipo e área</span><span role="columnheader">Andar e vaga</span><span role="columnheader" class="dir">' + (f.modo === 'pv' ? 'À vista' : 'Preço') + '</span><span role="columnheader">Entrega</span></div>' +
      its.slice(0, lim).map(lin).join('') + '</div></div>' +
      (its.length > lim ? '<button type="button" class="btn btn-largo" data-acao="mais-unid">Mostrar mais ' + Math.min(60, its.length - lim) + ' de ' + (its.length - lim).toLocaleString('pt-BR') + '</button>' : '');
  }
  function barraSelHtml(){
    if(!S.sel.size) return '';
    const projs = new Set([...S.sel.values()].map(v => v.p));
    return '<div class="barra-envio" id="barra-sel"><p><span><b class="num">' + S.sel.size + '</b> ' + (S.sel.size === 1 ? 'unidade' : 'unidades') + '</span><small>' + esc(plural(projs.size, 'projeto', 'projetos')) + '</small></p>' +
      '<button type="button" class="btn" data-acao="sel-limpar">Limpar</button><button type="button" class="btn btn-pri" data-acao="enviar-sel">' + ICO.enviar + '<span>Mandar<span class="so-largo"> pro cliente</span></span></button></div>';
  }

  // painel de filtros (lateral no computador, folha no celular)
  function chipF(g, v, rot, on, cnt){
    return '<button type="button" class="pilula peq" data-acao="f" data-g="' + g + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '">' + esc(rot) +
      (cnt !== undefined ? '<span class="n" data-cnt="' + g + ':' + esc(v) + '">' + (cnt || 0) + '</span>' : '') + '</button>';
  }
  const campoNum = (id, rot, val, ph, suf) => '<label class="campo mini"><span>' + rot + '</span><span class="campo-suf"><input id="' + id + '" inputmode="numeric" autocomplete="off" placeholder="' + esc(ph) + '" value="' + (val ? esc(val.toLocaleString('pt-BR')) : '') + '" data-input="fnum" data-campo="' + id + '">' + (suf ? '<i>' + suf + '</i>' : '') + '</span></label>';
  function painelHtml(){
    const f = S.f, fc = facetas(f);
    const sec = (id, tit, corpo, dica) => '<section class="fsec" data-sec="' + id + '"><h3>' + esc(tit) + (dica ? '<small>' + esc(dica) + '</small>' : '') + '</h3>' + corpo + '</section>';
    let h = '';
    h += sec('preco', 'Preço', '<div class="seg" role="group" aria-label="Qual preço">' + [['pp', 'Tabela'], ['pv', 'À vista']].map(x => '<button type="button" data-acao="f-modo" data-v="' + x[0] + '" aria-pressed="' + (f.modo === x[0]) + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="campos-2">' + campoNum('f-pmin', 'De', f.pmin, 'R$ 0') + campoNum('f-pmax', 'Até', f.pmax, 'Sem limite') + '</div>' +
      '<div class="pilulas">' + [[300000, '300 mil'], [400000, '400 mil'], [500000, '500 mil'], [750000, '750 mil'], [1000000, '1 mi'], [1500000, '1,5 mi'], [2000000, '2 mi']].map(o => '<button type="button" class="pilula peq" data-acao="f-pmax" data-v="' + o[0] + '" aria-pressed="' + (f.pmax === o[0] && !f.pmin) + '">até ' + o[1] + '</button>').join('') + '</div>', 'por unidade');
    h += sec('tipos', 'Tipologia', '<div class="pilulas">' + TIPOS.map(x => chipF('tipos', x[0], x[1], f.tipos.includes(x[0]), fc.tipos[x[0]])).join('') + '</div>');
    h += sec('area', 'Metragem', '<div class="campos-2">' + campoNum('f-amin', 'De', f.amin, '0', 'm²') + campoNum('f-amax', 'Até', f.amax, 'Sem limite', 'm²') + '</div>' +
      '<div class="pilulas">' + [[0, 30, 'até 30 m²'], [30, 45, '30 a 45'], [45, 65, '45 a 65'], [65, 90, '65 a 90'], [90, 0, '90 m² ou +']].map(o => '<button type="button" class="pilula peq" data-acao="f-area" data-v="' + o[0] + '-' + o[1] + '" aria-pressed="' + (f.amin === o[0] && f.amax === o[1]) + '">' + o[2] + '</button>').join('') + '</div>');
    h += sec('m2', 'Preço por m²', '<div class="campos-2">' + campoNum('f-m2', 'Até', f.m2, 'Sem limite', '/m²') + '</div><div class="pilulas">' + [[8000, '8 mil'], [10000, '10 mil'], [12000, '12 mil'], [15000, '15 mil'], [20000, '20 mil']].map(o => '<button type="button" class="pilula peq" data-acao="f-m2" data-v="' + o[0] + '" aria-pressed="' + (f.m2 === o[0]) + '">até ' + o[1] + '</button>').join('') + '</div>');
    h += sec('andar', 'Andar', '<div class="pilulas">' + [[0, 'Qualquer'], [5, '5º ou +'], [10, '10º ou +'], [15, '15º ou +'], [20, '20º ou +']].map(o => '<button type="button" class="pilula peq" data-acao="f-andar" data-v="' + o[0] + '" aria-pressed="' + (f.andar === o[0]) + '">' + o[1] + '</button>').join('') + '</div>');
    h += sec('vaga', 'Vaga de garagem', '<div class="pilulas">' + [[0, 'Tanto faz'], [1, 'Com vaga'], [2, '2 vagas ou +']].map(o => '<button type="button" class="pilula peq" data-acao="f-vaga" data-v="' + o[0] + '" aria-pressed="' + (f.vaga === o[0]) + '">' + o[1] + '</button>').join('') + '</div>', 'onde o espelho informa');
    h += sec('ent', 'Entrega', '<div class="pilulas">' + [['', 'Tanto faz'], ['pronto', 'Pronto'], ['2026', 'até 2026'], ['2027', 'até 2027'], ['2028', 'até 2028'], ['2029', 'até 2029'], ['2030', 'até 2030']].map(o => '<button type="button" class="pilula peq" data-acao="f-ent" data-v="' + o[0] + '" aria-pressed="' + (f.ent === o[0]) + '">' + o[1] + (o[0] ? '<span class="n" data-cnt="ent:' + o[0] + '">' + (fc.ent[o[0]] || 0) + '</span>' : '') + '</button>').join('') + '</div>' +
      '<p class="fsub">Fase da obra</p><div class="pilulas">' + ['lanc', 'breve', 'obras', 'pronto'].map(k => chipF('fases', k, FASE_CURTA[k], f.fases.includes(k), fc.fases[k])).join('') + '</div>');
    h += sec('mob', 'Mobília', '<div class="pilulas">' + chipF('extras', 'mob', 'Mobiliado', f.extras.includes('mob'), fc.extras.mob) + '</div>', 'entregue com móveis, onde a ficha informa');
    h += sec('regiao', 'Região', '<div class="pilulas">' + Object.keys(ZONA).filter(z => S.P.some(p => p.zona === z)).map(z => chipF('zonas', z, ZONA[z], f.zonas.includes(z), fc.zonas[z])).join('') + '</div>' +
      '<p class="fsub">Bairros</p><label class="busca mini"><span class="sr">Buscar bairro</span>' + ICO.lupa + '<input id="f-bairro-q" type="search" autocomplete="off" placeholder="Buscar bairro" value="' + esc(S.ui.bairroQ) + '" data-input="bairro-q"></label>' +
      '<div class="pilulas" id="f-bairros">' + bairrosChips(fc) + '</div>' +
      '<p class="fsub">Perto de você</p>' + (f.perto ? '<div class="pilulas">' + [1, 2, 3, 5, 10].map(r => '<button type="button" class="pilula peq" data-acao="f-raio" data-v="' + r + '" aria-pressed="' + (f.perto.raio === r) + '">até ' + r + ' km</button>').join('') + '<button type="button" class="link-mais" data-acao="f-perto-off">Desligar</button></div>'
        : '<button type="button" class="btn btn-peq" data-acao="f-perto">' + ICO.mira + 'Usar minha localização</button><p class="nota">A localização fica só neste aparelho.</p>'));
    h += sec('cons', 'Construtora', '<div class="pilulas">' + gruposPresentes().map(k => chipF('cons', k, nomeGrupo(k), f.cons.includes(k), fc.cons[k])).join('') + '</div>');
    h += sec('cats', 'Enquadramento', '<div class="pilulas">' + CATS.map(x => chipF('cats', x[0], x[1], f.cats.includes(x[0]), fc.cats[x[0]])).join('') + '</div>', 'categoria da unidade no espelho');
    h += sec('extras', 'Extras da unidade', '<div class="pilulas">' + EXTRAS.filter(x => x[0] !== 'mob').map(x => chipF('extras', x[0], x[1], f.extras.includes(x[0]), fc.extras[x[0]])).join('') + '</div>');
    h += sec('mov', 'Movimento', '<div class="pilulas">' + [['', 'Tanto faz'], ['hoje', 'Mexeu hoje'], ['semana', 'Vendeu na semana']].map(o => '<button type="button" class="pilula peq" data-acao="f-mov" data-v="' + o[0] + '" aria-pressed="' + (f.mov === o[0]) + '">' + o[1] + (o[0] ? '<span class="n" data-cnt="mov:' + o[0] + '">' + (fc.mov[o[0]] || 0) + '</span>' : '') + '</button>').join('') + '</div>');
    h += sec('estoque', 'Estoque', '<div class="pilulas">' + '<button type="button" class="pilula peq" data-acao="f-livres" data-v="1" aria-pressed="' + f.livres + '">Só com unidade livre</button><button type="button" class="pilula peq" data-acao="f-livres" data-v="0" aria-pressed="' + !f.livres + '">Incluir esgotados</button></div>');
    h += '<div class="painel-pe so-largo"><button type="button" class="btn btn-largo" data-acao="limpar-tudo">Limpar os filtros</button><p class="nota">Os números contam projetos com o resto do filtro aplicado.</p></div>';
    return h;
  }
  function bairrosChips(fc){   // os 14 bairros com mais projetos, ou os que batem com a busca, mais os já marcados
    const f = S.f, todos = {};
    for(const p of S.P){ if(p.bairro && (!f.livres || p.livres)) todos[p.bairro] = (todos[p.bairro] || 0) + 1; }
    const bq = norm(S.ui.bairroQ).trim();
    let bs = Object.keys(todos);
    bs = bq ? bs.filter(b => norm(b).includes(bq)) : bs.sort((a, b) => (todos[b] - todos[a]) || a.localeCompare(b, 'pt-BR')).slice(0, 14);
    const bSel = f.bairros.filter(b => !bs.includes(b));
    return bSel.concat(bs.sort((a, b) => a.localeCompare(b, 'pt-BR'))).map(b => chipF('bairros', b, b, f.bairros.includes(b), fc.bairros[b])).join('') +
      (bq && !bs.length ? '<p class="texto-2">Nenhum bairro com esse nome.</p>' : '');
  }
  function atualizarPainel(){   // repinta o painel guardando o foco e a rolagem
    const alvos = [$('#painel-f'), $('#folha-filtros .folha-corpo')].filter(Boolean);
    for(const box of alvos){
      const ae = document.activeElement;
      if(ae && box.contains(ae) && ae.tagName === 'INPUT') { atualizarContagens(box); continue; }
      const chave = ae && box.contains(ae) ? (ae.dataset.acao || '') + '|' + (ae.dataset.g || '') + '|' + (ae.dataset.v || '') : null;
      const y = box.scrollTop;
      box.innerHTML = painelHtml();
      box.scrollTop = y;
      if(chave){ const [a, g, v] = chave.split('|'); const el = $$('[data-acao="' + a + '"]', box).find(e => (e.dataset.g || '') === g && (e.dataset.v || '') === v); if(el) el.focus({preventScroll: true}); }
    }
    const vn = $('#ver-n'); if(vn) vn.textContent = verNTxt();
  }
  function atualizarContagens(box){
    const fc = facetas(S.f);
    $$('[data-cnt]', box).forEach(s => { const [g, v] = s.dataset.cnt.split(/:(.*)/s); const n = fc[g] ? fc[g][v] || 0 : 0; s.textContent = n; });
  }
  const verNTxt = () => { const r = resultado(S.f); return S.f.ver === 'unidades' && S.U ? 'Ver ' + plural(r.reduce((s, x) => s + (x.us ? x.us.length : (S.U.get(x.p.id) || []).length), 0), 'unidade', 'unidades') : 'Ver ' + plural(r.length, 'projeto', 'projetos'); };
  function abrirFiltros(){
    abrirFolha('filtros', 'Filtros', painelHtml(), '<button type="button" class="btn" data-acao="limpar-tudo">Limpar</button><button type="button" class="btn btn-pri" data-acao="fechar-folha" id="ver-n">' + verNTxt() + '</button>', 'folha-alta');
  }
  function mudouFiltro(){ S.f.mostra = 12; S.ui.unidMostra = 40; salvarF(); atualizarImoveis(); }
  function pedirLocal(){
    if(!navigator.geolocation){ toast('Este aparelho não informa a localização.'); return; }
    toast('Procurando sua localização…', 6000);
    navigator.geolocation.getCurrentPosition(p => {
      S.f.perto = {lat: p.coords.latitude, lng: p.coords.longitude, raio: (S.f.perto && S.f.perto.raio) || 3};
      S.f.ordem = 'perto'; mudouFiltro(); toast('Mostrando os mais perto de você.');
    }, () => toast('Não consegui sua localização. Libere a localização para este site e tente de novo.', 5000), {enableHighAccuracy: false, timeout: 12000, maximumAge: 600000});
  }
  const lerNum = s => { const d = String(s || '').replace(/\D/g, ''); return d ? +d : 0; };

  // ================= PROJETO =================
  const exDe = a => (a && a[7] && typeof a[7] === 'object') ? a[7] : {};
  const areaU = a => { const ex = exDe(a); return ex.a != null ? +ex.a : (a[2] != null ? +a[2] : null); };
  function tipologiaU(det, a){
    const tl = exDe(a).tl; if(tl != null && String(tl).trim()) return String(tl).trim();
    const r = det.info && det.info.tipologias_regra, ar = areaU(a);
    if(Array.isArray(r) && ar > 0){ let best = null; for(const q of r){ if(ar <= +q[0] && (!best || +q[0] < +best[0])) best = q; } if(best) return best[1]; }
    return null;
  }
  const andarTxt = v => v === 'T' ? 'térreo' : v === 'S' ? 'subsolo' : v === 'L' ? 'loja' : (v != null && v !== '' ? v + 'º andar' : '');
  function precosCampos(det){
    const pc = (det.dados && Array.isArray(det.dados.precos_campos)) ? det.dados.precos_campos.filter(x => x && x.k) : [];
    if(pc.length) return pc;
    const u = (det.dados.unidades || []).find(a => exDe(a).pp != null || exDe(a).pv != null);
    if(!u) return [{k: 'pp', label: 'Tabela'}];
    const ex = exDe(u), out = []; if(ex.pp != null) out.push({k: 'pp', label: 'Parcelado'}); if(ex.pv != null) out.push({k: 'pv', label: 'À vista'});
    return out.length ? out : [{k: 'pp', label: 'Tabela'}];
  }
  const chaveBase = det => { const pc = precosCampos(det); return pc.some(x => x.k === 'pp') ? 'pp' : pc[0].k; };
  const precoU = (a, k) => { const v = exDe(a)[k]; return typeof v === 'number' && v > 0 ? v : null; };
  const stLabel = (det, st) => (det.dados.status && det.dados.status[st]) || ({disponivel: 'Disponível', reservada: 'Reservada', vendida: 'Vendida', processo_final: 'Em processo'}[st] || st);
  const nomeTabela = t => /^tabela/i.test(String(t).trim()) ? String(t).trim() : 'Tabela ' + t;
  const vagaDe = (det, a) => { const v = det.info && det.info.vagas; if(!v || !['todas', 'algumas', 'nenhuma'].includes(v.r)) return null; if(v.r === 'nenhuma') return 0; const n = v.u && typeof v.u === 'object' ? parseInt(v.u[String(a[0])], 10) : NaN; return n > 0 ? n : (v.r === 'todas' && !(v.u && typeof v.u === 'object') ? 1 : 0); };

  // book do empreendimento: da central (no próprio site ou no Drive), da documentação da construtora, do material do WhatsApp,
  // o PDF achado na pasta do book (servidor) e, por último, a pasta do book no Drive
  ICO.livro = svg('<path d="M12 6.5C10 5 7 4.5 4 5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5V20"/>');
  const driveBaixar = id => 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id);
  const idDrive = id => !!id && /^[A-Za-z0-9_-]{10,}$/.test(String(id)) && !/^[a-z]+-/.test(String(id));
  const idPasta = u => { const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(String(u || '')); return m ? m[1] : null; };
  function bookDe(det, c){
    if(c && c.book && c.pasta && /^[A-Za-z0-9_.-]+\.pdf$/i.test(c.book)) return {u: ESP + 'nex/' + c.pasta + c.book, t: 'Book do empreendimento', s: 'PDF', arq: true, mesmo: true};
    const mo = c && Array.isArray(c.material_oficial) ? c.material_oficial.filter(m => m && idDrive(m.id) && /book/i.test((m.c || '') + ' ' + (m.n || ''))) : [];
    const m = mo.find(x => /cliente/i.test(x.c || '')) || mo.find(x => !/vista/i.test(x.c || '')) || mo[0];
    if(m) return {u: driveBaixar(m.id), t: m.c || 'Book', s: m.mb ? String(m.mb).replace('.', ',') + ' MB' : 'PDF', arq: true};
    const dp = det.docs && det.docs.projeto;
    const d = dp && Array.isArray(dp.docs) ? dp.docs.find(x => x && x.c === 'book' && (urlSegura(x.u) || (x.x !== 'link' && idDrive(x.id)))) : null;
    if(d) return {u: urlSegura(d.u) || driveBaixar(d.id), t: d.t || d.a || 'Book', s: [d.a, d.d].filter(Boolean).join(', ') || 'PDF', arq: true};
    const mat = det.info && Array.isArray(det.info.material) ? det.info.material.find(x => x && x.tipo === 'pdf' && /book/i.test(x.t || '') && urlSegura(x.u)) : null;
    if(mat) return {u: mat.u, t: mat.t, s: 'PDF', arq: true};
    if(det.book && idDrive(det.book.id)) return {u: driveBaixar(det.book.id), t: det.book.t || 'Book', s: 'PDF', arq: true};
    const pid = idPasta(det.info && det.info.drive && det.info.drive.book) || (dp && Array.isArray(dp.pastas) ? (dp.pastas.find(x => x && /^book/i.test(x.c || '') && idDrive(x.id)) || {}).id : null);
    if(pid) return {u: drivePasta(pid), t: 'Pasta do book', s: 'Google Drive', arq: false};
    return null;
  }

  // fluxo de pagamento (mesma regra do app dos Espelhos)
  function fluxoDe(det, a){
    const ex = exDe(a), F = det.dados.tabela && det.dados.tabela.fluxos, FI = det.info && det.info.fluxo;
    let T = null, src = null;
    if(F){ const f = ex.fs || ex.fa; if(f && F[f[0]]){ T = F[f[0]]; src = 'T'; } }
    if(!T && FI && Array.isArray(FI.tabelas) && FI.tabelas.length){ T = FI.tabelas.find(t => t.tipos && t.tipos.includes(a[3])) || FI.tabelas.find(t => t.padrao) || FI.tabelas[0]; src = 'I'; }
    if(!T || !Array.isArray(T.cols)) return null;
    const L = [];
    if(src === 'T'){ const f = ex.fs || ex.fa; T.cols.forEach((c, i) => { const v = +f[i + 1]; if(v > 0) L.push({n: c.n || 1, v, d: c.d, t: c.t, rot: c.rot, fin: c.t === 'fin'}); }); }
    else {
      const tot = ex[FI.base || 'pp'];
      if(FI.aprox || !(tot > 0)) return {T, linhas: [], aprox: true};
      let usado = 0;
      T.cols.forEach(c => { if(c.t === 'fin') return; const n = c.n || 1, v = tot * (+c.p || 0) / 100 / n; usado += v * n; if(v > 0) L.push({n, v, d: c.d, t: c.t, rot: c.rot}); });
      const f = T.cols.find(c => c.t === 'fin'); if(f) L.push({n: 1, v: tot - usado, d: f.d, t: 'fin', rot: f.rot, fin: true});
    }
    const total = L.reduce((s, l) => s + l.v * l.n, 0);
    return {T, linhas: L, total, src};
  }
  const ROT_FLUXO = {ato: 'Ato', sinal: 'Sinal', parc: 'Parcelas', mensal: 'Mensais', semestral: 'Semestrais', anual: 'Anuais', inter: 'Intermediárias', unica: 'Parcela única', chaves: 'Chaves', fin: 'Financiamento'};
  const CORES_FLUXO = ['#C8A24A', '#B08E42', '#9C7F3A', '#85703C', '#6E5F3A', '#5E5236'];
  function fluxoHtml(det, a){
    const fx = fluxoDe(det, a);
    const corr = (det.info && det.info.fluxo && det.info.fluxo.correcao) || (det.dados.tabela && det.dados.tabela.correcao) || '';
    const obs = det.info && det.info.fluxo && det.info.fluxo.obs;
    const cond = det.dados.tabela && Array.isArray(det.dados.tabela.condicoes) ? det.dados.tabela.condicoes.filter(Boolean) : [];
    if(!fx || !fx.linhas.length){
      if(!cond.length) return '';
      return '<p class="texto-2">Condições da ' + esc((det.dados.tabela && det.dados.tabela.nome) || 'tabela') + ':</p><ul class="lista-txt">' + cond.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>';
    }
    const tot = fx.total, fin = fx.linhas.filter(l => l.fin).reduce((s, l) => s + l.v * l.n, 0), ate = tot - fin;
    let ci = 0;
    const cores = fx.linhas.map(l => l.fin ? null : CORES_FLUXO[Math.min(ci++, CORES_FLUXO.length - 1)]);
    const corDe = (l, i) => l.fin ? 'var(--fin)' : cores[i];
    return '<div class="fluxo-barra" role="img" aria-label="' + esc(pctTxt(pct(ate, tot)) + ' pagos até as chaves' + (fin ? ' e ' + pctTxt(pct(fin, tot)) + ' no financiamento' : '')) + '">' +
      fx.linhas.map((l, i) => '<i class="' + (l.fin ? 'fin' : '') + '" style="width:' + pct(l.v * l.n, tot) + '%;background:' + corDe(l, i) + '"></i>').join('') + '</div>' +
      '<div class="fluxo-leg num"><span>' + esc(pctTxt(pct(ate, tot))) + ' até as chaves</span>' + (fin ? '<span>' + esc(pctTxt(pct(fin, tot))) + ' no financiamento</span>' : '') + '</div>' +
      '<dl class="fluxo-lista">' + fx.linhas.map((l, i) => '<div><span class="cor' + (l.fin ? ' fin' : '') + '" aria-hidden="true" style="background:' + corDe(l, i) + '"></span>' +
      '<dt>' + esc(l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + '<small>' + esc((l.n > 1 ? l.n + ' parcelas' : '1 parcela') + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')) + '</small></dt>' +
      '<dd><b class="num">' + esc((l.n > 1 ? l.n + 'x ' : '') + BRL(l.v)) + '</b><small>' + esc(pctTxt(pct(l.v * l.n, tot))) + '</small></dd></div>').join('') + '</dl>' +
      ((corr || obs) ? '<p class="nota">' + esc([corr, obs].filter(Boolean).join(' ')) + '</p>' : '');
  }
  function fotosDoProjeto(det, c){
    const out = [], vistos = new Set();
    const add = (src, t, th, mesma) => { if(!src) return; const k = original(src); if(vistos.has(k)) return; vistos.add(k); out.push({src, t: t || '', th: th || (temTamanhos(src) ? tamImg(src, 480) : null), mesma: !!mesma}); };
    if(c && Array.isArray(c.renders)) for(const r of c.renders) add(imgCentral(c, r.id), r.t, imgCentral(c, r.id, true), true);
    if(!out.length) add(det.info && urlImg(det.info.capa), 'Fachada');
    for(const f of (det.fotos || [])){ if(out.length >= 48) break; add(urlImg(f && f.u), f && f.t, urlImg(f && f.th), /^nex\//.test((f && f.u) || '')); }
    const mat = det.info && Array.isArray(det.info.material) ? det.info.material : [];
    for(const m of mat) if(m && m.tipo === 'foto') add(urlSegura(m.u), m.t);
    return out;
  }
  function plantasDoProjeto(det, c){
    const out = [];
    if(c && Array.isArray(c.plantas)) for(const pl of c.plantas) out.push({src: imgCentral(c, pl.id), t: pl.t ? 'Planta ' + pl.t : 'Planta', sub: pl.andares ? pl.andares + (pl.finais && pl.finais.length ? ', finais ' + pl.finais.map(x => String(x).padStart(2, '0')).join(', ') : '') : ''});
    if(!out.length && det.info && Array.isArray(det.info.plantas)) for(const pl of det.info.plantas){ const u = urlImg(pl && pl.u); if(u) out.push({src: u, t: pl.t || 'Planta', sub: pl.a || ''}); }
    const mat = det.info && Array.isArray(det.info.material) ? det.info.material : [];
    for(const m of mat) if(m && m.tipo === 'planta' && urlSegura(m.u)) out.push({src: m.u, t: m.t || 'Planta', sub: ''});
    return out;
  }
  function telaProjeto(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2 class="t-3">Projeto não encontrado</h2><p class="texto-2">Ele pode ter saído dos espelhos.</p><a class="btn" href="#/imoveis">Ver os imóveis</a></div>';
    const cache = S.det.get(id), det = cache && cache.v, c = S.centralV.get(id);
    S.vistoProj = det && c !== undefined ? id + ':' + det.gerado_em + ':' + (c ? 1 : 0) : null;
    pos.push(() => carregarProjeto(id));
    if(!det || c === undefined) return migalha(p) + galeriaHtml(p, p.capa ? [{src: p.capa, t: 'Fachada'}] : []) + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:54px;width:70%"></div><div class="brilho" style="height:8px"></div><div class="brilho" style="height:180px"></div><p class="sub">Buscando os preços de hoje no espelho…</p></div>';
    return projetoHtml(p, det, c);
  }
  async function carregarProjeto(id){
    const alvo = '#/p/' + id;
    try{
      const [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]);
      if(location.hash !== alvo) return;
      if(S.vistoProj !== id + ':' + det.gerado_em + ':' + (c ? 1 : 0)) render();
    }catch(e){
      if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return; }
      if(location.hash !== alvo) return;
      const box = $('.esqueleto'); if(box) box.outerHTML = '<div class="faixa-aviso" role="alert"><div class="aviso erro">' + ICO.nuvem + '<p>Não consegui abrir a ficha agora. Confira a internet e tente de novo.</p></div><button type="button" class="btn btn-largo" data-acao="recarregar">Tentar de novo</button></div>';
    }
  }
  const migalha = p => '<nav class="migalha" aria-label="Caminho"><a href="#/imoveis" data-acao="voltar">' + ICO.voltar + 'Imóveis</a><span class="so-largo">' + esc(quemDe(p)) + '</span><span class="so-largo" aria-current="page">' + esc(p.nome) + '</span></nav>';
  function galeriaHtml(p, fotos){
    S.fotosAtuais = fotos;
    if(!fotos.length) return '<section class="galeria vazia" aria-label="Fotos do projeto">' + capaVazia(p, 'galeria-vazia') + '</section>';
    if(largo()){
      const g = fotos.slice(0, 5);
      return '<section class="mosaico n' + g.length + '" aria-label="Fotos do projeto">' + g.map((f, i) => '<button type="button" class="mos-item" data-acao="luz" data-i="' + i + '" aria-label="' + esc('Ampliar ' + (f.t || 'foto ' + (i + 1))) + '">' +
        imgTag(f.src, f.t || ('Foto ' + (i + 1) + ' do ' + p.nome), '', {w: i === 0 ? 1600 : 800, sizes: i === 0 ? '50vw' : '25vw', prioridade: i === 0}) + '</button>').join('') +
        '<button type="button" class="btn btn-vidro mos-todas" data-acao="luz" data-i="0">' + ICO.fotos + 'Ver as ' + fotos.length + ' fotos</button></section>';
    }
    return '<section class="galeria-movel" aria-label="Fotos do projeto"><div class="trilho" id="gal" tabindex="0" aria-label="Fotos: deslize para o lado">' +
      fotos.map((f, i) => '<figure><button type="button" class="mos-item" data-acao="luz" data-i="' + i + '" aria-label="' + esc('Ampliar ' + (f.t || 'foto ' + (i + 1))) + '">' + imgTag(f.src, f.t || ('Foto ' + (i + 1) + ' do ' + p.nome), '', {w: 1080, sizes: '92vw', prioridade: i === 0}) + '</button></figure>').join('') + '</div>' +
      '<p class="gal-n num"><span id="gal-t">' + esc(fotos[0].t || '') + '</span><span id="gal-n">1 de ' + fotos.length + '</span></p></section>';
  }
  function unidadeRef(det, chave){   // a mais barata livre (com preço), para o "a partir de" e o fluxo
    const us = (det.dados.unidades || []).filter(a => a[6] === 'disponivel' && precoU(a, chave));
    us.sort((x, y) => precoU(x, chave) - precoU(y, chave));
    return us[0] || null;
  }
  function porTipologia(det, chave){
    const g = new Map();
    for(const a of (det.dados.unidades || [])){
      if(a[6] !== 'disponivel') continue;
      const t = tipologiaU(det, a) || 'Outras unidades', ar = areaU(a), v = precoU(a, chave);
      const x = g.get(t) || {t, n: 0, amin: null, amax: null, pmin: null};
      x.n++; if(ar > 0){ x.amin = x.amin == null ? ar : Math.min(x.amin, ar); x.amax = x.amax == null ? ar : Math.max(x.amax, ar); }
      if(v){ x.pmin = x.pmin == null ? v : Math.min(x.pmin, v); }
      g.set(t, x);
    }
    return [...g.values()].sort((a, b) => (a.pmin == null ? 1e12 : a.pmin) - (b.pmin == null ? 1e12 : b.pmin));
  }
  function painelProj(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det), pc = precosCampos(det), bk = bookDe(det, c);
    const temPv = pc.some(x => x.k === 'pv');
    const us = d.unidades || [];
    const tot = us.length, liv = us.filter(a => a[6] === 'disponivel').length, vend = us.filter(a => a[6] === 'vendida').length, res = us.filter(a => a[6] === 'reservada').length, proc = us.filter(a => a[6] === 'processo_final').length;
    const ref = unidadeRef(det, chave);
    const pRef = ref ? precoU(ref, chave) : null, pvRef = ref && temPv ? precoU(ref, 'pv') : null;
    const regra = (d.tabela && (d.tabela.regra_curta || d.tabela.regra_avista)) || '';
    const tab = d.tabela || {};
    return '<section class="painel-proj" aria-labelledby="cot-t"><h2 class="rotulo" id="cot-t">' + (pRef ? esc((pc.find(x => x.k === chave) || {}).label === 'À vista' ? 'À vista a partir de' : 'Tabela a partir de') : 'Tabela') + '</h2>' +
      (pRef ? '<p class="valor num">' + esc(BRL(pRef)) + '</p>' : '<p class="valor sem">' + (liv ? 'Sem preço publicado' : 'Esgotado no espelho') + '</p>') +
      (ref ? '<p class="texto-2">' + (pvRef && chave !== 'pv' ? 'ou <strong>' + esc(BRL(pvRef)) + ' à vista</strong>. ' : '') + esc([tipologiaU(det, ref), areaU(ref) ? fmtM2(areaU(ref)) : '', 'unidade ' + ref[0]].filter(Boolean).join(', ')) + '.</p>' : '') +
      (regra ? '<p class="nota">' + esc(regra) + '</p>' : '') +
      '<div class="estoque"><div class="l1"><b>' + esc(pctTxt(pct(tot - liv, tot))) + ' do estoque já saiu</b><span class="num">' + esc(liv + ' livres de ' + tot) + '</span></div>' +
      '<div class="barra" role="img" aria-label="' + esc(vend + ' vendidas, ' + (res + proc) + ' reservadas ou em processo e ' + liv + ' livres') + '"><i class="vd" style="width:' + pct(vend, tot) + '%"></i><i class="rs" style="width:' + pct(res + proc, tot) + '%"></i></div>' +
      '<div class="legenda num"><span><i class="c-vd"></i>' + vend + ' vendidas</span><span><i class="c-rs"></i>' + (res + proc) + ' reservadas</span><span><i class="c-lv"></i>' + liv + ' livres</span></div></div>' +
      '<div class="acoes-proj"><button type="button" class="btn btn-pri btn-alto" data-acao="enviar" data-id="' + esc(p.id) + '">' + ICO.enviar + 'Mandar pro cliente</button>' +
      '<div class="btn-linha' + (bk ? ' tres' : '') + '"><a class="btn" href="#/tabelas/' + esc(p.id) + '">' + ICO.planilha + 'Tabela</a>' +
      (bk ? '<a class="btn" href="' + esc(bk.u) + '" target="_blank" rel="noopener"' + (bk.mesmo ? ' download' : '') + ' title="' + esc(bk.arq ? 'Baixar o book (' + bk.t + ')' : 'Abrir a pasta do book no Google Drive') + '">' + ICO.livro + 'Book</a>' : '') +
      '<button type="button" class="btn" data-acao="menu-baixar" data-id="' + esc(p.id) + '">' + ICO.baixar + 'Baixar</button></div>' +
      '<div class="btn-linha"><a class="btn btn-fino" href="#/comparar?p=' + encodeURIComponent(p.id) + '">' + ICO.comparar + 'Comparar</a><a class="btn btn-fino" href="#/posts/' + esc(p.id) + '">' + ICO.foto + 'Criar post</a></div></div>' +
      '<p class="nota">' + esc([tab.nome ? nomeTabela(tab.nome) : '', d.atualizado_em ? 'espelho lido ' + quandoTxt(Date.parse(d.atualizado_em)) : ''].filter(Boolean).join(', ')) + '.</p></section>';
  }
  function projetoHtml(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det);
    const us = d.unidades || [];
    const areas = us.filter(a => a[6] === 'disponivel').map(areaU).filter(v => v > 0);
    const fotos = fotosDoProjeto(det, c);
    const fase = FASE[info.fase] || d.fase || '';
    let h = migalha(p) + galeriaHtml(p, fotos);
    const tipos = porTipologia(det, chave);
    const cab = '<header class="cab-proj"><p class="sub">' + esc([fase && fase + (quemDe(p) ? ' da ' + quemDe(p) : ''), noBairro(p.bairro || info.bairro)].filter(Boolean).join(' ')) + '</p>' +
      '<h1 class="t-0">' + esc(p.nome) + '</h1>' + (info.endereco || d.endereco ? '<p class="texto-2">' + ICO.pino + esc(info.endereco || d.endereco) + (p.cidade && p.cidade !== 'São Paulo' ? ', ' + esc(p.cidade) : '') + '</p>' : '') + '</header>' +
      '<ul class="fatos">' +
      (tipos.length ? '<li><small>Tipologias</small><b>' + esc(tiposTxt(p.tipos) || tipos.map(t => t.t).slice(0, 3).join(', ')) + '</b></li>' : '') +
      (areas.length ? '<li><small>Metragem</small><b class="num">' + esc(Math.min(...areas) === Math.max(...areas) ? fmtM2(Math.round(Math.min(...areas))) : Math.round(Math.min(...areas)) + ' a ' + fmtM2(Math.round(Math.max(...areas)))) + '</b></li>' : '') +
      '<li><small>Entrega</small><b>' + esc(info.fase === 'pronto' ? 'Pronto para morar' : (mesAno(info.entrega) ? maiusc1(mesAno(info.entrega)) : (d.fase || 'A definir'))) + '</b></li>' +
      (info.vagas && info.vagas.r && info.vagas.r !== '?' ? '<li><small>Vaga</small><b>' + esc({todas: 'Todas com vaga', algumas: 'Algumas unidades', nenhuma: 'Sem vaga'}[info.vagas.r] || '') + '</b></li>' : '') +
      '<li><small>Livres</small><b class="num">' + esc(p.livres + ' de ' + p.total) + '</b></li></ul>';
    let corpo = '';
    if(tipos.length){
      corpo += '<section class="sec" aria-labelledby="tip-t"><div class="sec-cab"><h2 class="t-2" id="tip-t">Unidades livres por tipologia</h2><a class="link-mais" href="#/tabelas/' + esc(p.id) + '">Ver todas ' + ICO.seta + '</a></div>' +
        '<div class="tab-tipos" role="table"><div class="tt-lin cab" role="row"><span role="columnheader">Tipologia</span><span role="columnheader">Livres</span><span role="columnheader">Metragem</span><span role="columnheader" class="dir">A partir de</span></div>' +
        tipos.slice(0, 10).map(t => '<a class="tt-lin" role="row" href="#/tabelas/' + esc(p.id) + '" data-acao="tab-tipo" data-v="' + esc(t.t) + '"><span role="cell"><b>' + esc(t.t) + '</b></span><span role="cell" class="num">' + t.n + '</span><span role="cell" class="num">' + esc(t.amin ? (Math.round(t.amin) === Math.round(t.amax) ? fmtM2(Math.round(t.amin)) : Math.round(t.amin) + ' a ' + fmtM2(Math.round(t.amax))) : '') + '</span><span role="cell" class="dir num ouro">' + (t.pmin ? esc(BRL(t.pmin)) : '<span class="apoio">sem preço</span>') + '</span></a>').join('') + '</div></section>';
    }
    const ref = unidadeRef(det, chave);
    { const fh = fluxoHtml(det, ref || us[0] || []); if(fh) corpo += '<section class="sec fluxo" aria-labelledby="flx-t"><h2 class="t-2" id="flx-t">Como o cliente paga</h2>' + (ref ? '<p class="texto-2">' + esc('Na unidade ' + ref[0] + (precoU(ref, chave) ? ' de ' + BRL(precoU(ref, chave)) : '') + ', a mais em conta livre hoje.') + '</p>' : '') + fh + '</section>'; }
    const mov = (det.mov || []).slice(0, 8);
    if(mov.length){
      const porN = new Map(us.map(a => [String(a[0]), a]));
      corpo += '<section class="sec" aria-labelledby="mov-t"><div class="sec-cab"><h2 class="t-2" id="mov-t">Movimento no espelho</h2><a class="link-mais" href="#/pregao">Pregão ' + ICO.seta + '</a></div>' +
        '<p class="texto-2">' + (p.v7 || p.r7 ? '<strong class="ouro">' + esc(plural(p.v7, 'venda', 'vendas')) + '</strong> e ' + esc(plural(p.r7, 'reserva', 'reservas')) + ' em 7 dias.' : 'Sem vendas nem reservas nos últimos 7 dias.') + '</p>' +
        '<ul class="mov">' + mov.map(m => {
          const mm = {tipo: m[2] === 'vendida' ? 'venda' : m[2] === 'reservada' ? 'reserva' : m[2] === 'processo_final' ? 'processo' : m[2] === 'disponivel' ? 'voltou' : 'outro', para: m[2]};
          const a = porN.get(String(m[0])), v = a ? precoU(a, chave) : null;
          return '<li><span class="h num">' + esc(quandoTxt(m[3] * 1000)) + '</span><span class="m"><strong class="u num">' + esc(m[0]) + '</strong> <span class="' + statusCls(mm) + '">' + esc(statusTxt(mm)) + '</span>' +
            (a ? '<small>' + esc([tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : '', andarTxt(a[4])].filter(Boolean).join(', ')) + '</small>' : '') + '</span>' +
            '<span class="v num' + (mm.tipo === 'venda' ? ' ouro' : '') + '">' + (v ? esc(BRLc(v)) : '') + '</span></li>';
        }).join('') + '</ul></section>';
    }
    const sobre = c && c.intro ? c.intro : (c && c.chamada) || info.destaque || '';
    const tipTxt = c && Array.isArray(c.tipologias) && c.tipologias.length ? c.tipologias.map(t => t[0] + (t[1] ? ' (' + t[1] + ')' : '')).join(', ') : (typeof info.tipologias === 'string' ? info.tipologias : '');
    if(sobre || tipTxt) corpo += '<section class="sec" aria-labelledby="sob-t"><h2 class="t-2" id="sob-t">Sobre</h2>' + (sobre ? '<p class="texto ler">' + esc(sobre) + '</p>' : '') + (tipTxt ? '<p class="texto-2">' + esc(tipTxt) + '</p>' : '') + '</section>';
    const lazerC = c && Array.isArray(c.lazer) && c.lazer.length ? c.lazer : null;
    const lazerI = Array.isArray(info.lazer) ? info.lazer.filter(Boolean) : [];
    if(lazerC){
      corpo += '<section class="sec" aria-labelledby="laz-t"><h2 class="t-2" id="laz-t">Lazer</h2>' + lazerC.map(l => '<div class="lazer-bloco"><h3>' + esc(l.onde || '') + '</h3><p>' + esc((l.itens || []).join(', ')) + '</p></div>').join('') +
        (lazerC.some(l => l.planta) ? '<div class="fotos-linha">' + lazerC.filter(l => l.planta).map(l => '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-plantas-lazer" data-src="' + esc(imgCentral(c, l.planta)) + '">' + imgTag(imgCentral(c, l.planta), 'Planta do lazer: ' + (l.onde || '')) + '</button><figcaption>' + esc(l.onde || '') + '</figcaption></figure>').join('') + '</div>' : '') + '</section>';
    }else if(lazerI.length){
      corpo += '<section class="sec" aria-labelledby="laz-t"><h2 class="t-2" id="laz-t">Lazer <span class="q">' + lazerI.length + '</span></h2><ul class="pilulas lazer">' + lazerI.map(x => '<li class="pilula peq estatica">' + esc(x) + '</li>').join('') + '</ul></section>';
    }
    const plantas = plantasDoProjeto(det, c);
    S.plantasAtuais = plantas;
    if(plantas.length){
      corpo += '<section class="sec" aria-labelledby="pla-t"><div class="sec-cab"><h2 class="t-2" id="pla-t">Plantas <span class="q">' + plantas.length + '</span></h2>' + (plantas.length > 1 ? '<button type="button" class="link-mais" data-acao="baixar-plantas" data-id="' + esc(p.id) + '">' + ICO.baixar + 'Baixar todas</button>' : '') + '</div>' +
        '<div class="grade-plantas">' + plantas.map((pl, i) => '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-planta" data-i="' + i + '" aria-label="' + esc('Ampliar ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 900, sizes: '(min-width: 1024px) 22vw, 70vw'}) + '</button><figcaption>' + esc(pl.t) + (pl.sub ? '<small>' + esc(pl.sub) + '</small>' : '') + '</figcaption></figure>').join('') + '</div>' +
        (c && c.aviso_planta ? '<p class="nota">' + esc(c.aviso_planta) + '</p>' : '') + '</section>';
    }
    if(c && Array.isArray(c.vistas_rooftop) && c.vistas_rooftop.length){
      corpo += '<section class="sec" aria-labelledby="vis-t"><h2 class="t-2" id="vis-t">Vistas</h2><div class="fotos-linha">' + c.vistas_rooftop.map(v => '<figure>' + imgTag(imgCentral(c, v.id), v.t || 'Vista', '', {w: 900}) + '<figcaption>' + esc(v.t || '') + '</figcaption></figure>').join('') + '</div>' +
        (c.aviso_vista ? '<p class="nota">' + esc(c.aviso_vista) + '</p>' : '') + '</section>';
    }
    if(c && Array.isArray(c.perto) && c.perto.length){
      corpo += '<section class="sec perto" aria-labelledby="per-t"><h2 class="t-2" id="per-t">Perto daqui</h2>' + c.perto.map(x => {
        const [mn, como] = x.pe != null ? [x.pe + ' min', 'a pé'] : x.bike != null ? [x.bike + ' min', 'de bike'] : x.carro != null ? [x.carro + ' min', 'de carro'] : x.min != null ? [x.min + ' min', ''] : x.m != null ? [(+x.m >= 1000 ? (+x.m / 1000).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + ' km' : x.m + ' m'), ''] : [null, ''];
        return '<div><span>' + esc(x.nome) + '</span>' + (mn != null ? '<span class="num"><b>' + esc(mn) + '</b>' + (como ? ' <small>' + esc(como) + '</small>' : '') + '</span>' : '') + '</div>';
      }).join('') + (c.perto_fonte ? '<p class="nota">' + esc(c.perto_fonte) + '</p>' : '') + '</section>';
    }
    const fatos = c && Array.isArray(c.fatos) ? c.fatos.filter(x => Array.isArray(x) && x[0]) : (info.ficha_tecnica && typeof info.ficha_tecnica === 'object' ? Object.entries(info.ficha_tecnica).map(([k, v]) => [maiusc1(k.replace(/_/g, ' ')), typeof v === 'string' ? v : JSON.stringify(v)]) : []);
    if(fatos.length) corpo += '<section class="sec" aria-labelledby="fic-t"><h2 class="t-2" id="fic-t">Ficha técnica</h2><dl class="ficha">' + fatos.map(f => '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') + '</dl></section>';
    if(c && Array.isArray(c.diferenciais) && c.diferenciais.length) corpo += '<section class="sec" aria-labelledby="dif-t"><h2 class="t-2" id="dif-t">Diferenciais</h2><ul class="lista-txt">' + c.diferenciais.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
    const docs = [];
    if(c && Array.isArray(c.material_oficial)) c.material_oficial.forEach(m => { if(m && m.id) docs.push({t: m.c || m.n, s: (m.n || '') + (m.mb ? ', ' + String(m.mb).replace('.', ',') + ' MB' : ''), u: driveArq(m.id), x: m.ext || 'pdf'}); });
    const dp = det.docs && det.docs.projeto;
    if(dp && Array.isArray(dp.docs)) dp.docs.forEach(x => { const u = urlSegura(x.u) || (x.id && x.x !== 'link' && !/^[a-z]+-/.test(x.id) ? driveArq(x.id) : null); if(u) docs.push({t: x.t || x.a, s: [x.a, x.d].filter(Boolean).join(', '), u, x: x.x || 'pdf'}); });
    if(dp && Array.isArray(dp.pastas)) dp.pastas.forEach(x => { if(x && x.id) docs.push({t: x.c || 'Pasta', s: 'Pasta no Google Drive', u: drivePasta(x.id), x: 'pasta'}); });
    const mat = Array.isArray(info.material) ? info.material : [];
    mat.forEach(m => { if(m && (m.tipo === 'pdf' || m.tipo === 'video') && urlSegura(m.u)) docs.push({t: m.t, s: m.tipo === 'pdf' ? 'PDF' : 'Vídeo', u: m.u, x: m.tipo === 'pdf' ? 'pdf' : 'mp4'}); });
    const site = urlSegura(info.pagina) || urlSegura(info.site);
    if(site) docs.push({t: 'Site oficial do projeto', s: site.replace(/^https:\/\/(www\.)?/, '').split('/')[0], u: site, x: 'site'});
    if(c && c.pagina) docs.unshift({t: 'Ficha completa nos Espelhos', s: 'Fotos, plantas por andar, vistas e simulador', u: ESP + 'nex/' + c.pagina, x: 'ficha'});
    if(docs.length) corpo += '<section class="sec" aria-labelledby="mat-t"><h2 class="t-2" id="mat-t">Material</h2><ul class="docs">' + docs.slice(0, 16).map(x => '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener"><span class="tipo" aria-hidden="true">' + esc(String(x.x).slice(0, 5)) + '</span><span class="t"><b>' + esc(x.t) + '</b>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span>' + ICO.seta + '</a></li>').join('') + '</ul>' +
      (det.docs && Array.isArray(det.docs.geral) && det.docs.geral.length ? '<p class="nota">A ' + esc(det.docs.construtora || 'construtora') + ' também tem ' + det.docs.geral.length + ' materiais gerais (treinamentos, campanhas e formulários) no app dos Espelhos.</p>' : '') + '</section>';
    if(d.nota) corpo += '<p class="legal">' + esc(d.nota) + '</p>';
    if(c && c.legal) corpo += '<p class="legal">' + esc(c.legal) + '</p>';
    corpo += '<p class="legal">Dados do espelho de ' + esc(d.atualizado_em ? quandoTxt(Date.parse(d.atualizado_em)) : 'hoje') + '. ' + esc(d.fonte || '') + (info.capa_fonte ? ' Fotos: ' + esc(info.capa_fonte) + '.' : '') + '</p>';
    const painel = painelProj(p, det, c);
    h += '<div class="proj-grade"><div class="proj-main">' + cab + (largo() ? '' : painel) + corpo + '</div>' + (largo() ? '<aside class="proj-lado">' + painel + '</aside>' : '') + '</div>';
    pos.push(ligarGaleria);
    return h;
  }
  function ligarGaleria(){
    const g = $('#gal'); if(!g) return;
    let t = null;
    g.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => {
      const fig = g.querySelector('figure'); const w = fig ? fig.getBoundingClientRect().width + 10 : g.clientWidth;
      const i = Math.max(0, Math.min((S.fotosAtuais || []).length - 1, Math.round(g.scrollLeft / w))), f = (S.fotosAtuais || [])[i];
      const nt = $('#gal-t'), nn = $('#gal-n'); if(nt) nt.textContent = f ? f.t || '' : ''; if(nn) nn.textContent = (i + 1) + ' de ' + (S.fotosAtuais || []).length;
    }, 60); }, {passive: true});
  }

  // visor de fotos em tela cheia
  function abrirLuz(lista, i, nome){
    if(!lista || !lista.length) return;
    fecharLuz();
    S.luz = {lista, i: i || 0, nome: nome || ''};
    const d = document.createElement('dialog'); d.className = 'luz'; d.id = 'luz'; d.setAttribute('aria-label', 'Fotos' + (nome ? ' do ' + nome : ''));
    d.innerHTML = '<div class="luz-cab"><p class="luz-n num" id="luz-n"></p><p class="luz-t" id="luz-t"></p><div class="luz-acoes">' +
      '<button type="button" class="btn btn-peq btn-vidro" data-acao="luz-baixar">' + ICO.baixar + '<span>Baixar</span></button>' +
      (podeCompartilharArquivos() ? '<button type="button" class="btn btn-peq btn-vidro so-toque" data-acao="luz-compartilhar">' + ICO.compartilhar + '<span>Enviar</span></button>' : '') +
      '<button type="button" class="ico-btn vidro" data-acao="luz-fechar" aria-label="Fechar">' + ICO.fechar + '</button></div></div>' +
      '<div class="luz-trilho" id="luz-trilho">' + lista.map((f, k) => '<figure>' + imgTag(f.src, f.t || ('Foto ' + (k + 1)), '', {w: 2048, sizes: '100vw', extra: k === S.luz.i ? '' : ''}) + '</figure>').join('') + '</div>' +
      (lista.length > 1 ? '<button type="button" class="luz-seta ant" data-acao="luz-ant" aria-label="Foto anterior">' + ICO.anterior + '</button><button type="button" class="luz-seta prox" data-acao="luz-prox" aria-label="Próxima foto">' + ICO.proxima + '</button>' : '');
    document.body.appendChild(d);
    d.addEventListener('close', () => { d.remove(); S.luz = null; });
    d.addEventListener('cancel', () => { /* Esc fecha */ });
    if(typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    const tr = $('#luz-trilho');
    requestAnimationFrame(() => { tr.scrollLeft = S.luz.i * tr.clientWidth; atualizarLuz(S.luz.i); });
    let t = null;
    tr.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => { if(!S.luz) return; const i2 = Math.round(tr.scrollLeft / tr.clientWidth); if(i2 !== S.luz.i) atualizarLuz(i2); }, 70); }, {passive: true});
  }
  function atualizarLuz(i){
    if(!S.luz) return;
    S.luz.i = Math.max(0, Math.min(S.luz.lista.length - 1, i));
    const f = S.luz.lista[S.luz.i];
    const n = $('#luz-n'), t = $('#luz-t'); if(n) n.textContent = (S.luz.i + 1) + ' de ' + S.luz.lista.length; if(t) t.textContent = f.t || '';
    aoMudarLuz();
  }
  function irLuz(delta){
    if(!S.luz) return;
    const tr = $('#luz-trilho'); if(!tr) return;
    const i = Math.max(0, Math.min(S.luz.lista.length - 1, S.luz.i + delta));
    tr.scrollTo({left: i * tr.clientWidth, behavior: menosMov() ? 'auto' : 'smooth'});
    atualizarLuz(i);
  }
  function fecharLuz(){ const d = $('#luz'); if(d){ try{ d.close(); }catch(e){} d.remove(); } S.luz = null; }

  // ================= LISTA (Tabelas e Posts) =================
  function telaListaProjetos(modo){
    const titulo = modo === 'tabelas' ? 'Tabelas' : 'Posts';
    const sub = modo === 'tabelas' ? 'Escolha o projeto para ver as unidades, os preços e o fluxo, marcar as que vão pro cliente e baixar a tabela.' : 'Escolha o projeto. O app monta a arte com a foto, o preço e o seu contato, pronta para o Stories ou o feed.';
    pos.push(() => atualizarLista(modo));
    return '<header class="pg-cab"><div><h1 class="t-1">' + titulo + '</h1><p class="texto-2 ler">' + esc(sub) + '</p></div></header>' +
      '<div class="busca-linha"><label class="busca"><span class="sr">Buscar projeto</span>' + ICO.lupa + '<input id="lq" type="search" autocomplete="off" placeholder="Nome do projeto, construtora ou bairro" value="' + esc(S.ui.listaQ) + '" data-input="lista" data-modo="' + modo + '"></label></div>' +
      '<p class="sub lista-n" id="lista-n"></p><ul class="lista-proj" id="lista"></ul>';
  }
  function atualizarLista(modo){
    const box = $('#lista'); if(!box) return;
    const termos = norm(S.ui.listaQ).split(/\s+/).filter(Boolean);
    let ps = S.P.filter(p => !termos.length || termos.every(t => norm([p.nome, p.curto, p.bairro, quemDe(p), GRUPOS[p.grupo] ? GRUPOS[p.grupo].n : ''].join(' ')).includes(t)));
    ps = ps.sort((a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || ((b.livres > 0) - (a.livres > 0)) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    $('#lista-n').textContent = termos.length ? plural(ps.length, 'projeto encontrado', 'projetos encontrados') : plural(ps.length, 'projeto', 'projetos') + ', os que mais vendem primeiro';
    box.innerHTML = ps.map(p => '<li><a href="#/' + modo + '/' + esc(p.id) + '">' + miniProj(p) + '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span>' + esc(modo === 'tabelas' ? (p.tabela ? 'Tabela ' + String(p.tabela).replace(/^tabela(s)? (de )?/i, '') : 'Sem tabela publicada') : plural(p.livres, 'livre', 'livres') + (p.v7 ? ', ' + plural(p.v7, 'venda', 'vendas') + ' na semana' : '')) + '</span></span>' +
      '<span class="fim">' + (precoDe(p) != null ? '<b class="num">' + esc(BRLc(precoDe(p))) + '</b>' : '') + '<span>' + esc(p.livres ? plural(p.livres, 'livre', 'livres') : 'esgotado') + '</span></span></a></li>').join('') +
      (!ps.length ? '<li class="lista-mais">Nenhum projeto com esse nome.</li>' : '');
  }

  // ================= TABELA DE UNIDADES =================
  function telaTabela(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2 class="t-3">Projeto não encontrado</h2><a class="btn" href="#/tabelas">Ver as tabelas</a></div>';
    if(S.ui.tabProj !== id){ S.ui.tabProj = id; S.ui.tabQ = ''; S.ui.tabFiltro = 'livres'; S.ui.tabMostra = 150; S.ui.tabAberta = null; S.ui.ef = null; S.ui.efMais = false; }
    const ef = espFiltro(id);
    if(S.ui.tabTipoPedido){ ef.tb = S.ui.tabTipoPedido === 'Outras unidades' ? null : S.ui.tabTipoPedido; ef.st = 'disponivel'; }
    S.ui.tabTipoPedido = '';
    const cache = S.det.get(id), det = cache && cache.v;
    const visto = det ? det.gerado_em : null;
    pos.push(async () => {
      try{ const d2 = await detalhe(id); if(location.hash === '#/tabelas/' + id && d2.gerado_em !== visto) render(); }
      catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); const b = $('.esqueleto'); if(b) b.innerHTML = '<p class="erro-txt">Não consegui abrir a tabela agora. Confira a internet.</p><button type="button" class="btn" data-acao="recarregar">Tentar de novo</button>'; }
    });
    const topo = '<div class="barra-topo"><a class="ico-btn" href="#/tabelas" aria-label="Voltar para a lista de tabelas">' + ICO.voltar + '</a>' + miniProj(p, 'peq so-largo') +
      '<div class="bt-tit"><h1>' + esc(p.nome) + '</h1><p class="sub">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p></div>' +
      '<div class="bt-acoes"><button type="button" class="btn btn-peq" data-acao="planilha-tabela" data-id="' + esc(id) + '" aria-label="Baixar a tabela em planilha">' + ICO.planilha + '<span class="so-largo">Planilha</span></button>' +
      '<button type="button" class="btn btn-peq" data-acao="pdf-tabela" data-id="' + esc(id) + '" aria-label="Baixar a tabela em PDF">' + ICO.imprimir + '<span class="so-largo">PDF</span></button>' +
      '<a class="btn btn-peq" href="#/comparar?p=' + encodeURIComponent(id) + '" aria-label="Comparar com outros projetos">' + ICO.comparar + '<span class="so-largo">Comparar</span></a>' +
      '<a class="btn btn-peq so-largo" href="#/p/' + esc(id) + '">Ficha ' + ICO.seta + '</a></div></div>';
    if(!det) return topo + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:40px"></div><div class="brilho" style="height:60px"></div><div class="brilho" style="height:60px"></div><div class="brilho" style="height:60px"></div></div>';
    return topo + tabelaHtml(p, det);
  }
  const modoTabela = (p, det) => { const pc = precosCampos(det).slice(0, 3); return S.ui.tabModo[p.id] && pc.some(x => x.k === S.ui.tabModo[p.id]) ? S.ui.tabModo[p.id] : chaveBase(det); };
  function recentesDe(det){
    const r = new Map();
    for(const m of (det.mov || [])){ if(Date.now() - m[3] * 1000 < 36 * 3600e3 && !r.has(String(m[0]))) r.set(String(m[0]), m); }
    return r;
  }
  function unidadesTabela(p, det, modo){   // a lista usa os mesmos filtros do espelho, mais Livres / Mexeram / Todas
    const fil = S.ui.tabFiltro, q = norm(S.ui.tabQ).trim(), f = espFiltro(p.id);
    const U = espUnidades(det, S.centralV.get(p.id) || null), recentes = recentesDe(det);
    const base = U.filter(u => espBate(u, f, modo));
    const cont = {livres: base.filter(u => u.st === 'disponivel').length, todas: base.length, mov: base.filter(u => recentes.has(u.n)).length};
    let sel = base;
    if(fil === 'livres') sel = sel.filter(u => u.st === 'disponivel');
    else if(fil === 'mov') sel = sel.filter(u => recentes.has(u.n));
    if(q) sel = sel.filter(u => norm(u.n).includes(q) || norm(u.tl).includes(q));
    const us = sel.map(u => u.a);
    const andN = v => v === 'T' || v === 'S' || v === 'L' || v === 'G' ? 0 : (+v || 0);
    us.sort((x, y) => fil === 'livres' ? ((precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12)) : (andN(y[4]) - andN(x[4])) || String(x[0]).localeCompare(String(y[0]), 'pt-BR', {numeric: true}));
    return {us, cont, recentes};
  }
  function tabelaHtml(p, det){
    const d = det.dados, pc = precosCampos(det).slice(0, 3), modo = modoTabela(p, det), vista = vistaTab(det);
    const tab = d.tabela || {};
    const lido = d.atualizado_em ? quandoTxt(Date.parse(d.atualizado_em)) : '';
    const tabEm = tab.atualizado_em ? quandoTxt(Date.parse(tab.atualizado_em)) : '';
    if(!S.centralV.has(p.id)) pos.push(() => fichaCentral(p.id).then(c => { if(c && location.hash === '#/tabelas/' + p.id) atualizarTabela(); }).catch(() => {}));
    if(S.ui.tabQ && vista === 'espelho') pos.push(() => setTimeout(espRolarAchada, 60));
    return '<div class="tab-ctl">' +
      '<p class="sub">' + esc([tab.nome ? nomeTabela(tab.nome) : 'Sem tabela publicada', tabEm ? 'atualizada ' + tabEm : ''].filter(Boolean).join(', ')) + '. Espelho lido ' + esc(lido || 'hoje') + '.</p>' +
      '<div class="tab-ctl-lin">' +
      (espTemGrade(det) ? '<div class="seg seg-vista" role="group" aria-label="Como ver as unidades"><button type="button" data-acao="tab-vista" data-v="espelho" aria-pressed="' + (vista === 'espelho') + '">' + ICO.predio + 'Espelho</button><button type="button" data-acao="tab-vista" data-v="lista" aria-pressed="' + (vista === 'lista') + '">' + ICO.lista + 'Lista</button></div>' : '') +
      (pc.length > 1 ? '<div class="seg" role="group" aria-label="Preço mostrado">' + pc.map(x => '<button type="button" data-acao="tab-modo" data-id="' + esc(p.id) + '" data-v="' + esc(x.k) + '" aria-pressed="' + (modo === x.k) + '">' + esc(x.label) + '</button>').join('') + '</div>' : '') +
      '<label class="busca mini"><span class="sr">Buscar unidade</span>' + ICO.lupa + '<input type="search" inputmode="search" autocomplete="off" placeholder="' + (vista === 'espelho' ? 'Nº da unidade' : 'Unidade ou tipologia') + '" value="' + esc(S.ui.tabQ) + '" data-input="tab-q"></label></div>' +
      (tab.regra_curta ? '<p class="nota">' + esc(tab.regra_curta) + '</p>' : '') + '</div>' +
      '<div id="tab-lista">' + tabListaHtml(p, det) + '</div>';
  }
  function tabListaHtml(p, det){
    if(vistaTab(det) === 'espelho') return espelhoCorpoHtml(p, det);
    const pc = precosCampos(det).slice(0, 3), modo = modoTabela(p, det);
    const sel = S.ui.tabSel.get(p.id) || new Set();
    const {us, cont, recentes} = unidadesTabela(p, det, modo);
    const c = S.centralV.get(p.id) || null;
    let h = '<div class="pilulas rola tab-fil" role="group" aria-label="Quais unidades">' + [['livres', 'Livres', cont.livres], ['mov', 'Mexeram hoje e ontem', cont.mov], ['todas', 'Todas', cont.todas]].map(x => '<button type="button" class="pilula peq" data-acao="tab-fil" data-v="' + x[0] + '" aria-pressed="' + (S.ui.tabFiltro === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>' +
      espChipsHtml(espUnidades(det, c), espFiltro(p.id), modo, det, recentes, c, true);
    if(!us.length) h += '<p class="texto-2 vazio-txt">' + (S.ui.tabQ.trim() ? 'Nenhuma unidade com “' + esc(S.ui.tabQ.trim()) + '”.' : S.ui.tabFiltro === 'livres' ? 'Nenhuma unidade livre com esse filtro.' : S.ui.tabFiltro === 'mov' ? 'Nenhuma unidade mexeu nas últimas 36 horas.' : 'Nada com esse filtro.') + '</p>';
    const lim = S.ui.tabMostra || 150;
    const temPv = pc.some(x => x.k === 'pv') && modo !== 'pv';
    if(us.length && tabelaLarga()){
      h += '<div class="tab-u" role="table" aria-label="Unidades do ' + esc(p.nome) + '"><div class="tu2 cab" role="row"><span role="columnheader"><span class="sr">Marcar</span></span><span role="columnheader">Unidade</span><span role="columnheader">Andar</span><span role="columnheader">Tipologia</span><span role="columnheader" class="dir">Área</span><span role="columnheader">Faixa</span><span role="columnheader">Status</span><span role="columnheader" class="dir">' + esc((pc.find(x => x.k === modo) || {}).label || 'Preço') + '</span>' + (temPv ? '<span role="columnheader" class="dir">À vista</span>' : '<span role="columnheader"></span>') + '<span role="columnheader" class="dir">R$/m²</span><span role="columnheader"><span class="sr">Fluxo</span></span></div>' +
        us.slice(0, lim).map(a => linhaTabela(p, det, a, modo, sel, recentes, temPv)).join('') + '</div>';
    }else if(us.length) h += '<div class="unid" role="list">' + us.slice(0, lim).map(a => unidadeHtml(p, det, a, modo, sel, recentes)).join('') + '</div>';
    if(us.length > lim) h += '<button type="button" class="btn btn-largo" data-acao="tab-mais">Mostrar mais ' + Math.min(200, us.length - lim) + ' de ' + (us.length - lim) + '</button>';
    if(sel.size) h += barraTabelaHtml(p, sel);
    return h;
  }
  function atualizarTabela(){   // repinta só a lista, sem mexer na busca nem nos botões de cima
    const m = /^#\/tabelas\/([a-z0-9-]+)$/.exec(location.hash), box = $('#tab-lista');
    if(!m || !box) return;
    const p = S.byId.get(m[1]), c = S.det.get(m[1]), det = c && c.v;
    if(!p || !det) return;
    const ae = document.activeElement, foco = ae && box.contains(ae) && ae.dataset ? (ae.dataset.acao || '') + '|' + (ae.dataset.n || '') + '|' + (ae.dataset.k || '') + '|' + (ae.dataset.v || '') : null;
    const rola = $('.ep-rola', box), lado = rola ? rola.scrollLeft : 0, ops = $$('.ef-ops', box).map(e => e.scrollLeft);
    box.innerHTML = tabListaHtml(p, det);
    const r2 = $('.ep-rola', box); if(r2 && lado) r2.scrollLeft = lado;
    $$('.ef-ops', box).forEach((e, i) => { if(ops[i]) e.scrollLeft = ops[i]; });
    if(foco){ const [a, n, k, v] = foco.split('|'); const el = $$('[data-acao="' + a + '"]', box).find(e => (e.dataset.n || '') === n && (e.dataset.k || '') === k && (e.dataset.v || '') === v) || $$('[data-acao="' + a + '"]', box).find(e => (e.dataset.n || '') === n); if(el) el.focus({preventScroll: true}); }
  }
  function stDe(det, a, m){
    const livre = a[6] === 'disponivel';
    const qd = m ? (diaKey(m[3] * 1000) === S.hoje ? 'às ' + hora(m[3] * 1000) : quandoTxt(m[3] * 1000)) : '';
    return {livre, txt: livre ? (m ? 'voltou ' + qd : 'livre') : (stLabel(det, a[6]) + (m ? ' ' + qd : '')).toLowerCase(), cls: a[6] === 'vendida' ? 'st-vendida' : livre ? 'st-livre' : 'st-reservada'};
  }
  function linhaTabela(p, det, a, modo, sel, recentes, temPv){
    const n = String(a[0]), v = precoU(a, modo), pv = temPv ? precoU(a, 'pv') : null, mk = sel.has(n), m = recentes.get(n), ar = areaU(a), aberta = S.ui.tabAberta === p.id + ':' + n;
    const st = stDe(det, a, m), cat = (det.dados.cat_nome && det.dados.cat_nome[a[3]]) || a[3] || '';
    return '<div class="tu2-bloco' + (mk ? ' marcada' : '') + (st.livre ? '' : ' indisp') + (m ? ' novo' : '') + '"><div class="tu2" role="row">' +
      '<span role="cell">' + (st.livre ? '<button type="button" class="ck-btn" data-acao="tab-ck" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(n) + '"><span class="ck">' + ICO.ok + '</span></button>' : '') + '</span>' +
      '<span role="cell" class="num"><b>' + esc(n) + '</b></span><span role="cell">' + esc(andarTxt(a[4])) + '</span><span role="cell">' + esc(tipologiaU(det, a) || '') + '</span>' +
      '<span role="cell" class="dir num">' + esc(ar ? fmtM2(ar) : '') + '</span><span role="cell" class="pequeno">' + esc(cat) + '</span>' +
      '<span role="cell" class="' + st.cls + '">' + esc(st.txt) + '</span>' +
      '<span role="cell" class="dir num"><b>' + (v ? esc(BRL(v)) : '<span class="apoio">sem preço</span>') + '</b></span>' +
      '<span role="cell" class="dir num">' + (pv ? esc(BRL(pv)) : '') + '</span>' +
      '<span role="cell" class="dir num apoio">' + (v && ar ? esc(BRL(v / ar)) : '') + '</span>' +
      '<span role="cell"><button type="button" class="link-mais" data-acao="tab-abrir" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-expanded="' + aberta + '">Fluxo ' + ICO.baixo + '</button></span></div>' +
      (aberta ? '<div class="detalhe">' + (fluxoHtml(det, a) || '<p class="texto-2">Sem fluxo cadastrado para esta unidade.</p>') + '</div>' : '') + '</div>';
  }
  function unidadeHtml(p, det, a, modo, sel, recentes){
    const n = String(a[0]), v = precoU(a, modo), mk = sel.has(n), m = recentes.get(n), aberta = S.ui.tabAberta === p.id + ':' + n;
    const st = stDe(det, a, m);
    const desc = [tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : ''].filter(Boolean).join(', ');
    const sub = [andarTxt(a[4]), a[3] && a[3] !== 'R2V' ? a[3] : ''].filter(Boolean).join(', ');
    return '<div class="u' + (mk ? ' marcada' : '') + (st.livre ? '' : ' indisp') + (m ? ' novo' : '') + '" role="listitem"><div class="u-grade' + (st.livre ? '' : ' sem-ck') + '">' +
      (st.livre ? '<button type="button" class="ck-btn" data-acao="tab-ck" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(n) + ' para mandar"><span class="ck">' + ICO.ok + '</span></button>' : '') +
      '<button type="button" class="u-lin" data-acao="tab-abrir" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-expanded="' + aberta + '">' +
      '<span class="n num">' + esc(n) + '<small>' + esc(sub) + '</small></span><span class="d">' + esc(desc) + '<small class="' + st.cls + '">' + esc(st.txt) + '</small></span>' +
      '<span class="p num">' + (v ? esc(BRL(v)) : '<span class="apoio">sem preço</span>') + '</span></button></div>' +
      (aberta ? '<div class="detalhe">' + (fluxoHtml(det, a) || '<p class="texto-2">Sem fluxo cadastrado para esta unidade.</p>') + '</div>' : '') + '</div>';
  }

  // ================= ENVIAR PRO CLIENTE =================
  function camposAssinatura(){
    const pf = perfil();
    return '<fieldset><legend>Sua assinatura</legend><div class="campos-2"><label class="campo">Seu nome<input id="env-cor" maxlength="40" autocomplete="name" value="' + esc(pf.nome || '') + '"></label>' +
      '<label class="campo">Seu WhatsApp<input id="env-tel" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '"></label></div></fieldset>';
  }
  async function abrirEnvio(id, daTabela){
    const p = S.byId.get(id); if(!p) return;
    abrirFolha('envio', 'Mandar pro cliente', '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:50px"></div><div class="brilho" style="height:120px"></div><p class="sub">Abrindo as unidades livres…</p></div>', '');
    const dlg = $('#folha-envio');
    let det;
    try{ det = await detalhe(id); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); if(dlg && dlg.isConnected) corpoFolha('<p class="erro-txt" role="alert">Não consegui abrir as unidades agora. Confira a internet e tente de novo.</p>', null, dlg); return; }
    const c = await fichaCentral(id).catch(() => null);
    if(!dlg || !dlg.isConnected) return;
    const chave = chaveBase(det), pc = precosCampos(det);
    const sel = daTabela ? new Set(S.ui.tabSel.get(id) || []) : new Set();
    const livres = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').sort((x, y) => (precoU(x, chave) || 1e12) - (precoU(y, chave) || 1e12));
    if(!sel.size && livres[0]) sel.add(String(livres[0][0]));
    const comPers = persDoProjeto(id).filter(n => livres.some(a => String(a[0]) === n));
    const st = {id, sel, modo: S.ui.tabModo[id] || chave, formato: [...sel].some(n => persDe(id, n)) ? 'pers' : c && c.pagina ? 'ficha' : 'selecao', central: !!(c && c.pagina)};
    S.envio = st;
    const listaU = livres.filter((a, i) => i < 80 || sel.has(String(a[0]))).sort((x, y) => sel.has(String(y[0])) - sel.has(String(x[0]))).map(a => {
      const n = String(a[0]), v = precoU(a, st.modo) || precoU(a, chave);
      return '<label class="u-opc"><input type="checkbox" data-input="env-u" value="' + esc(n) + '"' + (sel.has(n) ? ' checked' : '') + '><span class="u-opc-t"><b class="num">' + esc(n) + '</b><span>' + esc([tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : '', andarTxt(a[4])].filter(Boolean).join(', ')) + '</span></span><span class="num ouro">' + (v ? esc(BRLc(v)) : '') + '</span></label>';
    }).join('');
    corpoFolha(
      '<div class="env-proj">' + miniProj(p) + '<p><b>' + esc(p.nome) + '</b><span>O cliente recebe um link com fotos e os valores das unidades marcadas.</span></p></div>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      envFormatosHtml(st, comPers) +
      '<fieldset><legend>Unidades (' + livres.length + ' livres)</legend><div class="u-opcs" id="env-us">' + (listaU || '<p class="texto-2">Nenhuma unidade livre agora.</p>') + '</div>' + (livres.length > 80 ? '<p class="nota">Mostrando as 80 mais em conta.</p>' : '') + '</fieldset>' +
      (pc.length > 1 ? '<fieldset id="env-modo-f"' + (st.formato === 'pers' ? ' hidden' : '') + '><legend>Valor mostrado</legend><div class="seg" role="group">' + pc.slice(0, 3).map(x => '<button type="button" data-acao="env-modo" data-v="' + esc(x.k) + '" aria-pressed="' + (st.modo === x.k) + '">' + esc(x.label) + '</button>').join('') + '</div></fieldset>' : '') +
      camposAssinatura() + '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>', dlg);
    setTimeout(() => { const i = $('#env-cli'); if(i && !ehToque()) i.focus(); }, 80);
  }
  function envFormatosHtml(st, comPers){
    const ops = [];
    if(comPers.length) ops.push(['pers', 'Ficha com o fluxo personalizado', 'O fluxo que você montou' + (comPers.length <= 3 ? ' (' + comPers.join(', ') + ')' : '') + ', com fotos e plantas. As outras unidades marcadas recebem a mesma entrada e parcelas. Até 4 unidades.']);
    ops.push(['ficha', st.central ? 'Ficha completa' : 'Ficha com a condição da tabela', 'Fotos, plantas' + (st.central ? ', lazer, mapa' : ' e mapa') + ' e o fluxo da tabela de cada unidade. Até 4 unidades.']);
    ops.push(['selecao', 'Só as unidades', 'Uma página com as unidades marcadas, fotos e o preço de cada uma. Até 40 unidades.']);
    return '<fieldset><legend>O que o cliente recebe</legend><div class="env-ops" role="radiogroup" aria-label="O que o cliente recebe">' + ops.map(o => '<button type="button" class="env-op" role="radio" data-acao="env-fmt" data-v="' + o[0] + '" aria-checked="' + (st.formato === o[0]) + '"><i aria-hidden="true"></i><span><b>' + esc(o[1]) + '</b><small>' + esc(o[2]) + '</small></span></button>').join('') + '</div></fieldset>';
  }
  function abrirEnvioMulti(){
    if(!S.sel.size) return;
    const its = [...S.sel.values()].map(v => ({p: S.byId.get(v.p), u: (S.U && S.U.get(v.p) || []).find(u => u.n === v.n), n: v.n})).filter(x => x.p);
    const porP = new Map(); for(const x of its){ if(!porP.has(x.p.id)) porP.set(x.p.id, []); porP.get(x.p.id).push(x); }
    S.envio = {multi: true, modo: S.f.modo};
    const lista = [...porP.values()].map(g => '<div class="env-grupo"><p class="env-g-t">' + miniProj(g[0].p, 'peq') + '<b>' + esc(g[0].p.nome) + '</b><span>' + esc(plural(g.length, 'unidade', 'unidades')) + '</span></p>' +
      g.map(x => '<p class="env-u"><span class="num"><b>' + esc(x.n) + '</b></span><span>' + esc(x.u ? [tipoNome(x.u.k), x.u.a ? fmtM2(x.u.a) : '', andarCurto(x.u.at)].filter(Boolean).join(', ') : '') + '</span><span class="num ouro">' + (x.u && prU(x.u, S.f) ? esc(BRLc(prU(x.u, S.f))) : '') + '</span></p>').join('') + '</div>').join('');
    abrirFolha('envio', 'Mandar pro cliente',
      '<p class="texto-2">' + esc(plural(its.length, 'unidade', 'unidades') + ' de ' + plural(porP.size, 'projeto', 'projetos')) + '. O cliente recebe uma página com as fotos e os valores e pode abrir cada projeto.</p>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      '<fieldset><legend>Valor mostrado</legend><div class="seg" role="group">' + [['pp', 'Tabela'], ['pv', 'À vista']].map(x => '<button type="button" data-acao="env-modo" data-v="' + x[0] + '" aria-pressed="' + (S.envio.modo === x[0]) + '">' + x[1] + '</button>').join('') + '</div></fieldset>' +
      '<fieldset><legend>Unidades</legend><div class="env-lista">' + lista + '</div></fieldset>' + camposAssinatura() + '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>');
    setTimeout(() => { const i = $('#env-cli'); if(i && !ehToque()) i.focus(); }, 80);
  }
  async function criarEnvio(){
    const st = S.envio; if(!st) return;
    const cli = $('#env-cli').value.trim(), cor = $('#env-cor').value.trim(), tel = $('#env-tel').value.trim();
    const erro = m => { $('#env-erro').textContent = m; };
    if(!cli){ erro('Digite o nome do cliente.'); $('#env-cli').focus(); return; }
    let itens, p = null, formato = 'selecao', texto;
    if(st.multi){
      itens = st.itens || [...S.sel.values()].map(v => ({p: v.p, n: v.n}));
      if(!itens.length){ erro('Nenhuma unidade marcada.'); return; }
      texto = st.texto || textoBusca(S.f);
    }else{
      p = S.byId.get(st.id);
      const us = $$('#env-us input:checked').map(i => i.value);
      if(!us.length){ erro('Marque pelo menos uma unidade.'); return; }
      formato = st.formato === 'pers' || st.formato === 'ficha' ? st.formato : 'selecao';
      if(formato !== 'selecao' && us.length > 4){ erro('A ficha leva até 4 unidades. Desmarque algumas ou escolha "Só as unidades".'); return; }
      if(formato === 'pers' && !us.some(n => persDe(p.id, n))){ erro('Nenhuma das unidades marcadas tem fluxo personalizado. Monte o fluxo na ficha da unidade ou escolha outra opção.'); return; }
      itens = us.map(n => ({p: p.id, n}));
      texto = p.nome;
    }
    salvarPerfil({nome: cor, tel});
    const b = $('#env-ok'); b.disabled = true; b.textContent = 'Criando o link…'; erro('');
    try{
      let url, avisos = false, pelaTabela = [];
      if(formato === 'ficha' || formato === 'pers'){
        const det = await detalhe(p.id), vs = valoresDoEnvio(det, p.id, itens.map(x => x.n), formato, st.modo);
        pelaTabela = vs.pelaTabela;
        const r = await rpc('link_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: null, p_projeto: p.id, p_cliente: cli, p_corretor: cor, p_whats: tel, p_unidades: vs.itens});
        const c = await fichaCentral(p.id);
        url = new URL(ESP + 'nex/' + ((c && c.pagina) || 'ver.html') + '?l=' + encodeURIComponent(r.id), location.href).href;
        avisos = !!r.avisos;
      }else{
        const r = await rpc('selecao_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: null, p_cliente: cli, p_corretor: cor, p_whats: tel,
          p_busca: Object.assign({texto, modo: st.modo, criterios: {}, origem: 'app'}, st.cmp ? {cmp: st.cmp} : {}), p_itens: itens});
        url = new URL(ESP + 's.html?s=' + encodeURIComponent(r.id), location.href).href;
        avisos = !!r.avisos;
      }
      const qtd = itens.length, nome1 = primeiroNome(cli);
      const msg = 'Olá, ' + nome1 + '! ' + (formato === 'pers' ? 'Separei a ficha do ' + p.nome + ' com a condição de pagamento que montei para você: ' : formato === 'ficha' ? 'Separei a ficha do ' + p.nome + ' para você, com fotos, plantas e os valores: '
        : st.cmp ? 'Separei ' + qtd + ' opções para você comparar lado a lado, com fotos e valores: ' : st.multi ? 'Separei ' + (qtd === 1 ? 'uma opção' : qtd + ' opções') + ' para você, com fotos e valores: ' : 'Separei ' + (qtd === 1 ? 'uma opção' : qtd + ' opções') + ' do ' + p.nome + ' para você, com fotos e valores: ') + url;
      S.envioPronto = {url, msg};
      const dlg = $('#folha-envio'); if(!dlg) return;
      corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>Link pronto para ' + esc(nome1) + '. ' + (formato === 'pers' ? 'Ficha com o fluxo personalizado' : formato === 'ficha' ? 'Ficha' : 'Página') + ' com ' + esc(plural(qtd, 'unidade', 'unidades')) + '.' + (pelaTabela.length ? ' ' + esc((pelaTabela.length === 1 ? 'A ' + pelaTabela[0] + ' foi' : 'As unidades ' + pelaTabela.join(', ') + ' foram') + ' pela tabela: a mesma entrada e parcelas passam do valor dela.') : '') + (avisos ? ' Você recebe um aviso neste aparelho quando ' + esc(nome1) + ' abrir.' : '') + '</p></div>' +
        '<label class="campo">Mensagem<textarea id="env-msg" rows="5">' + esc(msg) + '</textarea><small>Dá para mudar o texto antes de mandar.</small></label>' +
        '<p class="link-pronto">' + esc(url) + '</p>' +
        '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Ver como o cliente vê ' + ICO.seta + '</a>',
        '<button type="button" class="btn" data-acao="env-copiar">' + ICO.copiar + 'Copiar</button><a class="btn btn-pri" id="env-wa" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" data-acao="env-wa">' + ICO.zap + 'WhatsApp</a>', dlg);
      if(st.multi){ if(!st.cmp) S.sel.clear(); if(location.hash === '#/imoveis') atualizarImoveis(); }
      else{ S.ui.tabSel.delete(p.id); atualizarTabela(); }
    }catch(e){
      b.disabled = false; b.innerHTML = ICO.enviar + 'Criar o link';
      const t = (e && e.body) || '';
      erro(codigoInvalido(e) ? 'O código do time mudou. Entre de novo.' : /unidade_invalida/.test(t) ? 'Uma das unidades saiu do espelho. Feche e abra de novo.' : /limite_/.test(t) ? 'Limite de links por dia atingido neste aparelho. Tente amanhã.' : /muitas_unidades|muitos_projetos/.test(t) ? 'Seleção grande demais: até 40 unidades de até 15 projetos.' : 'Não consegui criar o link agora. Confira a internet e tente de novo.');
    }
  }

  // ================= POSTS =================
  // Arte de 1080 px para Stories (1080x1920) e feed (1080x1350). A foto vem direto do site quando ele libera,
  // senão pelo servidor de fotos do app, para o canvas poder ser salvo.
  const VARS = {
    Ouro: {banda: 'rgba(14,12,9,0.94)', caixa: '#C8A24A', caixaTexto: '#0E0C09', texto: '#F3EEE4', apoio: '#CFC6B4', contato: '#C8A24A', fio: '#3A352C'},
    Creme: {banda: 'rgba(14,12,9,0.94)', caixa: '#F3EEE4', caixaTexto: '#0E0C09', texto: '#F3EEE4', apoio: '#CFC6B4', contato: '#C8A24A', fio: '#3A352C'},
    Noite: {banda: 'rgba(246,243,236,0.96)', caixa: '#0E0C09', caixaTexto: '#F3EEE4', texto: '#1C1913', apoio: '#5C5446', contato: '#6B5216', fio: '#CFC7B7'}
  };
  const FONTE_URL = 'fonts/mona-sans.woff2';
  let fontesPost = null;
  function carregarFontesPost(){   // "Mona Larga" é a Mona Sans travada na largura 118%, para o canvas
    if(fontesPost) return fontesPost;
    fontesPost = (async () => {
      try{
        if(typeof FontFace !== 'undefined'){
          const ff = new FontFace('Mona Larga', 'url(' + FONTE_URL + ') format("woff2")', {weight: '200 900', stretch: '118%', style: 'normal'});
          document.fonts.add(ff); await ff.load();
        }
      }catch(e){}
      try{ await Promise.all(['700 72px "Mona Larga"', '400 38px "Mona Sans"', '600 30px "Mona Sans"', '700 32px "Mona Sans"'].map(f => document.fonts.load(f))); }catch(e){}
    })();
    return fontesPost;
  }
  function telaPost(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2 class="t-3">Projeto não encontrado</h2><a class="btn" href="#/posts">Escolher outro</a></div>';
    const topo = '<div class="barra-topo"><a class="ico-btn" href="#/posts" aria-label="Voltar para a lista">' + ICO.voltar + '</a>' + miniProj(p, 'peq so-largo') + '<div class="bt-tit"><h1>Post do ' + esc(nomeCurto(p)) + '</h1><p class="sub">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p></div></div>';
    if(!S.post || S.post.id !== id) S.post = {id, fmt: 'story', assunto: 'preco', var: 'Ouro', foto: 0, fotos: null, titulo: null, linha: null, legenda: null, local: null, blob: null};
    pos.push(() => prepararPost(id));
    return topo + '<div id="post-corpo"><div class="esqueleto" aria-busy="true"><div class="brilho" style="height:420px;width:240px;margin:0 auto"></div><p class="sub" style="text-align:center">Lendo a ficha e as fotos…</p></div></div>';
  }
  async function prepararPost(id){
    const alvo = '#/posts/' + id;
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); const b = $('#post-corpo'); if(b) b.innerHTML = '<div class="faixa-aviso"><p class="erro-txt">Não consegui abrir a ficha agora. Confira a internet.</p><button type="button" class="btn" data-acao="recarregar">Tentar de novo</button></div>'; return; }
    if(location.hash !== alvo) return;
    const st = S.post, p = S.byId.get(id);
    if(!st.fotos) st.fotos = fotosDoProjeto(det, c).slice(0, 18).map(f => ({src: f.src, th: f.th, t: f.t, ok: null}));
    st.det = det; st.c = c;
    const textos = textosPost(p, det, c, st.assunto);
    if(st.titulo == null) st.titulo = textos.titulo;
    if(st.linha == null) st.linha = textos.linha;
    if(st.legenda == null) st.legenda = legendaPost(p, det, c);
    const assuntos = [['preco', 'Preço'], ['local', 'Localização'], ['entrega', 'Entrega'], ['lazer', 'Lazer']];
    const pf = perfil();
    $('#post-corpo').innerHTML = '<div class="post-grade">' +
      '<div class="post-prev-col"><div class="post-prev' + (st.fmt === 'feed' ? ' feed' : '') + '" id="post-prev"><canvas id="post-cv" width="1080" height="' + (st.fmt === 'feed' ? 1350 : 1920) + '" role="img" aria-label="Prévia do post"></canvas></div>' +
      '<p class="sub post-aviso" id="post-aviso" aria-live="polite"></p></div>' +
      '<div class="post-ctl">' +
      '<fieldset><legend>Formato</legend><div class="seg" role="group" aria-label="Formato"><button type="button" data-acao="post-fmt" data-v="story" aria-pressed="' + (st.fmt === 'story') + '">Stories</button><button type="button" data-acao="post-fmt" data-v="feed" aria-pressed="' + (st.fmt === 'feed') + '">Feed</button></div></fieldset>' +
      '<fieldset><legend>Assunto</legend><div class="pilulas" role="group" aria-label="Assunto do post">' + assuntos.map(a => '<button type="button" class="pilula peq" data-acao="post-assunto" data-v="' + a[0] + '" aria-pressed="' + (st.assunto === a[0]) + '">' + a[1] + '</button>').join('') + '</div></fieldset>' +
      '<fieldset><legend>Foto</legend><div class="escolha-fotos" role="group" aria-label="Escolher a foto">' +
      st.fotos.map((f, i) => '<button type="button" data-acao="post-foto" data-i="' + i + '" aria-pressed="' + (st.foto === i && !st.local) + '" aria-label="' + esc(f.t || 'Foto ' + (i + 1)) + '"' + (f.ok === false ? ' class="bloq"' : '') + '>' + imgTag(f.th || f.src, '', '', {w: 200, semSet: true}) + '</button>').join('') +
      '<label class="foto-local">' + ICO.foto + '<span>Do aparelho</span><input type="file" accept="image/*" data-input="post-arquivo" class="sr"></label></div></fieldset>' +
      '<fieldset><legend>Cor do título</legend><div class="seg" role="group" aria-label="Cor do título">' + Object.keys(VARS).map(k => '<button type="button" data-acao="post-var" data-v="' + k + '" aria-pressed="' + (st.var === k) + '">' + k + '</button>').join('') + '</div></fieldset>' +
      '<label class="campo">Título<input id="post-titulo" maxlength="60" value="' + esc(st.titulo) + '" data-input="post-texto"></label>' +
      '<label class="campo">Linha de apoio<textarea id="post-linha" rows="3" maxlength="160" data-input="post-texto">' + esc(st.linha) + '</textarea></label>' +
      '<label class="campo">Legenda do post<textarea id="post-legenda" class="legenda" rows="6" data-input="post-legenda">' + esc(st.legenda) + '</textarea><small>Montada a partir da ficha do projeto. Confira antes de postar.</small></label>' +
      '<div class="btn-linha"><button type="button" class="btn" data-acao="post-copiar">' + ICO.copiar + 'Copiar legenda</button><button type="button" class="btn" data-acao="post-baixar">' + ICO.baixar + 'Baixar imagem</button></div>' +
      (podeCompartilharArquivos() ? '<button type="button" class="btn btn-pri btn-alto" data-acao="post-compartilhar">' + ICO.compartilhar + 'Compartilhar</button>' : '') +
      (pf.nome && pf.tel ? '' : '<p class="nota">Seu nome e WhatsApp entram no rodapé da arte. <a href="#/perfil">Preencher o perfil</a>.</p>') +
      '</div></div>';
    desenharPost();
  }
  function textosPost(p, det, c, assunto){
    const info = det.info || {}, tip = tiposTxt(p.tipos, p.amin, p.amax);
    const lugar = noBairro(p.bairro);
    if(assunto === 'local'){
      const pt = c && Array.isArray(c.perto) ? c.perto.find(x => x.bike != null || x.pe != null) : null;
      const titulo = pt ? 'A ' + (pt.pe != null ? pt.pe + ' min a pé' : pt.bike + ' min de bike') + ' ' + (/^(av\.|avenida|rua|r\.|esta[cç])/i.test(pt.nome) ? 'da ' : 'do ') + String(pt.nome).replace(/^(av\.|avenida)\s*/i, 'Av. ').replace(/^(r\.)\s*/i, 'Rua ') : (p.bairro ? maiusc1(lugar) : p.nome);
      return {titulo, linha: [tip, info.destaque].filter(Boolean).join('. ').replace(/\.$/, '') + '.'};
    }
    if(assunto === 'entrega'){
      const titulo = p.fase === 'pronto' ? 'Pronto para morar' : (p.entrega ? 'Chaves em ' + MESES[+p.entrega.slice(5, 7) - 1] + ' de ' + p.entrega.slice(0, 4) : 'Lançamento ' + lugar);
      return {titulo, linha: [tip, p.preco ? 'Tabela a partir de ' + BRL(p.preco) : ''].filter(Boolean).join('. ') + '.'};
    }
    if(assunto === 'lazer'){
      const itens = c && Array.isArray(c.lazer) ? c.lazer.flatMap(l => l.itens || []) : (Array.isArray(info.lazer) ? info.lazer : []);
      const titulo = itens[0] ? String(itens[0]).replace(/\s*\(.*\)$/, '') : 'Lazer completo';
      return {titulo: titulo.length > 40 ? 'Lazer completo' : titulo, linha: (itens.slice(1, 5).join(', ') || tip) + '.'};
    }
    return {titulo: p.preco ? 'A partir de ' + BRLc(p.preco) : (FASE[p.fase] || 'Conheça'), linha: [tip ? tip + ' ' + lugar : lugar, entregaTxt(p)].filter(Boolean).join(', ') + '.'};
  }
  function legendaPost(p, det, c){
    const pf = perfil(), info = det.info || {};
    const partes = [];
    partes.push(p.nome + (p.bairro ? ', ' + p.bairro : '') + '.');
    const sobre = (c && c.chamada) || info.destaque;
    if(sobre) partes.push(String(sobre).replace(/\.$/, '') + '.');
    const tip = tiposTxt(p.tipos, p.amin, p.amax);
    if(tip && !sobre) partes.push(tip + '.');
    if(p.preco) partes.push('Tabela a partir de ' + BRL(p.preco) + (p.avista && p.avista < p.preco ? ', ou ' + BRL(p.avista) + ' à vista' : '') + '.');
    partes.push(maiusc1(entregaTxt(p)) + '.');
    partes.push('Me chama que eu mando a tabela e as condições.');
    const ass = [pf.nome, pf.tel, pf.creci ? 'CRECI ' + pf.creci : ''].filter(Boolean).join('\n');
    return partes.join(' ') + (ass ? '\n\n' + ass : '');
  }
  function carregarImg(src, cors){
    return new Promise(res => {
      const im = new Image(); if(cors) im.crossOrigin = 'anonymous';
      im.onload = () => res(im); im.onerror = () => res(null);
      if(/^https?:/i.test(src) && !src.startsWith(location.origin)) im.referrerPolicy = 'no-referrer';
      im.src = src;
    });
  }
  const imgsCanvas = new Map();
  function imagemCanvas(src){   // foto liberada para o canvas
    if(imgsCanvas.has(src)) return imgsCanvas.get(src);
    const pr = (async () => {
      const alvo = tamImg(src, 1600);
      if(podeDireto(alvo)){ const im = await carregarImg(alvo, true); if(im) return im; marcarSemCors(alvo); }
      try{ const b = await buscarFoto(alvo); return await carregarImg(URL.createObjectURL(b), false); }catch(e){ return null; }
    })();
    imgsCanvas.set(src, pr);
    pr.then(im => { if(!im) imgsCanvas.delete(src); });
    return pr;
  }
  let logoImg = null;
  async function desenharPost(){
    const st = S.post, cv = $('#post-cv'); if(!st || !cv) return;
    const vez = st.vez = (st.vez || 0) + 1;
    st.blob = null;
    const p = S.byId.get(st.id), V = VARS[st.var] || VARS.Ouro, pf = perfil();
    const W = 1080, H = st.fmt === 'feed' ? 1350 : 1920, feed = st.fmt === 'feed';
    const aviso = $('#post-aviso');
    await carregarFontesPost();
    if(!logoImg) logoImg = await carregarImg('img/logo-fortal.png', false);
    if(vez !== st.vez || !cv.isConnected) return;
    let foto = null;
    if(st.local) foto = st.local;
    else{
      const f = st.fotos && st.fotos[st.foto];
      if(f){
        if(aviso) aviso.textContent = 'Carregando a foto…';
        foto = await imagemCanvas(f.src);
        f.ok = !!foto;
        if(vez !== st.vez || !cv.isConnected) return;
        if(aviso) aviso.textContent = foto ? '' : 'Essa foto não abriu. Escolha outra ou use uma do aparelho.';
        if(!foto){ const b = $('.escolha-fotos [data-i="' + st.foto + '"]'); if(b) b.classList.add('bloq'); }
      }
    }
    if(vez !== st.vez) return;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0E0C09'; ctx.fillRect(0, 0, W, H);
    if(foto){
      const fw = foto.naturalWidth || foto.width, fh = foto.naturalHeight || foto.height;
      const r = Math.max(W / fw, H / fh), w = fw * r, h = fh * r;
      ctx.drawImage(foto, (W - w) * 0.5, (H - h) * 0.42, w, h);
    }else if(logoImg){
      ctx.globalAlpha = 0.16; const lw = 700, lh = lw * logoImg.height / logoImg.width; ctx.drawImage(logoImg, (W - lw) / 2, H * 0.12, lw, lh); ctx.globalAlpha = 1;
    }
    const caixa = (x, y, w, h, r, cor) => { ctx.fillStyle = cor; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); };
    const pad = feed ? 56 : 64, maxW = W - pad * 2;
    // selo da fase no alto da foto
    const fase = FASE[p.fase];
    if(fase){
      ctx.font = '600 ' + (feed ? 30 : 34) + 'px "Mona Sans"'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(fase).width, sh = feed ? 60 : 68, sy = feed ? 52 : 92;
      caixa(pad, sy, tw + 48, sh, sh / 2, 'rgba(14,12,9,0.78)');
      ctx.fillStyle = '#F3EEE4'; ctx.fillText(fase, pad + 24, sy + sh / 2 + 1);
    }
    const quebra = (txt, font, max, linhasMax) => {
      ctx.font = font; const pal = String(txt || '').split(/\s+/).filter(Boolean), L = []; let lin = '';
      for(const w of pal){ const t = lin ? lin + ' ' + w : w; if(ctx.measureText(t).width > max && lin){ L.push(lin); lin = w; } else lin = t; }
      if(lin) L.push(lin);
      if(L.length > linhasMax){ const r = L.slice(0, linhasMax); let u = r[linhasMax - 1]; while(ctx.measureText(u + '…').width > max && u.length) u = u.slice(0, -1); r[linhasMax - 1] = u.replace(/\s+\S*$/, '') + '…'; return r; }
      return L;
    };
    const tamT = feed ? 62 : 72, lhT = Math.round(tamT * 1.14), bx = 30, by = 22;
    const fT = '700 ' + tamT + 'px "Mona Larga", "Mona Sans", sans-serif';
    const tit = quebra(st.titulo, fT, maxW - bx * 2, 3);
    const fL = '400 ' + (feed ? 34 : 38) + 'px "Mona Sans", sans-serif', lhL = feed ? 48 : 54;
    const lin = quebra(st.linha, fL, maxW, 3);
    const nomeL = quebra(p.nome, '700 32px "Mona Sans", sans-serif', 430, 2);
    const hBairro = 44, hTit = tit.length * lhT + by * 2, hLin = lin.length * lhL, hRod = 120, gap = feed ? 22 : 28;
    const bandH = pad * 0.8 + hBairro + gap * 0.5 + hTit + gap + hLin + gap + 2 + gap + hRod + pad * 0.6;
    const y0 = H - bandH;
    const grad = ctx.createLinearGradient(0, y0 - 260, 0, y0);
    grad.addColorStop(0, V.banda.replace(/[\d.]+\)$/, '0)')); grad.addColorStop(1, V.banda);
    ctx.fillStyle = grad; ctx.fillRect(0, y0 - 260, W, 260);
    ctx.fillStyle = V.banda; ctx.fillRect(0, y0, W, bandH);
    let y = y0 + pad * 0.8;
    ctx.textBaseline = 'top';
    ctx.font = '600 30px "Mona Sans", sans-serif'; ctx.fillStyle = V.apoio;
    ctx.fillText([p.bairro, quemDe(p)].filter(Boolean).join(', '), pad, y + 6);
    y += hBairro + gap * 0.5;
    ctx.font = fT;
    const larg = Math.min(maxW, Math.max(...tit.map(t => ctx.measureText(t).width)) + bx * 2);
    caixa(pad, y, larg, hTit, 22, V.caixa);
    ctx.fillStyle = V.caixaTexto; tit.forEach((t, i) => ctx.fillText(t, pad + bx, y + by + i * lhT + (lhT - tamT) * 0.35));
    y += hTit + gap;
    ctx.font = fL; ctx.fillStyle = V.texto; lin.forEach((t, i) => ctx.fillText(t, pad, y + i * lhL));
    y += hLin + gap;
    ctx.fillStyle = V.fio; ctx.fillRect(pad, y, maxW, 2);
    y += 2 + gap;
    let xL = pad;
    if(logoImg){ const lh = 112, lw = lh * logoImg.width / logoImg.height; ctx.drawImage(logoImg, pad, y, lw, lh); xL = pad + lw + 22; }
    ctx.font = '700 32px "Mona Sans", sans-serif'; ctx.fillStyle = V.texto; nomeL.forEach((t, i) => ctx.fillText(t, xL, y + 16 + i * 42));
    const nomeC = pf.nome ? primeiroNome(pf.nome) + ', corretor Fortal' : 'Corretor Fortal', tel = pf.tel || '', creci = pf.creci ? 'CRECI ' + pf.creci : '';
    ctx.textAlign = 'right'; ctx.font = '600 30px "Mona Sans", sans-serif'; ctx.fillStyle = V.contato;
    ctx.fillText(nomeC, W - pad, y + 14); if(tel) ctx.fillText(tel, W - pad, y + 56);
    if(creci){ ctx.font = '400 24px "Mona Sans", sans-serif'; ctx.fillStyle = V.apoio; ctx.fillText(creci, W - pad, y + 98); }
    ctx.textAlign = 'left';
    try{ const b = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92)); if(vez === st.vez) st.blob = b; }
    catch(e){ if(aviso && vez === st.vez) aviso.textContent = 'Essa foto não deixa salvar a arte. Escolha outra ou use uma do aparelho.'; }
  }
  const nomeArquivoPost = () => { const p = S.byId.get(S.post.id); return 'post-' + (p ? slug(p.nome) : 'fortal') + '-' + S.post.fmt + '.jpg'; };

  // ================= ESPELHO DO PRÉDIO (como no app dos Espelhos: andares x finais, cor pela situação) =================
  ICO.predio = svg('<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M11 21v-3h2v3"/>');
  ICO.comparar = svg('<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>', 1.9);
  const ST_ORDEM = ['disponivel', 'reservada', 'processo_final', 'vendida'];
  const ST_TILE = {disponivel: 'Disponíveis', reservada: 'Reservadas', processo_final: 'Em processo', vendida: 'Vendidas'};
  const FX_PADRAO = [[25, 'até 25 m²'], [30, '25 a 30 m²'], [35, '30 a 35 m²'], [45, '35 a 45 m²'], [70, '45 a 70 m²'], [9999, 'acima de 70 m²']];
  const ordTB = s => { const t = norm(s); return /^stud/.test(t) ? 0 : /^1/.test(t) ? 1 : /^2/.test(t) ? 2 : /^3/.test(t) ? 3 : /^4/.test(t) ? 4 : /loja/.test(t) ? 9 : 5; };
  const tipoKDe = s => { const t = norm(s); return /^stud|^kitn/.test(t) ? 'S' : /^1/.test(t) ? '1' : /^2/.test(t) ? '2' : /^[3-9]/.test(t) ? '3' : /loja/.test(t) ? 'L' : null; };
  const vagaRot = n => n == null ? null : n === 0 ? 'Sem vaga' : n === 1 ? '1 vaga' : n + ' vagas';
  const andarRot = v => v === 'T' ? 'Térreo' : v === 'S' ? 'Subsolo' : v === 'L' ? 'Loja' : v === 'G' ? 'Garden' : /^\d+$/.test(String(v)) ? v + 'º' : String(v == null ? '' : v);
  const kmil = v => v >= 1e6 ? (Math.round(v / 1e4) / 100).toLocaleString('pt-BR') + ' mi' : Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  const m2c = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR') + ' m²';
  const catNomeDe = (det, c) => (det.dados.cat_nome && det.dados.cat_nome[c]) || c;
  const EF0 = () => ({st: 'todos', mov: false, tb: null, fx: null, tipo: null, cat: null, final: null, vista: null, vaga: null, pmax: null, mob: null});
  const EF_ROT = {tb: 'Tipologia', fx: 'Metragem', tipo: 'Planta', cat: 'Enquadramento', vista: 'Vista', vaga: 'Vaga', pmax: 'Valor até', final: 'Final', mob: 'Mobília'};
  const mobProj = det => !!(det && det.info && det.info.mobiliado && det.info.mobiliado.r === 'todas');
  const espTemGrade = det => !!(det && det.dados && det.dados.grade && +det.dados.grade.colunas > 0 && Array.isArray(det.dados.grade.andares) && det.dados.grade.andares.length);
  const vistaTab = det => espTemGrade(det) && S.ui.tabVista !== 'lista' ? 'espelho' : 'lista';
  function espFiltro(id){ if(!S.ui.ef || S.ui.ef.pid !== id) S.ui.ef = Object.assign(EF0(), {pid: id}); return S.ui.ef; }
  function espFaixas(det, c){
    const f = c && Array.isArray(c.faixas) && c.faixas.length ? c.faixas : (Array.isArray(det.dados.faixas) && det.dados.faixas.length ? det.dados.faixas : FX_PADRAO);
    return f.filter(x => Array.isArray(x) && x.length >= 2 && +x[0] > 0).map(x => [+x[0], String(x[1])]).sort((x, y) => x[0] - y[0]);
  }
  const espFaixa = (FX, ar) => { if(!(ar > 0) || !FX.length) return null; for(const x of FX) if(ar <= x[0]) return x[1]; return FX[FX.length - 1][1]; };
  const _espU = new WeakMap();
  function espUnidades(det, c){   // unidades do espelho com o que os filtros e o mapa usam (guardado por leitura)
    const ch = _espU.get(det); if(ch && ch.c === c) return ch.U;
    const d = det.dados, G = d.grade || {}, rot = Array.isArray(G.rotulos_colunas) ? G.rotulos_colunas : null, FX = espFaixas(det, c);
    const tlCentral = tipo => {   // sem tipologia no espelho: a da planta daquele tipo na ficha da central ("Studio com closet 21 m²" vira Studio)
      if(!tipo || !c || !Array.isArray(c.plantas)) return '';
      const pl = c.plantas.find(x => Array.isArray(x.tipos) && x.tipos.map(String).includes(tipo)); if(!pl) return '';
      const t = norm(pl.t); return /^stud|^kitn/.test(t) ? 'Studio' : /^1 dorm/.test(t) ? '1 dorm' : /^2 dorm/.test(t) ? '2 dorms' : /^3 dorm/.test(t) ? '3 dorms' : /^4 dorm/.test(t) ? '4 dorms' : '';
    };
    const mp = mobProj(det);
    const U = (d.unidades || []).map(a => {
      const ar = areaU(a), tl = tipologiaU(det, a) || tlCentral(a[1] ? String(a[1]) : '') || '', col = +a[5] || 0, loja = a[4] === 'L' || /^loja/i.test(tl);
      const vi = (Array.isArray(d.vistas) ? d.vistas : []).find(v => col >= +v.col_ini && col <= +v.col_fim);
      return {a, n: String(a[0]), tipo: a[1] ? String(a[1]) : null, ar, tl, cat: a[3] || null, andar: a[4], col, st: a[6], loja,
        vista: vi ? vi.id : null, final: rot && !loja && rot[col] != null ? String(rot[col]) : null, fx: espFaixa(FX, ar), vg: vagaDe(det, a), mob: mp || !!exDe(a).mob};
    });
    _espU.set(det, {c, U});
    return U;
  }
  function espBate(u, f, modo, ign){   // filtros de unidade (menos a situação)
    if(ign !== 'tb' && f.tb && u.tl !== f.tb) return false;
    if(ign !== 'fx' && f.fx && u.fx !== f.fx) return false;
    if(ign !== 'tipo' && f.tipo && u.tipo !== f.tipo) return false;
    if(ign !== 'cat' && f.cat && u.cat !== f.cat) return false;
    if(ign !== 'final' && f.final && u.final !== f.final) return false;
    if(ign !== 'vista' && f.vista && u.vista !== f.vista) return false;
    if(ign !== 'vaga' && f.vaga && vagaRot(u.vg) !== f.vaga) return false;
    if(ign !== 'mob' && f.mob && !u.mob) return false;
    if(ign !== 'pmax' && f.pmax){ const v = precoU(u.a, modo); if(!(v > 0) || v > f.pmax) return false; }
    return true;
  }
  const espStBate = (u, f, recentes) => (f.st === 'todos' || u.st === f.st) && (!f.mov || recentes.has(u.n));
  const efAtivos = f => ['tb', 'fx', 'tipo', 'cat', 'final', 'vista', 'vaga', 'pmax', 'mob'].filter(k => f[k] != null && f[k] !== '');
  function efResumo(f){   // "Studio, até 25 m², até R$ 190 mil"
    return efAtivos(f).map(k => k === 'pmax' ? 'até ' + BRLc(f.pmax) : k === 'final' ? 'final ' + f.final : k === 'mob' ? 'mobiliado' : k === 'tipo' ? String(f.tipo).replace(/^TIPO /i, 'tipo ') : String(f[k])).join(', ');
  }
  function espPassos(U, modo){   // "valor até": quartis arredondados dos preços das livres
    const vs = U.filter(u => u.st === 'disponivel').map(u => precoU(u.a, modo)).filter(v => v > 0).sort((x, y) => x - y);
    if(vs.length < 4) return [];
    const arred = v => v >= 1e6 ? Math.ceil(v / 5e4) * 5e4 : Math.ceil(v / 1e4) * 1e4;
    const out = [];
    for(const q of [.2, .4, .6, .8]){ const v = arred(vs[Math.min(vs.length - 1, Math.floor(q * vs.length))]); if(!out.includes(v) && v < vs[vs.length - 1]) out.push(v); }
    return out;
  }

  // ---------- controles: blocos de situação e filtros com contagem das livres ----------
  function espTilesHtml(U, f, modo, det, recentes){
    const base = U.filter(u => espBate(u, f, modo) && (!f.mov || recentes.has(u.n)));
    const tot = base.length, sts = ST_ORDEM.filter(s => U.some(u => u.st === s));
    const rotSt = s => { if(s !== 'processo_final') return ST_TILE[s]; const l = stLabel(det, s); return l.length <= 16 ? l : ST_TILE[s]; };
    const CURTO = {todos: 'Total', disponivel: 'Disp.', reservada: 'Reserv.', processo_final: /^pend/i.test(stLabel(det, 'processo_final')) ? 'Pend.' : 'Proc.', vendida: 'Vend.'};
    const tile = (st, rot, n) => '<button type="button" class="ef-tile s-' + st + '" data-acao="ef-st" data-v="' + st + '" aria-pressed="' + (f.st === st) + '" aria-label="' + esc(rot + ': ' + n.toLocaleString('pt-BR')) + '"><span class="ef-tr"><i aria-hidden="true"></i><span class="l-longo">' + esc(rot) + '</span><span class="l-curto" aria-hidden="true">' + esc(CURTO[st] || rot) + '</span></span><b class="num">' + n.toLocaleString('pt-BR') + '</b><small>' + (st === 'todos' ? 'no filtro' : tot ? Math.round(n / tot * 100) + '%' : '0%') + '</small></button>';
    return '<div class="ef-tiles" style="--n:' + (sts.length + 1) + '">' + tile('todos', 'Total', tot) + sts.map(s => tile(s, rotSt(s), base.filter(u => u.st === s).length)).join('') + '</div>';
  }
  function espChipsHtml(U, f, modo, det, recentes, c, emLista){
    const disp = U.filter(u => u.st === 'disponivel');
    const conta = (k, pred) => disp.filter(u => pred(u) && espBate(u, f, modo, k)).length;
    const linha = (k, vals, sempre) => {
      const ops = vals.map(([v, l, pred]) => ({v, l, n: conta(k, pred)})).filter(o => o.n > 0 || String(f[k]) === String(o.v));
      if(!sempre && ops.length < 2 && f[k] == null) return '';
      if(!ops.length) return '';
      return '<div class="ef-lin"><span class="ef-rot">' + esc(EF_ROT[k]) + '</span><div class="ef-ops" role="group" aria-label="' + esc(EF_ROT[k]) + '">' +
        '<button type="button" class="pilula peq" data-acao="ef" data-k="' + k + '" data-v="" aria-pressed="' + (f[k] == null) + '">Todas</button>' +
        ops.map(o => '<button type="button" class="pilula peq" data-acao="ef" data-k="' + k + '" data-v="' + esc(o.v) + '" aria-pressed="' + (String(f[k]) === String(o.v)) + '">' + esc(o.l) + '<span class="n">' + o.n + '</span></button>').join('') + '</div></div>';
    };
    const tls = [...new Set(U.map(u => u.tl).filter(Boolean))].sort((x, y) => ordTB(x) - ordTB(y) || x.localeCompare(y, 'pt-BR', {numeric: true}));
    const FX = espFaixas(det, c);
    const fxs = FX.map(x => x[1]).filter(l => U.some(u => u.fx === l));
    const tipos = [...new Set(U.map(u => u.tipo).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'pt-BR', {numeric: true}));
    const arTipo = t => { const u = U.find(x => x.tipo === t && x.ar); return u ? ', ' + m2c(u.ar) : ''; };
    const cats = [...new Set(U.map(u => u.cat).filter(Boolean))].sort((x, y) => catNomeDe(det, x).localeCompare(catNomeDe(det, y), 'pt-BR'));
    const vistas = Array.isArray(det.dados.vistas) ? det.dados.vistas : [];
    const vagas = [...new Set(U.map(u => vagaRot(u.vg)).filter(Boolean))].sort((x, y) => (x === 'Sem vaga' ? 0 : parseInt(x, 10)) - (y === 'Sem vaga' ? 0 : parseInt(y, 10)));
    const passos = espPassos(U, modo);
    const linhas = [
      linha('tb', tls.map(t => [t, t, u => u.tl === t]), true),
      linha('fx', fxs.map(l => [l, l, u => u.fx === l])),
      linha('pmax', passos.map(v => [v, 'até ' + BRLc(v), u => { const x = precoU(u.a, modo); return x > 0 && x <= v; }])),
      tipos.length > 1 ? linha('tipo', tipos.map(t => [t, String(t).replace(/^TIPO /i, 'Tipo ') + arTipo(t), u => u.tipo === t])) : '',
      cats.length > 1 ? linha('cat', cats.map(c => [c, catNomeDe(det, c), u => u.cat === c])) : '',
      vistas.length ? linha('vista', vistas.map(v => [v.id, v.label, u => u.vista === v.id])) : '',
      vagas.length > 1 ? linha('vaga', vagas.map(v => [v, v, u => vagaRot(u.vg) === v])) : '',
      U.some(u => u.mob) && U.some(u => !u.mob) ? linha('mob', [['1', 'Mobiliado', u => u.mob]], true) : ''
    ].filter(Boolean);
    const extras = linhas.slice(2), abertos = S.ui.efMais || efAtivos(f).some(k => !['tb', 'fx', 'final'].includes(k));
    const ativos = efAtivos(f);
    const nMov = U.filter(u => recentes.has(u.n) && espBate(u, f, modo)).length;
    return '<div class="ef-filtros">' + linhas.slice(0, 2).join('') + (abertos ? extras.join('') : '') +
      '<div class="ef-acoes">' + (extras.length ? '<button type="button" class="link-mais" data-acao="ef-mais" aria-expanded="' + abertos + '">' + (abertos ? 'Menos filtros' : '<span>Mais filtros<span class="l-longo">: ' + esc(extras.map(h => (/class="ef-rot">([^<]+)/.exec(h) || [])[1]).filter(Boolean).join(', ').toLowerCase()) + '</span></span>') + ' ' + ICO.baixo + '</button>' : '') +
      (!emLista && (nMov || f.mov) ? '<button type="button" class="pilula peq" data-acao="ef-mov" aria-pressed="' + !!f.mov + '">Mexeram hoje e ontem<span class="n">' + nMov + '</span></button>' : '') +
      (f.final ? '<button type="button" class="pilula peq" data-acao="ef" data-k="final" data-v="" aria-label="Tirar o filtro do final ' + esc(f.final) + '">Final ' + esc(f.final) + ICO.x + '</button>' : '') +
      (ativos.length || (!emLista && (f.st !== 'todos' || f.mov)) ? '<button type="button" class="link-mais" data-acao="ef-limpar">Limpar filtros</button>' : '') + '</div></div>';
  }

  // ---------- o mapa ----------
  function espCelula(u, rr, ok, modo, sel, recentes, q, multiCat, det){
    const v = precoU(u.a, modo), mk = sel.has(u.n), mv = recentes.get(u.n), achou = q && norm(u.n) === q;
    const vend = u.st === 'vendida', tag = '';   // o enquadramento fica no filtro e na ficha da unidade: na célula não cabe
    const desc = ['Unidade ' + u.n, andarTxt(u.andar), u.tl, u.ar ? m2c(u.ar) : '', u.cat ? catNomeDe(det, u.cat) : '', v && !vend ? BRL(v) : '', stLabel(det, u.st)].filter(Boolean).join(', ');
    return '<button type="button" class="ep-u s-' + esc(u.st) + (ok ? '' : ' off') + (mk ? ' marc' : '') + (mv ? ' mov' : '') + (achou ? ' achou' : '') + '" data-acao="esp-u" data-n="' + esc(u.n) + '" style="grid-row:' + rr + ';grid-column:' + (u.col + 2) + '" aria-label="' + esc(desc) + '" title="' + esc(desc) + '">' +
      '<b>' + esc(u.n) + (tag ? '<i>' + esc(String(tag).slice(0, 6)) + '</i>' : '') + '</b>' +
      (vend ? '' : '<span>' + esc(u.ar ? m2c(u.ar) : (u.tl || '')) + '</span>' + (v && S.ui.espPreco !== false ? '<span class="pr">' + esc(kmil(v)) + '</span>' : '')) +
      (mk ? '<em class="ep-ok" aria-hidden="true">' + ICO.ok + '</em>' : '') + '</button>';
  }
  function espGradeHtml(p, det, U, f, modo, sel, recentes){
    const d = det.dados, G = d.grade || {}, COLS = Math.max(1, +G.colunas || 1), FLS = Array.isArray(G.andares) ? G.andares : [];
    const rot = Array.isArray(G.rotulos_colunas) ? G.rotulos_colunas : null, comuns = Array.isArray(d.comuns) ? d.comuns : [];
    const q = norm(S.ui.tabQ).trim(), multiCat = new Set(U.map(u => u.cat).filter(Boolean)).size > 1;
    const out = [], gc = (ini, fim) => 'grid-column:' + (+ini + 2) + ' / ' + (+fim + 3);
    let r = 1;
    const barras = Array.isArray(G.barras_topo) ? G.barras_topo : [];
    for(const b of barras) out.push('<div class="ep-barra ' + esc(b.estilo || '') + '" style="grid-row:' + r + ';' + gc(b.col_ini, b.col_fim) + '">' + esc(b.texto) + '</div>');
    if(barras.length){ out.push('<span class="ep-and ep-vazio" style="grid-row:' + r + '"></span>'); r++; }
    if(rot){
      out.push('<span class="ep-and ep-cab" style="grid-row:' + r + '">Final</span>');
      rot.forEach((l, i) => { if(i < COLS) out.push('<button type="button" class="ep-final" data-acao="ef-final" data-v="' + esc(l) + '" aria-pressed="' + (f.final === String(l)) + '" style="grid-row:' + r + ';grid-column:' + (i + 2) + '" aria-label="Ver só o final ' + esc(l) + '" title="Ver só o final ' + esc(l) + '">' + esc(l) + '</button>'); });
      r++;
    }
    for(const t of (Array.isArray(G.topo) ? G.topo : [])){ out.push('<span class="ep-and" style="grid-row:' + r + '">' + esc(t.rotulo || '') + '</span><div class="ep-topo" style="grid-row:' + r + ';' + gc(t.col_ini, t.col_fim) + '">' + esc(t.texto) + '</div>'); r++; }
    const linha = new Map(); FLS.slice().reverse().forEach((fl, i) => linha.set(String(fl), r + i));
    const contA = new Map();
    for(const [fl, rr] of linha) out.push('<span class="ep-and" style="grid-row:' + rr + '">' + esc(andarRot(fl)) + '</span>');
    for(const u of U){
      const rr = linha.get(String(u.andar)); if(!rr || u.col >= COLS) continue;
      const ok = espBate(u, f, modo) && espStBate(u, f, recentes);
      if(ok && u.st === 'disponivel') contA.set(String(u.andar), (contA.get(String(u.andar)) || 0) + 1);
      out.push(espCelula(u, rr, ok, modo, sel, recentes, q, multiCat, det));
    }
    for(const cm of comuns){ const rr = linha.get(String(cm.andar)); if(rr && +cm.col < COLS) out.push('<div class="ep-comum" style="grid-row:' + rr + ';grid-column:' + (+cm.col + 2) + '" title="Área comum: ' + esc(cm.label) + '">' + esc(cm.label) + '</div>'); }
    for(const [fl, rr] of linha){ const n = contA.get(fl); out.push('<span class="ep-bd' + (n ? '' : ' zero') + '" style="grid-row:' + rr + ';grid-column:' + (COLS + 2) + '"' + (n ? ' title="' + esc(plural(n, 'livre no filtro', 'livres no filtro') + ' no ' + andarRot(fl)) + '"' : '') + '>' + (n || '') + '</span>'); }
    r += FLS.length;
    if(G.barra_base){ out.push('<span class="ep-and ep-vazio" style="grid-row:' + r + '"></span><div class="ep-base" style="grid-row:' + r + ';' + gc(0, COLS - 1) + '">' + esc(G.barra_base) + '</div>'); }
    return '<div class="ep-rola" tabindex="0" role="region" aria-label="Espelho do ' + esc(p.nome) + ': role para os lados para ver todos os finais"><div class="ep' + (S.ui.espDenso ? ' denso' : '') + '" style="--cols:' + COLS + '">' + out.join('') + '</div></div>';
  }
  function espLegendaHtml(det, U){
    const sts = ST_ORDEM.filter(s => U.some(u => u.st === s));
    return '<div class="ep-leg">' + sts.map(s => '<span><i class="s-' + s + '" aria-hidden="true"></i>' + esc(stLabel(det, s)) + '</span>').join('') +
      '<span><i class="off" aria-hidden="true"></i>Fora do filtro</span><span><i class="mov" aria-hidden="true"></i>Mexeu hoje ou ontem</span><span><i class="marc" aria-hidden="true"></i>Marcada para mandar</span></div>';
  }
  function espelhoCorpoHtml(p, det){
    const c = S.centralV.get(p.id) || null, U = espUnidades(det, c), f = espFiltro(p.id), modo = modoTabela(p, det);
    const sel = S.ui.tabSel.get(p.id) || new Set(), recentes = recentesDe(det);
    const temPreco = U.some(u => precoU(u.a, modo));
    return espTilesHtml(U, f, modo, det, recentes) + espChipsHtml(U, f, modo, det, recentes, c) +
      '<div class="ep-quadro"><div class="ep-cab-q"><p class="sub"><span class="l-longo">Toque numa unidade para ver planta, valores e fluxo.</span><span class="l-curto">Toque na unidade para ver planta e valores.</span></p><div class="ep-ferr">' +
      (temPreco ? '<button type="button" class="pilula peq" data-acao="esp-preco" aria-pressed="' + (S.ui.espPreco !== false) + '">Preço na célula</button>' : '') +
      '<button type="button" class="pilula peq" data-acao="esp-denso" aria-pressed="' + !!S.ui.espDenso + '">Prédio inteiro</button></div></div>' +
      espGradeHtml(p, det, U, f, modo, sel, recentes) + espLegendaHtml(det, U) + '</div>' +
      (sel.size ? barraTabelaHtml(p, sel) : '');
  }
  function barraTabelaHtml(p, sel){
    return '<div class="barra-envio"><p><span><b class="num">' + sel.size + '</b> ' + (sel.size === 1 ? 'unidade' : 'unidades') + '</span><small>' + (sel.size === 1 ? 'marcada' : 'marcadas') + '</small></p><button type="button" class="btn" data-acao="tab-limpar" data-id="' + esc(p.id) + '">Limpar</button><button type="button" class="btn btn-pri" data-acao="enviar" data-id="' + esc(p.id) + '" data-sel="1">' + ICO.enviar + '<span>Mandar<span class="so-largo"> pro cliente</span></span></button></div>';
  }
  function espRolarAchada(){   // a unidade digitada na busca aparece no meio do mapa
    const el = $('.ep-u.achou'); if(el) el.scrollIntoView({block: 'nearest', inline: 'center', behavior: menosMov() ? 'auto' : 'smooth'});
  }

  // ---------- planta, posição no andar e vista da unidade (ficha da central de produto) ----------
  function finalNum(det, a){ const rot = det.dados.grade && det.dados.grade.rotulos_colunas; const v = rot && rot[+a[5]] != null ? parseInt(rot[+a[5]], 10) : NaN; return isNaN(v) ? null : v; }
  const andarNum = a => /^\d+$/.test(String(a[4])) ? +a[4] : (a[4] === 'T' ? 0 : null);
  function plantaDaUnidade(det, c, a){
    const tl = tipologiaU(det, a) || '', tipo = a[1] ? String(a[1]) : null, fin = finalNum(det, a), an = andarNum(a);
    if(c && Array.isArray(c.plantas) && c.plantas.length){
      const noAndar = x => an == null || x.de == null || (an >= +x.de && an <= +(x.ate != null ? x.ate : x.de));
      let pl = tipo ? c.plantas.find(x => Array.isArray(x.tipos) && x.tipos.map(String).includes(tipo)) : null;
      if(!pl && fin != null) pl = c.plantas.find(x => Array.isArray(x.finais) && x.finais.map(Number).includes(fin) && noAndar(x)) || c.plantas.find(x => Array.isArray(x.finais) && x.finais.map(Number).includes(fin));
      if(pl) return {src: imgCentral(c, pl.id), t: pl.t ? 'Planta ' + pl.t : 'Planta', sub: pl.andares || '', exata: true};
      const ar = areaU(a), tk = tipoKDe(tl);
      const cands = c.plantas.map(x => { const m = /(\d+(?:[.,]\d+)?)\s*m²/.exec(String(x.t || '')); return {x, m: m ? +m[1].replace(',', '.') : null}; }).filter(o => o.m && (!tk || tipoKDe(o.x.t) === tk));
      if(ar > 0 && cands.length){ cands.sort((x, y) => Math.abs(x.m - ar) - Math.abs(y.m - ar)); if(Math.abs(cands[0].m - ar) <= 2) return {src: imgCentral(c, cands[0].x.id), t: 'Planta ' + cands[0].x.t, sub: cands[0].x.andares || '', exata: false}; }
    }
    const outras = plantasDoProjeto(det, c).filter(x => x.src), tn = norm(tl).replace(/\./g, '');
    const hit = outras.find(x => tn && norm(x.t).replace(/\./g, '').includes(tn)) || (outras.length === 1 ? outras[0] : null);
    return hit ? {src: hit.src, t: hit.t, sub: hit.sub || '', exata: false} : null;
  }
  function andarDaUnidade(det, c, a){   // planta do pavimento com a unidade marcada
    if(!c || !Array.isArray(c.andar_img)) return null;
    const fin = finalNum(det, a), an = andarNum(a); if(fin == null || an == null) return null;
    const ai = c.andar_img.find(x => an >= +x.de && an <= +x.ate); if(!ai || !ai.cells || !(+ai.w > 0) || !(+ai.h > 0)) return null;
    const r = ai.cells[String(fin)]; if(!Array.isArray(r) || !r.length) return null;
    const rs = (Array.isArray(r[0]) ? r : [r]).filter(x => Array.isArray(x) && x.length >= 4);
    if(!rs.length) return null;
    return {src: imgCentral(c, ai.img), rs: rs.map(x => ({x: x[0] / ai.w * 100, y: x[1] / ai.h * 100, w: x[2] / ai.w * 100, h: x[3] / ai.h * 100})), leg: c.andar_legenda || ''};
  }
  function vistaDaUnidade(det, c, a){   // foto da vista daquela face, no andar mais próximo abaixo
    if(!c || !Array.isArray(c.faces)) return null;
    const fin = finalNum(det, a), col = +a[5], an = andarNum(a);
    const face = c.faces.find(x => (Array.isArray(x.finais) && fin != null && x.finais.map(Number).includes(fin)) || (Array.isArray(x.cols) && x.cols.map(Number).includes(col)));
    if(!face || !face.vistas || an == null) return null;
    const ks = Object.keys(face.vistas).map(Number).filter(n => !isNaN(n)).sort((x, y) => x - y); if(!ks.length) return null;
    let k = ks[0]; for(const n of ks) if(n <= an) k = n;
    return {src: imgCentral(c, face.vistas[String(k)]), t: 'Vista ' + (face.nome ? 'para a ' + face.nome : 'desta face'), sub: 'Foto tirada no ' + k + 'º andar'};
  }

  // ---------- folha da unidade ----------
  function unidadeCorpoHtml(p, det, c, a){
    const n = String(a[0]), ex = exDe(a), pc = precosCampos(det).slice(0, 3), ar = areaU(a), tl = tipologiaU(det, a), m = recentesDe(det).get(n), st = stDe(det, a, m);
    const vg = vagaDe(det, a), fin = finalNum(det, a), vi = (det.dados.vistas || []).find(v => +a[5] >= +v.col_ini && +a[5] <= +v.col_fim);
    const base = precoU(a, chaveBase(det));
    let h = '<div class="un-topo"><span class="un-st s-' + esc(a[6]) + '"><i aria-hidden="true"></i>' + esc(stLabel(det, a[6])) + '</span>' + (m ? '<span class="sub">' + esc(st.txt) + '</span>' : '') + '</div>';
    const precos = pc.map(x => ({l: x.label, v: precoU(a, x.k)})).filter(x => x.v);
    if(precos.length) h += '<div class="un-precos">' + precos.map(x => '<div><span>' + esc(x.l) + '</span><b class="num">' + esc(BRL(x.v)) + '</b></div>').join('') + (base && ar ? '<div><span>Por m²</span><b class="num">' + esc(BRL(base / ar)) + '</b></div>' : '') + '</div>';
    else if(a[6] === 'disponivel') h += '<p class="aviso fino">' + esc(det.dados.sem_tabela || 'Unidade sem preço na tabela. Confirme o valor com a construtora.') + '</p>';
    const fatos = [['Andar', andarTxt(a[4])], ['Tipologia', tl], ['Área', ar ? fmtM2(ar) : ''], ['Planta', a[1] ? String(a[1]).replace(/^TIPO /i, 'Tipo ') : ''], ['Enquadramento', a[3] ? catNomeDe(det, a[3]) : ''],
      ['Vaga', vg != null ? vagaRot(vg) : ''], ['Final', fin != null ? String(fin).padStart(2, '0') : ''], ['Vista', vi ? vi.label : ''], ['Mobiliado', ex.mob || mobProj(det) ? 'Sim' : ''], ['PCD', ex.pcd ? 'Adaptável' : '']].filter(x => x[1]);
    h += '<dl class="un-fatos">' + fatos.map(x => '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>').join('') + '</dl>';
    const pl = plantaDaUnidade(det, c, a), ad = andarDaUnidade(det, c, a), vs = vistaDaUnidade(det, c, a);
    const luz = [];
    let mid = '';
    if(pl){ luz.push({src: pl.src, t: pl.t + (pl.sub ? ', ' + pl.sub : '')}); mid += '<figure class="planta un-planta"><button type="button" class="mos-item" data-acao="luz-un" data-i="' + (luz.length - 1) + '" aria-label="' + esc('Ampliar a ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 900, semSet: true}) + '</button><figcaption>' + esc(pl.exata ? pl.t : pl.t + ' (da tipologia)') + (pl.sub ? '<small>' + esc(pl.sub) + '</small>' : '') + '</figcaption></figure>'; }
    if(ad){ luz.push({src: ad.src, t: 'Posição no andar'}); mid += '<figure class="planta un-andar-f"><button type="button" class="un-andar" data-acao="luz-un" data-i="' + (luz.length - 1) + '" aria-label="Ampliar a planta do andar">' + imgTag(ad.src, 'Planta do ' + andarTxt(a[4]), '', {w: 1200, semSet: true}) + ad.rs.map(r => '<i style="left:' + r.x.toFixed(2) + '%;top:' + r.y.toFixed(2) + '%;width:' + r.w.toFixed(2) + '%;height:' + r.h.toFixed(2) + '%"></i>').join('') + '</button><figcaption>Posição no andar<small>Unidade ' + esc(n) + ' em destaque</small></figcaption></figure>'; }
    if(vs){ luz.push({src: vs.src, t: vs.t + ', ' + vs.sub}); mid += '<figure class="planta un-vista"><button type="button" class="mos-item" data-acao="luz-un" data-i="' + (luz.length - 1) + '" aria-label="Ampliar a foto da vista">' + imgTag(vs.src, vs.t, '', {w: 900, semSet: true}) + '</button><figcaption>' + esc(vs.t) + '<small>' + esc(vs.sub) + '</small></figcaption></figure>'; }
    S.unLuz = luz;
    if(mid) h += '<div class="un-midia">' + mid + '</div>';
    else if(c === undefined) h += '<div class="brilho" style="height:180px;border-radius:14px"></div>';
    const fx = fluxoHtml(det, a);
    if(fx) h += '<details class="un-fluxo"' + (ehToque() && !persDe(p.id, n) ? '' : ' open') + '><summary>Como o cliente paga' + (fx && persDe(p.id, n) ? '<small>pela tabela</small>' : '') + '</summary>' + fx + '</details>';
    h += persSecaoHtml(p, det, a);
    if(c && c.aviso_planta && pl) h += '<p class="nota">' + esc(c.aviso_planta) + '</p>';
    return h;
  }
  function unidadePeHtml(p, a){
    const n = String(a[0]), livre = a[6] === 'disponivel', mk = (S.ui.tabSel.get(p.id) || new Set()).has(n);
    return (livre ? '<button type="button" class="btn" data-acao="un-marcar" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '">' + (mk ? ICO.ok + 'Marcada' : 'Marcar') + '</button>' +
      '<button type="button" class="btn btn-pri" data-acao="un-mandar" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '">' + ICO.enviar + 'Mandar</button>' : '') +
      '<a class="btn" href="#/comparar?p=' + encodeURIComponent(p.id) + '&n=' + encodeURIComponent(n) + '">' + ICO.comparar + 'Comparar</a>';
  }
  async function abrirUnidadeEsp(id, n){
    const p = S.byId.get(id), ch = S.det.get(id), det = ch && ch.v; if(!p || !det) return;
    const a = (det.dados.unidades || []).find(x => String(x[0]) === String(n)); if(!a) return;
    const c0 = S.centralV.has(id) ? S.centralV.get(id) : undefined;
    if(S.fe && !feAberto(id, n)) S.fe = null;   // rascunho de outra unidade não vale aqui
    abrirFolha('un', 'Unidade ' + n + (a[4] != null && a[4] !== '' ? ', ' + andarTxt(a[4]) : ''), '', unidadePeHtml(p, a), 'folha-un');
    const dlg = $('#folha-un'); if(dlg){ dlg.dataset.n = String(n); dlg.dataset.pid = id; corpoFolha(unidadeCorpoHtml(p, det, c0, a), null, dlg); if(S.fe) feTotais(); }
    if(c0 === undefined){
      const c = await fichaCentral(id).catch(() => null);
      const d2 = $('#folha-un'); if(d2 && d2.isConnected && d2.dataset.n === String(n)){ const cp = $('.folha-corpo', d2), y = cp.scrollTop; corpoFolha(unidadeCorpoHtml(p, det, c, a), null, d2); cp.scrollTop = y; if(S.fe) feTotais(); }
    }
  }
  function marcarUnidade(id, n){
    const s = S.ui.tabSel.get(id) || new Set();
    if(s.has(n)) s.delete(n); else s.add(n);
    if(s.size) S.ui.tabSel.set(id, s); else S.ui.tabSel.delete(id);
    const p = S.byId.get(id), ch = S.det.get(id), det = ch && ch.v, dlg = $('#folha-un');
    if(p && det && dlg){ const a = (det.dados.unidades || []).find(x => String(x[0]) === String(n)); if(a){ const pe = dlg.querySelector('.folha-pe'); if(pe) pe.innerHTML = unidadePeHtml(p, a); } }
    atualizarTabela();
  }

  // ================= COMPARAR (mesmo motor do app dos Espelhos: opções parecidas ou escolhidas, lado a lado) =================
  const CP_MOT = [['parecido', 'Parecidos'], ['preco', 'Mais barato'], ['entrega', 'Entrega mais próxima'], ['regiao', 'Outra região'], ['tamanho', 'Planta maior']];
  const CP_INTRO = {parecido: 'opções parecidas com o %s', preco: 'opções mais em conta que o %s', entrega: 'opções com entrega mais próxima que a do %s', regiao: 'opções em outra região, no lugar do %s', tamanho: 'opções com planta maior que a do %s'};
  const CP_PESOS = {   // a: metragem, p: valor, e: entrega, d: distância, f: fase
    parecido: {a: .25, p: .30, e: .15, d: .15, f: .15}, preco: {a: .25, p: .40, e: .10, d: .15, f: .10}, entrega: {a: .20, p: .20, e: .40, d: .10, f: .10},
    regiao: {a: .25, p: .30, e: .15, d: .10, f: .20}, tamanho: {a: .35, p: .25, e: .15, d: .15, f: .10}};
  const TIPO_ORD = ['S', '1', '2', '3'];
  const CP_RAIOS = [2, 3, 5, 8, 12];
  const CP_PRAZO_MIN = 6, CP_RAZAO = 1.43;
  const CP0 = () => ({tipo: 'parecidos', pid: null, n: null, motivo: 'parecido', modo: 'pv', raio: 3, inc: true, fora: new Set(), esc: [{pid: null, n: null}, {pid: null, n: null}], qs: null});
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const mesesTxt = n => n + (n === 1 ? ' mês' : ' meses');
  function mesesAte(ym){ const m = /^(\d{4})-(\d{2})/.exec(ym || ''); if(!m) return null; const h = new Date(); return Math.max(0, (+m[1] - h.getFullYear()) * 12 + (+m[2] - 1 - h.getMonth())); }
  const entregaMeses = p => p.fase === 'pronto' ? 0 : (p.entrega ? mesesAte(p.entrega) : null);
  function entregaVal(p){ if(p.fase === 'pronto') return 'Pronto para morar'; const m = entregaMeses(p); if(m == null) return 'A confirmar'; return mesAnoCurto(p.entrega) + (m === 0 ? ' (este mês)' : ' (em ' + mesesTxt(m) + ')'); }
  const faseCp = p => p.fase === 'breve' ? 'lanc' : (p.fase || null);
  const BRLmil = v => v >= 1e6 ? 'R$ ' + (Math.round(v / 1e4) / 100).toLocaleString('pt-BR') + ' mi' : v >= 1e3 ? 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil' : BRL(v);
  const pctAbs = x => Math.abs(x).toLocaleString('pt-BR', {maximumFractionDigits: 0}) + '%';
  const pc1 = x => x.toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';
  function cpPreco(u, modo){   // o valor pedido; se o projeto não tiver, o que ele tiver (com o rótulo certo)
    const tem = {pv: u.pv > 0, pp: u.p > 0};
    const k = tem[modo] ? modo : (tem.pv && tem.pp ? (u.pv <= u.p ? 'pv' : 'pp') : tem.pv ? 'pv' : tem.pp ? 'pp' : null);
    return k ? {v: k === 'pv' ? u.pv : u.p, k, lbl: k === 'pv' ? 'à vista' : 'parcelado'} : null;
  }
  function cpMetr(p, u, modo){ const pr = cpPreco(u, modo); return {p, u, n: u.n, ar: u.a, tk: u.k, pr, v: pr ? pr.v : null, pm2: pr && u.a > 0 ? pr.v / u.a : null, em: entregaMeses(p), fase: faseCp(p)}; }
  const cpLivres = pid => ((S.U && S.U.get(pid)) || []).filter(u => u.k !== 'L');
  function cpTipica(pid, modo){   // a do meio (pelo valor) da tipologia com mais unidades livres
    const us = cpLivres(pid).filter(u => cpPreco(u, modo)); if(!us.length) return null;
    const g = new Map(); us.forEach(u => { const k = u.k || '?'; if(!g.has(k)) g.set(k, []); g.get(k).push(u); });
    const maior = [...g.values()].sort((x, y) => y.length - x.length)[0];
    maior.sort((x, y) => cpPreco(x, modo).v - cpPreco(y, modo).v);
    return maior[Math.floor((maior.length - 1) / 2)];
  }
  function cpUnidade(pid, n, modo){   // a unidade pedida (livre, do índice; senão da tabela do projeto, se já aberta) ou a típica
    if(n != null && n !== ''){
      const u = cpLivres(pid).find(x => x.n === String(n)); if(u && cpPreco(u, modo)) return u;
      const ch = S.det.get(pid), det = ch && ch.v;
      const a = det && (det.dados.unidades || []).find(x => String(x[0]) === String(n));
      if(a){ const tl = tipologiaU(det, a) || ''; const pu = {n: String(a[0]), k: tipoKDe(tl), a: areaU(a), at: a[4] == null ? null : String(a[4]), p: precoU(a, 'pp'), pv: precoU(a, 'pv'), c: null, vg: null, f: 0, st: a[6]}; if(cpPreco(pu, modo)) return pu; }
    }
    return cpTipica(pid, modo);
  }
  function cpAlternativas(ref, motivo, raio, modo){
    const P = ref.p, bo = norm(P.bairro || ''), out = [], W = CP_PESOS[motivo] || CP_PESOS.parecido;
    const filtraTipo = TIPO_ORD.includes(ref.tk), ixT = TIPO_ORD.indexOf(ref.tk);
    for(const Q of S.P){
      if(Q.id === P.id || !Q.livres) continue;
      const mesmoBairro = !!bo && norm(Q.bairro || '') === bo;
      let d = P.lat != null && P.lng != null && Q.lat != null && Q.lng != null ? distKm(P, Q) : null;
      if(d == null){ if(!mesmoBairro) continue; d = 0; } else if(d > raio) continue;
      if(motivo === 'regiao' && mesmoBairro) continue;
      let melhor = null, nTipo = 0, nDisp = 0;
      for(const u of cpLivres(Q.id)){
        nDisp++;
        const m = cpMetr(Q, u, modo);
        if(filtraTipo && m.tk === ref.tk) nTipo++;
        if(!m.v || !(m.ar > 0)) continue;
        if(filtraTipo && m.tk !== ref.tk && !(motivo === 'tamanho' && TIPO_ORD.indexOf(m.tk) === ixT + 1)) continue;
        const rA = m.ar / ref.ar, rP = m.v / ref.v;
        if(motivo === 'tamanho'){ if(rA < 1.08 || rA > 1.7) continue; } else if(rA < .65 || rA > 1.35) continue;
        if(rP < .55 || rP > 1.4) continue;
        if(motivo === 'preco' && rP > .98) continue;
        if(motivo === 'entrega'){ if(m.em == null) continue; if(ref.em != null ? (ref.em === 0 ? m.em !== 0 : m.em >= ref.em) : m.em > 12) continue; }
        const sA = motivo === 'tamanho' ? clamp01(1 - Math.abs(rA - 1.2) / .25) : clamp01(1 - Math.abs(rA - 1) / .30);
        const sP = motivo === 'preco' ? clamp01((1 - rP) / .2) : clamp01(1 - Math.abs(rP - 1) / .25);
        const sE = ref.em == null || m.em == null ? .5 : motivo === 'entrega' ? clamp01((ref.em - m.em) / 12 + (ref.em === 0 ? 1 : 0)) : clamp01(1 - Math.abs(m.em - ref.em) / 18);
        const sD = clamp01(1 - d / Math.max(raio, 1.5));
        const sF = !ref.fase || !m.fase ? .5 : ref.fase === m.fase ? 1 : (ref.fase === 'pronto' || m.fase === 'pronto' ? .3 : .6);
        const s = W.a * sA + W.p * sP + W.e * sE + W.d * sD + W.f * sF, dv = Math.abs(rP - 1);
        if(!melhor || s > melhor.s + 1e-9 || (Math.abs(s - melhor.s) <= 1e-9 && dv < melhor.dv)) melhor = {m, s, dv};
      }
      if(melhor && melhor.s >= .35) out.push({m: melhor.m, s: melhor.s, d, nTipo, nDisp, q: Q});
    }
    out.sort((x, y) => y.s - x.s || x.d - y.d);
    return out;
  }
  function cpBuscar(cp){
    const P = S.byId.get(cp.pid); if(!P) return null;
    const u = cpUnidade(P.id, cp.n, cp.modo); if(!u) return {ref: null, alts: []};
    const ref = cpMetr(P, u, cp.modo);
    const base = cp.motivo === 'regiao' ? Math.max(cp.raio, 5) : cp.raio, seq = [base].concat([3, 5, 8, 12].filter(r => r > base));
    let alts = [], usado = base;
    for(const r of seq){ alts = cpAlternativas(ref, cp.motivo, r, cp.modo); usado = r; if(alts.length >= 3) break; }
    return {ref, alts: alts.slice(0, 4), raio: usado, base, ampliou: usado > base};
  }
  function cpEscolhidos(cp){
    const out = [];
    for(const e of cp.esc){ const P = e.pid && S.byId.get(e.pid); if(!P) continue; const u = cpUnidade(P.id, e.n, cp.modo); if(u) out.push(cpMetr(P, u, cp.modo)); }
    return out;
  }

  // ---------- diferenças para o original ----------
  function cpDeltas(m, ref){
    const o = {};
    if(m.v != null && ref.v){ const x = (m.v - ref.v) / ref.v * 100; o.v = Math.abs(x) < .5 ? {t: 'mesmo valor', c: ''} : {t: BRLmil(Math.abs(m.v - ref.v)) + (x < 0 ? ' a menos' : ' a mais') + ' (' + pctAbs(x) + ')', c: x < 0 ? 'bom' : 'ruim'}; }
    if(m.ar > 0 && ref.ar > 0){ const x = m.ar - ref.ar; o.a = Math.abs(x) < .3 ? {t: 'mesma metragem', c: ''} : {t: fmtM2(Math.round(Math.abs(x) * 10) / 10) + ' a ' + (x > 0 ? 'mais' : 'menos'), c: x > 0 ? 'bom' : 'ruim'}; }
    if(m.pm2 && ref.pm2){ const x = (m.pm2 - ref.pm2) / ref.pm2 * 100; o.m = Math.abs(x) < 1 ? {t: 'igual', c: ''} : {t: pctAbs(x) + (x < 0 ? ' menos' : ' mais') + ' por m²', c: x < 0 ? 'bom' : 'ruim'}; }
    if(m.em != null && ref.em != null){ const x = m.em - ref.em; o.e = x === 0 ? {t: ref.em === 0 ? 'também pronto' : 'mesmo prazo', c: ''} : {t: mesesTxt(Math.abs(x)) + (x < 0 ? ' antes' : ' depois'), c: x < 0 ? 'bom' : 'ruim'}; }
    return o;
  }
  function cpPorque(m, ref, d){
    const o = cpDeltas(m, ref), t = [];
    if(o.v && o.v.c) t.push(o.v.t.replace(/ \(.*\)$/, ''));
    if(o.a && o.a.c) t.push(o.a.t);
    if(o.e && o.e.c) t.push('entrega ' + o.e.t);
    if(!t.length) t.push('valor e metragem praticamente iguais');
    return maiusc1(t.slice(0, 3).join(', ')) + (d != null ? ', a ' + kmTxt(d) + ' do original' : '');
  }

  // ---------- fluxo resumido (só no parcelado) e prazo ----------
  const cpPer = t => t === 'semestral' ? 6 : t === 'anual' ? 12 : (t === 'mensal' || t === 'parc') ? 1 : 0;
  const ymNum = d => { const m = /^(\d{4})-(\d{2})/.exec(d || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
  function prazoDatas(T){   // meses de hoje até a última parcela antes do financiamento
    if(!T || !Array.isArray(T.cols)) return null;
    const h = new Date(), hoje = h.getFullYear() * 12 + h.getMonth();
    let fim = null, n = 0;
    for(const c of T.cols){ if(c.t === 'fin') continue; const per = cpPer(c.t), d = ymNum(c.d), k = c.n || 1; if(per) n += k; if(d != null){ const e = d + (k - 1) * per; if(fim == null || e > fim) fim = e; } }
    return fim != null ? Math.max(0, fim - hoje) : n;
  }
  function cpFluxo(det, a){
    const fx = fluxoDe(det, a); if(!fx) return null;
    const prazo = fx.T && fx.T.prazo != null ? +fx.T.prazo : prazoDatas(fx.T);
    if(!fx.linhas || !fx.linhas.length || !(fx.total > 0)) return {txt: null, prazo, aprox: true};
    const L = fx.linhas, tot = fx.total, soma = ls => ls.reduce((s, l) => s + l.v * l.n, 0);
    const ato = L.filter(l => l.t === 'ato' || l.t === 'sinal'), fin = L.filter(l => l.fin), resto = L.filter(l => !l.fin && l.t !== 'ato' && l.t !== 'sinal');
    const atoV = soma(ato), atoN = ato.reduce((s, l) => s + l.n, 0), parcN = resto.reduce((s, l) => s + l.n, 0), finV = soma(fin), t = [];
    if(atoV) t.push(pc1(atoV / tot * 100) + ' de entrada' + (atoN > 1 ? ' em ' + atoN + 'x' : ''));
    if(parcN) t.push(parcN + (parcN === 1 ? ' parcela' : ' parcelas'));
    t.push(finV ? pc1(finV / tot * 100) + ' no financiamento' : 'sem financiamento');
    return {txt: t.join(', '), prazo};
  }
  const cpComparavel = (x, y) => { if(x == null || y == null) return true; const a = Math.max(x, CP_PRAZO_MIN), b = Math.max(y, CP_PRAZO_MIN); return Math.max(a, b) / Math.min(a, b) <= CP_RAZAO; };

  // ---------- tela ----------
  function cpSlotProj(slot, pid, rot){
    const P = pid && S.byId.get(pid);
    return '<button type="button" class="cp-proj" data-acao="cp-escolher" data-slot="' + esc(slot) + '">' + (P ? miniProj(P, 'peq') + '<span><b>' + esc(P.nome) + '</b><small>' + esc([quemDe(P), P.bairro].filter(Boolean).join(', ')) + '</small></span>' : '<span class="cp-proj-vazio">' + ICO.lupa + esc(rot) + '</span>') + ICO.baixo + '</button>';
  }
  function cpOpcoesUn(pid, n, modo){
    const tip = cpTipica(pid, modo), pr = tip && cpPreco(tip, modo);
    const us = cpLivres(pid).filter(u => cpPreco(u, modo)).sort((x, y) => cpPreco(x, modo).v - cpPreco(y, modo).v).slice(0, 160);
    const fora = n != null && n !== '' && !us.some(u => u.n === String(n));
    return '<option value=""' + (n == null || n === '' ? ' selected' : '') + '>Unidade típica' + (tip ? ': ' + [tipoNome(tip.k), tip.a ? fmtM2(tip.a) : '', pr ? BRLc(pr.v) : ''].filter(Boolean).join(', ') : '') + '</option>' +
      (fora ? '<option value="' + esc(n) + '" selected>Unidade ' + esc(n) + '</option>' : '') +
      us.map(u => '<option value="' + esc(u.n) + '"' + (String(n) === u.n ? ' selected' : '') + '>' + esc([u.n, u.at != null ? andarCurto(u.at) : '', u.a ? fmtM2(u.a) : '', tipoNome(u.k), BRL(cpPreco(u, modo).v)].filter(Boolean).join(', ')) + '</option>').join('');
  }
  function cpLinha(rot, val, delta, extra){
    return '<div><dt>' + esc(rot) + '</dt><dd>' + esc(val) + (delta && delta.t ? '<small class="cp-d' + (delta.c ? ' ' + delta.c : '') + '">' + esc(delta.t) + '</small>' : extra ? '<small class="cp-d">' + esc(extra) + '</small>' : '') + '</dd></div>';
  }
  function cpCardHtml(m, ref, rotulo, x, cp, k){
    const P = m.p, o = ref && m !== ref ? cpDeltas(m, ref) : {}, pv = cpPreco(m.u, 'pv'), pp = cpPreco(m.u, 'pp');
    const temPv = pv && pv.k === 'pv', temPp = pp && pp.k === 'pp';
    const kUsado = m.pr ? m.pr.k : cp.modo, kRef = ref && ref.pr ? ref.pr.k : cp.modo;   // sem a tabela pedida, a diferença vai na linha do valor que entrou na conta
    const dV = o.v ? (kUsado !== kRef ? {t: o.v.t + ', pelo ' + (kUsado === 'pp' ? 'parcelado' : 'à vista'), c: o.v.c} : o.v) : null;
    const fora = cp.fora.has(P.id), orig = !x && cp.tipo === 'parecidos';
    const incluido = orig ? cp.inc : !fora;
    const dl = cpLinha('Unidade', m.n + (m.u.at != null ? ', ' + andarTxt(m.u.at) : '')) +
      cpLinha('Metragem', [m.ar ? fmtM2(m.ar) : '', tipoNome(m.tk)].filter(Boolean).join(', ') || 'sem metragem', o.a) +
      cpLinha('À vista', temPv ? BRL(pv.v) : 'sem tabela à vista', kUsado === 'pv' ? dV : null) +
      cpLinha('Parcelado', temPp ? BRL(pp.v) : 'sem tabela parcelada', kUsado === 'pp' ? dV : null, temPv && temPp && pp.v > pv.v ? 'à vista fica ' + pctAbs((1 - pv.v / pp.v) * 100) + ' abaixo' : '') +
      cpLinha('Por m²', m.pm2 ? BRL(m.pm2) : 'sem valor', o.m, m.pm2 && m.pr ? 'no ' + m.pr.lbl : '') +
      cpLinha('Entrega', entregaVal(P), o.e) +
      cpLinha('Construtora', quemDe(P) || 'não informada') +
      (x ? cpLinha('Disponíveis', (x.nTipo && tipoNome(m.tk) ? x.nTipo + ' de ' + tipoNome(m.tk).toLowerCase() + ', ' : '') + plural(x.nDisp, 'livre no projeto', 'livres no projeto')) : cpLinha('Disponíveis', plural(P.livres, 'livre no projeto', 'livres no projeto'))) +
      (cp.modo === 'pp' ? '<div class="cp-fx" data-cpk="' + k + '"><dt>Fluxo</dt><dd><span class="brilho" style="display:block;height:18px;border-radius:6px"></span></dd></div>' : '');
    return '<article class="cp-card' + (orig || (cp.tipo === 'escolha' && k === 0) ? ' orig' : '') + (incluido ? '' : ' fora') + '">' +
      '<div class="cp-foto">' + capaProj(P, {w: 560, sizes: '(min-width:1024px) 22vw, 80vw'}) + '<span class="cp-selo">' + esc(rotulo) + '</span></div>' +
      '<div class="cp-corpo"><h3 class="t-3"><a href="#/p/' + esc(P.id) + '">' + esc(P.nome) + '</a></h3><p class="sub">' + esc([P.bairro, x && x.d != null ? 'a ' + kmTxt(x.d) + ' do original' : ''].filter(Boolean).join(', ')) + '</p>' +
      '<dl class="cp-fatos">' + dl + '</dl>' +
      '<div class="cp-pl" data-cpk="' + k + '"><span class="brilho"></span></div>' +
      (x && ref ? '<p class="cp-porque">' + esc(cpPorque(m, ref, x.d)) + '</p>' : '') +
      '<div class="cp-acoes"><button type="button" class="pilula peq" data-acao="cp-incluir" data-id="' + esc(P.id) + '" data-orig="' + (orig ? 1 : 0) + '" aria-pressed="' + incluido + '">' + (incluido ? ICO.ok : '') + 'No envio</button>' +
      '<a class="pilula peq" href="#/tabelas/' + esc(P.id) + '" data-acao="cp-espelho" data-id="' + esc(P.id) + '" data-n="' + esc(m.n) + '">' + ICO.predio + 'Espelho</a><a class="pilula peq" href="#/p/' + esc(P.id) + '">Ficha</a></div></div></article>';
  }
  function telaComparar(qs){
    if(!S.cp) S.cp = CP0();
    const cp = S.cp;
    if(qs && qs !== cp.qs){
      const q = new URLSearchParams(qs), pid = q.get('p');
      if(pid && S.byId.has(pid)){ cp.tipo = 'parecidos'; cp.pid = pid; cp.n = q.get('n') || null; cp.fora = new Set(); cp.inc = true; }
      cp.qs = qs;
    }
    const cab = '<header class="pg-cab"><div><h1 class="t-1">Comparar</h1><p class="texto-2 ler">' + (cp.tipo === 'parecidos' ? 'O cliente não gostou de um projeto? Escolha o projeto e o motivo: o app separa até 4 opções parecidas por perto e mostra lado a lado, com valores, metragem, entrega e planta.' : 'Escolha de 2 a 5 projetos e a unidade de cada um para ver lado a lado.') + '</p></div>' +
      '<div class="seg seg-cp" role="group" aria-label="Como comparar"><button type="button" data-acao="cp-tipo" data-v="parecidos" aria-pressed="' + (cp.tipo === 'parecidos') + '">Opções parecidas</button><button type="button" data-acao="cp-tipo" data-v="escolha" aria-pressed="' + (cp.tipo === 'escolha') + '">Escolher</button></div></header>';
    if(!S.U){
      pos.push(async () => { await carregarUnidades(); if(/^#\/comparar/.test(location.hash)) render(); });
      return cab + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:120px"></div><div class="brilho" style="height:320px"></div><p class="sub">' + (S.Uerro ? 'Não consegui abrir as unidades agora.' : 'Carregando as unidades livres…') + '</p></div>';
    }
    if(cp.n && cp.pid && !S.det.get(cp.pid) && !cpLivres(cp.pid).some(u => u.n === String(cp.n))) pos.push(async () => { try{ await detalhe(cp.pid); if(/^#\/comparar/.test(location.hash)) render(); }catch(e){} });
    const modoSeg = '<div class="seg" role="group" aria-label="Valor a comparar">' + [['pv', 'À vista'], ['pp', 'Parcelado']].map(x => '<button type="button" data-acao="cp-modo" data-v="' + x[0] + '" aria-pressed="' + (cp.modo === x[0]) + '">' + x[1] + '</button>').join('') + '</div>';
    let ctl = '', itens = [], ref = null, aviso = '';
    if(cp.tipo === 'parecidos'){
      ctl = '<div class="cp-ctl"><div class="cp-campo cp-c-proj"><span class="rotulo">Projeto que o cliente viu</span>' + cpSlotProj('ref', cp.pid, 'Escolher o projeto') + '</div>' +
        (cp.pid ? '<label class="cp-campo cp-c-un"><span class="rotulo">Unidade de referência</span><select class="sel" data-input="cp-un">' + cpOpcoesUn(cp.pid, cp.n, cp.modo) + '</select></label>' : '') +
        '<div class="cp-campo cp-c-mot"><span class="rotulo">Por que ele não gostou?</span><div class="pilulas" role="group" aria-label="Motivo">' + CP_MOT.map(x => '<button type="button" class="pilula peq" data-acao="cp-motivo" data-v="' + x[0] + '" aria-pressed="' + (cp.motivo === x[0]) + '">' + x[1] + '</button>').join('') + '</div></div>' +
        '<div class="cp-campo"><span class="rotulo">Valor</span>' + modoSeg + '</div>' +
        '<label class="cp-campo"><span class="rotulo">Distância</span><select class="sel" data-input="cp-raio">' + CP_RAIOS.map(r => '<option value="' + r + '"' + (cp.raio === r ? ' selected' : '') + '>até ' + r + ' km</option>').join('') + '</select></label></div>';
      if(cp.pid){
        const r = cpBuscar(cp);
        if(!r || !r.ref) aviso = '<p class="aviso fino">Esse projeto não tem unidade livre com preço para servir de referência. Escolha outro projeto ou uma unidade.</p>';
        else{
          ref = r.ref;
          aviso = '<p class="cp-ref">Referência: <b>' + esc(ref.p.nome) + '</b>, unidade ' + esc(ref.n) + ', ' + esc([ref.ar ? fmtM2(ref.ar) : '', tipoNome(ref.tk), ref.pr ? BRL(ref.v) + ' ' + ref.pr.lbl : ''].filter(Boolean).join(', ')) + '.</p>' +
            (r.ampliou ? '<p class="aviso fino">Não achei opções suficientes até ' + r.base + ' km do projeto: ampliei a busca para ' + r.raio + ' km.</p>' : '') +
            (!r.alts.length ? '<p class="aviso fino">Nenhum projeto parecido até ' + r.raio + ' km. Tente outro motivo, o outro valor ou escolha os projetos.</p>' : '');
          itens = [{m: ref, x: null, rot: 'O cliente viu'}].concat(r.alts.map((x, i) => ({m: x.m, x, rot: 'Opção ' + (i + 1)})));
        }
      }
    }else{
      ctl = '<div class="cp-ctl cp-esc">' + cp.esc.map((e, i) => '<div class="cp-slot"><div class="cp-slot-cab"><span class="rotulo">' + (i === 0 ? 'Base da comparação' : 'Projeto ' + (i + 1)) + '</span>' +
        (cp.esc.length > 2 ? '<button type="button" class="link-mais" data-acao="cp-tirar" data-i="' + i + '" aria-label="Tirar o projeto ' + (i + 1) + '">Tirar</button>' : '') + '</div>' + cpSlotProj(String(i), e.pid, 'Escolher o projeto') +
        (e.pid ? '<select class="sel" data-input="cp-esc-un" data-i="' + i + '" aria-label="Unidade do projeto ' + (i + 1) + '">' + cpOpcoesUn(e.pid, e.n, cp.modo) + '</select>' : '') + '</div>').join('') +
        (cp.esc.length < 5 ? '<button type="button" class="btn btn-peq cp-mais" data-acao="cp-add">Mais um projeto</button>' : '') +
        '<div class="cp-campo"><span class="rotulo">Valor</span>' + modoSeg + '</div></div>';
      const ms = cpEscolhidos(cp);
      if(ms.length){ ref = ms[0]; itens = ms.map((m, i) => ({m, x: i ? {d: ref.p.lat != null && m.p.lat != null ? distKm(ref.p, m.p) : null, nTipo: 0, nDisp: m.p.livres} : null, rot: i ? 'Projeto ' + (i + 1) : 'Base'})); }
      if(ms.length < 2) aviso = '<p class="aviso fino">Escolha pelo menos dois projetos.</p>';
    }
    S.cpItens = itens;
    if(itens.length) pos.push(() => cpCarregarExtras(itens, ref));
    const cards = itens.length ? '<div class="cp-cards" style="--n:' + itens.length + '">' + itens.map((it, k) => cpCardHtml(it.m, ref, it.rot, it.x, cp, k)).join('') + '</div>' : '';
    const noEnvio = cpItensEnvio(cp);
    const barra = itens.length > 1 && noEnvio.length ? '<div class="barra-envio"><p><span><b class="num">' + noEnvio.length + '</b> ' + (noEnvio.length === 1 ? 'projeto' : 'projetos') + '</span><small>no envio, lado a lado</small></p><button type="button" class="btn btn-pri" data-acao="cp-mandar">' + ICO.enviar + '<span>Mandar<span class="so-largo"> pro cliente</span></span></button></div>' : '';
    return cab + ctl + aviso + cards + barra;
  }
  function cpItensEnvio(cp){
    const its = S.cpItens || [];
    return its.filter((it, k) => { const orig = !it.x && cp.tipo === 'parecidos'; return orig ? cp.inc : !cp.fora.has(it.m.p.id); }).map(it => ({p: it.m.p.id, n: it.m.n, nome: it.m.p.nome}));
  }
  async function cpCarregarExtras(itens, ref){   // planta da unidade e fluxo (no parcelado), projeto por projeto
    const cp = S.cp, alvo = '#/comparar' + (cp.qs ? '?' + cp.qs : '');
    let prazoRef;
    for(let k = 0; k < itens.length; k++){
      const it = itens[k], P = it.m.p;
      let det = null, c = null;
      try{ det = await detalhe(P.id); }catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); }
      c = await fichaCentral(P.id).catch(() => null);
      if(!/^#\/comparar/.test(location.hash) || S.cpItens !== itens) return;
      const a = det && (det.dados.unidades || []).find(x => String(x[0]) === String(it.m.n));
      const box = $('.cp-pl[data-cpk="' + k + '"]');
      if(box){
        const pl = det && a ? plantaDaUnidade(det, c, a) : null;
        if(pl){ it.pl = pl; box.innerHTML = '<figure class="planta"><button type="button" class="mos-item" data-acao="luz-cp" data-k="' + k + '" aria-label="' + esc('Ampliar a ' + pl.t) + '">' + imgTag(pl.src, pl.t, '', {w: 640, semSet: true}) + '</button><figcaption>' + esc(pl.t) + (pl.exata ? '' : '<small>Planta da tipologia</small>') + '</figcaption></figure>'; }
        else box.innerHTML = '<p class="nota">Planta não cadastrada.</p>';
      }
      const fb = $('.cp-fx[data-cpk="' + k + '"] dd');
      if(fb){
        const fx = det && a ? cpFluxo(det, a) : null;
        if(k === 0) prazoRef = fx ? fx.prazo : null;
        const pz = fx && fx.prazo != null && fx.prazo >= 1 ? 'parcelas até ' + mesesTxt(fx.prazo) : '';
        const dif = k > 0 && fx && !cpComparavel(prazoRef, fx.prazo);
        fb.innerHTML = fx && fx.txt ? esc(fx.txt) + (pz ? '<small class="cp-d">' + esc(pz) + '</small>' : '') + (dif ? '<small class="cp-d ruim">prazo de pagamento bem diferente do original</small>' : '') : 'Consulte a tabela' + (pz ? '<small class="cp-d">' + esc(pz) + '</small>' : '');
      }
      if(location.hash !== alvo && !/^#\/comparar$/.test(location.hash)) return;
    }
  }
  function abrirEscolhaProjeto(slot){
    S.cpSlot = slot;
    abrirFolha('cp-proj', 'Escolher o projeto', '<label class="busca mini"><span class="sr">Buscar projeto</span>' + ICO.lupa + '<input type="search" id="cp-pq" autocomplete="off" placeholder="Nome, construtora ou bairro" data-input="cp-pq"></label><ul class="lista-proj cp-lista" id="cp-lista">' + cpListaProjHtml('') + '</ul>', '', 'folha-alta');
    setTimeout(() => { const i = $('#cp-pq'); if(i && !ehToque()) i.focus(); }, 80);
  }
  function cpListaProjHtml(q){
    const termos = norm(q).split(/\s+/).filter(Boolean);
    const ps = S.P.filter(p => p.livres > 0 && (!termos.length || termos.every(t => norm([p.nome, p.curto, p.bairro, quemDe(p)].join(' ')).includes(t))))
      .sort((a, b) => (b.v7 - a.v7) || String(a.nome).localeCompare(String(b.nome), 'pt-BR')).slice(0, 80);
    return ps.map(p => '<li><button type="button" class="cp-op" data-acao="cp-pick" data-id="' + esc(p.id) + '">' + miniProj(p) + '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span>' + esc(plural(p.livres, 'livre', 'livres')) + '</span></span></button></li>').join('') || '<li class="lista-mais">Nenhum projeto com unidade livre com esse nome.</li>';
  }
  function abrirEnvioCmp(){
    const cp = S.cp, its = cpItensEnvio(cp); if(its.length < 1) return;
    const refIt = (S.cpItens || [])[0];
    const motivo = cp.tipo === 'parecidos' ? cp.motivo : null;
    const u = {}; its.forEach(x => { if(!(x.p in u)) u[x.p] = x.n; });
    const o = cp.tipo === 'parecidos' && cp.inc && refIt ? refIt.m.p.id : (cp.tipo === 'escolha' && its[0] ? its[0].p : null);
    const texto = ('Comparativo: ' + (motivo && refIt ? (CP_INTRO[motivo] || CP_INTRO.parecido).replace('%s', refIt.m.p.nome) : its.map(x => x.nome).join(' x '))).slice(0, 200);
    S.envio = {multi: true, modo: cp.modo, itens: its.map(x => ({p: x.p, n: x.n})), texto, cmp: {o, u, m: motivo || 'escolha'}};
    const lista = its.map(x => { const P = S.byId.get(x.p), it = (S.cpItens || []).find(i => i.m.p.id === x.p && i.m.n === x.n), pr = it && it.m.pr; return '<p class="env-u">' + (P ? miniProj(P, 'peq') : '') + '<span><b>' + esc(x.nome) + '</b><small>' + esc('unidade ' + x.n + (it && it.m.ar ? ', ' + fmtM2(it.m.ar) : '')) + '</small></span><span class="num ouro">' + (pr ? esc(BRLc(pr.v)) : '') + '</span></p>'; }).join('');
    abrirFolha('envio', 'Mandar pro cliente',
      '<p class="texto-2">O cliente recebe uma página com os ' + its.length + ' projetos lado a lado (valores, metragem e entrega) e as fichas de cada um.</p>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      '<fieldset><legend>No comparativo</legend><div class="env-lista">' + lista + '</div></fieldset>' + camposAssinatura() + '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>');
    setTimeout(() => { const i = $('#env-cli'); if(i && !ehToque()) i.focus(); }, 80);
  }

  // ================= FLUXO PERSONALIZADO DA UNIDADE (o mesmo editor e o mesmo lugar dos Espelhos) =================
  // Guardado neste aparelho em 'nex-fluxos', por projeto|unidade: {linhas: [{q, nome, valor, quando}], em, auto, alvo}.
  // É a mesma chave da central dos Espelhos (mesmo site): o fluxo montado num app aparece no outro.
  const K_PERS = 'nex-fluxos', MAX_LINHAS = 8;
  ICO.lapis = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>');
  const quandoMontado = ms => { const t = quandoTxt(ms); return /^\d\d:\d\d$/.test(t) ? 'hoje às ' + t : /^ontem /.test(t) ? t.replace('ontem ', 'ontem às ') : t.replace(/^(\S+) /, 'em $1 às '); };
  function persTodos(){ try{ const o = JSON.parse(LS.get(K_PERS) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; }catch(e){ return {}; } }
  const persKey = (pid, n) => pid + '|' + n;
  function persDe(pid, n){ const pz = persTodos()[persKey(pid, String(n))]; return pz && Array.isArray(pz.linhas) && pz.linhas.length ? pz : null; }
  function persGravar(pid, n, pz){
    const o = persTodos(), k = persKey(pid, String(n));
    if(pz) o[k] = pz; else delete o[k];
    Object.keys(o).sort((x, y) => String((o[y] || {}).em || '').localeCompare(String((o[x] || {}).em || ''))).slice(80).forEach(z => { delete o[z]; });
    return LS.set(K_PERS, JSON.stringify(o));
  }
  const persDoProjeto = pid => Object.keys(persTodos()).filter(k => k.startsWith(pid + '|')).map(k => k.slice(pid.length + 1));

  // ---------- números ----------
  const temCent = v => Math.abs(v - Math.round(v)) >= 0.005;
  const BRL2 = v => 'R$ ' + (+v).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const fmtV = v => temCent(v) ? BRL2(v) : BRL(v);
  const numTxt = v => v == null || !isFinite(v) ? '' : (+v).toLocaleString('pt-BR', {minimumFractionDigits: temCent(v) ? 2 : 0, maximumFractionDigits: 2});
  function numBR(s){   // "12.019,42", "R$ 300.483", "1502.41" e "12 mil" viram número
    let t = String(s == null ? '' : s).toLowerCase().replace(/r\$|\s/g, '');
    if(!t) return null;
    const mil = /mil$|k$/.test(t); t = t.replace(/mil$|k$/, '');
    if(/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else if(!/^\d+\.\d{1,2}$/.test(t)) t = t.replace(/[.,]/g, '');
    let n = parseFloat(t); if(!isFinite(n)) return null;
    if(mil) n *= 1000;
    return Math.round(n * 100) / 100;
  }
  const tituloLinha = l => ((+l.q || 1) > 1 ? (+l.q) + ' ' : '') + String(l.nome || '').trim();
  const linhasDe = ls => ls.map(l => ({t: tituloLinha(l).slice(0, 60), v: fmtV(+l.valor || 0), s: String(l.quando || '').trim().slice(0, 80)}));
  const totalDe = ls => Math.round(ls.reduce((s, l) => s + (+l.q || 1) * (+l.valor || 0), 0) * 100) / 100;
  const ehFin = l => /financ|repasse/i.test(String(l.nome || ''));
  // linha que "fecha a conta": o financiamento (ou chaves, saldo); sem ele, a última parcela única
  function linhaFechamento(ls){
    for(let i = ls.length - 1; i >= 0; i--) if(/financ|chaves|saldo|repasse/i.test(ls[i].nome)) return i;
    for(let i = ls.length - 1; i >= 0; i--) if((+ls[i].q || 1) === 1) return i;
    return ls.length - 1;
  }
  function fecharConta(ls, alvo){   // muda só a linha de fechamento; resto <= 0: as outras parcelas já passam do alvo
    const i = linhaFechamento(ls), l = ls[i], q = +l.q || 1;
    const resto = Math.round((alvo - (totalDe(ls) - q * (+l.valor || 0))) * 100) / 100;
    l.valor = resto > 0 ? Math.round(resto / q * 100) / 100 : 0;
    return {i, resto, alvo};
  }
  // as outras parcelas chegaram (ou passaram) no total: a linha de fechamento ficou sem valor
  function passaTxt(fc, ls){
    const outras = Math.round((fc.alvo - fc.resto) * 100) / 100, lf = ls[fc.i] || {};
    return fc.resto < 0 ? 'As outras parcelas somam ' + fmtV(outras) + ', mais que o total de ' + fmtV(fc.alvo) + '. Diminua alguma delas.'
      : 'As outras parcelas já somam ' + fmtV(fc.alvo) + ' e não sobra valor para “' + tituloLinha(lf) + '”. Diminua alguma delas.';
  }
  function infoFin(ls, total){
    let i = -1; for(let j = ls.length - 1; j >= 0; j--) if(ehFin(ls[j])){ i = j; break; }
    if(i < 0 || !(total > 0)) return null;
    const v = Math.round((+ls[i].q || 1) * (+ls[i].valor || 0) * 100) / 100;
    return {v, pct: Math.round(v / total * 1000) / 10};
  }
  const proxMes = () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 1); return MES3[d.getMonth()] + '/' + d.getFullYear(); };
  const NOME_FLUXO = {ato: 'Ato', sinal: 'Sinal', parc: 'parcelas', mensal: 'mensais', semestral: 'semestrais', anual: 'anuais', inter: 'intermediárias', unica: 'Parcela única', chaves: 'Chaves', fin: 'Financiamento bancário'};
  // o fluxo da tabela da unidade em linhas editáveis; sem fluxo, uma linha com o preço
  function linhasDaTabela(det, a){
    const fx = fluxoDe(det, a);
    if(fx && fx.linhas && fx.linhas.length){
      const ls = fx.linhas.map(l => {
        const q = l.n || 1, base = l.rot ? String(l.rot) : (NOME_FLUXO[l.t] || 'Parcela');
        return {q, nome: q > 1 ? base.charAt(0).toLowerCase() + base.slice(1) : base, valor: Math.round(l.v * 100) / 100,
          quando: l.d ? (q > 1 ? 'a partir de ' : 'em ') + mesAnoCurto(l.d) : (l.fin ? 'na entrega das chaves' : '')};
      });
      return {ls, total: totalDe(ls), fluxo: true};
    }
    const v = precoU(a, chaveBase(det)) || precoU(a, 'pv') || 0;
    return {ls: [{q: 1, nome: 'À vista', valor: v, quando: 'no fechamento'}], total: v, fluxo: false};
  }

  // ---------- o que vai para o cliente (mesmo formato do link da central dos Espelhos) ----------
  const NOTA_VALOR = 'Valor na data do envio, sujeito a alteração e à disponibilidade da unidade.';
  const corta = (s, n) => { s = String(s || '').trim(); if(s.length <= n) return s; const c = s.slice(0, n); const p = c.lastIndexOf('. '); return (p > 80 ? c.slice(0, p + 1) : c.slice(0, n - 1) + '…').trim(); };
  function valoresPers(pz){
    const dia = new Date().toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
    return {base: 'personalizado', rotulo: 'Condição personalizada', total: totalDe(pz.linhas), linhas: linhasDe(pz.linhas).slice(0, MAX_LINHAS),
      nota: 'Condição personalizada preparada em ' + dia + ', sujeita à aprovação da construtora e à disponibilidade da unidade.'};
  }
  function valoresTabela(det, a, modo){
    const tab = det.dados.tabela || {}, corr = (det.info && det.info.fluxo && det.info.fluxo.correcao) || tab.correcao || '';
    const nota = corta([tab.regra_curta, corr].filter(Boolean).join(' ') || NOTA_VALOR, 400), rot = tab.nome ? nomeTabela(tab.nome) : '';
    const tb = linhasDaTabela(det, a);
    if(tb.fluxo && (!modo || modo === chaveBase(det))) return {base: 'tabela', rotulo: rot || 'Tabela de vendas', total: Math.round(tb.total), linhas: linhasDe(tb.ls).slice(0, MAX_LINHAS), nota};
    const pc = precosCampos(det), k = modo && precoU(a, modo) ? modo : chaveBase(det), v = precoU(a, k);
    if(!v) return null;
    const lab = (pc.find(x => x.k === k) || {}).label || 'Valor';
    return {base: k, rotulo: rot, total: v, linhas: [{t: lab, v: BRL(v), s: ''}], nota};
  }
  // fluxo que fecha sozinho e sem total negociado acompanha o valor atual da tabela (ex.: tabela nova do mês), como na central
  function persAtual(det, a, pz){
    if(!pz || !pz.auto || pz.alvo) return pz;
    const tb = linhasDaTabela(det, a); if(!(tb.total > 0)) return pz;
    const ls = pz.linhas.map(l => Object.assign({}, l));
    return fecharConta(ls, tb.total).resto > 0 ? Object.assign({}, pz, {linhas: ls}) : pz;
  }
  // a condição montada numa unidade aplicada a outra: mesma entrada e parcelas, o financiamento fecha no valor dela
  function persDerivado(det, a, pz){
    const tb = linhasDaTabela(det, a); if(!(tb.total > 0)) return null;
    const ls = pz.linhas.map(l => Object.assign({}, l)), r = fecharConta(ls, tb.total);
    return r.resto > 0 ? {linhas: ls, em: pz.em} : null;
  }
  // valores de cada unidade do envio: o fluxo dela, o derivado da primeira personalizada ou a tabela
  function valoresDoEnvio(det, pid, ns, formato, modo){
    const porN = new Map((det.dados.unidades || []).map(a => [String(a[0]), a]));
    const fonte = formato === 'pers' ? ns.map(n => persDe(pid, n)).find(Boolean) : null, pelaTabela = [];
    const out = ns.map(n => {
      const a = porN.get(String(n)); if(!a) return {n};
      if(formato === 'pers'){
        const pz = persAtual(det, a, persDe(pid, n)) || (fonte ? persDerivado(det, a, fonte) : null);
        if(pz) return {n, valores: valoresPers(pz)};
        pelaTabela.push(n);
      }
      return {n, valores: valoresTabela(det, a, modo)};
    });
    return {itens: out, pelaTabela};
  }

  // ---------- na folha da unidade ----------
  function persResumoHtml(p, det, a){
    if(a[6] !== 'disponivel') return '';
    const n = String(a[0]), pz = persAtual(det, a, persDe(p.id, n));
    if(!pz) return '<div class="pers-cta"><p><b>Fluxo personalizado</b><span>Monte a condição do cliente (ato, mensais, financiamento). Ela vai junto quando você tocar em Mandar.</span></p>' +
      '<button type="button" class="btn btn-peq" data-fe="abrir">' + ICO.lapis + 'Montar fluxo</button></div>';
    const tot = totalDe(pz.linhas), tb = linhasDaTabela(det, a), d = tb.total > 0 ? Math.round((tot - tb.total) * 100) / 100 : 0;
    const dif = tb.total > 0 && Math.abs(d) >= 1 ? fmtV(Math.abs(d)) + (d < 0 ? ' abaixo' : ' acima') + ' da tabela (' + (d < 0 ? '−' : '+') + pctTxt(Math.round(Math.abs(d) / tb.total * 1000) / 10) + ')' : tb.total > 0 ? 'No valor da tabela' : '';
    const inf = infoFin(pz.linhas, tot);
    return '<section class="pers-box" aria-labelledby="pers-t"><div class="pers-cab"><h3 id="pers-t">Fluxo personalizado</h3><span class="pers-acoes">' +
      '<button type="button" class="link-mais" data-fe="copiar">' + ICO.copiar + 'Copiar</button><button type="button" class="link-mais" data-fe="abrir">' + ICO.lapis + 'Editar</button></span></div>' +
      '<div class="pers-ls">' + linhasDe(pz.linhas).map(l => '<div class="ln"><span>' + esc(l.t) + (l.s ? '<small>' + esc(l.s) + '</small>' : '') + '</span><b class="num">' + esc(l.v) + '</b></div>').join('') +
      '<div class="ln tot"><span>Valor total' + (dif ? '<small' + (d > 0 ? ' class="acima"' : '') + '>' + esc(dif) + '</small>' : '') + '</span><b class="num">' + esc(fmtV(tot)) + '</b></div></div>' +
      (inf ? '<p class="nota">Financiamento de ' + esc(fmtV(inf.v)) + ', ' + esc(pctTxt(inf.pct)) + ' do valor.</p>' : '') +
      '<div class="pers-info"><span>Montado ' + esc(quandoMontado(Date.parse(pz.em) || Date.now())) + ' neste aparelho. É este fluxo que vai no Mandar.</span><button type="button" class="link-mais" data-fe="descartar">Descartar</button></div></section>';
  }
  const MODELOS = [
    {rot: 'Ato', q: 1, nome: 'Ato', quando: 'no fechamento'},
    {rot: 'Mensais', q: 12, nome: 'mensais', quando: () => 'a partir de ' + proxMes()},
    {rot: 'Anuais', q: 2, nome: 'anuais', quando: ''},
    {rot: 'Parcela única', q: 1, nome: 'Parcela única', quando: ''},
    {rot: 'Financiamento', q: 1, nome: 'Financiamento bancário', quando: 'na entrega das chaves'},
    {rot: 'Outra', q: 1, nome: 'Parcela', quando: ''}
  ];
  function feRecalc(){
    const e = S.fe; if(!e || !e.auto || !e.linhas.length) return null;
    const alvo = numBR(e.alvo) || e.ref; if(!(alvo > 0)) return null;
    return fecharConta(e.linhas, alvo);
  }
  function feEditorHtml(){
    const e = S.fe, fc = feRecalc(), ls = e.linhas, cheio = ls.length >= MAX_LINHAS;
    e.fechaIdx = fc ? fc.i : -1;
    const lf = ls[linhaFechamento(ls)] || {}, onde = ehFin(lf) ? 'no financiamento' : 'em “' + tituloLinha(lf) + '”';
    return '<section class="pers-box editor" aria-labelledby="fe-t"><div class="pers-cab"><h3 id="fe-t">Montar fluxo personalizado</h3><span class="pers-acoes"><button type="button" class="link-mais" data-fe="restaurar">Voltar ao da tabela</button></span></div>' +
      '<p class="fe-dica">' + esc(fc ? 'Digite o que o cliente paga (ato, mensais, anuais). A linha destacada fecha a conta sozinha' + (e.ref ? ', no valor da tabela ou no total negociado.' : ', no total negociado.')
        : 'Mude a quantidade, o valor e a data de cada parcela, inclua ou tire linhas. O total soma sozinho e o cliente recebe exatamente este fluxo.') + '</p>' +
      '<div class="fe">' + ls.map((l, i) => {
        const fecha = fc && i === fc.i;
        return '<div class="fe-ln' + (fecha ? ' fecha' : '') + '" data-i="' + i + '">' +
          '<label class="fe-q"><span>Qtd.</span><input type="number" inputmode="numeric" min="1" max="480" step="1" value="' + (+l.q || 1) + '" data-fe-in="q"></label>' +
          '<label class="fe-n"><span>Parcela</span><input maxlength="40" autocomplete="off" value="' + esc(l.nome) + '" data-fe-in="nome"></label>' +
          '<button type="button" class="fe-x" data-fe="tirar" data-i="' + i + '" aria-label="Tirar a linha ' + esc(tituloLinha(l)) + '"' + (ls.length < 2 ? ' disabled' : '') + '>' + ICO.x + '</button>' +
          '<div class="fe-vs"><label class="fe-v"><span>' + (fecha ? 'Fecha a conta' : 'Valor de cada') + '</span><input inputmode="decimal" autocomplete="off" value="' + esc(numTxt(+l.valor || 0)) + '" data-fe-in="valor"' + (fecha ? ' readonly tabindex="-1" aria-label="Valor calculado para fechar a conta"' : '') + '></label>' +
          '<label class="fe-s"><span>Quando</span><input maxlength="60" autocomplete="off" value="' + esc(l.quando || '') + '" placeholder="ex.: a partir de ' + esc(proxMes()) + '" data-fe-in="quando"></label></div>' +
          '<small class="fe-sub"></small></div>';
      }).join('') + '</div>' +
      '<div class="fe-add"><span>' + (cheio ? 'Máximo de ' + MAX_LINHAS + ' linhas' : 'Incluir') + '</span>' + MODELOS.map((m, i) => '<button type="button" class="pilula peq" data-fe="add" data-i="' + i + '"' + (cheio ? ' disabled' : '') + '>+ ' + esc(m.rot) + '</button>').join('') + '</div>' +
      '<label class="fe-auto"><input type="checkbox" data-fe-in="auto"' + (e.auto ? ' checked' : '') + '><span>Fechar a conta sozinho ' + esc(onde) + '</span></label>' +
      '<div class="fe-tot"><span>Total do fluxo</span><b class="num" id="fe-total">—</b><small id="fe-dif"></small><small id="fe-fin"></small></div>' +
      '<div class="fe-neg"><label class="campo"><span>' + (e.auto ? 'Total negociado (opcional)' : 'Fechar o total em') + '</span><input inputmode="decimal" autocomplete="off" value="' + esc(e.alvo || '') + '" placeholder="' + esc(e.auto && e.ref ? 'em branco: o valor da tabela' : 'ex.: 295.000') + '" data-fe-in="alvo"></label>' +
      (e.auto ? '' : '<button type="button" class="btn btn-peq" data-fe="ajustar">Ajustar ' + esc(onde) + '</button>') + '</div>' +
      '<p class="erro-txt" id="fe-erro" role="alert">' + esc(e.erro || '') + '</p>' +
      '<div class="fe-bts"><button type="button" class="btn" data-fe="cancelar">Cancelar</button><button type="button" class="btn btn-pri" data-fe="salvar">' + ICO.ok + 'Salvar fluxo</button></div></section>';
  }
  function feTotais(){
    const e = S.fe, box = $('#fe-box'); if(!e || !box) return;
    const fc = feRecalc(), tot = totalDe(e.linhas);
    const el = $('#fe-total', box); if(el) el.textContent = fmtV(tot);
    if(fc){ const inp = $('.fe-ln[data-i="' + fc.i + '"] [data-fe-in="valor"]', box); if(inp && document.activeElement !== inp) inp.value = numTxt(+e.linhas[fc.i].valor || 0); }
    const dif = $('#fe-dif', box), neg = fc && numBR(e.alvo);
    if(dif){
      if(e.ref){
        const d = Math.round((tot - e.ref) * 100) / 100, pc = pctTxt(Math.round(Math.abs(d) / e.ref * 1000) / 10);
        dif.textContent = Math.abs(d) < 1 ? (fc ? 'Fecha no valor da tabela' : 'Igual ao valor da tabela') : fmtV(Math.abs(d)) + (d < 0 ? ' abaixo' : ' acima') + ' da tabela (' + (d < 0 ? '−' : '+') + pc + ')' + (neg ? ', total negociado' : '');
        dif.className = Math.abs(d) < 1 ? 'ok' : d < 0 ? 'abaixo' : 'acima';
      }else{ dif.textContent = ''; dif.className = ''; }
    }
    const fin = $('#fe-fin', box), inf = infoFin(e.linhas, tot);
    if(fin){
      if(fc && fc.resto <= 0){ fin.textContent = passaTxt(fc, e.linhas); fin.className = 'erro'; }
      else if(inf){ const acima = e.limite != null && inf.pct > e.limite + 0.05; fin.textContent = 'Financiamento de ' + fmtV(inf.v) + ', ' + pctTxt(inf.pct) + ' do valor' + (acima ? '. Acima dos ' + pctTxt(e.limite) + ' da tabela: confirme com o banco e a construtora.' : '.'); fin.className = acima ? 'alerta' : ''; }
      else{ fin.textContent = ''; fin.className = ''; }
    }
    $$('.fe-ln', box).forEach(r => { const l = e.linhas[+r.dataset.i], s = r.querySelector('.fe-sub'); if(!l || !s) return; const q = +l.q || 1; s.textContent = q > 1 && l.valor ? q + ' × ' + fmtV(+l.valor) + ' = ' + fmtV(q * l.valor) : ''; });
  }
  function feValidar(){
    const e = S.fe, ls = e.linhas;
    if(!ls.length) return 'Inclua pelo menos uma parcela.';
    const fc = feRecalc(); if(fc && fc.resto <= 0) return passaTxt(fc, ls);
    for(const l of ls){
      if(!String(l.nome || '').trim()) return 'Dê um nome a cada parcela (ex.: Ato, mensais, Financiamento).';
      if(!(+l.q >= 1 && +l.q <= 480 && Number.isInteger(+l.q))) return 'A quantidade de "' + tituloLinha(l) + '" precisa ser um número inteiro de 1 a 480.';
      if(!(+l.valor > 0)) return 'Falta o valor de "' + tituloLinha(l) + '".';
    }
    return '';
  }
  const feErro = m => { if(S.fe) S.fe.erro = m; const b = $('#fe-erro'); if(b) b.textContent = m; };
  function feSalvar(silencioso){
    const e = S.fe; if(!e) return true;
    const er = feValidar(); if(er){ feErro(er); const b = $('#fe-erro'); if(b) b.scrollIntoView({block: 'center', behavior: menosMov() ? 'auto' : 'smooth'}); return false; }
    const pz = {linhas: e.linhas.map(l => ({q: +l.q || 1, nome: String(l.nome).trim(), valor: Math.round((+l.valor) * 100) / 100, quando: String(l.quando || '').trim()})),
      em: new Date().toISOString(), auto: !!e.auto, alvo: e.auto ? (numBR(e.alvo) || null) : null};
    if(!persGravar(e.pid, e.n, pz)){ feErro('Não consegui guardar neste aparelho. Confira se o navegador não está em modo privado.'); return false; }
    S.fe = null;
    if(!silencioso){ feRedesenhar(); toast('Fluxo salvo. Toque em Mandar para enviar ao cliente com ele.', 4200); }
    return true;
  }
  function feUnidade(){   // projeto, espelho e unidade da folha aberta
    const d = $('#folha-un'); if(!d || !d.isConnected) return null;
    const pid = d.dataset.pid, n = d.dataset.n, ch = S.det.get(pid), det = ch && ch.v, p = S.byId.get(pid);
    const a = det && (det.dados.unidades || []).find(x => String(x[0]) === String(n));
    return a && p ? {d, pid, n: String(n), det, p, a} : null;
  }
  function feAbrir(){
    const u = feUnidade(); if(!u) return;
    const tb = linhasDaTabela(u.det, u.a), pz = persAtual(u.det, u.a, persDe(u.pid, u.n)), lim = tb.fluxo ? infoFin(tb.ls, tb.total) : null;
    let alvo = '';
    if(pz && pz.alvo) alvo = numTxt(pz.alvo);
    else if(pz && pz.auto === undefined && tb.total && Math.abs(totalDe(pz.linhas) - tb.total) >= 1) alvo = numTxt(totalDe(pz.linhas));
    S.fe = {pid: u.pid, n: u.n, linhas: (pz ? pz.linhas : tb.ls).slice(0, MAX_LINHAS).map(l => Object.assign({}, l)), ref: tb.total > 0 ? tb.total : null,
      alvo, auto: pz ? pz.auto !== false : true, limite: lim ? lim.pct : null, fechaIdx: -1, erro: ''};
    feRedesenhar(true);
  }
  const feAberto = (pid, n) => !!(S.fe && S.fe.pid === pid && S.fe.n === String(n));
  function persSecaoHtml(p, det, a){
    return '<div id="un-pers" class="un-pers">' + (feAberto(p.id, a[0]) ? '<div id="fe-box">' + feEditorHtml() + '</div>' : persResumoHtml(p, det, a)) + '</div>';
  }
  function feRedesenhar(rolar, foco){
    const u = feUnidade(); if(!u) return;
    const box = $('#un-pers', u.d); if(!box) return;
    const corpo = $('.folha-corpo', u.d), y = corpo.scrollTop;
    box.outerHTML = persSecaoHtml(u.p, u.det, u.a);
    if(S.fe) feTotais();
    corpo.scrollTop = y;
    if(foco){ const i = $(foco, u.d); if(i) i.focus({preventScroll: false}); }
    if(rolar) requestAnimationFrame(() => { const b = $('#un-pers', u.d); if(b) b.scrollIntoView({block: 'start', behavior: menosMov() ? 'auto' : 'smooth'}); });
  }
  // "Mandar" com o editor aberto: salva antes (se faltar algo, mostra o erro e não manda)
  function feAntesDeMandar(pid, n){ return !feAberto(pid, n) || feSalvar(true); }
  function textoPers(p, det, a, pz){
    const ls = linhasDe(pz.linhas), tot = totalDe(pz.linhas);
    return p.nome + ', unidade ' + a[0] + '\n' + maiusc1([andarTxt(a[4]), tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : ''].filter(Boolean).join(', ')) + '\n\nCondição personalizada:\n' +
      ls.map(l => '• ' + l.t + ': ' + l.v + (l.s ? ' (' + l.s + ')' : '')).join('\n') + (ls.length > 1 ? '\nValor total: ' + fmtV(tot) : '');
  }

  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-fe]'); if(!b) return;
    const u = feUnidade(); if(!u) return;
    const acao = b.dataset.fe;
    if(acao === 'abrir') return feAbrir();
    if(acao === 'copiar'){ const pz = persAtual(u.det, u.a, persDe(u.pid, u.n)); if(pz) copiar(textoPers(u.p, u.det, u.a, pz), 'Fluxo copiado. Cole na conversa com o cliente.'); return; }
    if(acao === 'descartar'){   // dois toques, sem janela do navegador
      if(b.dataset.certo !== '1'){ b.dataset.certo = '1'; b.textContent = 'Toque de novo para descartar'; setTimeout(() => { if(b.isConnected){ b.dataset.certo = ''; b.textContent = 'Descartar'; } }, 4000); return; }
      persGravar(u.pid, u.n, null); feRedesenhar(); toast('Fluxo personalizado descartado.'); return;
    }
    const e = S.fe; if(!e || !feAberto(u.pid, u.n)) return;
    if(acao === 'add'){
      if(e.linhas.length >= MAX_LINHAS) return;
      const m = MODELOS[+b.dataset.i]; if(!m) return;
      const nova = {q: m.q, nome: m.nome, valor: 0, quando: typeof m.quando === 'function' ? m.quando() : m.quando};
      const fin = e.linhas.findIndex(l => /financ|chaves|saldo|repasse/i.test(l.nome)), ehF = /financ/i.test(m.nome);
      // o ato no começo, o financiamento no fim (ele fecha a conta), o resto antes do financiamento ou no fim
      let pos = ehF ? e.linhas.length : /^ato$/i.test(m.nome) ? 0 : fin >= 0 ? fin : e.linhas.length;
      // a linha nova é para digitar: se ali ela virasse a que fecha a conta (fluxo sem financiamento, ex.: entrada + mensais), entra antes da atual
      if(!ehF){
        const atual = e.linhas[linhaFechamento(e.linhas)];
        const fica = k => { const t = e.linhas.slice(); t.splice(k, 0, nova); return t[linhaFechamento(t)] === atual; };
        if(!fica(pos)){ const k = e.linhas.indexOf(atual); if(k >= 0 && fica(k)) pos = k; }
      }
      e.linhas.splice(pos, 0, nova);
      feRedesenhar(false, '.fe-ln[data-i="' + pos + '"] [data-fe-in="valor"]:not([readonly])');
      return;
    }
    if(acao === 'tirar'){ if(e.linhas.length > 1){ e.linhas.splice(+b.dataset.i, 1); feRedesenhar(); } return; }
    if(acao === 'restaurar'){ e.linhas = linhasDaTabela(u.det, u.a).ls.slice(0, MAX_LINHAS); e.alvo = ''; e.erro = ''; feRedesenhar(); return; }
    if(acao === 'ajustar'){
      const alvo = numBR(e.alvo);
      if(!alvo || alvo <= 0){ feErro('Digite o total que quer fechar (ex.: 295.000).'); return; }
      const i = linhaFechamento(e.linhas), l = e.linhas[i], q = +l.q || 1, resto = Math.round((alvo - (totalDe(e.linhas) - q * (+l.valor || 0))) * 100) / 100;
      if(resto <= 0){ feErro(passaTxt({i, resto, alvo}, e.linhas)); return; }
      l.valor = Math.round(resto / q * 100) / 100; e.erro = ''; feRedesenhar();
      if(Math.abs(totalDe(e.linhas) - alvo) >= 0.01) toast('Arredondei os centavos: o total ficou ' + fmtV(totalDe(e.linhas)) + '.');
      return;
    }
    if(acao === 'cancelar'){ S.fe = null; feRedesenhar(); return; }
    if(acao === 'salvar') feSalvar();
  });
  document.addEventListener('input', ev => {
    const t = ev.target, k = t && t.dataset && t.dataset.feIn; if(!k || !S.fe || k === 'auto') return;
    const e = S.fe;
    if(k === 'alvo'){ e.alvo = t.value; feTotais(); return; }
    const r = t.closest('.fe-ln'), l = r && e.linhas[+r.dataset.i]; if(!l) return;
    if(k === 'q'){ const q = parseInt(t.value, 10); l.q = isFinite(q) && q > 0 ? Math.min(q, 480) : 1; }
    else if(k === 'nome') l.nome = t.value;
    else if(k === 'valor') l.valor = numBR(t.value) || 0;
    else if(k === 'quando') l.quando = t.value;
    if(e.erro){ e.erro = ''; const er = $('#fe-erro'); if(er) er.textContent = ''; }
    feTotais();
  });
  document.addEventListener('change', ev => {
    const t = ev.target, k = t && t.dataset && t.dataset.feIn; if(!k || !S.fe) return;
    if(k === 'auto'){ S.fe.auto = t.checked; feRedesenhar(); return; }
    // o nome define qual linha fecha a conta (ex.: "Financiamento"): redesenha se ela mudou
    if(k === 'nome' && S.fe.auto && linhaFechamento(S.fe.linhas) !== S.fe.fechaIdx) feRedesenhar();
  });
  document.addEventListener('focusout', ev => {   // ao sair do valor, mostra o número formatado (1502,4 vira 1.502,40)
    const t = ev.target; if(!t || !t.dataset || t.dataset.feIn !== 'valor' || !S.fe) return;
    const r = t.closest('.fe-ln'), l = r && S.fe.linhas[+r.dataset.i]; if(l && t.value.trim()) t.value = numTxt(+l.valor || 0);
  });

  // ================= PERFIL =================
  function telaPerfil(){
    const pf = perfil(), tema = LS.get(K.tema) || 'escuro';
    return '<header class="pg-cab"><div><h1 class="t-1">Perfil e ajustes</h1><p class="sub">Tudo aqui fica só neste aparelho.</p></div></header>' +
      '<div class="perfil-grade"><form id="f-perfil" class="caixa form-perfil" autocomplete="on">' +
      '<h2 class="t-3">Sua assinatura</h2><p class="texto-2">Seu nome e WhatsApp vão no link que o cliente abre, no rodapé dos posts e nos PDFs.</p>' +
      '<label class="campo">Seu nome<input id="pf-nome" name="name" autocomplete="name" maxlength="40" value="' + esc(pf.nome || '') + '"></label>' +
      '<label class="campo">Seu WhatsApp<input id="pf-tel" name="tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '"></label>' +
      '<label class="campo">CRECI<input id="pf-creci" maxlength="20" placeholder="Opcional" value="' + esc(pf.creci || '') + '"><small>Aparece embaixo do telefone nos posts e nos PDFs.</small></label>' +
      '<button class="btn btn-pri btn-alto" type="submit">Salvar</button></form>' +
      '<div class="perfil-lado"><section class="caixa"><h2 class="t-3">Tema</h2><div class="seg" role="group" aria-label="Tema">' + [['escuro', 'Escuro'], ['claro', 'Claro'], ['sistema', 'Automático']].map(t => '<button type="button" data-acao="tema" data-v="' + t[0] + '" aria-pressed="' + (tema === t[0]) + '">' + t[1] + '</button>').join('') + '</div></section>' +
      '<section class="caixa"><h2 class="t-3">Código do time</h2><p class="texto-2">O app usa o mesmo código do app dos Espelhos. Se o código mudar, entre de novo.</p>' +
      '<div class="btn-linha"><button type="button" class="btn" data-acao="sair">Trocar o código</button><a class="btn" href="' + esc(ESP) + '" target="_blank" rel="noopener">App dos Espelhos</a></div></section>' +
      '<p class="nota">Versão ' + esc(VERSAO) + '. Dados lidos às ' + esc(hora(S.geradoEm)) + '.</p></div></div>';
  }
  function aplicarTema(t){
    const claro = t === 'claro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: light)').matches);
    if(claro) document.documentElement.setAttribute('data-tema', 'claro'); else document.documentElement.removeAttribute('data-tema');
    const m = $('meta[name="theme-color"]'); if(m) m.setAttribute('content', claro ? '#F6F3EC' : '#0E0C09');
  }

  // ================= FOTOS: buscar, converter, salvar e compartilhar =================
  const HOST_CORS = ['lh3.googleusercontent.com', 'www.revendasoneinnovation.com.br'];
  const semCors = new Set(SS.get('corretor-sem-cors') || []);
  const hostDe = u => { try{ return new URL(u, location.href).hostname; }catch(e){ return ''; } };
  const mesmaOrigem = u => { try{ return new URL(u, location.href).origin === location.origin; }catch(e){ return false; } };
  const podeDireto = u => mesmaOrigem(u) || (HOST_CORS.includes(hostDe(u)) && !semCors.has(hostDe(u)));
  function marcarSemCors(u){ const h = hostDe(u); if(h && !mesmaOrigem(u)){ semCors.add(h); SS.set('corretor-sem-cors', [...semCors]); } }
  const urlBaixar = src => temTamanhos(src) ? tamImg(src, 2048) : src;
  async function buscarFoto(u){   // direto quando o site libera; senão pelo servidor de fotos do app (precisa do código do time)
    if(podeDireto(u)){
      try{ const r = await fetch(u, {mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer'}); if(r.ok){ const b = await r.blob(); if(b.size && /^image\//.test(b.type)) return b; } }
      catch(e){ marcarSemCors(u); }
      if(mesmaOrigem(u)) throw new Error('foto_local');
    }
    const r = await fetch(FN_FOTO, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({c: S.cod, u}), cache: 'no-store'});
    if(!r.ok){ let cod = ''; try{ cod = (await r.json()).erro || ''; }catch(e){} const er = new Error('foto ' + r.status + ' ' + cod); er.status = r.status; er.codigo = cod; throw er; }
    const b = await r.blob();
    if(!b.size) throw new Error('foto_vazia');
    return b;
  }
  async function paraJpeg(b){   // webp e avif viram jpg, que abre em qualquer celular e no WhatsApp
    if(!/^image\/(webp|avif)$/i.test(b.type || '')) return b;
    try{
      let fonte, w, h, url = null;
      if(typeof createImageBitmap === 'function'){ fonte = await createImageBitmap(b); w = fonte.width; h = fonte.height; }
      else{ url = URL.createObjectURL(b); fonte = await carregarImg(url, false); if(!fonte) return b; w = fonte.naturalWidth; h = fonte.naturalHeight; }
      const k = Math.min(1, Math.sqrt(16e6 / (w * h)));
      const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      const ctx = cv.getContext('2d'); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(fonte, 0, 0, cv.width, cv.height);
      if(fonte.close) fonte.close(); if(url) URL.revokeObjectURL(url);
      const out = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
      return out || b;
    }catch(e){ return b; }
  }
  const extDe = t => ({'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif'}[String(t || '').toLowerCase()] || '.jpg');
  function salvarBlob(b, nome){
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = nome; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
  }
  let podeArq = null;
  function podeCompartilharArquivos(){
    if(podeArq != null) return podeArq;
    try{ podeArq = !!(navigator.share && navigator.canShare && navigator.canShare({files: [new File([new Uint8Array([255, 216, 255])], 'a.jpg', {type: 'image/jpeg'})]})); }catch(e){ podeArq = false; }
    return podeArq;
  }
  async function compartilhar(files, texto){   // chamar direto do toque, antes de qualquer espera
    try{ await navigator.share(Object.assign({files}, texto ? {text: texto} : {})); return true; }
    catch(e){ if(e && e.name === 'AbortError') return false; toast('Não deu para abrir o compartilhamento. Use Salvar.', 4500); return false; }
  }

  // ================= ZIP (sem compressão: foto já vem comprimida) e planilha Excel =================
  const CRC_T = (() => { const t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8){ let c = 0xFFFFFFFF; for(let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipar(arqs, tipo){   // arqs: [{nome, dados: Uint8Array}]
    const enc = new TextEncoder(), partes = [], central = [];
    let off = 0;
    const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    for(const a of arqs){
      const nome = enc.encode(a.nome), dados = a.dados, crc = crc32(dados);
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, crc, true); lh.setUint32(18, dados.length, true); lh.setUint32(22, dados.length, true);
      lh.setUint16(26, nome.length, true); lh.setUint16(28, 0, true);
      partes.push(lh.buffer, nome, dados);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, crc, true); ch.setUint32(20, dados.length, true); ch.setUint32(24, dados.length, true);
      ch.setUint16(28, nome.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, off, true);
      central.push(ch.buffer, nome);
      off += 30 + nome.length + dados.length;
    }
    const tamC = central.reduce((s, b) => s + b.byteLength, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(4, 0, true); fim.setUint16(6, 0, true); fim.setUint16(8, arqs.length, true); fim.setUint16(10, arqs.length, true);
    fim.setUint32(12, tamC, true); fim.setUint32(16, off, true); fim.setUint16(20, 0, true);
    return new Blob(partes.concat(central, [fim.buffer]), {type: tipo || 'application/zip'});
  }
  function xlsxBlob(aba, linhas, larguras, congelar){   // células: texto, número ou {v, s}; s: 1 negrito, 2 R$, 3 área, 4 título
    const colL = i => { let s = ''; i++; while(i > 0){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    const x = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let sd = '';
    linhas.forEach((lin, r) => {
      sd += '<row r="' + (r + 1) + '">';
      (lin || []).forEach((c, k) => {
        if(c == null || c === '') return;
        const o = typeof c === 'object' ? c : {v: c}, ref = colL(k) + (r + 1), s = o.s ? ' s="' + o.s + '"' : '';
        if(typeof o.v === 'number' && isFinite(o.v)) sd += '<c r="' + ref + '"' + s + '><v>' + o.v + '</v></c>';
        else sd += '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + x(o.v) + '</t></is></c>';
      });
      sd += '</row>';
    });
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const NS = 'http://schemas.openxmlformats.org/';
    const folha = X + '<worksheet xmlns="' + NS + 'spreadsheetml/2006/main" xmlns:r="' + NS + 'officeDocument/2006/relationships">' +
      (congelar ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="' + congelar + '" topLeftCell="A' + (congelar + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : '') +
      '<cols>' + larguras.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>' +
      '<sheetData>' + sd + '</sheetData></worksheet>';
    const estilos = X + '<styleSheet xmlns="' + NS + 'spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0"/></numFmts>' +
      '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    const arqs = [
      ['[Content_Types].xml', X + '<Types xmlns="' + NS + 'package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="' + NS + 'package/2006/relationships"><Relationship Id="rId1" Type="' + NS + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="' + NS + 'spreadsheetml/2006/main" xmlns:r="' + NS + 'officeDocument/2006/relationships"><sheets><sheet name="' + x(aba).slice(0, 31) + '" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="' + NS + 'package/2006/relationships"><Relationship Id="rId1" Type="' + NS + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + NS + 'officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', estilos],
      ['xl/worksheets/sheet1.xml', folha]
    ];
    const enc = new TextEncoder();
    return zipar(arqs.map(([nome, txt]) => ({nome, dados: enc.encode(txt)})), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // ================= BAIXAR E ENVIAR =================
  ICO.planta = svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h7v9M10 3v5M14 12h7M14 12v4"/>');
  const MAX_ZIP = 30;
  async function abrirBaixar(id){
    const p = S.byId.get(id); if(!p) return;
    abrirFolha('baixar', 'Baixar e enviar', '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:64px"></div><div class="brilho" style="height:64px"></div><div class="brilho" style="height:64px"></div></div>', '');
    const dlg = $('#folha-baixar');
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); if(dlg && dlg.isConnected) corpoFolha('<p class="erro-txt" role="alert">Não consegui abrir o projeto agora. Confira a internet e tente de novo.</p>', '', dlg); return; }
    if(!dlg || !dlg.isConnected) return;
    corpoFolha(menuBaixarHtml(p, det, c), '', dlg);
  }
  function menuBaixarHtml(p, det, c){
    const fotos = fotosDoProjeto(det, c), plantas = plantasDoProjeto(det, c), bk = bookDe(det, c);
    const livres = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').length;
    const sel = S.ui.tabSel.get(p.id);
    const nU = sel && sel.size ? plural(sel.size, 'unidade marcada', 'unidades marcadas') : plural(livres, 'unidade livre', 'unidades livres');
    const op = (acao, ico, t, s) => '<button type="button" class="opcao" data-acao="' + acao + '" data-id="' + esc(p.id) + '"><span class="opcao-ico" aria-hidden="true">' + ico + '</span><span class="opcao-t"><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span>' + ICO.seta + '</button>';
    return '<div class="env-proj">' + miniProj(p) + '<p><b>' + esc(p.nome) + '</b><span>Fotos na melhor qualidade que a construtora publica. Os PDFs saem com o seu contato no rodapé.</span></p></div>' +
      '<div class="opcoes">' + (bk ? '<a class="opcao" href="' + esc(bk.u) + '" target="_blank" rel="noopener"' + (bk.mesmo ? ' download' : '') + '><span class="opcao-ico" aria-hidden="true">' + ICO.livro + '</span><span class="opcao-t"><b>' + esc(bk.arq ? 'Book do empreendimento (PDF)' : 'Pasta do book no Drive') + '</b><small>' + esc(bk.arq ? [/^book do empreendimento$/i.test(bk.t || '') ? '' : bk.t, bk.s].filter(Boolean).join(', ') : 'Abre a pasta com o book da construtora') + '</small></span>' + ICO.seta + '</a>' : '') +
      (fotos.length ? op('baixar-fotos', ICO.fotos, 'Fotos em alta (.zip)', plural(Math.min(MAX_ZIP, fotos.length), 'foto', 'fotos') + ' num arquivo só') : '') +
      (fotos.length && ehToque() && podeCompartilharArquivos() ? op('enviar-fotos', ICO.zap, 'Mandar fotos pelo WhatsApp', 'As ' + Math.min(10, fotos.length) + ' primeiras, direto no aplicativo') : '') +
      (plantas.length ? op('baixar-plantas', ICO.planta, 'Plantas (.zip)', plural(plantas.length, 'planta', 'plantas')) : '') +
      op('pdf-ficha', ICO.arquivo, 'Ficha do projeto em PDF', 'Fotos, tipologias, preços, lazer e plantas') +
      op('planilha-tabela', ICO.planilha, 'Tabela em planilha (Excel)', nU + ', com preços e fluxo') +
      op('pdf-tabela', ICO.imprimir, 'Tabela em PDF', nU + ', para imprimir ou mandar') +
      '</div>' + (!fotos.length ? '<p class="nota">Este projeto ainda não tem fotos publicadas.</p>' : '') +
      '<p class="nota">Os PDFs abrem a janela de impressão do aparelho. Escolha "Salvar como PDF".</p>';
  }
  async function prepararArquivos(id, tipo){   // tipo: fotos, plantas ou enviar (10 fotos para o WhatsApp)
    const p = S.byId.get(id); if(!p) return;
    let dlg = $('#folha-baixar');
    if(!dlg){ abrirFolha('baixar', 'Baixar e enviar', '', ''); dlg = $('#folha-baixar'); }
    const nomeT = tipo === 'plantas' ? 'plantas' : 'fotos';
    corpoFolha('<div class="esqueleto" aria-busy="true"><p class="sub">Abrindo as ' + nomeT + '…</p></div>', '', dlg);
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); corpoFolha('<p class="erro-txt" role="alert">Não consegui abrir o projeto agora. Confira a internet.</p>', '', dlg); return; }
    const lista = (tipo === 'plantas' ? plantasDoProjeto(det, c).map(x => ({src: x.src, t: x.t})) : fotosDoProjeto(det, c)).slice(0, tipo === 'enviar' ? 10 : MAX_ZIP);
    const voltar = '<button type="button" class="btn" data-acao="menu-baixar" data-id="' + esc(id) + '">Voltar</button>';
    if(!lista.length){ corpoFolha('<p class="texto-2">Este projeto ainda não tem ' + nomeT + ' publicadas.</p>', voltar, dlg); return; }
    const job = {cancelado: false, dlg}; S.baixa = job;
    corpoFolha('<div class="progresso" role="status"><p><b class="num" id="bx-n">0</b> de ' + lista.length + ' ' + nomeT + ' prontas</p><div class="barra-prog"><i id="bx-barra"></i></div><p class="nota">Baixando na melhor qualidade disponível. Pode levar alguns segundos.</p></div>',
      '<button type="button" class="btn" data-acao="cancelar-baixa">Cancelar</button>', dlg);
    const out = new Array(lista.length); let feitos = 0, prox = 0, codRuim = false;
    const base = slug(p.nome) + (tipo === 'plantas' ? '-planta-' : '-foto-');
    const vai = async () => {
      while(prox < lista.length && !job.cancelado){
        const k = prox++;
        try{ const b = await paraJpeg(await buscarFoto(urlBaixar(lista[k].src))); out[k] = {b, nome: base + String(k + 1).padStart(2, '0') + extDe(b.type), i: k}; }
        catch(e){ if(e && e.codigo === 'codigo'){ codRuim = true; job.cancelado = true; } }
        feitos++;
        const n = $('#bx-n'), br = $('#bx-barra'); if(n) n.textContent = feitos; if(br) br.style.width = Math.round(feitos / lista.length * 100) + '%';
      }
    };
    await Promise.all([vai(), vai(), vai()]);
    if(codRuim){ S.baixa = null; sair('Esse código não vale mais. Digite o código novo do time.'); return; }
    if(job.cancelado || !dlg.isConnected) return;
    S.baixa = null;
    const ok = out.filter(Boolean);
    if(!ok.length){ corpoFolha('<p class="erro-txt" role="alert">Não consegui baixar as ' + nomeT + ' agora. Confira a internet e tente de novo.</p>', voltar, dlg); return; }
    const files = ok.map(x => new File([x.b], x.nome, {type: x.b.type || 'image/jpeg'}));
    const falhou = lista.length - ok.length;
    const miniaturas = '<div class="prontas">' + ok.slice(0, 12).map(x => { const f = lista[x.i]; return '<span class="redonda">' + imgTag(f.th || f.src, '', '', {w: 160, semSet: true}) + '</span>'; }).join('') + (ok.length > 12 ? '<span class="redonda mais num">+' + (ok.length - 12) + '</span>' : '') + '</div>';
    const nota = falhou ? ' ' + plural(falhou, 'não abriu no site da construtora', 'não abriram no site da construtora') + '.' : '';
    if(tipo === 'enviar'){
      S.pronto = {files, texto: ''};
      corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>' + esc(plural(ok.length, 'foto pronta', 'fotos prontas')) + ' para mandar.' + esc(nota) + '</p></div>' + miniaturas,
        '<button type="button" class="btn btn-pri btn-alto" data-acao="share-pronto">' + ICO.zap + 'Mandar agora</button>', dlg);
      return;
    }
    const zip = zipar(await Promise.all(ok.map(async x => ({nome: x.nome, dados: new Uint8Array(await x.b.arrayBuffer())}))));
    const nomeZip = slug(p.nome) + '-' + nomeT + '.zip', mb = zip.size / 1048576;
    S.pronto = {zip, nomeZip, files: files.slice(0, 10)};
    if(!dlg.isConnected) return;
    corpoFolha('<div class="aviso ok" role="status">' + ICO.ok + '<p>' + esc(plural(ok.length, nomeT.slice(0, -1), nomeT)) + ' em ' + esc(nomeZip) + ', ' + esc(mb.toLocaleString('pt-BR', {maximumFractionDigits: 1})) + ' MB.' + esc(nota) + (ehToque() ? '' : ' O arquivo foi para a pasta de downloads.') + '</p></div>' + miniaturas,
      (ehToque() && podeCompartilharArquivos() ? '<button type="button" class="btn" data-acao="share-pronto">' + ICO.compartilhar + (files.length > 10 ? 'Enviar 10' : 'Enviar') + '</button>' : '') +
      '<button type="button" class="btn btn-pri" data-acao="salvar-pronto">' + ICO.baixar + (ehToque() ? 'Salvar o .zip' : 'Salvar de novo') + '</button>', dlg);
    if(!ehToque()) salvarBlob(zip, nomeZip);
  }
  // foto aberta no visor: deixa o arquivo pronto para o "Enviar" funcionar no primeiro toque
  let tLuz = null;
  function aoMudarLuz(ja){
    clearTimeout(tLuz);
    if(!S.luz || !podeCompartilharArquivos() || !ehToque()) return;
    tLuz = setTimeout(async () => {
      const L = S.luz; if(!L) return;
      const i = L.i, f = L.lista[i]; if(!f || (L.arq && L.arq.i === i)) return;
      try{ const b = await paraJpeg(await buscarFoto(urlBaixar(f.src))); if(S.luz === L) L.arq = {i, file: new File([b], nomeFotoLuz(L, i, b.type), {type: b.type || 'image/jpeg'})}; }catch(e){}
    }, ja ? 0 : 450);
  }
  const nomeFotoLuz = (L, i, tipo) => slug(L.nome || 'fortal') + '-' + String(i + 1).padStart(2, '0') + extDe(tipo);
  async function baixarFotoLuz(){
    const L = S.luz; if(!L) return;
    const i = L.i, f = L.lista[i]; if(!f) return;
    if(L.arq && L.arq.i === i){ salvarBlob(L.arq.file, L.arq.file.name); toast('Foto salva.'); return; }
    toast('Baixando a foto em alta…', 9000);
    try{ const b = await paraJpeg(await buscarFoto(urlBaixar(f.src))); salvarBlob(b, nomeFotoLuz(L, i, b.type)); toast('Foto salva.'); }
    catch(e){ if(e && e.codigo === 'codigo') return sair('Esse código não vale mais. Digite o código novo do time.'); toast('Não consegui baixar essa foto agora.', 4000); }
  }
  function enviarFotoLuz(){
    const L = S.luz; if(!L) return;
    if(L.arq && L.arq.i === L.i){ compartilhar([L.arq.file], ''); return; }
    toast('Preparando a foto. Toque em Enviar de novo em instantes.', 4000);
    aoMudarLuz(true);
  }

  // ================= PDF (impressão) e planilha =================
  const dataHora = s => { const t = Date.parse(s); return isFinite(t) ? fDMA.format(t) + ' às ' + hora(t) : ''; };
  function fluxoTxt(det, a){
    const fx = fluxoDe(det, a); if(!fx || !fx.linhas.length) return '';
    return fx.linhas.map(l => (l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + ': ' + (l.n > 1 ? l.n + 'x ' : '') + BRL(l.v) + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')).join('; ');
  }
  function imgImp(src, w, cls){
    if(!src) return '';
    const ext = /^https?:/i.test(src) && !src.startsWith(location.origin);
    return '<img src="' + esc(tamImg(src, w)) + '" alt="" class="' + (cls || '') + '" decoding="sync"' + (ext ? ' referrerpolicy="no-referrer"' : '') + '>';
  }
  function rodapeImp(det, c){
    const pf = perfil(), d = det.dados, info = det.info || {};
    const quem = [pf.nome || 'Fortal Inteligência Imobiliária', pf.tel, pf.creci ? 'CRECI ' + pf.creci : ''].filter(Boolean);
    return '<footer class="imp-rod"><div class="imp-cor"><img src="img/logo-fortal.png" alt="" class="imp-logo-p"><p><b>' + esc(quem[0]) + '</b>' + quem.slice(1).map(x => '<span>' + esc(x) + '</span>').join('') + '</p></div>' +
      '<p class="imp-legal">' + esc('Valores e disponibilidade do espelho de ' + (dataHora(d.atualizado_em) || fDMA.format(Date.now())) + ', sujeitos a alteração sem aviso. Imagens ilustrativas.' + (c && c.legal ? ' ' + c.legal : '') + (info.capa_fonte ? ' Fotos: ' + info.capa_fonte + '.' : '')) + '</p></footer>';
  }
  function htmlFicha(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det), pc = precosCampos(det);
    const fotos = fotosDoProjeto(det, c), plantas = plantasDoProjeto(det, c).slice(0, 4);
    const ref = unidadeRef(det, chave), pRef = ref ? precoU(ref, chave) : null;
    const pvRef = ref && chave !== 'pv' && pc.some(x => x.k === 'pv') ? precoU(ref, 'pv') : null;
    const tipos = porTipologia(det, chave);
    const areas = (d.unidades || []).filter(a => a[6] === 'disponivel').map(areaU).filter(v => v > 0);
    const met = areas.length ? (Math.round(Math.min(...areas)) === Math.round(Math.max(...areas)) ? fmtM2(Math.round(Math.min(...areas))) : Math.round(Math.min(...areas)) + ' a ' + fmtM2(Math.round(Math.max(...areas)))) : '';
    const fase = FASE[info.fase] || d.fase || '';
    const ent = info.fase === 'pronto' ? 'Pronto para morar' : (mesAno(info.entrega) ? maiusc1(mesAno(info.entrega)) : (d.fase || 'A definir'));
    let h = '<article class="imp imp-ficha"><header class="imp-cab"><img src="img/logo-fortal.png" alt="Fortal" class="imp-logo"><div class="imp-cab-t">' +
      '<p class="imp-k">' + esc([fase && fase + (quemDe(p) ? ' da ' + quemDe(p) : ''), noBairro(p.bairro || info.bairro)].filter(Boolean).join(' ')) + '</p>' +
      '<h1>' + esc(p.nome) + '</h1>' + (info.endereco || d.endereco ? '<p>' + esc([info.endereco || d.endereco, p.cidade && p.cidade !== 'São Paulo' ? p.cidade : ''].filter(Boolean).join(', ')) + '</p>' : '') + '</div></header>';
    if(fotos.length) h += '<div class="imp-fotos n' + Math.min(3, fotos.length) + '">' + fotos.slice(0, 3).map((f, i) => imgImp(f.src, i ? 900 : 1600)).join('') + '</div>';
    h += '<section class="imp-fatos">' +
      (pRef ? '<div class="imp-preco"><small>' + (chave === 'pv' ? 'À vista a partir de' : 'A partir de') + '</small><b>' + esc(BRL(pRef)) + '</b>' + (pvRef ? '<span>ou ' + esc(BRL(pvRef)) + ' à vista</span>' : '') + '</div>' : '') +
      (tipos.length ? '<div><small>Tipologias</small><b>' + esc(tiposTxt(p.tipos) || tipos.map(t => t.t).slice(0, 3).join(', ')) + '</b></div>' : '') +
      (met ? '<div><small>Metragem</small><b>' + esc(met) + '</b></div>' : '') +
      '<div><small>Entrega</small><b>' + esc(ent) + '</b></div>' +
      (info.vagas && ['todas', 'algumas', 'nenhuma'].includes(info.vagas.r) ? '<div><small>Vaga</small><b>' + esc({todas: 'Todas com vaga', algumas: 'Algumas unidades', nenhuma: 'Sem vaga'}[info.vagas.r]) + '</b></div>' : '') + '</section>';
    const sobre = c && c.intro ? c.intro : (c && c.chamada) || info.destaque || '';
    if(sobre) h += '<section class="imp-sec"><h2>Sobre o projeto</h2><p>' + esc(sobre) + '</p></section>';
    if(tipos.length) h += '<section class="imp-sec"><h2>Unidades disponíveis</h2><table class="imp-t"><thead><tr><th>Tipologia</th><th class="dir">Disponíveis</th><th>Metragem</th><th class="dir">A partir de</th></tr></thead><tbody>' +
      tipos.slice(0, 14).map(t => '<tr><td><b>' + esc(t.t) + '</b></td><td class="dir">' + t.n + '</td><td>' + esc(t.amin ? (Math.round(t.amin) === Math.round(t.amax) ? fmtM2(Math.round(t.amin)) : Math.round(t.amin) + ' a ' + fmtM2(Math.round(t.amax))) : '') + '</td><td class="dir"><b>' + (t.pmin ? esc(BRL(t.pmin)) : 'sob consulta') + '</b></td></tr>').join('') + '</tbody></table></section>';
    const fx = ref ? fluxoDe(det, ref) : null;
    const corr = (info.fluxo && info.fluxo.correcao) || (d.tabela && d.tabela.correcao) || '';
    if(fx && fx.linhas.length){
      h += '<section class="imp-sec"><h2>Como pagar</h2><p class="imp-sub">' + esc('Exemplo na unidade ' + ref[0] + (pRef ? ' de ' + BRL(pRef) : '') + ', a mais em conta disponível hoje.') + '</p>' +
        '<table class="imp-t"><thead><tr><th>Etapa</th><th>Parcelas</th><th class="dir">Valor</th><th class="dir">% do total</th></tr></thead><tbody>' +
        fx.linhas.map(l => '<tr><td>' + esc(l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + '</td><td>' + esc((l.n > 1 ? l.n + 'x' : '1x') + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')) + '</td><td class="dir">' + esc(BRL(l.v)) + '</td><td class="dir">' + esc(pctTxt(pct(l.v * l.n, fx.total))) + '</td></tr>').join('') + '</tbody></table>' +
        (corr ? '<p class="imp-sub">' + esc(corr) + '</p>' : '') + '</section>';
    }
    const lazer = c && Array.isArray(c.lazer) && c.lazer.length ? c.lazer.map(l => (l.onde ? l.onde + ': ' : '') + (l.itens || []).join(', ')) : (Array.isArray(info.lazer) && info.lazer.length ? [info.lazer.filter(Boolean).join(', ')] : []);
    if(lazer.length) h += '<section class="imp-sec"><h2>Lazer</h2>' + lazer.map(t => '<p>' + esc(t) + '</p>').join('') + '</section>';
    if(c && Array.isArray(c.diferenciais) && c.diferenciais.length) h += '<section class="imp-sec"><h2>Diferenciais</h2><ul>' + c.diferenciais.slice(0, 12).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
    if(c && Array.isArray(c.perto) && c.perto.length) h += '<section class="imp-sec"><h2>Perto daqui</h2><ul class="imp-2col">' + c.perto.slice(0, 10).map(x => { const t = x.pe != null ? x.pe + ' min a pé' : x.bike != null ? x.bike + ' min de bike' : x.carro != null ? x.carro + ' min de carro' : x.min != null ? x.min + ' min' : ''; return '<li>' + esc(x.nome) + (t ? ', ' + esc(t) : '') + '</li>'; }).join('') + '</ul></section>';
    if(plantas.length) h += '<section class="imp-sec imp-plantas"><h2>Plantas</h2><div class="imp-pl n' + Math.min(plantas.length, 4) + '">' + plantas.map(pl => '<figure>' + imgImp(pl.src, 900) + '<figcaption>' + esc(pl.t) + (pl.sub ? ', ' + esc(pl.sub) : '') + '</figcaption></figure>').join('') + '</div></section>';
    const fatos = c && Array.isArray(c.fatos) ? c.fatos.filter(x => Array.isArray(x) && x[0]) : (info.ficha_tecnica && typeof info.ficha_tecnica === 'object' ? Object.entries(info.ficha_tecnica).map(([k, v]) => [maiusc1(k.replace(/_/g, ' ')), typeof v === 'string' ? v : JSON.stringify(v)]) : []);
    if(fatos.length) h += '<section class="imp-sec"><h2>Ficha técnica</h2><dl class="imp-dl">' + fatos.slice(0, 16).map(f => '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') + '</dl></section>';
    return h + rodapeImp(det, c) + '</article>';
  }
  function unidadesExport(p, det){   // as marcadas; senão o que está na tela da tabela; senão as livres
    const modo = modoTabela(p, det), sel = S.ui.tabSel.get(p.id);
    let us, rotulo;
    if(sel && sel.size){ us = (det.dados.unidades || []).filter(a => sel.has(String(a[0]))).sort((x, y) => (precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12)); rotulo = plural(us.length, 'unidade marcada', 'unidades marcadas'); }
    else if(location.hash === '#/tabelas/' + p.id){
      const f = espFiltro(p.id), resumo = efResumo(f);
      if(vistaTab(det) === 'espelho'){   // o que está aceso no espelho (em "Total", as livres)
        const U = espUnidades(det, S.centralV.get(p.id) || null), rec = recentesDe(det), st = f.st === 'todos' ? 'disponivel' : f.st;
        us = U.filter(u => espBate(u, f, modo) && u.st === st && (!f.mov || rec.has(u.n))).map(u => u.a).sort((x, y) => (precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12));
        const R = {disponivel: ['unidade livre', 'unidades livres'], reservada: ['unidade reservada', 'unidades reservadas'], processo_final: ['unidade em processo', 'unidades em processo'], vendida: ['unidade vendida', 'unidades vendidas']}[st] || ['unidade', 'unidades'];
        rotulo = plural(us.length, R[0], R[1]) + (f.mov ? ' que mexeram hoje e ontem' : '') + (resumo ? ', ' + resumo : '');
      }else{
        us = unidadesTabela(p, det, modo).us;
        const fil = S.ui.tabFiltro;
        rotulo = (fil === 'livres' ? plural(us.length, 'unidade livre', 'unidades livres') : plural(us.length, 'unidade', 'unidades') + (fil === 'mov' ? ' que mexeram hoje e ontem' : '')) + (resumo ? ', ' + resumo : '');
      }
    }else{
      us = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').sort((x, y) => (precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12));
      rotulo = plural(us.length, 'unidade livre', 'unidades livres');
    }
    return {us, modo, rotulo};
  }
  function condicoesDe(det){
    const d = det.dados, tab = d.tabela || {}, info = det.info || {};
    return [tab.regra_curta, tab.regra_avista, (info.fluxo && info.fluxo.correcao) || tab.correcao, info.fluxo && info.fluxo.obs].concat(Array.isArray(tab.condicoes) ? tab.condicoes : []).filter(Boolean).map(String).filter((t, i, a) => a.indexOf(t) === i);
  }
  function htmlTabela(p, det, us, modo, rotulo){
    const d = det.dados, pc = precosCampos(det).slice(0, 3), tab = d.tabela || {};
    const todasLivres = us.every(a => a[6] === 'disponivel'), comFluxo = us.length <= 24;
    const nCols = 6 + (todasLivres ? 0 : 1) + pc.length;
    let h = '<article class="imp imp-tabela"><header class="imp-cab"><img src="img/logo-fortal.png" alt="Fortal" class="imp-logo"><div class="imp-cab-t"><p class="imp-k">Tabela de unidades</p><h1>' + esc(p.nome) + '</h1>' +
      '<p>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ') + '. ' + maiusc1(rotulo) + '. Espelho de ' + (dataHora(d.atualizado_em) || 'hoje') + (tab.nome ? '. ' + nomeTabela(tab.nome) : '') + '.') + '</p></div></header>' +
      '<table class="imp-t imp-t-u"><thead><tr><th>Unidade</th><th>Andar</th><th>Tipologia</th><th class="dir">Área</th><th>Faixa</th>' + (todasLivres ? '' : '<th>Status</th>') + pc.map(x => '<th class="dir">' + esc(x.label) + '</th>').join('') + '<th class="dir">R$/m²</th></tr></thead><tbody>';
    for(const a of us){
      const ar = areaU(a), v = precoU(a, modo), fx = comFluxo ? fluxoTxt(det, a) : '';
      h += '<tr' + (fx ? ' class="com-fluxo"' : '') + '><td><b>' + esc(a[0]) + '</b></td><td>' + esc(andarTxt(a[4])) + '</td><td>' + esc(tipologiaU(det, a) || '') + '</td><td class="dir">' + esc(ar ? fmtM2(ar) : '') + '</td><td>' + esc(a[3] || '') + '</td>' +
        (todasLivres ? '' : '<td>' + esc(stLabel(det, a[6])) + '</td>') + pc.map(x => { const pv = precoU(a, x.k); return '<td class="dir">' + (pv ? '<b>' + esc(BRL(pv)) + '</b>' : '') + '</td>'; }).join('') +
        '<td class="dir">' + (v && ar ? esc(BRL(v / ar)) : '') + '</td></tr>' + (fx ? '<tr class="fluxo-l"><td colspan="' + nCols + '">' + esc(fx) + '</td></tr>' : '');
    }
    h += '</tbody></table>';
    const cond = condicoesDe(det);
    if(cond.length) h += '<section class="imp-sec"><h2>Condições</h2><ul>' + cond.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></section>';
    return h + rodapeImp(det, null) + '</article>';
  }
  async function imprimir(html, titulo){
    const box = $('#impressao'); if(!box) return;
    box.innerHTML = html;
    const antes = document.title; document.title = titulo;
    const imgs = $$('img', box);
    await Promise.race([Promise.all(imgs.map(im => im.complete ? 1 : new Promise(r => { im.addEventListener('load', r, {once: true}); im.addEventListener('error', r, {once: true}); }))), new Promise(r => setTimeout(r, 9000))]);
    try{ await document.fonts.ready; }catch(e){}
    const fim = () => { document.title = antes; window.removeEventListener('afterprint', fim); };
    window.addEventListener('afterprint', fim);
    setTimeout(fim, 60000);
    window.print();
  }
  async function detalheOuAviso(id){
    try{ const [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); return {det, c}; }
    catch(e){ if(codigoInvalido(e)){ sair('Esse código não vale mais. Digite o código novo do time.'); return null; } toast('Não consegui abrir o projeto agora. Confira a internet.', 4000); return null; }
  }
  async function imprimirFicha(id){
    const p = S.byId.get(id); if(!p) return;
    fecharFolhas(); toast('Montando a ficha em PDF…', 6000);
    const r = await detalheOuAviso(id); if(!r) return;
    await imprimir(htmlFicha(p, r.det, r.c), 'Ficha ' + p.nome + ' - Fortal');
  }
  async function imprimirTabela(id){
    const p = S.byId.get(id); if(!p) return;
    fecharFolhas();
    const r = await detalheOuAviso(id); if(!r) return;
    const {us, modo, rotulo} = unidadesExport(p, r.det);
    if(!us.length){ toast('Nenhuma unidade para a tabela com esse filtro.'); return; }
    toast('Montando a tabela em PDF: ' + rotulo + '.', 5000);
    await imprimir(htmlTabela(p, r.det, us, modo, rotulo), 'Tabela ' + p.nome + ' - Fortal');
  }
  async function baixarPlanilha(id){
    const p = S.byId.get(id); if(!p) return;
    fecharFolhas();
    const r = await detalheOuAviso(id); if(!r) return;
    const det = r.det, d = det.dados, tab = d.tabela || {};
    const {us, modo, rotulo} = unidadesExport(p, det);
    if(!us.length){ toast('Nenhuma unidade para a planilha com esse filtro.'); return; }
    const pc = precosCampos(det).slice(0, 3), todasLivres = us.every(a => a[6] === 'disponivel');
    const cab = ['Unidade', 'Andar', 'Tipologia', 'Área (m²)', 'Faixa'].concat(todasLivres ? [] : ['Status'], pc.map(x => x.label), ['R$/m²', 'Vaga', 'Fluxo de pagamento']);
    const linhas = [
      [{v: 'Tabela do ' + p.nome, s: 4}],
      [[quemDe(p), p.bairro].filter(Boolean).join(', ') + '. ' + maiusc1(rotulo) + '. Espelho de ' + (dataHora(d.atualizado_em) || 'hoje') + (tab.nome ? '. ' + nomeTabela(tab.nome) : '') + '.'],
      [],
      cab.map(t => ({v: t, s: 1}))
    ];
    for(const a of us){
      const ar = areaU(a), v = precoU(a, modo), vg = vagaDe(det, a);
      linhas.push([String(a[0]), andarTxt(a[4]), tipologiaU(det, a) || '', ar ? {v: +ar, s: 3} : '', a[3] || ''].concat(
        todasLivres ? [] : [stLabel(det, a[6])],
        pc.map(x => { const pv = precoU(a, x.k); return pv ? {v: pv, s: 2} : ''; }),
        [v && ar ? {v: Math.round(v / ar), s: 2} : '', vg == null ? '' : vg ? vg + (vg > 1 ? ' vagas' : ' vaga') : 'Sem vaga', fluxoTxt(det, a)]));
    }
    linhas.push([]);
    condicoesDe(det).forEach(t => linhas.push([t]));
    linhas.push(['Valores sujeitos a alteração sem aviso. Gerado no App do Corretor da Fortal em ' + fDMA.format(Date.now()) + ' às ' + hora(Date.now()) + '.']);
    const larg = [10, 12, 24, 11, 10].concat(todasLivres ? [] : [14], pc.map(() => 15), [12, 11, 80]);
    salvarBlob(xlsxBlob('Unidades', linhas, larg, 4), 'tabela-' + slug(p.nome) + '.xlsx');
    toast('Planilha salva com ' + rotulo + '.', 4000);
  }

  // ================= folhas e avisos =================
  function abrirFolha(id, titulo, corpo, pe, cls){
    fecharFolhas();
    const d = document.createElement('dialog'); d.className = 'folha' + (cls ? ' ' + cls : ''); d.id = 'folha-' + id; d.setAttribute('aria-labelledby', 'folha-t-' + id);
    d.innerHTML = '<div class="folha-cab"><h2 id="folha-t-' + id + '">' + esc(titulo) + '</h2><button type="button" class="ico-btn" data-acao="fechar-folha" aria-label="Fechar">' + ICO.fechar + '</button></div>' +
      '<div class="folha-corpo">' + corpo + '</div><div class="folha-pe"' + (pe ? '' : ' hidden') + '>' + (pe || '') + '</div>';
    $('#folhas').appendChild(d);
    d.addEventListener('close', () => { d.remove(); if(id === 'filtros') atualizarImoveis(); if(S.baixa && S.baixa.dlg === d){ S.baixa.cancelado = true; S.baixa = null; } });
    d.addEventListener('click', ev => { if(ev.target === d) d.close(); });
    if(typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function corpoFolha(corpo, pe, alvo){
    const d = alvo || $('#folhas dialog'); if(!d || !d.isConnected) return;
    d.querySelector('.folha-corpo').innerHTML = corpo;
    const f = d.querySelector('.folha-pe');
    if(pe != null){ f.innerHTML = pe; f.hidden = !pe; }
    d.querySelector('.folha-corpo').scrollTop = 0;
  }
  function fecharFolhas(){ $$('#folhas dialog').forEach(d => { try{ d.close(); }catch(e){} d.remove(); }); }
  let toastT = null;
  function toast(m, ms){
    const t = $('#toast'); if(!t) return;
    t.textContent = m; t.hidden = false;
    if(t.showPopover){ try{ if(t.matches(':popover-open')) t.hidePopover(); t.showPopover(); }catch(e){} }
    clearTimeout(toastT);
    toastT = setTimeout(() => { if(t.hidePopover){ try{ t.hidePopover(); }catch(e){} } t.hidden = true; }, ms || 3200);
  }
  async function copiar(txt, ok){
    try{ await navigator.clipboard.writeText(txt); toast(ok || 'Copiado.'); return; }catch(e){}
    try{
      const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      (document.querySelector('dialog[open]') || document.body).appendChild(ta); ta.select(); const k = document.execCommand('copy'); ta.remove();
      if(k){ toast(ok || 'Copiado.'); return; }
    }catch(e){}
    toast('Não deu para copiar. Toque e segure no texto para copiar.', 5000);
  }

  // ================= eventos =================
  const nomeDaRota = () => { const m = /^#\/(p|tabelas|posts)\/([a-z0-9-]+)/.exec(location.hash), p = m && S.byId.get(m[2]); return p ? p.nome : ''; };
  const CAMPO_F = {'f-pmin': 'pmin', 'f-pmax': 'pmax', 'f-amin': 'amin', 'f-amax': 'amax', 'f-m2': 'm2'};
  function lerValor(s, campo){   // aceita 450, 450 mil, 1,5 mi, 450.000
    s = String(s || '').toLowerCase().replace(/r\$|\s/g, '');
    if(!s) return 0;
    let mult = 1;
    if(/mil$/.test(s)){ mult = 1e3; s = s.replace(/mil$/, ''); }
    else if(/(mi|milh[aãoõ]+(es)?|m)$/.test(s)){ mult = 1e6; s = s.replace(/(mi|milh[aãoõ]+(es)?|m)$/, ''); }
    let n = /,\d{1,2}$/.test(s) ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s.replace(/[.,]/g, ''));
    if(!isFinite(n) || n < 0) return 0;
    n *= mult;
    if(mult === 1){
      if(campo === 'f-pmin' || campo === 'f-pmax'){ if(n > 0 && n < 20) n *= 1e6; else if(n >= 20 && n < 10000) n *= 1e3; }
      if(campo === 'f-m2' && n > 0 && n < 100) n *= 1e3;
    }
    return Math.round(n);
  }
  const tog = (arr, x) => arr.includes(x) ? arr.filter(y => y !== x) : arr.concat([x]);
  document.addEventListener('click', async ev => {
    const el = ev.target.closest('[data-acao]'); if(!el) return;
    const a = el.dataset.acao, v = el.dataset.v, id = el.dataset.id;
    const f = S.f;
    switch(a){
      case 'focar-busca': S.focarBusca = true; break;
      case 'abrir-filtros':
        if(location.hash !== '#/imoveis'){ S.abrirFiltros = true; }
        else{ ev.preventDefault(); if(largo()){ const pn = $('#painel-f'); if(pn) pn.scrollIntoView({block: 'start', behavior: menosMov() ? 'auto' : 'smooth'}); } else abrirFiltros(); }
        break;
      case 'ver-fase': Object.assign(S.f, F0(), {fases: v.split(','), ver: 'projetos'}); S.scroll['#/imoveis'] = 0; salvarF(); break;
      case 'ver-cons': Object.assign(S.f, F0(), {cons: [v], ver: 'projetos'}); S.scroll['#/imoveis'] = 0; salvarF(); break;
      case 'rank': S.ui.rank = v; render(); break;
      case 'feed': S.ui.feed = v; S.ui.feedMostra = 14; render(); break;
      case 'mais-feed': S.ui.feedMostra += 20; render(); break;
      case 'recarregar': render(); break;
      case 'tentar': el.disabled = true; el.textContent = 'Tentando…'; carregar('inicio'); break;
      case 'voltar': if(history.length > 1 && S.veioDeDentro){ ev.preventDefault(); history.back(); } break;
      case 'fechar-folha': { const d = el.closest('dialog'); if(d) d.close(); break; }
      // ---- filtro
      case 'f-ver': f.ver = v; salvarF(); atualizarImoveis(); break;
      case 'limpar-q': f.q = ''; { const i = $('#q'); if(i){ i.value = ''; i.focus(); } } el.hidden = true; mudouFiltro(); break;
      case 'tirar': tirarFiltro(v); if(v === 'q'){ const i = $('#q'); if(i) i.value = ''; const l = $('.busca .limpar'); if(l) l.hidden = true; } mudouFiltro(); break;
      case 'limpar-tudo': Object.assign(S.f, F0(), {ver: f.ver, ordem: f.ordem === 'perto' ? 'vendidos' : f.ordem}); S.ui.bairroQ = ''; { const i = $('#q'); if(i) i.value = ''; } mudouFiltro(); break;
      case 'mais-res': f.mostra += 12; atualizarImoveis(); break;
      case 'mais-unid': S.ui.unidMostra = (S.ui.unidMostra || 40) + 60; atualizarImoveis(); break;
      case 'f': { const g = el.dataset.g; if(Array.isArray(f[g])){ f[g] = tog(f[g], v); mudouFiltro(); } break; }
      case 'f-modo': f.modo = v; mudouFiltro(); break;
      case 'f-pmax': { const x = +v; if(f.pmax === x && !f.pmin) f.pmax = 0; else { f.pmax = x; f.pmin = 0; } mudouFiltro(); break; }
      case 'f-area': { const [x, y] = v.split('-').map(Number); if(f.amin === x && f.amax === y){ f.amin = 0; f.amax = 0; } else { f.amin = x; f.amax = y; } mudouFiltro(); break; }
      case 'f-m2': f.m2 = f.m2 === +v ? 0 : +v; mudouFiltro(); break;
      case 'f-andar': f.andar = +v; mudouFiltro(); break;
      case 'f-vaga': f.vaga = +v; mudouFiltro(); break;
      case 'f-ent': f.ent = v; mudouFiltro(); break;
      case 'f-mov': f.mov = v; mudouFiltro(); break;
      case 'f-livres': f.livres = v === '1'; mudouFiltro(); break;
      case 'f-raio': if(f.perto){ f.perto.raio = +v; mudouFiltro(); } break;
      case 'f-perto': pedirLocal(); break;
      case 'f-perto-off': f.perto = null; if(f.ordem === 'perto') f.ordem = 'vendidos'; mudouFiltro(); break;
      case 'sel-u': {
        const k = el.dataset.p + '|' + el.dataset.n;
        if(S.sel.has(k)) S.sel.delete(k);
        else{
          if(S.sel.size >= 40){ toast('Até 40 unidades por link.'); break; }
          const projs = new Set([...S.sel.values()].map(x => x.p)); projs.add(el.dataset.p);
          if(projs.size > 15){ toast('Até 15 projetos por link.'); break; }
          S.sel.set(k, {p: el.dataset.p, n: el.dataset.n});
        }
        const on = S.sel.has(k); el.setAttribute('aria-pressed', on); const row = el.closest('.tu-lin'); if(row) row.classList.toggle('marcada', on);
        const bs = $('#barra-sel'), novo = barraSelHtml();
        if(bs){ if(novo) bs.outerHTML = novo; else bs.remove(); } else if(novo){ const r = $('#imv-res'); if(r) r.insertAdjacentHTML('beforeend', novo); }
        break;
      }
      case 'sel-limpar': S.sel.clear(); atualizarImoveis(); break;
      case 'enviar-sel': abrirEnvioMulti(); break;
      // ---- tabela
      case 'tab-tipo': S.ui.tabTipoPedido = v || ''; S.ui.tabFiltro = 'livres'; break;
      case 'tab-modo': S.ui.tabModo[id] = v; render(); break;
      case 'tab-fil': S.ui.tabFiltro = v; S.ui.tabMostra = 150; render(); break;
      case 'tab-tipo-f': S.ui.tabTipo = v || ''; S.ui.tabMostra = 150; render(); break;
      case 'tab-mais': S.ui.tabMostra = (S.ui.tabMostra || 150) + 200; atualizarTabela(); break;
      case 'tab-ck': {
        const s = S.ui.tabSel.get(id) || new Set(), n = el.dataset.n;
        if(s.has(n)) s.delete(n); else { if(s.size >= 40){ toast('Até 40 unidades por link.'); break; } s.add(n); }
        S.ui.tabSel.set(id, s); atualizarTabela(); break;
      }
      case 'tab-limpar': S.ui.tabSel.delete(id); atualizarTabela(); break;
      case 'tab-abrir': { const k = id + ':' + el.dataset.n; S.ui.tabAberta = S.ui.tabAberta === k ? null : k; atualizarTabela(); break; }
      // ---- espelho do prédio
      case 'tab-vista': S.ui.tabVista = v; LS.set('corretor-tab-vista', v); render(); break;
      case 'ef': { const ef = S.ui.ef; if(!ef) break; const k = el.dataset.k; const nv = v === '' || v == null ? null : (k === 'pmax' ? +v : v); ef[k] = String(ef[k]) === String(nv) ? null : nv; S.ui.tabMostra = 150; atualizarTabela(); break; }
      case 'ef-st': { const ef = S.ui.ef; if(!ef) break; ef.st = ef.st === v ? 'todos' : v; atualizarTabela(); break; }
      case 'ef-mov': if(S.ui.ef){ S.ui.ef.mov = !S.ui.ef.mov; atualizarTabela(); } break;
      case 'ef-final': if(S.ui.ef){ S.ui.ef.final = S.ui.ef.final === v ? null : v; atualizarTabela(); } break;
      case 'ef-limpar': if(S.ui.ef){ S.ui.ef = Object.assign(EF0(), {pid: S.ui.ef.pid}); S.ui.tabQ = ''; const i = $('[data-input="tab-q"]'); if(i) i.value = ''; atualizarTabela(); } break;
      case 'ef-mais': S.ui.efMais = !S.ui.efMais; atualizarTabela(); break;
      case 'esp-denso': S.ui.espDenso = !S.ui.espDenso; LS.set('corretor-esp-denso', S.ui.espDenso ? '1' : ''); atualizarTabela(); break;
      case 'esp-preco': S.ui.espPreco = S.ui.espPreco === false; atualizarTabela(); break;
      case 'esp-u': abrirUnidadeEsp(S.ui.tabProj, el.dataset.n); break;
      case 'un-marcar': {
        const s = S.ui.tabSel.get(id) || new Set();
        if(!s.has(el.dataset.n) && s.size >= 40){ toast('Até 40 unidades por link.'); break; }
        marcarUnidade(id, el.dataset.n); break;
      }
      case 'un-mandar': {
        if(!feAntesDeMandar(id, el.dataset.n)){ toast('Confira o fluxo antes de mandar.'); break; }
        const s = S.ui.tabSel.get(id) || new Set(); s.add(el.dataset.n); S.ui.tabSel.set(id, s); fecharFolhas(); atualizarTabela(); abrirEnvio(id, true); break;
      }
      case 'luz-un': abrirLuz(S.unLuz || [], +el.dataset.i || 0, nomeDaRota()); break;
      // ---- comparar
      case 'cp-tipo': if(S.cp){ S.cp.tipo = v; S.cp.fora = new Set(); if(v === 'escolha' && !S.cp.esc[0].pid && S.cp.pid) S.cp.esc[0] = {pid: S.cp.pid, n: S.cp.n}; render(); } break;
      case 'cp-motivo': if(S.cp){ S.cp.motivo = v; S.cp.fora = new Set(); render(); } break;
      case 'cp-modo': if(S.cp){ S.cp.modo = v; render(); } break;
      case 'cp-escolher': abrirEscolhaProjeto(el.dataset.slot); break;
      case 'cp-pick': {
        const cp = S.cp, sl = S.cpSlot; if(!cp) break;
        if(sl === 'ref'){ cp.pid = id; cp.n = null; cp.fora = new Set(); cp.inc = true; }
        else{ const i = +sl; if(cp.esc[i]){ cp.esc[i] = {pid: id, n: null}; cp.fora = new Set(); } }
        fecharFolhas(); render(); break;
      }
      case 'cp-incluir': if(S.cp){ if(el.dataset.orig === '1') S.cp.inc = !S.cp.inc; else { if(S.cp.fora.has(id)) S.cp.fora.delete(id); else S.cp.fora.add(id); } render(); } break;
      case 'cp-add': if(S.cp && S.cp.esc.length < 5){ S.cp.esc.push({pid: null, n: null}); render(); } break;
      case 'cp-tirar': if(S.cp && S.cp.esc.length > 2){ S.cp.esc.splice(+el.dataset.i, 1); render(); } break;
      case 'cp-mandar': abrirEnvioCmp(); break;
      case 'cp-espelho': S.ui.tabQ = el.dataset.n || ''; if(S.ui.tabProj !== id){ S.ui.tabProj = id; S.ui.tabFiltro = 'livres'; S.ui.tabMostra = 150; S.ui.tabAberta = null; S.ui.ef = null; S.ui.efMais = false; } break;
      case 'luz-cp': { const it = (S.cpItens || [])[+el.dataset.k]; if(it && it.pl) abrirLuz([{src: it.pl.src, t: it.m.p.nome + ', ' + it.pl.t}], 0, it.m.p.nome); break; }
      // ---- envio
      case 'enviar': ev.preventDefault(); abrirEnvio(id, el.dataset.sel === '1'); break;
      case 'env-modo': if(S.envio){ S.envio.modo = v; $$('[data-acao="env-modo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); } break;
      case 'env-fmt': if(S.envio){ S.envio.formato = v; $$('[data-acao="env-fmt"]').forEach(b => b.setAttribute('aria-checked', b.dataset.v === v)); const md = $('#env-modo-f'); if(md) md.hidden = v === 'pers'; } break;
      case 'env-criar': criarEnvio(); break;
      case 'env-copiar': { const m = $('#env-msg'); copiar(m ? m.value : (S.envioPronto || {}).msg, 'Mensagem com o link copiada.'); break; }
      case 'env-wa': { const m = $('#env-msg'); if(m) el.href = 'https://wa.me/?text=' + encodeURIComponent(m.value); break; }
      // ---- fotos do projeto
      case 'luz': abrirLuz(S.fotosAtuais, +el.dataset.i || 0, nomeDaRota()); break;
      case 'luz-planta': abrirLuz((S.plantasAtuais || []).map(pl => ({src: pl.src, t: pl.t + (pl.sub ? ', ' + pl.sub : '')})), +el.dataset.i || 0, nomeDaRota()); break;
      case 'luz-plantas-lazer': abrirLuz([{src: el.dataset.src, t: 'Planta do lazer'}], 0, nomeDaRota()); break;
      case 'luz-fechar': fecharLuz(); break;
      case 'luz-ant': irLuz(-1); break;
      case 'luz-prox': irLuz(1); break;
      case 'luz-baixar': baixarFotoLuz(); break;
      case 'luz-compartilhar': enviarFotoLuz(); break;
      // ---- baixar
      case 'menu-baixar': abrirBaixar(id); break;
      case 'baixar-fotos': prepararArquivos(id, 'fotos'); break;
      case 'enviar-fotos': prepararArquivos(id, 'enviar'); break;
      case 'baixar-plantas': prepararArquivos(id, 'plantas'); break;
      case 'pdf-ficha': imprimirFicha(id); break;
      case 'pdf-tabela': imprimirTabela(id); break;
      case 'planilha-tabela': baixarPlanilha(id); break;
      case 'share-pronto': if(S.pronto && S.pronto.files) compartilhar(S.pronto.files, S.pronto.texto || ''); break;
      case 'salvar-pronto': if(S.pronto && S.pronto.zip){ salvarBlob(S.pronto.zip, S.pronto.nomeZip); toast('Arquivo salvo.'); } break;
      case 'cancelar-baixa': { if(S.baixa){ S.baixa.cancelado = true; S.baixa = null; } const d = el.closest('dialog'); if(d) d.close(); break; }
      // ---- posts
      case 'post-fmt': if(S.post){ S.post.fmt = v; prepararPost(S.post.id); } break;
      case 'post-assunto': {
        if(!S.post || !S.post.det) break;
        S.post.assunto = v; const p = S.byId.get(S.post.id), t = textosPost(p, S.post.det, S.post.c, v);
        S.post.titulo = t.titulo; S.post.linha = t.linha; $('#post-titulo').value = t.titulo; $('#post-linha').value = t.linha;
        $$('[data-acao="post-assunto"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); desenharPost(); break;
      }
      case 'post-var': if(S.post){ S.post.var = v; $$('[data-acao="post-var"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); desenharPost(); } break;
      case 'post-foto': if(S.post){ S.post.foto = +el.dataset.i; S.post.local = null; $$('[data-acao="post-foto"]').forEach(b => b.setAttribute('aria-pressed', b === el)); desenharPost(); } break;
      case 'post-copiar': copiar($('#post-legenda').value, 'Legenda copiada.'); break;
      case 'post-baixar': if(S.post && S.post.blob){ salvarBlob(S.post.blob, nomeArquivoPost()); toast('Imagem salva.'); } else toast('A arte ainda está sendo montada. Tente de novo em um instante.'); break;
      case 'post-compartilhar': {
        if(!S.post || !S.post.blob){ toast('A arte ainda está sendo montada. Tente de novo em um instante.'); break; }
        const txt = $('#post-legenda').value;
        try{ if(navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {}); }catch(e){}
        compartilhar([new File([S.post.blob], nomeArquivoPost(), {type: 'image/jpeg'})], txt).then(ok => { if(ok) toast('A legenda também foi copiada. É só colar no post.', 4500); });
        break;
      }
      // ---- perfil
      case 'tema': LS.set(K.tema, v); aplicarTema(v); $$('[data-acao="tema"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); break;
      case 'sair': sair(''); break;
    }
  });
  const espera = {};
  const depois = (k, ms, fn) => { clearTimeout(espera[k]); espera[k] = setTimeout(fn, ms); };
  document.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.input; if(!k) return;
    if(k === 'q'){ S.f.q = el.value; const l = el.parentElement.querySelector('.limpar'); if(l) l.hidden = !el.value; depois('q', 160, mudouFiltro); }
    else if(k === 'fnum'){ const c = el.dataset.campo; depois('fnum', 450, () => { if(CAMPO_F[c]){ S.f[CAMPO_F[c]] = lerValor(el.value, c); mudouFiltro(); } }); }
    else if(k === 'bairro-q'){ S.ui.bairroQ = el.value; depois('bq', 120, () => { const fc = facetas(S.f); $$('#f-bairros').forEach(b => { b.innerHTML = bairrosChips(fc); }); }); }
    else if(k === 'lista'){ S.ui.listaQ = el.value; depois('lista', 120, () => atualizarLista(el.dataset.modo)); }
    else if(k === 'tab-q'){ S.ui.tabQ = el.value; depois('tq', 160, () => { atualizarTabela(); espRolarAchada(); }); }
    else if(k === 'cp-pq'){ depois('cpq', 120, () => { const l = $('#cp-lista'); if(l) l.innerHTML = cpListaProjHtml(el.value); }); }
    else if(k === 'post-texto'){ if(S.post){ S.post.titulo = $('#post-titulo').value; S.post.linha = $('#post-linha').value; depois('post', 160, desenharPost); } }
    else if(k === 'post-legenda'){ if(S.post) S.post.legenda = el.value; }
  });
  document.addEventListener('change', async ev => {
    const el = ev.target, k = el.dataset && el.dataset.input; if(!k) return;
    if(k === 'ordem'){ S.f.ordem = el.value; salvarF(); atualizarImoveis(); }
    else if(k === 'fnum'){ const c = el.dataset.campo, val = lerValor(el.value, c); if(CAMPO_F[c] && S.f[CAMPO_F[c]] !== val){ S.f[CAMPO_F[c]] = val; mudouFiltro(); } el.value = val ? val.toLocaleString('pt-BR') : ''; }
    else if(k === 'env-u'){ const n = $$('#env-us input:checked').length; if(n > 40){ el.checked = false; toast('Até 40 unidades por link.'); } }
    else if(k === 'cp-un'){ if(S.cp){ S.cp.n = el.value || null; S.cp.fora = new Set(); render(); } }
    else if(k === 'cp-raio'){ if(S.cp){ S.cp.raio = +el.value || 3; S.cp.fora = new Set(); render(); } }
    else if(k === 'cp-esc-un'){ if(S.cp){ const i = +el.dataset.i; if(S.cp.esc[i]){ S.cp.esc[i].n = el.value || null; render(); } } }
    else if(k === 'post-arquivo'){
      const arq = el.files && el.files[0]; if(!arq || !S.post) return;
      const im = await carregarImg(URL.createObjectURL(arq), false);
      if(im){ S.post.local = im; $$('[data-acao="post-foto"]').forEach(b => b.setAttribute('aria-pressed', 'false')); desenharPost().then(() => { const a = $('#post-aviso'); if(a && !a.textContent) a.textContent = 'Usando a foto do aparelho.'; }); }
      else toast('Não consegui abrir essa foto.');
    }
  });
  document.addEventListener('submit', ev => {
    if(ev.target.id === 'f-perfil'){
      ev.preventDefault();
      salvarPerfil({nome: $('#pf-nome').value.trim(), tel: $('#pf-tel').value.trim(), creci: $('#pf-creci').value.trim()});
      atualizarLateral(); toast('Perfil salvo.');
    }
  });
  document.addEventListener('keydown', ev => {
    if(S.luz && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight')){ ev.preventDefault(); irLuz(ev.key === 'ArrowLeft' ? -1 : 1); }
    if(ev.key === 'Enter' && ev.target && ev.target.dataset && ev.target.dataset.input === 'tab-q'){   // Enter no nº da unidade abre a ficha dela no espelho
      const q = norm(ev.target.value).trim(), ch = S.det.get(S.ui.tabProj), det = ch && ch.v;
      if(q && det && vistaTab(det) === 'espelho' && (det.dados.unidades || []).some(a => norm(a[0]) === q)){ ev.preventDefault(); abrirUnidadeEsp(S.ui.tabProj, (det.dados.unidades || []).find(a => norm(a[0]) === q)[0]); }
    }
  });
  window.addEventListener('hashchange', () => { S.veioDeDentro = true; fecharLuz(); });

  // ================= início =================
  aplicarTema(LS.get(K.tema) || 'escuro');
  try{ matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if((LS.get(K.tema) || 'escuro') === 'sistema') aplicarTema('sistema'); }); }catch(e){}
  if(S.cod){
    const c = cacheLido();
    if(c && Date.now() - c.em < 6 * 3600e3){ aplicarResumo(c.r); S.cacheEm = c.em; render(); }
    carregar('inicio');
  }else render();
  setInterval(() => { if(document.visibilityState === 'visible' && S.cod && navigator.onLine !== false) carregar('auto'); }, 60000);
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible' && S.cod && Date.now() - (S.geradoEm || 0) > 45000) carregar('auto'); });
  window.addEventListener('online', () => { if(S.cod) carregar('auto'); });

  if('serviceWorker' in navigator && location.protocol === 'https:'){
    navigator.serviceWorker.register('sw.js').then(reg => { reg.update().catch(() => {}); }).catch(() => {});
    const tinha = !!navigator.serviceWorker.controller;
    let recarregou = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(!tinha || recarregou) return;
      const ae = document.activeElement;
      if(document.querySelector('dialog[open]') || S.baixa || /^#\/posts\//.test(location.hash) || (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName))) return;
      recarregou = true; location.reload();
    });
  }
})();
