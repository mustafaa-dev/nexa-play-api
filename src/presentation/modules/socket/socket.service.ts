import { User } from '@core/entities/user.entity';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { LoggingService } from '@infrastructure/logging/logging.service';
import { Inject, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { TokenProvider } from '../auth/providers/token.provider';

@Injectable()
export class SocketService {
  constructor(
    private readonly tokenProvider: TokenProvider,
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async checkUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new WsException('User not found');
    }
    return user;
  }

  /**
   * Decodes the JWT token and retrieves the user entity.
   */
  async decodeToken(token: string): Promise<User> {
    try {
      const payload = await this.tokenProvider.decodeToken(token);
      if (!payload || !payload.sub) {
        throw new WsException('Invalid token payload');
      }
      return this.checkUser(payload.sub);
    } catch (error) {
      LoggingService.error('Invalid or expired token', {
        context: `${this.constructor.name} :: decodeToken`,
        error,
      });
      throw new WsException('Invalid or expired token');
    }
  }
}
