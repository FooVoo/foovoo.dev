import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SignalType } from '../enums/signaling';

export class RegisterDto {
  @IsNotEmpty()
  @IsEnum(SignalType)
  type: SignalType.REGISTER;

  @IsNotEmpty()
  @IsString()
  peerId: string;
}
