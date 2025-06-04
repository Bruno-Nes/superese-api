# Chat em Tempo Real - Guia de Implementação Frontend (Ionic + Angular)

## 1. Configuração do Socket.io no Frontend

### Instalação

```bash
npm install socket.io-client
npm install @types/socket.io-client --save-dev
```

### Service de Socket.io

````typescript
// chat-socket.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Conversation {
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {
  private socket: Socket;
  private connected = new BehaviorSubject<boolean>(false);
  private messages = new BehaviorSubject<Message[]>([]);
  private typing = new BehaviorSubject<{userId: string, isTyping: boolean}[]>([]);

  public connected$ = this.connected.asObservable();
  public messages$ = this.messages.asObservable();
  public typing$ = this.typing.asObservable();

  constructor() {
    this.socket = io('http://localhost:3000/chat', {
      transports: ['websocket'],
      autoConnect: false
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.connected.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.connected.next(false);
    });

    this.socket.on('receive_message', (message: Message) => {
      const currentMessages = this.messages.value;
      this.messages.next([...currentMessages, message]);
    });

    this.socket.on('message_sent', (message: Message) => {
      const currentMessages = this.messages.value;
      this.messages.next([...currentMessages, message]);
    });

    this.socket.on('user_typing', (data: {userId: string, isTyping: boolean}) => {
      const currentTyping = this.typing.value;
      const existingIndex = currentTyping.findIndex(t => t.userId === data.userId);

      if (existingIndex !== -1) {
        currentTyping[existingIndex] = data;
      } else {
        currentTyping.push(data);
      }

      this.typing.next([...currentTyping]);
    });

    this.socket.on('messages_read', (data: any) => {
      console.log('Messages marked as read:', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  connect(userId: string) {
    this.socket.connect();
    this.socket.emit('join_user', { userId });
  }

  disconnect() {
    this.socket.disconnect();
  }

  sendMessage(senderId: string, receiverId: string, content: string) {
    this.socket.emit('send_message', {
      senderId,
      receiverId,
      content
    });
  }

  sendTyping(senderId: string, receiverId: string, isTyping: boolean) {
    this.socket.emit('typing', {
      senderId,
      receiverId,
      isTyping
    });
  }

  markAsRead(senderId: string, receiverId: string) {
    this.socket.emit('mark_as_read', {
      senderId,
      receiverId
    });
  }

  clearMessages() {
    this.messages.next([]);
  }
}

## 2. Implementação do Chat

### Chat Service

```typescript
// chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ChatSocketService, Message, Conversation } from './chat-socket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: ChatSocketService
  ) {
    this.socketService.messages$.subscribe(messages => {
      this.messagesSubject.next(messages);
    });
  }

  getConversations(userId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`/api/messages/conversations/${userId}`);
  }

  getMessagesBetweenUsers(user1Id: string, user2Id: string): Observable<Message[]> {
    return this.http.get<Message[]>(`/api/messages/between?user1=${user1Id}&user2=${user2Id}`);
  }

  loadMessages(user1Id: string, user2Id: string) {
    this.getMessagesBetweenUsers(user1Id, user2Id).subscribe(messages => {
      this.messagesSubject.next(messages);
    });
  }
}
````

### Chat Component (Ionic + Angular)

```typescript
// chat.component.ts
import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { ChatSocketService, Message } from '../services/chat-socket.service';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() currentUserId!: string;
  @Input() recipientId!: string;
  @ViewChild(IonContent) content!: IonContent;

  messages: Message[] = [];
  newMessage = '';
  isTyping = false;
  otherUserTyping = false;
  isConnected = false;

  private destroy$ = new Subject<void>();
  private typingTimeout: any;

  constructor(
    private chatSocketService: ChatSocketService,
    private chatService: ChatService,
  ) {}

  ngOnInit() {
    this.setupSocketConnection();
    this.loadInitialMessages();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatSocketService.disconnect();
  }

  private setupSocketConnection() {
    // Connect to socket
    this.chatSocketService.connect(this.currentUserId);

    // Subscribe to connection status
    this.chatSocketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((connected) => {
        this.isConnected = connected;
      });

    // Subscribe to messages
    this.chatSocketService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages) => {
        this.messages = messages;
        this.scrollToBottom();
      });

    // Subscribe to typing indicator
    this.chatSocketService.typing$
      .pipe(takeUntil(this.destroy$))
      .subscribe((typingUsers) => {
        const recipientTyping = typingUsers.find(
          (t) => t.userId === this.recipientId,
        );
        this.otherUserTyping = recipientTyping?.isTyping || false;
      });
  }

  private loadInitialMessages() {
    this.chatService.loadMessages(this.currentUserId, this.recipientId);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatSocketService.sendMessage(
        this.currentUserId,
        this.recipientId,
        this.newMessage.trim(),
      );
      this.newMessage = '';
    }
  }

  onInputChange() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatSocketService.sendTyping(
        this.currentUserId,
        this.recipientId,
        true,
      );
    }

    // Clear existing timeout
    clearTimeout(this.typingTimeout);

    // Set new timeout
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      this.chatSocketService.sendTyping(
        this.currentUserId,
        this.recipientId,
        false,
      );
    }, 3000);
  }

  markAsRead() {
    this.chatSocketService.markAsRead(this.recipientId, this.currentUserId);
  }

  private scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom(300);
    }, 100);
  }

  isMessageFromCurrentUser(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }
}
```

### Chat Template (Ionic)

```html
<!-- chat.component.html -->
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button></ion-back-button>
    </ion-buttons>
    <ion-title>Chat</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="markAsRead()">
        <ion-icon name="checkmark-done"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content #content class="chat-content">
  <!-- Connection Status -->
  <ion-item *ngIf="!isConnected" color="warning">
    <ion-icon name="wifi-off" slot="start"></ion-icon>
    <ion-label>Reconectando...</ion-label>
  </ion-item>

  <!-- Messages List -->
  <div class="messages-container">
    <div
      *ngFor="let message of messages; trackBy: trackByMessageId"
      class="message-wrapper"
      [ngClass]="{
        'message-sent': isMessageFromCurrentUser(message),
        'message-received': !isMessageFromCurrentUser(message)
      }"
    >
      <div class="message-bubble">
        <p class="message-content">{{ message.content }}</p>
        <span class="message-time">
          {{ message.createdAt | date:'short' }}
        </span>
      </div>
    </div>

    <!-- Typing Indicator -->
    <div *ngIf="otherUserTyping" class="typing-indicator">
      <ion-chip color="medium">
        <ion-icon name="ellipsis-horizontal"></ion-icon>
        <ion-label>Digitando...</ion-label>
      </ion-chip>
    </div>
  </div>
