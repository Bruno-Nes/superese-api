# Sistema de Chat em Tempo Real

## Visão Geral

Este sistema implementa um chat em tempo real usando WebSockets (Socket.io) que permite a comunicação entre usuários com persistência de mensagens no banco de dados, similar ao funcionamento do WhatsApp.

## Funcionalidades Implementadas

### ✅ Backend Completo

1. **WebSocket Gateway** (`chat.gateway.ts`)

   - Conexão/desconexão de usuários
   - Envio e recebimento de mensagens em tempo real
   - Indicadores de digitação (typing)
   - Sistema de salas por usuário
   - Marcação de mensagens como lidas

2. **Serviço de Mensagens** (`message.service.ts`)

   - Criar mensagens
   - Buscar mensagens entre dois usuários
   - Buscar conversas do usuário
   - Marcar mensagens como lidas
   - Deletar mensagens
   - Contar mensagens não lidas

3. **Controller REST** (`message.controller.ts`)

   - Endpoints para buscar conversas
   - Endpoints para buscar histórico de mensagens
   - Endpoints para deletar mensagens

4. **Entidade Message** (`message.entity.ts`)
   - Estrutura da mensagem com sender, receiver, content
   - Campo isRead para controle de leitura
   - Timestamps automáticos

## Estrutura do Banco de Dados

### Tabela Message

```sql
message {
  id: number (PK)
  sender: Profile (FK)
  receiver: Profile (FK)
  content: string
  isRead: boolean (default: false)
  createdAt: Date
}
```

### Relações na Entidade Profile

```typescript
@OneToMany(() => Message, (message) => message.sender)
sentMessages: Message[];

@OneToMany(() => Message, (message) => message.receiver)
receivedMessages: Message[];
```

## API Endpoints

### WebSocket Events (namespace: `/chat`)

#### Eventos que o cliente emite:

- `join_user`: Entrar na sala do usuário
- `leave_user`: Sair da sala do usuário
- `send_message`: Enviar mensagem
- `typing`: Indicar digitação
- `mark_as_read`: Marcar mensagens como lidas

#### Eventos que o cliente recebe:

- `receive_message`: Nova mensagem recebida
- `message_sent`: Confirmação de mensagem enviada
- `user_typing`: Outro usuário digitando
- `user_online`: Usuário ficou online
- `user_offline`: Usuário ficou offline
- `messages_read`: Mensagens foram lidas
- `error`: Erro do servidor

### REST Endpoints

```
GET /messages/conversations/:userId
- Busca todas as conversas do usuário
- Retorna: lista de conversas com última mensagem e contagem de não lidas

GET /messages/between?user1=:id&user2=:id
- Busca mensagens entre dois usuários
- Retorna: histórico completo ordenado por data

DELETE /messages/:messageId/:userId
- Deleta uma mensagem (apenas o remetente pode deletar)
- Retorna: confirmação de sucesso
```

## Como Usar

### 1. Conectar ao WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat');

// Entrar na sala do usuário
socket.emit('join_user', { userId: 'user-123' });
```

### 2. Enviar Mensagem

```javascript
socket.emit('send_message', {
  senderId: 'user-123',
  receiverId: 'user-456',
  content: 'Olá! Como você está?',
});
```

### 3. Receber Mensagens

```javascript
socket.on('receive_message', (message) => {
  console.log('Nova mensagem:', message);
  // Atualizar UI com a nova mensagem
});
```

### 4. Indicador de Digitação

```javascript
// Enviar indicador de digitação
socket.emit('typing', {
  senderId: 'user-123',
  receiverId: 'user-456',
  isTyping: true,
});

// Receber indicador de digitação
socket.on('user_typing', ({ userId, isTyping }) => {
  // Mostrar/ocultar indicador na UI
});
```

### 5. Marcar como Lida

```javascript
socket.emit('mark_as_read', {
  senderId: 'user-456', // quem enviou as mensagens
  receiverId: 'user-123', // quem está lendo (eu)
});
```

## Próximos Passos

### Para Produção:

1. **Autenticação**: Integrar com JWT para validar usuários conectados
2. **Rate Limiting**: Prevenir spam de mensagens
3. **Criptografia**: Criptografar mensagens sensíveis
4. **Media Support**: Suporte para imagens/arquivos
5. **Push Notifications**: Notificações quando usuário offline
6. **Message Status**: Enviado, entregue, lido (como WhatsApp)
7. **Groups**: Suporte para grupos/canais
8. **Message Reactions**: Reações às mensagens

### Para Performance:

1. **Redis**: Cache para usuários online e mensagens recentes
2. **Pagination**: Paginar histórico de mensagens
3. **Clustering**: Suporte para múltiplas instâncias
4. **Database Indexing**: Índices para otimizar queries

## Estrutura de Arquivos Criados/Modificados

```
src/modules/user/
├── chat-gateway/
│   └── chat.gateway.ts ✅ (Completo)
├── controllers/
│   └── message.controller.ts ✅ (Novo)
├── services/
│   └── message.service.ts ✅ (Atualizado)
├── entities/
│   └── message.entity.ts ✅ (Atualizado)
└── user.module.ts ✅ (Atualizado)

migrations/
└── 1732828800000-AddIsReadToMessage.ts ✅ (Nova)

CHAT_FRONTEND_GUIDE.md ✅ (Guia completo)
```

## Testando o Sistema

1. **Executar Migração**:

```bash
npm run typeorm:run-migrations
```

2. **Iniciar Servidor**:

```bash
npm run start:dev
```

3. **Conectar Frontend**: Use o guia em `CHAT_FRONTEND_GUIDE.md`

4. **Testar WebSocket**: Use ferramentas como Socket.io Client Tool ou Postman

O sistema está completamente funcional e pronto para integração com o frontend! 🚀
