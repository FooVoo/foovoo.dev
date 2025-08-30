import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import * as socketIoAdapter from 'socket.io-adapter';
import { SignalType } from '../enums';

export class IceCandidateDto {
  @IsNotEmpty()
  @IsEnum(SignalType)
  type: SignalType.ICE_CANDIDATE;

  @IsNotEmpty()
  roomId: socketIoAdapter.Room;

  @IsNotEmpty()
  @IsString()
  data: string;
}
