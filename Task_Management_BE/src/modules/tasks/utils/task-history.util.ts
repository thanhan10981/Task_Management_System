import { Prisma } from '@prisma/client';

type RawHistoryChange = {
  old: unknown;
  new: unknown;
};

function toHistoryValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toHistoryValue(item)) as Prisma.InputJsonArray;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const jsonObject: Record<string, Prisma.InputJsonValue> = {};

    for (const [key, nestedValue] of Object.entries(record)) {
      const normalizedValue = toHistoryValue(nestedValue);
      if (normalizedValue !== null) {
        jsonObject[key] = normalizedValue;
      }
    }

    return jsonObject as Prisma.InputJsonObject;
  }

  return String(value);
}

export function buildTaskHistoryMetadata(
  changes: Record<string, RawHistoryChange>,
): Prisma.InputJsonObject {
  const metadata: Record<string, Prisma.InputJsonValue> = {};

  for (const [field, change] of Object.entries(changes)) {
    metadata[field] = {
      old: toHistoryValue(change.old),
      new: toHistoryValue(change.new),
    };
  }

  return metadata as Prisma.InputJsonObject;
}
