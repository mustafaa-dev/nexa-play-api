import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemNotificationDto } from './create-system-notification.dto';

export class UpdateSystemNotificationDto extends PartialType(CreateSystemNotificationDto) {}
