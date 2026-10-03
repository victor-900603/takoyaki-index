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
            <header className="masthead">
                <div className="masthead__lead">
                    <p className="masthead__eyebrow">
                        全台 22 縣市・368 鄉鎮市區
                    </p>
                    <h1 className="masthead__title">台灣章魚燒價格指數</h1>
                    <p className="masthead__subtitle">
                        用一張地圖，看看全台章魚燒哪裡買最划算。
                    </p>
                </div>
                <ViewControls
                    metric={metric}
                    onMetricChange={setMetric}
                    scaleMode={scaleMode}
                    onScaleModeChange={setScaleMode}
                />
            </header>

            <main>
                <section className="map-stage" ref={panelRef}>
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
                        <p className="map-stage__status">地圖載入中…</p>
                    )}
                    {geoError && (
                        <p className="map-stage__status map-stage__status--error">
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

                <section className="spotlight" aria-live="polite">
                    <div className="spotlight__meta">
                        <p className="spotlight__eyebrow">
                            {isTownView ? "鄉鎮市區" : "縣市"}價格
                        </p>
                        <h2 className="spotlight__title">
                            {isTownView
                                ? selectedDistrict ?? view.county
                                : "全台"}
                        </h2>
                    </div>
                    {selectedStat ? (
                        <dl className="spotlight__stats">
                            <div className="spotlight__stat">
                                <dt>平均</dt>
                                <dd>
                                    {selectedStat.avg.toFixed(1)}
                                    <span>{unit}</span>
                                </dd>
                            </div>
                            <div className="spotlight__stat">
                                <dt>中位數</dt>
                                <dd>
                                    {selectedStat.median.toFixed(1)}
                                    <span>{unit}</span>
                                </dd>
                            </div>
                            <div className="spotlight__stat">
                                <dt>樣本</dt>
                                <dd>
                                    {selectedStat.sampleCount}
                                    <span>間</span>
                                </dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="spotlight__hint">
                            {isTownView
                                ? "點選鄉鎮市區，查看平均、中位數與樣本數。"
                                : "點選任一縣市，鑽取查看鄉鎮市區的價格分布。"}
                        </p>
                    )}
                </section>
            </main>

            <footer className="app__footer">
                <p>
                    價格以每間店最新一筆觀測為準；統計取中位數；樣本少於 3 間以灰色呈現。
                </p>
            </footer>
        </div>
    );
}

export default App;
