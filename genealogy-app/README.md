# Genealogy Engine - Caso Patrícia Perrucci

Uma aplicação web conteinerizada (Next.js + Docker) projetada para auxiliar na resolução de casos complexos de genealogia genética.

O sistema cruza dados de uma árvore genealógica (arquivo `.ged`) com listas de correspondências de DNA (arquivo `.csv`), aplicando algoritmos de busca em grafos para:
1. Encontrar o Ancestral Comum Mais Recente (MRCA) entre a pessoa alvo e seus matches de DNA.
2. Identificar "árvores flutuantes" (sub-grafos desconectados) que contenham matches de DNA cruciais.
3. Detectar possíveis duplicações de indivíduos na árvore.

## 🚀 Como Executar Localmente (Docker)

A maneira mais fácil e rápida de rodar o projeto é utilizando o Docker e o Docker Compose.

**Pré-requisitos:**
- Docker instalado na sua máquina.
- Docker Compose instalado.

### Passos:

1. Clone ou baixe este repositório.
2. Abra o terminal na raiz do projeto (onde está o arquivo `docker-compose.yml`).
3. Execute o comando:
   ```bash
   docker-compose up --build -d
   ```
4. Aguarde a imagem ser construída e o container iniciar.
5. Abra o seu navegador e acesse: [http://localhost:3000](http://localhost:3000)

Para parar a aplicação:
```bash
docker-compose down
```

## ⚙️ Uso da Aplicação

1. Na tela inicial, faça o upload do seu arquivo **GEDCOM (.ged)**.
2. Faça o upload da sua planilha de **Matches de DNA (.csv)** (formato compatível com MyHeritage / Shared Segments contendo colunas como `Name`, `Shared DNA`/`cM`).
3. Insira o **ID da Pessoa Raiz** (Ex: `@I1@`). Este é o ID no GEDCOM da pessoa principal a partir da qual os algoritmos traçarão os caminhos.
4. Clique em "Processar e Cruzar Dados".

## 🛠️ Stack Tecnológica
- **Frontend/Backend:** Next.js (App Router), React, TypeScript.
- **Estilização:** Tailwind CSS, Lucide React.
- **Processamento:**
  - `read-gedcom` (Parsing de arquivos GED)
  - `papaparse` (Parsing de CSV)
  - `fast-levenshtein` (Algoritmo para tolerar erros de digitação ao buscar nomes).
- **Infraestrutura:** Docker.
