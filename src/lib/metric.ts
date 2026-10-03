import type { RegionStat } from "./stats";

export type Metric = "unit" | "box6";

export const METRIC_FACTOR: Record<Metric, number> = {
    unit: 1,
    box6: 6,
};

export const METRIC_LABEL: Record<Metric, string> = {
    unit: "每顆單價",
    box6: "一盒 6 顆",
};

export const METRIC_UNIT: Record<Metric, string> = {
    unit: "元／顆",
    box6: "元／盒",
};

export function scaleStats(
    stats: Map<string, RegionStat>,
    factor: number,
): Map<string, RegionStat> {
    const result = new Map<string, RegionStat>();
    for (const [key, stat] of stats) {
        result.set(key, {
            avg: stat.avg * factor,
            median: stat.median * factor,
            sampleCount: stat.sampleCount,
        });
    }
    return result;
}
