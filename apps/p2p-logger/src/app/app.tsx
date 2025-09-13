import { Component } from 'react';
import { P2PViewer } from './components/p2p-viewer';

export class App extends Component {
  override render() {
    return (
      <div>
        <P2PViewer></P2PViewer>
      </div>
    );
  }
}

export default App;
