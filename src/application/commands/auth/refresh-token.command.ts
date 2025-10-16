import { RefreshTokenDto } from '@application/dtos/auth/refresh-token.dto';
import { IAuthRefreshTokenResponse } from '@application/dtos/responses/user.response';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { AuthService } from '@core/services/auth.service';
import { LocalizedUnauthorizedException } from '@infrastructure/i18n/localized-exceptions';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';

export class RefreshTokenCommand implements ICommand {
  constructor(public readonly refreshTokenDto: RefreshTokenDto) {}
}

@Injectable()
@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<IAuthRefreshTokenResponse> {
    const { accessToken, refreshToken } = command.refreshTokenDto;

    // Validate refresh token
    const userId = this.jwtService.decode(accessToken).sub;

    const token = await this.authService.validateRefreshToken(userId, accessToken);
    if (!token || !token.isTokenValid(refreshToken)) {
      throw new LocalizedUnauthorizedException('errors.invalid_refresh_token');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: {
        id: token.userId,
      },
      relations: {
        avatar: true,
      },
    });

    if (!user) {
      throw new LocalizedUnauthorizedException('errors.invalid_refresh_token');
    }

    // Revoke current refresh token
    await this.authService.revokeRefreshToken(userId, accessToken);

    // Collect all permissions from all user roles
    const userPermissions = [];

    // Generate new JWT tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this.tokenProvider.generateTokens(user, userPermissions, true);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
