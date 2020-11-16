/** Return Percent */
export const diff = (oldValue: number | undefined, newValue: number): number => {
  if (!oldValue || isNaN(oldValue) || isNaN(newValue)) {
    return NaN;
  }
  return ((newValue - oldValue) / oldValue) * 100;
};
