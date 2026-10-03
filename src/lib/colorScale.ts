import { scaleQuantile, scaleThreshold } from "d3-scale";
import { quantile } from "./quantile";
import type { RegionStat } from "./stats";

export const NO_DATA_COLOR = "#e0d7c6";
export const LOW_SAMPLE_COLOR = "#c9bfae";
export const MIN_SAMPLE = 3;

export const LEVEL_COLORS = [
    "#fbe7c2",
    "#f4cd8a",
    "#e7ab4e",
    "#cd7f2a",
    "#a9581b",
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
                return scale(stat.median);
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
        if (stat.sampleCount >= MIN_SAMPLE) values.push(stat.median);
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
        { value: quantile(values, 0.05), position: 0 },
        ...thresholds.map((value, index) => ({
            value,
            position: (index + 1) / colors.length,
        })),
        { value: quantile(values, 0.95), position: 1 },
    ];

    return {
        colorFor: (stat) => {
            if (!stat) return NO_DATA_COLOR;
            if (stat.sampleCount < MIN_SAMPLE) return LOW_SAMPLE_COLOR;
            return scale(stat.median);
        },
        colors,
        legendTicks,
    };
}
