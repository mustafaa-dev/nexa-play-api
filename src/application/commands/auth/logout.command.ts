import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';

import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

export class LogoutCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly accessToken: string,
  ) {}
}

@Injectable()
@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand, { message: string }> {
  constructor(private readonly redisService: RedisService) {}

  async execute(command: LogoutCommand): Promise<{ message: string }> {
    const { userId, accessToken } = command;

    await this.redisService.deleteLogInSession(userId, accessToken);

    return { message: I18nContext.current()?.translate('messages.logout_successful') };
  }
}
