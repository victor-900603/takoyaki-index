import { describe, expect, it } from "vitest";
import { buildMapView, regionName } from "./mapView";
import type { CountyFeature, TaiwanGeo, TownFeature } from "./taiwanGeo";

function county(name: string): CountyFeature {
    return {
        type: "Feature",
        properties: {
            COUNTYNAME: name,
            COUNTYID: "",
            COUNTYCODE: "",
            COUNTYENG: "",
        },
        geometry: { type: "Polygon", coordinates: [] },
    };
}

function town(countyName: string, name: string): TownFeature {
    return {
        type: "Feature",
        properties: {
            COUNTYNAME: countyName,
            COUNTYID: "",
            COUNTYCODE: "",
            COUNTYENG: "",
            TOWNNAME: name,
            TOWNID: "",
            TOWNCODE: "",
            TOWNENG: "",
        },
        geometry: { type: "Polygon", coordinates: [] },
    };
}

const geo: TaiwanGeo = {
    counties: [county("台北市"), county("高雄市")],
    towns: [
        town("台北市", "中山區"),
        town("台北市", "大安區"),
        town("高雄市", "苓雅區"),
    ],
    nation: {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [] },
    },
};

describe("regionName", () => {
    it("鄉鎮市區取 TOWNNAME", () => {
        expect(regionName(town("台北市", "中山區"))).toBe("中山區");
    });

    it("縣市取 COUNTYNAME", () => {
        expect(regionName(county("台北市"))).toBe("台北市");
    });
});

describe("buildMapView", () => {
    it("縣市層回傳全部縣市與國界", () => {
        const view = buildMapView(geo, "county", null);
        expect(view.features).toHaveLength(2);
        expect(view.nation).not.toBeNull();
        expect(view.label).toBe("台灣縣市地圖");
    });

    it("鄉鎮層只回傳指定縣市的鄉鎮市區且不含國界", () => {
        const view = buildMapView(geo, "town", "台北市");
        expect(view.features.map(regionName)).toEqual(["中山區", "大安區"]);
        expect(view.nation).toBeNull();
        expect(view.label).toBe("台北市鄉鎮市區地圖");
    });

    it("鄉鎮層缺少縣市時退回縣市層", () => {
        const view = buildMapView(geo, "town", null);
        expect(view.features).toHaveLength(2);
        expect(view.nation).not.toBeNull();
    });
});
