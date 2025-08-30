import { P2pConnector } from './p2p-connector';
import { io, Socket } from 'socket.io-client';
import { JSX } from 'react';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'info';
  data?: unknown;
  targetId?: string;
  fromId?: string;
  roomId?: string;
  peerId?: string;
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
      this.createOffer();
    });

    this.socket.on('peer-left', (data) => {
      console.log('Peer left room:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Signaling error:', error);
    });
  };

  createConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [],
    });

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };

    pc.onconnectionstatechange = (event) => {
      console.debug('Connection state changed:', pc.connectionState);
      this.setState({ connectionState: pc.connectionState });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(event.candidate);
      }
    };

    this.setState({ connection: pc });
    return pc;
  };

  registerPeer = () => {
    if (!this.socket) return;

    this.emitToSocket('register', {
      type: 'info',
      peerId: this.state.localId,
      roomId: this.currentRoomId,
    });
  };

  joinRoom = () => {
    if (!this.socket || !this.isRegistered) return;

    this.emitToSocket('join-room', {
      type: 'info',
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

    let { connection } = this.state;

    if (!connection) {
      connection = this.createConnection();
    }

    const dataChannel = connection.createDataChannel('messages');
    this.setupDataChannel(dataChannel);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

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

    let { connection } = this.state;

    if (!connection) {
      connection = this.createConnection();
    }

    const offer = JSON.parse(offerData);

    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    this.emitToSocket('answer', {
      type: 'answer',
      data: answer,
      targetId: offer.fromId,
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

  emitToSocket(event: string, data: SignalingMessage) {
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
