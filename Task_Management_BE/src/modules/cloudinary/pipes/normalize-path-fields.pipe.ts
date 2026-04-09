import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NormalizePathFieldsPipe<T extends Record<string, unknown>>
  implements PipeTransform<T, T>
{
  constructor(private readonly fields: string[]) {}

  transform(value: T): T {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const normalized: Record<string, unknown> = { ...value };

    for (const field of this.fields) {
      const fieldValue = normalized[field];
      if (typeof fieldValue === 'string') {
        normalized[field] = fieldValue.trim().replace(/^\/+|\/+$/g, '');
      }
    }

    return normalized as T;
  }
}
