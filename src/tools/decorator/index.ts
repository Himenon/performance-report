export const decorateUnit = (value: number, unit: string): string => {
  if (isNaN(value)) {
    return "NaN";
  }
  return `${value.toFixed(2)} ${unit}`;
};

export const decorateDiffText = (value: number | undefined, unit: string): string => {
  if (value === undefined) {
    return "NaN";
  }
  if (isNaN(value)) {
    return "NaN";
  }
  if (value > 0) {
    return `**🔺 +${value.toFixed(2)} ${unit}**`;
  } else if (value < 0) {
    return `**👍 ${value.toFixed(2)} ${unit}**`;
  }
  return `${value.toFixed(2)} ${unit}`;
};
