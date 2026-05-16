export const REGIONS: { code: string; label: string }[] = [
  { code: "london", label: "London" },
  { code: "manchester", label: "Manchester" },
  { code: "birmingham", label: "Birmingham" },
  { code: "leeds", label: "Leeds" },
  { code: "liverpool", label: "Liverpool" },
  { code: "glasgow", label: "Glasgow" },
  { code: "bristol", label: "Bristol" },
  { code: "edinburgh", label: "Edinburgh" },
  { code: "cardiff", label: "Cardiff" },
  { code: "other", label: "Other" },
];

export const REGION_CODES = REGIONS.map((r) => r.code);

export function getRegionLabel(code: string): string {
  return REGIONS.find((r) => r.code === code)?.label ?? code;
}
