import { describe, expect, it } from "vitest";
import {
    buildColorScale,
    LEVEL_COLORS,
    LOW_SAMPLE_COLOR,
    MIN_SAMPLE,
    NO_DATA_COLOR,
} from "./colorScale";
import type { RegionStat } from "./stats";

function stat(avg: number, sampleCount = MIN_SAMPLE): RegionStat {
    return { avg, median: avg, sampleCount };
}

describe("buildColorScale", () => {
    it("沒有資料的區域回傳無資料色", () => {
        const scale = buildColorScale(new Map());
        expect(scale.colorFor(undefined)).toBe(NO_DATA_COLOR);
    });

    it("樣本數不足的區域回傳低樣本色", () => {
        const scale = buildColorScale(new Map([["台北市", stat(10, 2)]]));
        expect(scale.colorFor(stat(10, 2))).toBe(LOW_SAMPLE_COLOR);
    });

    it("足夠樣本依分位對應到色階兩端", () => {
        const stats = new Map<string, RegionStat>([
            ["a", stat(8)],
            ["b", stat(9)],
            ["c", stat(10)],
            ["d", stat(11)],
            ["e", stat(12)],
        ]);

        const scale = buildColorScale(stats);
        expect(scale.colorFor(stat(8))).toBe(LEVEL_COLORS[0]);
        expect(scale.colorFor(stat(12))).toBe(LEVEL_COLORS[4]);
    });

    it("分位門檻數為色階數減一", () => {
        const stats = new Map<string, RegionStat>([
            ["a", stat(8)],
            ["b", stat(9)],
            ["c", stat(10)],
            ["d", stat(11)],
            ["e", stat(12)],
        ]);

        expect(buildColorScale(stats).thresholds).toHaveLength(
            LEVEL_COLORS.length - 1,
        );
    });

    it("全部樣本不足時，已知區域仍為低樣本色", () => {
        const scale = buildColorScale(new Map([["台北市", stat(10, 1)]]));
        expect(scale.colorFor(stat(10, 1))).toBe(LOW_SAMPLE_COLOR);
        expect(scale.colorFor(undefined)).toBe(NO_DATA_COLOR);
    });
});
