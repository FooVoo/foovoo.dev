import { SignalingType } from '../enum';

export type RoomPeersType = {
  type: SignalingType.ROOMS_PEERS;
  roomId: string;
};
