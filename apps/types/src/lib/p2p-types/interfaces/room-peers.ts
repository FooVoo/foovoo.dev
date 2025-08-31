import { SignalingType } from '@foovoo.dev/types';

export interface RoomPeers {
  type: SignalingType.ROOMS_PEERS;
  roomId: string;
}
