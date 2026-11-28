# Sistema do bestiário — estrutura reservada

O catálogo estático está em `src/data/bestiary/index.js`. Este diretório
fica reservado à descoberta, registro de encontros/derrotas e integração
com SaveManager.

Não armazenar uma entrada por instância. Persistir IDs estáveis de espécies
e Boss; manter conteúdo estático fora do save. A galeria HTML compartilhada existe em `src/ui/cards/CardGallery.js`; este diretório continua reservado à descoberta, registro de encontros/derrotas e integração com SaveManager.
Consulte `docs/ARQUITETURA_MONSTROS_E_BOSSES.md`.
