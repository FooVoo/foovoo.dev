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

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  targetId?: string;
  fromId: string;
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
    console.debug('Handling answer:', connection);

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
    const pc = this.createConnection();

    try {
      const offer = JSON.parse(offerSdp);
      await pc.setRemoteDescription(offer);

      await this.processPendingIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('Answer SDP:', JSON.stringify(answer));
      setTimeout(() => {
        navigator.clipboard.writeText(JSON.stringify(answer));
      }, 300);
    } catch (error) {
      console.error('Error creating answer:', error);
    }
  };

  createConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE Candidate:');
        console.log(JSON.stringify(event.candidate));
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };

    pc.onconnectionstatechange = (event) => {
      console.debug('Connection state changed:', pc.connectionState);
      this.setState({ connectionState: pc.connectionState });
    };

    this.setState({ connection: pc });
    return pc;
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
    const pc = this.createConnection();
    const dataChannel = pc.createDataChannel('messages');
    this.setupDataChannel(dataChannel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.log('Offer SDP:', JSON.stringify(offer));
    navigator.clipboard.writeText(JSON.stringify(offer));
    // alert(`Share this offer with the other device:\n${JSON.stringify(offer)}`);
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

        <div style={{ marginBottom: '20px' }}>
          <button onClick={this.createOffer}>Create Offer</button>
          <button
            onClick={() => {
              const sdp = prompt('Paste offer SDP:');
              if (sdp) this.createAnswer(sdp);
            }}
          >
            Accept Offer
          </button>
          <button
            onClick={() => {
              const sdp = prompt('Paste ICE candidate:');
              if (sdp) this.addIceCandidate(sdp);
            }}
          >
            Add ICE Candidate
          </button>
          <button
            onClick={() => {
              const sdp = prompt('Paste answer SDP:');
              if (sdp) this.handleAnswer(sdp);
            }}
          >
            Complete Connection
          </button>
        </div>

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
