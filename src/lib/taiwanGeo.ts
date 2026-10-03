import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type {
    Feature,
    FeatureCollection,
    MultiPolygon,
    Polygon,
} from "geojson";

export interface CountyProperties {
    COUNTYNAME: string;
    COUNTYID: string;
    COUNTYCODE: string;
    COUNTYENG: string;
}

export interface TownProperties extends CountyProperties {
    TOWNNAME: string;
    TOWNID: string;
    TOWNCODE: string;
    TOWNENG: string;
}

export type CountyFeature = Feature<MultiPolygon | Polygon, CountyProperties>;
export type TownFeature = Feature<MultiPolygon | Polygon, TownProperties>;

export interface TaiwanGeo {
    counties: CountyFeature[];
    towns: TownFeature[];
    nation: Feature<MultiPolygon | Polygon>;
}

const DEFAULT_URL = "data/twTowns.topo.json";

export async function loadTaiwanGeo(url = DEFAULT_URL): Promise<TaiwanGeo> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`載入圖資失敗：${response.status} ${response.statusText}`);
    }
    const topology = (await response.json()) as unknown as Topology;

    const countyCollection = feature(
        topology,
        topology.objects.counties as never,
    ) as unknown as FeatureCollection<MultiPolygon | Polygon, CountyProperties>;
    const townCollection = feature(
        topology,
        topology.objects.towns as never,
    ) as unknown as FeatureCollection<MultiPolygon | Polygon, TownProperties>;
    const nation = feature(
        topology,
        topology.objects.nation as never,
    ) as unknown as Feature<MultiPolygon | Polygon>;

    return {
        counties: countyCollection.features,
        towns: townCollection.features,
        nation,
    };
}
