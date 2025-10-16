import { SocketNotificationStatusEnum } from '@shared/constants/socket.constants';
import { IsBoolean, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateSystemNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(SocketNotificationStatusEnum)
  status: SocketNotificationStatusEnum;

  @IsNotEmpty()
  @IsBoolean()
  isVisible: boolean;
}
