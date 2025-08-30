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
import { Logger, ValidationPipe } from '@nestjs/common';
import { AnswerDto, OfferDto, SignalMessageDto } from './dtos';
import { RoomPeersDto } from './dtos/room-peers.dto';
import { IceCandidateDto } from './dtos/ice-candidate.dto';
import { RegisterDto } from './dtos/register.dto';
import { SignalType } from './enums';

/**
 * WebSocket gateway for P2P signaling.
 * Handles peer registration, room management, and signaling events.
 * Namespace: /p2p
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/p2p',
})
export class P2pGateway implements OnGatewayConnection, OnGatewayDisconnect {
  /** Socket.IO server instance */
  @WebSocketServer()
  server: Server;

  /**
   * Constructor
   * @param p2pService Service for managing peers and rooms
   */
  constructor(private readonly p2pService: P2pService) {}

  /**
   * Handles new client connection.
   * @param client Connected socket
   */
  handleConnection(client: Socket) {
    Logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handles client disconnection.
   * Removes peer from service.
   * @param client Disconnected socket
   */
  handleDisconnect(client: Socket) {
    Logger.log(`Client disconnected: ${client.id}`);
    this.p2pService.removePeer(client.id);
  }

  /**
   * Handles peer joining a room.
   * Emits events for joining and notifies other peers.
   * @param client Connected socket
   * @param data Room and peer information
   */
  @SubscribeMessage(SignalType.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('data', new ValidationPipe())
    data: { roomId: string; peerId: string },
  ) {
    if (!this._isClientRegistered(client)) return;

    if (client.rooms.size > 0) {
      client.emit('error', { message: 'Peer already in a room' });
      return;
    }

    const { roomId, peerId } = data;

    try {
      await client.join(roomId);
    } catch (error) {
      client.emit('error', { message: 'Failed to join room' });
      Logger.error(error);
      return;
    }

    client.emit('joined-room', data);

    client.to(roomId).emit('peer-joined', { peerId, socketId: client.id });

    Logger.log(`Peer joined room: ${peerId} in ${roomId}`);
  }

  /**
   * Handles peer leaving a room.
   * Emits events for leaving and notifies other peers.
   * @param client Connected socket
   * @param data Room and peer information
   */
  @SubscribeMessage(SignalType.LEAVE_ROOM)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('data') data: { roomId: string; peerId: string },
  ) {
    if (!this._isClientRegistered(client)) return;

    if (client.rooms.size < 1) {
      client.emit('error', { message: 'Peer not in a room' });
      Logger.error(`Peer:${client.id} not in a room`);
      return;
    }

    const { roomId, peerId } = data;

    if (!client.rooms.has(roomId)) {
      client.emit('error', { message: 'Peer not in the specified room' });
      Logger.error(`Peer:${client.id} not in the specified room:${roomId}`);
      return;
    }

    try {
      await client.leave(roomId);
    } catch (error) {
      client.emit('error', { message: 'Failed to leave room' });
      Logger.error(error);
      return;
    }

    client.to(roomId).emit('peer-left', { peerId, socketId: client.id });
    Logger.log('Peer left room:', peerId, roomId);
  }

  /**
   * Handles signaling messages (offer, answer, ice-candidate).
   * Emits to target peer or room.
   * @param client Connected socket
   * @param data Signaling message data
   */
  @SubscribeMessage(SignalType.SIGNAL)
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody('data')
    data: SignalMessageDto,
  ) {
    if (!this._isClientRegistered(client)) return;

    Logger.log(`Signal:${client.id}`);
  }

  /**
   * Handles peer registration.
   * Emits registration status.
   * @param data Peer registration data
   * @param client Connected socket
   */
  @SubscribeMessage(SignalType.REGISTER)
  handleRegister(
    @MessageBody('data') data: RegisterDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (this._isClientRegistered(client)) {
      client.emit('error', { message: 'Peer already registered' });
      Logger.error(`Peer already registered: ${data.peerId}`);
      return;
    }

    client.emit('registered', { success: true, peerId: data.peerId });

    Logger.log(`Peer registered: ${data.peerId}`);
  }

  /**
   * Handles offer signaling message.
   * Validates prerequisites and emits offer to target or room.
   * @param message Signaling message
   * @param client Connected socket
   */
  @SubscribeMessage(SignalType.OFFER)
  handleOffer(
    @MessageBody('data') message: OfferDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this._isClientRegistered(client)) return;
    if (!this._isTargetSpecified(client, message.targetId)) return;
    if (this._isSendToSelf(client, message.targetId)) return;

    if (client.rooms.size === 0) {
      client.emit('error', { message: 'Peer not in a room' });
      return;
    }

    const peer = this.p2pService.peers.get(client.id)!;

    if (!message.roomId) {
      client.emit('error', { message: 'roomId is required' });
      Logger.error('roomId is required');
      return;
    }

    if (!client.rooms.has(message.roomId)) {
      client.emit('error', { message: 'Peer not in the specified room' });
      Logger.error(
        `Peer:${client.id} not in the specified room:${message.roomId}`,
      );
      return;
    }

    if (message.targetId) {
      client.to(message.targetId).emit('offer', message);
      Logger.log(`Peer offer to target:${peer.peerId} -> ${message.targetId}`);
      return;
    }

    client.in(message.roomId).emit('offer', message);
    Logger.log(`Peer offer: ${peer.peerId}`);
  }

  /**
   * Handles answer signaling message.
   * Validates prerequisites and emits answer to room.
   * @param message Signaling message
   * @param client Connected socket
   */
  @SubscribeMessage(SignalType.ANSWER)
  handleAnswer(
    @MessageBody('data') message: AnswerDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this._isClientRegistered(client)) return;
    if (!this._isTargetSpecified(client, message.targetId)) return;
    if (this._isSendToSelf(client, message.targetId)) return;

    if (client.rooms.size === 0) {
      client.emit('error', { message: 'Peer not in a room' });
      Logger.error(`Peer not in room: ${client.id}`);
      return;
    }

    if (!client.rooms.has(message.roomId)) {
      client.emit('error', { message: 'Peer not in the specified room' });
      Logger.error(
        `Peer:${client.id} not in the specified room:${message.roomId}`,
      );
      return;
    }
    const peer = this.p2pService.peers.get(client.id);

    if (!peer) {
      client.emit('error', { message: 'Peer not registered' });
      return;
    }

    client.in(message.roomId).emit('answer', {
      ...message,
      fromId: peer.peerId,
    });
  }

  /**
   * Handles ICE candidate signaling message.
   * Emits candidate to room.
   * @param message Signaling message
   * @param client Connected socket
   */
  @SubscribeMessage(SignalType.ICE_CANDIDATE)
  handleIceCandidate(
    @MessageBody('data') message: IceCandidateDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this._isClientRegistered(client)) return;
    if (this._isClientInSpecifiedRoom(client, message.roomId)) return;

    const peer = this.p2pService.peers.get(client.id);
    if (!peer) {
      client.emit('error', { message: 'Peer not registered' });
      return;
    }

    client.in(peer.roomId).emit('ice-candidate', message);
    console.log('Peer ICE candidate:', peer.peerId);
  }

  /**
   * Handles request for peers in a room.
   * Emits list of peers.
   * @param data Room information
   * @param client Connected socket
   */
  @SubscribeMessage(SignalType.ROOMS_PEERS)
  handleGetRoomPeers(
    @MessageBody('data') data: RoomPeersDto,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this._isClientRegistered(client)) return;
    if (!this._isClientInRoom(client)) return;
    if (this._isClientInSpecifiedRoom(client, data.roomId)) return;

    const roomPeers = this.p2pService.getRoomPeers(data.roomId, client.id);
    client.emit('room-peers', { peers: roomPeers });
  }

  /**
   * Checks if client is registered.
   * Emits error if not registered.
   * @param client Connected socket
   * @returns True if registered, false otherwise
   */
  private _isClientRegistered(client: Socket) {
    if (!this.p2pService.isClientRegistered(client.id)) {
      client.emit('error', { message: 'Peer not registered' });
      Logger.error(`Peer not registered: ${client.id}`);
      return false;
    }
    return true;
  }

  /**
   * Checks if client is sending to self.
   * Emits error if true.
   * @param client Connected socket
   * @param targetId Target socket id
   * @returns True if sending to self, false otherwise
   */
  private _isSendToSelf(client: Socket, targetId: string) {
    if (client.id === targetId) {
      client.emit('error', { message: 'Cannot send message to self' });
      Logger.error(`Cannot send message to self: ${client.id}`);
      return true;
    }
    return false;
  }

  /**
   * Checks if targetId is specified.
   * Emits error if not specified.
   * @param client Connected socket
   * @param targetId Target socket id
   * @returns True if specified, false otherwise
   */
  private _isTargetSpecified(client: Socket, targetId?: string) {
    if (!targetId) {
      client.emit('error', { message: 'targetId is required' });
      Logger.error('targetId is required');
      return false;
    }
    return true;
  }

  /**
   * Checks if fromId is specified.
   * Emits error if not specified.
   * @param client Connected socket
   * @param fromId Source peer id
   * @returns True if specified, false otherwise
   */
  private _isFromSpecified(client: Socket, fromId?: string) {
    if (!fromId) {
      client.emit('error', { message: 'fromId is required' });
      Logger.error('fromId is required');
      return false;
    }
    return true;
  }

  /**
   * Checks if roomId is specified.
   * Emits error if not specified.
   * @param client Connected socket
   * @param roomId Room id
   * @returns True if specified, false otherwise
   */
  private _isRoomIdSpecified(client: Socket, roomId?: string) {
    if (!roomId) {
      client.emit('error', { message: 'roomId is required' });
      Logger.error('roomId is required');
      return false;
    }
    return true;
  }

  /**
   * Checks if client is in any room.
   * Emits error if not in a room.
   * @param client Connected socket
   * @returns True if in a room, false otherwise
   */
  private _isClientInRoom(client: Socket) {
    if (client.rooms.size === 0) {
      client.emit('error', { message: 'Peer not in a room' });
      Logger.error(`Peer not in room: ${client.id}`);
      return false;
    }
    return true;
  }

  /**
   * Checks if client is in the specified room.
   * Emits error if not in the room.
   * @param client Connected socket
   * @param roomId Room id
   * @returns True if in the room, false otherwise
   */
  private _isClientInSpecifiedRoom(client: Socket, roomId: string) {
    if (!client.rooms.has(roomId)) {
      client.emit('error', { message: 'Peer not in the specified room' });
      Logger.error(`Peer:${client.id} not in the specified room:${roomId}`);
      return false;
    }
    return true;
  }
}
