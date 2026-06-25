# Backend Finance App - Modelo para IA

Escopo: documentacao tecnica estruturada para agentes de IA trabalharem com `C:\devilbox\data\www\projetos\htdocs\estoquepremium\back`. Nao usar informacoes de outros projetos.

## Identidade

```yaml
project: Finance App
backend_path: back/
entrypoint: back/index.php
router: back/App/Routers/Routers.php
namespace_root: App\
language: PHP
database: MySQL via PDO
content_type: application/json; charset=utf-8
auth: JWT Bearer
```

## Dependencias

```json
{
  "bramus/router": "^1.6",
  "vlucas/phpdotenv": "^5.6",
  "firebase/php-jwt": "^7.0.0",
  "phpmailer/phpmailer": "^6.10",
  "mpdf/mpdf": "^8.2",
  "guzzlehttp/guzzle": "^7.10",
  "mercadopago/dx-php": "3.6.0"
}
```

## Arquitetura

```yaml
index:
  file: back/index.php
  behavior:
    - handles OPTIONS
    - sets CORS headers
    - sets JSON content-type
    - calls App\Routers\Routers::execute()

connection:
  file: back/App/Models/Connection.php
  env:
    - DB_SERVER
    - DB_NAME
    - DB_USER
    - DB_PASS
  pdo:
    charset: utf8
    error_mode: ERRMODE_EXCEPTION
    emulate_prepares: false

auth:
  file: back/App/Middlewares/AuthMiddleware.php
  private_routes: /private(/.*)?
  root_routes: /root(/.*)?
  header: "Authorization: Bearer <token>"
  private_side_effects:
    - $_REQUEST["user"] = decoded.data
    - $_REQUEST["id_conta"] = decoded.data.id_conta
  root_side_effects:
    - $_REQUEST["user"] = decoded.data
```

## Contrato de controller padrao

```yaml
controller_base: back/App/Controllers/ControllerBase.php
abstract_methods:
  - findOnly(array $data)
  - find(array $data)
  - update(array $data)
  - create(array $data)

common_methods:
  search:
    required_body: [searchTerm]
    optional_body: [limit, offset]
    uses: model.search(searchTerm, $_REQUEST["id_conta"], limit, offset)
  processIncludes:
    max_depth: 5
    include_options: [filter, limit, offset, order, date_ranger, includes]
  validateRequiredFields:
    source: model.structureTable from PDO column metadata
    skips: [primary_key, TIMESTAMP]
    checks: [not_null, unique_key, relation min_count]
  validateUpdateFields:
    checks sent fields only
```

## Contrato de model padrao

```yaml
base_model: back/App/Models/BaseModel.php
required_methods:
  - totalCount($filters = [])
  - findById($id)
  - find($filters = [], $limit = null, $offset = null, $order = [])
  - current()
  - insert($data)
  - update($data)
  - delete()
  - getTableName()

common_table_behavior:
  attributes: dynamic array via __get/__set
  insert:
    - ignores primary key
    - ignores TIMESTAMP fields
    - inserts only fields present in data and not empty string
    - after insert, calls findById(newId)
    - creates relationConfig children when relation.ignore is not true
  update:
    - updates only columns present in data and found in structureTable
    - WHERE id = current attributes.id
  delete:
    - physical DELETE FROM table WHERE id = :id
  find:
    - SELECT * FROM table
    - applies BaseModel::buildFilterConditions()
    - optional ORDER BY from order.cols and order.direction
    - optional LIMIT/OFFSET
```

## Request de listagem

```json
{
  "filter": {},
  "limit": 10,
  "offset": 0,
  "order": {
    "cols": ["id"],
    "direction": "DESC"
  },
  "includes": {}
}
```

Controller response:

```json
{
  "total": 0,
  "data": []
}
```

Important: common controllers merge `["deletado" => "N"]` into filters for `find()` and `findOnly()`.

## Filter grammar

