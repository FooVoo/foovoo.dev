import { IsEnum, IsNotEmpty } from 'class-validator';
import * as socketIoAdapter from 'socket.io-adapter';
import { SignalType } from '../enums';

export class RoomPeersDto {
  @IsNotEmpty()
  @IsEnum(SignalType)
  type: SignalType.ROOMS_PEERS;

  @IsNotEmpty()
  roomId: socketIoAdapter.Room;
}
