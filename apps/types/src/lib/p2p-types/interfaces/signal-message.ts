import { SignalingType } from '../enum';

export interface SignalMessage {
  type: SignalingType.SIGNAL;
  data: unknown;
}
