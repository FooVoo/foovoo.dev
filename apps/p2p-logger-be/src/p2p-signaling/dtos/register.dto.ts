import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RegisterMessage, SignalingType } from '@foovoo.dev/types';

export class RegisterDto implements RegisterMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.REGISTER;

  @IsNotEmpty()
  @IsString()
  peerId: string;

  @IsNotEmpty()
  @IsString()
  roomId: string;
}
