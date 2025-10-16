import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ActivateUserDto {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