```yaml
filter:
  equality:
    shape: {"campo": "valor"}
    sql: "campo = :param"
  operator:
    shape: {"campo": {"OPERATOR": ">=", "VALUE": 10}}
    sql: "campo >= :param"
  like:
    shape: {"campo": {"LIKE": "texto"}}
    sql: "campo LIKE :param"
    value_transform: "%texto%"
    numeric_string_behavior: "CAST(campo AS CHAR) LIKE :param"
  in:
    shape: {"campo": {"IN": [1,2,3]}}
    sql: "campo IN (:p1,:p2,:p3)"
  not_in:
    shape: {"campo": {"NOT IN": ["A","I"]}}
    sql: "campo NOT IN (:p1,:p2)"
  between:
    shape: {"campo": {"BETWEEN": ["min","max"]}}
    sql: "campo BETWEEN :campo_between_1 AND :campo_between_2"
    requirement: exactly_two_values
  is_null:
    shape: {"campo": {"IS NULL": true}}
    sql: "campo IS NULL"
  is_not_null:
    shape: {"campo": {"IS NOT NULL": true}}
    sql: "campo IS NOT NULL"
  logical_group:
    shape: {"OR": {"campo1": "x", "campo2": {"LIKE": "y"}}}
    supported_keys: [AND, OR]
    nesting: supported
  same_field_or:
    shape: {"campo": {"OR": ["A","P"]}}
    sql: "(campo = :p1 OR campo = :p2)"
  same_field_and:
    shape: {"campo": {"AND": ["A","P"]}}
    sql: "(campo = :p1 AND campo = :p2)"
```

Complete advanced find example:

```json
{
  "filter": {
    "status": "A",
    "OR": {
      "descricao": {
        "LIKE": "camiseta"
      },
      "ncm": {
        "LIKE": "6109"
      },
      "AND": {
        "valor": {
          "OPERATOR": ">=",
          "VALUE": 100
        },
        "id_categoria": {
          "IN": [1, 2, 3]
        }
      }
    },
    "data_cadastro": {
      "BETWEEN": ["2026-01-01", "2026-01-31"]
    },
    "data_pagamento": {
      "IS NULL": true
    }
  },
  "limit": 20,
  "offset": 0,
  "order": {
    "cols": ["descricao", "id"],
    "direction": "ASC"
  }
}
```

## Includes

```yaml
include_shape:
  simple: {"relation_property": true}
  configured:
    relation_property:
      filter: {}
      limit: 10
      offset: 0
      order:
        cols: ["id"]
        direction: "DESC"
      date_ranger: []
      includes: {}

resolution:
  source_1: explicit model.relationConfig
  source_2: BaseModel detects DB foreign keys through INFORMATION_SCHEMA
  if_relation_ignore_true:
    uses: relation.controller.findOnly()
    filter_merge: {relation.column: parent[relation.foreign_key]} + include.filter
  else:
    uses: relation.model.find()
    filter_merge: {relation.foreign_key: parent.id} + include.filter
```

Known explicit relations:

```yaml
categorias:
  subcategorias:
    foreign_key: id_categoria
    min_count: 0

clientes_enderecos:
  clientes:
    foreign_key: id_cliente
    min_count: 0

contas:
  conta_pagamento:
    foreign_key: id_conta
    min_count: 0

contas_usuarios:
  usuarios:
    foreign_key: id_conta
    min_count: 1
  empresas:
    foreign_key: id_conta
    min_count: 1

contas_usuarios_faturas:
  mercado_pago_pagamentos:
    foreign_key: id_fatura
    min_count: 0

produtos:
  produtos_estoque:
    table: produtos_estoque
    foreign_key: id_produto
    key: id_empresa
    min_count: 0
  produtos_imagens:
    foreign_key: id_produto
    key: id
    min_count: 0
  produtos_kit:
    foreign_key: id_produto
    key: id_produto_kit
    min_count: 0
  produto_movimentacao:
    foreign_key: id_produto
    min_count: 0

vendas:
  venda_produtos:
    table: venda_produtos
    foreign_key: id_venda
    key: id_produto
    min_count: 1
  venda_pagamentos:
    table: venda_pagamentos
    foreign_key: id_venda
    key: id_forma
    min_count: 0
  contas:
    table: contas
    foreign_key: id_venda
    min_count: 0
  cartas_correcao:
    table: cartas_correcao
    foreign_key: id_venda
    min_count: 0
```

## CRUD examples

Create brand:

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

List brands:

```http
POST /private/marcas/listar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "filter": {
    "descricao": {
      "LIKE": "Marca"
    }
  },
  "limit": 10,
  "offset": 0,
  "order": {
    "cols": ["descricao"],
    "direction": "ASC"
  }
}
```

Update brand:

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

Search:

```http
POST /private/marcas/buscar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "searchTerm": "Marca",
  "limit": 10,
  "offset": 0
}
```

Create product with relations:

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
      "imagem": "base64-ou-arquivo",
      "principal": "S"
    }
  ],
  "produtos_kit": []
}
```

List product with includes:

```http
POST /private/produtos/listar
Authorization: Bearer <token>
Content-Type: application/json
```

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

Update product relations:

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

Create sale:

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
  "total": 150,
  "total_pago": 0,
  "total_desconto": 0,
  "total_troco": 0,
  "status": "AB",
  "venda_produtos": [
    {
      "id_produto": 25,
      "descricao": "Produto Exemplo",
      "quantidade": 2,
      "valor_unitario": 75,
      "valor_total": 150,
      "cfop": "5102"
    }
  ],
  "venda_pagamentos": []
}
```

