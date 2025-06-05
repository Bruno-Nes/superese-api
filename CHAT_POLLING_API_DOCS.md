# Chat Polling API - Documentação para Frontend (Ionic/Angular)

Esta documentação descreve os endpoints da API de chat com sistema de polling para integração com aplicações Ionic/Angular.

## Base URL

```
https://sua-api.com/chat
```

## Autenticação

Todos os endpoints requerem autenticação JWT. Inclua o token no header:

```
Authorization: Bearer <seu-jwt-token>
```

---

## 📋 Endpoints Disponíveis

### 1. Criar ou Obter Chat entre Usuários

**Endpoint:** `POST /chat/create-or-get`  
**Descrição:** Cria um novo chat ou retorna um chat existente entre dois usuários.

**Request Body:**

```json
{
  "user1Id": "uuid-do-usuario-1",
  "user2Id": "uuid-do-usuario-2"
}
```

**Response (200):**

```json
{
  "id": "uuid-do-chat",
  "user1": {
    "id": "uuid-do-usuario-1",
    "firstName": "João",
    "lastName": "Silva",
    "username": "joao_silva",
    "avatar": "https://exemplo.com/avatar1.jpg"
  },
  "user2": {
    "id": "uuid-do-usuario-2",
    "firstName": "Maria",
    "lastName": "Santos",
    "username": "maria_santos",
    "avatar": "https://exemplo.com/avatar2.jpg"
  },
  "createdAt": "2024-12-01T10:00:00Z",
  "updatedAt": "2024-12-01T15:30:00Z"
}
```

**Exemplo Angular/Ionic:**

```typescript
// chat.service.ts
async createOrGetChat(user1Id: string, user2Id: string) {
  const response = await this.http.post(`${this.baseUrl}/chat/create-or-get`, {
    user1Id,
    user2Id
  }).toPromise();
  return response;
}
```

---

### 2. Enviar Mensagem no Chat

**Endpoint:** `POST /chat/:chatId/send`  
**Descrição:** Envia uma nova mensagem em um chat específico.

**URL Parameters:**

- `chatId`: UUID do chat

**Request Body:**

```json
{
  "senderId": "uuid-do-remetente",
  "content": "Conteúdo da mensagem"
}
```

**Response (201):**

```json
{
  "id": 123,
  "content": "Conteúdo da mensagem",
  "isRead": false,
  "createdAt": "2024-12-01T15:45:00Z",
  "sender": {
    "id": "uuid-do-remetente",
    "firstName": "João",
    "lastName": "Silva",
    "username": "joao_silva",
    "avatar": "https://exemplo.com/avatar1.jpg"
  },
  "chat": {
    "id": "uuid-do-chat"
  }
}
```

**Exemplo Angular/Ionic:**

```typescript
// chat.service.ts
async sendMessage(chatId: string, senderId: string, content: string) {
  const response = await this.http.post(`${this.baseUrl}/chat/${chatId}/send`, {
    senderId,
    content
  }).toPromise();
  return response;
}
```

---

### 3. Buscar Novas Mensagens (Polling)

**Endpoint:** `GET /chat/:chatId/messages?lastMessageId=:lastId`  
**Descrição:** Busca mensagens novas baseado no ID da última mensagem conhecida. Este é o endpoint principal para implementar o sistema de polling.

**URL Parameters:**

- `chatId`: UUID do chat

**Query Parameters:**

- `lastMessageId` (opcional): ID da última mensagem conhecida. Se não fornecido, retorna todas as mensagens.

**Response (200):**

```json
[
  {
    "id": 124,
    "content": "Nova mensagem 1",
    "isRead": false,
    "createdAt": "2024-12-01T15:50:00Z",
    "sender": {
      "id": "uuid-do-remetente",
      "firstName": "Maria",
      "lastName": "Santos",
      "username": "maria_santos",
      "avatar": "https://exemplo.com/avatar2.jpg"
    }
  },
  {
    "id": 125,
    "content": "Nova mensagem 2",
    "isRead": false,
    "createdAt": "2024-12-01T15:52:00Z",
    "sender": {
      "id": "uuid-do-remetente",
      "firstName": "Maria",
      "lastName": "Santos",
      "username": "maria_santos",
      "avatar": "https://exemplo.com/avatar2.jpg"
    }
  }
]
```

**Exemplo Angular/Ionic para Polling:**

```typescript
// chat.service.ts
async getNewMessages(chatId: string, lastMessageId?: number) {
  let url = `${this.baseUrl}/chat/${chatId}/messages`;
  if (lastMessageId) {
    url += `?lastMessageId=${lastMessageId}`;
  }

  const response = await this.http.get(url).toPromise();
  return response as Message[];
}

// Implementação do polling
private pollingInterval: any;

startPolling(chatId: string) {
  this.pollingInterval = setInterval(async () => {
    try {
      const lastMessageId = this.getLastMessageId(); // Implementar esta função
      const newMessages = await this.getNewMessages(chatId, lastMessageId);

      if (newMessages.length > 0) {
        this.handleNewMessages(newMessages); // Implementar esta função
      }
    } catch (error) {
      console.error('Erro no polling:', error);
    }
  }, 3000); // Polling a cada 3 segundos
}

stopPolling() {
  if (this.pollingInterval) {
    clearInterval(this.pollingInterval);
  }
}
```

