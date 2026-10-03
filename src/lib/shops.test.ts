import { afterEach, describe, expect, it, vi } from "vitest";
import { loadShops, type Shop } from "./shops";

const sample: Shop[] = [
    {
        place_id: "x",
        name: "店",
        county: "台北市",
        district: "區",
        prices: [],
    },
];

describe("loadShops", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("成功時回傳店家陣列", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sample),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(loadShops("/data/shops.json")).resolves.toEqual(sample);
        expect(fetchMock).toHaveBeenCalledWith("/data/shops.json");
    });

    it("回應失敗時丟出錯誤", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: "Not Found",
            }),
        );

        await expect(loadShops()).rejects.toThrow(
            "載入店家資料失敗：404 Not Found",
        );
    });
});
