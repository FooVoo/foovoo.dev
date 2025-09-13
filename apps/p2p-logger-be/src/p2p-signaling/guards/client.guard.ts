import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export class ClientGuard {
  public static isClientInRoom(client: Socket): boolean {
    if (client.rooms.size === 0) {
      client.emit('error', { message: 'Peer not in a room' });
      Logger.error(`Peer not in room: ${client.id}`);
      return false;
    }
    return true;
  }

  public static isClientInSpecifiedRoom(
    client: Socket,
    roomId: string,
  ): boolean {
    if (!client.rooms.has(roomId)) {
      client.emit('error', { message: 'Peer not in the specified room' });
      Logger.error(`Peer:${client.id} not in the specified room:${roomId}`);
      return false;
    }
    return true;
  }
}
