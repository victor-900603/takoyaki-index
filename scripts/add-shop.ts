import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTopoRegions } from "./topo";
import { resolveMapRef } from "./mapRef";
import { parseAddArgs } from "../src/lib/addShop";
import { buildShop, extractPlaceName, findTown } from "../src/lib/report";
import { dedupeShops, validateShops } from "../src/lib/shopData";
import type { Shop } from "../src/lib/shops";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const topoPath = resolve(root, "public/data/twTowns.topo.json");

const USAGE =
    '用法：npm run data:add -- ["店名"] "<Google Maps 連結>" 盒價 [每盒顆數] [觀測日期]\n店名可省略，將自動從連結取得；店名建議格式為「店名(分店)」。';

function fail(errors: string[]): never {
    console.error(`新增失敗，共 ${errors.length} 項：`);
    for (const error of errors) console.error(`  - ${error}`);
    console.error(USAGE);
    process.exit(1);
}

async function main(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const args = parseAddArgs(process.argv.slice(2), today);
    if (args.errors.length > 0) fail(args.errors);

    const rawPath = process.env.ADD_RAW_PATH
        ? resolve(process.env.ADD_RAW_PATH)
        : resolve(root, "data/raw/shops.json");
    const source = process.env.ADD_SOURCE ?? "manual";
    const { towns, regions } = buildTopoRegions(topoPath);

    const resolved = await resolveMapRef(args.fields.mapUrl);
    if (!resolved) fail(["無法從 Google Maps 連結取得座標與識別碼"]);

    const nameFromLink = !args.fields.name;
    const name = args.fields.name || extractPlaceName(resolved.url) || "";
    if (!name) {
        fail(["缺少店名，且無法從連結取得，請於第一個參數提供店名"]);
    }

    const ref = resolved.ref;
    const town = findTown(towns, ref.lng, ref.lat);
    if (!town) fail(["座標不在台灣行政區範圍內"]);

    const shop = buildShop({ ...args.fields, name }, ref, town, source);
    const raw = JSON.parse(readFileSync(rawPath, "utf8")) as Shop[];
    const { shops, warnings } = dedupeShops([...raw, shop]);

    const validationErrors = validateShops(shops, regions);
    if (validationErrors.length > 0) fail(validationErrors);

    writeFileSync(rawPath, `${JSON.stringify(shops, null, 4)}\n`, "utf8");

    const price = shop.prices[0];
    console.log(
        `已新增：${shop.name}（${shop.county}${shop.district}）每盒 ${price.box_price} 元 / ${price.pieces_per_box} 顆`,
    );
    if (nameFromLink) {
        console.log(
            "提示：店名取自連結，建議確認為「店名(分店)」格式，例如「日船章魚小丸子(樹林中華店)」。",
        );
    }
    for (const warning of warnings) console.log(`警告：${warning}`);
}

await main();
