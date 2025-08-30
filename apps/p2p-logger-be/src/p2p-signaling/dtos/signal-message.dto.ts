import { IsNotEmpty, IsEnum } from 'class-validator';
import { SignalType } from '../enums';

export class SignalMessageDto {
  @IsNotEmpty()
  @IsEnum(SignalType)
  type: SignalType.SIGNAL;
  data: unknown;
}
