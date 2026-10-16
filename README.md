# App do Corretor · Fortal

App de celular (PWA) para os corretores da Fortal: pregão ao vivo dos espelhos de vendas, busca com filtros, ficha de cada projeto, tabela de unidades com fluxo de pagamento, link para o cliente e gerador de post.

- No ar: https://luizmiguel08.github.io/corretor/
- Dados: as mesmas tabelas do app dos Espelhos (Supabase), lidas pelas funções `corretor_resumo` e `corretor_projeto`, que exigem o código do time.
- Link para o cliente: usa `selecao_criar` (página `espelhos/s.html`) ou `link_criar` (ficha completa em `espelhos/nex/`), então os links aparecem também em "Enviadas" no app dos Espelhos.
- Fichas completas e fotos vêm de `/espelhos/nex/p/<id>.json` e `/espelhos/nex/img/`, no mesmo site.

Ao publicar uma versão nova, troque o `?v=` de `app.css` e `app.js` no `index.html` e na lista `CASCA` do `sw.js`, e o nome `VERSAO` do `sw.js`.

Fontes Oswald e Public Sans pelo Google Fonts (SIL Open Font License).
