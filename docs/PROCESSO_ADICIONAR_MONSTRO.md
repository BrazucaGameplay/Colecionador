# Processo oficial para adicionar um monstro

**Status:** obrigatório para toda nova espécie comum.  
**Referência de implementação:** Slime.  
**Catálogo:** `src/data/monsters/index.js`  
**Cartas:** `public/assets/cards/monsters/<species-id>/`

Este documento é a fonte única do procedimento. Toda espécie nova deve seguir os mesmos passos; não criar um fluxo alternativo nem uma interface específica para cada monstro.

## Procedimento obrigatório

1. **Adicionar a carta original à pasta da espécie.**
   - Usar `public/assets/cards/monsters/<species-id>/`.
   - Preservar o arquivo original e sua extensão. Não recortar, redimensionar, converter, recomprimir ou aplicar filtros.
   - Nomear o arquivo final `card.<ext>`, mantendo a extensão real.

2. **Criar a definição no catálogo de monstros.**
   - Registrar a espécie em `src/data/monsters/index.js`.
   - Usar um ID estável, exclusivo, minúsculo e sem espaços/acentos.
   - Seguir o formato e as responsabilidades da definição-piloto do Slime.

3. **Informar o caminho em `bestiary.cardAsset`.**
   - O caminho deve apontar para o asset real dentro de `public/assets`, relativo à raiz pública, por exemplo: `assets/cards/monsters/<species-id>/card.jpg`.
   - Não declarar caminho de arquivo que ainda não existe.
   - A galeria compartilhada deve consumir essa propriedade; não adicionar lógica visual específica para a espécie.

4. **Cadastrar os atributos e dados reais.**
   - Preencher as nove chaves de status compartilhadas: `attack`, `defense`, `penetration`, `attackSpeed`, `movementSpeed`, `maxHealth`, `maxEnergy`, `healthRegen` e `energyRegen`.
   - Cadastrar comportamento, atividade, combate, experiência, drops e demais dados aplicáveis somente quando definidos e aprovados.
   - Não inventar valores nem copiar balanceamento de outra espécie sem decisão explícita.
   - Animação é opcional por espécie. Usar animações somente quando houver assets reais e necessidade de gameplay.

5. **Adicionar testes e validar.**
   - Testar registro/ID, integridade dos dados, caminho e existência da carta.
   - Cobrir o comportamento específico que for introduzido.
   - Executar testes e build; corrigir falhas antes de considerar a espécie integrada.
   - Validar a apresentação da carta sem deformação, corte ou alteração da imagem original.

## Critérios de conclusão

Uma espécie só está integrada quando os cinco passos estiverem concluídos e validados. A existência de uma imagem na pasta não cadastra nem habilita automaticamente um monstro.

## Regras de organização

- Slime é o piloto e a referência do fluxo completo.
- Implementar uma espécie por vez.
- Não registrar, exibir ou carregar cartas de espécies futuras antes da implementação individual.
- Não criar componentes, telas ou ramificações de UI por espécie; reutilizar o catálogo e a galeria compartilhada.
- Manter assets, definição de domínio, apresentação e testes em suas respectivas camadas.
- Não alterar cartas originais para acomodar a interface; a interface deve preservar a proporção e exibir a imagem integralmente.

## Situação atual

Somente Slime está registrado e conectado ao bestiário. As outras cartas que já estão organizadas em pastas permanecem arquivadas, sem cadastro e fora do runtime, até que cada espécie seja trabalhada seguindo este processo.
