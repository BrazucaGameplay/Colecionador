# Atualização 2.6.7 — extração do CameraController

A lógica de câmera foi separada de Game.js para
src/systems/camera/CameraController.js.

Responsabilidades extraídas:
- inicialização da câmera principal e configuração dos limites do oceano;
- zoom mínimo 0.2x, inicial 0.4x e máximo 0.6x;
- acompanhamento do sprite visual do protagonista com interpolação 0.06;
- clamp de scroll e centralização quando o viewport é maior que os limites;
- criação e redimensionamento da câmera HUD;
- remoção do listener de resize e liberação da câmera HUD no shutdown.

Game.js continua coordenando o movimento e decide quando um destino aceito
deve retomar o acompanhamento. TouchInputController mantém a interpretação
dos gestos e delega clamp e sinalização de pan ao CameraController.

Os valores e comportamentos existentes foram preservados intencionalmente.
Foram adicionados testes para limites, zoom, follow, HUD e resize. A execução
de CI e a publicação precisam ser verificadas no workflow desta versão;
não se considera teste visual ou Android concluído apenas pelo build.



## Correção de testes — versão 2.6.8

A primeira execução do CI encontrou asserções de ocean-background.test.js
ainda vinculadas à implementação anterior em Game.js. As verificações de
zoom, limites, resize e HUD foram atualizadas para o novo CameraController.
A correção altera somente os testes e os metadados/documentação de versão.
