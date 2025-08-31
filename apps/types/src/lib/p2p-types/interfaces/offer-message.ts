import { SignalingType } from '../enum';

export interface OfferMessage {
  type: SignalingType.OFFER;
  roomId: string;
  targetId: string;
  data: string;
}
