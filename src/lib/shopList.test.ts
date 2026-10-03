import { describe, expect, it } from "vitest";
import type { Shop } from "./shops";
import {
    filterShops,
    mapsSearchUrl,
    searchShops,
    sortShops,
} from "./shopList";

function shop(
    name: string,
    county: string,
    district: string,
    boxPrice = 60,
    piecesPerBox = 6,
): Shop {
    return {
        place_id: `id-${name}`,
        name,
        county,
        district,
        prices: [
            {
                box_price: boxPrice,
                pieces_per_box: piecesPerBox,
                observed_at: "2026-10-01",
                source: "test",
            },
        ],
    };
}

const shops: Shop[] = [
    shop("甲章魚燒", "台北市", "大安區", 60),
    shop("乙章魚燒", "台北市", "中山區", 72),
    shop("丙章魚燒", "高雄市", "苓雅區", 48),
    shop("丁章魚燒", "台北市", "大安區", 90),
];

describe("filterShops", () => {
    it("縣市層回傳全部店家", () => {
        expect(filterShops(shops, { level: "county" })).toHaveLength(4);
    });

    it("鄉鎮層指定行政區只回傳該區", () => {
        const result = filterShops(shops, {
            level: "town",
            county: "台北市",
            district: "大安區",
        });
        expect(result.map((s) => s.name)).toEqual(["甲章魚燒", "丁章魚燒"]);
    });

    it("鄉鎮層未指定行政區回傳該縣市全部", () => {
        const result = filterShops(shops, {
            level: "town",
            county: "台北市",
            district: null,
        });
        expect(result.map((s) => s.name)).toEqual([
            "甲章魚燒",
            "乙章魚燒",
            "丁章魚燒",
        ]);
    });
});

describe("sortShops", () => {
    it("依每顆單價由低到高排序", () => {
        const result = sortShops(shops, "unitPrice");
        expect(result.map((s) => s.name)).toEqual([
            "丙章魚燒",
            "甲章魚燒",
            "乙章魚燒",
            "丁章魚燒",
        ]);
    });

    it("同價時依店名排序，無價格者排最後", () => {
        const withTie: Shop[] = [
            shop("B", "台北市", "大安區", 60),
            shop("A", "台北市", "大安區", 60),
            { ...shop("C", "台北市", "大安區"), prices: [] },
        ];
        const result = sortShops(withTie, "unitPrice");
        expect(result.map((s) => s.name)).toEqual(["A", "B", "C"]);
    });

    it("依店名排序", () => {
        const named: Shop[] = [
            shop("C", "台北市", "大安區"),
            shop("A", "台北市", "大安區"),
            shop("B", "台北市", "大安區"),
        ];
        const result = sortShops(named, "name");
        expect(result.map((s) => s.name)).toEqual(["A", "B", "C"]);
    });
});

describe("mapsSearchUrl", () => {
    it("以店名與地區組成搜尋連結並編碼", () => {
        const url = mapsSearchUrl(shops[0]);
        expect(url).toBe(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                "甲章魚燒 台北市大安區",
            )}`,
        );
    });
});

describe("searchShops", () => {
    it("空字串回傳全部店家", () => {
        expect(searchShops(shops, "")).toHaveLength(4);
        expect(searchShops(shops, "   ")).toHaveLength(4);
    });

    it("依店名部分比對並忽略前後空白", () => {
        const result = searchShops(shops, "  甲 ");
        expect(result.map((s) => s.name)).toEqual(["甲章魚燒"]);
    });

    it("比對忽略大小寫", () => {
        const named: Shop[] = [shop("Takoyaki A", "台北市", "大安區")];
        expect(searchShops(named, "takoyaki")).toHaveLength(1);
    });

    it("無符合時回傳空陣列", () => {
        expect(searchShops(shops, "壽司")).toEqual([]);
    });
});
