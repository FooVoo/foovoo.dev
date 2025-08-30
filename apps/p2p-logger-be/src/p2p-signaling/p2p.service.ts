import { Injectable } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as interfaces from './interfaces';

@Injectable()
@WebSocketGateway(80, {
  cors: {
    origin: '*',
    methods: ['GET', 'PUT', 'POST'],
  },
  namespace: '/p2p',
})
export class P2pService implements OnGatewayConnection, OnGatewayDisconnect {
  readonly peers: Map<string, interfaces.PeerConnection> = new Map();
  readonly rooms: Map<string, Set<string>> = new Map();

  constructor() {}

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

  private _findSocketByPeerId(peerId: string): string | null {
    for (const [socketId, peer] of this.peers.entries()) {
      if (peer.peerId === peerId) {
        return socketId;
      }
    }
    return null;
  }

  getRoomPeers(roomId: string, excludeSocketId?: string): string[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const peers: string[] = [];

    for (const socketId of room) {
      const peer = this.peers.get(socketId);
      if (!peer) continue;

      if (!excludeSocketId) {
        peers.push(peer.peerId);
      } else if (socketId !== excludeSocketId) {
        peers.push(peer.peerId);
      }
    }

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

  isClientRegistered(socketId: string): boolean {
    return this.peers.has(socketId);
  }

  getConnectedPeers(): interfaces.PeerConnection[] {
    return Array.from(this.peers.values());
  }

  getRoomInfo(
    roomId: string,
  ): { roomId: string; peerCount: number; peers: string[] } | null {
    const room = this.rooms.get(roomId);

    if (!room) return null;

    const peers = this.getRoomPeers(roomId);
    return {
      roomId,
      peerCount: room.size,
      peers,
    };
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}
