import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import * as interfaces from './interfaces';
import { P2pServerAdapter } from './p2p-server.adapter';

@Injectable()
@WebSocketGateway(80, {
  cors: {
    origin: '*',
    methods: ['GET', 'PUT', 'POST'],
  },
  namespace: '/p2p',
})
export class P2pService implements OnGatewayConnection, OnGatewayDisconnect {
  peers: Map<string, interfaces.PeerConnection> = new Map();
  rooms: Map<string, Set<string>> = new Map();

  constructor(private serverAdapter: P2pServerAdapter) {}

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removePeer(client.id);
  }

  joinRoom(socketId: string, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socketId);
  }

  leaveRoom(socketId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  private findSocketByPeerId(peerId: string): string | null {
    for (const [socketId, peer] of this.peers.entries()) {
      if (peer.peerId === peerId) {
        return socketId;
      }
    }
    return null;
  }

  getRoomPeers(roomId: string, excludeSocketId: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const peers: string[] = [];
    room.forEach((socketId) => {
      if (socketId !== excludeSocketId) {
        const peer = this.peers.get(socketId);
        if (peer) {
          peers.push(peer.peerId);
        }
      }
    });

    return peers;
  }

  removePeer(socketId: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      if (peer.roomId) {
        this.leaveRoom(socketId, peer.roomId);
      }
      this.peers.delete(socketId);
    }
  }

  getConnectedPeers(): interfaces.PeerConnection[] {
    return Array.from(this.peers.values());
  }

  getRoomInfo(
    roomId: string,
  ): { roomId: string; peerCount: number; peers: string[] } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const peers = this.getRoomPeers(roomId, '');
    return {
      roomId,
      peerCount: room.size,
      peers,
    };
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  public broadcastToRoom(
    roomId: string,
    message: { type: string; data: unknown },
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    room.forEach((socketId) => {
      this.serverAdapter.server.to(socketId).emit(message.type, message);
    });
  }
}
