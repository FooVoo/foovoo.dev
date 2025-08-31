import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoomPeers, SignalingType } from '@foovoo.dev/types';

export class RoomPeersDto implements RoomPeers {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.ROOMS_PEERS;

  @IsNotEmpty()
  roomId: string;
}
