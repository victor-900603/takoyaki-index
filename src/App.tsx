import { useMemo, useRef, useState } from "react";
import TaiwanMap from "./components/TaiwanMap";
import Legend from "./components/Legend";
import MapTooltip from "./components/MapTooltip";
import { useTaiwanGeo } from "./hooks/useTaiwanGeo";
import { useShops } from "./hooks/useShops";
import {
    aggregateByCounty,
    aggregateByDistrict,
    type RegionStat,
} from "./lib/stats";
import { buildColorScale } from "./lib/colorScale";
import "./App.css";

interface HoverState {
    name: string;
    x: number;
    y: number;
}

type View = { level: "county" } | { level: "town"; county: string };

function App() {
    const { data: geo, error: geoError, loading: geoLoading } = useTaiwanGeo();
    const { data: shops } = useShops();
    const [view, setView] = useState<View>({ level: "county" });
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(
        null,
    );
    const [hover, setHover] = useState<HoverState | null>(null);
    const panelRef = useRef<HTMLElement>(null);

    const statsByCounty = useMemo(() => aggregateByCounty(shops), [shops]);
    const statsByDistrict = useMemo(
        () =>
            view.level === "town"
                ? aggregateByDistrict(shops, view.county)
                : new Map<string, RegionStat>(),
        [shops, view],
    );

    const activeStats =
        view.level === "town" ? statsByDistrict : statsByCounty;
    const colorScale = useMemo(
        () => buildColorScale(activeStats),
        [activeStats],
    );

    const fillByRegion = useMemo(() => {
        const fills = new Map<string, string>();
        if (!geo) return fills;
        if (view.level === "town") {
            for (const town of geo.towns) {
                if (town.properties.COUNTYNAME !== view.county) continue;
                const name = town.properties.TOWNNAME;
                fills.set(name, colorScale.colorFor(statsByDistrict.get(name)));
            }
        } else {
            for (const feature of geo.counties) {
                const name = feature.properties.COUNTYNAME;
                fills.set(name, colorScale.colorFor(statsByCounty.get(name)));
            }
        }
        return fills;
    }, [geo, view, colorScale, statsByCounty, statsByDistrict]);

    const handleSelectRegion = (name: string) => {
        if (view.level === "county") {
            setView({ level: "town", county: name });
            setSelectedDistrict(null);
        } else {
            setSelectedDistrict((current) =>
                current === name ? null : name,
            );
        }
        setHover(null);
    };

    const handleBack = () => {
        setView({ level: "county" });
        setSelectedDistrict(null);
        setHover(null);
    };

    const handleHoverRegion = (
        name: string | null,
        point: { x: number; y: number } | null,
    ) => {
        const panel = panelRef.current;
        if (!name || !point || !panel) {
            setHover(null);
            return;
        }
        const rect = panel.getBoundingClientRect();
        setHover({ name, x: point.x - rect.left, y: point.y - rect.top });
    };

    const isTownView = view.level === "town";
    const selectedStat = isTownView && selectedDistrict
        ? statsByDistrict.get(selectedDistrict)
        : undefined;

    return (
        <div className="app">
            <header className="app__header">
                <h1>台灣章魚燒價格指數</h1>
                <p className="app__subtitle">
                    用一張地圖，看看全台章魚燒哪裡買最划算。
                </p>
            </header>

            <main className="app__main">
                <section className="map-panel" ref={panelRef}>
                    {isTownView && (
                        <div className="map-nav">
                            <button
                                type="button"
                                className="map-nav__back"
                                onClick={handleBack}
                            >
                                返回全台
                            </button>
                            <nav
                                className="map-nav__crumb"
                                aria-label="目前檢視層級"
                            >
                                <span>全台</span>
                                <span aria-hidden="true">/</span>
                                <span className="map-nav__current">
                                    {view.county}
                                </span>
                            </nav>
                        </div>
                    )}
                    {geoLoading && (
                        <p className="map-panel__status">地圖載入中…</p>
                    )}
                    {geoError && (
                        <p className="map-panel__status map-panel__status--error">
                            {geoError}
                        </p>
                    )}
                    {geo && (
                        <TaiwanMap
                            geo={geo}
                            level={view.level}
                            county={isTownView ? view.county : null}
                            selectedRegion={
                                isTownView ? selectedDistrict : null
                            }
                            fillByRegion={fillByRegion}
                            onSelectRegion={handleSelectRegion}
                            onHoverRegion={handleHoverRegion}
                        />
                    )}
                    <Legend
                        thresholds={colorScale.thresholds}
                        colors={colorScale.colors}
                        domain={colorScale.domain}
                        title={
                            isTownView
                                ? "鄉鎮市區每顆單價（元）"
                                : "縣市每顆單價（元）"
                        }
                    />
                    {hover && (
                        <MapTooltip
                            x={hover.x}
                            y={hover.y}
                            name={hover.name}
                            stat={activeStats.get(hover.name)}
                        />
                    )}
                </section>

                <aside className="info-panel">
                    <h2>{isTownView ? view.county : "縣市"}</h2>
                    <p>
                        {isTownView
                            ? selectedDistrict
                                ? `已選取：${selectedDistrict}`
                                : "點擊地圖上的鄉鎮市區查看統計。"
                            : "點擊地圖上的縣市查看鄉鎮市區。"}
                    </p>
                    {selectedStat && (
                        <dl className="info-panel__stats">
                            <div>
                                <dt>平均</dt>
                                <dd>{selectedStat.avg.toFixed(1)} 元／顆</dd>
                            </div>
                            <div>
                                <dt>中位數</dt>
                                <dd>{selectedStat.median.toFixed(1)} 元／顆</dd>
                            </div>
                            <div>
                                <dt>樣本</dt>
                                <dd>{selectedStat.sampleCount} 間</dd>
                            </div>
                        </dl>
                    )}
                </aside>
            </main>
        </div>
    );
}

export default App;
