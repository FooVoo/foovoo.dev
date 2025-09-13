import { SignalingType } from '../enum';

export interface ILeaveRoomMessage {
  type: SignalingType.LEAVE_ROOM;
  roomId: string;
  peerId: string;
}
