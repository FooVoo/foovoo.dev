import * as socketIoAdapter from 'socket.io-adapter';

export interface PeerConnection {
  socketId: string;
  peerId: string;
  roomId: socketIoAdapter.Room | null;
}
