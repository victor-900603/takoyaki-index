import { useMemo, type CSSProperties } from "react";
import { geoPath } from "d3-geo";
import mercatorTw from "../lib/mercatorTw";
import { buildMapView, regionName, type ViewLevel } from "../lib/mapView";
import type { TaiwanGeo } from "../lib/taiwanGeo";

const WIDTH = 520;
const HEIGHT = 760;

interface HoverPoint {
    x: number;
    y: number;
}

interface TaiwanMapProps {
    geo: TaiwanGeo;
    level: ViewLevel;
    county: string | null;
    selectedRegion: string | null;
    fillByRegion: Map<string, string>;
    onSelectRegion: (name: string) => void;
    onHoverRegion: (name: string | null, point: HoverPoint | null) => void;
}

interface ComputedView {
    regions: { name: string; d: string }[];
    nationPath: string | null;
    label: string;
}

function computeView(
    geo: TaiwanGeo,
    level: ViewLevel,
    county: string | null,
): ComputedView {
    const view = buildMapView(geo, level, county);
    const projection = mercatorTw().fitSize([WIDTH, HEIGHT], {
        type: "FeatureCollection",
        features: view.features,
    });
    const generator = geoPath(projection);
    return {
        nationPath: view.nation ? (generator(view.nation) ?? "") : null,
        label: view.label,
        regions: view.features.map((feature) => ({
            name: regionName(feature),
            d: generator(feature) ?? "",
        })),
    };
}

export default function TaiwanMap({
    geo,
    level,
    county,
    selectedRegion,
    fillByRegion,
    onSelectRegion,
    onHoverRegion,
}: TaiwanMapProps) {
    const countyView = useMemo(
        () => computeView(geo, "county", null),
        [geo],
    );
    const townView = useMemo(
        () => (county ? computeView(geo, "town", county) : null),
        [geo, county],
    );
    const { regions, nationPath, label } =
        level === "town" && townView ? townView : countyView;

    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="taiwan-map"
            role="img"
            aria-label={label}
        >
            {nationPath && (
                <path d={nationPath} className="taiwan-map__nation" />
            )}
            {regions.map(({ name, d }) => {
                const isSelected = name === selectedRegion;
                const fill = fillByRegion.get(name);

                return (
                    <path
                        key={name}
                        d={d}
                        className={`taiwan-map__region${
                            isSelected ? " is-selected" : ""
                        }`}
                        style={{ "--region-fill": fill } as CSSProperties}
                        tabIndex={0}
                        role="button"
                        aria-label={`${name}${isSelected ? "（已選取）" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => onSelectRegion(name)}
                        onMouseEnter={(event) =>
                            onHoverRegion(name, {
                                x: event.clientX,
                                y: event.clientY,
                            })
                        }
                        onMouseMove={(event) =>
                            onHoverRegion(name, {
                                x: event.clientX,
                                y: event.clientY,
                            })
                        }
                        onMouseLeave={() => onHoverRegion(null, null)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onSelectRegion(name);
                            }
                        }}
                    >
                        <title>{name}</title>
                    </path>
                );
            })}
        </svg>
    );
}
