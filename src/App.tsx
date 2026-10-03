import { useMemo, useRef, useState } from "react";
import TaiwanMap from "./components/TaiwanMap";
import Legend from "./components/Legend";
import MapTooltip from "./components/MapTooltip";
import ViewControls from "./components/ViewControls";
import { useTaiwanGeo } from "./hooks/useTaiwanGeo";
import { useShops } from "./hooks/useShops";
import {
    aggregateByCounty,
    aggregateByDistrict,
    type RegionStat,
} from "./lib/stats";
import {
    buildColorScale,
    DEFAULT_FIXED_BREAKS,
    type ScaleMode,
} from "./lib/colorScale";
import {
    METRIC_FACTOR,
    METRIC_LABEL,
    METRIC_UNIT,
    scaleStats,
    type Metric,
} from "./lib/metric";
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
    const [metric, setMetric] = useState<Metric>("unit");
    const [scaleMode, setScaleMode] = useState<ScaleMode>("quantile");
    const panelRef = useRef<HTMLElement>(null);

    const factor = METRIC_FACTOR[metric];

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
    const displayStats = useMemo(
        () => scaleStats(activeStats, factor),
        [activeStats, factor],
    );
    const colorScale = useMemo(
        () =>
            buildColorScale(displayStats, {
                mode: scaleMode,
                fixedBreaks: DEFAULT_FIXED_BREAKS.map((value) => value * factor),
            }),
        [displayStats, scaleMode, factor],
    );

    const fillByRegion = useMemo(() => {
        const fills = new Map<string, string>();
        if (!geo) return fills;
        if (view.level === "town") {
            for (const town of geo.towns) {
                if (town.properties.COUNTYNAME !== view.county) continue;
                const name = town.properties.TOWNNAME;
                fills.set(name, colorScale.colorFor(displayStats.get(name)));
            }
        } else {
            for (const feature of geo.counties) {
                const name = feature.properties.COUNTYNAME;
                fills.set(name, colorScale.colorFor(displayStats.get(name)));
            }
        }
        return fills;
    }, [geo, view, colorScale, displayStats]);

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
        ? displayStats.get(selectedDistrict)
        : undefined;
    const unit = METRIC_UNIT[metric];
    const legendTitle = `${isTownView ? "鄉鎮市區" : "縣市"}${
        METRIC_LABEL[metric]
    }（元）`;

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
                    <ViewControls
                        metric={metric}
                        onMetricChange={setMetric}
                        scaleMode={scaleMode}
                        onScaleModeChange={setScaleMode}
                    />
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
                        ticks={colorScale.legendTicks}
                        colors={colorScale.colors}
                        title={legendTitle}
                    />
                    {hover && (
                        <MapTooltip
                            x={hover.x}
                            y={hover.y}
                            name={hover.name}
                            stat={displayStats.get(hover.name)}
                            unit={unit}
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
                                <dd>
                                    {selectedStat.avg.toFixed(1)} {unit}
                                </dd>
                            </div>
                            <div>
                                <dt>中位數</dt>
                                <dd>
                                    {selectedStat.median.toFixed(1)} {unit}
                                </dd>
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
