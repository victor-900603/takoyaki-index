import { describe, expect, it } from "vitest";
import { METRIC_FACTOR, scaleStats } from "./metric";
import type { RegionStat } from "./stats";

describe("scaleStats", () => {
    it("以係數換算平均與中位數，樣本數不變", () => {
        const stats = new Map<string, RegionStat>([
            ["台北市", { avg: 10, median: 9, sampleCount: 3 }],
        ]);

        const scaled = scaleStats(stats, METRIC_FACTOR.box6);
        expect(scaled.get("台北市")).toEqual({
            avg: 60,
            median: 54,
            sampleCount: 3,
        });
    });

    it("係數為 1 時數值不變", () => {
        const stats = new Map<string, RegionStat>([
            ["高雄市", { avg: 9.5, median: 9, sampleCount: 4 }],
        ]);

        const scaled = scaleStats(stats, METRIC_FACTOR.unit);
        expect(scaled.get("高雄市")).toEqual({
            avg: 9.5,
            median: 9,
            sampleCount: 4,
        });
    });

    it("不修改來源 Map", () => {
        const stats = new Map<string, RegionStat>([
            ["台中市", { avg: 11, median: 11, sampleCount: 2 }],
        ]);

        scaleStats(stats, METRIC_FACTOR.box6);
        expect(stats.get("台中市")?.avg).toBe(11);
    });
});
