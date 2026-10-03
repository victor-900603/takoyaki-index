import type { PriceRecord, Shop } from "./shops";

export interface RegionIndex {
    counties: Set<string>;
    districts: Set<string>;
}

export interface DedupeResult {
    shops: Shop[];
    warnings: string[];
}

function sortPrices(prices: PriceRecord[]): PriceRecord[] {
    return [...prices].sort((a, b) =>
        a.observed_at.localeCompare(b.observed_at),
    );
}

function mergePrices(
    current: PriceRecord[],
    incoming: PriceRecord[],
): PriceRecord[] {
    const byDate = new Map<string, PriceRecord>();
    for (const record of current) byDate.set(record.observed_at, record);
    for (const record of incoming) byDate.set(record.observed_at, record);
    return sortPrices([...byDate.values()]);
}

export function dedupeShops(shops: Shop[]): DedupeResult {
    const byId = new Map<string, Shop>();
    const warnings: string[] = [];
    const idsByName = new Map<string, Set<string>>();

    for (const shop of shops) {
        const existing = byId.get(shop.place_id);
        if (existing) {
            existing.prices = mergePrices(existing.prices, shop.prices);
            warnings.push(
                `重複 place_id：${shop.place_id}（${shop.name}），已合併價格`,
            );
        } else {
            byId.set(shop.place_id, { ...shop, prices: sortPrices(shop.prices) });
        }

        const ids = idsByName.get(shop.name) ?? new Set<string>();
        ids.add(shop.place_id);
        idsByName.set(shop.name, ids);
    }

    for (const [name, ids] of idsByName) {
        if (ids.size > 1) {
            warnings.push(
                `同名不同 place_id：${name}（${[...ids].join(", ")}）`,
            );
        }
    }

    const result = [...byId.values()].sort((a, b) =>
        a.place_id.localeCompare(b.place_id),
    );
    return { shops: result, warnings };
}

function isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const time = Date.parse(`${value}T00:00:00Z`);
    if (Number.isNaN(time)) return false;
    return new Date(time).toISOString().slice(0, 10) === value;
}

export function validateShops(shops: Shop[], regions: RegionIndex): string[] {
    const errors: string[] = [];

    shops.forEach((shop, index) => {
        const label = shop.place_id || `#${index}`;

        if (!shop.place_id) errors.push(`${label}：缺少 place_id`);
        if (!shop.name) errors.push(`${label}：缺少 name`);
        if (!shop.county || !regions.counties.has(shop.county)) {
            errors.push(`${label}：county 不存在（${shop.county}）`);
        }
        if (
            !shop.district ||
            !regions.districts.has(`${shop.county}|${shop.district}`)
        ) {
            errors.push(
                `${label}：district 不存在（${shop.county}|${shop.district}）`,
            );
        }
        if (shop.prices.length === 0) {
            errors.push(`${label}：沒有價格紀錄`);
        }

        shop.prices.forEach((record, recordIndex) => {
            const recordLabel = `${label} 價格#${recordIndex}`;
            if (!(record.box_price > 0)) {
                errors.push(`${recordLabel}：box_price 需大於 0`);
            }
            if (!(record.pieces_per_box > 0)) {
                errors.push(`${recordLabel}：pieces_per_box 需大於 0`);
            }
            if (!isValidDate(record.observed_at)) {
                errors.push(
                    `${recordLabel}：observed_at 非合法日期（${record.observed_at}）`,
                );
            }
        });
    });

    return errors;
}
