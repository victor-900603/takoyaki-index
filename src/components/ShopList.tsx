import { useMemo, useState } from "react";
import {
    latestPrice,
    unitPrice,
    type Shop,
} from "../lib/shops";
import {
    mapsSearchUrl,
    searchShops,
    sortShops,
    type ShopSort,
} from "../lib/shopList";

interface ShopListProps {
    shops: Shop[];
    scopeLabel: string;
    showCounty: boolean;
    factor: number;
    compareLabel: string;
    compareUnit: string;
}

const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
    { value: "unitPrice", label: "價格" },
    { value: "name", label: "店名" },
];

function ShopList({
    shops,
    scopeLabel,
    showCounty,
    factor,
    compareLabel,
    compareUnit,
}: ShopListProps) {
    const [sort, setSort] = useState<ShopSort>("unitPrice");
    const [query, setQuery] = useState("");
    const sorted = useMemo(() => sortShops(shops, sort), [shops, sort]);
    const visible = useMemo(
        () => searchShops(sorted, query),
        [sorted, query],
    );

    const minUnitPrice = useMemo(() => {
        let min: number | null = null;
        for (const shop of shops) {
            const price = latestPrice(shop);
            if (price === null) continue;
            const value = unitPrice(price);
            if (min === null || value < min) min = value;
        }
        return min;
    }, [shops]);

    return (
        <section className="shop-list" aria-label="店家列表">
            <div className="shop-list__head">
                <div className="shop-list__meta">
                    <h2 className="shop-list__title">店家列表</h2>
                    <p className="shop-list__scope">
                        {scopeLabel}・
                        {query.trim() === ""
                            ? `${shops.length} 間`
                            : `符合 ${visible.length} / ${shops.length} 間`}
                    </p>
                </div>
                <div className="shop-list__controls">
                    <input
                        type="search"
                        className="shop-list__search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="搜尋店名"
                        aria-label="搜尋店名"
                    />
                    <div
                        className="shop-list__sort"
                        role="group"
                        aria-label="排序方式"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    "shop-list__sort-button" +
                                    (sort === option.value ? " is-active" : "")
                                }
                                aria-pressed={sort === option.value}
                                onClick={() => setSort(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {shops.length === 0 ? (
                <p className="shop-list__empty">此區尚無店家資料。</p>
            ) : visible.length === 0 ? (
                <p className="shop-list__empty">
                    找不到符合「{query.trim()}」的店家。
                </p>
            ) : (
                <div className="shop-list__scroll">
                    <table className="shop-list__table">
                        <thead>
                            <tr>
                                <th scope="col">店名</th>
                                <th scope="col">地區</th>
                                <th scope="col" className="is-numeric">
                                    盒價（元）
                                </th>
                                <th scope="col" className="is-numeric">
                                    顆數
                                </th>
                                <th scope="col" className="is-numeric">
                                    {compareLabel}（{compareUnit}）
                                </th>
                                <th scope="col">觀測日期</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((shop) => {
                                const price = latestPrice(shop);
                                const value =
                                    price === null
                                        ? null
                                        : unitPrice(price) * factor;
                                const isCheapest =
                                    price !== null &&
                                    minUnitPrice !== null &&
                                    unitPrice(price) === minUnitPrice;
                                return (
                                    <tr key={shop.place_id}>
                                        <td data-label="店名">
                                            <span className="shop-list__shop">
                                                <a
                                                    className="shop-list__link"
                                                    href={mapsSearchUrl(shop)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {shop.name}
                                                </a>
                                                {isCheapest && (
                                                    <span className="shop-list__badge">
                                                        最低價
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td data-label="地區">
                                            {showCounty
                                                ? `${shop.county}${shop.district}`
                                                : shop.district}
                                        </td>
                                        <td
                                            className="is-numeric"
                                            data-label="盒價（元）"
                                        >
                                            {price ? price.box_price : "—"}
                                        </td>
                                        <td
                                            className="is-numeric"
                                            data-label="顆數"
                                        >
                                            {price ? price.pieces_per_box : "—"}
                                        </td>
                                        <td
                                            className="is-numeric"
                                            data-label={`${compareLabel}（${compareUnit}）`}
                                        >
                                            {value === null
                                                ? "—"
                                                : value.toFixed(1)}
                                        </td>
                                        <td data-label="觀測日期">
                                            {price ? price.observed_at : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default ShopList;
