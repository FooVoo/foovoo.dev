import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IIceCandidateMessage, SignalingType } from '@foovoo.dev/types';

export class IceCandidateDto implements IIceCandidateMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.ICE_CANDIDATE;

  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  data: string;
}
