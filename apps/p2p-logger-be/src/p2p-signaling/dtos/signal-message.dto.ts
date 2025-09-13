import { IsNotEmpty, IsEnum } from 'class-validator';
import { SignalingType, ISignalMessage } from '@foovoo.dev/types';

export class SignalMessageDto implements ISignalMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.SIGNAL;

  data: unknown;
}
