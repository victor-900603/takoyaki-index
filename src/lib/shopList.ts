import { latestUnitPrice, type Shop } from "./shops";

export type ShopScope =
    | { level: "county" }
    | { level: "town"; county: string; district: string | null };

export type ShopSort = "unitPrice" | "name";

export function filterShops(shops: Shop[], scope: ShopScope): Shop[] {
    if (scope.level === "county") return shops;
    return shops.filter((shop) => {
        if (shop.county !== scope.county) return false;
        if (scope.district !== null && shop.district !== scope.district) {
            return false;
        }
        return true;
    });
}

function byName(a: Shop, b: Shop): number {
    return a.name.localeCompare(b.name, "zh-Hant");
}

export function sortShops(shops: Shop[], sort: ShopSort): Shop[] {
    const sorted = [...shops];
    if (sort === "name") {
        sorted.sort(byName);
        return sorted;
    }
    sorted.sort((a, b) => {
        const priceA = latestUnitPrice(a);
        const priceB = latestUnitPrice(b);
        if (priceA === null && priceB === null) return byName(a, b);
        if (priceA === null) return 1;
        if (priceB === null) return -1;
        if (priceA !== priceB) return priceA - priceB;
        return byName(a, b);
    });
    return sorted;
}

export function mapsSearchUrl(shop: Shop): string {
    const query = `${shop.name} ${shop.county}${shop.district}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query,
    )}`;
}

export function searchShops(shops: Shop[], query: string): Shop[] {
    const keyword = query.trim().toLowerCase();
    if (keyword === "") return shops;
    return shops.filter((shop) =>
        shop.name.toLowerCase().includes(keyword),
    );
}
