# Chat em Tempo Real - Guia de Implementação Frontend

## 1. Configuração do Socket.io no Frontend

### Instalação

```bash
npm install socket.io-client
```

### Configuração Básica

```javascript
import io from 'socket.io-client';

// Conectar ao namespace do chat
const socket = io('http://localhost:3000/chat', {
  transports: ['websocket'],
  autoConnect: false,
});

// Conectar quando o usuário fizer login
socket.connect();
```

## 2. Implementação do Chat

### Estrutura de Estados (React)

```javascript
import { useState, useEffect } from 'react';

const ChatComponent = ({ currentUserId, recipientId }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Configurar socket
    const newSocket = io('http://localhost:3000/chat');
    setSocket(newSocket);

    // Entrar na sala do usuário
    newSocket.emit('join_user', { userId: currentUserId });

    // Listeners para eventos do socket
    newSocket.on('receive_message', handleReceiveMessage);
    newSocket.on('message_sent', handleMessageSent);
    newSocket.on('user_typing', handleUserTyping);
    newSocket.on('messages_read', handleMessagesRead);
    newSocket.on('error', handleError);

    return () => newSocket.close();
  }, [currentUserId]);

  const handleReceiveMessage = (message) => {
    setMessages((prev) => [...prev, message]);
    // Tocar som de notificação se necessário
    playNotificationSound();
  };

  const handleMessageSent = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleUserTyping = ({ userId, isTyping }) => {
    if (userId === recipientId) {
      setOtherUserTyping(isTyping);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('send_message', {
        senderId: currentUserId,
        receiverId: recipientId,
        content: newMessage.trim(),
      });
      setNewMessage('');
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', {
        senderId: currentUserId,
        receiverId: recipientId,
        isTyping: true,
      });

      // Parar de enviar "digitando" após 3 segundos
      setTimeout(() => {
        socket.emit('typing', {
          senderId: currentUserId,
          receiverId: recipientId,
          isTyping: false,
        });
      }, 3000);
    }
  };

  const markAsRead = () => {
    if (socket) {
      socket.emit('mark_as_read', {
        senderId: recipientId,
        receiverId: currentUserId,
      });
    }
  };

  return (
    <div className="chat-container">
      {/* Lista de mensagens */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-time">
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {otherUserTyping && (
          <div className="typing-indicator">O usuário está digitando...</div>
        )}
      </div>

      {/* Input de mensagem */}
      <div className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage();
            else handleTyping();
          }}
          placeholder="Digite sua mensagem..."
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
};
```

## 3. API REST para Carregar Conversas

### Buscar conversas do usuário

```javascript
const getConversations = async (userId) => {
  try {
    const response = await fetch(`/api/messages/conversations/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
  }
};
```

### Buscar mensagens entre dois usuários

```javascript
const getMessagesBetweenUsers = async (user1Id, user2Id) => {
  try {
    const response = await fetch(
      `/api/messages/between?user1=${user1Id}&user2=${user2Id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
  }
};
```

## 4. Componente de Lista de Conversas

```javascript
const ConversationsList = ({ currentUserId, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  const loadConversations = async () => {
    const data = await getConversations(currentUserId);
    setConversations(data);
  };

  return (
    <div className="conversations-list">
      {conversations.map((conversation) => (
        <div
          key={conversation.otherUser.id}
          className="conversation-item"
          onClick={() => onSelectConversation(conversation.otherUser)}
        >
          <img src={conversation.otherUser.avatar} alt="Avatar" />
          <div className="conversation-info">
            <div className="user-name">
              {conversation.otherUser.firstName}{' '}
              {conversation.otherUser.lastName}
            </div>
            <div className="last-message">
              {conversation.lastMessage.content}
            </div>
            <div className="message-time">
              {new Date(conversation.lastMessage.createdAt).toLocaleString()}
            </div>
          </div>
          {conversation.unreadCount > 0 && (
            <div className="unread-count">{conversation.unreadCount}</div>
          )}
        </div>
      ))}
    </div>
  );
};
```

## 5. CSS Básico para o Chat

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
}

.message.sent {
  align-items: flex-end;
}

.message.received {
  align-items: flex-start;
}

.message-content {
  background: #f0f0f0;
  padding: 8px 12px;
  border-radius: 18px;
  max-width: 70%;
}

.message.sent .message-content {
  background: #007bff;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.message-input-container {
  display: flex;
  padding: 16px;
  border-top: 1px solid #ddd;
}

.message-input-container input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 8px;
}

.typing-indicator {
  font-style: italic;
  color: #666;
  padding: 8px;
}

.conversations-list {
  border-right: 1px solid #ddd;
  width: 300px;
}

.conversation-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.conversation-item:hover {
  background: #f5f5f5;
}

.unread-count {
  background: #ff4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
```

## 6. Eventos do Socket Disponíveis

### Eventos que o cliente pode emitir:

- `join_user`: Entrar na sala do usuário
- `leave_user`: Sair da sala do usuário
- `send_message`: Enviar mensagem
- `typing`: Indicar que está digitando
- `mark_as_read`: Marcar mensagens como lidas

### Eventos que o cliente pode receber:

- `receive_message`: Receber nova mensagem
- `message_sent`: Confirmação de mensagem enviada
- `user_typing`: Outro usuário está digitando
- `user_online`: Usuário ficou online
- `user_offline`: Usuário ficou offline
- `messages_read`: Mensagens foram lidas
- `error`: Erro no servidor
