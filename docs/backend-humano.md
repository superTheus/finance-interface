# Documentacao do Backend - Finance App

Este documento descreve o backend PHP do projeto Finance App localizado em `back/`. Ele foi escrito para leitura humana e cobre arquitetura, autenticacao, padrao de requests, CRUD, filtros do `find`, includes, DataTable e exemplos completos.

## Visao geral

O backend e uma API PHP com autoload PSR-4 (`App\`) e roteamento via `bramus/router`. O ponto de entrada e `back/index.php`, que configura CORS, content-type JSON e chama `App\Routers\Routers::execute()`.

Dependencias principais:

- `bramus/router`: definicao de rotas.
- `vlucas/phpdotenv`: leitura do `.env`.
- `firebase/php-jwt`: login e autenticacao JWT.
- `phpmailer/phpmailer`: envio de e-mail.
- `mpdf/mpdf`: geracao/uso de PDF.
- `guzzlehttp/guzzle`: chamadas HTTP.
- `mercadopago/dx-php`: integracao Mercado Pago.

Estrutura principal:

- `back/App/Routers/Routers.php`: mapa de endpoints.
- `back/App/Middlewares/AuthMiddleware.php`: validacao de token.
- `back/App/Controllers/ControllerBase.php`: includes, validacao e contratos de controller.
- `back/App/Models/BaseModel.php`: filtros, relacoes, DataTable e metadados de tabelas.
- `back/App/Models/QueryBuilder.php`: builder SQL usado em buscas especificas e DataTable.
- `back/App/Models/*Model.php`: models de entidades.
- `back/App/Controllers/*Controller.php`: controllers de entidades e fluxos de negocio.

## Autenticacao

As rotas sob `/private` exigem header:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

O middleware decodifica o JWT com `SECRET_KEY` do `.env` e popula:

- `$_REQUEST['user']`: dados do usuario do token.
- `$_REQUEST['id_conta']`: conta do usuario, somente em `/private`.

As rotas sob `/root` tambem exigem JWT, mas usam `handleRoot()` e nao injetam `id_conta` automaticamente.

Login:

```http
POST /login
Content-Type: application/json
```

```json
{
  "login": "admin",
  "senha": "123456"
}
```

Resposta esperada em sucesso:

```json
{
  "id": "1",
  "id_conta": "1",
  "nome": "Usuario",
  "tipo": "A",
  "perfil": "ADMIN",
  "token": "jwt...",
  "conta": {}
}
```

## Padrao de CRUD

A maioria dos recursos segue o mesmo padrao:

- `POST /private/{recurso}/criar`
- `POST /private/{recurso}/listar`
- `POST /private/{recurso}/buscar`
- `PUT /private/{recurso}/atualizar/{id}`
- `POST /private/{recurso}/tabela` em alguns cadastros

Nem todos os recursos possuem todas as rotas. O roteador e a fonte de verdade.

Recursos CRUD principais:

- `/private/usuarios`
- `/private/empresas`
- `/private/marcas`
- `/private/fornecedores`
- `/private/motoristas`
- `/private/vendedores`
- `/private/categorias`
- `/private/subcategorias`
- `/private/clientes`
- `/private/transportadoras`
- `/private/produtos`
- `/private/operacoes`
- `/private/formas-pagamento`
- `/private/vendas`
- `/private/vendas/pagamentos`
- `/private/contas`
- `/private/regras-fiscais`
- `/root/contas-usuarios`
- `/root/contas-usuarios-faturas`

## Criacao

Exemplo simples: criar marca.

```http
POST /private/marcas/criar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "descricao": "Marca Exemplo",
  "status": "A"
}
```

O controller injeta `id_conta` a partir do JWT. Os campos obrigatorios sao descobertos em runtime pela estrutura da tabela (`BaseModel::getStructureTable`) e validados antes do insert.

Resposta: o registro criado, ja relido por `findById()`.

## Listagem com find

Exemplo simples:

```http
POST /private/marcas/listar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "filter": {
    "status": "A"
  },
  "limit": 10,
  "offset": 0,
  "order": {
    "cols": ["descricao"],
    "direction": "ASC"
  }
}
```

Resposta padrao:

```json
{
  "total": 1,
  "data": [
    {
      "id": "1",
      "id_conta": "1",
      "descricao": "Marca Exemplo",
      "status": "A",
      "deletado": "N"
    }
  ]
}
```

Observacao importante: nos controllers principais, `find()` e `findOnly()` adicionam `deletado = "N"` automaticamente ao filtro. Alguns controllers filhos ou auxiliares podem nao adicionar isso em todos os casos, entao confira o controller especifico quando precisar de comportamento exato.

## Atualizacao

```http
PUT /private/marcas/atualizar/1
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "descricao": "Marca Atualizada",
  "status": "I"
}
```

O model atualiza somente colunas que existem na tabela e foram enviadas no JSON. Campos ausentes nao sao alterados.

## Exclusao

O codigo possui metodo `delete()` nas models, mas a maioria das rotas publicadas no roteador nao expõe `DELETE`. A rota encontrada e:

```http
DELETE /private/vendas/pagamentos/deletar/{id}
```

O `delete()` das models executa `DELETE FROM tabela WHERE id = :id`, ou seja, exclusao fisica. Ja as listagens filtram `deletado = "N"`, indicando que o banco tambem usa exclusao logica em varios fluxos.

## Busca rapida

Varios recursos possuem:

```http
POST /private/{recurso}/buscar
```

Payload:

```json
{
  "searchTerm": "texto",
  "limit": 10,
  "offset": 0
}
```

O metodo `search()` normalmente busca por campos textuais com `LIKE`, filtra por `id_conta` do token e por `deletado = "N"`.

Exemplo especial de produtos:

```http
POST /private/produtos/buscar
```

```json
{
  "searchTerm": "camiseta",
  "id_empresa": 1,
  "limit": 10,
  "offset": 0
}
```

Produtos faz `LEFT JOIN` com marcas, categorias, subcategorias, fornecedores e estoque, pesquisa em varios campos e retorna tambem dados relacionados carregados manualmente pelo controller.

## Filtros do find

O filtro e processado por `BaseModel::buildFilterConditions()`. Ele aceita igualdade simples, operadores, `LIKE`, `IN`, `NOT IN`, `BETWEEN`, nulos e agrupamentos logicos.

Igualdade:

```json
{
  "filter": {
    "status": "A",
    "id_empresa": 1
  }
}
```

Gera condicoes equivalentes a:

```sql
status = :status_0 AND id_empresa = :id_empresa_1
```

LIKE:

```json
{
  "filter": {
    "descricao": {
      "LIKE": "produto"
    }
  }
}
```

O backend adiciona `%` automaticamente. Para valor numerico em string, usa `CAST(campo AS CHAR) LIKE`.

Operadores:

```json
{
  "filter": {
    "valor": {
      "OPERATOR": ">=",
      "VALUE": 100
    }
  }
}
```

O campo `OPERATOR` e usado diretamente no SQL. Use somente operadores SQL validos e controlados pelo backend/cliente confiavel: `=`, `<>`, `>`, `>=`, `<`, `<=`.

IN:

```json
{
  "filter": {
    "id": {
      "IN": [1, 2, 3]
    }
  }
}
```

NOT IN:

```json
{
  "filter": {
    "status": {
      "NOT IN": ["CA", "I"]
    }
  }
}
```

BETWEEN:

```json
{
  "filter": {
    "data": {
      "BETWEEN": ["2026-01-01", "2026-01-31"]
    }
  }
}
```

Nulos:

```json
{
  "filter": {
    "data_pagamento": {
      "IS NULL": true
    }
  }
}
```

```json
{
  "filter": {
    "data_pagamento": {
      "IS NOT NULL": true
    }
  }
}
```

OR entre campos:

```json
{
  "filter": {
    "OR": {
      "descricao": {
        "LIKE": "camiseta"
      },
      "ncm": {
        "LIKE": "6109"
      }
    }
  }
}
```

AND/OR aninhado:

```json
{
  "filter": {
    "status": "A",
    "OR": {
      "descricao": {
        "LIKE": "camiseta"
      },
      "AND": {
        "id_categoria": 3,
        "id_subcategoria": 8
      }
    }
  }
}
```

Filtro OR/AND em um mesmo campo:

```json
{
  "filter": {
    "status": {
      "OR": ["A", "P"]
    }
  }
}
```

```json
{
  "filter": {
    "tipo": {
      "AND": ["NFE", "NFCE"]
    }
  }
}
```

O segundo caso quase nunca e util, porque exige que o mesmo campo tenha dois valores ao mesmo tempo.

## Includes

`includes` carrega dados relacionados com base em `relationConfig` da model e nas chaves estrangeiras detectadas automaticamente pelo banco.

Exemplo: listar vendas com produtos e pagamentos.

```http
POST /private/vendas/listar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "filter": {
    "id": 10
  },
  "includes": {
    "venda_produtos": true,
    "venda_pagamentos": true,
    "contas": true,
    "cartas_correcao": true
  }
}
```

Exemplo: listar produtos com estoque, imagens e kits.

```json
{
  "filter": {
    "id": 25
  },
  "includes": {
    "produtos_estoque": {
      "filter": {
        "id_empresa": 1
      }
    },
    "produtos_imagens": true,
    "produtos_kit": true,
    "produto_movimentacao": {
      "limit": 20,
      "order": {
        "cols": ["id"],
        "direction": "DESC"
      }
    }
  }
}
```

Includes aceitam:

- `filter`
- `limit`
- `offset`
- `order`
- `date_ranger` (o nome esta escrito assim no codigo)
- `includes` para aninhamento

A profundidade maxima no `processIncludes()` e 5 niveis.

Relacoes manuais importantes:

- `CategoriasModel`: `subcategorias` por `id_categoria`.
- `ContasModel`: `conta_pagamento` por `id_conta`.
- `ContasUsuariosModel`: `usuarios` e `empresas` por `id_conta`, com minimo 1.
- `ContasUsuariosFaturasModel`: `mercado_pago_pagamentos` por `id_fatura`.
- `ProdutosModel`: `produtos_estoque`, `produtos_imagens`, `produtos_kit`, `produto_movimentacao`.
- `VendasModel`: `venda_produtos` minimo 1, `venda_pagamentos`, `contas`, `cartas_correcao`.

Relacoes de chave estrangeira tambem sao detectadas via `INFORMATION_SCHEMA.KEY_COLUMN_USAGE`. Quando a relacao tem `ignore = true`, o include usa o controller relacionado com `findOnly()` para buscar o registro referenciado.

## Criacao com relacoes

As models que possuem `relationConfig` criam filhos automaticamente no `insert()`, desde que a relacao nao tenha `ignore = true`.

Exemplo: criar produto com estoque e imagem.

```http
POST /private/produtos/criar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "descricao": "Produto Exemplo",
  "status": "A",
  "id_marca": 1,
  "id_categoria": 2,
  "id_subcategoria": 5,
  "id_fornecedor": 3,
  "controla_estoque": "S",
  "produtos_estoque": [
    {
      "id_empresa": 1,
      "estoque": 10
    }
  ],
  "produtos_imagens": [
    {
      "imagem": "base64-ou-nome-do-arquivo",
      "principal": "S"
    }
  ]
}
```

O backend insere primeiro `produtos`, pega o novo `id` e depois injeta `id_produto` em cada item relacionado.

Exemplo: criar venda com produtos.

```http
POST /private/vendas/criar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "id_empresa": 1,
  "id_operacao": 1,
  "id_cliente": 10,
  "id_vendedor": 2,
  "total": 150.0,
  "total_pago": 0,
  "total_desconto": 0,
  "total_troco": 0,
  "status": "AB",
  "venda_produtos": [
    {
      "id_produto": 25,
      "descricao": "Produto Exemplo",
      "quantidade": 2,
      "valor_unitario": 75.0,
      "valor_total": 150.0,
      "cfop": "5102"
    }
  ]
}
```

`venda_produtos` possui `min_count = 1`, entao a venda exige pelo menos um item.

## Atualizacao com relacoes

Quando o JSON contem o nome da relacao, o controller processa tres grupos:

- `create`: cria filhos novos.
- `update`: atualiza filhos existentes.
- `delete`: exclui filhos existentes.

Exemplo:

```http
PUT /private/produtos/atualizar/25
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "descricao": "Produto Atualizado",
  "produtos_estoque": {
    "create": [
      {
        "id_empresa": 2,
        "estoque": 5
      }
    ],
    "update": [
      {
        "id": 7,
        "estoque": 15
      }
    ],
    "delete": [
      {
        "id_empresa": 3
      }
    ]
  }
}
```

O controller valida se o item relacionado pertence ao registro pai antes de atualizar ou excluir.

## DataTable

Alguns recursos possuem:

```http
POST /private/{recurso}/tabela
```

O payload segue o formato do DataTables:

```json
{
  "draw": 1,
  "start": 0,
  "length": 10,
  "search": {
    "value": "joao"
  },
  "order": [
    {
      "column": 1,
      "dir": "asc"
    }
  ],
  "columns": [
    {
      "data": "id",
      "name": "id",
      "searchable": true,
      "orderable": true,
      "search": {
        "value": ""
      }
    },
    {
      "data": "descricao",
      "name": "descricao",
      "searchable": true,
      "orderable": true,
      "search": {
        "value": ""
      }
    }
  ]
}
```

Busca por coluna com operador:

```json
{
  "columns": [
    {
      "data": "valor",
      "name": "valor",
      "searchable": true,
      "orderable": true,
      "search": {
        "value": {
          "operator": ">=",
          "value": 100
        }
      }
    }
  ]
}
```

Busca por coluna com BETWEEN:

```json
{
  "columns": [
    {
      "data": "data",
      "name": "data",
      "searchable": true,
      "orderable": true,
      "search": {
        "value": {
          "operator": "BETWEEN",
          "value": ["2026-01-01", "2026-01-31"]
        }
      }
    }
  ]
}
```

Resposta:

```json
{
  "draw": 1,
  "recordsTotal": 100,
  "recordsFiltered": 10,
  "data": [],
  "ativos": 80,
  "inativos": 20,
  "total": 100
}
```

Campos relacionados no DataTable usam `relation.campo` no `name`. O codigo tenta montar join automatico usando `relationConfig`, mas ha uma observacao tecnica: a implementacao atual prefixa relacoes com `axpem_` (`$table = "axpem_" . ...`) dentro de `BaseModel::dataTable()`, enquanto as tabelas deste backend aparecem sem prefixo (`marcas`, `produtos`, etc.). Se for usar colunas relacionadas no DataTable, valide essa parte antes em runtime.

## Rotas especiais

Vendas:

- `POST /private/vendas/duplicar`: duplica venda existente usando outra operacao.
- `POST /private/vendas/reabrir`: reabre venda finalizada, remove contas e pagamentos relacionados e zera totais pagos.
- `PUT /private/vendas/atualizar/{id}`: alem de atualizar, quando status vai para `FE`, movimenta estoque e cria contas; quando vai para `CA`, reverte movimentacoes e cancela contas.

Fiscal:

- `GET /private/fiscal/nfce/{venda}`
- `GET /private/fiscal/nfcepreview/{venda}`
- `GET /private/fiscal/nfe/{venda}`
- `GET /private/fiscal/nfse/{venda}`
- `GET /private/fiscal/nfepreview/{venda}`
- `POST /private/fiscal/cce/{venda}`
- `GET /private/fiscal/cancelar/{venda}`
- `POST /private/fiscal/cest`
- `POST /private/fiscal/ibpt`
- `POST /private/fiscal/ncm`
- `POST /private/fiscal/situacao`
- `POST /private/fiscal/cfop`
- `POST /private/fiscal/formas`
- `POST /private/fiscal/tipos-pagamento`
- `POST /private/fiscal/unidades`
- `POST /private/fiscal/origem`
- `POST /private/fiscal/estados/`
- `GET /private/fiscal/estados/{uf}`
- `GET /private/fiscal/cidades/{uf}/{cidade}`
- `POST /private/fiscal/cidades/{uf}`
- `POST /private/fiscal/testar`
- `GET /private/fiscal/testar/{cnpj}`

Relatorios:

- `POST /private/relatorios/vendas`
- `POST /private/relatorios/estoque`

Pagamentos:

- `POST /private/pagamentos/gerar-pix`
- `POST /private/pagamentos/consultar-pagamento`
- `GET /private/contas/gerar-pagamento/{id}`

Arquivos e webhooks publicos:

- `GET /files/{filename}`
- `POST /webhook/mercadopago`
- `POST /webhook/receber`

Utils publicos:

- `GET /utils/cnpj/{cnpj}`
- `GET /utils/cnpj-alternative/{cnpj}`

## Cuidados de implementacao

- O backend usa JSON em todos os endpoints principais.
- `date_ranger` aparece no contrato dos controllers com este nome, mas a maioria das models lidas nao usa esse quinto argumento diretamente.
- `delete()` e fisico nas models.
- `find()` aceita nomes de colunas diretamente. Evite enviar nomes de campos vindos de input nao controlado.
- `OPERATOR` tambem entra direto na montagem SQL. O cliente deve enviar operadores conhecidos.
- Validacao de obrigatorios depende da estrutura real do banco, nao de DTOs fixos no codigo.
- Senhas sao hasheadas com `password_hash(..., PASSWORD_BCRYPT)` em usuario e em algumas models copiadas do mesmo padrao.
- Uploads em campos como `foto` podem aceitar base64 e salvar arquivo via `UploadsController`.

