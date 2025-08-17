import { Component } from 'react';
// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import NxWelcome from './nx-welcome';

export class App extends Component {
  override render() {
    return (
      <div>
        <NxWelcome title="p2p-logger" />
      </div>
    );
  }
}

export default App;
