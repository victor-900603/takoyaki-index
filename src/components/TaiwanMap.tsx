import { useMemo } from "react";
import { geoPath } from "d3-geo";
import mercatorTw from "../lib/mercatorTw";
import type { TaiwanGeo } from "../lib/taiwanGeo";

const WIDTH = 520;
const HEIGHT = 760;

interface TaiwanMapProps {
    geo: TaiwanGeo;
    selectedCounty: string | null;
    onSelectCounty: (name: string | null) => void;
}

export default function TaiwanMap({
    geo,
    selectedCounty,
    onSelectCounty,
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

                return (
                    <path
                        key={name}
                        d={d}
                        className={`taiwan-map__county${
                            isSelected ? " is-selected" : ""
                        }`}
                        tabIndex={0}
                        role="button"
                        aria-label={`${name}${isSelected ? "（已選取）" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => onSelectCounty(isSelected ? null : name)}
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
