import { SignalingType } from '../enum';

export interface IRegisterMessage {
  type: SignalingType.REGISTER;
  roomId: string;
  peerId: string;
}
