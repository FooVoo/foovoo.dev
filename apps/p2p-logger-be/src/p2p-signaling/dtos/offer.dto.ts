import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import * as socketIoAdapter from 'socket.io-adapter';
import { SignalType } from '../enums';

export class OfferDto {
  @IsNotEmpty()
  @IsEnum(SignalType)
  type: SignalType.OFFER;

  @IsString()
  targetId: string;

  @IsNotEmpty()
  roomId: socketIoAdapter.Room;

  @IsString()
  @IsNotEmpty()
  data: string;
}