List sale with relations:

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

Finalize sale:

```http
PUT /private/vendas/atualizar/10
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "status": "FE"
}
```

Side effects in `VendasController::updateOnly()`:

```yaml
when_status_changes_to_FE:
  - loads operacao
  - if operacao.mov_estoque in ["S", "E"], updates produtos_estoque
  - creates produto_movimentacao
  - creates contas from venda_pagamentos

when_status_changes_to_CA:
  - reverses estoque movements
  - creates cancellation movement
  - updates related contas to situacao CA
```

Duplicate sale:

```http
POST /private/vendas/duplicar
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "venda": 10,
  "operacao": 2
}
```

Reopen sale:

```http
POST /private/vendas/reabrir
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "venda": 10
}
```

## DataTable contract

Endpoint pattern where implemented:

```http
POST /private/{resource}/tabela
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "draw": 1,
  "start": 0,
  "length": 10,
  "search": {
    "value": "global search"
  },
  "order": [
    {
      "column": 0,
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
        "value": {
          "operator": "BETWEEN",
          "value": ["A", "Z"]
        }
      }
    }
  ]
}
```

Response:

```json
{
  "draw": 1,
  "recordsTotal": 0,
  "recordsFiltered": 0,
  "data": [],
  "ativos": 0,
  "inativos": 0,
  "total": 0
}
```

DataTable implementation notes:

```yaml
file: back/App/Models/BaseModel.php
method: dataTable
selects_fields_from: params.columns[].name
aliases_to: params.columns[].data
global_search:
  source: params.search.value
  applies_to: searchable columns
column_search:
  simple: QueryBuilder.where(columnName, searchValue)
  operator: QueryBuilder.where(columnName, value, operator)
  between: QueryBuilder.whereBetween(columnName, min, max)
ordering:
  source: params.order[]
  only_if_column_orderable: true
pagination:
  start: params.start
  length: params.length
forced_filter:
  - table.deletado = "N"
counts:
  - recordsFiltered from count query
  - ativos where status = "A" and deletado = "N"
  - inativos where status = "I" and deletado = "N"
  - total where deletado = "N"
warning:
  related_column_join_uses_prefix_axpem: true
  actual_tables_seen_without_prefix: true
```

## Routes

