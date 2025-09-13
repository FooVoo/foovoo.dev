import { SignalingType } from '../enum';

export type AnswerMessageType = {
  type: SignalingType.ANSWER;
  targetId: string;
  roomId: string;
  data: string;
};
