import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTopoRegions } from "./topo";
import { dedupeShops, validateShops } from "../src/lib/shopData";
import type { Shop } from "../src/lib/shops";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = resolve(root, "data/raw/shops.json");
const topoPath = resolve(root, "public/data/twTowns.topo.json");
const outPath = resolve(root, "public/data/shops.json");

function main(): void {
    const raw = JSON.parse(readFileSync(rawPath, "utf8")) as Shop[];
    const { regions } = buildTopoRegions(topoPath);

    const { shops, warnings } = dedupeShops(raw);
    const errors = validateShops(shops, regions);

    if (errors.length > 0) {
        console.error(`資料驗證失敗，共 ${errors.length} 項：`);
        for (const error of errors) console.error(`  - ${error}`);
        process.exit(1);
    }

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(shops, null, 4)}\n`, "utf8");

    const perCounty = new Map<string, number>();
    for (const shop of shops) {
        perCounty.set(shop.county, (perCounty.get(shop.county) ?? 0) + 1);
    }

    console.log(`已輸出 ${shops.length} 間店家至 public/data/shops.json`);
    console.log(
        `縣市分布：${[...perCounty.entries()].map(([c, n]) => `${c} ${n}`).join("、")}`,
    );
    if (warnings.length > 0) {
        console.log(`警告 ${warnings.length} 項：`);
        for (const warning of warnings) console.log(`  - ${warning}`);
    }
}

main();
