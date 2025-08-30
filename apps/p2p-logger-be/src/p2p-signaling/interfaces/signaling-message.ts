import { IsNotEmpty, IsString } from 'class-validator';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  targetId: string;
  roomId: string;
  fromId: string;
}

export class SignalingMessageDto {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  targetId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  peerId: string;
}
