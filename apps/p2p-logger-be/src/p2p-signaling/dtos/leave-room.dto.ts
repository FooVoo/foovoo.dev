import { SignalingType } from '@foovoo.dev/types';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class LeaveRoomDto {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.LEAVE_ROOM;

  @IsNotEmpty()
  @IsString()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  peerId: string;
}
