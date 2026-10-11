import type { ReportFields } from "./report";

export interface AddArgs {
    fields: ReportFields;
    errors: string[];
}

const DEFAULT_PIECES = "6";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https?:\/\//i;

export function parseAddArgs(argv: string[], today: string): AddArgs {
    const tokens = argv.filter(
        (token) => token !== "--" && !token.startsWith("--"),
    );

    const hasName = tokens.length > 0 && !URL_PATTERN.test(tokens[0]);
    const name = hasName ? tokens[0].trim() : "";
    const rest = hasName ? tokens.slice(1) : tokens;

    const url = (rest[0] ?? "").trim();
    const price = (rest[1] ?? "").trim();
    const pieces = (rest[2] ?? DEFAULT_PIECES).trim();
    const date = (rest[3] ?? today).trim();

    const errors: string[] = [];
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
