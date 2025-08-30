import { Component } from 'react';

interface P2pConnectorState {
  localId: string;
  remoteId: string;
  connection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  messages: string[];
  isConnected: boolean;
  connectionState: RTCPeerConnectionState;
}

export class P2pConnector extends Component<unknown, P2pConnectorState> {
  pendingIceCandidates: RTCIceCandidate[] = []; // Queue for early candidates

  constructor(props: unknown) {
    super(props);
    this.state = {
      localId: Math.random().toString(36).substr(2, 9),
      remoteId: '',
      connection: null,
      dataChannel: null,
      messages: [],
      isConnected: false,
      connectionState: 'disconnected',
    };
  }

  addIceCandidate = async (candidateSdp: string) => {
    const { connection } = this.state;
    console.debug('Adding ICE candidate:', connection);

    if (!connection) return;

    try {
      const candidate = JSON.parse(candidateSdp);

      if (!connection.remoteDescription) {
        console.log('Remote description not set yet, queuing ICE candidate');
        this.pendingIceCandidates.push(candidate);
        return;
      }

      await connection.addIceCandidate(candidate);
      console.log('ICE Candidate added:', candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  processPendingIceCandidates = async () => {
    const { connection } = this.state;
    if (!connection || this.pendingIceCandidates.length === 0) return;

    console.log(
      `Processing ${this.pendingIceCandidates.length} pending ICE candidates`
    );

    for (const candidate of this.pendingIceCandidates) {
      try {
        await connection.addIceCandidate(candidate);
        console.log('Queued ICE candidate added:', candidate);
      } catch (error) {
        console.error('Error adding queued ICE candidate:', error);
      }
    }

    this.pendingIceCandidates = [];
  };

  handleAnswer = async (answerSdp: string) => {
    const { connection } = this.state;

    if (!connection) return;

    try {
      const answer = JSON.parse(answerSdp);
      await connection.setRemoteDescription(answer);

      await this.processPendingIceCandidates();
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  createAnswer = async (offerSdp: string) => {
    const { connection } = this.state;

    if (!connection) return;

    try {
      const offer = JSON.parse(offerSdp);
      await connection.setRemoteDescription(offer);

      await this.processPendingIceCandidates();

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  };

  setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      this.setState({ isConnected: true });
      console.log('Data channel opened');
    };

    channel.onmessage = (event) => {
      this.setState((prev) => ({
        messages: [...prev.messages, `Remote: ${event.data}`],
      }));
    };

    this.setState({ dataChannel: channel });
  };

  createOffer = async () => {
    const { connection } = this.state;
    if (!connection) return;

    const dataChannel = connection.createDataChannel('messages');
    this.setupDataChannel(dataChannel);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
  };

  sendMessage = (message: string) => {
    const { dataChannel } = this.state;
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(message);
      this.setState((prev) => ({
        messages: [...prev.messages, `You: ${message}`],
      }));
    }
  };

  override render() {
    const { localId, isConnected, messages, connectionState } = this.state;

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>P2P Connector</h1>
        <p>Local ID: {localId}</p>
        <p>Status: {connectionState}</p>

        {isConnected && (
          <div>
            <button
              onClick={() => {
                const msg = prompt('Enter message:');
                if (msg) this.sendMessage(msg);
              }}
            >
              Send Message
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: '20px',
            height: '200px',
            overflow: 'auto',
            border: '1px solid #ccc',
            padding: '10px',
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      </div>
    );
  }
}
