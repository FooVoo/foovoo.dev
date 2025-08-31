import { SignalingType } from '../enum';

export interface AnswerMessage {
  type: SignalingType.ANSWER;
  targetId: string;
  roomId: string;
  data: string;
}
