import { scaleQuantile } from "d3-scale";
import type { RegionStat } from "./stats";

export const NO_DATA_COLOR = "#d9d2c6";
export const LOW_SAMPLE_COLOR = "#c2b8a6";
export const MIN_SAMPLE = 3;

export const LEVEL_COLORS = [
    "#f6e6c9",
    "#f0cf94",
    "#e8b25f",
    "#d98b3a",
    "#b96520",
] as const;

export interface ColorScale {
    colorFor(stat: RegionStat | undefined): string;
    thresholds: number[];
    colors: readonly string[];
}

export function buildColorScale(stats: Map<string, RegionStat>): ColorScale {
    const values: number[] = [];
    for (const stat of stats.values()) {
        if (stat.sampleCount >= MIN_SAMPLE) values.push(stat.avg);
    }

    if (values.length === 0) {
        return {
            colorFor: (stat) =>
                stat ? LOW_SAMPLE_COLOR : NO_DATA_COLOR,
            thresholds: [],
            colors: LEVEL_COLORS,
        };
    }

    const scale = scaleQuantile<string>()
        .domain(values)
        .range([...LEVEL_COLORS]);

    return {
        colorFor: (stat) => {
            if (!stat) return NO_DATA_COLOR;
            if (stat.sampleCount < MIN_SAMPLE) return LOW_SAMPLE_COLOR;
            return scale(stat.avg);
        },
        thresholds: scale.quantiles(),
        colors: LEVEL_COLORS,
    };
}
