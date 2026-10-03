import { geoContains } from "d3-geo";
import type { TownFeature } from "./taiwanGeo";
import type { Shop } from "./shops";

export interface ReportFields {
    name: string;
    mapUrl: string;
    boxPrice: string;
    piecesPerBox: string;
    observedAt: string;
    note: string;
}

const LABELS = {
    name: "店名",
    mapUrl: "Google Maps 連結",
    boxPrice: "盒價（元）",
    piecesPerBox: "每盒顆數",
    observedAt: "觀測日期",
    note: "備註",
} as const;

export interface ParsedReport {
    fields: ReportFields;
    errors: string[];
}

function readSections(body: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lines = body.replace(/\r\n/g, "\n").split("\n");
    let current: string | null = null;
    let buffer: string[] = [];

    const flush = () => {
        if (current !== null) sections.set(current, buffer.join("\n").trim());
        buffer = [];
    };

    for (const line of lines) {
        const heading = /^###\s+(.*)$/.exec(line);
        if (heading) {
            flush();
            current = heading[1].trim();
        } else if (current !== null) {
            buffer.push(line);
        }
    }
    flush();

    return sections;
}

export function parseIssueBody(body: string): ParsedReport {
    const sections = readSections(body);
    const read = (label: string): string => {
        const value = sections.get(label) ?? "";
        return value.trim() === "_No response_" ? "" : value.trim();
    };

    const fields: ReportFields = {
        name: read(LABELS.name),
        mapUrl: read(LABELS.mapUrl),
        boxPrice: read(LABELS.boxPrice),
        piecesPerBox: read(LABELS.piecesPerBox),
        observedAt: read(LABELS.observedAt),
        note: read(LABELS.note),
    };

    const errors: string[] = [];
    if (!fields.name) errors.push("缺少店名");
    if (!fields.mapUrl) errors.push("缺少 Google Maps 連結");

    return { fields, errors };
}

export interface MapRef {
    id: string;
    lat: number;
    lng: number;
}

const COORD_PATTERN = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
const PLACE_ID_PATTERN = /place_id:(ChIJ[\w-]+)/;
const FID_PATTERN = /!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/;
const CHIJ_PATTERN = /!1s(ChIJ[\w-]+)/;

export function extractMapRef(url: string): MapRef | null {
    const coord = COORD_PATTERN.exec(url);
    if (!coord) return null;

    const lat = Number(coord[1]);
    const lng = Number(coord[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const id =
        PLACE_ID_PATTERN.exec(url)?.[1] ??
        FID_PATTERN.exec(url)?.[1] ??
        CHIJ_PATTERN.exec(url)?.[1] ??
        `coord:${lat},${lng}`;

    return { id, lat, lng };
}

export function findTown(
    towns: TownFeature[],
    lng: number,
    lat: number,
): TownFeature | null {
    for (const town of towns) {
        if (geoContains(town, [lng, lat])) return town;
    }
    return null;
}

export function buildShop(
    fields: ReportFields,
    ref: MapRef,
    town: TownFeature,
    issueNumber: number,
): Shop {
    return {
        place_id: ref.id,
        name: fields.name,
        county: town.properties.COUNTYNAME,
        district: town.properties.TOWNNAME,
        prices: [
            {
                box_price: Number(fields.boxPrice),
                pieces_per_box: Number(fields.piecesPerBox),
                observed_at: fields.observedAt,
                source: `github-issue#${issueNumber}`,
            },
        ],
    };
}
