import { Component } from 'react';
import { IEventItem } from './events-list';

export class EventItem extends Component<IEventItem> {
  override render() {
    const { id, type, timestamp, message } = this.props;

    return (
      <div className={`event-item event-item--${type}`} key={id}>
        <span className="event-item__timestamp">{timestamp}</span>
        <span className="event-item__message">{message}</span>
      </div>
    );
  }
}
