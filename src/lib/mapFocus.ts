import type { ShopScope } from "./shopList";

export type MapView =
    | { level: "county" }
    | { level: "town"; county: string };

export type SpotlightLevel = "national" | "county" | "district";

export interface MapFocus {
    shopScope: ShopScope;
    scopeLabel: string;
    showCounty: boolean;
    spotlightLevel: SpotlightLevel;
    spotlightName: string | null;
}

export function resolveFocus(
    view: MapView,
    focusedRegion: string | null,
): MapFocus {
    if (view.level === "town") {
        if (focusedRegion) {
            return {
                shopScope: {
                    level: "town",
                    county: view.county,
                    district: focusedRegion,
                },
                scopeLabel: `${view.county}${focusedRegion}`,
                showCounty: false,
                spotlightLevel: "district",
                spotlightName: focusedRegion,
            };
        }
        return {
            shopScope: { level: "town", county: view.county, district: null },
            scopeLabel: view.county,
            showCounty: false,
            spotlightLevel: "county",
            spotlightName: view.county,
        };
    }

    if (focusedRegion) {
        return {
            shopScope: {
                level: "town",
                county: focusedRegion,
                district: null,
            },
            scopeLabel: focusedRegion,
            showCounty: true,
            spotlightLevel: "county",
            spotlightName: focusedRegion,
        };
    }

    return {
        shopScope: { level: "county" },
        scopeLabel: "全台",
        showCounty: true,
        spotlightLevel: "national",
        spotlightName: null,
    };
}
