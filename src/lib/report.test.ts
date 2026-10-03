import { describe, expect, it } from "vitest";
import {
    buildShop,
    extractMapRef,
    findTown,
    parseIssueBody,
    type ReportFields,
} from "./report";
import type { TownFeature } from "./taiwanGeo";

const body = [
    "### 店名",
    "",
    "章魚燒專賣店",
    "",
    "### Google Maps 連結",
    "",
    "https://www.google.com/maps/place/%E7%AB%A0%E9%AD%9A%E7%87%92/@25.0330,121.5654,17z/data=!3m1!4b1!1s0x3442a:0x1b2c3",
    "",
    "### 盒價（元）",
    "",
    "60",
    "",
    "### 每盒顆數",
    "",
    "6",
    "",
    "### 觀測日期",
    "",
    "2026-10-01",
    "",
    "### 備註",
    "",
    "_No response_",
].join("\n");

const town: TownFeature = {
    type: "Feature",
    properties: {
        COUNTYNAME: "台北市",
        COUNTYID: "1",
        COUNTYCODE: "63000",
        COUNTYENG: "Taipei",
        TOWNNAME: "大安區",
        TOWNID: "1-1",
        TOWNCODE: "63000010",
        TOWNENG: "Daan",
    },
    geometry: {
        type: "Polygon",
        coordinates: [
            [
                [121.5, 25.0],
                [121.5, 25.1],
                [121.6, 25.1],
                [121.6, 25.0],
                [121.5, 25.0],
            ],
        ],
    },
};

describe("parseIssueBody", () => {
    it("解析表單欄位並忽略 _No response_", () => {
        const { fields, errors } = parseIssueBody(body);
        expect(errors).toEqual([]);
        expect(fields.name).toBe("章魚燒專賣店");
        expect(fields.boxPrice).toBe("60");
        expect(fields.piecesPerBox).toBe("6");
        expect(fields.observedAt).toBe("2026-10-01");
        expect(fields.note).toBe("");
    });

    it("缺少店名與連結時回報錯誤", () => {
        const { errors } = parseIssueBody("### 盒價（元）\n\n60");
        expect(errors).toEqual(["缺少店名", "缺少 Google Maps 連結"]);
    });
});

describe("extractMapRef", () => {
    it("擷取座標與 FID", () => {
        const ref = extractMapRef(
            "https://www.google.com/maps/place/x/@25.0330,121.5654,17z/data=!1s0x3442a:0x1b2c3",
        );
        expect(ref).toEqual({ id: "0x3442a:0x1b2c3", lat: 25.033, lng: 121.5654 });
    });

    it("優先採用 place_id", () => {
        const ref = extractMapRef(
            "https://www.google.com/maps/@25.0,121.0,15z?q=place_id:ChIJabcdef-123",
        );
        expect(ref?.id).toBe("ChIJabcdef-123");
    });

    it("短連結無法取得座標時回傳 null", () => {
        expect(extractMapRef("https://maps.app.goo.gl/abcd1234")).toBeNull();
    });

    it("無識別碼時以座標作為鍵", () => {
        const ref = extractMapRef("https://www.google.com/maps/@24.5,120.5,15z");
        expect(ref?.id).toBe("coord:24.5,120.5");
    });
});

describe("findTown", () => {
    it("座標落在範圍內回傳該鄉鎮", () => {
        expect(findTown([town], 121.55, 25.05)?.properties.TOWNNAME).toBe(
            "大安區",
        );
    });

    it("座標在範圍外回傳 null", () => {
        expect(findTown([town], 120.0, 23.0)).toBeNull();
    });
});

describe("buildShop", () => {
    it("組出含來源的店家", () => {
        const fields: ReportFields = {
            name: "章魚燒專賣店",
            mapUrl: "https://www.google.com/maps/@25.0330,121.5654,17z",
            boxPrice: "60",
            piecesPerBox: "6",
            observedAt: "2026-10-01",
            note: "",
        };
        const shop = buildShop(
            fields,
            { id: "0x1:0x2", lat: 25.033, lng: 121.5654 },
            town,
            42,
        );
        expect(shop).toEqual({
            place_id: "0x1:0x2",
            name: "章魚燒專賣店",
            county: "台北市",
            district: "大安區",
            prices: [
                {
                    box_price: 60,
                    pieces_per_box: 6,
                    observed_at: "2026-10-01",
                    source: "github-issue#42",
                },
            ],
        });
    });
});
