# StockControl — Sistema de Controle de Divergências de Estoque

Aplicação acadêmica de Sistemas de Informação para registrar, acompanhar e analisar divergências entre o saldo de produtos no sistema e a contagem física. O projeto está estruturado para demonstração imediata, com painel preenchido, dados fictícios, servidor, cliente web e banco relacional.

> **Acesso de demonstração:** usuário `admin` · senha `123456`. Essa credencial é somente para demonstração acadêmica; altere/remova-a e configure credenciais apropriadas antes de qualquer uso real.

## Relação com o PIT II — Situação-Problema 2

A Situação-Problema 2 do material da disciplina solicita a codificação do front-end e do back-end do projeto escolhido no planejamento. O PDF não estabelece que o assunto do sistema seja estoque: o StockControl mantém o tema escolhido para o projeto e o implementa nesta etapa do PIT II.

- **Interface:** React, TypeScript, Vite e CSS produzem uma aplicação web baseada em HTML, CSS e JavaScript.
- **Processamento:** Node.js e TypeScript com Express e tRPC atendem as operações, validações e consultas do sistema.
- **Arquitetura:** apresentação, API/regras de negócio e persistência são organizadas em módulos, com separação de responsabilidades inspirada no MVC indicado pelo material.
- **Dados:** MySQL relacional e Drizzle ORM persistem produtos, ocorrências e sessões.
- **Escolhas técnicas:** o material permite escolher linguagem, banco, hospedagem, plataforma e modo de codificação. A stack TypeScript/Node.js é a escolha registrada para esta implementação.

Este repositório reúne o código-fonte de front-end e back-end, bibliotecas, instruções de instalação e manual de uso. Os documentos acadêmicos individuais do aluno não fazem parte desta cópia pública.

## Funcionalidades

- **Login e sessão:** autenticação de usuário e senha com sessão HTTP-only persistida; o exemplo inicial de administrador é criado automaticamente no primeiro início. Senhas são derivadas com scrypt e nunca retornadas à interface.
- **Dashboard:** totais de ocorrências pendentes, em análise e resolvidas; gráfico funcional por situação; unidades em diferença absoluta; número de produtos; últimas ocorrências.
- **Produtos:** cadastro, pesquisa e edição de código, nome, categoria, saldo em estoque e data de cadastro. A exclusão de produto vinculado a uma ocorrência é impedida para preservar a integridade referencial.
- **Divergências:** registro ligado a um produto, com data, quantidades do sistema e física, descrição e situação. A diferença é calculada automaticamente; a situação pode ser alterada na lista ou no detalhe.
- **Filtros:** pesquisa por nome/código/descrição, seleção de situação e intervalo de datas.
- **Relatórios:** visões geral, pendentes e resolvidas; impressão do navegador e exportação CSV compatível com planilhas.
- **Responsividade:** menu lateral administrativo em desktop, navegação adaptada a telas pequenas e formulários acessíveis.

## Dados de demonstração

Na primeira inicialização, a aplicação inclui o usuário `Administrador` (`admin`), os sete produtos do briefing e quatro ocorrências fictícias: notebook Dell (20 sistema / 18 físico, Pendente), mouse Logitech (50 / 47, Em análise), monitor LG (15 / 15, Resolvido) e impressora HP (12 / 10, Pendente). As descrições são as solicitadas no briefing. A carga inicial é idempotente: não duplica registros que já existem, não redefine a senha e não apaga alterações feitas pelos usuários quando o servidor reinicia. Se um registro demonstrativo for removido, o seed pode inseri-lo novamente.

Os demais produtos iniciais são Teclado Mecânico Redragon, Webcam Logitech C920 e SSD Kingston 480GB. Os códigos e as categorias atribuídos a eles são fictícios para esta demonstração.

## Stack e organização

- **Frontend:** React 19, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS e Recharts.
- **API/servidor:** Node.js, Express e tRPC; validação de entrada com Zod.
- **Persistência:** MySQL compatível e Drizzle ORM, com migrações em `drizzle/`.
- **Tabelas de negócio:** `usuarios` (login e hash scrypt em `senha`), `produtos`, `ocorrencias` e `sessoes_aplicacao`. A tabela `users` do template é mantida sem uso para as contas locais do sistema.

| Diretório/arquivo | Responsabilidade |
| --- | --- |
| `client/src/pages/` | Login, dashboard, produtos, ocorrências e relatórios |
| `client/src/components/` | Shell, modal e componentes visuais reutilizados |
| `client/src/lib/trpc.ts` | Cliente tipado de comunicação com a API |
| `server/inventoryRouter.ts` | Procedimentos autenticados e validação de domínio |
| `server/inventoryDb.ts` | Consultas, mutações e carga inicial relacional |
| `server/applicationAuth.ts` | Derivação de senha e ciclo de vida das sessões |
| `server/_core/` | Inicialização Express, contexto, template Vite e utilitários-base |
| `drizzle/schema.ts` e `drizzle/*.sql` | Esquema e migrações do banco |
| `MANUAL.md` | Manual do usuário e instruções de uso |

## Requisitos

- Node.js 22 ou compatível com a versão utilizada pelo projeto.
- pnpm 10.18.0 (pinado em `package.json`).
- MySQL 8 ou serviço MySQL compatível e uma base vazia/adequada para a aplicação.
- `DATABASE_URL` no formato `mysql://usuario:senha@host:3306/nome_da_base`. Codifique na URL caracteres especiais presentes na senha. Nunca publique essa variável nem a credencial.

## Executar localmente

1. Instale Node.js, pnpm e MySQL. Inicie o serviço MySQL e crie uma base, por exemplo `stockcontrol`.
2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` para a sua instância local. O `.env` está ignorado pelo Git.
3. Na raiz do projeto, instale os pacotes e prepare o esquema: `pnpm install --frozen-lockfile` e `pnpm db:push`.
4. Inicie o site com `pnpm dev` e abra `http://localhost:3000`. O primeiro início cadastra os registros fictícios automaticamente.
5. Entre com `admin` / `123456` e percorra o roteiro do [manual do usuário](./MANUAL.md).

Se o seu terminal não reconhecer `pnpm`, habilite-o com `corepack enable` e ative a versão 10.18.0 ou instale-a de forma compatível com seu ambiente.

## Comandos úteis

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Inicia API e interface em modo de desenvolvimento (`PORT`, padrão 3000) |
| `pnpm db:push` | Gera e aplica alterações do esquema no banco configurado |
| `pnpm db:migrate` | Aplica as migrações já geradas |
| `pnpm check` | Verifica tipos TypeScript |
| `pnpm test` | Executa os testes automatizados |
| `pnpm build` | Compila frontend e servidor para produção |
| `pnpm start` | Serve a compilação de produção |

As migrações e os dados de desenvolvimento atuam sobre o banco indicado por `DATABASE_URL`. Confira sempre o ambiente antes de aplicar alterações em um banco compartilhado.

## Apresentação acadêmica

Sugestão de percurso para o vídeo: entrar com a conta de demonstração; interpretar os KPIs e o gráfico; cadastrar um produto fictício; registrar uma divergência para ele; filtrar por produto/situação/período; alterar o status até **Resolvido**; abrir Relatórios, alternar as três visões, exportar CSV ou imprimir. Os detalhes estão no [Manual do usuário](./MANUAL.md).

Todos os registros fornecidos são fictícios. O login padrão é deliberadamente simples para fins acadêmicos e não deve ser reutilizado em uma operação empresarial real.
