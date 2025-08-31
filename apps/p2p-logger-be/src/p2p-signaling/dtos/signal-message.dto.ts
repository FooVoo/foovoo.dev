import { IsNotEmpty, IsEnum } from 'class-validator';
import { SignalingType, SignalMessage } from '@foovoo.dev/types';

export class SignalMessageDto implements SignalMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.SIGNAL;

  data: unknown;
}
