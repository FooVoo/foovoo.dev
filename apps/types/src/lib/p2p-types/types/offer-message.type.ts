import { SignalingType } from '../enum';

export type OfferMessageType = {
  type: SignalingType.OFFER;
  roomId: string;
  targetId: string;
  data: string;
};
