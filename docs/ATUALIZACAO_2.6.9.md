# Atualização 2.6.9 — extração do SaveManager

A persistência foi separada de Game.js para
src/systems/persistence/SaveManager.js.

Compatibilidade preservada:
- chave: colecionador-save-v1;
- campos superiores: score, player e at;
- campos do jogador: level, experience, statPoints, stats, health e energy;
- Player.toSaveData() permanece inalterado.

Game.js coordena quando carregar ou salvar, mas não acessa mais localStorage
nem implementa parse/serialização. Não foi introduzida migração de dados.

Testes cobrem saves existentes, mesclagem, timestamp, JSON inválido,
storage indisponível e integração de Game.js. A publicação depende da
execução completa do CI e da verificação final do deploy.


## Correção 2.7.0 — expectativa de aviso no save inválido

O CI da 2.6.9 mostrou que a asserção de teste esperava três avisos para
JSON malformado, array e null. A implementação original só registra aviso
para erro de parse; array e null são convertidos silenciosamente em objeto
vazio. O teste foi ajustado para refletir essa compatibilidade. Runtime e
estrutura do save não foram alterados.


## Atualização 2.7.2 — correção do teste de integração do GameSystemsBootstrap

A criação e a liberação dos sistemas de progressão, movimento, combate,
combate dos monstros, monitor de desempenho e entrada por toque foram
centralizadas em src/systems/GameSystemsBootstrap.js.

Game.js continua coordenando o ciclo da cena e a atualização do jogador,
renderer e gerenciador de monstros. O bootstrap recebe as dependências já
inicializadas, cria os sistemas, mantém o fluxo de tap-to-move e delega a
liberação dos recursos no shutdown. WorldBootstrap, CameraController e
SaveManager não foram alterados nesta etapa.

O objetivo foi reduzir a quantidade de responsabilidades de inicialização
em Game.js sem modificar regras, parâmetros ou controles existentes.


A primeira execução do CI falhou porque game-ui-overlay.test.js ainda
esperava encontrar em Game.js o filtro de toques sobre a HUD. O filtro agora
é propriedade de GameSystemsBootstrap; a asserção foi atualizada para
verificar o novo módulo, sem alterar o comportamento de runtime.


## Correção 2.7.3 — testes de câmera e HUD após extração

O CI da 2.7.2 encontrou uma expectativa de teste de câmera que ainda
procurava cameraController.followPlayer() em Game.js. A chamada pertence
agora ao GameSystemsBootstrap, que também controla o callback de tap-to-move.
O teste foi atualizado para consultar o módulo correto. Também foi corrigida
a sintaxe das expressões regulares do teste de integração da HUD. Runtime
permanece inalterado.
