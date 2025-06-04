# 📲 Sistema de Notificações - Prompt de Implementação Frontend (Ionic + Angular)

## 🎯 Visão Geral

O sistema de notificações foi completamente implementado no backend da API `superese-api-user`. Este documento fornece um prompt detalhado para implementar os endpoints de notificação no frontend usando **Ionic Framework com Angular**.

## 🔗 Endpoints Disponíveis

### Base URL

```
https://api.superese.com/notifications
```

### 1. **GET /notifications** - Buscar Notificações

```typescript
// Parâmetros de query (todos opcionais)
interface GetNotificationsParams {
  limit?: number; // Padrão: 20, mínimo: 1
  offset?: number; // Padrão: 0, mínimo: 0
  unreadOnly?: boolean; // Padrão: false
}

// Resposta
interface NotificationListResponse {
  notifications: NotificationResponse[];
  stats: NotificationStats;
  hasMore: boolean;
}
```

### 2. **GET /notifications/stats** - Buscar Estatísticas

```typescript
// Resposta
interface NotificationStats {
  totalUnread: number;
  totalNotifications: number;
}
```

### 3. **PATCH /notifications/mark-as-read** - Marcar como Lidas

```typescript
// Body (opcional)
interface MarkAsReadRequest {
  notificationIds?: string[]; // Se vazio, marca todas como lidas
}

// Resposta
interface MarkAsReadResponse {
  updated: number; // Quantidade de notificações atualizadas
}
```

### 4. **PATCH /notifications/mark-all-as-read** - Marcar Todas como Lidas

```typescript
// Sem body

// Resposta
interface MarkAllAsReadResponse {
  updated: number; // Quantidade de notificações atualizadas
}
```

### 5. **DELETE /notifications/:id** - Deletar Notificação

```typescript
// Parâmetros
interface DeleteNotificationParams {
  id: string; // UUID da notificação
}

// Resposta: 204 No Content
```

## 📋 Interfaces TypeScript

```typescript
// Tipos de notificação disponíveis
enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  REPLY = 'reply',
}

// Status da notificação
enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

// Estrutura principal da notificação
interface NotificationResponse {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  createdAt: Date;

  // Dados do usuário que gerou a notificação
  actor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };

  // Dados para redirecionamento
  redirectData?: {
    type: 'post' | 'comment' | 'friendship' | 'profile';
    id: string;
    additionalData?: any;
  };
}
```

## 🛠️ Implementação Sugerida (Ionic + Angular)

### 1. Service Angular

```typescript
// notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = 'https://api.superese.com/notifications';

  // Estado reativo
  private notificationsSubject = new BehaviorSubject<NotificationResponse[]>(
    [],
  );
  private statsSubject = new BehaviorSubject<NotificationStats>({
    totalUnread: 0,
    totalNotifications: 0,
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private hasMoreSubject = new BehaviorSubject<boolean>(false);

  public notifications$ = this.notificationsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public hasMore$ = this.hasMoreSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(
    params?: GetNotificationsParams,
  ): Observable<NotificationListResponse> {
    this.loadingSubject.next(true);

    let httpParams = new HttpParams();
    if (params?.limit)
      httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.offset)
      httpParams = httpParams.set('offset', params.offset.toString());
    if (params?.unreadOnly)
      httpParams = httpParams.set('unreadOnly', params.unreadOnly.toString());

    return this.http
      .get<NotificationListResponse>(`${this.baseUrl}`, { params: httpParams })
      .pipe(
        tap((response) => {
          const currentNotifications = this.notificationsSubject.value;
          const newNotifications = params?.offset
            ? [...currentNotifications, ...response.notifications]
            : response.notifications;

          this.notificationsSubject.next(newNotifications);
          this.statsSubject.next(response.stats);
          this.hasMoreSubject.next(response.hasMore);
          this.loadingSubject.next(false);
        }),
      );
  }

  getStats(): Observable<NotificationStats> {
    return this.http
      .get<NotificationStats>(`${this.baseUrl}/stats`)
      .pipe(tap((stats) => this.statsSubject.next(stats)));
  }

  markAsRead(notificationIds?: string[]): Observable<MarkAsReadResponse> {
    return this.http
      .patch<MarkAsReadResponse>(`${this.baseUrl}/mark-as-read`, {
        notificationIds,
      })
      .pipe(
        tap((result) => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map((n) =>
            !notificationIds || notificationIds.includes(n.id)
              ? { ...n, status: NotificationStatus.READ }
              : n,
          );

          const currentStats = this.statsSubject.value;
          const newStats = {
            ...currentStats,
            totalUnread: Math.max(0, currentStats.totalUnread - result.updated),
          };

          this.notificationsSubject.next(updatedNotifications);
          this.statsSubject.next(newStats);
        }),
      );
  }

  markAllAsRead(): Observable<MarkAllAsReadResponse> {
    return this.http
      .patch<MarkAllAsReadResponse>(`${this.baseUrl}/mark-all-as-read`, {})
      .pipe(
        tap((result) => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map((n) => ({
            ...n,
            status: NotificationStatus.READ,
          }));

          const currentStats = this.statsSubject.value;
          const newStats = { ...currentStats, totalUnread: 0 };

          this.notificationsSubject.next(updatedNotifications);
          this.statsSubject.next(newStats);
        }),
      );
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const deletedNotification = currentNotifications.find(
          (n) => n.id === id,
        );
        const filteredNotifications = currentNotifications.filter(
          (n) => n.id !== id,
        );

        const currentStats = this.statsSubject.value;
        const newStats = {
          totalNotifications: currentStats.totalNotifications - 1,
          totalUnread:
            currentStats.totalUnread -
            (deletedNotification?.status === NotificationStatus.UNREAD ? 1 : 0),
        };

        this.notificationsSubject.next(filteredNotifications);
        this.statsSubject.next(newStats);
      }),
    );
  }

  // Método para polling
  startPolling(interval = 30000) {
    setInterval(() => {
      this.getNotifications({ limit: 20, offset: 0 }).subscribe();
    }, interval);
  }
}
```

