# Assets finais de cartas

Monstros comuns, Boss e waifus usam o mesmo contrato de apresentação HTML, com dados de domínio separados.

- Monstro: `monsters/<species-id>/card.<ext>`
- Boss: `bosses/<boss-id>/card.<ext>`
- Waifu: `waifus/<waifu-id>/card.<ext>`

Colocar o arquivo original final, sem alteração, em `card.<ext>`. Preservar pixels, resolução intrínseca e proporção. Não cortar, esticar, filtrar, recomprimir, adicionar borda, nome ou texto. O HTML usa enquadramento proporcional integral (contain); o painel se adapta à arte. 2:3 é o padrão visual, mas não se altera o original para forçar essa proporção. Formato preferencial PNG.

A origem principal das cartas de waifus permanece no repositório separado. Este diretório recebe cópia final apenas quando necessária para distribuição neste jogo.

## Carta do Slime
Caminho: `public/assets/cards/monsters/slime/card.<ext>`. A referência enviada em 27/11/2026 tem 1024 × 1536 px. O usuário forneceu 11 cartas JPG, organizadas em pastas individuais; nenhum arquivo foi convertido ou alterado.
