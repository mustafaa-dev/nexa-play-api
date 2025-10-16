import { LocalizedInvalidInputException } from '@infrastructure/i18n';

export class Username {
  private readonly value: string;

  constructor(username: string) {
    if (!this.isValid()) {
      throw new LocalizedInvalidInputException('username');
    }
    this.value = username.toLowerCase().trim();
  }

  // private isValid(username: string): boolean {
  private isValid(): boolean {
    // Basic username validation regex
    // const usernameRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // return usernameRegex.test(username);
    return true;
  }

  getValue(): string {
    return this.value;
  }

  equals(username: Username): boolean {
    return this.value === username.getValue();
  }
}
