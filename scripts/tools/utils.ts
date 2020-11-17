export const s = (name: string, value: unknown): string => {
  if (typeof value !== "string") {
    throw new TypeError(`${name} value of "${value}" is not string.`);
  }
  return value;
};

export const i = (name: string, value: unknown): number => {
  if (typeof value !== "string") {
    throw new TypeError(`${name} value of "${value}" is not string.`);
  }
  return parseInt(value, 10);
};
