import { SignalingType } from '../enum';

export interface RegisterMessage {
  type: SignalingType.REGISTER;
  roomId: string;
  peerId: string;
}
