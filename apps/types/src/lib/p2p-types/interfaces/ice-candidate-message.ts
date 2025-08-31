import { SignalingType } from '../enum';

export interface IceCandidateMessage {
  type: SignalingType.ICE_CANDIDATE;
  roomId: string;
  data: string;
}
