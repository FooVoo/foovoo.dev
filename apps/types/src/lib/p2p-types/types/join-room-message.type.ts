import { SignalingType } from '../enum';

export type JoinRoomMessageType = {
  type: SignalingType.JOIN_ROOM;
  roomId: string;
  peerId: string;
};
