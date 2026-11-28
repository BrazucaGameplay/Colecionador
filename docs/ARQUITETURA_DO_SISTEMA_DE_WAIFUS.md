# Arquitetura do sistema de waifus

**Status:** fundação de domínio e diretórios visuais preparados; catálogo, drops reais, progressão, persistência e integração no runtime ainda não implementados.

## 1. Classificações oficiais

### Raridade — fixa por personagem

| ID | Nome | Símbolo |
|---|---|---|
| common | Comum | Círculo |
| rare | Rara | Diamante |
| epic | Épica | Estrela |
| legendary | Lendária | Coroa |
| mythical | Mítica | Estrela celestial |

A raridade é definida no cadastro da personagem e não muda.

### Qualidade — fixa na primeira obtenção

| Grau | Nome |
|---|---|
| D | Plebeia |
| C | Nobre |
| B | Dama |
| A | Princesa |
| S | Rainha |

A qualidade é determinada uma única vez quando a waifu é obtida por drop. Não pode ser rerrolada, melhorada, rebaixada ou substituída posteriormente. Probabilidades aprovadas para a aquisição atual: Rainha 1%, Princesa 2%, Dama 3%, Nobre 4% e Plebeia 90%. A soma é 100% e a qualidade é sorteada somente depois de a carta passar na rolagem de drop.

### Nível — progressão independente

O nível pode evoluir por presentes recebidos, conforme a mecânica de vínculo definida para o jogo. O nível não altera raridade nem qualidade. A progressão deverá fortalecer atributos e habilidades passivas de acordo com regras próprias, ainda a implementar.

## 2. Aquisição e drops

- Waifus só podem ser obtidas como drops de monstros.
- A tabela de drop pertence ao monstro que concede a waifu.
- A raridade vem do cadastro fixo da personagem.
- A qualidade é sorteada uma única vez no evento de aquisição.
- Depois da primeira obtenção, a qualidade fica gravada na instância da waifu do jogador.
- Não permitir aquisição por loja, compra direta, missão, login, crafting ou recompensa independente de monstro.
- Monstros e probabilidades só serão cadastrados quando forem definidos; não preencher taxas fictícias.
- Regras de duplicatas ainda não foram aprovadas e não devem ser implementadas por suposição.

## 3. Contrato de dados

Arquivos iniciais:

- `src/data/waifus/classification.js`: enumerações e validadores de raridade/qualidade.
- `src/data/waifus/catalog.js`: catálogo vazio de personagens.
- `src/data/waifus/drop-tables.js`: ponto de entrada vazio das tabelas de drop.

Cada personagem cadastrada deverá ter ID estável, nome, raridade fixa, caminho da arte original e referências aos IDs reais dos monstros que podem concedê-la.

Cada aquisição persistida deverá registrar ao menos o ID da waifu, qualidade sorteada e nível atual. A implementação de persistência deverá preservar saves existentes e usar migração explícita quando for criada.

## 4. Arquitetura visual das cartas

A carta será composta em camadas independentes:

1. **Arte original:** imagem final da waifu, sem moldura, símbolo, nome ou texto adicionado.
2. **Moldura de raridade:** uma entre cinco molduras distintas, com símbolo próprio.
3. **Selo de qualidade:** pequeno selo com o nome completo Plebeia, Nobre, Dama, Princesa ou Rainha.

A qualidade não terá uma segunda moldura completa. O selo é uma camada pequena e padronizada. A raridade não será indicada pela cor do selo.

A composição deve funcionar com qualquer combinação das cinco raridades e cinco qualidades, sem gerar ou armazenar 25 versões da mesma ilustração.

### Assets reservados

```text
public/assets/cards/waifus/
  <waifu-id>/
    card.<ext>                 # arte original, sem moldura
  frames/
    common.webp
    rare.webp
    epic.webp
    legendary.webp
    mythical.webp
  seals/
    plebeia.webp
    nobre.webp
    dama.webp
    princesa.webp
    rainha.webp
```

A origem principal das artes das waifus permanece no repositório separado do projeto. Só copiar a arte final para este repositório quando necessária à distribuição/runtime, preservando o arquivo original.

### Regras de integridade

- Não cortar, esticar, deformar, filtrar ou recomprimir a arte original.
- Não gravar moldura ou selo dentro do arquivo da ilustração.
- Usar composição por camadas com transparência.
- As cinco molduras devem compartilhar proporção, alinhamento e área interna útil.
- Os cinco selos devem compartilhar dimensões e ancoragem.
- A carta deve se adaptar ao viewport mobile sem recortar a ilustração.
- Não criar assets substitutos ou provisórios enquanto os arquivos finais não forem fornecidos.

## 5. Integração e limites atuais

A galeria HTML compartilhada de cartas é reutilizável, mas o catálogo/runtime de waifus permanece separado do bestiário de monstros e Boss. O painel Waifus atual continua como placeholder e não deve apresentar personagens, atributos ou bônus fictícios.

A aquisição inicial já está ativa para o Slime: o runtime rola a chance de carta, define qualidade uma única vez e persiste a instância no save existente. A arte final, raridade fixa no catálogo, interface da coleção, duplicatas, presentes e habilidades continuam pendentes.

## 6. Próximas etapas

1. Receber as cinco molduras de raridade e os cinco selos de qualidade finais.
2. Validar transparência, proporção, alinhamento e área interna das artes.
3. Cadastrar as waifus reais e suas raridades fixas, incluindo arte original e raridade da Donzela Slime.
4. Criar a tabela exclusiva e os testes de cada nova espécie quando ela for cadastrada.
5. Integrar a coleção ao painel visual e definir as regras de duplicatas.
6. Implementar presentes, níveis, vínculos, passivas e os três espaços de habilidades equipáveis.
7. Integrar o painel Waifus à galeria e validar comportamento em Android.

Preparação estrutural não significa sistema de waifus concluído.