</ion-content>

<ion-footer>
  <ion-toolbar>
    <ion-item lines="none">
      <ion-input
        [(ngModel)]="newMessage"
        (ionInput)="onInputChange()"
        (keydown.enter)="sendMessage()"
        placeholder="Digite sua mensagem..."
        expand="block"
      ></ion-input>
      <ion-button
        (click)="sendMessage()"
        [disabled]="!newMessage.trim() || !isConnected"
        slot="end"
        fill="clear"
      >
        <ion-icon name="send"></ion-icon>
      </ion-button>
    </ion-item>
  </ion-toolbar>
</ion-footer>
```

### TrackBy Function

```typescript
// Adicionar ao ChatComponent
trackByMessageId(index: number, message: Message): string {
  return message.id;
}
```

## 3. API REST Service (Angular)

### Chat HTTP Service

```typescript
// chat-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Conversation, Message } from './chat-socket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private apiUrl = '/api/messages';

  constructor(private http: HttpClient) {}

  getConversations(userId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${this.apiUrl}/conversations/${userId}`,
    );
  }

  getMessagesBetweenUsers(
    user1Id: string,
    user2Id: string,
  ): Observable<Message[]> {
    const params = new HttpParams().set('user1', user1Id).set('user2', user2Id);

    return this.http.get<Message[]>(`${this.apiUrl}/between`, { params });
  }
}
```

## 4. Componente de Lista de Conversas (Ionic + Angular)

### Conversations List Component

```typescript
// conversations-list.component.ts
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatApiService } from '../services/chat-api.service';
import { Conversation } from '../services/chat-socket.service';

@Component({
  selector: 'app-conversations-list',
  templateUrl: './conversations-list.component.html',
  styleUrls: ['./conversations-list.component.scss'],
})
export class ConversationsListComponent implements OnInit {
  @Input() currentUserId!: string;
  @Output() conversationSelected = new EventEmitter<any>();

  conversations$!: Observable<Conversation[]>;

  constructor(private chatApiService: ChatApiService) {}

  ngOnInit() {
    this.loadConversations();
  }

  loadConversations() {
    this.conversations$ = this.chatApiService.getConversations(
      this.currentUserId,
    );
  }

  onSelectConversation(conversation: Conversation) {
    this.conversationSelected.emit(conversation.otherUser);
  }

  doRefresh(event: any) {
    this.loadConversations();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
```

### Conversations List Template

```html
<!-- conversations-list.component.html -->
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title>Conversas</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="loadConversations()">
        <ion-icon name="refresh"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <!-- Pull to Refresh -->
  <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
    <ion-refresher-content
      pullingIcon="chevron-down-circle-outline"
      pullingText="Puxe para atualizar"
      refreshingSpinner="circles"
      refreshingText="Atualizando..."
    >
    </ion-refresher-content>
  </ion-refresher>

  <!-- Conversations List -->
  <ion-list>
    <ion-item
      *ngFor="let conversation of conversations$ | async; trackBy: trackByUserId"
      button="true"
      (click)="onSelectConversation(conversation)"
    >
      <!-- Avatar -->
      <ion-avatar slot="start">
        <img
          [src]="conversation.otherUser.avatar || 'assets/avatar-placeholder.png'"
          [alt]="conversation.otherUser.firstName + ' ' + conversation.otherUser.lastName"
        />
      </ion-avatar>

      <!-- Conversation Info -->
      <ion-label>
        <h2>
          {{ conversation.otherUser.firstName }} {{
          conversation.otherUser.lastName }}
          <ion-text color="medium"
            >@{{ conversation.otherUser.username }}</ion-text
          >
        </h2>
        <p class="last-message">{{ conversation.lastMessage.content }}</p>
        <ion-note color="medium">
          {{ conversation.lastMessage.createdAt | date:'short' }}
        </ion-note>
      </ion-label>

      <!-- Unread Count Badge -->
      <ion-badge *ngIf="conversation.unreadCount > 0" color="danger" slot="end">
        {{ conversation.unreadCount }}
      </ion-badge>

      <!-- Chevron -->
      <ion-icon
        name="chevron-forward"
        slot="end"
        *ngIf="conversation.unreadCount === 0"
      ></ion-icon>
    </ion-item>
  </ion-list>

  <!-- Empty State -->
  <div *ngIf="(conversations$ | async)?.length === 0" class="empty-state">
    <ion-icon name="chatbubbles-outline" size="large"></ion-icon>
    <h3>Nenhuma conversa</h3>
    <p>Comece uma nova conversa!</p>
  </div>
</ion-content>
```

### TrackBy Function

```typescript
// Adicionar ao ConversationsListComponent
trackByUserId(index: number, conversation: Conversation): string {
  return conversation.otherUser.id;
}
```

## 5. Styling com Ionic (SCSS)

### Chat Component Styles

```scss
// chat.component.scss
.chat-content {
  --background: #f5f5f5;
}

.messages-container {
  padding: 16px;
  min-height: 100%;
}

.message-wrapper {
  display: flex;
  margin-bottom: 16px;

  &.message-sent {
    justify-content: flex-end;

    .message-bubble {
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      margin-left: 20%;
    }
  }

  &.message-received {
    justify-content: flex-start;

    .message-bubble {
      background: var(--ion-color-light);
      color: var(--ion-color-dark);
      margin-right: 20%;
    }
  }
}

.message-bubble {
  border-radius: 18px;
  padding: 12px 16px;
  max-width: 80%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .message-content {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
  }

  .message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
    display: block;
  }
}

.typing-indicator {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;

  ion-chip {
    --background: var(--ion-color-medium);
    --color: var(--ion-color-medium-contrast);
  }
}

ion-footer {
  ion-toolbar {
    --background: var(--ion-color-light);
    --border-color: var(--ion-color-medium);
  }

  ion-item {
    --background: transparent;
    --inner-padding-end: 8px;
  }

  ion-input {
    --background: var(--ion-color-light-shade);
    --padding-start: 16px;
    --padding-end: 16px;
    border-radius: 20px;
  }

  ion-button {
    --color: var(--ion-color-primary);
    margin-left: 8px;
  }
}
```

### Conversations List Styles

```scss
// conversations-list.component.scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  height: 50vh;
  text-align: center;

  ion-icon {
    color: var(--ion-color-medium);
    margin-bottom: 16px;
  }

  h3 {
    color: var(--ion-color-dark);
    margin: 8px 0;
  }

  p {
    color: var(--ion-color-medium);
    margin: 0;
  }
}

ion-item {
  .last-message {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  ion-badge {
    font-size: 12px;
    min-width: 20px;
    height: 20px;
  }
}

ion-avatar img {
  object-fit: cover;
}
```

### Global Chat Styles (Variables)

```scss
// Add to global.scss or variables.scss
:root {
  --chat-primary-color: #007bff;
  --chat-secondary-color: #6c757d;
  --chat-success-color: #28a745;
  --chat-danger-color: #dc3545;
  --chat-warning-color: #ffc107;
  --chat-info-color: #17a2b8;
  --chat-light-color: #f8f9fa;
  --chat-dark-color: #343a40;

  --chat-message-radius: 18px;
  --chat-input-radius: 20px;
  --chat-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## 6. Configuração do Módulo Angular

### Chat Module

```typescript
// chat.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { ChatComponent } from './components/chat/chat.component';
import { ConversationsListComponent } from './components/conversations-list/conversations-list.component';
import { ChatSocketService } from './services/chat-socket.service';
import { ChatService } from './services/chat.service';
import { ChatApiService } from './services/chat-api.service';

@NgModule({
  declarations: [ChatComponent, ConversationsListComponent],
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule],
  providers: [ChatSocketService, ChatService, ChatApiService],
  exports: [ChatComponent, ConversationsListComponent],
})
export class ChatModule {}
```

### App Module Integration

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ChatModule } from './modules/chat/chat.module';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ChatModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### Authentication Interceptor

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('authToken');

    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
```

