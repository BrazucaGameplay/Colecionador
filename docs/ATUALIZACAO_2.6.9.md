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
