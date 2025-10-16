import { IsNotEmpty, IsString } from 'class-validator';

export class Setup2FADto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class Disable2FADto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class Generate2FADto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
