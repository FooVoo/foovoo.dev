import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { P2pService } from './p2p.service';
import * as interfaces from './interfaces';
import { P2pServerAdapter } from './p2p-server.adapter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/p2p',
})
export class P2pGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly p2pService: P2pService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.p2pService.removePeer(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('data') data: { roomId: string; peerId: string },
  ) {
    const { roomId, peerId } = data;

    // Join socket room
    client.join(roomId);

    // Register peer in service
    this.p2pService.joinRoom(peerId, roomId);

    // Notify other peers in the room
    client.to(roomId).emit('peer-joined', { peerId, socketId: client.id });

    console.log(`Peer joined room: ${peerId} in ${roomId}`);

    return { success: true, roomId, peerId };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; peerId: string },
  ) {
    const { roomId, peerId } = data;

    client.leave(roomId);
    this.p2pService.removePeer(peerId);

    // Notify other peers
    client.to(roomId).emit('peer-left', { peerId, socketId: client.id });
    console.log('Peer left room:', peerId, roomId);

    return { success: true };
  }

  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      type: 'offer' | 'answer' | 'ice-candidate';
      data: any;
      targetId?: string;
      roomId: string;
    },
  ) {
    const { roomId, targetId, ...signalData } = data;

    if (targetId) {
      // Send to specific peer
      client.to(targetId).emit('signal', {
        ...signalData,
        fromId: client.id,
      });
    } else {
      // Broadcast to room
      client.to(roomId).emit('signal', {
        ...signalData,
        fromId: client.id,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody('data') data: { peerId: string; roomId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const peerConnection: interfaces.PeerConnection = {
      socketId: client.id,
      peerId: data.peerId,
      roomId: data.roomId,
    };

    this.p2pService.peers.set(client.id, peerConnection);

    // if (data.roomId) {
    //   this.p2pService.joinRoom(client.id, data.roomId);
    // }

    client.emit('registered', { success: true, peerId: data.peerId });
    console.log(`Peer registered: ${data.peerId}`);
    return { success: true };
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody('data') message: interfaces.SignalingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const peer = this.p2pService.peers.get(client.id);

    if (!peer) {
      client.emit('error', { message: 'Peer not registered' });
      return;
    }

    message.fromId = peer.peerId;

    client.in(peer.roomId!).emit('offer', message);
    console.log('Peer offer:', peer.peerId);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody('data') message: interfaces.SignalingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const peer = this.p2pService.peers.get(client.id);
    if (!peer) {
      client.emit('error', { message: 'Peer not registered' });
      return;
    }

    message.fromId = peer.peerId;

    client.in(peer.roomId!).emit('answer', message);
    console.log('Peer answer:', peer.peerId);
    return { success: true };
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody('data') message: interfaces.SignalingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const peer = this.p2pService.peers.get(client.id);
    if (!peer) {
      client.emit('error', { message: 'Peer not registered' });
      return;
    }

    message.fromId = peer.peerId;
    client.in(peer.roomId!).emit('ice-candidate', message);
    console.log('Peer ICE candidate:', peer.peerId);
    return { success: true };
  }

  @SubscribeMessage('get-room-peers')
  handleGetRoomPeers(
    @MessageBody('data') data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomPeers = this.p2pService.getRoomPeers(data.roomId, client.id);
    client.emit('room-peers', { peers: roomPeers });
  }
}
