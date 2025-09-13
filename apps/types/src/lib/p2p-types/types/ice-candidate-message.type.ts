import { SignalingType } from '../enum';

export type IceCandidateMessageType = {
  type: SignalingType.ICE_CANDIDATE;
  roomId: string;
  data: string;
};