## 7. Exemplo de Uso em uma Page

### Chat Page

```typescript
// chat.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  currentUserId = ''; // Obter do serviço de autenticação
  recipientId = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.recipientId = this.route.snapshot.paramMap.get('recipientId') || '';
    // Obter currentUserId do serviço de autenticação
    this.currentUserId = this.getCurrentUserId();
  }

  private getCurrentUserId(): string {
    // Implementar lógica para obter o ID do usuário atual
    return localStorage.getItem('userId') || '';
  }
}
```

### Chat Page Template

```html
<!-- chat.page.html -->
<app-chat [currentUserId]="currentUserId" [recipientId]="recipientId">
</app-chat>
```

### Conversations Page

```typescript
// conversations.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-conversations-page',
  templateUrl: './conversations.page.html',
  styleUrls: ['./conversations.page.scss'],
})
export class ConversationsPage implements OnInit {
  currentUserId = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.currentUserId = this.getCurrentUserId();
  }

  onConversationSelected(otherUser: any) {
    this.router.navigate(['/chat', otherUser.id]);
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || '';
  }
}
```

### Conversations Page Template

```html
<!-- conversations.page.html -->
<app-conversations-list
  [currentUserId]="currentUserId"
  (conversationSelected)="onConversationSelected($event)"
>
</app-conversations-list>
```

## 8. Eventos do Socket Disponíveis

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
