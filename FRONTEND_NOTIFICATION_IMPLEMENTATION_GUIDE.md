# Guia de Implementação Frontend - Sistema de Notificações

## 📋 Visão Geral

Este guia fornece todas as informações necessárias para implementar o sistema de notificações no frontend da aplicação Superese. O backend já está completamente implementado e funcional.

## 🔗 Endpoints Disponíveis

### Base URL

```
https://your-api-domain.com/notifications
```

### Autenticação

Todos os endpoints requerem autenticação via Firebase Auth Token:

```typescript
headers: {
  'Authorization': `Bearer ${firebaseToken}`,
  'Content-Type': 'application/json'
}
```

---

## 📡 API Endpoints

### 1. Buscar Notificações

```http
GET /notifications
```

**Query Parameters:**

- `limit` (opcional) - Número máximo de notificações por página (padrão: 10)
- `offset` (opcional) - Número de notificações para pular (padrão: 0)
- `unreadOnly` (opcional) - Buscar apenas não lidas (true/false)

**Exemplo de Request:**

```typescript
const getNotifications = async (page = 1, limit = 10, unreadOnly = false) => {
  const offset = (page - 1) * limit;
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    unreadOnly: unreadOnly.toString(),
  });

  const response = await fetch(`/notifications?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

**Response:**

```typescript
interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  stats: {
    totalUnread: number;
    totalNotifications: number;
  };
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'friend_request' | 'friend_accepted';
  message: string;
  status: 'read' | 'unread';
  createdAt: string; // ISO date
  actor: {
    id: string;
    username: string;
    foto?: string;
  };
  redirectData: {
    type: 'post' | 'comment' | 'friendship';
    postId?: string;
    commentId?: string;
    friendshipId?: string;
  };
}
```

### 2. Buscar Estatísticas

```http
GET /notifications/stats
```

**Exemplo de Request:**

```typescript
const getNotificationStats = async () => {
  const response = await fetch('/notifications/stats', {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

**Response:**

```typescript
interface NotificationStats {
  totalUnread: number;
  totalNotifications: number;
}
```

### 3. Marcar Como Lidas

```http
PATCH /notifications/mark-as-read
```

**Body (opcional):**

```typescript
{
  notificationIds?: string[]; // Se não enviado, marca todas como lidas
}
```

**Exemplo de Request:**

```typescript
// Marcar notificações específicas como lidas
const markAsRead = async (notificationIds?: string[]) => {
  const response = await fetch('/notifications/mark-as-read', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
      'Content-Type': 'application/json',
    },
    body: notificationIds ? JSON.stringify({ notificationIds }) : undefined,
  });

  return await response.json();
};

