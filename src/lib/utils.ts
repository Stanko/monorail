import { MinMax } from './monorail';

export const getScales = (
  height: number,
  minMaxValues: Record<string, MinMax>
): Record<string, number> => {
  const scales: Record<string, number> = {};

  // Calculate individual scales for each data series
  Object.keys(minMaxValues).forEach((key) => {
    // max is always positive
    // min can be zero or negative
    const { min, max } = minMaxValues[key];

    const roundedMin = roundToNiceValue(min) || 1; // Round down for min
    const roundedMax = roundToNiceValue(max) || 1; // Round up for max

    scales[key] = Math.min(height / roundedMax, Math.abs(height / roundedMin));
  });

  return scales;
};

export function roundToNiceValue(value: number): number {
  if (value === 0) {
    return 0;
  }

  const sign = value < 0 ? -1 : 1;
  const absValue = Math.abs(value);

  if (absValue < 10) {
    const thresholds = [0.5, 1, 5, 10];

    for (let i = 0; i < thresholds.length; i++) {
      const threshold = thresholds[i];

      if (absValue <= threshold) {
        return sign * threshold;
      }
    }

    return sign * 10;
  }

  // Determine the magnitude (power of 10)
  const log10 = Math.log(absValue) / Math.log(10);
  const magnitude = Math.floor(log10);
  const pow10 = Math.pow(10, magnitude);

  // Normalized value between 1 and 10
  const normalized = absValue / pow10;

  // Calculate nice value based on normalized range
  const thresholds = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  for (let i = 0; i < thresholds.length; i++) {
    const threshold = thresholds[i];

    // <= threshold leaves no padding
    if (normalized <= threshold) {
      return threshold * pow10;
    }
  }

  return 10 * pow10;
}
