import { LocalizedInvalidInputException } from '@infrastructure/i18n';
import * as bcrypt from 'bcrypt';

export class Password {
  private readonly value: string;

  constructor(password: string) {
    if (!this.isValid(password)) {
      throw new LocalizedInvalidInputException('password');
    }
    this.value = password;
  }

  static Hash(password: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  static isHashed(password: string): boolean {
    return password.length === 60;
  }

  static compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  getValue(): string {
    return this.value;
  }

  private isValid(password: string): boolean {
    // The Password must be at least 8 characters long and include at least one uppercase letter,
    // one lowercase letter, one number, and one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_])[A-Za-z\d!@#$%^&*(),.?":{}|<>_]{8,}$/;
    return passwordRegex.test(password);
  }
}
