import { IsEnum, IsNotEmpty } from 'class-validator';
import { IRoomPeers, SignalingType } from '@foovoo.dev/types';

export class RoomPeersDto implements IRoomPeers {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.ROOMS_PEERS;

  @IsNotEmpty()
  roomId: string;
}
