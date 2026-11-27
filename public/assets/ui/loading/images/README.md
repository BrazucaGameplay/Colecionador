# Artes da tela de carregamento

As três artes finais já estão armazenadas nesta pasta e registradas em
`src/loading/loading-images.js`.

Arquivos ativos:
- `ogra.webp`
- `ciclopesa.webp`
- `lamia.webp`

As imagens originais foram mantidas sem redimensionamento ou recompressão.
A tela HTML exibe uma arte por vez, alternando a cada 7 segundos durante o
carregamento. A ilustração usa `object-fit: contain` para preservar toda a
composição; em telas horizontais, a mesma arte desfocada preenche as laterais.

Para adicionar novas artes, envie o arquivo WebP para esta pasta e inclua seu
caminho relativo a `public/` no array `LOADING_IMAGES`.
