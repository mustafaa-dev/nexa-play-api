export const REDIS_CLIENT = Symbol('REDIS-CLIENT');

export enum REDIS_PREFIX {
  VERIFICATION_SESSION = 'verification-session:',
  REGISTRATION_SESSION = 'registration-session:',
  RESET_PASSWORD_SESSION = 'reset-password-session:',
  LOGIN_SESSION = 'login-session:',
  REFRESH_TOKEN = 'refresh-token:',
  USER_2FA = 'user-2fa:',
  INSTANCE_QR_CODE = 'instance-qr-code:',
}
