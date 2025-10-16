import { RedisService } from '@infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseRepository } from './base.repository';
// import { Otp as PrismaOtp } from '@prisma/client';

@Injectable()
//  implements IOtpRepository
export class OtpRepository extends BaseRepository<undefined, undefined> {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    super(null);
  }

  // async findById(id: string): Promise<Otp | null> {
  //   return this.executeWithErrorHandling('findById', async () => {
  //     const otpRecord = await this.prisma.otp.findUnique({
  //       where: { id },
  //     });

  //     if (!otpRecord) {
  //       return null;
  //     }

  //     return this.mapToModel(otpRecord);
  //   });
  // }

  // async findByUserId(userId: string): Promise<Otp | null> {
  //   return this.executeWithErrorHandling('findByUserId', async () => {
  //     const otpRecord = await this.prisma.otp.findFirst({
  //       where: { userId },
  //       orderBy: { createdAt: 'desc' },
  //     });

  //     if (!otpRecord) {
  //       return null;
  //     }

  //     return this.mapToModel(otpRecord);
  //   });
  // }

  // async create(otp: Otp): Promise<Otp> {
  //   return this.executeWithErrorHandling('create', async () => {
  //     const createdOtp = await this.prisma.otp.create({
  //       data: {
  //         id: otp.id,
  //         userId: otp.userId.getValue(),
  //         secret: otp.secret,
  //         expiresAt: otp.expiresAt,
  //         verifiedAt: otp.verifiedAt,
  //         createdAt: otp.createdAt,
  //       },
  //     });

  //     return this.mapToModel(createdOtp);
  //   });
  // }

  // async update(otp: Otp): Promise<Otp> {
  //   return this.executeWithErrorHandling('update', async () => {
  //     const updatedOtp = await this.prisma.otp.update({
  //       where: { id: otp.id },
  //       data: {
  //         secret: otp.secret,
  //         expiresAt: otp.expiresAt,
  //         verifiedAt: otp.verifiedAt,
  //       },
  //     });

  //     return this.mapToModel(updatedOtp);
  //   });
  // }

  // async delete(id: string): Promise<boolean> {
  //   return this.executeWithErrorHandling(
  //     'delete',
  //     async () => {
  //       await this.prisma.otp.delete({
  //         where: { id },
  //       });

  //       return true;
  //     },
  //     false,
  //   );
  // }

  // private mapToModel(record: PrismaOtp): Otp {
  //   const expirationMinutes = this.configService.get<number>('OTP_EXPIRATION', 5);

  //   // Create value object from primitive value
  //   const userIdVO = new UserId(record.userId);

  //   const otp = new Otp(userIdVO, record.secret, expirationMinutes);

  //   otp.id = record.id;
  //   otp.expiresAt = record.expiresAt;
  //   otp.verifiedAt = record.verifiedAt || undefined;
  //   otp.createdAt = record.createdAt;

  //   return otp;
  // }

  protected mapToDomain(entity: undefined): undefined {
    return undefined;
  }
}
