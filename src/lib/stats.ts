import { quantile } from "./quantile";
import { latestUnitPrice, type Shop } from "./shops";

export interface RegionStat {
    avg: number;
    median: number;
    sampleCount: number;
    min: number;
    max: number;
}

function average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
    return quantile(values, 0.5);
}

function aggregateBy(
    shops: Shop[],
    keyOf: (shop: Shop) => string | null,
): Map<string, RegionStat> {
    const grouped = new Map<string, number[]>();

    for (const shop of shops) {
        const key = keyOf(shop);
        if (key === null) continue;
        const value = latestUnitPrice(shop);
        if (value === null) continue;
        const values = grouped.get(key);
        if (values) values.push(value);
        else grouped.set(key, [value]);
    }

    const result = new Map<string, RegionStat>();
    for (const [key, values] of grouped) {
        result.set(key, {
            avg: average(values),
            median: median(values),
            sampleCount: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
        });
    }
    return result;
}

export function aggregateByCounty(shops: Shop[]): Map<string, RegionStat> {
    return aggregateBy(shops, (shop) => shop.county);
}

export function aggregateByDistrict(
    shops: Shop[],
    county: string,
): Map<string, RegionStat> {
    return aggregateBy(shops, (shop) =>
        shop.county === county ? shop.district : null,
    );
}

export function aggregateAll(shops: Shop[]): RegionStat | undefined {
    return aggregateBy(shops, () => "all").get("all");
}
