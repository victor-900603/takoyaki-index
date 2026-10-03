import { describe, expect, it } from "vitest";
import { unitPrice, type PriceRecord, type Shop } from "./shops";
import { aggregateByCounty, aggregateByDistrict } from "./stats";

function record(
    box_price: number,
    observed_at = "2026-09-01",
): PriceRecord {
    return {
        box_price,
        pieces_per_box: 6,
        observed_at,
        source: "test",
    };
}

function shop(
    county: string,
    prices: PriceRecord[],
    place_id = county,
    district = "區",
): Shop {
    return {
        place_id,
        name: `${county}店`,
        county,
        district,
        prices,
    };
}

describe("unitPrice", () => {
    it("以盒價除以每盒顆數計算單價", () => {
        expect(unitPrice(record(60))).toBe(10);
    });
});

describe("aggregateByCounty", () => {
    it("計算平均、中位數與樣本數", () => {
        const shops = [
            shop("台北市", [record(60)], "a"),
            shop("台北市", [record(72)], "b"),
            shop("台北市", [record(84)], "c"),
            shop("高雄市", [record(54)], "d"),
        ];

        const stats = aggregateByCounty(shops);
        expect(stats.get("台北市")).toEqual({
            avg: 12,
            median: 12,
            sampleCount: 3,
        });
        expect(stats.get("高雄市")).toEqual({
            avg: 9,
            median: 9,
            sampleCount: 1,
        });
    });

    it("取每間店最新一筆價格紀錄", () => {
        const shops = [
            shop(
                "台中市",
                [record(48, "2026-01-01"), record(72, "2026-08-01")],
                "e",
            ),
        ];

        expect(aggregateByCounty(shops).get("台中市")).toEqual({
            avg: 12,
            median: 12,
            sampleCount: 1,
        });
    });

    it("無價格紀錄的店家不列入統計", () => {
        const shops = [shop("台南市", [], "f")];
        expect(aggregateByCounty(shops).has("台南市")).toBe(false);
    });

    it("偶數筆樣本的中位數取中間兩筆平均", () => {
        const shops = [
            shop("新竹市", [record(60)], "g"),
            shop("新竹市", [record(72)], "h"),
        ];

        expect(aggregateByCounty(shops).get("新竹市")).toEqual({
            avg: 11,
            median: 11,
            sampleCount: 2,
        });
    });
});

describe("aggregateByDistrict", () => {
    it("只統計指定縣市並以鄉鎮市區分組", () => {
        const shops = [
            shop("台北市", [record(60)], "a", "中山區"),
            shop("台北市", [record(72)], "b", "中山區"),
            shop("台北市", [record(84)], "c", "大安區"),
            shop("高雄市", [record(54)], "d", "苓雅區"),
        ];

        const stats = aggregateByDistrict(shops, "台北市");
        expect(stats.get("中山區")).toEqual({
            avg: 11,
            median: 11,
            sampleCount: 2,
        });
        expect(stats.get("大安區")).toEqual({
            avg: 14,
            median: 14,
            sampleCount: 1,
        });
        expect(stats.has("苓雅區")).toBe(false);
    });

    it("同名鄉鎮市區不跨縣市合併", () => {
        const shops = [
            shop("台北市", [record(60)], "a", "中正區"),
            shop("基隆市", [record(90)], "b", "中正區"),
        ];

        expect(aggregateByDistrict(shops, "台北市").get("中正區")).toEqual({
            avg: 10,
            median: 10,
            sampleCount: 1,
        });
    });

    it("無價格紀錄的店家不列入統計", () => {
        const shops = [shop("台北市", [], "a", "信義區")];
        expect(aggregateByDistrict(shops, "台北市").has("信義區")).toBe(false);
    });
});
