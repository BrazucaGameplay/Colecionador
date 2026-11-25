# Sprites de monstros

Os atlas finais de monstros serão colocados em pastas por espécie:

- `slime/slime-idle.png` + `slime/slime-idle.json`
- `slime/slime-walk.png` + `slime/slime-walk.json`
- `slime/slime-attack.png` + `slime/slime-attack.json`
- `slime/slime-death.png` + `slime/slime-death.json`

Os caminhos são relativos a `public/assets/monsters/`.

O JSON usa o contrato de atlas do projeto (`colecionador.sprite-atlas.v1`),
com `fps`, `pivot` e `frames`. Cada quadro deve informar `frame`,
`direction`, `x`, `y`, `width`, `height`, `pivotX` e `pivotY`.
Os nomes de quadros gerados pelo loader são `d{direction}-f{frame}`.

Depois de enviar os pares PNG/JSON:
1. Ativar `visual.enabled` na definição da espécie.
2. Conferir os nomes dos arquivos em `src/data/monsters/index.js`.
3. Validar pivôs e metadados antes de testar no Android.

Não colocar cartas/ilustrações 2:3 neste diretório como se fossem spritesheets.
O renderer de jogo espera atlas de animação com quadros e pivôs por direção.
