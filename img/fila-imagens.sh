#!/bin/bash
# Gera as fotos do quiz no ChatGPT (Chrome de automação, porta 9222), com scripts/pet-gpt-imagem.cjs.
# Uso: bash img/fila-imagens.sh nome1 nome2 ...   (cada nome tem img/prompts/<nome>.txt; sai img/out/<nome>.png)
# Rodar 3 filas em paralelo, cada uma com a sua lista. Para tudo se aparecer img/out/PARAR.txt (limite do ChatGPT).
R="c:/Users/thorz/OneDrive/Desktop/Claude/Visual St - Claude"
Q="$R/funis/cao-idoso-quiz/img"
cd "$R"
for nome in "$@"; do
  saida="$Q/out/$nome.png"
  for t in 1 2 3; do
    [ -s "$saida" ] && break
    [ -f "$Q/out/PARAR.txt" ] && { echo "$nome: PARADO ($(cat "$Q/out/PARAR.txt"))"; exit 0; }
    echo "$nome tentativa $t $(date +%H:%M:%S)"
    node scripts/pet-gpt-imagem.cjs "$Q/prompts/$nome.txt" "$saida" > "$saida.log" 2>&1
    if grep -q "RECUSA/LIMITE" "$saida.log"; then
      m=$(grep -oE "reset_min=[0-9]+" "$saida.log" | head -1 | cut -d= -f2)
      if [ -n "$m" ] && [ "$m" -le 10 ]; then echo "$nome freio curto $m min"; sleep $(( (m+1)*60 )); else grep RECUSA "$saida.log" > "$Q/out/PARAR.txt"; echo "$nome LIMITE"; exit 0; fi
    fi
  done
  [ -s "$saida" ] && echo "$nome OK $(date +%H:%M:%S)" || echo "$nome FALHOU: $(tail -2 "$saida.log")"
done
echo "FILA FIM $(date +%H:%M:%S)"