### 2. Store/State Management (Optional - NgRx)

```typescript
// notification.state.ts (se usar NgRx)
export interface NotificationState {
  notifications: NotificationResponse[];
  stats: NotificationStats;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

// notification.actions.ts
export const loadNotifications = createAction(
  '[Notification] Load Notifications',
  props<{ params?: GetNotificationsParams }>(),
);

export const markAsRead = createAction(
  '[Notification] Mark As Read',
  props<{ notificationIds?: string[] }>(),
);

// ... outros actions
```

## 📱 Componentes Ionic Sugeridos

### 1. Badge de Notificações (Component)

```typescript
// notification-badge.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-badge',
  template: `
    <ion-button fill="clear" (click)="openNotifications()">
      <ion-icon name="notifications-outline"></ion-icon>
      <ion-badge
        *ngIf="(stats$ | async)?.totalUnread > 0"
        color="danger"
        class="notification-badge"
      >
        {{
          (stats$ | async)?.totalUnread > 99
            ? '99+'
            : (stats$ | async)?.totalUnread
        }}
      </ion-badge>
    </ion-button>
  `,
  styles: [
    `
      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        min-width: 18px;
        height: 18px;
        font-size: 10px;
      }
    `,
  ],
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  stats$ = this.notificationService.stats$;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private modalController: ModalController,
  ) {}

  ngOnInit() {
    // Carregar estatísticas iniciais
    this.notificationService
      .getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openNotifications() {
    const modal = await this.modalController.create({
      component: NotificationListComponent,
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.8,
      backdropDismiss: true,
    });
    return await modal.present();
  }
}
```

### 2. Lista de Notificações (Page/Component)

