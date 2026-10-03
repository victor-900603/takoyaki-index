import { useMemo, type CSSProperties } from "react";
import { geoPath } from "d3-geo";
import mercatorTw from "../lib/mercatorTw";
import type { TaiwanGeo } from "../lib/taiwanGeo";

const WIDTH = 520;
const HEIGHT = 760;

interface HoverPoint {
    x: number;
    y: number;
}

interface TaiwanMapProps {
    geo: TaiwanGeo;
    selectedCounty: string | null;
    onSelectCounty: (name: string | null) => void;
    fillByCounty: Map<string, string>;
    onHoverCounty: (name: string | null, point: HoverPoint | null) => void;
}

export default function TaiwanMap({
    geo,
    selectedCounty,
    onSelectCounty,
    fillByCounty,
    onHoverCounty,
}: TaiwanMapProps) {
    const { counties, nationPath } = useMemo(() => {
        const projection = mercatorTw().fitSize([WIDTH, HEIGHT], {
            type: "FeatureCollection",
            features: geo.counties,
        });
        const generator = geoPath(projection);
        return {
            nationPath: generator(geo.nation) ?? "",
            counties: geo.counties.map((county) => ({
                name: county.properties.COUNTYNAME,
                d: generator(county) ?? "",
            })),
        };
    }, [geo]);

    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="taiwan-map"
            role="img"
            aria-label="台灣縣市地圖"
        >
            <path d={nationPath} className="taiwan-map__nation" />
            {counties.map(({ name, d }) => {
                const isSelected = name === selectedCounty;
                const fill = fillByCounty.get(name);

                return (
                    <path
                        key={name}
                        d={d}
                        className={`taiwan-map__county${
                            isSelected ? " is-selected" : ""
                        }`}
                        style={{ "--county-fill": fill } as CSSProperties}
                        tabIndex={0}
                        role="button"
                        aria-label={`${name}${isSelected ? "（已選取）" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => onSelectCounty(isSelected ? null : name)}
                        onMouseEnter={(event) =>
                            onHoverCounty(name, {
                                x: event.clientX,
                                y: event.clientY,
                            })
                        }
                        onMouseMove={(event) =>
                            onHoverCounty(name, {
                                x: event.clientX,
                                y: event.clientY,
                            })
                        }
                        onMouseLeave={() => onHoverCounty(null, null)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onSelectCounty(isSelected ? null : name);
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
