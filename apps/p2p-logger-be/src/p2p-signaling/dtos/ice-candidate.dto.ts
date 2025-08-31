import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IceCandidateMessage, SignalingType } from '@foovoo.dev/types';

export class IceCandidateDto implements IceCandidateMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.ICE_CANDIDATE;

  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  data: string;
}
