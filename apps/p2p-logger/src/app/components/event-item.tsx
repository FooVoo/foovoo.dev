import { Component } from 'react';
import { IEventItem } from './events-list';

interface EventItemProps {
  event: IEventItem;
}

export class EventItem extends Component<EventItemProps, unknown> {
  override render() {
    const { id, type, timestamp, message } = this.props.event;

    return (
      <div className={`event-item event-item--${type}`} key={id}>
        <span className="event-item__timestamp">{timestamp}</span>
        <span className="event-item__message">{message}</span>
      </div>
    );
  }
}
