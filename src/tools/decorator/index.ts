export const decorateUnit = (value: number, unit: string): string => {
  return `${value.toFixed(2)} ${unit}`;
};

export const decorateDiffText = (value: number, unit: string): string => {
  if (isNaN(value)) {
    return "NaN";
  }
  if (value > 0) {
    return `**🔺+${value.toFixed(2)} ${unit}**`;
  } else if (value < 0) {
    return `**👍${value.toFixed(2)} ${unit}**`;
  }
  return `${value.toFixed(2)} ${unit}`;
};
