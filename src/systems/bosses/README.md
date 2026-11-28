# Sistemas de Boss — estrutura reservada

Ainda não há Boss jogável neste diretório. Seguir
[ARQUITETURA_MONSTROS_E_BOSSES.md](../../../docs/ARQUITETURA_MONSTROS_E_BOSSES.md).

Módulos previstos quando houver um Boss real para validar:
- BossManager: ciclo de vida e atividade das entidades únicas;
- BossAIController: estados e decisões avançadas;
- BossAbilitySystem: custo, cooldown, alcance, telegraph, execução e recuperação.

Não colocar IA de Boss dentro do MonsterManager. Toda inscrição de eventos,
timer e recurso deve ter encerramento explícito.
