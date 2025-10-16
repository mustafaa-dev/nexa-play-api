import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';

const MAX_IMAGE_SIZE = 1024 * 1024;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'jfif'];
const FILE_TYPES = ['pdf', 'vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const isSupportedFile = (mimeType: string, size: number) => {
  return (
    (FILE_TYPES.some(type => mimeType.includes(type)) && size < MAX_FILE_SIZE) ||
    (IMAGE_TYPES.some(type => mimeType.includes(type)) && size < MAX_IMAGE_SIZE)
  );
};

const generateRandomString = () => {
  let result = '';
  const len = 16;

  while (result.length < len) {
    const size = len - result.length;
    const bytesSize = Math.ceil(size / 3) * 3;

    const bytes = randomBytes(bytesSize);
    const base64String = bytes.toString('base64').replace(/[\/+=]/g, '');
    result += base64String.substring(0, size);
  }
  return result;
};

export function prepareFileForUpload(file: Express.Multer.File) {
  if (isSupportedFile(file.mimetype, file.size)) {
    const key = generateRandomString();
    const ext = file.originalname.split('.').pop();
    return {
      key: `${key}.${ext}`,
      body: Buffer.from(file.buffer),
    };
  } else throw new BadRequestException('File is not supported');
}
