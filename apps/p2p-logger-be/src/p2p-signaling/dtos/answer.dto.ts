import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IAnswerMessage, SignalingType } from '@foovoo.dev/types';

export class AnswerDto implements IAnswerMessage {
  @IsNotEmpty()
  @IsEnum(SignalingType)
  type: SignalingType.ANSWER;

  @IsNotEmpty()
  @IsString()
  targetId: string;

  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  @IsString()
  data: string;
}
