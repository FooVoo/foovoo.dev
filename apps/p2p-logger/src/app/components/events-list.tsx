import { Component, useCallback, useState } from 'react';
import { EventItem } from './event-item';

interface IEventsListProps {
  events: IEventItem[];
}

export interface IEventItem {
  id: string;
  type: 'info' | 'error' | 'warning' | 'debug';
  timestamp: string;
  message: string;
}

export class EventsList extends Component<IEventsListProps> {
  override render() {
    const { events } = this.props;

    return (
      <div>
        {events.map((event) => {
          return <EventItem event={event} />;
        })}
      </div>
    );
  }
}
