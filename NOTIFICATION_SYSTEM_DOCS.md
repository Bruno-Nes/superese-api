# Sistema de Notificações - Superese API

## Visão Geral

O sistema de notificações foi implementado para lidar com interações de usuários como curtidas, comentários, respostas e solicitações de amizade. O sistema usa uma abordagem baseada em eventos para evitar dependências circulares.

## Arquitetura

### Componentes Principais

1. **Notification Entity** - Define a estrutura das notificações
2. **NotificationService** - Lógica de negócio para criar e gerenciar notificações
3. **NotificationController** - Endpoints da API
4. **NotificationListener** - Listeners de eventos para criar notificações automaticamente
5. **Events** - Classes de eventos para diferentes tipos de notificações

### Tipos de Notificação

- `LIKE` - Quando alguém curte um post
- `COMMENT` - Quando alguém comenta em um post
- `REPLY` - Quando alguém responde a um comentário
- `FRIEND_REQUEST` - Quando alguém envia solicitação de amizade
- `FRIEND_ACCEPTED` - Quando uma solicitação de amizade é aceita

## Endpoints da API

### 1. Buscar Notificações

```
GET /notifications
```

**Parâmetros de Query:**

- `page` (opcional) - Página (padrão: 1)
- `limit` (opcional) - Itens por página (padrão: 10)
- `status` (opcional) - Filtrar por status ('read' | 'unread')
- `type` (opcional) - Filtrar por tipo de notificação

**Resposta:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "like",
      "message": "João curtiu seu post",
      "status": "unread",
      "createdAt": "2025-06-03T10:00:00Z",
      "actor": {
        "id": "uuid",
        "username": "joao123"
      },
      "redirectData": {
        "type": "post",
        "postId": "uuid"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 45,
    "itemsPerPage": 10
  },
  "stats": {
    "totalUnread": 3,
    "totalNotifications": 45
  }
}
```

### 2. Buscar Estatísticas

```
GET /notifications/stats
```

**Resposta:**

```json
{
  "totalUnread": 3,
  "totalNotifications": 45
}
```

### 3. Marcar como Lida

```
PATCH /notifications/read
```

**Body (opcional):**

```json
{
  "notificationIds": ["uuid1", "uuid2"]
}
```

Se `notificationIds` não for fornecido, todas as notificações serão marcadas como lidas.

### 4. Deletar Notificação

```
DELETE /notifications/:id
```

## Integração com Outros Módulos

### Forum Service

O ForumService emite eventos quando:

- Um post é curtido → `post.liked`
- Um comentário é criado → `comment.created`
- Uma resposta é criada → `reply.created`

### Friendship Service

O FriendshipService emite eventos quando:

- Uma solicitação de amizade é enviada → `friend.request.sent`
- Uma solicitação de amizade é aceita → `friend.request.accepted`

## Como Funciona

1. **Ação do Usuário**: Usuário curte um post, comenta, etc.
2. **Evento Emitido**: O serviço correspondente emite um evento
3. **Listener Captura**: NotificationListener captura o evento
4. **Notificação Criada**: Uma notificação é criada no banco de dados
5. **Usuário Consulta**: O usuário pode consultar suas notificações via API

## Dados de Redirecionamento

Cada notificação inclui `redirectData` que indica onde o usuário deve ser redirecionado:

```typescript
{
  type: 'post' | 'comment' | 'friendship',
  postId?: string,
  commentId?: string,
  friendshipId?: string
}
```

## Exemplo de Uso Frontend

```typescript
// Buscar notificações
const getNotifications = async (page = 1) => {
  const response = await fetch(`/notifications?page=${page}`, {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });
  return await response.json();
};

// Marcar como lida
const markAsRead = async (notificationIds?: string[]) => {
  const response = await fetch('/notifications/read', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      'Content-Type': 'application/json',
    },
    body: notificationIds ? JSON.stringify({ notificationIds }) : undefined,
  });
  return await response.json();
};

// Buscar estatísticas
const getStats = async () => {
  const response = await fetch('/notifications/stats', {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });
  return await response.json();
};
```

## Testes

Para testar o sistema, existe um endpoint de teste:

```
POST /test-notifications/create-test
{
  "recipientId": "uuid-do-usuario-destinatario",
  "message": "Mensagem de teste"
}
```

## Configuração de Banco de Dados

As notificações são armazenadas na tabela `notifications` com as seguintes colunas:

- `id` (UUID, PK)
- `type` (ENUM)
- `status` (ENUM, default: 'unread')
- `message` (TEXT)
- `recipient_id` (UUID, FK para Profile)
- `actor_id` (UUID, FK para Profile)
- `post_id` (UUID, FK para Post, opcional)
- `comment_id` (UUID, FK para Comment, opcional)
- `friendship_id` (UUID, FK para Friendship, opcional)
- `metadata` (JSON, opcional)
- `createdAt` (TIMESTAMP)

## Performance

- Paginação implementada para evitar carregar muitas notificações
- Índices recomendados: `recipient_id`, `status`, `createdAt`
- Limpeza automática pode ser implementada para notificações antigas

## Próximos Passos

1. Implementar notificações em tempo real via WebSocket
2. Adicionar templates de notificação personalizáveis
3. Implementar preferências de notificação por usuário
4. Adicionar notificações push mobile
5. Implementar sistema de limpeza automática de notificações antigas
