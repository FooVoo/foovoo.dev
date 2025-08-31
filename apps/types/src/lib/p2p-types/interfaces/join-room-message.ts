import { SignalingType } from '@foovoo.dev/types';

export interface JoinRoomMessage {
  type: SignalingType.JOIN_ROOM;
  roomId: string;
  peerId: string;
}
