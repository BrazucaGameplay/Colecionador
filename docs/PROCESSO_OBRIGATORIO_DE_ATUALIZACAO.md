# Processo obrigatório de modificações, versionamento e atualização

Este arquivo complementa `docs/ESTADO_DO_PROJETO.md` e `docs/CHANGELOG.md`. O estado atual é mantido no primeiro; marcos históricos no segundo. Seguir este processo em toda tarefa realizada no repositório `BrazucaGameplay/Colecionador`, branch `main`.

## 1. Regra de versionamento: toda modificação exige nova versão

- **Toda modificação efetiva no repositório exige incrementar a versão do jogo**, inclusive alterações em código, assets, configurações, documentação de contexto, workflows, dependências e correções pequenas.
- Não agrupar várias modificações independentes sob uma versão que já foi utilizada em um commit anterior. Cada conjunto de alterações concluído deve ter seu próprio incremento de versão.
- Atualizar o campo `version` em `package.json` no mesmo conjunto de alterações da modificação.
- Manter o versionamento semântico:
  - **PATCH** (`1.3.4 → 1.3.5`): correções, ajustes, assets, documentação e mudanças compatíveis que não adicionam uma funcionalidade significativa.
  - **MINOR** (`1.3.4 → 1.4.0`): novas funcionalidades compatíveis.
  - **MAJOR** (`1.3.4 → 2.0.0`): mudanças incompatíveis ou que exigem migração.
- Se houver outros arquivos de versão, manifests, metadados Android ou configurações de build que precisem acompanhar a versão, identificá-los no repositório e mantê-los consistentes. Não inventar arquivos de versão nem alterar identificadores sem necessidade.
- Antes de editar, conferir a versão real na branch de destino. Nunca deduzir a versão pelo histórico da conversa.
- Ao final, informar a versão anterior, a nova versão e o commit que contém a atualização.

## 2. Recap obrigatório do jogo após cada modificação

Ao concluir cada conjunto de alterações, produzir um **recap do estado integral do jogo**, não apenas uma lista do que foi modificado. O recap deve ser atualizado com base no estado real do repositório e cobrir:

1. **Produto e plataforma:** objetivo atual, experiência pretendida, suporte Android e situação da preparação para APK/Google Play.
2. **Mundo e conteúdo:** organização do mundo em ilhas independentes, carregamento/expansão e conteúdo implementado versus planejado.
3. **Gameplay:** sistemas realmente existentes, controles, movimentação, exploração, combate, progressão, personagens, skins, waifus, monstros, itens e menus, conforme o código atual.
4. **Arquitetura:** Phaser, Vite, JavaScript, cenas/sistemas, gerenciamento de estado, renderização, física, entrada, carregamento de assets e integrações relevantes.
5. **Assets:** arquivos efetivamente presentes e utilizados, caminhos, formatos, animações, dependências e recursos removidos ou substituídos.
6. **Interface e experiência mobile:** orientação, escala, responsividade, controles por toque, legibilidade e comportamento em telas Android, conforme implementado.
7. **Build e publicação:** scripts, workflows, configuração de hospedagem, artefatos gerados e estado da última publicação verificável.
8. **Pendências e riscos:** funcionalidades ausentes, limitações conhecidas, divergências, testes que ainda dependem do aparelho ou de serviços externos.

Em cada tópico, distinguir claramente:
- **Implementado e verificado**;
- **Existe parcialmente ou precisa de validação**;
- **Planejado, mas ainda não implementado**.

Não apresentar intenção antiga, memória de conversa ou plano futuro como funcionalidade existente. Se o estado de alguma área não puder ser inspecionado, registrar como não verificado em vez de presumir.

## 3. Auditoria obrigatória de prontidão para atualização

Depois de cada modificação, fazer uma revisão de ponta a ponta para determinar se o jogo está apto a receber a atualização. Não basta confirmar que o commit foi criado.

Verificar, conforme aplicável:

- coerência entre `package.json`, lockfiles e dependências instaladas/declaradas;
- imports, exports, caminhos, nomes e capitalização de arquivos;
- referências a assets: cada recurso exigido existe, é carregado pelo caminho correto e está incluído no build;
- consistência entre sistemas, cenas, entidades, dados, animações e configurações;
- ausência de referências obsoletas a arquivos, modelos, armas ou recursos removidos;
- scripts de build e validações executados pelo workflow;
- configuração do Vite e caminhos de saída;
- workflows do GitHub Actions: gatilhos, permissões, validações, build, artefatos e publicação;
- configuração de hospedagem/Pages e caminho base, quando aplicável;
- consistência da versão em todos os arquivos que realmente a utilizam;
- compatibilidade com Android e preservação do funcionamento do jogo;
- se o artefato de build contém os recursos necessários para executar a versão atualizada.

