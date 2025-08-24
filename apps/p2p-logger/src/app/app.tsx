import { Component } from 'react';
// Uncomment this line to use CSS modules
import styles from './app.module.css';
import { EventsList } from './components/events-list';
import { AutomatedP2pConnector } from './components/automated-2p2-connector';

export class App extends Component {
  override render() {
    return (
      <div>
        <AutomatedP2pConnector></AutomatedP2pConnector>
        <EventsList events={[]}></EventsList>
      </div>
    );
  }
}

export default App;
