#!/bin/bash
# Converte img/out/*.png (do ChatGPT) para img/*.webp leves que o quiz usa.
# Raças e portes: quadradas 320 px (aparecem em círculo de 44 a 92 px, com folga para tela retina). Hero: 1200 px de largura.
cd "$(dirname "$0")"
for f in out/*.png; do
  [ -s "$f" ] || continue
  n=$(basename "$f" .png)
  if [ "$n" = "hero" ]; then
    ffmpeg -loglevel error -y -i "$f" -vf "scale=1200:-2" -c:v libwebp -quality 78 "$n.webp"
  else
    # corta no rosto (quadrado de 64% da largura, a partir de 2% do topo): no círculo pequeno o corpo inteiro some
    ffmpeg -loglevel error -y -i "$f" -vf "crop='iw*0.64':'iw*0.64':'iw*0.18':'ih*0.02',scale=320:320" -c:v libwebp -quality 80 "$n.webp"
  fi
  echo "$n.webp $(du -k "$n.webp" | cut -f1) KB"
done
