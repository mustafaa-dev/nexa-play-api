import { LocalizedInvalidInputException } from '@infrastructure/i18n';

export class PhoneNumber {
  private readonly value: string;

  constructor(phoneNumber: string) {
    if (!this.isValid()) {
      throw new LocalizedInvalidInputException('phone_number');
    }
    this.value = phoneNumber.trim();
  }

  // private isValid(username: string): boolean {
  private isValid(): boolean {
    // Basic phone number validation regex
    // const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/;
    // return phoneNumberRegex.test(this.value);
    return true;
  }

  getValue(): string {
    return this.value;
  }

  equals(phoneNumber: PhoneNumber): boolean {
    return this.value === phoneNumber.getValue();
  }
}
