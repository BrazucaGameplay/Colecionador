# Atualização 2.6.6 — testes de oceano e resize

A execução #898 revelou que os testes de oceano ainda procuravam constantes e funções dentro de Game.js após a extração para WorldBootstrap. Atualiza os testes para validar os novos módulos responsáveis, preservando os contratos de margem costeira, dimensão de oceano, TileSprite único, resize e zoom. Nenhuma mudança de comportamento de runtime.
