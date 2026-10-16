# App do Corretor · Fortal

App (PWA) para os corretores da Fortal, no celular e no computador: pregão ao vivo dos espelhos de vendas, imóveis com filtro completo por projeto e por unidade, ficha de cada projeto, tabela de unidades com fluxo de pagamento, downloads (fotos em .zip, ficha e tabela em PDF, tabela em Excel), link para o cliente e gerador de post.

- No ar: https://luizmiguel08.github.io/corretor/
- Celular: barra embaixo. Computador (1024 px ou mais): barra lateral, filtro fixo ao lado dos resultados e ficha em duas colunas.
- Dados: as mesmas tabelas do app dos Espelhos (Supabase), lidas pelas funções `corretor_resumo`, `corretor_unidades` (índice das unidades livres, para o filtro unidade por unidade) e `corretor_projeto`, que exigem o código do time.
- Fotos para baixar, compartilhar e desenhar o post: direto do site quando ele libera, senão pela função `corretor-foto` (Supabase Edge Function, também exige o código do time).
- Link para o cliente: usa `selecao_criar` (página `espelhos/s.html`, até 40 unidades de até 15 projetos) ou `link_criar` (ficha completa em `espelhos/nex/`), então os links aparecem também em "Enviadas" no app dos Espelhos.
- Fichas completas e fotos da central vêm de `/espelhos/nex/p/<id>.json` e `/espelhos/nex/img/`, no mesmo site.

Ao publicar uma versão nova, troque o `?v=` de `app.css` e `app.js` no `index.html` e na lista `CASCA` do `sw.js`, e o nome `VERSAO` do `sw.js`.

Fonte: Mona Sans (variável em largura e peso), servida do próprio app em `fonts/`, licença SIL Open Font License (`fonts/LICENSE-MonaSans.txt`).
