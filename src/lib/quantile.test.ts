import { describe, expect, it } from "vitest";
import { quantile } from "./quantile";

describe("quantile", () => {
    it("取中位數", () => {
        expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
        expect(quantile([1, 2, 3], 0.5)).toBe(2);
    });

    it("以線性插值計算任意分位", () => {
        expect(quantile([0, 10], 0.25)).toBe(2.5);
        expect(quantile([8, 9, 10, 11, 12], 0.05)).toBeCloseTo(8.2, 5);
    });

    it("p 為 0 與 1 時取最小與最大值", () => {
        expect(quantile([5, 3, 9], 0)).toBe(3);
        expect(quantile([5, 3, 9], 1)).toBe(9);
    });

    it("空陣列回傳 NaN", () => {
        expect(Number.isNaN(quantile([], 0.5))).toBe(true);
    });
});
