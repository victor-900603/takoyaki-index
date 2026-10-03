import { describe, expect, it } from "vitest";
import { resolveFocus, type MapView } from "./mapFocus";

const countyView: MapView = { level: "county" };
const townView: MapView = { level: "town", county: "台北市" };

describe("resolveFocus", () => {
    it("縣市層未選取時顯示全台", () => {
        expect(resolveFocus(countyView, null)).toEqual({
            shopScope: { level: "county" },
            scopeLabel: "全台",
            showCounty: true,
            spotlightLevel: "national",
            spotlightName: null,
        });
    });

    it("縣市層選取縣市時顯示該縣市全部", () => {
        expect(resolveFocus(countyView, "高雄市")).toEqual({
            shopScope: { level: "town", county: "高雄市", district: null },
            scopeLabel: "高雄市",
            showCounty: true,
            spotlightLevel: "county",
            spotlightName: "高雄市",
        });
    });

    it("鄉鎮層未選取時顯示該縣市主層資訊", () => {
        expect(resolveFocus(townView, null)).toEqual({
            shopScope: { level: "town", county: "台北市", district: null },
            scopeLabel: "台北市",
            showCounty: false,
            spotlightLevel: "county",
            spotlightName: "台北市",
        });
    });

    it("鄉鎮層選取鄉鎮市區時顯示該區", () => {
        expect(resolveFocus(townView, "大安區")).toEqual({
            shopScope: { level: "town", county: "台北市", district: "大安區" },
            scopeLabel: "台北市大安區",
            showCounty: false,
            spotlightLevel: "district",
            spotlightName: "大安區",
        });
    });
});
