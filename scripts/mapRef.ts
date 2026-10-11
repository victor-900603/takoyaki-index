import { extractMapRef, type MapRef } from "../src/lib/report";

export interface ResolvedMap {
    ref: MapRef;
    url: string;
}

export async function resolveMapRef(url: string): Promise<ResolvedMap | null> {
    const direct = extractMapRef(url);
    if (direct) return { ref: direct, url };
    if (!/^https?:\/\//.test(url)) return null;

    try {
        const response = await fetch(url, { redirect: "follow" });
        if (!response.url) return null;
        const ref = extractMapRef(response.url);
        return ref ? { ref, url: response.url } : null;
    } catch {
        return null;
    }
}
