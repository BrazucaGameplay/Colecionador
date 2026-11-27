# Atualização 2.5.0 — Interface sobre o mundo

## Produto e plataforma
- **Implementado:** jogo web/PWA com Phaser 4 e Vite; configuração Capacitor Android permanece.
- **Parcial / validação pendente:** instalação, renderização e interação em Android físico.
- **Planejado:** publicação Play Store; esta alteração não gera APK nem altera o pipeline Android.

## Mundo e conteúdo
- **Implementado:** ilha 2D, terreno e oceano, navegação por grade/máscara, objetos estáticos e spawn de monstros.
- **Parcial:** arquitetura centrada na ilha inicial; expansão para novas ilhas permanece futura.
- **Preservado:** assets e sistemas do mundo não foram substituídos.

## Gameplay
- **Implementado:** movimento por toque/destino, arraste de câmera, zoom por gesto, combate de ação, IA/ativação de monstros, dano, regeneração, experiência, níveis e alocação de atributos.
- **Implementado nesta versão:** HUD inferior de vida/energia e perfil com os nove atributos; menu superior esquerdo com Bestiário, Waifus, Inventário e Casa.
- **Parcial / não conectado:** bestiário sem registro persistente de encontros/derrotas; waifus, catálogo/instâncias de itens e sistema de casa ainda não possuem sistemas de dados integrados. Os painéis indicam as lacunas sem fabricar conteúdo.
- **Preservado:** save em localStorage, chave `colecionador-save-v1`, dados de jogador, nível, experiência, atributos, vida e energia.

## Arquitetura
- **Implementado:** Phaser 4, JavaScript ES modules, Vite; cenas Boot, Preload, Game e GameUI.
- **Implementado nesta versão:** GameUI é uma cena overlay lançada por Game; Game não é pausada nem colocada em sleep. A interface usa viewport próprio, captura controles visuais e filtra toques sobre HUD.
- **Implementado:** barras atualizadas a cada 100 ms, em vez de redesenhar HUD em cada frame.
- **Removido:** cena Menu e classe PlayerStatusUI antigas; monitor de desempenho permanece na cena do mundo.

## Assets
- **Implementado:** sprites do protagonista e monstros, texturas de terreno/oceano e vegetação continuam nos caminhos existentes.
- **Preservado:** nenhum GLB, sprite ou imagem temporária foi adicionado.

## Interface e experiência mobile
- **Implementado no código:** botão de menu no canto superior esquerdo; silhueta vetorial clicável na parte inferior; barras HP/EN abaixo; perfil abre pelo retrato.
- **Implementado:** painéis independentes de zoom/scroll do mundo e responsivos a resize, sem pausar a simulação.
- **Parcial / validação pendente:** safe areas e ergonomia precisam ser conferidas em dispositivos Android de diferentes proporções.

## Build e publicação
- **Implementado:** scripts npm de build/teste, validação de layout e workflow GitHub Actions para build, auditoria, testes e GitHub Pages.
- **Pendente:** execução do workflow do commit 2.5.0 e confirmação da publicação.

## Pendências e riscos
- Conectar bestiário aos eventos reais de descoberta/derrota e persistir registros.
- Implementar sistemas reais de waifus, inventário e casa antes de exibir conteúdo funcional nesses painéis.
- Testar interação UI/mundo, resize, safe areas e desempenho em Android físico.
- Confirmar build, auditoria npm e deploy do commit desta versão.
