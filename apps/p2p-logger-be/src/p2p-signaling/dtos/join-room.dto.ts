import { IJoinRoomMessage, SignalingType } from '@foovoo.dev/types';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class JoinRoomDto implements IJoinRoomMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.JOIN_ROOM;

  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  peerId: string;
}
