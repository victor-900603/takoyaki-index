import { extractMapRef, type MapRef } from "../src/lib/report";

export async function resolveMapRef(url: string): Promise<MapRef | null> {
    const direct = extractMapRef(url);
    if (direct) return direct;
    if (!/^https?:\/\//.test(url)) return null;

    try {
        const response = await fetch(url, { redirect: "follow" });
        if (!response.url) return null;
        return extractMapRef(response.url);
    } catch {
        return null;
    }
}
