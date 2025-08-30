import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import * as socketIoAdapter from 'socket.io-adapter';
import { SignalType } from '../enums';

export class AnswerDto {
  @IsNotEmpty()
  @IsEnum(SignalType)
  type: SignalType.ANSWER;

  @IsNotEmpty()
  @IsString()
  targetId: string;

  @IsNotEmpty()
  roomId: socketIoAdapter.Room;

  @IsNotEmpty()
  @IsString()
  data: string;
}
