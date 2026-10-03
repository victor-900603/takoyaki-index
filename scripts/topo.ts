import { readFileSync } from "node:fs";
import { feature } from "topojson-client";
import type { RegionIndex } from "../src/lib/shopData";
import type { TownFeature } from "../src/lib/taiwanGeo";

interface TopologyLike {
    objects: Record<string, unknown>;
}

export interface TopoRegions {
    towns: TownFeature[];
    regions: RegionIndex;
}

export function buildTopoRegions(topoPath: string): TopoRegions {
    const topology = JSON.parse(readFileSync(topoPath, "utf8")) as TopologyLike;

    const countyFeatures = feature(
        topology as never,
        topology.objects.counties as never,
    ) as unknown as { features: { properties: { COUNTYNAME: string } }[] };

    const townFeatures = feature(
        topology as never,
        topology.objects.towns as never,
    ) as unknown as { features: TownFeature[] };

    const counties = new Set<string>();
    for (const item of countyFeatures.features) {
        counties.add(item.properties.COUNTYNAME);
    }

    const districts = new Set<string>();
    for (const item of townFeatures.features) {
        districts.add(
            `${item.properties.COUNTYNAME}|${item.properties.TOWNNAME}`,
        );
    }

    return { towns: townFeatures.features, regions: { counties, districts } };
}
