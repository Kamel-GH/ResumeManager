export type MeasurementUnit = "px" | "mm" | "cm" | "pt" | "in";

type MeasurementUnitDefinition = {
  value: MeasurementUnit;
  label: string;
  suffix: string;
  pixelsPerUnit: number;
};

const measurementUnitDefinitions: MeasurementUnitDefinition[] = [
  { value: "px", label: "Pixels (px)", suffix: "px", pixelsPerUnit: 1 },
  { value: "mm", label: "Millimètres (mm)", suffix: "mm", pixelsPerUnit: 96 / 25.4 },
  { value: "cm", label: "Centimètres (cm)", suffix: "cm", pixelsPerUnit: 96 / 2.54 },
  { value: "pt", label: "Points (pt)", suffix: "pt", pixelsPerUnit: 96 / 72 },
  { value: "in", label: "Pouces (in)", suffix: "in", pixelsPerUnit: 96 },
];

export const measurementUnitOptions = measurementUnitDefinitions.map(({ value, label }) => ({
  value,
  label,
}));

export function getMeasurementUnitDefinition(unit: MeasurementUnit): MeasurementUnitDefinition {
  return (
    measurementUnitDefinitions.find((definition) => definition.value === unit) ??
    measurementUnitDefinitions[0]
  );
}

export function getMeasurementUnitLabel(unit: MeasurementUnit): string {
  return getMeasurementUnitDefinition(unit).label;
}

export function getMeasurementUnitSuffix(unit: MeasurementUnit): string {
  return getMeasurementUnitDefinition(unit).suffix;
}

export function convertMeasurementValue(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const fromPixelsPerUnit = getMeasurementUnitDefinition(fromUnit).pixelsPerUnit;
  const toPixelsPerUnit = getMeasurementUnitDefinition(toUnit).pixelsPerUnit;
  const valueInPx = value * fromPixelsPerUnit;
  return valueInPx / toPixelsPerUnit;
}

export function formatMeasurementValue(
  valuePx: number,
  unit: MeasurementUnit,
  maximumFractionDigits = 2,
): string {
  const convertedValue = convertMeasurementValue(valuePx, "px", unit);
  return formatRoundedNumber(convertedValue, maximumFractionDigits);
}

export function formatRoundedNumber(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const rounded = roundToFractionDigits(value, maximumFractionDigits);
  if (maximumFractionDigits <= 0) {
    return String(Math.round(rounded));
  }

  return rounded
    .toFixed(maximumFractionDigits)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

export function roundToFractionDigits(value: number, maximumFractionDigits = 2): number {
  const precision = Math.max(0, maximumFractionDigits);
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function sanitizeMeasurementDraft(input: string, maximumFractionDigits = 2): string {
  const normalized = input.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const dotIndex = normalized.indexOf(".");

  if (dotIndex < 0) {
    return normalized;
  }

  const whole = normalized.slice(0, dotIndex);
  const decimals = normalized
    .slice(dotIndex + 1)
    .replace(/\./g, "")
    .slice(0, Math.max(0, maximumFractionDigits));

  return `${whole || "0"}.${decimals}`;
}