---

### 4. Listar Chats do Usuário

**Endpoint:** `GET /chat/user/:userId`  
**Descrição:** Retorna todos os chats de um usuário específico.

**URL Parameters:**

- `userId`: UUID do usuário

**Response (200):**

```json
[
  {
    "id": "uuid-do-chat-1",
    "user1": {
      "id": "uuid-do-usuario-atual",
      "firstName": "João",
      "lastName": "Silva",
      "username": "joao_silva",
      "avatar": "https://exemplo.com/avatar1.jpg"
    },
    "user2": {
      "id": "uuid-do-outro-usuario",
      "firstName": "Maria",
      "lastName": "Santos",
      "username": "maria_santos",
      "avatar": "https://exemplo.com/avatar2.jpg"
    },
    "messages": [
      {
        "id": 125,
        "content": "Última mensagem",
        "isRead": true,
        "createdAt": "2024-12-01T15:52:00Z",
        "sender": {
          "id": "uuid-do-remetente",
          "firstName": "Maria",
          "lastName": "Santos"
        }
      }
    ],
    "createdAt": "2024-12-01T10:00:00Z",
    "updatedAt": "2024-12-01T15:52:00Z"
  }
]
```

**Exemplo Angular/Ionic:**

```typescript
// chat.service.ts
async getUserChats(userId: string) {
  const response = await this.http.get(`${this.baseUrl}/chat/user/${userId}`).toPromise();
  return response as Chat[];
}
```

---

### 5. Marcar Mensagens como Lidas

**Endpoint:** `POST /chat/:chatId/mark-read`  
**Descrição:** Marca todas as mensagens não lidas de um chat como lidas para um usuário específico.

**URL Parameters:**

- `chatId`: UUID do chat

**Request Body:**

```json
{
  "userId": "uuid-do-usuario"
}
```

**Response (200):**

```json
{
  "message": "Mensagens marcadas como lidas"
}
```

**Exemplo Angular/Ionic:**

```typescript
// chat.service.ts
async markMessagesAsRead(chatId: string, userId: string) {
  const response = await this.http.post(`${this.baseUrl}/chat/${chatId}/mark-read`, {
    userId
  }).toPromise();
  return response;
}
```

---

## 🔧 Implementação no Ionic/Angular

### 1. Serviço de Chat (chat.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
}

export interface Chat {
  id: string;
  user1: any;
  user2: any;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private baseUrl = 'https://sua-api.com/chat';
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private pollingInterval: any;

  constructor(private http: HttpClient) {}

  // Criar ou obter chat
  async createOrGetChat(user1Id: string, user2Id: string): Promise<Chat> {
    return this.http
      .post<Chat>(`${this.baseUrl}/create-or-get`, {
        user1Id,
        user2Id,
      })
      .toPromise();
  }

