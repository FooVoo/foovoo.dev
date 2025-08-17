import { Component } from 'react';
// Uncomment this line to use CSS modules
import styles from './app.module.css';
import { EventsList } from './components/events-list';
import { P2pConnector } from './components/p2p-connector';

export class App extends Component {
  override render() {
    return (
      <div>
        <P2pConnector></P2pConnector>
        <EventsList events={[]}></EventsList>
      </div>
    );
  }
}

export default App;
