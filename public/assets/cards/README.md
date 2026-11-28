# Assets finais de cartas

Monstros comuns, Boss e waifus usam o mesmo contrato de apresentação HTML, com dados de domínio separados.

- Monstro: `monsters/<species-id>/card.png`
- Boss: `bosses/<boss-id>/card.png`
- Waifu: `waifus/<waifu-id>/card.png`

Colocar o arquivo original final, sem alteração, em `card.png`. Preservar pixels, resolução intrínseca e proporção. Não cortar, esticar, filtrar, recomprimir, adicionar borda, nome ou texto. O HTML usa enquadramento proporcional integral (contain); o painel se adapta à arte. 2:3 é o padrão visual, mas não se altera o original para forçar essa proporção. Formato preferencial PNG.

A origem principal das cartas de waifus permanece no repositório separado. Este diretório recebe cópia final apenas quando necessária para distribuição neste jogo.

## Carta do Slime
Caminho: `public/assets/cards/monsters/slime/card.png`. A referência enviada em 27/11/2026 tem 1024 × 1536 px. O arquivo binário ainda deve ser colocado pelo usuário; não há imagem provisória.
