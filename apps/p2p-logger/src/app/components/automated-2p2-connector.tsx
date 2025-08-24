import { P2pConnector } from './p2p-connector';
import { io, Socket } from 'socket.io-client';
import { JSX } from 'react';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  targetId?: string;
  fromId: string;
  roomId?: string;
}

export class AutomatedP2pConnector extends P2pConnector {
  private socket: Socket | null = null;
  private signalingUrl = 'http://localhost:3000/p2p';
  private currentRoomId = 'default-room';
  private isRegistered = false;

  connectToSignalingServer = () => {
    // Use Socket.io client instead of raw WebSocket
    this.socket = io(this.signalingUrl);

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      this.registerPeer();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      this.isRegistered = false;
    });

    this.socket.on('registered', (data) => {
      console.log('Peer registered:', data);
      this.isRegistered = true;
      this.joinRoom();
    });

    this.socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      if (data.peerCount > 1) {
        this.createOffer();
      }
    });

    this.socket.on('offer', (message: SignalingMessage) => {
      console.log('Received offer:', message);
      this.handleSignalingMessage(message);
    });

    this.socket.on('answer', (message: SignalingMessage) => {
      console.log('Received answer:', message);
      this.handleSignalingMessage(message);
    });

    this.socket.on('ice-candidate', (message: SignalingMessage) => {
      console.log('Received ICE candidate:', message);
      this.handleSignalingMessage(message);
    });

    this.socket.on('peer-joined', (data) => {
      console.log('Peer joined room:', data);
    });

    this.socket.on('peer-left', (data) => {
      console.log('Peer left room:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Signaling error:', error);
    });
  };

  registerPeer = () => {
    if (!this.socket) return;

    this.emitToSocket('register', {
      peerId: this.state.localId,
      roomId: this.currentRoomId,
    });
  };

  joinRoom = () => {
    if (!this.socket || !this.isRegistered) return;

    this.emitToSocket('join-room', {
      peerId: this.state.localId,
      roomId: this.currentRoomId,
    });
  };

  handleSignalingMessage = async (message: SignalingMessage) => {
    switch (message.type) {
      case 'offer':
        await this.createAnswer(JSON.stringify(message.data));
        break;
      case 'answer':
        await this.handleAnswer(JSON.stringify(message.data));
        break;
      case 'ice-candidate':
        await this.addIceCandidate(JSON.stringify(message.data));
        break;
    }
  };

  override createOffer = async () => {
    if (!this.socket || !this.isRegistered) {
      console.error('Not connected to signaling server');
      return;
    }

    const pc = this.createConnection();
    const dataChannel = pc.createDataChannel('messages');
    this.setupDataChannel(dataChannel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer via Socket.io
    this.emitToSocket('offer', {
      type: 'offer',
      data: offer,
      fromId: this.state.localId,
      roomId: this.currentRoomId,
    });
  };

  override createAnswer = async (offerData: string) => {
    if (!this.socket || !this.isRegistered) return;

    const pc = this.createConnection();
    const offer = JSON.parse(offerData);

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.emitToSocket('answer', {
      type: 'answer',
      data: answer,
      fromId: this.state.localId,
      roomId: this.currentRoomId,
    });
  };

  sendIceCandidate = (candidate: RTCIceCandidate) => {
    if (!this.socket || !this.isRegistered) return;

    this.emitToSocket('ice-candidate', {
      type: 'ice-candidate',
      data: candidate,
      fromId: this.state.localId,
      roomId: this.currentRoomId,
    });
  };

  getRooms = (): void => {
    fetch(`${this.signalingUrl}/rooms`)
      .then((response) => response.json())
      .then((data) => console.log('Rooms:', data))
      .catch((error) => console.error('Error getting rooms:', error));
  };

  getPeers = (): void => {
    fetch(`${this.signalingUrl}/peers`)
      .then((response) => response.json())
      .then((data) => console.log('Peers:', data))
      .catch((error) => console.error('Error getting peers:', error));
  };

  getHealth = (): void => {
    fetch(`${this.signalingUrl}/health`)
      .then((response) => response.json())
      .then((data) => console.log('Health:', data))
      .catch((error) => console.error('Error getting health:', error));
  };

  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isRegistered = false;
    }
  };

  emitToSocket(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, {
        data,
      });
    }
  }

  override render(): JSX.Element {
    return (
      <div>
        <button onClick={this.connectToSignalingServer}>
          Connect to Signaling Server
        </button>
        <button onClick={this.disconnect}>Disconnect</button>
        <button onClick={this.getRooms}>Get Rooms</button>
        <button onClick={this.getHealth}>Get Health Check</button>
        <button onClick={this.getPeers}>Get Peers</button>
        {super.render()}
      </div>
    );
  }
}
