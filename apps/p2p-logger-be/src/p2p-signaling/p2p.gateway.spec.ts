import { P2pGateway } from './p2p.gateway';
import { P2pService } from './p2p.service';
import { SignalingType } from './enums';
import { Server, Socket } from 'socket.io';

describe('P2pGateway', () => {
  let gateway: P2pGateway;
  let p2pService: P2pService;
  let client: Socket;

  beforeEach(() => {
    p2pService = {
      isClientRegistered: jest.fn(),
      removePeer: jest.fn(),
      peers: new Map(),
      rooms: new Map(),
      getRoomPeers: jest.fn(),
    } as any;
    gateway = new P2pGateway(p2pService);
    client = {
      id: 'socket1',
      emit: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      rooms: new Set(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    } as any;
  });

  it('registers a peer successfully', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(false);
    gateway.handleRegister({ peerId: 'peer1' }, client);
    expect(client.emit).toHaveBeenCalledWith('registered', {
      success: true,
      peerId: 'peer1',
    });
    expect(p2pService.peers.get('socket1')).toEqual({
      peerId: 'peer1',
      roomId: null,
      socketId: 'socket1',
    });
  });

  it('emits error if peer already registered', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    gateway.handleRegister({ peerId: 'peer1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer already registered',
    });
  });

  it('joins a room and notifies peers', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    p2pService.rooms.set('room1', new Set(['socket1']));
    await gateway.handleJoinRoom(client, { roomId: 'room1', peerId: 'peer1' });
    expect(client.emit).toHaveBeenCalledWith('joined-room', {
      peerId: 'peer1',
      peerCount: 1,
    });
    expect(client.to).toHaveBeenCalledWith('room1');
  });

  it('emits error if join room fails', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    (client.join as jest.Mock).mockRejectedValue(new Error('fail'));
    await gateway.handleJoinRoom(client, { roomId: 'room1', peerId: 'peer1' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Failed to join room',
    });
  });

  it('leaves a room and notifies peers', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    await gateway.handleLeaveRoom(client, { roomId: 'room1', peerId: 'peer1' });
    expect(client.to).toHaveBeenCalledWith('room1');
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('emits error if peer not in any room when leaving', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    await gateway.handleLeaveRoom(client, { roomId: 'room1', peerId: 'peer1' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not in a room',
    });
  });

  it('emits error if peer not in specified room when leaving', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room2');
    await gateway.handleLeaveRoom(client, { roomId: 'room1', peerId: 'peer1' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not in the specified room',
    });
  });

  it('handles offer to target peer', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    p2pService.peers.set('socket1', {
      peerId: 'peer1',
      roomId: 'room1',
      socketId: 'socket1',
    });
    client.rooms.add('room1');
    gateway.handleOffer({ roomId: 'room1', targetId: 'target1' }, client);
    expect(client.to).toHaveBeenCalledWith('room1');
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('emits error if offer sent to self', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    gateway.handleOffer({ roomId: 'room1', targetId: 'socket1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Cannot send message to self',
    });
  });

  it('emits error if offer missing roomId', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    gateway.handleOffer({ targetId: 'target1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'roomId is required',
    });
  });

  it('handles answer to room', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    p2pService.peers.set('socket1', {
      peerId: 'peer1',
      roomId: 'room1',
      socketId: 'socket1',
    });
    client.rooms.add('room1');
    gateway.handleAnswer({ roomId: 'room1', targetId: 'target1' }, client);
    expect(client.in).toHaveBeenCalledWith('room1');
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('emits error if answer sent to self', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    gateway.handleAnswer({ roomId: 'room1', targetId: 'socket1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Cannot send message to self',
    });
  });

  it('emits error if answer missing roomId', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    gateway.handleAnswer({ targetId: 'target1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not in the specified room',
    });
  });

  it('handles ICE candidate for peer in room', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    p2pService.peers.set('socket1', {
      peerId: 'peer1',
      roomId: 'room1',
      socketId: 'socket1',
    });
    client.rooms.add('room1');
    gateway.handleIceCandidate({ roomId: 'room1' }, client);
    expect(client.in).toHaveBeenCalledWith('room1');
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });

  it('emits error if ICE candidate peer not registered', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    gateway.handleIceCandidate({ roomId: 'room1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not registered',
    });
  });

  it('emits error if ICE candidate peer not in room', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    p2pService.peers.set('socket1', {
      peerId: 'peer1',
      roomId: null,
      socketId: 'socket1',
    });
    gateway.handleIceCandidate({ roomId: 'room1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not in a room',
    });
  });

  it('returns room peers for valid request', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    (p2pService.getRoomPeers as jest.Mock).mockReturnValue(['peer1', 'peer2']);
    gateway.handleGetRoomPeers({ roomId: 'room1' }, client);
    expect(client.emit).toHaveBeenCalledWith('room-peers', {
      peers: ['peer1', 'peer2'],
    });
  });

  it('emits error if getRoomPeers called by unregistered client', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(false);
    gateway.handleGetRoomPeers({ roomId: 'room1' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not registered',
    });
  });
  it('emits error if peer tries to join a room without specifying roomId', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    await gateway.handleJoinRoom(client, { roomId: '', peerId: 'peer1' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'roomId is required',
    });
  });

  it('emits error if peer tries to leave a room without specifying roomId', async () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    await gateway.handleLeaveRoom(client, { roomId: '', peerId: 'peer1' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'roomId is required',
    });
  });

  it('emits error if peer sends signal without specifying targetId', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    gateway.handleSignal(client, { roomId: 'room1', targetId: '' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'targetId is required',
    });
  });

  it('emits error if peer sends signal without being in any room', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.clear();
    gateway.handleSignal(client, { roomId: 'room1', targetId: 'target1' });
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Peer not in a room',
    });
  });

  it('emits error if peer tries to register without specifying peerId', () => {
    gateway.handleRegister({ peerId: '' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'peerId is required',
    });
  });

  it('emits error if peer tries to send ICE candidate without specifying roomId', () => {
    (p2pService.isClientRegistered as jest.Mock).mockReturnValue(true);
    client.rooms.add('room1');
    gateway.handleIceCandidate({ roomId: '' }, client);
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'roomId is required',
    });
  });
});
