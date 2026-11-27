# Otimização dos atlas de animação do protagonista

- Quadros-fonte preservados em 128 × 128 px.
- O preload inicial carrega apenas repouso e corrida.
- Morte, salto, ataques e movimentos especiais são carregados na primeira utilização.
- Cada atlas é reorganizado em páginas independentes por direção, compactadas em grade quase quadrada.
- Cada página gerada respeita 2048 × 2048 px.
- A imagem original é removida do Texture Manager após a extração.
- Páginas direcionais já registradas permanecem em cache durante a sessão para evitar recargas a cada ataque.

## Limites

A memória RGBA teórica é largura × altura × 4 bytes; o tamanho comprimido do PNG não representa a memória gráfica decodificada. A memória residente começa menor porque os pacotes de ação são adiados, mas cresce quando novas ações são utilizadas e ficam em cache durante a sessão. O benefício exato precisa ser medido no Android.

## Validação

O teste de layout verifica agrupamento por direção, ordenação, dimensões e limite máximo. O workflow também valida os pivôs e pares PNG/JSON. A inspeção no Android deve confirmar transições, primeiro ataque após carregamento, pivôs, memória e FPS.
