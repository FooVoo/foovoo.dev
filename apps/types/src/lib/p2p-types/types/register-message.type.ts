import { SignalingType } from '../enum';

export type RegisterMessageType = {
  type: SignalingType.REGISTER;
  roomId: string;
  peerId: string;
};
