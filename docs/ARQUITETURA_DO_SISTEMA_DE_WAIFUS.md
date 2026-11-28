# Arquitetura do sistema de waifus

**Status:** aquisição por drop, coleção persistida, equipamento de até três cartas e execução automática das habilidades declaradas nas cartas integrados ao runtime.

## Regra central

A carta é a única fonte de habilidades e bônus passivos. Não existe catálogo independente de habilidades, habilidade genérica do personagem, árvore paralela de skills ou equipamento separado de habilidades. Toda habilidade ativa e todo atributo passivo devem ser declarados na entrada da respectiva waifu em `src/data/waifus/catalog.js`.

## Classificações oficiais

Raridade é fixa por personagem: Comum, Rara, Épica, Lendária ou Mítica. Qualidade é fixa na aquisição: D Plebeia, C Nobre, B Dama, A Princesa ou S Rainha. A qualidade atual do drop do Slime é 90%, 4%, 3%, 2%, 1%, respectivamente para D, C, B, A, S. Nível da instância é independente e poderá evoluir por presentes quando esse sistema for implementado.

## Aquisição e coleção

- Waifus são obtidas exclusivamente por drops de monstros.
- Cada aquisição é uma instância persistida com `instanceId`, `waifuId`, qualidade, nível, data e espécie de origem.
- Cópias idênticas podem ser empilhadas visualmente na coleção, mas continuam sendo instâncias distintas no save.
- Somente cartas realmente pertencentes à coleção podem ser equipadas.
- Saves antigos recebem identificadores determinísticos de compatibilidade na carga; a próxima gravação persiste os identificadores.

## Equipamento

`src/systems/waifus/WaifuEquipmentManager.js` mantém até três instâncias equipadas, valida propriedade, impede equipar a mesma instância duas vezes, permite remover e persiste somente os IDs das cartas equipadas. Os três espaços exibidos no Perfil são espaços de cartas, não espaços de habilidades. A página do Perfil apresenta cartas possuídas disponíveis para equipar.

## Habilidades automáticas

`src/systems/waifus/WaifuAbilitySystem.js` consulta as cartas equipadas no instante do ataque automático do jogador. Cada instância tem seu próprio cooldown. A habilidade só é ativada quando há alvo vivo e o combate automático executa um ataque válido. Não há botão de ativação nem skill bar independente.

A entrada `slime-maiden` declara a habilidade Gosma Azul: projétil, 10 de dano e recarga de 10 segundos. O projétil é renderizado no mundo e aplica dano ao alvo se ele ainda estiver vivo ao chegar. O cooldown é controlado por instância equipada.

## Contrato do catálogo

Cada entrada pode declarar:
- `activeAbility`: habilidade automática, tipo de execução, dano/efeito, recarga e parâmetros próprios.
- `passiveStats`: modificadores passivos da carta, quando os valores forem definidos.

Não criar uma habilidade em arquivo separado para depois associá-la à waifu. Não cadastrar passivas fictícias: o objeto permanece vazio até que seus valores sejam definidos.

## Arquivos centrais

- `src/data/waifus/catalog.js`: fonte única de dados de cartas, habilidades e passivas.
- `src/data/waifus/classification.js`: raridade e qualidade.
- `src/data/waifus/drop-tables.js`: drops por espécie.
- `src/systems/waifus/WaifuEquipmentManager.js`: equipamento e persistência dos três espaços.
- `src/systems/waifus/WaifuAbilitySystem.js`: ativação automática e cooldown por instância.
- `src/systems/CombatSystem.js` e `src/systems/GameSystemsBootstrap.js`: integração no ciclo do combate.

## Limites atuais

- Donzela Slime é a única carta cadastrada com habilidade ativa.
- Não há valores passivos definidos para a Donzela Slime; não foram inventados bônus.
- As outras waifus e habilidades serão adicionadas exclusivamente no catálogo quando suas definições forem aprovadas.
- Presentes, evolução de nível e progressão de passivas continuam pendentes.
- Somente o Slime possui tabela de drop implementada.

