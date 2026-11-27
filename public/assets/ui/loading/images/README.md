# Artes da tela de carregamento

Coloque nesta pasta as imagens que serão alternadas durante o carregamento do jogo.

## Como registrar as imagens
Depois de enviar os arquivos para esta pasta, adicione seus caminhos em
`src/loading/loading-images.js`, por exemplo:

```js
export const LOADING_IMAGES = [
  'assets/ui/loading/images/ogro-01.webp',
  'assets/ui/loading/images/ogro-02.webp',
  'assets/ui/loading/images/ogro-03.webp'
];
```

## Especificações recomendadas
- Orientação vertical: proporção 2:3 (ex.: 1024 × 1536).
- Formato: WebP; AVIF também pode ser usado em navegadores modernos.
- Resolução sugerida: 1024 × 1536 ou 1200 × 1800.
- Peso desejável: 150–350 KB por imagem, ajustando qualidade sem artefatos.
- Sem textos, logotipos ou barras desenhadas na arte: a interface HTML sobrepõe esses elementos.
- Mantenha o personagem inteiro dentro da área segura, evitando detalhes importantes nas bordas.

A tela usa `object-fit: contain` para preservar a ilustração inteira. Em telas
horizontais, o espaço lateral é preenchido por uma versão desfocada da mesma arte.
A rotação ocorre a cada 7 segundos; imagens inválidas são ignoradas.
