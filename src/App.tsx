import { useMemo, useRef, useState } from "react";
import TaiwanMap from "./components/TaiwanMap";
import Legend from "./components/Legend";
import MapTooltip from "./components/MapTooltip";
import { useTaiwanGeo } from "./hooks/useTaiwanGeo";
import { useShops } from "./hooks/useShops";
import { aggregateByCounty } from "./lib/stats";
import { buildColorScale } from "./lib/colorScale";
import "./App.css";

interface HoverState {
    name: string;
    x: number;
    y: number;
}

function App() {
    const { data: geo, error: geoError, loading: geoLoading } = useTaiwanGeo();
    const { data: shops } = useShops();
    const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
    const [hover, setHover] = useState<HoverState | null>(null);
    const panelRef = useRef<HTMLElement>(null);

    const statsByCounty = useMemo(() => aggregateByCounty(shops), [shops]);
    const colorScale = useMemo(
        () => buildColorScale(statsByCounty),
        [statsByCounty],
    );

    const fillByCounty = useMemo(() => {
        const fills = new Map<string, string>();
        if (!geo) return fills;
        for (const county of geo.counties) {
            const name = county.properties.COUNTYNAME;
            fills.set(name, colorScale.colorFor(statsByCounty.get(name)));
        }
        return fills;
    }, [geo, colorScale, statsByCounty]);

    const handleHoverCounty = (
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

    const selectedStat = selectedCounty
        ? statsByCounty.get(selectedCounty)
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
                            selectedCounty={selectedCounty}
                            onSelectCounty={setSelectedCounty}
                            fillByCounty={fillByCounty}
                            onHoverCounty={handleHoverCounty}
                        />
                    )}
                    {hover && (
                        <MapTooltip
                            x={hover.x}
                            y={hover.y}
                            county={hover.name}
                            stat={statsByCounty.get(hover.name)}
                        />
                    )}
                </section>

                <aside className="info-panel">
                    <h2>縣市</h2>
                    <p>
                        {selectedCounty
                            ? `已選取：${selectedCounty}`
                            : "點擊地圖上的縣市開始探索。"}
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
                    <Legend
                        thresholds={colorScale.thresholds}
                        colors={colorScale.colors}
                    />
                </aside>
            </main>
        </div>
    );
}

export default App;
