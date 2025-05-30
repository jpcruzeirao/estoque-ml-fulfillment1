# API Reference: Sistema de Gestão de Estoque - Fulfillment Mercado Livre

Esta documentação detalha todos os endpoints disponíveis na API do sistema de gestão de estoque para o Fulfillment do Mercado Livre.

## Base URL

```
https://seu-dominio.com/api
```

## Autenticação

Todos os endpoints (exceto os de autenticação) requerem um token de acesso válido, que deve ser enviado no cabeçalho da requisição:

```
Authorization: Bearer {token}
```

### Endpoints de Autenticação

#### Login com Mercado Livre

```
POST /auth/login
```

**Parâmetros:**
```json
{
  "code": "string" // Código de autorização do Mercado Livre
}
```

**Resposta:**
```json
{
  "token": "string",
  "user": {
    "id": "integer",
    "name": "string",
    "email": "string"
  }
}
```

#### Verificar Autenticação

```
GET /auth/check
```

**Resposta:**
```json
{
  "authenticated": "boolean",
  "user": {
    "id": "integer",
    "name": "string",
    "email": "string"
  }
}
```

#### Logout

```
POST /auth/logout
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string"
}
```

## Produtos

### Listar Produtos

```
GET /products
```

**Parâmetros de Query:**
- `search` (opcional): Termo de busca
- `sort` (opcional): Campo para ordenação
- `order` (opcional): Direção da ordenação (asc/desc)
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Resposta:**
```json
{
  "products": [
    {
      "id": "integer",
      "sku": "string",
      "ml_item_id": "string",
      "ml_inventory_id": "string",
      "title": "string",
      "created_at": "string",
      "stock": {
        "total": "integer",
        "available": "integer",
        "not_available": "integer",
        "last_updated": "string"
      }
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer"
}
```

### Obter Produto

```
GET /products/{id}
```

**Resposta:**
```json
{
  "id": "integer",
  "sku": "string",
  "ml_item_id": "string",
  "ml_inventory_id": "string",
  "title": "string",
  "description": "string",
  "created_at": "string",
  "stock": {
    "total": "integer",
    "available": "integer",
    "not_available": "integer",
    "last_updated": "string"
  },
  "sales": {
    "total": "integer",
    "last_30_days": "integer"
  }
}
```

### Sincronizar Produtos

```
POST /products/sync
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string",
  "products_synced": "integer"
}
```

## Estoque

### Listar Estoque

```
GET /stock
```

**Parâmetros de Query:**
- `low_stock_only` (opcional): Filtrar apenas produtos com estoque baixo
- `sort` (opcional): Campo para ordenação
- `order` (opcional): Direção da ordenação (asc/desc)
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Resposta:**
```json
{
  "stock": [
    {
      "product_id": "integer",
      "product_title": "string",
      "total": "integer",
      "available": "integer",
      "not_available": "integer",
      "last_updated": "string"
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer"
}
```

### Sincronizar Estoque

```
POST /stock/sync
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string",
  "products_synced": "integer"
}
```

### Ajustar Estoque

```
POST /stock/adjust
```

**Parâmetros:**
```json
{
  "product_id": "integer",
  "type": "string", // "add", "remove", "loss", "damage"
  "quantity": "integer",
  "reason": "string"
}
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string",
  "stock": {
    "previous": {
      "total": "integer",
      "available": "integer"
    },
    "current": {
      "total": "integer",
      "available": "integer"
    }
  }
}
```

## Vendas

### Listar Vendas

```
GET /sales
```

**Parâmetros de Query:**
- `period` (opcional): Período de tempo (day, week, month, year)
- `product_id` (opcional): Filtrar por produto
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Resposta:**
```json
{
  "sales": [
    {
      "id": "integer",
      "ml_order_id": "string",
      "product_id": "integer",
      "product_title": "string",
      "quantity": "integer",
      "date": "string",
      "status": "string"
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer",
  "summary": {
    "total_sales": "integer",
    "total_quantity": "integer",
    "top_products": [
      {
        "product_id": "integer",
        "product_title": "string",
        "quantity": "integer"
      }
    ]
  }
}
```

### Vendas por Produto

```
GET /sales/product/{id}
```

**Parâmetros de Query:**
- `period` (opcional): Período de tempo (day, week, month, year)

**Resposta:**
```json
{
  "product": {
    "id": "integer",
    "title": "string"
  },
  "sales": [
    {
      "date": "string",
      "quantity": "integer"
    }
  ],
  "total_quantity": "integer"
}
```

