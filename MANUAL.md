# Manual do usuário — StockControl

## 1. Entrar no sistema

Abra a URL do site. Na tela de acesso, use **Usuário** `admin` e **Senha** `123456`, e selecione **Entrar no sistema**. A tela já vem preenchida para facilitar a gravação. Após validar o acesso, o dashboard administrativo é aberto. Use **Encerrar sessão** no menu lateral para sair.

> Conta exclusivamente fictícia de apresentação acadêmica. Não a utilize como credencial de produção.

## Enquadramento do projeto

O StockControl é o projeto de controle de divergências de estoque implementado para a **Situação-Problema 2 do PIT II**. Essa situação solicita desenvolver a interface e o back-end do projeto definido no planejamento; o PDF não determina o tema de estoque. A aplicação usa React/TypeScript/CSS no front-end, Node.js/TypeScript com Express e tRPC no processamento, e MySQL relacional com Drizzle ORM na persistência. Consulte o [enquadramento acadêmico](./PIT-II-ALINHAMENTO.md) e o [roteiro de apresentação](./ROTEIRO-PIT-II-SITUACAO-2.md). A gravação do vídeo deve ser feita pelo aluno.

## 2. Ler o dashboard

A primeira linha mostra o total de ocorrências e os totais Pendentes, Em análise e Resolvidas. O gráfico circular representa a composição por status; passe o cursor nas fatias para ver os valores. O quadro **Visão do inventário** resume quantos produtos estão cadastrados e quantas ocorrências continuam abertas. A tabela **Últimas divergências** mostra o produto, data, contagens e situação dos registros recentes. Selecione uma ocorrência ou **Todas as ocorrências** para abrir o acompanhamento.

Os números são consultados do banco. O gráfico e os indicadores acompanham alterações persistidas quando a consulta é atualizada.

## 3. Cadastrar e manter produtos

No menu lateral, abra **Produtos**. O catálogo informa a quantidade de itens, unidades cadastradas e categorias. Use o campo de pesquisa para localizar nome, código ou categoria.

Selecione **Novo produto** e preencha todos os campos: código único, nome, categoria, quantidade em estoque e data de cadastro. Selecione **Cadastrar produto**. Para corrigir informações, use o botão de edição na linha e salve as alterações. A remoção pede confirmação; um item ligado a ocorrências não pode ser removido enquanto esses registros existirem.

## 4. Registrar uma divergência

Abra **Divergências** e selecione **Nova divergência**. Escolha um produto já cadastrado e informe data, status inicial, quantidade do sistema, quantidade contada fisicamente e descrição. Os valores de quantidade devem ser inteiros iguais ou maiores que zero; a descrição deve explicar o que foi observado. Pressione **Registrar ocorrência**. A diferença entre contagem física e saldo do sistema é calculada e apresentada na listagem.

## 5. Consultar e alterar o andamento

Na listagem, pesquise por nome/código de produto ou trecho da descrição. Combine a pesquisa com um status e as datas **De** e **Até**; **Limpar** remove todos os critérios. Os filtros atuam nos registros armazenados e exibem um resumo da quantidade encontrada.

Para avançar uma conferência, altere o seletor de status diretamente na linha ou abra os detalhes da ocorrência e altere **Atualizar status**. As opções são **Pendente**, **Em análise** e **Resolvido**. A mudança é gravada no banco e atualiza o dashboard e os relatórios.

## 6. Emitir relatórios

A página **Relatórios** apresenta três visões selecionáveis: **Relatório geral**, **Pendentes** e **Resolvidas**. A tabela e os indicadores correspondem à visão ativa. Use **Exportar CSV** para baixar o conjunto selecionado e abrir em uma planilha; o arquivo usa codificação UTF-8 com BOM e separador `;`. Use **Imprimir** para abrir a impressão/salvamento em PDF do navegador.

## 7. Roteiro sugerido para demonstração

1. Acesse com `admin` / `123456`.
2. Apresente os indicadores e o gráfico já preenchido com quatro registros fictícios.
3. Mostre o catálogo inicial de sete produtos e cadastre um produto adicional de exemplo.
4. Registre uma ocorrência comparando quantidade do sistema com quantidade física.
5. Localize-a por pesquisa, período ou status e mude de **Pendente** para **Em análise** e então **Resolvido**.
6. Volte ao dashboard para observar as estatísticas atualizadas.
7. Finalize alternando as visões de relatório e baixando um CSV.

## 8. Comportamento dos dados

O seed inicial é executado ao iniciar o servidor e só cria a conta demo, os produtos e ocorrências que ainda não existem. Reiniciar o processo não duplica registros existentes, não redefine a senha e não apaga alterações feitas. Se um registro demonstrativo for removido, o seed pode inseri-lo novamente. Produtos, ocorrências e sessões são persistidos no banco relacional configurado pelo projeto.
