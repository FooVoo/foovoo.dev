import { SignalingType } from '@foovoo.dev/types';

export interface LeaveRoomMessage {
  type: SignalingType.LEAVE_ROOM;
  roomId: string;
  peerId: string;
}
