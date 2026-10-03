import { describe, expect, it } from "vitest";
import { parseAddArgs } from "./addShop";

const TODAY = "2026-10-03";

describe("parseAddArgs", () => {
    it("解析完整位置參數", () => {
        const args = parseAddArgs(
            [
                "章魚燒專賣店",
                "https://www.google.com/maps/@25.033,121.565,17z",
                "60",
                "8",
                "2026-10-01",
            ],
            TODAY,
        );

        expect(args.errors).toEqual([]);
        expect(args.fields).toEqual({
            name: "章魚燒專賣店",
            mapUrl: "https://www.google.com/maps/@25.033,121.565,17z",
            boxPrice: "60",
            piecesPerBox: "8",
            observedAt: "2026-10-01",
            note: "",
        });
    });

    it("顆數預設 6、日期預設今天", () => {
        const args = parseAddArgs(
            ["店", "https://maps.example/x", "50"],
            TODAY,
        );

        expect(args.errors).toEqual([]);
        expect(args.fields.piecesPerBox).toBe("6");
        expect(args.fields.observedAt).toBe(TODAY);
    });

    it("忽略 -- 分隔符號與旗標形式", () => {
        const args = parseAddArgs(
            ["--", "店", "--unknown", "https://maps.example/x", "70"],
            TODAY,
        );

        expect(args.errors).toEqual([]);
        expect(args.fields.name).toBe("店");
        expect(args.fields.mapUrl).toBe("https://maps.example/x");
        expect(args.fields.boxPrice).toBe("70");
    });

    it("缺少必填時回報錯誤", () => {
        const args = parseAddArgs([], TODAY);
        expect(args.errors).toEqual([
            "缺少店名",
            "缺少 Google Maps 連結",
            "缺少盒價",
        ]);
    });

    it("盒價非正數時回報錯誤", () => {
        const args = parseAddArgs(["店", "https://maps.example/x", "0"], TODAY);
        expect(args.errors).toContain("盒價需為大於 0 的數字");
    });

    it("顆數非正數時回報錯誤", () => {
        const args = parseAddArgs(
            ["店", "https://maps.example/x", "50", "-1"],
            TODAY,
        );
        expect(args.errors).toContain("每盒顆數需為大於 0 的數字");
    });

    it("日期格式錯誤時回報錯誤", () => {
        const args = parseAddArgs(
            ["店", "https://maps.example/x", "50", "6", "2026/10/01"],
            TODAY,
        );
        expect(args.errors).toContain("觀測日期需為 YYYY-MM-DD");
    });
});
