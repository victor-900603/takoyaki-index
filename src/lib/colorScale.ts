import { scaleQuantile, scaleThreshold } from "d3-scale";
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

export const DEFAULT_FIXED_BREAKS = [8, 10, 12, 15];

export type ScaleMode = "quantile" | "fixed";

export interface LegendTick {
    value: number;
    position: number;
}

export interface ColorScale {
    colorFor(stat: RegionStat | undefined): string;
    colors: readonly string[];
    legendTicks: LegendTick[];
}

export interface ColorScaleOptions {
    mode?: ScaleMode;
    fixedBreaks?: number[];
}

export function buildColorScale(
    stats: Map<string, RegionStat>,
    options: ColorScaleOptions = {},
): ColorScale {
    const mode = options.mode ?? "quantile";
    const colors = LEVEL_COLORS;

    if (mode === "fixed") {
        const breaks = options.fixedBreaks ?? DEFAULT_FIXED_BREAKS;
        const scale = scaleThreshold<number, string>()
            .domain(breaks)
            .range([...LEVEL_COLORS]);
        return {
            colorFor: (stat) => {
                if (!stat) return NO_DATA_COLOR;
                if (stat.sampleCount < MIN_SAMPLE) return LOW_SAMPLE_COLOR;
                return scale(stat.avg);
            },
            colors,
            legendTicks: breaks.map((value, index) => ({
                value,
                position: (index + 1) / colors.length,
            })),
        };
    }

    const values: number[] = [];
    for (const stat of stats.values()) {
        if (stat.sampleCount >= MIN_SAMPLE) values.push(stat.avg);
    }

    if (values.length === 0) {
        return {
            colorFor: (stat) => (stat ? LOW_SAMPLE_COLOR : NO_DATA_COLOR),
            colors,
            legendTicks: [],
        };
    }

    const scale = scaleQuantile<string>()
        .domain(values)
        .range([...LEVEL_COLORS]);
    const thresholds = scale.quantiles();
    const legendTicks: LegendTick[] = [
        { value: Math.min(...values), position: 0 },
        ...thresholds.map((value, index) => ({
            value,
            position: (index + 1) / colors.length,
        })),
        { value: Math.max(...values), position: 1 },
    ];

    return {
        colorFor: (stat) => {
            if (!stat) return NO_DATA_COLOR;
            if (stat.sampleCount < MIN_SAMPLE) return LOW_SAMPLE_COLOR;
            return scale(stat.avg);
        },
        colors,
        legendTicks,
    };
}
