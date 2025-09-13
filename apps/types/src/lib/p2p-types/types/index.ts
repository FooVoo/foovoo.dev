import { OfferMessageType } from './offer-message.type';
import { JoinRoomMessageType } from './join-room-message.type';
import { AnswerMessageType } from './answer-message.type';
import { IceCandidateMessageType } from './ice-candidate-message.type';
import { RegisterMessageType } from './register-message.type';
import { RoomPeersType } from './room-peers.type';
import { SignalMessageType } from './signal-message.type';

export type SignalMessage =
  | JoinRoomMessageType
  | AnswerMessageType
  | IceCandidateMessageType
  | OfferMessageType
  | RegisterMessageType
  | RoomPeersType
  | SignalMessageType;
