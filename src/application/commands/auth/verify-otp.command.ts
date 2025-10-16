import { VerifyOtpDto } from '@application/dtos/auth/verify-otp.dto';
import { IAuthTokenResponse } from '@application/dtos/responses/user.response';
import { UserMapper } from '@application/mappers/user.mapper';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

export class VerifyOtpCommand implements ICommand {
  constructor(public readonly verifyOtpDto: VerifyOtpDto) {}
}

@Injectable()
@CommandHandler(VerifyOtpCommand)
export class VerifyOtpCommandHandler implements ICommandHandler<VerifyOtpCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: VerifyOtpCommand): Promise<IAuthTokenResponse> {
    const { verifyOtpDto } = command;
    const userId = verifyOtpDto.userId;

    // Verify OTP
    const isOtpValid = await this.authService.verifyOtp(userId, verifyOtpDto.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email.getValue(),
      emailVerified: true,
      // roles: user.roles.map(role => role.name),
      roles: [],
      permissions: [],
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = uuidv4();
    await this.authService.createRefreshToken(user.id, accessToken, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: UserMapper.toAuthResponse(user, true),
    };
  }
}
