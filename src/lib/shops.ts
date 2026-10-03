export interface PriceRecord {
    box_price: number;
    pieces_per_box: number;
    observed_at: string;
    source: string;
}

export interface Shop {
    place_id: string;
    name: string;
    county: string;
    district: string;
    prices: PriceRecord[];
}

export function unitPrice(record: PriceRecord): number {
    return record.box_price / record.pieces_per_box;
}

export function latestPrice(shop: Shop): PriceRecord | null {
    if (shop.prices.length === 0) return null;
    return shop.prices.reduce((a, b) =>
        a.observed_at >= b.observed_at ? a : b,
    );
}

export function latestUnitPrice(shop: Shop): number | null {
    const price = latestPrice(shop);
    return price === null ? null : unitPrice(price);
}

const DEFAULT_URL = "data/shops.json";

export async function loadShops(url = DEFAULT_URL): Promise<Shop[]> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `載入店家資料失敗：${response.status} ${response.statusText}`,
        );
    }
    return (await response.json()) as Shop[];
}
