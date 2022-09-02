import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { Chatting } from './models/chattings.model';
import { Socket as SocketModel } from './models/sockets.model';

@WebSocketGateway({ namespace: 'chattings' })
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectModel(Chatting.name) private readonly chattingModel: Model<Chatting>,
    @InjectModel(SocketModel.name)
    private readonly socketModel: Model<SocketModel>,
  ) {}

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const user = await this.socketModel.findOne({ id: socket.id });
    if (user) {
      socket.broadcast.emit('disconnect_user', user.userName);
      await user.delete();
    }
    this.logger.log(`disconnected::: ${socket.id} ${socket.nsp.name}`);
  }
  private logger = new Logger('chat');

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`connected::: ${socket.id} ${socket.nsp.name}`);
  }

  afterInit() {
    this.logger.log('init');
  }

  @SubscribeMessage('new_user')
  async handleNewUser(
    @MessageBody() userName: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const isExist = await this.socketModel.exists({ userName });
    const name = isExist ? `${userName}_${Date.now()}` : userName;
    await this.socketModel.create({
      id: socket.id,
      userName: name,
    });
    socket.broadcast.emit('user_connected', name);
    return userName;
  }

  @SubscribeMessage('submit_chat')
  async handleSubmitChat(
    @MessageBody() chat: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const socketObj = await this.socketModel.findOne({ id: socket.id });
    await this.chattingModel.create({
      user: socketObj,
      chat,
    });
    socket.broadcast.emit('new_chat', {
      chat,
      userName: socketObj.userName,
    });
  }
}
