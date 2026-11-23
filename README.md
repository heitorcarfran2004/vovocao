# Quiz do cão idoso ("Diagnóstico Vovocão")

Rodar: `node servidor.cjs` → http://localhost:4271

- Abertura: `?v=1` a `?v=5` (as 5 variações). Ex.: http://localhost:4271/?v=3
- Barra do diagnóstico mais curta para testar: `&carga=8` (padrão 75 s, ≈ duração da VSL).
- VSL: pôr o arquivo em `video/vsl.mp4` (vertical). Sem o arquivo aparece o espaço reservado.

## Arquivos
- `index.html`: o quiz inteiro (etapas na lista `E`, até 30).
- `dados/racas-quiz.js`: GERADO por `node ferramentas/gerar-dados.cjs` a partir de `pesquisa/cao-idoso/racas/racas.json`.
  - Doença e pergunta por raça, ligadas aos 7 sinais do radar.
  - Ganchos de peso trocados (o quiz vende longevidade, não emagrecimento).
- `dados/racas-todas.js`: banco de ~90 raças para "Outra raça", com porte, ficha e apelidos/escritas erradas.
- `dados/busca-raca.js`: casa o texto digitado.
  - Passos: chave fonética PT, depois apelido, depois "contém", depois distância de edição + pares de letras.
  - Abaixo de 0,68 vai para a pergunta do porte.
- `ferramentas/racas-digitadas.cjs`: relatório do que foi digitado em "Outra raça". Mostra o que não casou, o que casou com nota baixa e as raças mais comuns fora dos botões.

## Fotos (img/)
- `hero.webp` (abertura, 1200 px), `raca-<id>.webp` (11 raças dos botões, cortadas no rosto, 320 px) e `porte-<pequeno|medio|grande>.webp`.
- Foram geradas no ChatGPT em 21/11, com os pedidos em `img/prompts/*.txt` e os originais em `img/out/*.png`. **Daqui pra frente, gerar no Flow** (projeto "cão idoso").
- Para trocar uma foto: pôr o PNG novo em `img/out/<nome>.png` e rodar `bash img/converter.sh`.
- Sem o arquivo, o quiz mostra um emoji no lugar (nada quebra).

## Eventos (abandono por etapa)
`/api/e` grava em `_eventos-local.ndjson`: `etapa` (cada tela vista), `resposta`, `raca_digitada` (texto, chave, casou, ficha, método, nota, sugestões), `radar`, `carga_fim`, `oferta`.
Na Vercel, trocar por uma função que grava no Supabase, como no quiz do Ninho Calmo.

## Regras do radar
- 3 estados só: Atenção, Observar, Não observado. **Nunca "ok".**
- A resposta "boa" vira "Observar" (continua precisando acompanhar). "Não reparei" vira "Não observado".
- Se a raça tem risco conhecido naquele sinal e a resposta foi "boa", sobe para "Atenção (risco conhecido da raça)".
- Sempre há pelo menos 1 "Atenção".
- "Você acompanha X de 7" = sinais que não ficaram "Não observado".
