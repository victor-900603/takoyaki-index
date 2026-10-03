import { describe, expect, it } from "vitest";
import { METRIC_FACTOR, scaleStat, scaleStats } from "./metric";
import type { RegionStat } from "./stats";

describe("scaleStats", () => {
    it("以係數換算平均、中位數與範圍，樣本數不變", () => {
        const stats = new Map<string, RegionStat>([
            ["台北市", { avg: 10, median: 9, sampleCount: 3, min: 8, max: 9 }],
        ]);

        const scaled = scaleStats(stats, METRIC_FACTOR.box6);
        expect(scaled.get("台北市")).toEqual({
            avg: 60,
            median: 54,
            sampleCount: 3,
            min: 48,
            max: 54,
        });
    });

    it("係數為 1 時數值不變", () => {
        const stats = new Map<string, RegionStat>([
            ["高雄市", { avg: 9.5, median: 9, sampleCount: 4, min: 8, max: 11 }],
        ]);

        const scaled = scaleStats(stats, METRIC_FACTOR.unit);
        expect(scaled.get("高雄市")).toEqual({
            avg: 9.5,
            median: 9,
            sampleCount: 4,
            min: 8,
            max: 11,
        });
    });

    it("不修改來源 Map", () => {
        const stats = new Map<string, RegionStat>([
            ["台中市", { avg: 11, median: 11, sampleCount: 2, min: 10, max: 12 }],
        ]);

        scaleStats(stats, METRIC_FACTOR.box6);
        expect(stats.get("台中市")?.avg).toBe(11);
    });
});

describe("scaleStat", () => {
    it("以係數換算單筆統計，樣本數不變", () => {
        const stat: RegionStat = {
            avg: 11,
            median: 10,
            sampleCount: 4,
            min: 9,
            max: 13,
        };

        expect(scaleStat(stat, METRIC_FACTOR.box6)).toEqual({
            avg: 66,
            median: 60,
            sampleCount: 4,
            min: 54,
            max: 78,
        });
    });
});
