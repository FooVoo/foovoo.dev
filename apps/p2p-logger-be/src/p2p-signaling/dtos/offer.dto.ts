import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { OfferMessage, SignalingType } from '@foovoo.dev/types';

export class OfferDto implements OfferMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.OFFER;

  @IsString()
  targetId: string;

  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  data: string;
}
