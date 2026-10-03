import type { CountyFeature, TaiwanGeo, TownFeature } from "./taiwanGeo";

export type ViewLevel = "county" | "town";

export type RegionFeature = CountyFeature | TownFeature;

export interface MapView {
    features: RegionFeature[];
    nation: TaiwanGeo["nation"] | null;
    label: string;
}

export function regionName(feature: RegionFeature): string {
    return "TOWNNAME" in feature.properties
        ? feature.properties.TOWNNAME
        : feature.properties.COUNTYNAME;
}

export function buildMapView(
    geo: TaiwanGeo,
    level: ViewLevel,
    county: string | null,
): MapView {
    if (level === "town" && county) {
        return {
            features: geo.towns.filter(
                (town) => town.properties.COUNTYNAME === county,
            ),
            nation: null,
            label: `${county}鄉鎮市區地圖`,
        };
    }

    return {
        features: geo.counties,
        nation: geo.nation,
        label: "台灣縣市地圖",
    };
}
