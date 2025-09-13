import { Component } from 'react';
import { io, Socket } from 'socket.io-client';
import uuid from 'uuid';
import { environment } from '../../envs/environment';
import { EventsList, IEventItem } from './events-list';
import { SignalingType } from '@foovoo.dev/types';

interface P2pViewerState {
  connection: Map<string, RTCPeerConnection>;
  peerId: string;
  socket: Socket | null;
  messagesList: IEventItem[];
}

interface P2pViewerProps {
  // @empty
  mock?: string;
}

export class P2PViewer extends Component<P2pViewerProps, P2pViewerState> {
  constructor(props: P2pViewerProps) {
    super(props);
    this.state = {
      connection: new Map<string, RTCPeerConnection>(),
      peerId: uuid.v4(),
      socket: null,
      messagesList: [],
    };
  }

  connectToSignalingServer = () => {
    const { socket } = this.state;
    if (socket) return; // Already connected
    const newSocket = io(environment.p2pSignalingUrl);

    newSocket.on('connection', this.connectionHandler);

    newSocket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });

    newSocket.on(SignalingType.OFFER, this.offerHandler);

    newSocket.on(SignalingType.ANSWER, this.answerHandler);

    newSocket.on(SignalingType.ICE_CANDIDATE, this.iceCandidateHandler);

    newSocket.on(SignalingType.PEER_JOINED, this.peerJoinedHandler);

    newSocket.on(SignalingType.PEER_LEFT, this.peerLeftHandler);

    this.setState({ socket: newSocket });
  };

  disconnectFromSignalingServer = () => {
    const { socket } = this.state;
    if (!socket) return; // Not connected
    socket.disconnect();
    this.setState({ socket: null });
  };

  iceCandidateHandler = (message) => {
    console.log('iceCandidateHandler', message);
  };

  offerHandler = (message) => {
    console.log('offerHandler', message);
  };

  answerHandler = (message) => {
    console.log('answerHandler', message);
  };

  connectionHandler = (message) => {
    console.log('connectionHandler', message);
  };

  peerJoinedHandler = (message) => {
    console.log('peerJoinedHandler', message);
  };

  peerLeftHandler = (message) => {
    console.log('peerLeftHandler', message);
  };

  emitToSocket: <MessageData>(
    messageType: SignalingType,
    data: MessageData
  ) => void = (messageType, data): void => {
    const { socket, peerId } = this.state;
    if (!socket) {
      console.warn('Socket not connected, cannot emit message');
      return;
    }

    socket.emit(messageType, {
      ...data,
      peerId: peerId,
    });
  };

  override render() {
    const { socket, peerId } = this.state;

    return (
      <div>
        {socket ? (
          <div>
            <div>Connected to signaling server as {peerId}</div>
            <button onClick={this.disconnectFromSignalingServer}>
              Disconnect from Signaling Server
            </button>
          </div>
        ) : (
          <button onClick={this.connectToSignalingServer}>
            Connect to Signaling Server
          </button>
        )}

        <EventsList events={[]}></EventsList>
      </div>
    );
  }
}
