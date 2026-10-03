import type { ReportFields } from "./report";

export interface AddArgs {
    fields: ReportFields;
    errors: string[];
}

const DEFAULT_PIECES = "6";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseAddArgs(argv: string[], today: string): AddArgs {
    const positional = argv.filter((token) => token !== "--" && !token.startsWith("--"));

    const name = (positional[0] ?? "").trim();
    const url = (positional[1] ?? "").trim();
    const price = (positional[2] ?? "").trim();
    const pieces = (positional[3] ?? DEFAULT_PIECES).trim();
    const date = (positional[4] ?? today).trim();

    const errors: string[] = [];
    if (!name) errors.push("缺少店名");
    if (!url) errors.push("缺少 Google Maps 連結");
    if (!price) {
        errors.push("缺少盒價");
    } else if (!(Number(price) > 0)) {
        errors.push("盒價需為大於 0 的數字");
    }
    if (!(Number(pieces) > 0)) {
        errors.push("每盒顆數需為大於 0 的數字");
    }
    if (!DATE_PATTERN.test(date)) {
        errors.push("觀測日期需為 YYYY-MM-DD");
    }

    const fields: ReportFields = {
        name,
        mapUrl: url,
        boxPrice: price,
        piecesPerBox: pieces,
        observedAt: date,
        note: "",
    };

    return { fields, errors };
}
