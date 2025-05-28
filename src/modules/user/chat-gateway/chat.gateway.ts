import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageService } from '../services/message.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
//   @WebSocketServer()
//   server: Server;

  constructor(private readonly messageService: MessageService) {}

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    payload: {
      senderId: string;
      receiverId: string;
      content: string;
    },
  ) {
    const message = await this.messageService.createMessage(payload);
    // this.server.emit(`receive_message_${payload.receiverId}`, message);
    // this.server.emit(`receive_message_${payload.senderId}`, message);
    return message;
  }
}
