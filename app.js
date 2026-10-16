/* App do Corretor · Fortal
   Lê os espelhos ao vivo (Supabase do app dos Espelhos) com o código do time.
   Telas: Início, Imóveis, Pregão, Ficha do projeto, Tabelas, Posts e envio ao cliente. */
'use strict';
(() => {
  // ================= configuração =================
  const CFG = {url: 'https://dptchfjbotmddaniuzvr.supabase.co', key: 'sb_publishable_K9--vOhW8y5ldlbwzo6m_Q_g_gB9rYP'};
  const NO_AR = location.hostname === 'luizmiguel08.github.io';
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);   // teste local: espelho copiado em /espelhos/
  const ESP = (NO_AR || LOCAL) ? '/espelhos/' : 'https://luizmiguel08.github.io/espelhos/';
  const VERSAO = '1.0 · 15/10/2026';
  const K = {cod: 'espelhos-codigo', cor: 'espelhos-corretor', dono: 'espelhos-dono', cache: 'corretor-resumo-v1', tema: 'corretor-tema'};
  const TZ = 'America/Sao_Paulo';

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
  const fmtM2 = v => (Number.isInteger(+v) ? String(+v) : (+v).toLocaleString('pt-BR', {maximumFractionDigits: 2})) + ' m²';
  const pct = (a, b) => b > 0 ? Math.round(a / b * 1000) / 10 : 0;
  const pctTxt = v => v.toLocaleString('pt-BR', {maximumFractionDigits: 1}) + '%';
  const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const fH = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, hour: '2-digit', minute: '2-digit'});
  const fDia = new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'});
  const fDM = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, day: '2-digit', month: '2-digit'});
  const fLonga = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long'});
  const fSem = new Intl.DateTimeFormat('pt-BR', {timeZone: TZ, weekday: 'short'});
  const fHoraNum = new Intl.DateTimeFormat('en-GB', {timeZone: TZ, hour: '2-digit', hour12: false});
  const hora = ms => fH.format(ms);
  const diaKey = ms => fDia.format(ms);
  const maiusc1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const quandoTxt = ms => {
    const d = diaKey(ms), h = diaKey(Date.now()), o = diaKey(Date.now() - 864e5);
    return d === h ? hora(ms) : d === o ? 'ontem ' + hora(ms) : fDM.format(ms) + ' ' + hora(ms);
  };
  const mesAno = ym => { if(!ym || !/^\d{4}-\d{2}/.test(ym)) return null; return MESES[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4); };
  const mesAnoCurto = ymd => { if(!ymd || !/^\d{4}-\d{2}/.test(ymd)) return ''; return MES3[+ymd.slice(5, 7) - 1] + '/' + ymd.slice(0, 4); };
  const primeiroNome = s => String(s || '').trim().split(/\s+/)[0] || '';
  const urlImg = u => { if(!u) return null; u = String(u); if(/^https:\/\//i.test(u)) return u; if(/^nex\//.test(u)) return ESP + u; return null; };
  const urlSegura = u => /^https:\/\//i.test(String(u || '')) ? String(u) : null;
  const driveArq = id => 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view';
  const drivePasta = id => 'https://drive.google.com/drive/folders/' + encodeURIComponent(id);

  const ICO = {
    voltar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    filtro: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
    enviar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/></svg>',
    fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    x: '<svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19z"/></svg>',
    nuvem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5.5 12a11 11 0 0 1 13 0"/><path d="M9 15.5a6 6 0 0 1 6 0"/><path d="M3 3l18 18"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    foto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></svg>',
    baixar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>'
  };

  const GRUPOS = {
    one: {n: 'ONE', l: 'ONE Innovation', s: 'ONE'}, vitacon: {n: 'Vitacon', l: 'Vitacon', s: 'VTC'}, maskan: {n: 'Maskan', l: 'Maskan', s: 'MSK'},
    trisul: {n: 'Trisul', l: 'Trisul', s: 'TRI'}, canopus: {n: 'Canopus', l: 'Canopus', s: 'CNP'}, vitaurbana: {n: 'VitaUrbana', l: 'VitaUrbana', s: 'VU'},
    jra: {n: 'JRA', l: 'JRA', s: 'JRA'}, revenda: {n: 'Revenda ONE', l: 'Revenda ONE', s: 'REV'}
  };
  const ORDEM_GRUPOS = ['one', 'vitacon', 'maskan', 'trisul', 'canopus', 'vitaurbana', 'jra', 'revenda'];
  const FASE = {lanc: 'Lançamento', breve: 'Breve lançamento', obras: 'Em obras', pronto: 'Pronto para morar'};
  const FASE_MIN = {lanc: 'lançamento', breve: 'breve lançamento', obras: 'em obras', pronto: 'pronto para morar'};
  const ZONA = {centro: 'Centro', oeste: 'Oeste', sul: 'Sul', leste: 'Leste', norte: 'Norte', gsp: 'Grande SP'};
  const quemDe = p => p.construtora || (GRUPOS[p.grupo] ? GRUPOS[p.grupo].l : '');
  const siglaDe = p => GRUPOS[p.grupo] ? GRUPOS[p.grupo].s : String(p.nome || '?').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
  const nomeCurto = p => p.curto || p.nome;
  const NOS_B = /^(jardins|campos el[ií]seos)$/i;
  const NA_B = /^(vila|bela vista|consola|liberdade|mooca|lapa|penha|aclima|barra funda|sa[uú]de|[aá]gua branca|rep[uú]blica|s[eé]$|luz|ch[aá]cara|granja|cidade|pra[cç]a|aldeia)/i;
  const EM_B = /^(mirand[oó]polis|perdizes|pinheiros|moema|higien[oó]polis|santana|campos el[ií]seos|pomp[eé]ia|indian[oó]polis|interlagos|santa cec[ií]lia|santo amaro|alphaville|osasco|guarulhos|barueri|cotia|cerqueira c[eé]sar|parelheiros|guaianases|itaquera|sapopemba)/i;
  const noBairro = b => b ? (NOS_B.test(b) ? 'nos ' : NA_B.test(b) ? 'na ' : EM_B.test(b) ? 'em ' : 'no ') + b : '';
  const entregaTxt = p => p.fase === 'pronto' ? 'pronto para morar' : (mesAno(p.entrega) ? 'entrega em ' + mesAno(p.entrega) : 'entrega a definir');
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

  // ================= estado =================
  const S = {
    cod: LS.get(K.cod), carregado: false, offline: false, carregando: null, resumo: null, geradoEm: 0,
    P: [], byId: new Map(), M: [], dias7: [], hoje: '', stats: null,
    det: new Map(), central: new Map(),
    f: Object.assign({q: '', cons: [], fases: [], teto: 0, dorms: [], ate: 0, zonas: [], area: 0, livres: true, ordem: 'vendidos', mostra: 8}, SS.get('corretor-f') || {}),
    ui: {rank: 'vendas', feed: 'tudo', feedMostra: 12, tabModo: {}, tabFiltro: 'livres', tabSel: new Map(), tabAberta: null, listaQ: ''},
    scroll: {}
  };
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
  const semRede = e => !(e && e.status);

  function aplicarResumo(r){
    const cp = r.campos_p || [], cm = r.campos_m || [];
    const ip = Object.fromEntries(cp.map((k, i) => [k, i])), im = Object.fromEntries(cm.map((k, i) => [k, i]));
    const g = (a, k) => ip[k] == null ? null : a[ip[k]];
    S.P = (r.p || []).map(a => ({
      id: g(a, 'id'), nome: g(a, 'nome') || g(a, 'id'), grupo: g(a, 'grupo'), construtora: g(a, 'construtora'), bairro: g(a, 'bairro'), zona: g(a, 'zona'),
      fase: g(a, 'fase'), entrega: g(a, 'entrega'), livres: +g(a, 'livres') || 0, reservadas: +g(a, 'reservadas') || 0, processo: +g(a, 'processo') || 0,
      vendidas: +g(a, 'vendidas') || 0, total: +g(a, 'total') || 0, preco: num(g(a, 'preco')), avista: num(g(a, 'avista')), tipos: g(a, 'tipos') || '',
      amin: num(g(a, 'area_min')), amax: num(g(a, 'area_max')), capa: urlSegura(g(a, 'capa')), destaque: g(a, 'destaque'), tabela: g(a, 'tabela'),
      tabelaEm: g(a, 'tabela_em'), faseTxt: g(a, 'fase_txt'), curto: g(a, 'curto'), endereco: g(a, 'endereco'), atualizadoEm: g(a, 'atualizado_em'),
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
        if(motivo === 'auto'){ if(assinatura() !== antes) refrescar(); }
        else if(antes === null || rotaAtual === null) render();
        else if(assinatura() !== antes) refrescar();
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

  async function detalhe(id, forcar){
    const c = S.det.get(id);
    if(c && !forcar && (c.pr || Date.now() - c.em < 60000)) return c.pr || c.v;
    const pr = rpc('corretor_projeto', {p_codigo: S.cod, p_id: id}).then(v => { S.det.set(id, {v, em: Date.now()}); return v; })
      .catch(e => { if(c && c.v){ S.det.set(id, c); return c.v; } S.det.delete(id); throw e; });
    S.det.set(id, {pr, v: c && c.v, em: c ? c.em : 0});
    return pr;
  }
  S.centralV = new Map();   // fichas já lidas (null = o projeto não tem ficha na central)
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

  // ================= imagens =================
  function imgTag(src, alt, cls, extra){
    if(!src) return '';
    const ext = /^https?:/i.test(src) && !src.startsWith(location.origin);
    return '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '"' + (cls ? ' class="' + cls + '"' : '') + ' loading="lazy" decoding="async"' + (ext ? ' referrerpolicy="no-referrer"' : '') + (extra || '') + '>';
  }
  document.addEventListener('error', ev => {   // foto que não abriu vira a sigla da construtora
    const t = ev.target;
    if(!t || t.tagName !== 'IMG' || t.dataset.falhou) return;
    t.dataset.falhou = '1';
    if(t.dataset.troca){ const alt = t.dataset.troca; t.removeAttribute('data-troca'); t.dataset.falhou = ''; t.src = alt; return; }
    if(t.dataset.sigla != null){
      const d = document.createElement('div'); d.className = t.dataset.siglaCls || 'sigla'; d.textContent = t.dataset.sigla; d.setAttribute('aria-hidden', 'true');
      t.replaceWith(d);
    }else t.style.visibility = 'hidden';
  }, true);
  const fotoProj = (p, cls, sigCls) => p.capa ? imgTag(p.capa, '', cls, ' data-sigla="' + esc(siglaDe(p)) + '" data-sigla-cls="' + (sigCls || 'sigla') + '"') : '<div class="' + (sigCls || 'sigla') + '" aria-hidden="true">' + esc(siglaDe(p)) + '</div>';

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
    [/^#\/perfil$/, 'inicio', () => telaPerfil()]
  ];
  let rotaAtual = null;
  function render(){
    const app = $('#app');
    if(!S.cod){ $('#nav').hidden = true; rotaAtual = null; app.innerHTML = telaPortao(); ligarPortao(); return; }
    if(!S.carregado){
      $('#nav').hidden = true;
      if(S.offline) app.innerHTML = '<section class="portao"><img src="img/logo-fortal.png" alt="Fortal" width="160"><h1 class="h1-forte">Sem conexão</h1><p class="texto-2">Não consegui ler os espelhos e ainda não há nada salvo neste celular. Confira a internet e tente de novo.</p><button type="button" class="btn btn-pri btn-alto" data-acao="tentar">Tentar de novo</button></section>';
      return;
    }
    $('#nav').hidden = false;
    const h = location.hash || '#/';
    let achou = null;
    for(const [re, aba, fn] of ROTAS){ const m = h.match(re); if(m){ achou = {aba, fn, arg: m[1]}; break; } }
    if(!achou){ location.replace('#/'); return; }
    const mesma = rotaAtual === h;
    if(!mesma && rotaAtual) S.scroll[rotaAtual] = window.scrollY;
    const y = mesma ? window.scrollY : (S.scroll[h] || 0);
    rotaAtual = h;
    $$('#nav a').forEach(a => { if(a.dataset.aba === achou.aba) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    pos.length = 0;
    const html = achou.fn(achou.arg);
    if(html == null) return;
    const ROLOS = '.rolo,.pilulas.rola,.escolha-fotos,.miniaturas,.fotos-linha,#gal';
    const lados = mesma ? $$(ROLOS, app).map(e => e.scrollLeft) : [];
    app.innerHTML = (S.offline ? faixaOffline() : '') + '<div' + (mesma ? '' : ' class="vista"') + '>' + html + '</div>';
    depoisDeRender();
    if(lados.length) $$(ROLOS, app).forEach((e, i) => { if(lados[i]) e.scrollLeft = lados[i]; });
    window.scrollTo(0, y);
  }
  // atualização automática: não mexe em campo com foco, folha aberta, ficha ou post
  function refrescar(){
    if(!S.carregado || !S.cod) return render();
    if(document.querySelector('dialog[open]')) return;
    const h = location.hash || '#/';
    if(h === '#/imoveis') return atualizarImoveis();
    if(h === '#/tabelas' || h === '#/posts') return atualizarLista(h.slice(2));
    if(/^#\/(p|tabelas|posts)\//.test(h) || h === '#/perfil') return;
    const ae = document.activeElement; if(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    render();
  }
  const assinatura = () => S.M.length + ':' + (S.M[0] ? S.M[0].em + S.M[0].n : '') + ':' + S.P.reduce((s, p) => s + p.livres * 3 + p.reservadas * 7 + p.vendidas, 0) + ':' + (S.offline ? 1 : 0);
  function faixaOffline(){
    const em = S.cacheEm || S.geradoEm;
    return '<div class="faixa-aviso"><div class="aviso" role="status">' + ICO.nuvem + '<p style="margin:0">Sem internet. Você está vendo o que ficou salvo no celular' + (em ? ' às ' + hora(em) + (diaKey(em) !== S.hoje ? ' de ' + fDM.format(em) : '') : '') + '. Preço e unidades livres podem ter mudado.</p></div></div>';
  }
  const pos = [];   // ações a rodar depois de pintar a tela
  function depoisDeRender(){ const fs = pos.splice(0); fs.forEach(f => { try{ const r = f(); if(r && r.catch) r.catch(e => console.error(e)); }catch(e){ console.error(e); } }); }
  window.addEventListener('hashchange', () => { fecharFolhas(); render(); });

  // ================= portão (código do time) =================
  function telaPortao(msg){
    msg = msg || S.msgPortao || '';
    return '<section class="portao">' +
      '<img src="img/logo-fortal.png" alt="Fortal Inteligência Imobiliária" width="160">' +
      '<h1 class="h1-forte">App do Corretor</h1>' +
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
      }catch(e){
        b.disabled = false; b.textContent = 'Entrar';
        $('#cod-erro').textContent = codigoInvalido(e) ? 'Código errado. Confira com o Luiz e tente de novo.' : 'Sem conexão com o servidor agora. Confira a internet e tente de novo.';
      }
    });
  }
  function sair(msg){
    S.cod = null; LS.del(K.cod); S.carregado = false; S.msgPortao = msg || '';
    fecharFolhas(); render();
  }

  // ================= INÍCIO =================
  function saudacao(){ const h = +fHoraNum.format(Date.now()); return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
  function fitaHtml(){
    const itens = S.M.slice(0, 16);
    if(!itens.length) return '';
    const item = m => { const p = S.byId.get(m.p); return '<span class="fita-item"><span class="h">' + esc(hora(m.em)) + '</span><b>' + esc(nomeCurto(p)) + ' ' + esc(m.n) + '</b><span class="' + statusCls(m) + '" style="font-weight:600">' + esc(statusTxt(m)) + '</span>' + (m.preco ? '<span class="v">' + esc(BRLc(m.preco)) + '</span>' : '') + '</span>'; };
    const grupo = itens.map(item).join('');
    const dur = Math.max(30, itens.length * 6);
    return '<a class="fita" href="#/pregao" aria-label="Pregão ao vivo: últimas unidades vendidas e reservadas nos espelhos. Abrir o pregão">' +
      '<span class="fita-rot"><span class="ponto"><i class="pulso"></i><i></i></span>AO VIVO</span>' +
      '<span class="fita-trilho" style="--dur:' + dur + 's"><span class="fita-grupo">' + grupo + '</span><span class="fita-grupo" aria-hidden="true">' + grupo + '</span></span></a>';
  }
  function telaInicio(){
    const pf = perfil(), st = stats(), nome = primeiroNome(pf.nome);
    const ini = (nome || 'F').charAt(0).toUpperCase();
    let h = '<header class="topo"><img class="logo" src="img/logo-fortal.png" alt="Fortal Inteligência Imobiliária" width="45" height="46">' +
      '<a class="avatar" href="#/perfil" aria-label="Seu perfil e ajustes"><span>' + esc(ini) + '</span></a></header>';
    h += fitaHtml();
    h += '<section class="saud"><h1 class="h1">' + esc(saudacao() + (nome ? ', ' + nome : '')) + '</h1>' +
      '<p class="sub">' + esc(maiusc1(fLonga.format(Date.now()).replace('-feira', ''))) + '. Espelhos lidos às ' + esc(hora(S.lidoEm)) + (diaKey(S.lidoEm) !== S.hoje ? ' de ' + esc(fDM.format(S.lidoEm)) : '') + '.</p></section>';
    h += '<div class="busca-linha"><a class="busca" href="#/imoveis" data-acao="focar-busca">' + ICO.lupa + '<span>Projeto, bairro, rua ou metrô</span></a>' +
      '<a class="btn-filtro" href="#/imoveis" data-acao="abrir-filtros" aria-label="Filtros: preço, dormitórios, metragem, entrega e região">' + ICO.filtro + '</a></div>';
    // placar
    const semPreco = st.vend7 - st.vend7Preco;
    h += '<section class="placar" aria-labelledby="placar-t"><h2 id="placar-t" class="rotulo">VGV vendido nos espelhos em 7 dias</h2>' +
      '<p class="grande' + (st.vgv7 ? '' : ' zero') + '">' + esc(BRLmi(st.vgv7)) + '</p>' +
      '<p class="texto"><strong>' + esc(plural(st.vend7, 'unidade vendida', 'unidades vendidas')) + '</strong>, mais ' + esc(plural(st.res7, 'reserva', 'reservas')) + ' e ' + esc(plural(st.proc7, 'contrato em processo', 'contratos em processo')) + '.</p>' +
      '<a class="pilula" style="align-self:flex-start;margin-top:10px" href="#/pregao">Abrir o pregão de hoje ' + ICO.seta.replace('<svg', '<svg width="18" height="18"') + '</a>' +
      (st.vend7 ? '<p class="nota">Soma do preço de tabela ' + (semPreco ? 'de ' + st.vend7Preco + ' das ' + st.vend7 + ' vendas. ' + (semPreco === 1 ? 'A outra não tem preço no espelho.' : 'As outras ' + semPreco + ' não têm preço no espelho.') : (st.vend7 === 1 ? 'da venda.' : 'das ' + st.vend7 + ' vendas.')) + '</p>' : '') +
      '</section>';
    // destaque
    const rank = rankingDe('vendas');
    const top = rank[0] || S.P.filter(p => p.livres > 0 && (p.fase === 'lanc' || p.fase === 'breve'))[0];
    if(top) h += heroHtml(top);
    // ranking
    const modo = S.ui.rank, lst = rankingDe(modo).slice(0, 5);
    if(lst.length){
      h += '<section class="sec" aria-labelledby="rank-t"><div class="sec-cab"><h2 class="h2" id="rank-t">Quem mais vende</h2><span class="sub">últimos 7 dias</span></div>' +
        '<div class="seg" role="group" aria-label="Ordenar o ranking" style="margin-top:12px">' +
        ['vendas', 'reservas'].map(k => '<button type="button" data-acao="rank" data-v="' + k + '" aria-pressed="' + (modo === k) + '">' + (k === 'vendas' ? 'Vendas' : 'Reservas') + '</button>').join('') + '</div>' +
        '<ol class="ranking">' + lst.map((p, i) => {
          const n = modo === 'reservas' ? p.r7 : p.v7;
          return '<li><a href="#/p/' + esc(p.id) + '"><span class="pos">' + (i + 1) + '</span>' + fotoProj(p, 'miniatura') +
            '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span></span>' +
            '<span class="fim"><b class="' + (modo === 'vendas' ? 'ouro' : '') + '">' + n + '</b><span>' + (modo === 'vendas' ? (n === 1 ? 'venda' : 'vendas') : (n === 1 ? 'reserva' : 'reservas')) + '</span></span></a></li>';
        }).join('') + '</ol>' +
        '<a class="link-mais" href="#/pregao">Ver o ranking dos 10 ' + ICO.seta + '</a></section>';
    }
    // carrosséis
    const vivos = S.P.filter(p => p.livres > 0);
    const ord = (a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || ((a.preco || 1e12) - (b.preco || 1e12));
    const lanc = vivos.filter(p => p.fase === 'lanc' || p.fase === 'breve').sort(ord);
    const obras = vivos.filter(p => p.fase === 'obras').sort(ord);
    const prontos = vivos.filter(p => p.fase === 'pronto').sort(ord);
    if(lanc.length) h += '<section class="sec" style="padding-left:0;padding-right:0" aria-labelledby="lanc-t"><div class="sec-cab" style="padding:0 16px"><h2 class="h2" id="lanc-t">Lançamentos <span class="q">' + lanc.length + '</span></h2><a class="link-mais" href="#/imoveis" data-acao="ver-fase" data-v="lanc,breve">Ver todos</a></div>' +
      '<div class="rolo" style="margin-top:14px">' + lanc.slice(0, 10).map(cardAlto).join('') + '</div></section>';
    if(obras.length) h += carrosselPeq('Em obras', 'obras-t', obras, 'obras');
    if(prontos.length) h += carrosselPeq('Prontos para morar', 'pront-t', prontos, 'pronto');
    // construtoras
    const porG = {}; for(const p of vivos){ const k = p.grupo || '_'; porG[k] = (porG[k] || 0) + 1; }
    const gs = ORDEM_GRUPOS.filter(k => porG[k]).concat(Object.keys(porG).filter(k => k !== '_' && !ORDEM_GRUPOS.includes(k)));
    h += '<section class="sec" aria-labelledby="cons-t" style="padding-bottom:12px"><h2 class="h2" id="cons-t">Por construtora</h2><div class="pilulas" style="margin-top:12px">' +
      gs.map(k => '<a class="pilula" href="#/imoveis" data-acao="ver-cons" data-v="' + esc(k) + '">' + esc(GRUPOS[k] ? GRUPOS[k].n : k) + '<span class="n">' + porG[k] + '</span></a>').join('') + '</div></section>';
    return h;
  }
  function heroHtml(p){
    const c = S.centralV.get(p.id);
    if(c === undefined) pos.push(() => trocarHeroCentral(p));
    const src = c && c.hero ? imgCentral(c, c.hero) : p.capa;
    const img = src ? imgTag(src, 'Foto do ' + p.nome, 'bg', ' id="hero-img" fetchpriority="high"') : '';
    const tip = tiposTxt(p.tipos, p.amin, p.amax);
    const linha2 = [p.avista && p.preco && p.avista < p.preco ? 'ou ' + BRL(p.avista) + ' à vista.' : '', tip ? tip + ', ' + entregaTxt(p) + '.' : maiusc1(entregaTxt(p)) + '.'].filter(Boolean).join(' ');
    return '<section class="foto-hero" aria-labelledby="hero-t">' + img + '<div class="veu-hero" aria-hidden="true"></div>' +
      (p.v7 ? '<p class="selo">1º em vendas na semana</p>' : '') +
      '<div class="hero-txt"><p class="onde">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</p>' +
      '<h2 id="hero-t"><a href="#/p/' + esc(p.id) + '">' + esc(p.nome) + '</a></h2>' +
      (p.preco ? '<p class="hero-preco"><span>Tabela a partir de</span><b>' + esc(BRL(p.preco)) + '</b></p>' : '<p class="hero-preco"><span>Tabela ainda não publicada</span></p>') +
      '<p class="l">' + esc(linha2) + '</p>' +
      '<p class="l"><strong>' + esc(plural(p.v7, 'vendida', 'vendidas')) + '</strong> e ' + esc(plural(p.r7, 'reservada', 'reservadas')) + ' em 7 dias, ' + esc(plural(p.livres, 'livre', 'livres')) + '.</p>' +
      '<div class="btn-linha desigual" style="margin-top:12px"><button type="button" class="btn btn-pri" data-acao="enviar" data-id="' + esc(p.id) + '">' + ICO.enviar + 'Mandar pro cliente</button>' +
      '<a class="btn" href="#/p/' + esc(p.id) + '">Ver projeto</a></div></div></section>';
  }
  async function trocarHeroCentral(p){
    const c = await fichaCentral(p.id);
    if(!c || !c.hero) return;
    const im = $('#hero-img'), src = imgCentral(c, c.hero);
    if(im && src && im.getAttribute('src') !== src){ const n = new Image(); n.onload = () => { const a = $('#hero-img'); if(a) a.src = src; }; n.src = src; }
    else if(!im && src){ const s = $('.foto-hero'); if(s){ s.insertAdjacentHTML('afterbegin', imgTag(src, 'Foto do ' + p.nome, 'bg', ' id="hero-img"')); } }
  }
  function cardAlto(p){
    return '<a class="card-alto" href="#/p/' + esc(p.id) + '">' + (p.capa ? imgTag(p.capa, 'Foto do ' + p.nome, '', ' data-sigla="' + esc(siglaDe(p)) + '" data-sigla-cls="sigla"') : '') +
      '<span class="veu" aria-hidden="true"></span><span class="txt"><span class="quem">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
      '<span class="nome">' + esc(p.nome) + '</span>' +
      (p.preco ? '<span class="rot">Tabela a partir de</span><span class="preco">' + esc(BRL(p.preco)) + '</span>' : '<span class="preco sem">Tabela a publicar</span>') +
      '<span class="info">' + esc([plural(p.livres, 'livre', 'livres'), p.v7 ? plural(p.v7, 'venda', 'vendas') + ' na semana' : entregaTxt(p)].join(', ')) + '</span></span></a>';
  }
  function carrosselPeq(titulo, idT, lista, fase){
    return '<section class="sec" style="padding-left:0;padding-right:0" aria-labelledby="' + idT + '"><div class="sec-cab" style="padding:0 16px"><h2 class="h2" id="' + idT + '">' + esc(titulo) + ' <span class="q">' + lista.length + '</span></h2><a class="link-mais" href="#/imoveis" data-acao="ver-fase" data-v="' + fase + '">Ver todos</a></div>' +
      '<div class="rolo" style="margin-top:14px">' + lista.slice(0, 10).map(p => '<a class="card-peq" href="#/p/' + esc(p.id) + '">' + fotoProj(p, 'ft', 'sigla-g') +
        '<b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
        (p.preco ? '<span class="preco">' + esc(BRL(p.preco)) + '</span>' : '<span>Tabela a publicar</span>') +
        '<span>' + esc(plural(p.livres, 'livre', 'livres') + (p.v7 ? ', ' + plural(p.v7, 'venda', 'vendas') + ' na semana' : '')) + '</span></a>').join('') + '</div></section>';
  }

  // ================= IMÓVEIS =================
  const precoDe = p => p.preco != null ? p.preco : p.avista;
  function passa(p, ignora){
    const f = S.f;
    if(f.livres && !p.livres) return false;
    if(ignora !== 'cons' && f.cons.length && !f.cons.includes(p.grupo)) return false;
    if(ignora !== 'fase' && f.fases.length && !f.fases.includes(p.fase)) return false;
    if(ignora !== 'teto' && f.teto){ const v = precoDe(p); if(v == null || v > f.teto) return false; }
    if(f.dorms.length && !f.dorms.some(x => p.tipos.includes(x))) return false;
    if(f.ate && p.fase !== 'pronto'){ if(!p.entrega || +p.entrega.slice(0, 4) > f.ate) return false; }
    if(ignora !== 'zona' && f.zonas.length && !f.zonas.includes(p.zona)) return false;
    if(f.area && !(p.amax && p.amax >= f.area)) return false;
    if(f.q){
      const termos = norm(f.q).split(/\s+/).filter(Boolean);
      if(termos.length){
        const alvo = norm([p.nome, p.curto, p.bairro, p.endereco, p.destaque, quemDe(p), GRUPOS[p.grupo] ? GRUPOS[p.grupo].n : '', ZONA[p.zona] ? 'zona ' + ZONA[p.zona] : ''].join(' '));
        if(!termos.every(t => alvo.includes(t))) return false;
      }
    }
    return true;
  }
  const ORDENS = {
    vendidos: (a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || (b.livres - a.livres),
    preco: (a, b) => ((precoDe(a) == null ? 1e12 : precoDe(a)) - (precoDe(b) == null ? 1e12 : precoDe(b))),
    entrega: (a, b) => { const k = p => p.fase === 'pronto' ? '0000' : (p.entrega || '9999'); return k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : (b.v7 - a.v7); },
    estoque: (a, b) => (b.livres - a.livres)
  };
  const salvarF = () => SS.set('corretor-f', Object.assign({}, S.f, {mostra: 8}));
  function nFiltrosFolha(){ const f = S.f; return (f.teto ? 1 : 0) + f.dorms.length + (f.area ? 1 : 0) + (f.ate ? 1 : 0) + f.zonas.length + (f.livres ? 0 : 1); }
  function telaImoveis(){
    const f = S.f, n = nFiltrosFolha();
    pos.push(() => { atualizarImoveis(); if(S.focarBusca){ S.focarBusca = false; const i = $('#q'); if(i){ i.focus(); } } if(S.abrirFiltros){ S.abrirFiltros = false; abrirFiltros(); } });
    return '<header style="padding:18px 16px 0"><h1 class="h1-forte">Imóveis</h1><p class="sub" id="imv-sub">' + esc(S.P.length + ' projetos nos espelhos, ao vivo') + '</p></header>' +
      '<div class="busca-linha"><label class="busca"><span class="sr">Buscar projeto, bairro, rua ou metrô</span>' + ICO.lupa +
      '<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Projeto, bairro, rua ou metrô" value="' + esc(f.q) + '" data-input="q">' +
      '<button type="button" class="limpar" data-acao="limpar-q" aria-label="Limpar a busca"' + (f.q ? '' : ' hidden') + '>' + ICO.fechar.replace('<svg', '<svg width="18" height="18"') + '</button></label>' +
      '<button type="button" class="btn-filtro' + (n ? ' ligado' : '') + '" id="btn-filtros" data-acao="abrir-filtros" aria-label="' + (n ? 'Filtros, ' + n + (n === 1 ? ' ligado' : ' ligados') : 'Filtros') + '">' + ICO.filtro + (n ? '<span class="bolha" aria-hidden="true">' + n + '</span>' : '') + '</button></div>' +
      '<div id="imv-chips" style="padding:14px 16px 0;display:flex;flex-direction:column;gap:10px"></div>' +
      '<div class="contagem"><p id="imv-n" aria-live="polite"></p><label class="sr" for="ordem">Ordenar por</label>' +
      '<select id="ordem" data-input="ordem" class="pilula peq" style="padding-right:8px;background:var(--sup)">' +
      [['vendidos', 'Mais vendidos'], ['preco', 'Menor preço'], ['entrega', 'Entrega mais cedo'], ['estoque', 'Mais unidades livres']].map(o => '<option value="' + o[0] + '"' + (f.ordem === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '<div id="imv-res"></div>';
  }
  function atualizarImoveis(){
    const box = $('#imv-res'); if(!box) return;
    const f = S.f;
    const res = S.P.filter(p => passa(p)).sort(ORDENS[f.ordem] || ORDENS.vendidos);
    // chips de construtora e fase
    const baseC = S.P.filter(p => passa(p, 'cons'));
    const gs = ORDEM_GRUPOS.filter(k => S.P.some(p => p.grupo === k));
    const chipC = '<div class="pilulas rola" role="group" aria-label="Construtora">' +
      '<button type="button" class="pilula peq" data-acao="cons" data-v="" aria-pressed="' + (!f.cons.length) + '">Todas<span class="n">' + baseC.length + '</span></button>' +
      gs.map(k => '<button type="button" class="pilula peq" data-acao="cons" data-v="' + k + '" aria-pressed="' + f.cons.includes(k) + '">' + esc(GRUPOS[k].n) + '<span class="n">' + baseC.filter(p => p.grupo === k).length + '</span></button>').join('') + '</div>';
    const baseF = S.P.filter(p => passa(p, 'fase'));
    const chipF = '<div class="pilulas rola" role="group" aria-label="Fase da obra">' +
      '<button type="button" class="pilula peq" data-acao="fase" data-v="" aria-pressed="' + (!f.fases.length) + '">Todas as fases</button>' +
      ['lanc', 'breve', 'obras', 'pronto'].map(k => '<button type="button" class="pilula peq" data-acao="fase" data-v="' + k + '" aria-pressed="' + f.fases.includes(k) + '">' + esc({lanc: 'Lançamento', breve: 'Breve lançamento', obras: 'Em obras', pronto: 'Pronto'}[k]) + '<span class="n">' + baseF.filter(p => p.fase === k).length + '</span></button>').join('') + '</div>';
    const pil = [];
    if(f.q.trim()) pil.push(['q', '“' + f.q.trim() + '”']);
    if(f.teto) pil.push(['teto', 'Até ' + BRLc(f.teto)]);
    f.dorms.forEach(d => pil.push(['dorm:' + d, {S: 'Studio', 1: '1 dorm.', 2: '2 dorms', 3: '3 dorms ou +'}[d]]));
    if(f.area) pil.push(['area', 'A partir de ' + f.area + ' m²']);
    if(f.ate) pil.push(['ate', 'Chaves até ' + f.ate]);
    f.zonas.forEach(z => pil.push(['zona:' + z, 'Zona ' + (ZONA[z] || z)]));
    if(!f.livres) pil.push(['livres', 'Com esgotados']);
    const chipP = pil.length ? '<div class="pilulas" aria-label="Filtros ligados">' + pil.map(x => '<button type="button" class="pilula peq" data-acao="tirar" data-v="' + esc(x[0]) + '" aria-label="Tirar o filtro ' + esc(x[1]) + '">' + esc(x[1]) + ICO.x + '</button>').join('') + '</div>' : '';
    $('#imv-chips').innerHTML = chipC + chipF + chipP;
    $('#imv-n').innerHTML = '<b>' + res.length + '</b> ' + (res.length === 1 ? 'projeto' : 'projetos') + (f.livres ? ' com unidade livre' : '');
    const nf = nFiltrosFolha(), bf = $('#btn-filtros');
    if(bf){ bf.classList.toggle('ligado', !!nf); bf.setAttribute('aria-label', nf ? 'Filtros, ' + nf + (nf === 1 ? ' ligado' : ' ligados') : 'Filtros'); const b = bf.querySelector('.bolha'); if(nf){ if(b) b.textContent = nf; else bf.insertAdjacentHTML('beforeend', '<span class="bolha" aria-hidden="true">' + nf + '</span>'); } else if(b) b.remove(); }
    if(!res.length){
      const dicas = [];
      if(f.teto) dicas.push('subir o preço'); if(f.dorms.length) dicas.push('trocar os dormitórios'); if(f.area) dicas.push('baixar a metragem');
      if(f.ate) dicas.push('aceitar entrega mais longe'); if(f.q.trim()) dicas.push('buscar outro nome ou bairro'); if(f.cons.length || f.fases.length || f.zonas.length) dicas.push('abrir a construtora, a fase ou a zona');
      box.innerHTML = '<div class="vazio"><h2>Nada com esses filtros</h2><p class="texto-2">' + esc(dicas.length ? 'Tente ' + (dicas.length === 1 ? dicas[0] : dicas.slice(0, -1).join(', ') + ' ou ' + dicas[dicas.length - 1]) + '.' : 'Tente outra combinação.') + '</p>' +
        '<button type="button" class="btn" data-acao="limpar-tudo">Limpar os filtros</button></div>';
      return;
    }
    const mostra = res.slice(0, f.mostra);
    box.innerHTML = '<div class="lista-res">' + mostra.map(cardRes).join('') + '</div>' +
      (res.length > f.mostra ? '<div style="padding:14px 16px 0"><button type="button" class="btn" style="width:100%" data-acao="mais-res">Mostrar mais ' + Math.min(8, res.length - f.mostra) + ' de ' + (res.length - f.mostra) + '</button></div>' : '');
  }
  function cardRes(p){
    const v = precoDe(p);
    const etqs = [];
    if(p.v7) etqs.push('<span class="etq ouro">' + esc(plural(p.v7, 'venda', 'vendas')) + ' na semana</span>');
    else if(p.r7) etqs.push('<span class="etq">' + esc(plural(p.r7, 'reserva', 'reservas')) + ' na semana</span>');
    if(p.fase) etqs.push('<span class="etq">' + esc(FASE[p.fase] || p.fase) + '</span>');
    return '<a class="res" href="#/p/' + esc(p.id) + '">' + (p.capa ? imgTag(p.capa, 'Foto do ' + p.nome, '', ' data-sigla="' + esc(siglaDe(p)) + '" data-sigla-cls="sigla-g"') : '<span class="sigla-g" aria-hidden="true">' + esc(siglaDe(p)) + '</span>') +
      '<span class="veu" aria-hidden="true"></span><span class="topo-res">' + etqs.join('') + '</span>' +
      '<span class="txt"><span class="quem">' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span class="nome">' + esc(p.nome) + '</span>' +
      '<span class="linha-preco"><span class="preco' + (v == null ? ' sem' : '') + '">' + (v != null ? '<small>' + (p.preco != null ? 'Tabela a partir de' : 'À vista a partir de') + '</small>' + esc(BRL(v)) : 'Tabela a publicar') + '</span>' +
      '<span class="dir">' + esc([tiposTxt(p.tipos, p.amin, p.amax), p.livres ? plural(p.livres, 'livre', 'livres') + ' de ' + p.total : 'esgotado no espelho', entregaTxt(p)].filter(Boolean).join(', ')) + '.</span></span></span></a>';
  }
  function abrirFiltros(){
    const f = S.f;
    const op = (grupo, val, rot, on) => '<button type="button" class="pilula peq" data-acao="fil" data-g="' + grupo + '" data-v="' + val + '" aria-pressed="' + !!on + '">' + esc(rot) + '</button>';
    const baseZ = S.P.filter(p => passa(p, 'zona'));
    const corpo =
      '<fieldset><legend>Preço até</legend><div class="pilulas">' + [[250000, '250 mil'], [300000, '300 mil'], [400000, '400 mil'], [500000, '500 mil'], [750000, '750 mil'], [1000000, '1 mi'], [1500000, '1,5 mi'], [0, 'Sem limite']].map(o => op('teto', o[0], o[1], f.teto === o[0])).join('') + '</div></fieldset>' +
      '<fieldset><legend>Dormitórios</legend><div class="pilulas">' + [['S', 'Studio'], ['1', '1'], ['2', '2'], ['3', '3 ou +']].map(o => op('dorm', o[0], o[1], f.dorms.includes(o[0]))).join('') + '</div></fieldset>' +
      '<fieldset><legend>Metragem a partir de</legend><div class="pilulas">' + [[0, 'Todas'], [25, '25 m²'], [35, '35 m²'], [50, '50 m²'], [70, '70 m²'], [100, '100 m²']].map(o => op('area', o[0], o[1], f.area === o[0])).join('') + '</div></fieldset>' +
      '<fieldset><legend>Chaves até</legend><div class="pilulas">' + [[2026, '2026'], [2027, '2027'], [2028, '2028'], [2029, '2029'], [2030, '2030'], [0, 'Tanto faz']].map(o => op('ate', o[0], o[1], f.ate === o[0])).join('') + '</div></fieldset>' +
      '<fieldset><legend>Região</legend><div class="pilulas">' + ['centro', 'oeste', 'sul', 'leste'].map(z => '<button type="button" class="pilula peq" data-acao="fil" data-g="zona" data-v="' + z + '" aria-pressed="' + f.zonas.includes(z) + '">' + esc(ZONA[z]) + '<span class="n">' + baseZ.filter(p => p.zona === z).length + '</span></button>').join('') + '</div></fieldset>' +
      '<fieldset><legend>Estoque</legend><div class="pilulas">' + op('livres', 1, 'Só com unidade livre', f.livres) + op('livres', 0, 'Mostrar esgotados também', !f.livres) + '</div></fieldset>';
    abrirFolha('filtros', 'Filtros', corpo, '<button type="button" class="btn" data-acao="limpar-folha">Limpar</button><button type="button" class="btn btn-pri" data-acao="fechar-folha" id="ver-n">' + verNTxt() + '</button>');
  }
  const verNTxt = () => { const n = S.P.filter(p => passa(p)).length; return 'Ver ' + plural(n, 'projeto', 'projetos'); };

  // ================= PREGÃO =================
  function telaPregao(){
    const st = stats();
    let h = '<header style="padding:18px 16px 0;display:flex;flex-direction:column;gap:4px"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<h1 class="h1-forte">Pregão</h1><p class="ao-vivo"><span class="ponto"><i class="pulso"></i><i></i></span>Ao vivo, ' + esc(hora(S.lidoEm)) + '</p></div>' +
      '<p class="texto-2" style="color:var(--apoio)">Tudo que mudou hoje nos espelhos.</p></header>';
    const semP = st.vendHoje - st.vendHojePreco;
    h += '<section class="placar" style="border-bottom:0" aria-labelledby="hoje-t"><h2 class="rotulo" id="hoje-t">Vendido hoje</h2>' +
      '<p class="grande' + (st.vgvHoje ? '' : ' zero') + '">' + esc(BRLmi(st.vgvHoje)) + '</p>' +
      '<p class="texto"><strong>' + esc(plural(st.vendHoje, 'unidade vendida', 'unidades vendidas')) + '</strong>, ' + esc(plural(st.resHoje, 'reserva', 'reservas')) + ', ' + esc(plural(st.procHoje, 'contrato em processo', 'contratos em processo')) + ' e ' + esc(plural(st.voltHoje, 'unidade que voltou', 'unidades que voltaram')) + ' para a venda.</p>' +
      (st.vendHoje ? '<p class="nota">VGV pelo preço de tabela ' + (semP ? 'de ' + st.vendHojePreco + ' das ' + st.vendHoje + ' vendas. ' + (semP === 1 ? 'A outra não tem preço no espelho.' : 'As outras ' + semP + ' não têm preço no espelho.') : (st.vendHoje === 1 ? 'da venda.' : 'das ' + st.vendHoje + ' vendas.')) + '</p>' : '') + '</section>';
    // barras
    const porDia = S.dias7.map(d => ({d, n: S.M.filter(m => m.dia === d && m.tipo === 'venda').length}));
    const mx = Math.max(1, ...porDia.map(x => x.n)), tot = porDia.reduce((s, x) => s + x.n, 0);
    const rotDia = d => { const dt = new Date(d + 'T12:00:00-03:00'); return {sem: d === S.hoje ? 'hoje' : fSem.format(dt).replace('.', ''), dm: fDM.format(dt).slice(0, 2)}; };
    const aria = 'Unidades vendidas por dia: ' + porDia.map(x => { const r = rotDia(x.d); return (r.sem === 'hoje' ? 'hoje' : r.sem + ' ' + r.dm) + ', ' + (x.n || 'nenhuma'); }).join('; ');
    h += '<section style="margin:0 16px;padding:18px 0 22px;border-top:1px solid var(--linha);display:flex;flex-direction:column;gap:14px" aria-labelledby="sem-t">' +
      '<div class="sec-cab"><h2 class="h3" id="sem-t">Vendas por dia</h2><span class="sub tab">' + tot + ' em 7 dias</span></div>' +
      '<div class="barras" role="img" aria-label="' + esc(aria) + '">' + porDia.map(x => '<span class="col' + (x.d === S.hoje ? ' hoje' : '') + (x.n ? '' : ' nada') + '" aria-hidden="true"><b>' + x.n + '</b><i style="height:' + Math.max(2, Math.round(x.n / mx * 128)) + 'px"></i></span>').join('') + '</div>' +
      '<div class="barras-dias" aria-hidden="true">' + porDia.map(x => { const r = rotDia(x.d); return '<span' + (x.d === S.hoje ? ' class="hoje"' : '') + '><b>' + esc(r.sem) + '</b>' + esc(r.dm) + '</span>'; }).join('') + '</div></section>';
    // maior venda
    let maiores = st.hoje.filter(m => m.tipo === 'venda' && m.preco > 0), rotMaior = 'Maior venda de hoje';
    if(!maiores.length){ maiores = S.M.filter(m => m.tipo === 'venda' && m.preco > 0 && S.dias7.includes(m.dia)); rotMaior = 'Maior venda da semana'; }
    const maior = maiores.sort((a, b) => b.preco - a.preco)[0];
    if(maior){
      const p = S.byId.get(maior.p);
      h += '<a class="maior" href="#/p/' + esc(p.id) + '">' + (p.capa ? imgTag(p.capa, 'Foto do ' + p.nome) : '') + '<span class="veu" aria-hidden="true"></span><span class="txt">' +
        '<span class="k">' + esc(rotMaior + (maior.dia === S.hoje ? ', às ' + hora(maior.em) : ', ' + fDM.format(maior.em))) + '</span>' +
        '<h2>' + esc(p.nome + ' ' + maior.n) + '</h2><span class="d">' + esc([maior.area ? fmtM2(maior.area) : '', maior.tl, quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span>' +
        '<span class="v">' + esc(BRL(maior.preco)) + '</span></span></a>';
    }
    // movimento
    let dia = S.hoje, lista = st.hoje, titulo = 'Movimento de hoje';
    if(!lista.length){ const ontem = diaKey(Date.now() - 864e5); dia = ontem; lista = S.M.filter(m => m.dia === ontem); titulo = 'Movimento de ontem'; }
    const filtros = [['tudo', 'Tudo', lista.length], ['venda', 'Vendas', lista.filter(m => m.tipo === 'venda').length], ['reserva', 'Reservas', lista.filter(m => m.tipo === 'reserva').length], ['processo', 'Em processo', lista.filter(m => m.tipo === 'processo').length], ['voltou', 'Voltaram', lista.filter(m => m.tipo === 'voltou').length]];
    const fl = S.ui.feed, vis = fl === 'tudo' ? lista : lista.filter(m => m.tipo === fl);
    h += '<section style="padding:26px 0 0" aria-labelledby="feed-t"><h2 class="h2" id="feed-t" style="padding:0 16px">' + titulo + '</h2>' +
      '<div class="pilulas rola" role="group" aria-label="Filtrar o movimento" style="margin:12px 0 0;padding:0 16px 4px">' + filtros.map(x => '<button type="button" class="pilula peq" data-acao="feed" data-v="' + x[0] + '" aria-pressed="' + (fl === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>' +
      (vis.length ? '<ul class="feed">' + vis.slice(0, S.ui.feedMostra).map(feedItem).join('') + '</ul>' : '<p class="texto-2" style="padding:12px 16px">Nada nesse filtro' + (dia === S.hoje ? ' hoje' : ' ontem') + '.</p>') +
      (vis.length > S.ui.feedMostra ? '<div style="padding:14px 16px 0"><button type="button" class="btn" style="width:100%" data-acao="mais-feed">Mostrar mais ' + Math.min(20, vis.length - S.ui.feedMostra) + ' de ' + (vis.length - S.ui.feedMostra) + '</button></div>' : '') + '</section>';
    // ranking 10
    const rk = rankingDe('vendas').slice(0, 10);
    if(rk.length) h += '<section class="sec" aria-labelledby="rk-t"><div class="sec-cab"><h2 class="h2" id="rk-t">Ranking da semana</h2><span class="sub">7 dias</span></div>' +
      '<div class="tabela-rank" role="table" aria-label="Ranking da semana por vendas"><div class="lin cab" role="row"><span role="columnheader">#</span><span role="columnheader">Projeto</span><span role="columnheader" class="dir">Vendas</span><span role="columnheader" class="dir">Reservas</span></div>' +
      rk.map((p, i) => '<a class="lin" role="row" href="#/p/' + esc(p.id) + '"><span role="cell" class="pos">' + (i + 1) + '</span><span role="cell" class="nm"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span></span><span role="cell" class="v">' + p.v7 + '</span><span role="cell" class="r">' + p.r7 + '</span></a>').join('') + '</div></section>';
    return h;
  }
  function feedItem(m){
    const p = S.byId.get(m.p);
    return '<li><span class="h">' + esc(hora(m.em)) + '</span><span class="meio"><a href="#/p/' + esc(p.id) + '">' + esc(nomeCurto(p)) + ' <span class="u">' + esc(m.n) + '</span></a>' +
      '<span>' + esc([m.area ? fmtM2(m.area) : '', m.tl, quemDe(p)].filter(Boolean).join(', ')) + '</span></span>' +
      '<span class="fim"><span class="st ' + statusCls(m) + '">' + esc(statusTxt(m)) + '</span>' + (m.preco ? '<span class="v' + (m.tipo === 'venda' ? ' ouro' : '') + '">' + esc(BRLc(m.preco)) + '</span>' : '') + '</span></li>';
  }

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
  function fluxoHtml(det, a, titulo){
    const fx = fluxoDe(det, a);
    const corr = (det.info && det.info.fluxo && det.info.fluxo.correcao) || (det.dados.tabela && det.dados.tabela.correcao) || '';
    const obs = det.info && det.info.fluxo && det.info.fluxo.obs;
    const cond = det.dados.tabela && Array.isArray(det.dados.tabela.condicoes) ? det.dados.tabela.condicoes.filter(Boolean) : [];
    if(!fx || !fx.linhas.length){
      if(!cond.length) return '';
      return (titulo ? '<h2 class="h2">Como o cliente paga</h2>' : '') + '<p class="texto-2">Condições da ' + esc((det.dados.tabela && det.dados.tabela.nome) || 'tabela') + ':</p>' +
        '<ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:15px;line-height:22px">' + cond.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>';
    }
    const tot = fx.total, fin = fx.linhas.filter(l => l.fin).reduce((s, l) => s + l.v * l.n, 0), ate = tot - fin;
    let ci = 0;
    const cores = fx.linhas.map(l => l.fin ? null : CORES_FLUXO[Math.min(ci++, CORES_FLUXO.length - 1)]);
    const barra = '<div class="fluxo-barra" role="img" aria-label="' + esc(pctTxt(pct(ate, tot)) + ' pagos até as chaves' + (fin ? ' e ' + pctTxt(pct(fin, tot)) + ' no financiamento' : '')) + '">' +
      fx.linhas.map((l, i) => '<i style="width:' + pct(l.v * l.n, tot) + '%;background:' + (l.fin ? '#3A342A;box-shadow:inset 0 0 0 1px #776E5E' : cores[i]) + '"></i>').join('') + '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;line-height:18px;color:var(--apoio)" class="tab"><span>' + esc(pctTxt(pct(ate, tot))) + ' até as chaves</span>' + (fin ? '<span>' + esc(pctTxt(pct(fin, tot))) + ' no financiamento</span>' : '') + '</div>';
    const lst = '<dl class="fluxo-lista">' + fx.linhas.map((l, i) => '<div><span class="cor" aria-hidden="true" style="background:' + (l.fin ? '#3A342A;box-shadow:inset 0 0 0 1px #776E5E' : cores[i]) + '"></span>' +
      '<dt>' + esc(l.rot || ROT_FLUXO[l.t] || l.t || 'Parcela') + '<small>' + esc((l.n > 1 ? l.n + ' parcelas' : '1 parcela') + (l.d ? (l.n > 1 ? ' a partir de ' : ' em ') + mesAnoCurto(l.d) : '')) + '</small></dt>' +
      '<dd><b>' + esc((l.n > 1 ? l.n + 'x ' : '') + BRL(l.v)) + '</b><small>' + esc(pctTxt(pct(l.v * l.n, tot))) + '</small></dd></div>').join('') + '</dl>';
    return (titulo ? '<h2 class="h2">Como o cliente paga</h2>' : '') + barra + lst +
      ((corr || obs) ? '<p class="nota" style="margin:0;font-size:13px;line-height:19px">' + esc([corr, obs].filter(Boolean).join(' ')) + '</p>' : '');
  }
  function fotosDoProjeto(det, c){
    const out = [];
    if(c && Array.isArray(c.renders) && c.renders.length){
      for(const r of c.renders) out.push({src: imgCentral(c, r.id), th: imgCentral(c, r.id, true), t: r.t || '', mesma: true});
    }
    const capa = det.info && urlImg(det.info.capa);
    if(!out.length && capa) out.push({src: capa, t: 'Fachada'});
    for(const f of (det.fotos || [])){
      const u = urlImg(f && f.u); if(!u || out.some(o => o.src === u)) continue;
      if(out.length >= 40) break;
      out.push({src: u, th: urlImg(f.th) || (/googleusercontent\.com\/d\//.test(u) ? u.replace(/=w\d+$/, '=w480') : null), t: f.t || '', mesma: /^nex\//.test(f.u)});
    }
    return out;
  }
  function telaProjeto(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2>Projeto não encontrado</h2><p class="texto-2">Ele pode ter saído dos espelhos.</p><a class="btn" href="#/imoveis">Ver os imóveis</a></div>';
    const cache = S.det.get(id), det = cache && cache.v, c = S.centralV.get(id);
    S.vistoProj = det && c !== undefined ? id + ':' + det.gerado_em + ':' + (c ? 1 : 0) : null;
    pos.push(() => carregarProjeto(id));
    if(!det || c === undefined) return projetoTopo(p, null, null) + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:54px;width:70%"></div><div class="brilho" style="height:8px"></div><div class="brilho" style="height:180px"></div><p class="sub">Buscando os preços de hoje no espelho…</p></div>';
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
      const box = $('.esqueleto'); if(box) box.outerHTML = '<div class="faixa-aviso" role="alert"><div class="aviso erro">' + ICO.nuvem + '<p style="margin:0">Não consegui abrir a ficha agora. Confira a internet e tente de novo.</p></div><button type="button" class="btn" style="margin-top:10px;width:100%" data-acao="recarregar">Tentar de novo</button></div>';
    }
  }
  function projetoTopo(p, det, c){
    const fotos = det ? fotosDoProjeto(det, c) : (p.capa ? [{src: p.capa, t: 'Fachada'}] : []);
    S.fotosAtuais = fotos;
    const cima = '<div class="cima"><a class="ico-btn vidro" href="#/imoveis" data-acao="voltar" aria-label="Voltar">' + ICO.voltar + '</a><div>' +
      '<button type="button" class="ico-btn vidro" data-acao="enviar" data-id="' + esc(p.id) + '" aria-label="Mandar para um cliente">' + ICO.enviar + '</button></div></div>';
    if(!fotos.length) return '<section class="galeria" aria-label="Fotos do projeto">' + cima + '<div class="sem-foto" aria-hidden="true">' + esc(siglaDe(p)) + '</div></section>';
    return '<section class="galeria" aria-label="Fotos do projeto">' + cima +
      '<div class="trilho" id="gal" tabindex="0" aria-label="Fotos: deslize para o lado">' + fotos.map((f, i) => '<figure>' + imgTag(f.src, f.t || ('Foto ' + (i + 1) + ' do ' + p.nome), '', i === 0 ? ' fetchpriority="high"' : '') + '</figure>').join('') + '</div>' +
      '<div class="veu-g" aria-hidden="true"></div><p class="legenda"><span id="gal-t">' + esc(fotos[0].t || '') + '</span><span id="gal-n">1 de ' + fotos.length + '</span></p></section>' +
      (fotos.length > 1 ? '<div class="miniaturas" role="group" aria-label="Escolher foto">' + fotos.slice(0, 24).map((f, i) => '<button type="button" data-acao="foto" data-i="' + i + '" aria-label="' + esc(f.t || 'Foto ' + (i + 1)) + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + imgTag(f.th || f.src, '', '', f.th ? ' data-troca="' + esc(f.src) + '"' : '') + '</button>').join('') + '</div>' : '');
  }
  function unidadeRef(det, chave){   // a mais barata livre (com preço), para o "a partir de" e o fluxo
    const us = (det.dados.unidades || []).filter(a => a[6] === 'disponivel' && precoU(a, chave));
    us.sort((x, y) => precoU(x, chave) - precoU(y, chave));
    return us[0] || null;
  }
  function projetoHtml(p, det, c){
    const d = det.dados, info = det.info || {}, chave = chaveBase(det), pc = precosCampos(det);
    const temPv = pc.some(x => x.k === 'pv');
    const us = d.unidades || [];
    const tot = us.length, liv = us.filter(a => a[6] === 'disponivel').length, vend = us.filter(a => a[6] === 'vendida').length, res = us.filter(a => a[6] === 'reservada').length, proc = us.filter(a => a[6] === 'processo_final').length;
    const ref = unidadeRef(det, chave);
    const pRef = ref ? precoU(ref, chave) : null, pvRef = ref && temPv ? precoU(ref, 'pv') : null;
    const areas = us.filter(a => a[6] === 'disponivel').map(areaU).filter(v => v > 0);
    const regra = (d.tabela && (d.tabela.regra_curta || d.tabela.regra_avista)) || '';
    let h = projetoTopo(p, det, c);
    const fase = FASE[info.fase] || d.fase || '';
    h += '<header class="cab-proj"><p class="sub">' + esc([fase && fase + (quemDe(p) ? ' da ' + quemDe(p) : ''), noBairro(p.bairro || info.bairro)].filter(Boolean).join(' ')) + '</p>' +
      '<h1>' + esc(p.nome) + '</h1>' + (info.endereco || d.endereco ? '<p class="texto-2">' + esc(info.endereco || d.endereco) + '</p>' : '') + '</header>';
    // cotação
    h += '<section class="cotacao" aria-labelledby="cot-t"><h2 class="rotulo" id="cot-t">' + (pRef ? esc((pc.find(x => x.k === chave) || {}).label === 'À vista' ? 'À vista a partir de' : 'Tabela a partir de') : 'Tabela') + '</h2>' +
      (pRef ? '<p class="valor">' + esc(BRL(pRef)) + '</p>' : '<p class="valor sem">' + (liv ? 'Sem preço publicado' : 'Esgotado no espelho') + '</p>') +
      (ref ? '<p class="texto-2" style="margin-top:2px;color:var(--texto)">' + (pvRef && chave !== 'pv' ? 'ou <strong>' + esc(BRL(pvRef)) + ' à vista</strong>. ' : '') + esc([tipologiaU(det, ref), areaU(ref) ? fmtM2(areaU(ref)) : '', 'unidade ' + ref[0]].filter(Boolean).join(', ')) + '.</p>' : '') +
      (regra ? '<p class="nota" style="margin-top:6px">' + esc(regra) + '</p>' : '') +
      '<div class="estoque"><div class="l1"><b>' + esc(pctTxt(pct(tot - liv, tot))) + ' do estoque já saiu</b><span>' + esc(liv + ' livres de ' + tot) + '</span></div>' +
      '<div class="barra" role="img" aria-label="' + esc(vend + ' vendidas, ' + (res + proc) + ' reservadas ou em processo e ' + liv + ' livres') + '"><i class="vd" style="width:' + pct(vend, tot) + '%"></i><i class="rs" style="width:' + pct(res + proc, tot) + '%"></i></div>' +
      '<div class="legenda"><span><i style="background:var(--ouro)"></i>' + vend + ' vendidas</span><span><i style="background:var(--apoio2)"></i>' + (res + proc) + ' reservadas ou em processo</span><span><i style="background:var(--barra-vazia);box-shadow:inset 0 0 0 1px var(--contorno)"></i>' + liv + ' livres</span></div></div>' +
      '<dl class="ficha">' +
      (areas.length ? '<div><dt>Metragem</dt><dd>' + esc(Math.min(...areas) === Math.max(...areas) ? fmtM2(Math.round(Math.min(...areas))) : Math.round(Math.min(...areas)) + ' a ' + fmtM2(Math.round(Math.max(...areas)))) + '</dd></div>' : '') +
      '<div><dt>Entrega</dt><dd>' + esc(info.fase === 'pronto' ? 'Pronto para morar' : (mesAno(info.entrega) ? maiusc1(mesAno(info.entrega)) : (d.fase || 'A definir'))) + '</dd></div>' +
      (info.vagas && info.vagas.t ? '<div><dt>Vaga</dt><dd>' + esc(info.vagas.t.length > 60 ? ({todas: 'Com vaga', algumas: 'Algumas unidades', nenhuma: 'Sem vaga'}[info.vagas.r] || info.vagas.t) : info.vagas.t) + '</dd></div>' : '') +
      (d.tabela && d.tabela.nome ? '<div><dt>Tabela</dt><dd>' + esc(d.tabela.nome) + '</dd></div>' : '') + '</dl></section>';
    // ações
    h += '<div class="acoes"><button type="button" class="btn btn-pri btn-alto" data-acao="enviar" data-id="' + esc(p.id) + '">' + ICO.enviar + 'Mandar pro cliente</button>' +
      '<div class="btn-linha"><a class="btn" href="#/tabelas/' + esc(p.id) + '">Ver a tabela</a><a class="btn" href="#/posts/' + esc(p.id) + '">Criar post</a></div></div>';
    // movimento
    const mov = (det.mov || []).slice(0, 8);
    if(mov.length){
      const porN = new Map(us.map(a => [String(a[0]), a]));
      h += '<section class="sec" aria-labelledby="mov-t"><div class="sec-cab"><h2 class="h2" id="mov-t">Movimento no espelho</h2><a class="link-mais" href="#/pregao">Pregão</a></div>' +
        '<p class="texto-2" style="margin:2px 0 8px;color:var(--texto)">' + (p.v7 || p.r7 ? '<strong class="ouro">' + esc(plural(p.v7, 'venda', 'vendas')) + '</strong> e ' + esc(plural(p.r7, 'reserva', 'reservas')) + ' em 7 dias.' : 'Sem vendas nem reservas nos últimos 7 dias.') + '</p>' +
        '<ul class="mov">' + mov.map(m => {
          const mm = {tipo: m[2] === 'vendida' ? 'venda' : m[2] === 'reservada' ? 'reserva' : m[2] === 'processo_final' ? 'processo' : m[2] === 'disponivel' ? 'voltou' : 'outro', para: m[2]};
          const a = porN.get(String(m[0])), v = a ? precoU(a, chave) : null;
          return '<li><span class="h">' + esc(quandoTxt(m[3] * 1000)) + '</span><span class="m"><strong class="u">' + esc(m[0]) + '</strong> <span class="' + statusCls(mm) + '" style="font-weight:700">' + esc(statusTxt(mm)) + '</span>' +
            (a ? '<small>' + esc([tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : '', andarTxt(a[4])].filter(Boolean).join(', ')) + '</small>' : '') + '</span>' +
            '<span class="v' + (mm.tipo === 'venda' ? ' ouro' : '') + '">' + (v ? esc(BRLc(v)) : '') + '</span></li>';
        }).join('') + '</ul></section>';
    }
    // fluxo
    if(ref){
      const fh = fluxoHtml(det, ref, false);
      if(fh) h += '<section class="sec" style="display:flex;flex-direction:column;gap:12px" aria-labelledby="flx-t"><h2 class="h2" id="flx-t">Como o cliente paga</h2>' +
        '<p class="texto-2">' + esc('Na unidade ' + ref[0] + (pRef ? ' de ' + BRL(pRef) : '') + ', a mais em conta livre hoje.') + '</p>' + fh + '</section>';
    }else{
      const fh = fluxoHtml(det, us[0] || [], false);
      if(fh) h += '<section class="sec" style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">Como o cliente paga</h2>' + fh + '</section>';
    }
    // sobre
    const sobre = c && c.intro ? c.intro : (c && c.chamada) || info.destaque || '';
    const tipTxt = c && Array.isArray(c.tipologias) && c.tipologias.length ? c.tipologias.map(t => t[0] + (t[1] ? ' (' + t[1] + ')' : '')).join(', ') : (typeof info.tipologias === 'string' ? info.tipologias : '');
    if(sobre || tipTxt) h += '<section class="sec" style="display:flex;flex-direction:column;gap:10px"><h2 class="h2">Sobre</h2>' + (sobre ? '<p class="texto" style="line-height:25px">' + esc(sobre) + '</p>' : '') + (tipTxt ? '<p class="texto-2">' + esc(tipTxt) + '</p>' : '') + '</section>';
    // perto
    if(c && Array.isArray(c.perto) && c.perto.length){
      h += '<section class="sec perto"><h2 class="h2" style="margin-bottom:6px">Perto daqui</h2>' + c.perto.map(x => {
        const [mn, como] = x.pe != null ? [x.pe + ' min', 'a pé'] : x.bike != null ? [x.bike + ' min', 'de bike'] : x.carro != null ? [x.carro + ' min', 'de carro'] : x.min != null ? [x.min + ' min', ''] : x.m != null ? [(+x.m >= 1000 ? (+x.m / 1000).toLocaleString('pt-BR', {maximumFractionDigits: 1}) + ' km' : x.m + ' m'), ''] : [null, ''];
        return '<div><span style="font-size:15px;line-height:21px">' + esc(x.nome) + '</span>' + (mn != null ? '<span class="tab" style="flex-shrink:0"><b>' + esc(mn) + '</b>' + (como ? ' <small>' + esc(como) + '</small>' : '') + '</span>' : '') + '</div>';
      }).join('') + (c.perto_fonte ? '<p class="nota">' + esc(c.perto_fonte) + '</p>' : '') + '</section>';
    }
    // lazer
    if(c && Array.isArray(c.lazer) && c.lazer.length){
      h += '<section class="sec" style="padding-left:0;padding-right:0"><h2 class="h2" style="padding:0 16px">Lazer</h2><div style="padding:6px 16px 0">' + c.lazer.map(l => '<div class="lazer-bloco"><h3>' + esc(l.onde || '') + '</h3><p>' + esc((l.itens || []).join(', ')) + '</p></div>').join('') + '</div>' +
        (c.lazer.some(l => l.planta) ? '<div class="fotos-linha" style="margin-top:8px">' + c.lazer.filter(l => l.planta).map(l => '<figure class="planta">' + imgTag(imgCentral(c, l.planta), 'Planta do lazer: ' + (l.onde || '')) + '<figcaption>' + esc(l.onde || '') + '</figcaption></figure>').join('') + '</div>' : '') + '</section>';
    }else if(Array.isArray(info.lazer) && info.lazer.length){
      h += '<section class="sec"><h2 class="h2">Lazer</h2><p class="texto-2" style="margin-top:8px;line-height:24px">' + esc(info.lazer.join(', ')) + '.</p></section>';
    }
    // plantas e vistas
    if(c && Array.isArray(c.plantas) && c.plantas.length){
      h += '<section class="sec" style="padding-left:0;padding-right:0"><h2 class="h2" style="padding:0 16px 12px">Plantas</h2><div class="fotos-linha">' + c.plantas.map(pl => '<figure class="planta">' + imgTag(imgCentral(c, pl.id), 'Planta ' + (pl.t || '')) + '<figcaption>' + esc(pl.t || '') + (pl.andares ? '<small>' + esc(pl.andares) + (pl.finais && pl.finais.length ? ', finais ' + pl.finais.map(x => String(x).padStart(2, '0')).join(', ') : '') + '</small>' : '') + '</figcaption></figure>').join('') + '</div>' +
        (c.aviso_planta ? '<p class="nota" style="padding:0 16px">' + esc(c.aviso_planta) + '</p>' : '') + '</section>';
    }
    if(c && Array.isArray(c.vistas_rooftop) && c.vistas_rooftop.length){
      h += '<section class="sec" style="padding-left:0;padding-right:0"><h2 class="h2" style="padding:0 16px 12px">Vistas</h2><div class="fotos-linha">' + c.vistas_rooftop.map(v => '<figure>' + imgTag(imgCentral(c, v.id), v.t || 'Vista') + '<figcaption>' + esc(v.t || '') + '</figcaption></figure>').join('') + '</div>' +
        (c.aviso_vista ? '<p class="nota" style="padding:0 16px">' + esc(c.aviso_vista) + '</p>' : '') + '</section>';
    }
    // ficha técnica
    const fatos = c && Array.isArray(c.fatos) ? c.fatos.filter(x => Array.isArray(x) && x[0]) : (info.ficha_tecnica && typeof info.ficha_tecnica === 'object' ? Object.entries(info.ficha_tecnica).map(([k, v]) => [maiusc1(k.replace(/_/g, ' ')), typeof v === 'string' ? v : JSON.stringify(v)]) : []);
    if(fatos.length) h += '<section class="sec"><h2 class="h2">Ficha técnica</h2><dl class="ficha" style="margin-top:10px">' + fatos.map(f => '<div style="flex-direction:column;gap:2px"><dt>' + esc(f[0]) + '</dt><dd style="text-align:left;font-weight:500;line-height:22px">' + esc(f[1]) + '</dd></div>').join('') + '</dl></section>';
    if(c && Array.isArray(c.diferenciais) && c.diferenciais.length) h += '<section class="sec"><h2 class="h2">Diferenciais</h2><ul style="margin:10px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:15px;line-height:22px">' + c.diferenciais.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></section>';
    // material
    const docs = [];
    if(c && Array.isArray(c.material_oficial)) c.material_oficial.forEach(m => { if(m && m.id) docs.push({t: m.c || m.n, s: (m.n || '') + (m.mb ? ', ' + String(m.mb).replace('.', ',') + ' MB' : ''), u: driveArq(m.id), x: m.ext || 'pdf'}); });
    const dp = det.docs && det.docs.projeto;
    if(dp && Array.isArray(dp.docs)) dp.docs.forEach(x => { const u = urlSegura(x.u) || (x.id && x.x !== 'link' && !/^[a-z]+-/.test(x.id) ? driveArq(x.id) : null); if(u) docs.push({t: x.t || x.a, s: [x.a, x.d].filter(Boolean).join(', '), u, x: x.x || 'pdf'}); });
    if(dp && Array.isArray(dp.pastas)) dp.pastas.forEach(x => { if(x && x.id) docs.push({t: x.c || 'Pasta', s: 'Pasta no Google Drive', u: drivePasta(x.id), x: 'pasta'}); });
    if(urlSegura(info.pagina) || urlSegura(info.site)) docs.push({t: 'Site oficial do projeto', s: (urlSegura(info.pagina) || urlSegura(info.site)).replace(/^https:\/\/(www\.)?/, '').split('/')[0], u: urlSegura(info.pagina) || urlSegura(info.site), x: 'site'});
    if(c && c.pagina) docs.unshift({t: 'Ficha completa nos Espelhos', s: 'Fotos, plantas por andar, vistas e simulador', u: ESP + 'nex/' + c.pagina, x: 'ficha'});
    if(docs.length) h += '<section class="sec"><h2 class="h2" style="margin-bottom:10px">Material</h2><ul class="docs">' + docs.slice(0, 14).map(x => '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener"><span class="tipo" aria-hidden="true">' + esc(String(x.x).slice(0, 5)) + '</span><span class="t"><b>' + esc(x.t) + '</b>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</span>' + ICO.seta.replace('<svg', '<svg width="18" height="18"') + '</a></li>').join('') + '</ul>' +
      (det.docs && Array.isArray(det.docs.geral) && det.docs.geral.length ? '<p class="nota">A ' + esc(det.docs.construtora || 'construtora') + ' também tem ' + det.docs.geral.length + ' materiais gerais (treinamentos, campanhas e formulários) no app dos Espelhos.</p>' : '') + '</section>';
    if(d.nota) h += '<p class="legal">' + esc(d.nota) + '</p>';
    if(c && c.legal) h += '<p class="legal">' + esc(c.legal) + '</p>';
    h += '<p class="legal">Dados do espelho de ' + esc(d.atualizado_em ? quandoTxt(Date.parse(d.atualizado_em)) : 'hoje') + '. ' + esc(d.fonte || '') + '</p>';
    pos.push(ligarGaleria);
    return h;
  }
  function ligarGaleria(){
    const g = $('#gal'); if(!g) return;
    let t = null;
    g.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => {
      const i = Math.round(g.scrollLeft / g.clientWidth), f = (S.fotosAtuais || [])[i];
      const nt = $('#gal-t'), nn = $('#gal-n'); if(nt) nt.textContent = f ? f.t || '' : ''; if(nn) nn.textContent = (i + 1) + ' de ' + (S.fotosAtuais || []).length;
      $$('.miniaturas button').forEach((b, k) => { if(k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }, 60); }, {passive: true});
  }

  // ================= LISTA (Tabelas e Posts) =================
  function telaListaProjetos(modo){
    const titulo = modo === 'tabelas' ? 'Tabelas' : 'Posts';
    const sub = modo === 'tabelas' ? 'Escolha o projeto para ver as unidades, os preços e o fluxo, e marcar as que vão pro cliente.' : 'Escolha o projeto. O app monta a arte com a foto, o preço e o seu contato, pronta para o Stories ou o feed.';
    pos.push(() => atualizarLista(modo));
    return '<header style="padding:18px 16px 0;display:flex;flex-direction:column;gap:6px"><h1 class="h1-forte">' + titulo + '</h1><p class="texto-2">' + esc(sub) + '</p></header>' +
      '<div class="busca-linha"><label class="busca"><span class="sr">Buscar projeto</span>' + ICO.lupa + '<input id="lq" type="search" autocomplete="off" placeholder="Nome do projeto ou bairro" value="' + esc(S.ui.listaQ) + '" data-input="lista" data-modo="' + modo + '"></label></div>' +
      '<p class="sub" style="padding:14px 16px 4px" id="lista-n"></p><ul class="lista-proj" id="lista"></ul>';
  }
  function atualizarLista(modo){
    const box = $('#lista'); if(!box) return;
    const termos = norm(S.ui.listaQ).split(/\s+/).filter(Boolean);
    let ps = S.P.filter(p => !termos.length || termos.every(t => norm([p.nome, p.curto, p.bairro, quemDe(p), GRUPOS[p.grupo] ? GRUPOS[p.grupo].n : ''].join(' ')).includes(t)));
    ps = ps.sort((a, b) => (b.v7 - a.v7) || (b.r7 - a.r7) || ((b.livres > 0) - (a.livres > 0)) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const lim = termos.length ? 60 : 40;
    $('#lista-n').textContent = termos.length ? plural(ps.length, 'projeto encontrado', 'projetos encontrados') : 'Os que mais vendem primeiro';
    box.innerHTML = ps.slice(0, lim).map(p => '<li><a href="#/' + modo + '/' + esc(p.id) + '">' + fotoProj(p, 'miniatura') + '<span class="meio"><b>' + esc(p.nome) + '</b><span>' + esc([quemDe(p), p.bairro].filter(Boolean).join(', ')) + '</span><span>' + esc(modo === 'tabelas' ? (p.tabela ? 'Tabela ' + String(p.tabela).replace(/^tabela(s)? (de )?/i, '') : 'Sem tabela publicada') : plural(p.livres, 'livre', 'livres') + (p.v7 ? ', ' + plural(p.v7, 'venda', 'vendas') + ' na semana' : '')) + '</span></span>' +
      '<span class="fim">' + (precoDe(p) != null ? '<b>' + esc(BRLc(precoDe(p))) + '</b>' : '') + '<span>' + esc(p.livres ? plural(p.livres, 'livre', 'livres') : 'esgotado') + '</span></span></a></li>').join('') +
      (ps.length > lim ? '<li style="padding:14px 0;color:var(--apoio);font-size:14px">Mais ' + (ps.length - lim) + '. Digite o nome para achar.</li>' : '');
  }

  // ================= TABELA DE UNIDADES =================
  function telaTabela(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2>Projeto não encontrado</h2><a class="btn" href="#/tabelas">Ver as tabelas</a></div>';
    const cache = S.det.get(id), det = cache && cache.v;
    const visto = det ? det.gerado_em : null;
    pos.push(async () => {
      try{ const d2 = await detalhe(id); if(location.hash === '#/tabelas/' + id && d2.gerado_em !== visto) render(); }
      catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais. Digite o código novo do time.'); const b = $('.esqueleto'); if(b) b.innerHTML = '<p class="erro-txt">Não consegui abrir a tabela agora. Confira a internet.</p><button type="button" class="btn" data-acao="recarregar">Tentar de novo</button>'; }
    });
    const topo = '<div class="barra-topo"><a class="ico-btn" href="#/tabelas" aria-label="Voltar para a lista de tabelas">' + ICO.voltar + '</a><h1>' + esc(p.nome) + '</h1><a class="ico-btn" href="#/p/' + esc(id) + '" aria-label="Abrir a ficha do projeto">' + ICO.seta + '</a></div>';
    if(!det) return topo + '<div class="esqueleto" aria-busy="true"><div class="brilho" style="height:40px"></div><div class="brilho" style="height:60px"></div><div class="brilho" style="height:60px"></div><div class="brilho" style="height:60px"></div></div>';
    return topo + tabelaHtml(p, det);
  }
  function tabelaHtml(p, det){
    const d = det.dados, pc = precosCampos(det).slice(0, 3);
    const modo = S.ui.tabModo[p.id] && pc.some(x => x.k === S.ui.tabModo[p.id]) ? S.ui.tabModo[p.id] : chaveBase(det);
    const sel = S.ui.tabSel.get(p.id) || new Set();
    const fil = S.ui.tabFiltro;
    const recentes = new Map(); for(const m of (det.mov || [])){ if(Date.now() - m[3] * 1000 < 36 * 3600e3 && !recentes.has(String(m[0]))) recentes.set(String(m[0]), m); }
    let us = (d.unidades || []).slice();
    const cont = {livres: us.filter(a => a[6] === 'disponivel').length, todas: us.length, mov: us.filter(a => recentes.has(String(a[0]))).length};
    if(fil === 'livres') us = us.filter(a => a[6] === 'disponivel');
    else if(fil === 'mov') us = us.filter(a => recentes.has(String(a[0])));
    const andN = v => v === 'T' || v === 'S' || v === 'L' ? 0 : (+v || 0);
    us.sort((x, y) => fil === 'livres' ? ((precoU(x, modo) || 1e12) - (precoU(y, modo) || 1e12)) : (andN(y[4]) - andN(x[4])) || String(x[0]).localeCompare(String(y[0]), 'pt-BR', {numeric: true}));
    const tab = d.tabela || {};
    let h = '<div style="padding:14px 16px 0;display:flex;flex-direction:column;gap:12px">' +
      '<p class="sub">' + esc([tab.nome ? 'Tabela: ' + tab.nome : 'Sem tabela publicada', tab.atualizado_em ? 'atualizada ' + quandoTxt(Date.parse(tab.atualizado_em)) : ''].filter(Boolean).join(', ')) + '. Espelho lido ' + esc(d.atualizado_em ? quandoTxt(Date.parse(d.atualizado_em)) : 'hoje') + '.</p>' +
      (pc.length > 1 ? '<div class="seg" role="group" aria-label="Preço mostrado">' + pc.map(x => '<button type="button" data-acao="tab-modo" data-id="' + esc(p.id) + '" data-v="' + esc(x.k) + '" aria-pressed="' + (modo === x.k) + '">' + esc(x.label) + '</button>').join('') + '</div>' : '') +
      '<div class="pilulas rola" role="group" aria-label="Quais unidades">' + [['livres', 'Livres', cont.livres], ['mov', 'Mexeram hoje e ontem', cont.mov], ['todas', 'Todas', cont.todas]].map(x => '<button type="button" class="pilula peq" data-acao="tab-fil" data-v="' + x[0] + '" aria-pressed="' + (fil === x[0]) + '">' + esc(x[1]) + '<span class="n">' + x[2] + '</span></button>').join('') + '</div>' +
      (tab.regra_curta ? '<p class="nota" style="margin:0">' + esc(tab.regra_curta) + '</p>' : '') + '</div>';
    if(!us.length) h += '<p class="texto-2" style="padding:16px">' + (fil === 'livres' ? 'Nenhuma unidade livre no espelho agora.' : 'Nenhuma unidade mexeu nas últimas 36 horas.') + '</p>';
    h += '<div class="unid" style="padding:0 16px" role="list">' + us.slice(0, S.ui.tabMostra || 120).map(a => unidadeHtml(p, det, a, modo, sel, recentes)).join('') + '</div>';
    if(us.length > (S.ui.tabMostra || 120)) h += '<div style="padding:14px 16px 0"><button type="button" class="btn" style="width:100%" data-acao="tab-mais">Mostrar mais ' + (us.length - (S.ui.tabMostra || 120)) + '</button></div>';
    if(sel.size) h += '<div class="barra-envio"><button type="button" class="btn" data-acao="tab-limpar" data-id="' + esc(p.id) + '" style="flex:0 0 auto">Limpar</button><button type="button" class="btn btn-pri" data-acao="enviar" data-id="' + esc(p.id) + '" data-sel="1">' + ICO.enviar + 'Mandar ' + esc(plural(sel.size, 'unidade', 'unidades')) + '</button></div><div style="height:76px"></div>';
    return h;
  }
  function unidadeHtml(p, det, a, modo, sel, recentes){
    const n = String(a[0]), livre = a[6] === 'disponivel', v = precoU(a, modo), mk = sel.has(n), m = recentes.get(n), aberta = S.ui.tabAberta === p.id + ':' + n;
    const qd = m ? (diaKey(m[3] * 1000) === S.hoje ? 'às ' + hora(m[3] * 1000) : quandoTxt(m[3] * 1000)) : '';
    const stTxt = livre ? (m ? 'voltou ' + qd : 'livre') : (stLabel(det, a[6]) + (m ? ' ' + qd : '')).toLowerCase();
    const stCls = a[6] === 'vendida' ? 'st-vendida' : livre ? 'apoio' : 'st-reservada';
    const desc = [tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : ''].filter(Boolean).join(', ');
    const sub = [andarTxt(a[4]), a[3] && a[3] !== 'R2V' ? a[3] : ''].filter(Boolean).join(', ');
    return '<div class="u' + (mk ? ' marcada' : '') + (livre ? '' : ' indisp') + (m ? ' novo' : '') + '" role="listitem">' +
      '<div style="display:grid;grid-template-columns:' + (livre ? '44px ' : '') + 'minmax(0,1fr);align-items:center">' +
      (livre ? '<button type="button" class="ico-btn" data-acao="tab-ck" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-pressed="' + mk + '" aria-label="Marcar a unidade ' + esc(n) + ' para mandar"><span class="ck">' + ICO.ok + '</span></button>' : '') +
      '<button type="button" class="u-lin sem-ck" data-acao="tab-abrir" data-id="' + esc(p.id) + '" data-n="' + esc(n) + '" aria-expanded="' + aberta + '">' +
      '<span class="n">' + esc(n) + '<small>' + esc(sub) + '</small></span><span class="d">' + esc(desc) + '<small class="' + stCls + '" style="font-weight:600">' + esc(stTxt) + '</small></span>' +
      '<span class="p' + (a[6] === 'vendida' ? '' : '') + '">' + (v ? esc(BRL(v)) : '<span class="apoio" style="font-size:14px">sem preço</span>') + '</span></button></div>' +
      (aberta ? '<div class="detalhe">' + (fluxoHtml(det, a, false) || '<p class="texto-2">Sem fluxo cadastrado para esta unidade.</p>') + '</div>' : '') + '</div>';
  }

  // ================= ENVIAR PRO CLIENTE =================
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
    let sel = daTabela ? new Set(S.ui.tabSel.get(id) || []) : new Set();
    const livres = (det.dados.unidades || []).filter(a => a[6] === 'disponivel').sort((x, y) => (precoU(x, chave) || 1e12) - (precoU(y, chave) || 1e12));
    if(!sel.size && livres[0]) sel.add(String(livres[0][0]));
    const pf = perfil();
    const st = {id, sel, modo: S.ui.tabModo[id] || chave, formato: c && c.pagina ? 'ficha' : 'selecao', central: !!(c && c.pagina)};
    S.envio = st;
    const listaU = livres.filter((a, i) => i < 80 || sel.has(String(a[0]))).map(a => {
      const n = String(a[0]), v = precoU(a, st.modo) || precoU(a, chave);
      return '<label class="pilula peq" style="justify-content:space-between;width:100%;border-radius:12px;min-height:52px"><span style="display:flex;align-items:center;gap:10px"><input type="checkbox" data-input="env-u" value="' + esc(n) + '"' + (sel.has(n) ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:var(--texto)"><span><b class="num" style="font-weight:500;font-size:17px">' + esc(n) + '</b> <span class="apoio" style="font-weight:400">' + esc([tipologiaU(det, a), areaU(a) ? fmtM2(areaU(a)) : '', andarTxt(a[4])].filter(Boolean).join(', ')) + '</span></span></span><span class="num ouro">' + (v ? esc(BRLc(v)) : '') + '</span></label>';
    }).join('');
    corpoFolha(
      '<p class="texto-2">' + esc(p.nome) + '. O cliente recebe um link com fotos e os valores das unidades marcadas.</p>' +
      '<label class="campo">Nome do cliente<input id="env-cli" maxlength="60" autocomplete="off" placeholder="Ex.: Maria" required></label>' +
      '<fieldset><legend>Unidades (' + livres.length + ' livres)</legend><div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow:auto" id="env-us">' + (listaU || '<p class="texto-2">Nenhuma unidade livre agora.</p>') + '</div>' + (livres.length > 80 ? '<p class="nota">Mostrando as 80 mais em conta.</p>' : '') + '</fieldset>' +
      (pc.length > 1 ? '<fieldset><legend>Valor mostrado</legend><div class="seg" role="group">' + pc.slice(0, 3).map(x => '<button type="button" data-acao="env-modo" data-v="' + esc(x.k) + '" aria-pressed="' + (st.modo === x.k) + '">' + esc(x.label) + '</button>').join('') + '</div></fieldset>' : '') +
      (st.central ? '<fieldset><legend>Página que o cliente abre</legend><div class="seg" role="group"><button type="button" data-acao="env-fmt" data-v="ficha" aria-pressed="true">Ficha completa</button><button type="button" data-acao="env-fmt" data-v="selecao" aria-pressed="false">Só as unidades</button></div><p class="nota" id="env-fmt-nota" style="margin:0">Fotos, plantas, lazer, mapa e até 4 unidades com valores.</p></fieldset>' : '') +
      '<fieldset><legend>Sua assinatura</legend><label class="campo">Seu nome<input id="env-cor" maxlength="40" autocomplete="name" value="' + esc(pf.nome || '') + '"></label>' +
      '<label class="campo">Seu WhatsApp<input id="env-tel" maxlength="20" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '"></label></fieldset>' +
      '<p class="erro-txt" id="env-erro" role="alert"></p>',
      '<button type="button" class="btn btn-pri btn-alto" data-acao="env-criar" id="env-ok">' + ICO.enviar + 'Criar o link</button>', dlg);
    setTimeout(() => { const i = $('#env-cli'); if(i) i.focus(); }, 80);
  }
  async function criarEnvio(){
    const st = S.envio; if(!st) return;
    const p = S.byId.get(st.id);
    const cli = $('#env-cli').value.trim(), cor = $('#env-cor').value.trim(), tel = $('#env-tel').value.trim();
    const us = $$('#env-us input:checked').map(i => i.value);
    const erro = m => { $('#env-erro').textContent = m; };
    if(!cli){ erro('Digite o nome do cliente.'); $('#env-cli').focus(); return; }
    if(!us.length){ erro('Marque pelo menos uma unidade.'); return; }
    const formato = st.central && st.formato === 'ficha' && us.length <= 4 ? 'ficha' : 'selecao';
    if(st.central && st.formato === 'ficha' && us.length > 4){ erro('A ficha completa leva até 4 unidades. Desmarque algumas ou escolha "Só as unidades".'); return; }
    salvarPerfil({nome: cor, tel});
    const b = $('#env-ok'); b.disabled = true; b.textContent = 'Criando o link…'; erro('');
    try{
      let url, avisos = false;
      if(formato === 'ficha'){
        const r = await rpc('link_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: null, p_projeto: p.id, p_cliente: cli, p_corretor: cor, p_whats: tel, p_unidades: us.map(n => ({n}))});
        const c = await fichaCentral(p.id);
        url = new URL(ESP + 'nex/' + ((c && c.pagina) || 'ver.html') + '?l=' + encodeURIComponent(r.id), location.href).href;
        avisos = !!r.avisos;
      }else{
        const r = await rpc('selecao_criar', {p_codigo: S.cod, p_dono: dono(), p_endpoint: null, p_cliente: cli, p_corretor: cor, p_whats: tel,
          p_busca: {texto: p.nome, modo: st.modo, criterios: {}, origem: 'app'}, p_itens: us.map(n => ({p: p.id, n}))});
        url = new URL(ESP + 's.html?s=' + encodeURIComponent(r.id), location.href).href;
        avisos = !!r.avisos;
      }
      const msg = 'Olá, ' + primeiroNome(cli) + '! ' + (formato === 'ficha' ? 'Separei a ficha do ' + p.nome + ' para você, com fotos, plantas e os valores: ' : 'Separei ' + (us.length === 1 ? 'uma opção' : us.length + ' opções') + ' do ' + p.nome + ' para você, com fotos e valores: ') + url;
      S.envioPronto = {url, msg};
      const dlg = $('#folha-envio'); if(!dlg) return;
      corpoFolha('<div class="aviso" role="status" style="border-color:var(--ouro)">' + ICO.ok.replace('stroke-width="3"', 'stroke-width="2.4"') + '<p style="margin:0">Link pronto para ' + esc(primeiroNome(cli)) + '. ' + (formato === 'ficha' ? 'Ficha completa' : 'Página') + ' com ' + esc(plural(us.length, 'unidade', 'unidades')) + '.' + (avisos ? ' Você recebe um aviso neste celular quando ' + esc(primeiroNome(cli)) + ' abrir.' : '') + '</p></div>' +
        '<label class="campo">Mensagem<textarea id="env-msg" rows="5">' + esc(msg) + '</textarea><small>Dá para mudar o texto antes de mandar.</small></label>' +
        '<p class="link-pronto">' + esc(url) + '</p>' +
        '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener">Ver como o cliente vê</a>',
        '<button type="button" class="btn" data-acao="env-copiar">' + ICO.copiar + 'Copiar</button><a class="btn btn-pri" id="env-wa" href="https://wa.me/?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" data-acao="env-wa">' + ICO.zap + 'WhatsApp</a>', dlg);
      S.ui.tabSel.delete(p.id);
    }catch(e){
      b.disabled = false; b.innerHTML = ICO.enviar + 'Criar o link';
      const t = (e && e.body) || '';
      erro(codigoInvalido(e) ? 'O código do time mudou. Entre de novo.' : /unidade_invalida/.test(t) ? 'Uma das unidades saiu do espelho. Feche e abra de novo.' : /limite_/.test(t) ? 'Limite de links por dia atingido neste aparelho. Tente amanhã.' : /muitas_unidades|muitos_projetos/.test(t) ? 'Seleção grande demais: até 40 unidades.' : 'Não consegui criar o link agora. Confira a internet e tente de novo.');
    }
  }

  // ================= POSTS =================
  const VARS = {
    Ouro: {banda: 'rgba(14,12,9,0.93)', caixa: '#C8A24A', caixaTexto: '#0E0C09', texto: '#F3EEE4', apoio: '#CFC6B4', contato: '#C8A24A', fio: '#3A352C'},
    Creme: {banda: 'rgba(14,12,9,0.93)', caixa: '#F3EEE4', caixaTexto: '#0E0C09', texto: '#F3EEE4', apoio: '#CFC6B4', contato: '#C8A24A', fio: '#3A352C'},
    Noite: {banda: 'rgba(243,238,228,0.96)', caixa: '#0E0C09', caixaTexto: '#F3EEE4', texto: '#1C1913', apoio: '#5C5446', contato: '#6B5216', fio: '#CFC7B7'}
  };
  function telaPost(id){
    const p = S.byId.get(id);
    if(!p) return '<div class="vazio"><h2>Projeto não encontrado</h2><a class="btn" href="#/posts">Escolher outro</a></div>';
    const topo = '<div class="barra-topo"><a class="ico-btn" href="#/posts" aria-label="Voltar para a lista">' + ICO.voltar + '</a><h1>Post: ' + esc(nomeCurto(p)) + '</h1></div>';
    if(!S.post || S.post.id !== id) S.post = {id, fmt: 'story', assunto: 'preco', var: 'Ouro', foto: 0, fotos: null, titulo: null, linha: null, legenda: null, local: null};
    pos.push(() => prepararPost(id));
    return topo + '<div id="post-corpo"><div class="esqueleto" aria-busy="true"><div class="brilho" style="height:420px;width:240px;margin:0 auto"></div><p class="sub" style="text-align:center">Lendo a ficha e as fotos…</p></div></div>';
  }
  async function prepararPost(id){
    const alvo = '#/posts/' + id;
    let det, c;
    try{ [det, c] = await Promise.all([detalhe(id), fichaCentral(id)]); }
    catch(e){ if(codigoInvalido(e)) return sair('Esse código não vale mais.'); const b = $('#post-corpo'); if(b) b.innerHTML = '<p class="erro-txt" style="padding:16px">Não consegui abrir a ficha agora. Confira a internet.</p>'; return; }
    if(location.hash !== alvo) return;
    const st = S.post, p = S.byId.get(id);
    if(!st.fotos){ st.fotos = fotosDoProjeto(det, c).slice(0, 16).map(f => ({src: f.src, th: f.th, t: f.t, ok: null})); }
    st.det = det; st.c = c;
    const textos = textosPost(p, det, c, st.assunto);
    if(st.titulo == null) st.titulo = textos.titulo;
    if(st.linha == null) st.linha = textos.linha;
    if(st.legenda == null) st.legenda = legendaPost(p, det, c);
    const assuntos = [['preco', 'Preço'], ['local', 'Localização'], ['entrega', 'Entrega'], ['lazer', 'Lazer']];
    $('#post-corpo').innerHTML =
      '<div style="padding:14px 16px 0;display:flex;flex-direction:column;gap:12px">' +
      '<div class="seg" role="group" aria-label="Formato"><button type="button" data-acao="post-fmt" data-v="story" aria-pressed="' + (st.fmt === 'story') + '">Stories</button><button type="button" data-acao="post-fmt" data-v="feed" aria-pressed="' + (st.fmt === 'feed') + '">Feed</button></div>' +
      '<div class="pilulas rola" role="group" aria-label="Assunto do post">' + assuntos.map(a => '<button type="button" class="pilula peq" data-acao="post-assunto" data-v="' + a[0] + '" aria-pressed="' + (st.assunto === a[0]) + '">' + a[1] + '</button>').join('') + '</div></div>' +
      '<div class="post-prev' + (st.fmt === 'feed' ? ' feed' : '') + '" id="post-prev"><canvas id="post-cv" width="1080" height="' + (st.fmt === 'feed' ? 1350 : 1920) + '" role="img" aria-label="Prévia do post"></canvas></div>' +
      '<p class="sub" id="post-aviso" style="padding:8px 16px 0;text-align:center"></p>' +
      '<section style="padding:18px 0 0" aria-labelledby="pf-t"><h2 class="h3" id="pf-t" style="padding:0 16px 10px">Foto</h2><div class="escolha-fotos" role="group" aria-label="Escolher a foto">' +
      st.fotos.map((f, i) => '<button type="button" data-acao="post-foto" data-i="' + i + '" aria-pressed="' + (st.foto === i && !st.local) + '" aria-label="' + esc(f.t || 'Foto ' + (i + 1)) + '"' + (f.ok === false ? ' class="bloq"' : '') + '>' + imgTag(f.th || f.src, '') + '</button>').join('') +
      '<label>' + ICO.foto + 'Foto do celular<input type="file" accept="image/*" data-input="post-arquivo" class="sr"></label></div></section>' +
      '<div style="padding:18px 16px 0;display:flex;flex-direction:column;gap:14px">' +
      '<div class="seg" role="group" aria-label="Destaque do título">' + Object.keys(VARS).map(k => '<button type="button" data-acao="post-var" data-v="' + k + '" aria-pressed="' + (st.var === k) + '">' + k + '</button>').join('') + '</div>' +
      '<label class="campo">Título<input id="post-titulo" maxlength="60" value="' + esc(st.titulo) + '" data-input="post-texto"></label>' +
      '<label class="campo">Linha de apoio<textarea id="post-linha" rows="3" maxlength="160" data-input="post-texto">' + esc(st.linha) + '</textarea></label>' +
      '<label class="campo">Legenda para o post<textarea id="post-legenda" class="legenda" rows="6" data-input="post-legenda">' + esc(st.legenda) + '</textarea><small>Texto montado a partir da ficha do projeto. Confira antes de postar.</small></label>' +
      '<div class="btn-linha"><button type="button" class="btn" data-acao="post-copiar">' + ICO.copiar + 'Copiar legenda</button><button type="button" class="btn" data-acao="post-baixar">' + ICO.baixar + 'Baixar imagem</button></div>' +
      '<button type="button" class="btn btn-pri btn-alto" data-acao="post-compartilhar">' + ICO.zap + 'Compartilhar</button>' +
      (perfil().nome && perfil().tel ? '' : '<p class="nota" style="margin:0">Seu nome e WhatsApp entram no rodapé da arte. <a href="#/perfil">Preencher o perfil</a>.</p>') +
      '</div>';
    desenharPost();
  }
  function textosPost(p, det, c, assunto){
    const info = det.info || {}, tip = tiposTxt(p.tipos, p.amin, p.amax);
    const lugar = noBairro(p.bairro);
    if(assunto === 'local'){
      const pt = c && Array.isArray(c.perto) ? c.perto.find(x => x.bike != null || x.pe != null) : null;
      const titulo = pt ? 'A ' + (pt.pe != null ? pt.pe + ' min a pé' : pt.bike + ' min de bike') + ' ' + (/^(av\.|avenida|rua|r\.|esta[cç])/i.test(pt.nome) ? 'da ' : 'do ') + String(pt.nome).replace(/^(av\.|avenida)\s*/i, 'Av. ').replace(/^(r\.)\s*/i, 'Rua ') : (p.bairro ? maiusc1(lugar) : p.nome);
      return {titulo, linha: [tip, info.destaque].filter(Boolean).join('. ') + '.'};
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
    return {titulo: p.preco ? 'A partir de ' + BRLc(p.preco).replace(' mil', ' mil') : (FASE[p.fase] || 'Conheça'), linha: [tip ? tip + ' ' + lugar : lugar, entregaTxt(p)].filter(Boolean).join(', ') + '.'};
  }
  function legendaPost(p, det, c){
    const pf = perfil(), info = det.info || {};
    const partes = [];
    partes.push(p.nome + (p.bairro ? ', ' + p.bairro : '') + '.');
    const sobre = (c && c.chamada) || info.destaque;
    if(sobre) partes.push(sobre.replace(/\.$/, '') + '.');
    const tip = tiposTxt(p.tipos, p.amin, p.amax);
    if(tip && !sobre) partes.push(tip + '.');
    if(p.preco) partes.push('Tabela a partir de ' + BRL(p.preco) + (p.avista && p.avista < p.preco ? ', ou ' + BRL(p.avista) + ' à vista' : '') + '.');
    partes.push(maiusc1(entregaTxt(p)) + '.');
    partes.push('Me chama que eu mando a tabela e as condições.');
    const ass = [pf.nome, pf.tel, pf.creci ? 'CRECI ' + pf.creci : ''].filter(Boolean).join(' · ');
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
  let logoImg = null;
  async function desenharPost(){
    const st = S.post, cv = $('#post-cv'); if(!st || !cv) return;
    const vez = st.vez = (st.vez || 0) + 1;
    const p = S.byId.get(st.id), V = VARS[st.var] || VARS.Ouro, pf = perfil();
    const W = 1080, H = st.fmt === 'feed' ? 1350 : 1920;
    try{ await Promise.all(['600 92px Oswald', '500 40px Oswald', '400 40px "Public Sans"', '600 34px "Public Sans"', '700 34px "Public Sans"'].map(f => document.fonts.load(f))); }catch(e){}
    if(!logoImg) logoImg = await carregarImg('img/logo-fortal.png', false);
    if(vez !== st.vez || !cv.isConnected) return;
    let foto = null;
    if(st.local) foto = st.local;
    else{
      const f = st.fotos && st.fotos[st.foto];
      if(f){
        foto = await carregarImg(f.src, true);
        f.ok = !!foto;
        if(vez !== st.vez || !cv.isConnected) return;
        if(!foto){
          const alt = st.fotos.findIndex(x => x.ok !== false && x !== f);
          $('#post-aviso').textContent = 'Essa foto não pode ser usada na arte (o site da construtora não libera). ' + (alt >= 0 ? 'Escolha outra ou use uma do celular.' : 'Use uma foto do celular.');
          const b = $('.escolha-fotos [data-i="' + st.foto + '"]'); if(b) b.classList.add('bloq');
        }else $('#post-aviso').textContent = '';
      }
    }
    if(vez !== st.vez) return;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0E0C09'; ctx.fillRect(0, 0, W, H);
    if(foto){
      const r = Math.max(W / foto.width, H / foto.height), w = foto.width * r, h = foto.height * r;
      ctx.drawImage(foto, (W - w) * 0.5, (H - h) * 0.42, w, h);
    }else if(logoImg){
      ctx.globalAlpha = 0.16; const lw = 700, lh = lw * logoImg.height / logoImg.width; ctx.drawImage(logoImg, (W - lw) / 2, H * 0.12, lw, lh); ctx.globalAlpha = 1;
    }
    const pad = 64, maxW = W - pad * 2;
    const quebra = (txt, font, max, linhasMax) => {
      ctx.font = font; const pal = String(txt || '').split(/\s+/).filter(Boolean), L = []; let lin = '';
      for(const w of pal){ const t = lin ? lin + ' ' + w : w; if(ctx.measureText(t).width > max && lin){ L.push(lin); lin = w; } else lin = t; }
      if(lin) L.push(lin);
      if(L.length > linhasMax){ const r = L.slice(0, linhasMax); let u = r[linhasMax - 1]; while(ctx.measureText(u + '…').width > max && u.length) u = u.slice(0, -1); r[linhasMax - 1] = u.replace(/\s+\S*$/, '') + '…'; return r; }
      return L;
    };
    const fT = '600 ' + (st.fmt === 'feed' ? 76 : 88) + 'px Oswald', lhT = st.fmt === 'feed' ? 88 : 100, bx = 26;
    const tit = quebra(st.titulo, fT, maxW - bx * 2, 2);
    const fL = '400 ' + (st.fmt === 'feed' ? 36 : 40) + 'px "Public Sans"', lhL = st.fmt === 'feed' ? 50 : 56;
    const lin = quebra(st.linha, fL, maxW, 3);
    const nomeL = quebra(p.nome, '700 34px "Public Sans"', 420, 2);
    const hBairro = 48, hTit = tit.length * lhT + 22, hLin = lin.length * lhL, hRod = 150, gap = 26;
    const bandH = pad * 0.85 + hBairro + gap * 0.4 + hTit + gap + hLin + gap + 2 + gap + hRod + pad * 0.6;
    const y0 = H - bandH;
    const grad = ctx.createLinearGradient(0, y0 - 220, 0, y0);
    const corBanda = V.banda;
    grad.addColorStop(0, corBanda.replace(/[\d.]+\)$/, '0)')); grad.addColorStop(1, corBanda);
    ctx.fillStyle = grad; ctx.fillRect(0, y0 - 220, W, 220);
    ctx.fillStyle = corBanda; ctx.fillRect(0, y0, W, bandH);
    let y = y0 + pad * 0.85;
    ctx.textBaseline = 'top';
    ctx.font = '600 34px "Public Sans"'; ctx.fillStyle = V.apoio;
    ctx.fillText([p.bairro, quemDe(p)].filter(Boolean).join(', '), pad, y + 4);
    y += hBairro + gap * 0.4;
    ctx.font = fT;
    const larg = Math.max(...tit.map(t => ctx.measureText(t).width)) + bx * 2;
    ctx.fillStyle = V.caixa; ctx.fillRect(pad, y, Math.min(larg, maxW), tit.length * lhT + 22);
    ctx.fillStyle = V.caixaTexto; tit.forEach((t, i) => ctx.fillText(t, pad + bx, y + 12 + i * lhT + (lhT - (st.fmt === 'feed' ? 76 : 88)) * 0.2));
    y += hTit + gap;
    ctx.font = fL; ctx.fillStyle = V.texto; lin.forEach((t, i) => ctx.fillText(t, pad, y + i * lhL));
    y += hLin + gap;
    ctx.fillStyle = V.fio; ctx.fillRect(pad, y, maxW, 2);
    y += 2 + gap;
    // rodapé: logo, nome do projeto e contato
    let xL = pad;
    if(logoImg){ const lh = 128, lw = lh * logoImg.width / logoImg.height; ctx.drawImage(logoImg, pad, y, lw, lh); xL = pad + lw + 22; }
    ctx.font = '700 34px "Public Sans"'; ctx.fillStyle = V.texto; nomeL.forEach((t, i) => ctx.fillText(t, xL, y + 22 + i * 44));
    const nomeC = (pf.nome ? primeiroNome(pf.nome) + ', corretor Fortal' : 'Corretor Fortal'), tel = pf.tel || '', creci = pf.creci ? 'CRECI ' + pf.creci : '';
    ctx.textAlign = 'right'; ctx.font = '600 32px "Public Sans"'; ctx.fillStyle = V.contato;
    ctx.fillText(nomeC, W - pad, y + 18); if(tel) ctx.fillText(tel, W - pad, y + 62);
    if(creci){ ctx.font = '400 26px "Public Sans"'; ctx.fillStyle = V.apoio; ctx.fillText(creci, W - pad, y + 106); }
    ctx.textAlign = 'left';
  }
  async function arquivoPost(){
    const cv = $('#post-cv'); if(!cv) return null;
    try{ return await new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('vazio')), 'image/jpeg', 0.92)); }
    catch(e){ toast('Essa foto não deixa salvar a arte. Escolha outra ou use uma do celular.'); return null; }
  }
  const nomeArquivo = () => { const p = S.byId.get(S.post.id); return 'post-' + (p ? p.id : 'fortal') + '-' + S.post.fmt + '.jpg'; };

  // ================= PERFIL =================
  function telaPerfil(){
    const pf = perfil(), tema = LS.get(K.tema) || 'escuro';
    return '<div class="barra-topo"><a class="ico-btn" href="#/" aria-label="Voltar para o início">' + ICO.voltar + '</a><h1>Perfil e ajustes</h1></div>' +
      '<form id="f-perfil" style="padding:18px 16px 0;display:flex;flex-direction:column;gap:16px" autocomplete="on">' +
      '<p class="texto-2">Seu nome e WhatsApp vão no link que o cliente abre e no rodapé dos posts. Ficam só neste celular.</p>' +
      '<label class="campo">Seu nome<input id="pf-nome" name="name" autocomplete="name" maxlength="40" value="' + esc(pf.nome || '') + '"></label>' +
      '<label class="campo">Seu WhatsApp<input id="pf-tel" name="tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="(11) 90000-0000" value="' + esc(pf.tel || '') + '"></label>' +
      '<label class="campo">CRECI<input id="pf-creci" maxlength="20" placeholder="Opcional" value="' + esc(pf.creci || '') + '"><small>Aparece embaixo do telefone nos posts.</small></label>' +
      '<fieldset><legend>Tema</legend><div class="seg" role="group" aria-label="Tema">' + [['escuro', 'Escuro'], ['claro', 'Claro'], ['sistema', 'Do celular']].map(t => '<button type="button" data-acao="tema" data-v="' + t[0] + '" aria-pressed="' + (tema === t[0]) + '">' + t[1] + '</button>').join('') + '</div></fieldset>' +
      '<button class="btn btn-pri btn-alto" type="submit">Salvar</button></form>' +
      '<section class="sec" style="display:flex;flex-direction:column;gap:10px"><h2 class="h3">Código do time</h2><p class="texto-2">O app usa o mesmo código do app dos Espelhos. Se o código mudar, entre de novo.</p>' +
      '<button type="button" class="btn" data-acao="sair">Trocar o código</button>' +
      '<a class="btn" href="' + esc(ESP) + '" target="_blank" rel="noopener">Abrir o app dos Espelhos</a>' +
      '<p class="nota">Versão ' + esc(VERSAO) + '. Dados lidos às ' + esc(hora(S.geradoEm)) + '.</p></section>';
  }
  function aplicarTema(t){
    const claro = t === 'claro' || (t === 'sistema' && matchMedia('(prefers-color-scheme: light)').matches);
    if(claro) document.documentElement.setAttribute('data-tema', 'claro'); else document.documentElement.removeAttribute('data-tema');
    const m = $('meta[name="theme-color"]'); if(m) m.setAttribute('content', claro ? '#F6F3EC' : '#0E0C09');
  }

  // ================= folhas e avisos =================
  function abrirFolha(id, titulo, corpo, pe){
    fecharFolhas();
    const d = document.createElement('dialog'); d.className = 'folha'; d.id = 'folha-' + id; d.setAttribute('aria-labelledby', 'folha-t-' + id);
    d.innerHTML = '<div class="folha-cab"><h2 id="folha-t-' + id + '">' + esc(titulo) + '</h2><button type="button" class="ico-btn" data-acao="fechar-folha" aria-label="Fechar">' + ICO.fechar + '</button></div>' +
      '<div class="folha-corpo">' + corpo + '</div>' + (pe ? '<div class="folha-pe">' + pe + '</div>' : '<div class="folha-pe" hidden></div>');
    $('#folhas').appendChild(d);
    d.addEventListener('close', () => { d.remove(); if(id === 'filtros') atualizarImoveis(); });
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
  function toast(m, ms){ const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms || 3200); }
  async function copiar(txt, ok){ try{ await navigator.clipboard.writeText(txt); toast(ok || 'Copiado.'); }catch(e){ toast('Não deu para copiar. Toque e segure no texto para copiar.', 5000); } }

  // ================= eventos =================
  document.addEventListener('click', async ev => {
    const el = ev.target.closest('[data-acao]'); if(!el) return;
    const a = el.dataset.acao, v = el.dataset.v, id = el.dataset.id;
    const f = S.f;
    const tog = (arr, x) => arr.includes(x) ? arr.filter(y => y !== x) : arr.concat([x]);
    switch(a){
      case 'focar-busca': S.focarBusca = true; break;
      case 'abrir-filtros': if(location.hash !== '#/imoveis'){ S.abrirFiltros = true; } else { ev.preventDefault(); abrirFiltros(); } break;
      case 'ver-fase': f.fases = v.split(','); f.cons = []; f.mostra = 8; salvarF(); break;
      case 'ver-cons': f.cons = [v]; f.fases = []; f.mostra = 8; salvarF(); break;
      case 'rank': S.ui.rank = v; render(); break;
      case 'cons': f.cons = v ? tog(f.cons, v) : []; f.mostra = 8; salvarF(); atualizarImoveis(); break;
      case 'fase': f.fases = v ? tog(f.fases, v) : []; f.mostra = 8; salvarF(); atualizarImoveis(); break;
      case 'limpar-q': f.q = ''; salvarF(); { const i = $('#q'); if(i){ i.value = ''; i.focus(); } el.hidden = true; } atualizarImoveis(); break;
      case 'tirar': {
        if(v === 'q'){ f.q = ''; const i = $('#q'); if(i) i.value = ''; }
        else if(v === 'teto') f.teto = 0; else if(v === 'area') f.area = 0; else if(v === 'ate') f.ate = 0; else if(v === 'livres') f.livres = true;
        else if(v.startsWith('dorm:')) f.dorms = f.dorms.filter(x => x !== v.slice(5)); else if(v.startsWith('zona:')) f.zonas = f.zonas.filter(x => x !== v.slice(5));
        salvarF(); atualizarImoveis(); break;
      }
      case 'limpar-tudo': Object.assign(f, {q: '', cons: [], fases: [], teto: 0, dorms: [], ate: 0, zonas: [], area: 0, livres: true, mostra: 8}); salvarF(); { const i = $('#q'); if(i) i.value = ''; } atualizarImoveis(); break;
      case 'mais-res': f.mostra += 8; atualizarImoveis(); break;
      case 'fil': {
        const g = el.dataset.g;
        if(g === 'teto') f.teto = +v; else if(g === 'area') f.area = +v; else if(g === 'ate') f.ate = +v; else if(g === 'livres') f.livres = v === '1';
        else if(g === 'dorm') f.dorms = tog(f.dorms, v); else if(g === 'zona') f.zonas = tog(f.zonas, v);
        f.mostra = 8; salvarF();
        const d = el.closest('dialog');
        if(d){ $$('[data-g="' + g + '"]', d).forEach(b => { const bv = b.dataset.v; const on = g === 'teto' ? +bv === f.teto : g === 'area' ? +bv === f.area : g === 'ate' ? +bv === f.ate : g === 'livres' ? (bv === '1') === f.livres : g === 'dorm' ? f.dorms.includes(bv) : f.zonas.includes(bv); b.setAttribute('aria-pressed', on); }); const vn = $('#ver-n'); if(vn) vn.textContent = verNTxt(); }
        break;
      }
      case 'limpar-folha': Object.assign(f, {teto: 0, dorms: [], ate: 0, zonas: [], area: 0, livres: true, mostra: 8}); salvarF(); fecharFolhas(); abrirFiltros(); break;
      case 'fechar-folha': { const d = el.closest('dialog'); if(d) d.close(); break; }
      case 'feed': S.ui.feed = v; S.ui.feedMostra = 12; render(); break;
      case 'mais-feed': S.ui.feedMostra += 20; render(); break;
      case 'voltar': if(history.length > 1 && S.veioDeDentro){ ev.preventDefault(); history.back(); } break;
      case 'foto': { const g = $('#gal'); if(g) g.scrollTo({left: +el.dataset.i * g.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); break; }
      case 'recarregar': render(); break;
      case 'tentar': el.disabled = true; el.textContent = 'Tentando…'; carregar('inicio'); break;
      case 'enviar': ev.preventDefault(); abrirEnvio(id, el.dataset.sel === '1'); break;
      case 'env-modo': S.envio.modo = v; $$('[data-acao="env-modo"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); break;
      case 'env-fmt': S.envio.formato = v; $$('[data-acao="env-fmt"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); { const n = $('#env-fmt-nota'); if(n) n.textContent = v === 'ficha' ? 'Fotos, plantas, lazer, mapa e até 4 unidades com valores.' : 'Uma página com as unidades marcadas, fotos e valores. Até 40 unidades.'; } break;
      case 'env-criar': criarEnvio(); break;
      case 'env-copiar': { const m = $('#env-msg'); copiar(m ? m.value : (S.envioPronto || {}).msg, 'Mensagem com o link copiada.'); break; }
      case 'env-wa': { const m = $('#env-msg'); if(m) el.href = 'https://wa.me/?text=' + encodeURIComponent(m.value); break; }
      case 'tab-modo': S.ui.tabModo[id] = v; render(); break;
      case 'tab-fil': S.ui.tabFiltro = v; S.ui.tabMostra = 120; render(); break;
      case 'tab-mais': S.ui.tabMostra = (S.ui.tabMostra || 120) + 200; render(); break;
      case 'tab-ck': {
        const s = S.ui.tabSel.get(id) || new Set(); const n = el.dataset.n;
        if(s.has(n)) s.delete(n); else { if(s.size >= 40){ toast('Até 40 unidades por link.'); break; } s.add(n); }
        S.ui.tabSel.set(id, s); render(); break;
      }
      case 'tab-limpar': S.ui.tabSel.delete(id); render(); break;
      case 'tab-abrir': { const k = id + ':' + el.dataset.n; S.ui.tabAberta = S.ui.tabAberta === k ? null : k; render(); break; }
      case 'post-fmt': S.post.fmt = v; prepararPost(S.post.id); break;
      case 'post-assunto': { S.post.assunto = v; const p = S.byId.get(S.post.id), t = textosPost(p, S.post.det, S.post.c, v); S.post.titulo = t.titulo; S.post.linha = t.linha; $('#post-titulo').value = t.titulo; $('#post-linha').value = t.linha; $$('[data-acao="post-assunto"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); desenharPost(); break; }
      case 'post-var': S.post.var = v; $$('[data-acao="post-var"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); desenharPost(); break;
      case 'post-foto': S.post.foto = +el.dataset.i; S.post.local = null; $$('[data-acao="post-foto"]').forEach(b => b.setAttribute('aria-pressed', b === el)); desenharPost(); break;
      case 'post-copiar': copiar($('#post-legenda').value, 'Legenda copiada.'); break;
      case 'post-baixar': {
        const b = await arquivoPost(); if(!b) break;
        const u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = nomeArquivo(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
        toast('Imagem salva.'); break;
      }
      case 'post-compartilhar': {
        const b = await arquivoPost(); if(!b) break;
        const file = new File([b], nomeArquivo(), {type: 'image/jpeg'});
        const txt = $('#post-legenda').value;
        if(navigator.canShare && navigator.canShare({files: [file]})){
          try{ await navigator.share({files: [file], text: txt}); }catch(e){ if(e && e.name !== 'AbortError') toast('Não deu para compartilhar. Use "Baixar imagem".'); }
        }else{
          const u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = nomeArquivo(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
          copiar(txt, 'Imagem salva e legenda copiada. Agora é só colar no Instagram ou no WhatsApp.');
        }
        break;
      }
      case 'tema': LS.set(K.tema, v); aplicarTema(v); $$('[data-acao="tema"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); break;
      case 'sair': sair(''); break;
    }
  });
  document.addEventListener('input', ev => {
    const el = ev.target, k = el.dataset && el.dataset.input; if(!k) return;
    if(k === 'q'){ S.f.q = el.value; S.f.mostra = 8; salvarF(); const l = el.parentElement.querySelector('.limpar'); if(l) l.hidden = !el.value; clearTimeout(S.tq); S.tq = setTimeout(atualizarImoveis, 120); }
    else if(k === 'lista'){ S.ui.listaQ = el.value; clearTimeout(S.tq); S.tq = setTimeout(() => atualizarLista(el.dataset.modo), 120); }
    else if(k === 'post-texto'){ S.post.titulo = $('#post-titulo').value; S.post.linha = $('#post-linha').value; clearTimeout(S.tp); S.tp = setTimeout(desenharPost, 150); }
    else if(k === 'post-legenda'){ S.post.legenda = el.value; }
  });
  document.addEventListener('change', async ev => {
    const el = ev.target, k = el.dataset && el.dataset.input; if(!k) return;
    if(k === 'ordem'){ S.f.ordem = el.value; salvarF(); atualizarImoveis(); }
    else if(k === 'env-u'){ const n = $$('#env-us input:checked').length; if(n > 40){ el.checked = false; toast('Até 40 unidades por link.'); } }
    else if(k === 'post-arquivo'){
      const f = el.files && el.files[0]; if(!f) return;
      const u = URL.createObjectURL(f); const im = await carregarImg(u, false);
      if(im){ S.post.local = im; $$('[data-acao="post-foto"]').forEach(b => b.setAttribute('aria-pressed', 'false')); $('#post-aviso').textContent = 'Usando a foto do celular.'; desenharPost(); }
      else toast('Não consegui abrir essa foto.');
    }
  });
  document.addEventListener('submit', ev => {
    if(ev.target.id === 'f-perfil'){
      ev.preventDefault();
      salvarPerfil({nome: $('#pf-nome').value.trim(), tel: $('#pf-tel').value.trim(), creci: $('#pf-creci').value.trim()});
      toast('Perfil salvo.');
    }
  });
  window.addEventListener('hashchange', () => { S.veioDeDentro = true; });

  // ================= início =================
  aplicarTema(LS.get(K.tema) || 'escuro');
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
      if(document.querySelector('dialog[open]') || /^#\/posts\//.test(location.hash) || (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName))) return;
      recarregou = true; location.reload();
    });
  }
})();
