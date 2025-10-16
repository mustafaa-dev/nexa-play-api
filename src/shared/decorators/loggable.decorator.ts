import { SetMetadata } from '@nestjs/common';

export const LOGGABLE_KEY = 'loggable';
export const Loggable = () => SetMetadata(LOGGABLE_KEY, true);
