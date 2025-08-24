export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  targetId?: string;
  fromId: string;
  roomId?: string;
}
