# Sistema do bestiário — estrutura reservada

O catálogo estático está em `src/data/bestiary/index.js`. Este diretório
fica reservado à descoberta, registro de encontros/derrotas e integração
com SaveManager.

Não armazenar uma entrada por instância. Persistir IDs estáveis de espécies
e Boss; manter conteúdo estático fora do save. A UI ainda não existe.
Consulte `docs/ARQUITETURA_MONSTROS_E_BOSSES.md`.
