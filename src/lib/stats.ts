import { unitPrice, type Shop } from "./shops";

export interface RegionStat {
    avg: number;
    median: number;
    sampleCount: number;
}

function latestUnitPrice(shop: Shop): number | null {
    if (shop.prices.length === 0) return null;
    const latest = shop.prices.reduce((a, b) =>
        a.observed_at >= b.observed_at ? a : b,
    );
    return unitPrice(latest);
}

function average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
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
