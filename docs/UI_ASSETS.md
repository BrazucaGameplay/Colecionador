# Contrato de assets da interface

A interface foi separada em HUD, painéis e componentes. As artes finais devem ser adicionadas nos diretórios:

- \`public/assets/ui/panels/\`: molduras e fundos dos painéis.
- \`public/assets/ui/buttons/\`: botões de ação, navegação e fechar.
- \`public/assets/ui/hud/\`: molduras e preenchimentos das barras de HP e energia.

## Regras de integração

- Preferir WebP otimizado.
- Usar transparência real quando a arte exigir recorte.
- Não incorporar rótulos ou valores dinâmicos nas imagens.
- Para molduras que serão redimensionadas, informar as margens de corte (Nine Slice).
- Para barras, separar a moldura do preenchimento para que o jogo continue refletindo os valores reais do jogador.

Os componentes atuais usam formas vetoriais temporárias e não carregam os assets antigos. As imagens novas serão conectadas após o envio e a conferência das dimensões.
