import { SignalingType } from '../enum';

export type LeaveRoomMessageType = {
  type: SignalingType.LEAVE_ROOM;
  roomId: string;
  peerId: string;
};