// Exemplo de uso
await markAsRead(['notif-id-1', 'notif-id-2']); // Específicas
await markAsRead(); // Todas
```

**Response:**

```typescript
{
  updated: number; // Quantidade de notificações atualizadas
}
```

### 4. Marcar Todas Como Lidas

```http
PATCH /notifications/mark-all-as-read
```

**Exemplo de Request:**

```typescript
const markAllAsRead = async () => {
  const response = await fetch('/notifications/mark-all-as-read', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

### 5. Deletar Notificação

```http
DELETE /notifications/:id
```

**Exemplo de Request:**

```typescript
const deleteNotification = async (notificationId: string) => {
  const response = await fetch(`/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  // Response é 204 No Content se sucesso
  return response.status === 204;
};
```

---

## 🎨 Implementação Frontend Sugerida

### 1. Hook Personalizado para Notificações

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    totalUnread: 0,
    totalNotifications: 0,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const fetchNotifications = useCallback(
    async (page = 1, unreadOnly = false) => {
      setLoading(true);
      try {
        const data = await getNotifications(page, 10, unreadOnly);
        setNotifications(data.notifications);
        setPagination(data.pagination);
        setStats(data.stats);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    try {
      await markNotificationsAsRead(notificationIds);
      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((notif) =>
          !notificationIds || notificationIds.includes(notif.id)
            ? { ...notif, status: 'read' }
            : notif,
        ),
      );
      // Atualizar stats
      await fetchStats();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationById(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId),
      );
      await fetchStats();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getNotificationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (options.autoRefresh) {
      const interval = setInterval(
        fetchStats,
        options.refreshInterval || 30000,
      );
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, options.autoRefresh, options.refreshInterval]);

  return {
    notifications,
    stats,
    pagination,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    fetchStats,
  };
};
```

### 2. Componente de Lista de Notificações

```typescript
import React from 'react';
import { useNotifications } from './hooks/useNotifications';

export const NotificationList: React.FC = () => {
  const {
    notifications,
    stats,
    pagination,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification
  } = useNotifications({ autoRefresh: true });

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida
    if (notification.status === 'unread') {
      await markAsRead([notification.id]);
    }

    // Redirecionar baseado no tipo
    const { redirectData } = notification;
    switch (redirectData.type) {
      case 'post':
        // Navegar para o post
        router.push(`/forum/post/${redirectData.postId}`);
        break;
      case 'comment':
        // Navegar para o post com foco no comentário
        router.push(`/forum/post/${redirectData.postId}#comment-${redirectData.commentId}`);
        break;
      case 'friendship':
        // Navegar para página de amizades
        router.push('/profile/friends');
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'reply': return '↩️';
      case 'friend_request': return '👥';
      case 'friend_accepted': return '✅';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
  };

  if (loading && notifications.length === 0) {
    return <div className="loading">Carregando notificações...</div>;
  }

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h2>Notificações</h2>
        <div className="notification-stats">
          <span className="unread-count">{stats.totalUnread} não lidas</span>
          <button onClick={() => markAsRead()}>
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="notification-items">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.status === 'unread' ? 'unread' : 'read'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-content">
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {formatTimeAgo(notification.createdAt)}
                </div>
              </div>

              <div className="notification-actions">
                {notification.status === 'unread' && (
                  <button
                    className="mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead([notification.id]);
                    }}
                  >
                    Marcar como lida
                  </button>
                )}

                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.currentPage === 1}
            onClick={() => fetchNotifications(pagination.currentPage - 1)}
          >
            Anterior
          </button>

          <span>
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>

          <button
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => fetchNotifications(pagination.currentPage + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};
```

### 3. Componente de Badge de Notificações

```typescript
export const NotificationBadge: React.FC = () => {
  const { stats } = useNotifications({ autoRefresh: true, refreshInterval: 10000 });

  return (
    <div className="notification-badge">
      <span className="notification-icon">🔔</span>
      {stats.totalUnread > 0 && (
        <span className="badge-count">
          {stats.totalUnread > 99 ? '99+' : stats.totalUnread}
        </span>
      )}
    </div>
  );
};
```

### 4. Serviço de API

```typescript
// services/notificationService.ts
import { getAuthToken } from './authService';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class NotificationService {
  private async getHeaders() {
    const token = await getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getNotifications(page = 1, limit = 10, unreadOnly = false) {
    const offset = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await fetch(`${API_BASE}/notifications?${queryParams}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar notificações');
    }

    return await response.json();
  }

  async getStats() {
    const response = await fetch(`${API_BASE}/notifications/stats`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }

    return await response.json();
  }

  async markAsRead(notificationIds?: string[]) {
    const response = await fetch(`${API_BASE}/notifications/mark-as-read`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
      body: notificationIds ? JSON.stringify({ notificationIds }) : undefined,
    });

    if (!response.ok) {
      throw new Error('Erro ao marcar como lida');
    }

    return await response.json();
  }

  async markAllAsRead() {
    const response = await fetch(`${API_BASE}/notifications/mark-all-as-read`, {
      method: 'PATCH',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Erro ao marcar todas como lidas');
    }

    return await response.json();
  }

  async deleteNotification(notificationId: string) {
    const response = await fetch(
      `${API_BASE}/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: await this.getHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error('Erro ao deletar notificação');
    }

    return response.status === 204;
  }
}

export const notificationService = new NotificationService();
```

---

## 🎯 Casos de Uso Específicos

### 1. Página de Notificações

- Lista paginada de notificações
- Filtro para mostrar apenas não lidas
- Ações para marcar como lida e deletar
- Redirecionamento ao clicar na notificação

### 2. Badge no Header

- Contador de notificações não lidas
- Atualização automática a cada 10-30 segundos
- Indicador visual quando há novas notificações

### 3. Dropdown de Notificações

- Preview das últimas notificações
- Link para página completa
- Ação rápida para marcar como lida

### 4. Push Notifications (Futuro)

- Integração com service workers
- Notificações em tempo real via WebSocket

---

## 🔧 Configurações e Dicas

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Tratamento de Erros

```typescript
const handleApiError = (error: any) => {
  console.error('API Error:', error);

  if (error.status === 401) {
    // Redirect to login
    router.push('/login');
  } else if (error.status === 403) {
    // Show permission error
    toast.error('Acesso negado');
  } else {
    // Show generic error
    toast.error('Erro interno. Tente novamente.');
  }
};
```

### Performance

- Use paginação para listas grandes
- Implemente virtual scrolling se necessário
- Cache local para reduzir requests
- Debounce para ações frequentes

### UX/UI

- Loading states durante requests
- Estados vazios quando não há notificações
- Feedback visual para ações (toast, animações)
- Indicadores visuais para não lidas

---

## 📱 Responsividade

### Mobile

- Lista adaptada para tela pequena
- Swipe actions para marcar como lida/deletar
- Bottom sheet para detalhes da notificação

### Desktop

- Sidebar com notificações
- Hover states para ações
- Keyboard shortcuts

---

## 🚀 Implementação Passo a Passo

1. **Configurar Serviço de API** - Implementar `notificationService.ts`
2. **Criar Hook** - Implementar `useNotifications`
3. **Badge no Header** - Componente simples com contador
4. **Lista Básica** - Página de notificações com paginação
5. **Interações** - Marcar como lida, deletar, redirecionar
6. **Polish** - Loading states, animações, responsividade
7. **Otimizações** - Cache, polling inteligente, performance

---

## ✅ Checklist de Implementação

- [ ] Configurar variáveis de ambiente
- [ ] Implementar serviço de API
- [ ] Criar hook `useNotifications`
- [ ] Implementar badge de notificações
- [ ] Criar página de lista de notificações
- [ ] Implementar redirecionamentos
- [ ] Adicionar tratamento de erros
- [ ] Implementar loading states
- [ ] Testar responsividade
- [ ] Otimizar performance
- [ ] Adicionar animações/transições
- [ ] Testes de integração

---

## 📞 Suporte

O backend está completamente implementado e funcional. Para dúvidas sobre os endpoints ou estrutura de dados, consulte:

- `NOTIFICATION_SYSTEM_DOCS.md` - Documentação completa do sistema
- `NOTIFICATION_IMPLEMENTATION_COMPLETE.md` - Resumo da implementação
- Swagger UI da API - Para testar endpoints diretamente

**O sistema está pronto para receber requests do frontend!** 🚀
