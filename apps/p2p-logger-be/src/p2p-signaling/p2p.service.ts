import { Injectable } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as interfaces from './interfaces';

/**
 * WebSocket gateway service for managing P2P signaling.
 * Handles peer connections, room management, and signaling events.
 */
@Injectable()
export class P2pService implements OnGatewayConnection, OnGatewayDisconnect {
  /**
   * Map of socket IDs to peer connection objects.
   */
  readonly peers: Map<string, interfaces.PeerConnection> = new Map();

  /**
   * Map of room IDs to sets of socket IDs.
   */
  readonly rooms: Map<string, Set<string>> = new Map();

  constructor() {}

  /**
   * Handles a new client connection.
   * @param client The connected socket.
   */
  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  /**
   * Handles client disconnection.
   * Removes the peer from rooms and peer list.
   * @param client The disconnected socket.
   */
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removePeer(client.id);
  }

  /**
   * Adds a socket to a room, creating the room if it does not exist.
   * @param socketId The socket ID to add.
   * @param roomId The room ID to join.
   */
  joinRoom(socketId: string, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socketId);
  }

  /**
   * Removes a socket from a room. Deletes the room if empty.
   * @param socketId The socket ID to remove.
   * @param roomId The room ID to leave.
   */
  leaveRoom(socketId: string, roomId: string) {
    const room = this.rooms.get(roomId);

    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Finds a socket ID by its associated peer ID.
   * @param peerId The peer ID to search for.
   * @returns The socket ID or null if not found.
   */
  private _findSocketByPeerId(peerId: string): string | null {
    for (const [socketId, peer] of this.peers.entries()) {
      if (peer.peerId === peerId) {
        return socketId;
      }
    }
    return null;
  }

  /**
   * Gets peer IDs in a room, optionally excluding a socket ID.
   * @param roomId The room ID.
   * @param excludeSocketId Optional socket ID to exclude.
   * @returns Array of peer IDs.
   */
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

  /**
   * Removes a peer from the peer list and its room.
   * @param socketId The socket ID to remove.
   */
  removePeer(socketId: string) {
    const peer = this.peers.get(socketId);

    if (peer) {
      if (peer.roomId) {
        this.leaveRoom(socketId, peer.roomId);
      }
      this.peers.delete(socketId);
    }
  }

  /**
   * Checks if a client is registered.
   * @param socketId The socket ID to check.
   * @returns True if registered, false otherwise.
   */
  isClientRegistered(socketId: string): boolean {
    return this.peers.has(socketId);
  }

  /**
   * Gets all connected peer connection objects.
   * @returns Array of PeerConnection objects.
   */
  getConnectedPeers(): interfaces.PeerConnection[] {
    return Array.from(this.peers.values());
  }

  /**
   * Gets information about a room.
   * @param roomId The room ID.
   * @returns Room info object or null if room does not exist.
   */
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

  /**
   * Gets all room IDs.
   * @returns Array of room IDs.
   */
  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}
