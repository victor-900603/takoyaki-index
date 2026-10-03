import { useEffect, useMemo, useRef, useState } from "react";
import TaiwanMap from "./components/TaiwanMap";
import Legend from "./components/Legend";
import MapTooltip from "./components/MapTooltip";
import ViewControls from "./components/ViewControls";
import ShopList from "./components/ShopList";
import { useTaiwanGeo } from "./hooks/useTaiwanGeo";
import { useShops } from "./hooks/useShops";
import {
    aggregateAll,
    aggregateByCounty,
    aggregateByDistrict,
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
    scaleStat,
    scaleStats,
    type Metric,
} from "./lib/metric";
import { filterShops } from "./lib/shopList";
import { resolveFocus, type MapView } from "./lib/mapFocus";
import "./App.css";

interface HoverState {
    name: string;
    x: number;
    y: number;
}

interface Point {
    x: number;
    y: number;
}

const SPOTLIGHT_EYEBROW = {
    national: "全台價格",
    county: "縣市價格",
    district: "鄉鎮市區價格",
} as const;

function App() {
    const { data: geo, error: geoError, loading: geoLoading } = useTaiwanGeo();
    const { data: shops } = useShops();
    const [view, setView] = useState<MapView>({ level: "county" });
    const [focusedRegion, setFocusedRegion] = useState<string | null>(null);
    const [focusAnchor, setFocusAnchor] = useState<Point | null>(null);
    const [hover, setHover] = useState<HoverState | null>(null);
    const [metric, setMetric] = useState<Metric>("unit");
    const [scaleMode, setScaleMode] = useState<ScaleMode>("quantile");
    const panelRef = useRef<HTMLElement>(null);

    const factor = METRIC_FACTOR[metric];
    const isTownView = view.level === "town";

    const countyStats = useMemo(
        () => scaleStats(aggregateByCounty(shops), factor),
        [shops, factor],
    );
    const districtStats = useMemo(
        () =>
            view.level === "town"
                ? scaleStats(aggregateByDistrict(shops, view.county), factor)
                : new Map(),
        [shops, view, factor],
    );
    const nationalStat = useMemo(() => {
        const stat = aggregateAll(shops);
        return stat ? scaleStat(stat, factor) : undefined;
    }, [shops, factor]);

    const displayStats = isTownView ? districtStats : countyStats;
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

    const focus = useMemo(
        () => resolveFocus(view, focusedRegion),
        [view, focusedRegion],
    );
    const scopedShops = useMemo(
        () => filterShops(shops, focus.shopScope),
        [shops, focus.shopScope],
    );
    const spotlightStat =
        focus.spotlightLevel === "national"
            ? nationalStat
            : focus.spotlightLevel === "county"
              ? countyStats.get(focus.spotlightName ?? "")
              : districtStats.get(focus.spotlightName ?? "");

    const toPanelPoint = (point: Point): Point | null => {
        const panel = panelRef.current;
        if (!panel) return null;
        const rect = panel.getBoundingClientRect();
        return { x: point.x - rect.left, y: point.y - rect.top };
    };

    const handleSelectRegion = (name: string, point: Point) => {
        const next = focusedRegion === name ? null : name;
        setFocusedRegion(next);
        setFocusAnchor(next ? toPanelPoint(point) : null);
    };

    const handleClearSelection = () => {
        setFocusedRegion(null);
        setFocusAnchor(null);
    };

    const handleDrill = () => {
        if (view.level !== "county" || !focusedRegion) return;
        setView({ level: "town", county: focusedRegion });
        setFocusedRegion(null);
        setFocusAnchor(null);
        setHover(null);
    };

    const handleBack = () => {
        setView({ level: "county" });
        setFocusedRegion(null);
        setFocusAnchor(null);
        setHover(null);
    };

    const handleHoverRegion = (
        name: string | null,
        point: Point | null,
    ) => {
        const panel = panelRef.current;
        if (!name || !point || !panel) {
            setHover(null);
            return;
        }
        const rect = panel.getBoundingClientRect();
        setHover({ name, x: point.x - rect.left, y: point.y - rect.top });
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setFocusedRegion(null);
                setFocusAnchor(null);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

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
                        古有大麥克指數，現有台灣章魚燒指數。
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
                            selectedRegion={focusedRegion}
                            hoveredRegion={hover?.name ?? null}
                            fillByRegion={fillByRegion}
                            onSelectRegion={handleSelectRegion}
                            onHoverRegion={handleHoverRegion}
                            onClearSelection={handleClearSelection}
                        />
                    )}
                    <Legend
                        ticks={colorScale.legendTicks}
                        colors={colorScale.colors}
                        title={legendTitle}
                    />
                    {hover && hover.name !== focusedRegion && (
                        <MapTooltip
                            x={hover.x}
                            y={hover.y}
                            name={hover.name}
                            stat={displayStats.get(hover.name)}
                            unit={unit}
                        />
                    )}
                    {focusedRegion && focusAnchor && (
                        <MapTooltip
                            x={focusAnchor.x}
                            y={focusAnchor.y}
                            name={focusedRegion}
                            stat={displayStats.get(focusedRegion)}
                            unit={unit}
                            action={
                                isTownView
                                    ? undefined
                                    : {
                                          label: "查看鄉鎮市區",
                                          onClick: handleDrill,
                                      }
                            }
                        />
                    )}
                </section>

                <section className="spotlight" aria-live="polite">
                    <div className="spotlight__meta">
                        <p className="spotlight__eyebrow">
                            {SPOTLIGHT_EYEBROW[focus.spotlightLevel]}
                        </p>
                        <h2 className="spotlight__title">
                            {focus.spotlightName ?? "全台"}
                        </h2>
                    </div>
                    {spotlightStat ? (
                        <dl className="spotlight__stats">
                            <div className="spotlight__stat">
                                <dt>平均</dt>
                                <dd>
                                    {spotlightStat.avg.toFixed(1)}
                                    <span>{unit}</span>
                                </dd>
                            </div>
                            <div className="spotlight__stat">
                                <dt>中位數</dt>
                                <dd>
                                    {spotlightStat.median.toFixed(1)}
                                    <span>{unit}</span>
                                </dd>
                            </div>
                            <div className="spotlight__stat">
                                <dt>樣本</dt>
                                <dd>
                                    {spotlightStat.sampleCount}
                                    <span>間</span>
                                </dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="spotlight__hint">
                            {focus.spotlightLevel === "national"
                                ? "目前尚無店家資料。"
                                : "此區尚無店家資料。"}
                        </p>
                    )}
                </section>

                <ShopList
                    shops={scopedShops}
                    scopeLabel={focus.scopeLabel}
                    showCounty={focus.showCounty}
                    factor={factor}
                    compareLabel={METRIC_LABEL[metric]}
                    compareUnit={METRIC_UNIT[metric]}
                />
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