  // Enviar mensagem
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    return this.http
      .post<Message>(`${this.baseUrl}/${chatId}/send`, {
        senderId,
        content,
      })
      .toPromise();
  }

  // Buscar novas mensagens
  async getNewMessages(
    chatId: string,
    lastMessageId?: number,
  ): Promise<Message[]> {
    let url = `${this.baseUrl}/${chatId}/messages`;
    if (lastMessageId) {
      url += `?lastMessageId=${lastMessageId}`;
    }

    return this.http.get<Message[]>(url).toPromise();
  }

  // Listar chats do usuário
  async getUserChats(userId: string): Promise<Chat[]> {
    return this.http.get<Chat[]>(`${this.baseUrl}/user/${userId}`).toPromise();
  }

  // Marcar como lidas
  async markMessagesAsRead(chatId: string, userId: string): Promise<any> {
    return this.http
      .post(`${this.baseUrl}/${chatId}/mark-read`, {
        userId,
      })
      .toPromise();
  }

  // Sistema de Polling
  startPolling(chatId: string, currentMessages: Message[] = []) {
    this.messagesSubject.next(currentMessages);

    this.pollingInterval = setInterval(async () => {
      try {
        const messages = this.messagesSubject.value;
        const lastMessageId =
          messages.length > 0
            ? Math.max(...messages.map((m) => m.id))
            : undefined;

        const newMessages = await this.getNewMessages(chatId, lastMessageId);

        if (newMessages.length > 0) {
          const updatedMessages = [...messages, ...newMessages];
          this.messagesSubject.next(updatedMessages);
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 3000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  getMessages(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }
}
```

### 2. Página de Chat (chat.page.ts)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService, Message, Chat } from '../services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy {
  chatId: string;
  currentUserId: string;
  messages: Message[] = [];
  newMessage: string = '';
  chat: Chat;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
  ) {}

  async ngOnInit() {
    this.chatId = this.route.snapshot.paramMap.get('chatId');
    this.currentUserId = 'seu-user-id-atual'; // Obter do serviço de autenticação

    await this.loadInitialMessages();
    this.startPolling();
  }

  ngOnDestroy() {
    this.chatService.stopPolling();
  }

  async loadInitialMessages() {
    try {
      this.messages = await this.chatService.getNewMessages(this.chatId);

      // Inscrever-se para receber novas mensagens
      this.chatService.getMessages().subscribe((messages) => {
        this.messages = messages;
      });
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }

  startPolling() {
    this.chatService.startPolling(this.chatId, this.messages);
  }

  async sendMessage() {
    if (this.newMessage.trim()) {
      try {
        const message = await this.chatService.sendMessage(
          this.chatId,
          this.currentUserId,
          this.newMessage,
        );

        // Adicionar mensagem enviada à lista local
        this.messages.push(message);
        this.newMessage = '';
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }
  }

  async markAsRead() {
    try {
      await this.chatService.markMessagesAsRead(
        this.chatId,
        this.currentUserId,
      );
    } catch (error) {
      console.error('Erro ao marcar como lidas:', error);
    }
  }
}
```

### 3. Template do Chat (chat.page.html)

```html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/chats"></ion-back-button>
    </ion-buttons>
    <ion-title>Chat</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="markAsRead()">
        <ion-icon name="checkmark-done-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="messages-container">
    <div
      *ngFor="let message of messages"
      class="message"
      [class.own-message]="message.sender.id === currentUserId"
      [class.other-message]="message.sender.id !== currentUserId"
    >
      <div class="message-content">
        <p>{{ message.content }}</p>
        <span class="message-time">
          {{ message.createdAt | date:'short' }}
        </span>
        <ion-icon
          *ngIf="message.sender.id === currentUserId"
          [name]="message.isRead ? 'checkmark-done' : 'checkmark'"
          [color]="message.isRead ? 'primary' : 'medium'"
        ></ion-icon>
      </div>
    </div>
  </div>
</ion-content>

<ion-footer>
  <ion-toolbar>
    <ion-item>
      <ion-input
        [(ngModel)]="newMessage"
        placeholder="Digite sua mensagem..."
        (keydown.enter)="sendMessage()"
      ></ion-input>
      <ion-button
        slot="end"
        fill="clear"
        (click)="sendMessage()"
        [disabled]="!newMessage.trim()"
      >
        <ion-icon name="send"></ion-icon>
      </ion-button>
    </ion-item>
  </ion-toolbar>
</ion-footer>
```

### 4. Lista de Chats (chats.page.ts)

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChatService, Chat } from '../services/chat.service';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
})
export class ChatsPage implements OnInit {
  chats: Chat[] = [];
  currentUserId: string;

  constructor(
    private chatService: ChatService,
    private router: Router,
  ) {}

  async ngOnInit() {
    this.currentUserId = 'seu-user-id-atual'; // Obter do serviço de autenticação
    await this.loadChats();
  }

  async loadChats() {
    try {
      this.chats = await this.chatService.getUserChats(this.currentUserId);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    }
  }

  openChat(chat: Chat) {
    this.router.navigate(['/chat', chat.id]);
  }

  getOtherUser(chat: Chat) {
    return chat.user1.id === this.currentUserId ? chat.user2 : chat.user1;
  }

  getLastMessage(chat: Chat) {
    if (chat.messages && chat.messages.length > 0) {
      return chat.messages[chat.messages.length - 1];
    }
    return null;
  }
}
```

---

## 🎯 Melhores Práticas

### 1. Frequência de Polling

- **Recomendado:** 3-5 segundos
- **Chat ativo:** 2-3 segundos
- **Em background:** 10-15 segundos

### 2. Otimizações

- Pare o polling quando a página não estiver ativa
- Use `lastMessageId` para evitar buscar mensagens duplicadas
- Implemente cache local para mensagens

### 3. Tratamento de Erros

```typescript
try {
  const newMessages = await this.chatService.getNewMessages(
    chatId,
    lastMessageId,
  );
} catch (error) {
  if (error.status === 401) {
    // Token expirado - redirecionar para login
  } else if (error.status === 404) {
    // Chat não encontrado
  } else {
    // Outros erros
  }
}
```

### 4. Performance

- Limite o número de mensagens carregadas inicialmente
- Implemente scroll infinito para histórico antigo
- Use virtual scrolling para listas grandes

---

## 🚀 Estados de Loading e UX

### Loading States

```typescript
// No serviço
isLoading = false;
isSending = false;

async sendMessage(chatId: string, senderId: string, content: string) {
  this.isSending = true;
  try {
    const result = await this.http.post(...).toPromise();
    return result;
  } finally {
    this.isSending = false;
  }
}
```

### Indicadores Visuais

```html
<!-- Indicador de carregamento -->
<ion-spinner *ngIf="isLoading"></ion-spinner>

<!-- Indicador de envio -->
<ion-button [disabled]="isSending">
  <ion-spinner *ngIf="isSending" name="small"></ion-spinner>
  <span *ngIf="!isSending">Enviar</span>
</ion-button>
```

Esta documentação fornece tudo o que você precisa para integrar o sistema de chat polling em sua aplicação Ionic/Angular. 🚀
