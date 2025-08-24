import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export class P2pServerAdapter {
  @WebSocketServer()
  server: Server;

  constructor() {}
}
