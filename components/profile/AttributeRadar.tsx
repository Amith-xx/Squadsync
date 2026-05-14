"use client";

import type { PlayerAttributes } from "@/types";

// TODO (Day 5): Render a radar/spider chart using recharts or a canvas solution
export interface AttributeRadarProps {
  attributes: PlayerAttributes;
}

const ATTRIBUTE_LABELS: Array<keyof PlayerAttributes> = [
  "pace",
  "shooting",
  "passing",
  "defending",
  "physical",
];

export function AttributeRadar({ attributes }: AttributeRadarProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">Attributes</h3>
      <ul className="space-y-2">
        {ATTRIBUTE_LABELS.map((attr) => (
          <li key={attr} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 capitalize">{attr}</span>
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${attributes[attr]}%` }}
              />
            </div>
            <span className="text-xs font-mono w-8 text-right">{attributes[attr]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
