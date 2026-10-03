import { describe, expect, it } from "vitest";
import {
    buildColorScale,
    DEFAULT_FIXED_BREAKS,
    LEVEL_COLORS,
    LOW_SAMPLE_COLOR,
    MIN_SAMPLE,
    NO_DATA_COLOR,
} from "./colorScale";
import type { RegionStat } from "./stats";

function stat(value: number, sampleCount = MIN_SAMPLE): RegionStat {
    return {
        avg: value,
        median: value,
        sampleCount,
        min: value,
        max: value,
    };
}

const sampleStats = new Map<string, RegionStat>([
    ["a", stat(8)],
    ["b", stat(9)],
    ["c", stat(10)],
    ["d", stat(11)],
    ["e", stat(12)],
]);

describe("buildColorScale 分位模式", () => {
    it("沒有資料的區域回傳無資料色", () => {
        const scale = buildColorScale(new Map());
        expect(scale.colorFor(undefined)).toBe(NO_DATA_COLOR);
    });

    it("樣本數不足的區域回傳低樣本色", () => {
        const scale = buildColorScale(new Map([["台北市", stat(10, 2)]]));
        expect(scale.colorFor(stat(10, 2))).toBe(LOW_SAMPLE_COLOR);
    });

    it("足夠樣本依分位對應到色階兩端", () => {
        const scale = buildColorScale(sampleStats);
        expect(scale.colorFor(stat(8))).toBe(LEVEL_COLORS[0]);
        expect(scale.colorFor(stat(12))).toBe(LEVEL_COLORS[4]);
    });

    it("以中位數而非平均決定顏色", () => {
        const scale = buildColorScale(sampleStats);
        const skewed: RegionStat = {
            avg: 30,
            median: 8,
            sampleCount: 3,
            min: 8,
            max: 30,
        };
        expect(scale.colorFor(skewed)).toBe(LEVEL_COLORS[0]);
    });

    it("刻度含穩健的範圍兩端與色階數減一的交界", () => {
        const ticks = buildColorScale(sampleStats).legendTicks;
        expect(ticks).toHaveLength(LEVEL_COLORS.length + 1);
        expect(ticks[0].value).toBeCloseTo(8.2, 5);
        expect(ticks[0].position).toBe(0);
        expect(ticks[ticks.length - 1].value).toBeCloseTo(11.8, 5);
        expect(ticks[ticks.length - 1].position).toBe(1);
        expect(ticks.slice(1, -1)).toHaveLength(LEVEL_COLORS.length - 1);
    });

    it("極端中位數不會撐開刻度端點", () => {
        const stats = new Map<string, RegionStat>([
            ["a", stat(8)],
            ["b", stat(9)],
            ["c", stat(10)],
            ["d", stat(11)],
            ["e", stat(100)],
        ]);
        const ticks = buildColorScale(stats).legendTicks;
        const last = ticks[ticks.length - 1].value;
        expect(last).toBeGreaterThan(11);
        expect(last).toBeLessThan(100);
    });

    it("無足夠樣本時不顯示刻度", () => {
        expect(buildColorScale(new Map()).legendTicks).toEqual([]);
        expect(
            buildColorScale(new Map([["台北市", stat(10, 1)]])).legendTicks,
        ).toEqual([]);
    });

    it("全部樣本不足時，已知區域仍為低樣本色", () => {
        const scale = buildColorScale(new Map([["台北市", stat(10, 1)]]));
        expect(scale.colorFor(stat(10, 1))).toBe(LOW_SAMPLE_COLOR);
        expect(scale.colorFor(undefined)).toBe(NO_DATA_COLOR);
    });
});

describe("buildColorScale 固定級距模式", () => {
    it("依切點對應到色階", () => {
        const scale = buildColorScale(new Map(), { mode: "fixed" });
        expect(scale.colorFor(stat(7))).toBe(LEVEL_COLORS[0]);
        expect(scale.colorFor(stat(9))).toBe(LEVEL_COLORS[1]);
        expect(scale.colorFor(stat(11))).toBe(LEVEL_COLORS[2]);
        expect(scale.colorFor(stat(13))).toBe(LEVEL_COLORS[3]);
        expect(scale.colorFor(stat(20))).toBe(LEVEL_COLORS[4]);
    });

    it("以中位數而非平均決定顏色", () => {
        const scale = buildColorScale(new Map(), { mode: "fixed" });
        const skewed: RegionStat = {
            avg: 30,
            median: 7,
            sampleCount: 3,
            min: 7,
            max: 30,
        };
        expect(scale.colorFor(skewed)).toBe(LEVEL_COLORS[0]);
    });

    it("刻度為各切點，位置平均分佈於色帶交界", () => {
        const ticks = buildColorScale(new Map(), { mode: "fixed" }).legendTicks;
        expect(ticks).toEqual([
            { value: 8, position: 0.2 },
            { value: 10, position: 0.4 },
            { value: 12, position: 0.6 },
            { value: 15, position: 0.8 },
        ]);
    });

    it("可自訂切點", () => {
        const scale = buildColorScale(new Map(), {
            mode: "fixed",
            fixedBreaks: [50, 60, 70, 80],
        });
        expect(scale.colorFor(stat(55))).toBe(LEVEL_COLORS[1]);
        expect(scale.legendTicks.map((tick) => tick.value)).toEqual([
            50, 60, 70, 80,
        ]);
    });

    it("低樣本與無資料仍套用灰色", () => {
        const scale = buildColorScale(new Map(), { mode: "fixed" });
        expect(scale.colorFor(stat(9, 1))).toBe(LOW_SAMPLE_COLOR);
        expect(scale.colorFor(undefined)).toBe(NO_DATA_COLOR);
    });

    it("預設切點維持每顆單價級距", () => {
        expect(DEFAULT_FIXED_BREAKS).toEqual([8, 10, 12, 15]);
    });
});
