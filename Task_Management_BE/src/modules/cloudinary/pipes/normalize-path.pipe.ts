import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizePathPipe implements PipeTransform<unknown, string> {
  transform(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Path must be a string');
    }

    return value.trim().replace(/^\/+|\/+$/g, '');
  }
}
