import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../services/message.service';

@WebSocketGateway({
  cors: true,
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join_user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    this.connectedUsers.set(payload.userId, client.id);
    client.join(`user_${payload.userId}`);
    console.log(`Usuário ${payload.userId} entrou na sala`);

    // Notificar outros usuários que este usuário está online
    client.broadcast.emit('user_online', { userId: payload.userId });
  }

  @SubscribeMessage('leave_user')
  handleLeaveUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ) {
    this.connectedUsers.delete(payload.userId);
    client.leave(`user_${payload.userId}`);

    // Notificar outros usuários que este usuário está offline
    client.broadcast.emit('user_offline', { userId: payload.userId });
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      senderId: string;
      receiverId: string;
      content: string;
    },
  ) {
    try {
      const message = await this.messageService.createMessage(payload);

      // Enviar mensagem para o receptor
      this.server.to(`user_${payload.receiverId}`).emit('receive_message', {
        id: message.id,
        content: message.content,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          username: message.sender.username,
          avatar: message.sender.avatar,
        },
      });

      // Confirmar para o remetente
      client.emit('message_sent', {
        id: message.id,
        content: message.content,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        createdAt: message.createdAt,
      });

      return { success: true, message };
    } catch (error) {
      client.emit('error', { message: 'Erro ao enviar mensagem' });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { senderId: string; receiverId: string; isTyping: boolean },
  ) {
    this.server.to(`user_${payload.receiverId}`).emit('user_typing', {
      userId: payload.senderId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId: string; receiverId: string },
  ) {
    try {
      await this.messageService.markMessagesAsRead(
        payload.senderId,
        payload.receiverId,
      );

      // Notificar o remetente que as mensagens foram lidas
      this.server.to(`user_${payload.senderId}`).emit('messages_read', {
        userId: payload.receiverId,
      });
    } catch {
      client.emit('error', { message: 'Erro ao marcar mensagens como lidas' });
    }
  }
}