## Atividades

### Listar Atividades

```
GET /activities
```

**Parâmetros de Query:**
- `type` (opcional): Tipo de atividade (all, sale, stock_change, sync)
- `period` (opcional): Período de tempo (day, week, month, year)
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Resposta:**
```json
{
  "activities": [
    {
      "id": "integer",
      "type": "string",
      "description": "string",
      "date": "string",
      "product_id": "integer",
      "product_title": "string",
      "details": "object"
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer"
}
```

## Gráficos

### Dados de Vendas para Gráfico

```
GET /charts/sales
```

**Resposta:**
```json
[
  {
    "id": "integer",
    "title": "string",
    "total_sold": "integer",
    "daily_data": [
      {
        "date": "string",
        "quantity": "integer"
      }
    ]
  }
]
```

### Dados de Estoque para Gráfico

```
GET /charts/stock
```

**Resposta:**
```json
[
  {
    "id": "integer",
    "title": "string",
    "stock_history": [
      {
        "date": "string",
        "available": "integer",
        "total": "integer"
      }
    ]
  }
]
```

## Alertas

### Listar Alertas

```
GET /alerts
```

**Resposta:**
```json
{
  "alerts": [
    {
      "id": "integer",
      "type": "string",
      "title": "string",
      "message": "string",
      "timestamp": "string",
      "read": "boolean",
      "product_id": "integer",
      "product_title": "string"
    }
  ],
  "unread_count": "integer"
}
```

### Obter Configurações de Alertas

```
GET /alerts/settings
```

**Resposta:**
```json
{
  "global": {
    "enabled": "boolean",
    "threshold": "integer",
    "notification_email": "string",
    "notification_dashboard": "boolean"
  },
  "products": [
    {
      "product_id": "integer",
      "product_title": "string",
      "threshold": "integer"
    }
  ]
}
```

### Atualizar Configurações de Alertas

```
POST /alerts/settings
```

**Parâmetros:**
```json
{
  "global": {
    "enabled": "boolean",
    "threshold": "integer",
    "notification_email": "string",
    "notification_dashboard": "boolean"
  },
  "products": [
    {
      "product_id": "integer",
      "threshold": "integer"
    }
  ]
}
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string"
}
```

## Envios

### Listar Envios

```
GET /shipments
```

**Parâmetros de Query:**
- `status` (opcional): Status do envio (all, draft, pending, in_transit, delivered, cancelled)
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Resposta:**
```json
{
  "shipments": [
    {
      "id": "integer",
      "status": "string",
      "created_at": "string",
      "updated_at": "string",
      "estimated_delivery": "string",
      "tracking_number": "string",
      "destination_warehouse": "string",
      "notes": "string",
      "items_count": "integer",
      "total_items": "integer"
    }
  ],
  "total": "integer",
  "page": "integer",
  "limit": "integer"
}
```

### Obter Envio

```
GET /shipments/{id}
```

**Resposta:**
```json
{
  "id": "integer",
  "status": "string",
  "created_at": "string",
  "updated_at": "string",
  "estimated_delivery": "string",
  "tracking_number": "string",
  "destination_warehouse": "string",
  "notes": "string",
  "items": [
    {
      "product_id": "integer",
      "product_title": "string",
      "quantity": "integer"
    }
  ]
}
```

### Criar Envio

```
POST /shipments
```

**Parâmetros:**
```json
{
  "destination_warehouse": "string",
  "notes": "string",
  "items": [
    {
      "product_id": "integer",
      "quantity": "integer"
    }
  ]
}
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string",
  "shipment": {
    "id": "integer",
    "status": "string",
    "created_at": "string",
    "tracking_number": "string"
  }
}
```

### Atualizar Envio

```
PUT /shipments/{id}
```

**Parâmetros:**
```json
{
  "status": "string",
  "destination_warehouse": "string",
  "notes": "string",
  "items": [
    {
      "product_id": "integer",
      "quantity": "integer"
    }
  ]
}
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string",
  "shipment": {
    "id": "integer",
    "status": "string",
    "updated_at": "string"
  }
}
```

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Acesso proibido |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

## Limites de Taxa

A API tem um limite de 100 requisições por minuto por usuário. Se você exceder esse limite, receberá um erro 429 (Too Many Requests).

## Versão da API

A versão atual da API é v1. Todas as URLs começam com `/api`.

## Suporte

Para suporte relacionado à API, entre em contato com:
- Email: api-support@exemplo.com
