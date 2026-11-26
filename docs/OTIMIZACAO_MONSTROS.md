# Otimização do subsistema de monstros

## Regras de arquitetura

- A entidade lógica pode existir sem corpo de física ou controlador de IA.
- `dormant`, `visual` e `idle` são estados de apresentação estática; não executam IA nem criam corpos Arcade.
- Somente `pursuit` e `combat` entram nas coleções de simulação/alvo.
- A perseguição é escalonada em ticks de 33 ms com fase determinística por entidade, distribuindo o trabalho entre frames.
- A movimentação continua validando a máscara caminhável e os obstáculos por `WorldNavigation`.
- Não usar Arcade Physics para os monstros enquanto o jogo não depender de colisores, overlap ou resposta física do Arcade.
- Profundidade é recalculada, mas `setDepth` só é chamado se o valor mudou.
- O renderer usa `Image` e só altera textura, visibilidade, posição e profundidade quando o estado/valor realmente muda.
- As coleções de alvos e combatentes são estáveis; consultas por frame não criam arrays ou Sets.
- Spawn usa contagem direta de população e ocupação, sem materializar listas temporárias.

## Telemetria

O painel de desempenho mostra:
- quantidade total de monstros e ativos;
- perseguidores e combatentes;
- tempo de simulação de IA;
- tempo de culling/visibilidade;
- tempo do spawner.

Os tempos são amostras do custo dentro do update JavaScript da cena. Eles não equivalem ao tempo total de GPU ou ao frame time do navegador.

## Limites preservados

A otimização não altera:
- máximo de 50 slimes na ilha;
- coordenadas e raio da zona de spawn;
- intervalos de respawn;
- alcances de combate, perseguição, ociosidade e ativação;
- dano, atributos, recompensa, drops e validação de terreno.

## Próxima validação de desempenho

Comparar no mesmo dispositivo e zoom:
1. 10 monstros próximos;
2. 25 monstros próximos;
3. 50 monstros próximos;
4. câmera afastada mostrando a maior área possível;
5. combate com vários monstros simultaneamente.

Registrar FPS, CPU da cena, tempo de IA, visibilidade, spawn e memória JS. A telemetria interna não substitui uma medição de GPU nem um teste em dispositivo físico.