Sempre comparar as expectativas do código e dos workflows com os arquivos que realmente existem na branch. Não manter validações que exijam assets antigos, nem remover verificações válidas apenas para fazer o pipeline passar.

## 4. Corrigir divergências que bloqueiem a atualização

- Se a auditoria encontrar uma divergência que impeça ou comprometa o build, a publicação, o carregamento dos assets ou a atualização do jogo, investigar a causa raiz e corrigir no mesmo ciclo de trabalho, desde que a correção seja segura e esteja dentro do escopo.
- Após cada correção adicional, incrementar a versão novamente, pois houve uma nova modificação efetiva.
- Reexecutar as verificações afetadas e repetir a auditoria até não restarem bloqueios conhecidos.
- Não mascarar erros, remover testes necessários, enfraquecer validações, criar arquivos falsos ou alterar o workflow apenas para obter um resultado verde.
- Não apagar dados, assets, histórico ou publicações sem comprovar a necessidade e avaliar os impactos.
- Se uma correção depender de ação externa, permissão, segredo, serviço indisponível ou teste físico que não possa ser realizado, não declarar prontidão total. Informar precisamente o bloqueio e o que ainda precisa ser validado.

## 5. Critérios para declarar a atualização pronta

Usar estes estados no relatório final:

- **Pronto para publicar:** alterações commitadas; versão incrementada; auditoria sem bloqueios conhecidos; build e verificações relevantes concluídos com sucesso. Se houver deploy automático, ainda é necessário confirmar a execução correspondente ao commit atual.
- **Publicado e confirmado:** além dos critérios anteriores, o workflow de publicação do commit atual terminou com sucesso e a publicação/artefato atualizado foi confirmada por evidência disponível.
- **Bloqueado / não confirmado:** existe falha, divergência, execução pendente ou etapa que não pôde ser verificada. Descrever a causa real; não afirmar que o jogo atualizou.

Um workflow antigo, iniciado antes do commit mais recente, não valida a alteração atual. Confirmar sempre que a execução verificada corresponde ao commit que contém a versão e as modificações finais.

## 6. Formato obrigatório do encerramento de cada tarefa

Ao terminar cada solicitação de modificação, apresentar:

1. **O que foi modificado:** arquivos e comportamento afetados.
2. **Versionamento:** versão anterior → nova versão e motivo do incremento.
3. **Recap integral do jogo:** estado atual resumido pelos tópicos da seção 2, com implementado, parcial e planejado separados.
4. **Auditoria de atualização:** verificações realizadas e respectivos resultados.
5. **Correções de divergências:** problemas encontrados e como foram corrigidos; declarar explicitamente quando nenhum bloqueio foi encontrado.
6. **Publicação:** estado do commit e do workflow correspondente, distinguindo pronto, publicado e confirmado ou bloqueado/não confirmado.
7. **Pendências:** somente o que realmente falta, incluindo testes que dependem do aparelho ou de serviço externo.

## 7. Princípio de execução

O objetivo é que cada alteração deixe o repositório coerente, versionado e em condição verificável de atualização. Trabalhar diretamente no GitHub, na branch correta, respeitando o estado real dos arquivos. Não pedir ao usuário para executar tarefas técnicas que possam ser realizadas com as ferramentas disponíveis. Não alegar que executou build, testes, auditoria ou publicação sem evidência concreta.


## 7. Acordo de trabalho e divisão de responsabilidades

O procedimento permanente de colaboração está detalhado em [ACORDO_DE_TRABALHO.md](ACORDO_DE_TRABALHO.md). O assistente prepara estrutura, código, testes e documentação dentro das permissões disponíveis; o usuário fornece assets finais e executa ações que dependem de aparelho, conta, autenticação, ferramentas locais ou aprovação humana. Quando faltar uma etapa do usuário, deixar pasta final, README, caminho e requisitos prontos. Nunca inventar assets, afirmar uploads inexistentes ou declarar integração funcional enquanto o arquivo não tiver sido verificado.

## 8. Regra de preservação de cartas e imagens HTML

Cartas de monstros, Boss e waifus compartilham o contrato HTML descrito em [ARQUITETURA_CARTAS_HTML.md](ARQUITETURA_CARTAS_HTML.md). A arte oficial permanece intacta; o layout se adapta à imagem, não o contrário. Preservar resolução e proporção, sem crop, stretch, filtros ou recompressão não autorizada. Assets ainda não fornecidos permanecem pendentes, com seus caminhos finais documentados.