```yaml
public:
  - GET /
  - POST /login
  - GET /files/{filename}
  - POST /webhook/mercadopago
  - POST /webhook/receber
  - GET /test
  - GET /utils/cnpj/{cnpj}
  - GET /utils/cnpj-alternative/{cnpj}

private:
  usuarios:
    - POST /private/usuarios/buscar
    - POST /private/usuarios/criar
    - POST /private/usuarios/listar
    - PUT /private/usuarios/atualizar/{id}
    - POST /private/usuarios/tabela
  empresas:
    - POST /private/empresas/buscar
    - POST /private/empresas/criar
    - POST /private/empresas/listar
    - PUT /private/empresas/atualizar/{id}
  marcas:
    - POST /private/marcas/buscar
    - POST /private/marcas/criar
    - POST /private/marcas/listar
    - PUT /private/marcas/atualizar/{id}
    - POST /private/marcas/tabela
  fornecedores:
    - POST /private/fornecedores/buscar
    - POST /private/fornecedores/criar
    - POST /private/fornecedores/listar
    - PUT /private/fornecedores/atualizar/{id}
    - POST /private/fornecedores/tabela
  motoristas:
    - POST /private/motoristas/buscar
    - POST /private/motoristas/criar
    - POST /private/motoristas/listar
    - PUT /private/motoristas/atualizar/{id}
    - POST /private/motoristas/tabela
  vendedores:
    - POST /private/vendedores/buscar
    - POST /private/vendedores/criar
    - POST /private/vendedores/listar
    - PUT /private/vendedores/atualizar/{id}
    - POST /private/vendedores/tabela
  categorias:
    - POST /private/categorias/buscar
    - POST /private/categorias/criar
    - POST /private/categorias/listar
    - PUT /private/categorias/atualizar/{id}
    - POST /private/categorias/tabela
  subcategorias:
    - POST /private/subcategorias/buscar
    - POST /private/subcategorias/criar
    - POST /private/subcategorias/listar
    - PUT /private/subcategorias/atualizar/{id}
    - POST /private/subcategorias/tabela
  clientes:
    - POST /private/clientes/listar
    - POST /private/clientes/criar
    - POST /private/clientes/buscar
    - PUT /private/clientes/atualizar/{id}
  transportadoras:
    - POST /private/transportadoras/listar
    - POST /private/transportadoras/criar
    - POST /private/transportadoras/buscar
    - PUT /private/transportadoras/atualizar/{id}
  produtos:
    - POST /private/produtos/criar
    - POST /private/produtos/buscar
    - POST /private/produtos/listar
    - PUT /private/produtos/atualizar/{id}
  operacoes:
    - POST /private/operacoes/buscar
    - POST /private/operacoes/criar
    - POST /private/operacoes/listar
    - PUT /private/operacoes/atualizar/{id}
  formas_pagamento:
    - POST /private/formas-pagamento/buscar
    - POST /private/formas-pagamento/criar
    - POST /private/formas-pagamento/listar
    - PUT /private/formas-pagamento/atualizar/{id}
  vendas:
    - POST /private/vendas/criar
    - POST /private/vendas/duplicar
    - POST /private/vendas/reabrir
    - POST /private/vendas/listar
    - PUT /private/vendas/atualizar/{id}
    - POST /private/vendas/pagamentos/criar
    - POST /private/vendas/pagamentos/listar
    - PUT /private/vendas/pagamentos/atualizar/{id}
    - DELETE /private/vendas/pagamentos/deletar/{id}
  contas:
    - POST /private/contas/criar
    - POST /private/contas/listar
    - PUT /private/contas/atualizar/{id}
    - GET /private/contas/gerar-pagamento/{id}
  fiscal:
    - GET /private/fiscal/nfce/{venda}
    - GET /private/fiscal/nfcepreview/{venda}
    - GET /private/fiscal/nfe/{venda}
    - GET /private/fiscal/nfse/{venda}
    - GET /private/fiscal/nfepreview/{venda}
    - POST /private/fiscal/cce/{venda}
    - GET /private/fiscal/cancelar/{venda}
    - POST /private/fiscal/cest
    - POST /private/fiscal/ibpt
    - POST /private/fiscal/ncm
    - POST /private/fiscal/situacao
    - POST /private/fiscal/cfop
    - POST /private/fiscal/formas
    - POST /private/fiscal/tipos-pagamento
    - POST /private/fiscal/unidades
    - POST /private/fiscal/origem
    - POST /private/fiscal/estados/
    - GET /private/fiscal/estados/{uf}
    - GET /private/fiscal/cidades/{uf}/{cidade}
    - POST /private/fiscal/cidades/{uf}
    - POST /private/fiscal/testar
    - GET /private/fiscal/testar/{cnpj}
  regras_fiscais:
    - POST /private/regras-fiscais/buscar
    - POST /private/regras-fiscais/criar
    - POST /private/regras-fiscais/listar
    - PUT /private/regras-fiscais/atualizar/{id}
  relatorios:
    - POST /private/relatorios/vendas
    - POST /private/relatorios/estoque
  pagamentos:
    - POST /private/pagamentos/gerar-pix
    - POST /private/pagamentos/consultar-pagamento
  faturas:
    - GET /private/faturas/{id}

root:
  contas_usuarios:
    - POST /root/contas-usuarios/buscar
    - POST /root/contas-usuarios/criar
    - POST /root/contas-usuarios/listar
    - PUT /root/contas-usuarios/atualizar/{id}
    - POST /root/contas-usuarios/tabela
  contas_usuarios_faturas:
    - POST /root/contas-usuarios-faturas/buscar
    - POST /root/contas-usuarios-faturas/criar
    - POST /root/contas-usuarios-faturas/listar
    - PUT /root/contas-usuarios-faturas/atualizar/{id}
  misc:
    - GET /root/gerar-financeiro/{id}
```

## Safety notes for future agents

```yaml
do_not_assume:
  - database schema beyond runtime metadata
  - all controllers add deletado filter
  - date_ranger is implemented by every model
  - DataTable related joins work without checking table prefix behavior

important_risks:
  - filter field names are interpolated into SQL condition strings
  - OPERATOR is interpolated into SQL condition strings
  - delete is physical in models
  - validation uses DB metadata, so examples may require actual DB columns not visible in PHP code

when_modifying:
  - preserve ControllerBase and BaseModel contracts
  - check Routers.php before documenting an endpoint
  - check relationConfig and DB FKs before documenting includes
  - prefer adding explicit allowlists if exposing filter fields to untrusted clients
```

