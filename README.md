# Conquistador de Waifu's

Projeto de RPG 2D de acao com estetica anime, desenvolvido com Phaser 4 e Vite, com foco em Android e suporte a PWA.

## Documentos principais

- [Estado atual e continuidade](docs/ESTADO_DO_PROJETO.md) — fonte central para o que esta implementado, validacoes e proximas etapas.\n- [Arquitetura do mundo por ilhas](docs/ARQUITETURA_DO_MUNDO_POR_ILHAS.md) — decisão aprovada, transições, carregamento de uma ilha por vez e plano de implementação.
- [Plano de arquitetura e desenvolvimento](docs/PLANO_ARQUITETURA_E_DESENVOLVIMENTO.txt) — arquitetura-alvo, principios tecnicos e roteiro.
- [Diretriz de reutilizacao do repositorio original](docs/DIRETRIZ_DE_REUSO_DO_REPOSITORIO_ORIGINAL.txt) — limites para consultar e reutilizar assets historicos.

## Desenvolvimento

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

O build e o deploy web nao substituem testes em dispositivo Android real.
