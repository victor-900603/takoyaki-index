import { describe, expect, it } from "vitest";
import { dedupeShops, validateShops, type RegionIndex } from "./shopData";
import type { Shop } from "./shops";

const regions: RegionIndex = {
    counties: new Set(["台北市"]),
    districts: new Set(["台北市|中山區", "台北市|大安區"]),
};

function shop(overrides: Partial<Shop> = {}): Shop {
    return {
        place_id: "p1",
        name: "章魚燒店",
        county: "台北市",
        district: "中山區",
        prices: [
            {
                box_price: 60,
                pieces_per_box: 6,
                observed_at: "2026-01-01",
                source: "test",
            },
        ],
        ...overrides,
    };
}

describe("dedupeShops", () => {
    it("合併相同 place_id 的價格並依日期排序", () => {
        const result = dedupeShops([
            shop({
                prices: [
                    {
                        box_price: 66,
                        pieces_per_box: 6,
                        observed_at: "2026-03-01",
                        source: "a",
                    },
                ],
            }),
            shop({
                prices: [
                    {
                        box_price: 54,
                        pieces_per_box: 6,
                        observed_at: "2026-01-01",
                        source: "b",
                    },
                ],
            }),
        ]);

        expect(result.shops).toHaveLength(1);
        expect(result.shops[0].prices.map((p) => p.observed_at)).toEqual([
            "2026-01-01",
            "2026-03-01",
        ]);
        expect(result.warnings).toHaveLength(1);
    });

    it("相同 observed_at 時以較晚出現者為準", () => {
        const result = dedupeShops([
            shop({
                prices: [
                    {
                        box_price: 60,
                        pieces_per_box: 6,
                        observed_at: "2026-01-01",
                        source: "old",
                    },
                ],
            }),
            shop({
                prices: [
                    {
                        box_price: 72,
                        pieces_per_box: 6,
                        observed_at: "2026-01-01",
                        source: "new",
                    },
                ],
            }),
        ]);

        expect(result.shops[0].prices).toHaveLength(1);
        expect(result.shops[0].prices[0].box_price).toBe(72);
        expect(result.shops[0].prices[0].source).toBe("new");
    });

    it("依 place_id 排序輸出", () => {
        const result = dedupeShops([
            shop({ place_id: "p3", name: "丙" }),
            shop({ place_id: "p1", name: "甲" }),
            shop({ place_id: "p2", name: "乙" }),
        ]);

        expect(result.shops.map((s) => s.place_id)).toEqual(["p1", "p2", "p3"]);
    });

    it("同名不同 place_id 產生警告但不合併", () => {
        const result = dedupeShops([
            shop({ place_id: "p1", name: "連鎖章魚燒" }),
            shop({ place_id: "p2", name: "連鎖章魚燒" }),
        ]);

        expect(result.shops).toHaveLength(2);
        expect(result.warnings).toEqual([
            "同名不同 place_id：連鎖章魚燒（p1, p2）",
        ]);
    });
});

describe("validateShops", () => {
    it("合法資料回傳空陣列", () => {
        expect(validateShops([shop()], regions)).toEqual([]);
    });

    it("缺少 place_id 與 name", () => {
        const errors = validateShops(
            [shop({ place_id: "", name: "" })],
            regions,
        );
        expect(errors).toContain("#0：缺少 place_id");
        expect(errors).toContain("#0：缺少 name");
    });

    it("行政區不存在於圖資", () => {
        const errors = validateShops(
            [shop({ county: "不存在市", district: "不存在區" })],
            regions,
        );
        expect(errors).toContain("p1：county 不存在（不存在市）");
        expect(errors).toContain("p1：district 不存在（不存在市|不存在區）");
    });

    it("價格非正數", () => {
        const errors = validateShops(
            [
                shop({
                    prices: [
                        {
                            box_price: 0,
                            pieces_per_box: 0,
                            observed_at: "2026-01-01",
                            source: "test",
                        },
                    ],
                }),
            ],
            regions,
        );
        expect(errors).toContain("p1 價格#0：box_price 需大於 0");
        expect(errors).toContain("p1 價格#0：pieces_per_box 需大於 0");
    });

    it("沒有價格紀錄", () => {
        expect(validateShops([shop({ prices: [] })], regions)).toContain(
            "p1：沒有價格紀錄",
        );
    });

    it("非法日期", () => {
        const errors = validateShops(
            [
                shop({
                    prices: [
                        {
                            box_price: 60,
                            pieces_per_box: 6,
                            observed_at: "2026-02-30",
                            source: "test",
                        },
                    ],
                }),
            ],
            regions,
        );
        expect(errors).toContain("p1 價格#0：observed_at 非合法日期（2026-02-30）");
    });
});
