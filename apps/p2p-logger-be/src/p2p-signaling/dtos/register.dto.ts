import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IRegisterMessage, SignalingType } from '@foovoo.dev/types';

export class RegisterDto implements IRegisterMessage {
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
