import { Prisma } from "@prisma/client";

export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) => {
      if (currentValue instanceof Prisma.Decimal) {
        return currentValue.toNumber();
      }

      if (currentValue instanceof Date) {
        return currentValue.toISOString();
      }

      return currentValue;
    })
  ) as T;
}
