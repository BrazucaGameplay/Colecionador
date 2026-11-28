# Conquistador de Waifu's

RPG 2D de ação com estética anime, desenvolvido com Phaser 4, JavaScript ES modules e Vite. O projeto prioriza Android e mantém distribuição web/PWA.

## Requisitos

- Node.js 26.13.1 LTS (versão registrada em `.nvmrc`)
- npm 11.20.0
- Para gerar/compilar o aplicativo nativo: Android Studio 2025.2.1 ou superior e Android SDK API 24 ou superior

## Instalação

```bash
npm ci
```

O `package-lock.json` é versionado; use `npm ci` para instalar as dependências reproduzíveis.

## Desenvolvimento web

```bash
npm run dev
```

## Testes e build

```bash
npm test
npm run build
npm audit
```

## Android / Capacitor

```bash
npm run android:init
npm run android:sync
npm run android:open
```

O build web e o deploy PWA não substituem a sincronização, compilação e validação em dispositivo Android real.

## Documentos principais

- [Estado atual e continuidade](docs/ESTADO_DO_PROJETO.md) — resumo curto da stack, implementação e pendências.
- [Changelog](docs/CHANGELOG.md) — histórico consolidado de decisões e marcos.
- [Arquitetura de monstros e Boss](docs/ARQUITETURA_MONSTROS_E_BOSSES.md) — contratos de espécies, Boss, status, atividade e bestiário.
- [Arquitetura do mundo por ilhas](docs/ARQUITETURA_DO_MUNDO_POR_ILHAS.md) — direção aprovada e plano incremental.
- [Plano de arquitetura e desenvolvimento](docs/PLANO_ARQUITETURA_E_DESENVOLVIMENTO.txt) — princípios técnicos e roteiro.
- [Processo obrigatório de atualização](docs/PROCESSO_OBRIGATORIO_DE_ATUALIZACAO.md) — versionamento, auditoria e critérios de publicação.
- [Guia de sprites de monstros](docs/GUIA_DE_SPRITES_DE_MONSTROS.md) — contrato dos atlas PNG/JSON.

- [Acordo de trabalho](docs/ACORDO_DE_TRABALHO.md) — divisão entre tarefas do assistente e etapas do usuário.
- [Arquitetura de cartas HTML](docs/ARQUITETURA_CARTAS_HTML.md) — contrato visual e navegação de cartas de monstros, Boss e waifus.
