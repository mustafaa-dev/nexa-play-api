import { StorageService } from '@infrastructure/storage/storage.service';

export class GlobalProvider {
  private static storageService: StorageService;
  private static locale: 'ar' | 'en' = 'ar';

  static getStorageService(): StorageService {
    if (!GlobalProvider.storageService) {
      throw new Error('StorageService is not initialized.');
    }
    return GlobalProvider.storageService;
  }

  static setStorageService(storageService: StorageService) {
    GlobalProvider.storageService = storageService;
  }

  // static getLocale(): 'ar' | 'en' {
  //   return GlobalProvider.locale;
  // }

  static setLocale(locale: 'ar' | 'en') {
    GlobalProvider.locale = locale;
  }
}
