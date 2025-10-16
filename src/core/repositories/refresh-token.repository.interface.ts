export interface IRefreshTokenRepository {
  deleteByUserId(userId: string): Promise<boolean>;
}