```typescript
// notification-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  NavController,
  InfiniteScrollCustomEvent,
  RefresherCustomEvent,
} from '@ionic/angular';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-list',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Notificações</ion-title>
        <ion-buttons slot="end">
          <ion-button
            (click)="markAllAsRead()"
            [disabled]="(stats$ | async)?.totalUnread === 0"
          >
            <ion-icon name="checkmark-done-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Lista de notificações -->
      <div *ngIf="notifications$ | async as notifications">
        <app-notification-item
          *ngFor="
            let notification of notifications;
            trackBy: trackByNotification
          "
          [notification]="notification"
          (clicked)="onNotificationClick(notification)"
          (deleted)="onNotificationDelete(notification.id)"
        >
        </app-notification-item>
      </div>

      <!-- Estado vazio -->
      <div *ngIf="(notifications$ | async)?.length === 0" class="empty-state">
        <ion-icon name="notifications-outline" size="large"></ion-icon>
        <h3>Nenhuma notificação</h3>
        <p>Você não tem notificações no momento.</p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading$ | async" class="loading-container">
        <ion-spinner></ion-spinner>
      </div>

      <!-- Infinite scroll -->
      <ion-infinite-scroll
        threshold="100px"
        (ionInfinite)="loadMore($event)"
        [disabled]="!(hasMore$ | async)"
      >
        <ion-infinite-scroll-content></ion-infinite-scroll-content>
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 50vh;
        text-align: center;
        padding: 20px;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 20px;
      }
    `,
  ],
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications$ = this.notificationService.notifications$;
  stats$ = this.notificationService.stats$;
  loading$ = this.notificationService.loading$;
  hasMore$ = this.notificationService.hasMore$;

  private destroy$ = new Subject<void>();
  private currentOffset = 0;

  constructor(
    private notificationService: NotificationService,
    private navController: NavController,
  ) {}

  ngOnInit() {
    this.loadInitialNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInitialNotifications() {
    this.currentOffset = 0;
    this.notificationService
      .getNotifications({ limit: 20, offset: 0 })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  doRefresh(event: RefresherCustomEvent) {
    this.loadInitialNotifications();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  loadMore(event: InfiniteScrollCustomEvent) {
    this.currentOffset += 20;
    this.notificationService
      .getNotifications({
        limit: 20,
        offset: this.currentOffset,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        event.target.complete();
      });
  }

  trackByNotification(
    index: number,
    notification: NotificationResponse,
  ): string {
    return notification.id;
  }

  onNotificationClick(notification: NotificationResponse) {
    // Marcar como lida se não estiver
    if (notification.status === NotificationStatus.UNREAD) {
      this.notificationService
        .markAsRead([notification.id])
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }

    // Navegar baseado no redirectData
    if (notification.redirectData) {
      this.navigateToNotificationSource(notification.redirectData);
    }
  }

  private navigateToNotificationSource(redirectData: any) {
    switch (redirectData.type) {
      case 'post':
        this.navController.navigateForward(`/posts/${redirectData.id}`);
        break;
      case 'comment':
        this.navController.navigateForward(
          `/posts/${redirectData.additionalData?.postId}`,
          { fragment: `comment-${redirectData.id}` },
        );
        break;
      case 'friendship':
        this.navController.navigateForward('/friends');
        break;
      case 'profile':
        this.navController.navigateForward(`/profile/${redirectData.id}`);
        break;
    }
  }

  onNotificationDelete(notificationId: string) {
    this.notificationService
      .deleteNotification(notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  markAllAsRead() {
    this.notificationService
      .markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
}
```

### 3. Item de Notificação (Component)

```typescript
// notification-item.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Component({
  selector: 'app-notification-item',
  template: `
    <ion-item
      button
      [class.unread]="notification.status === 'unread'"
      (click)="clicked.emit()"
    >
      <!-- Avatar do ator -->
      <ion-avatar slot="start">
        <img
          [src]="notification.actor.avatar || '/assets/default-avatar.png'"
          [alt]="notification.actor.username"
        />
      </ion-avatar>

      <!-- Conteúdo -->
      <ion-label>
        <div class="notification-content">
          <!-- Ícone do tipo -->
          <ion-icon
            [name]="getNotificationIcon()"
            [color]="getNotificationColor()"
            class="notification-type-icon"
          >
          </ion-icon>

          <!-- Mensagem -->
          <p class="notification-message">{{ notification.message }}</p>
        </div>

        <!-- Data -->
        <p class="notification-time">
          {{ formatTime(notification.createdAt) }}
        </p>
      </ion-label>

      <!-- Status e ações -->
      <div slot="end" class="notification-actions">
        <!-- Indicador de não lida -->
        <div
          *ngIf="notification.status === 'unread'"
          class="unread-indicator"
        ></div>

        <!-- Botão de opções -->
        <ion-button fill="clear" size="small" (click)="openActionSheet($event)">
          <ion-icon name="ellipsis-vertical"></ion-icon>
        </ion-button>
      </div>
    </ion-item>
  `,
  styles: [
    `
      .unread {
        --background: rgba(var(--ion-color-primary-rgb), 0.05);
      }

      .notification-content {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 4px;
      }

      .notification-type-icon {
        font-size: 16px;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .notification-message {
        font-size: 14px;
        line-height: 1.4;
        margin: 0;
      }

      .notification-time {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0;
      }

      .notification-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .unread-indicator {
        width: 8px;
        height: 8px;
        background: var(--ion-color-primary);
        border-radius: 50%;
      }
    `,
  ],
})
export class NotificationItemComponent {
  @Input() notification!: NotificationResponse;
  @Output() clicked = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  constructor(private actionSheetController: ActionSheetController) {}

  getNotificationIcon(): string {
    switch (this.notification.type) {
      case NotificationType.LIKE:
        return 'heart';
      case NotificationType.COMMENT:
      case NotificationType.REPLY:
        return 'chatbubble';
      case NotificationType.FRIEND_REQUEST:
        return 'person-add';
      case NotificationType.FRIEND_ACCEPTED:
        return 'people';
      default:
        return 'notifications';
    }
  }

  getNotificationColor(): string {
    switch (this.notification.type) {
      case NotificationType.LIKE:
        return 'danger';
      case NotificationType.COMMENT:
      case NotificationType.REPLY:
        return 'primary';
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.FRIEND_ACCEPTED:
        return 'success';
      default:
        return 'medium';
    }
  }

  formatTime(date: Date): string {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  }

  async openActionSheet(event: Event) {
    event.stopPropagation();

    const actionSheet = await this.actionSheetController.create({
      header: 'Opções da Notificação',
      buttons: [
        {
          text: 'Deletar',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.deleted.emit();
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }
}
```

## 🔄 Polling e Atualizações em Tempo Real

### Polling com RxJS

```typescript
// notification-polling.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationPollingService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private polling$ = interval(30000); // 30 segundos

  constructor(private notificationService: NotificationService) {}

  startPolling() {
    this.polling$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.notificationService.getNotifications({ limit: 20, offset: 0 }),
        ),
      )
      .subscribe();
  }

  stopPolling() {
    this.destroy$.next();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroy$.complete();
  }
}
```

### WebSocket Service (Futuro)

```typescript
// notification-websocket.service.ts
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationWebSocketService {
  private socket$: WebSocketSubject<any>;
  private messagesSubject$ = new Subject();
  public messages$ = this.messagesSubject$.asObservable();

  constructor(private notificationService: NotificationService) {
    this.socket$ = webSocket('wss://api.superese.com/notifications/ws');
  }

  public connect(): void {
    this.socket$
      .pipe(
        retry({ delay: 5000 }),
        catchError((error) => {
          console.error('WebSocket error:', error);
          throw error;
        }),
      )
      .subscribe((message) => {
        // Nova notificação recebida via WebSocket
        console.log('Nova notificação:', message);
        this.messagesSubject$.next(message);

        // Recarregar notificações
        this.notificationService
          .getNotifications({ limit: 20, offset: 0 })
          .subscribe();
      });
  }

  public disconnect(): void {
    this.socket$.complete();
  }

  public sendMessage(msg: any): void {
    this.socket$.next(msg);
  }
}
```

## 🎨 Estilos e UX Ionic

### Tema e Variáveis CSS

```scss
// variables.scss
:root {
  --notification-unread-bg: rgba(var(--ion-color-primary-rgb), 0.05);
  --notification-border: var(--ion-color-light-shade);
  --notification-time-color: var(--ion-color-medium);
}
```

### Estados de Loading

```typescript
// Loading components usando Ionic
// Skeleton para lista de notificações
@Component({
  template: `
    <ion-list>
      <ion-item *ngFor="let item of skeletonItems">
        <ion-avatar slot="start">
          <ion-skeleton-text animated></ion-skeleton-text>
        </ion-avatar>
        <ion-label>
          <h3>
            <ion-skeleton-text animated style="width: 80%"></ion-skeleton-text>
          </h3>
          <p>
            <ion-skeleton-text animated style="width: 60%"></ion-skeleton-text>
          </p>
          <p>
            <ion-skeleton-text animated style="width: 30%"></ion-skeleton-text>
          </p>
        </ion-label>
      </ion-item>
    </ion-list>
  `,
})
export class NotificationSkeletonComponent {
  skeletonItems = Array(5).fill(0);
}
```

### Feedback Visual

```typescript
// Toast service para feedback
import { ToastController } from '@ionic/angular';

@Injectable()
export class NotificationFeedbackService {
  constructor(private toastController: ToastController) {}

  async showMarkAsReadSuccess(count: number) {
    const toast = await this.toastController.create({
      message: `${count} notificação${count > 1 ? 'ões' : ''} marcada${count > 1 ? 's' : ''} como lida${count > 1 ? 's' : ''}`,
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    toast.present();
  }

  async showDeleteSuccess() {
    const toast = await this.toastController.create({
      message: 'Notificação deletada',
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    toast.present();
  }
}
```

### Responsividade Ionic

```typescript
// Adaptação para diferentes tamanhos de tela
@Component({
  template: `
    <!-- Desktop: Modal -->
    <ion-modal
      *ngIf="!isMobile"
      [isOpen]="isOpen"
      class="notification-modal-desktop"
    >
      <ng-template>
        <app-notification-list></app-notification-list>
      </ng-template>
    </ion-modal>

    <!-- Mobile: Full screen -->
    <ion-modal
      *ngIf="isMobile"
      [isOpen]="isOpen"
      [presentingElement]="presentingElement"
    >
      <ng-template>
        <app-notification-list></app-notification-list>
      </ng-template>
    </ion-modal>

    <!-- Tablet: Popover -->
    <ion-popover *ngIf="isTablet" [isOpen]="isOpen" [event]="popoverEvent">
      <ng-template>
        <app-notification-list></app-notification-list>
      </ng-template>
    </ion-popover>
  `,
})
export class NotificationModalComponent {
  @Input() isOpen = false;
  isMobile = this.platform.is('mobile');
  isTablet = this.platform.is('tablet');

  constructor(private platform: Platform) {}
}
```

## 🔐 Autenticação

Todos os endpoints requerem autenticação via Bearer Token no header:

```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.getToken();

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
```

## 📦 Módulo Angular

```typescript
// notification.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { NotificationService } from './services/notification.service';
import { NotificationPollingService } from './services/notification-polling.service';
import { NotificationWebSocketService } from './services/notification-websocket.service';
import { NotificationFeedbackService } from './services/notification-feedback.service';

import { NotificationBadgeComponent } from './components/notification-badge.component';
import { NotificationListComponent } from './components/notification-list.component';
import { NotificationItemComponent } from './components/notification-item.component';
import { NotificationSkeletonComponent } from './components/notification-skeleton.component';
import { NotificationModalComponent } from './components/notification-modal.component';

@NgModule({
  declarations: [
    NotificationBadgeComponent,
    NotificationListComponent,
    NotificationItemComponent,
    NotificationSkeletonComponent,
    NotificationModalComponent,
  ],
  imports: [CommonModule, IonicModule, HttpClientModule],
  providers: [
    NotificationService,
    NotificationPollingService,
    NotificationWebSocketService,
    NotificationFeedbackService,
  ],
  exports: [
    NotificationBadgeComponent,
    NotificationListComponent,
    NotificationModalComponent,
  ],
})
export class NotificationModule {}
```

## 🛣️ Roteamento

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'notifications',
    loadChildren: () =>
      import('./notification/notification.module').then(
        (m) => m.NotificationModule,
      ),
  },
  // ... outras rotas
];
```

## 🚀 Próximos Passos

1. **Implementar os serviços** seguindo as interfaces fornecidas
2. **Criar o módulo de notificações** com todos os componentes
3. **Configurar interceptors** para autenticação automática
4. **Implementar componentes Ionic** com design responsivo
5. **Adicionar polling service** para atualizações periódicas
6. **Configurar roteamento** e navegação
7. **Implementar testes** unitários e e2e com Jasmine/Karma
8. **Otimizar performance** com OnPush change detection
9. **Adicionar PWA** para notificações push
10. **Implementar WebSocket** para notificações em tempo real (futuro)

## 📱 Comandos Ionic CLI

```bash
# Gerar serviço
ionic generate service notification/services/notification

# Gerar componentes
ionic generate component notification/components/notification-badge
ionic generate component notification/components/notification-list
ionic generate component notification/components/notification-item

# Gerar página
ionic generate page notification/pages/notification-list

# Gerar módulo
ionic generate module notification

# Build e servir
ionic serve
ionic build
```

## 📝 Notas Importantes

- **Paginação**: Use `offset` e `limit` para carregar notificações em lotes com Ionic Virtual Scroll
- **Estado reativo**: Use RxJS Observables para estado reativo e real-time updates
- **Redirecionamento**: Use NavController para navegação entre páginas
- **Performance**: Use OnPush change detection e trackBy functions
- **UX Ionic**: Aproveite componentes nativos como ion-refresher, ion-infinite-scroll
- **Capacitor**: Prepare para notificações push nativas com Capacitor Push Notifications
- **PWA**: Configure Service Worker para notificações web push

## 🔧 Instalação de Dependências

```bash
# Dependências principais
npm install @angular/common @angular/core @ionic/angular
npm install rxjs date-fns

# Para autenticação Firebase
npm install @angular/fire firebase

# Para testes
npm install --save-dev @angular/testing jasmine karma

# Para PWA (opcional)
npm install @angular/pwa

# Para Capacitor (mobile)
npm install @capacitor/core @capacitor/push-notifications
```

---

**Exemplo de uso completo disponível em**: `FRONTEND_NOTIFICATION_IMPLEMENTATION_GUIDE.md`
