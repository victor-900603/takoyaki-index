import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTopoRegions } from "./topo";
import {
    buildShop,
    extractMapRef,
    findTown,
    parseIssueBody,
    type MapRef,
} from "../src/lib/report";
import { dedupeShops, validateShops } from "../src/lib/shopData";
import type { Shop } from "../src/lib/shops";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawPath =
    process.env.REPORT_RAW_PATH ?? resolve(root, "data/raw/shops.json");
const topoPath = resolve(root, "public/data/twTowns.topo.json");

function fail(errors: string[]): never {
    console.error(`回報無法併入，共 ${errors.length} 項：`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
}

async function resolveShortLink(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, { redirect: "follow" });
        return response.url || null;
    } catch {
        return null;
    }
}

async function main(): Promise<void> {
    const body = process.env.ISSUE_BODY ?? "";
    const issueNumber = Number(process.env.ISSUE_NUMBER ?? "0");
    const { towns, regions } = buildTopoRegions(topoPath);

    const { fields, errors } = parseIssueBody(body);

    let ref: MapRef | null = extractMapRef(fields.mapUrl);
    if (!ref && /^https?:\/\//.test(fields.mapUrl)) {
        const resolved = await resolveShortLink(fields.mapUrl);
        if (resolved) ref = extractMapRef(resolved);
    }

    if (errors.length > 0) fail(errors);
    if (!ref) fail(["無法從 Google Maps 連結取得座標與識別碼"]);

    const town = findTown(towns, ref.lng, ref.lat);
    if (!town) fail(["座標不在台灣行政區範圍內"]);

    const shop = buildShop(fields, ref, town, issueNumber);
    const raw = JSON.parse(readFileSync(rawPath, "utf8")) as Shop[];
    const { shops, warnings } = dedupeShops([...raw, shop]);

    const validationErrors = validateShops(shops, regions);
    if (validationErrors.length > 0) fail(validationErrors);

    writeFileSync(rawPath, `${JSON.stringify(shops, null, 4)}\n`, "utf8");

    console.log(`已併入回報：${shop.name}（${shop.county}${shop.district}）`);
    for (const warning of warnings) console.log(`警告：${warning}`);
}

await main();
