import { useMemo, type CSSProperties } from "react";
import { geoPath } from "d3-geo";
import mercatorTw from "../lib/mercatorTw";
import { buildMapView, regionName, type ViewLevel } from "../lib/mapView";
import type { TaiwanGeo } from "../lib/taiwanGeo";

const WIDTH = 520;
const HEIGHT = 760;

const INSET_COL_X = 18;
const INSET_COL_W = 118;
const INSET_SLOT_H = 112;
const INSET_GAP = 56;
const INSET_TOP =
    (HEIGHT -
        (3 * INSET_SLOT_H + 2 * INSET_GAP)) /
    2;

const MAIN_LEFT = INSET_COL_X + INSET_COL_W + 14;
const MAIN_TOP = 12;
const MAIN_RIGHT = WIDTH - 20;
const MAIN_BOTTOM = HEIGHT - 12;

const INSET_SLOTS: { county: string; text: string }[] = [
    { county: "連江縣", text: "馬祖" },
    { county: "金門縣", text: "金門" },
    { county: "澎湖縣", text: "澎湖" },
];

interface HoverPoint {
    x: number;
    y: number;
}

interface TaiwanMapProps {
    geo: TaiwanGeo;
    level: ViewLevel;
    county: string | null;
    selectedRegion: string | null;
    hoveredRegion: string | null;
    fillByRegion: Map<string, string>;
    onSelectRegion: (name: string) => void;
    onHoverRegion: (name: string | null, point: HoverPoint | null) => void;
}

interface InsetView {
    key: string;
    text: string;
    box: { x: number; y: number; w: number; h: number };
    d: string;
}

interface ComputedView {
    regions: { name: string; d: string }[];
    insets: InsetView[];
    label: string;
}

function computeView(
    geo: TaiwanGeo,
    level: ViewLevel,
    county: string | null,
): ComputedView {
    const view = buildMapView(geo, level, county);
    const isCountyLevel = level === "county";

    const insetCounties = new Set(INSET_SLOTS.map((slot) => slot.county));
    const mainFeatures = isCountyLevel
        ? view.features.filter(
              (feature) => !insetCounties.has(regionName(feature)),
          )
        : view.features;

    const projection = mercatorTw().fitExtent(
        isCountyLevel
            ? [
                  [MAIN_LEFT, MAIN_TOP],
                  [MAIN_RIGHT, MAIN_BOTTOM],
              ]
            : [
                  [20, 12],
                  [WIDTH - 20, HEIGHT - 12],
              ],
        {
            type: "FeatureCollection",
            features: mainFeatures,
        },
    );
    const generator = geoPath(projection);

    const insets: InsetView[] = [];
    if (isCountyLevel) {
        INSET_SLOTS.forEach((slot, index) => {
            const feature = view.features.find(
                (item) => regionName(item) === slot.county,
            );
            if (!feature) return;

            const boxY = INSET_TOP + index * (INSET_SLOT_H + INSET_GAP);
            const innerX = INSET_COL_X + 10;
            const innerY = boxY + 26;
            const innerW = INSET_COL_W - 20;
            const innerH = INSET_SLOT_H - 36;

            const insetProjection = mercatorTw().fitExtent(
                [
                    [innerX, innerY],
                    [innerX + innerW, innerY + innerH],
                ],
                feature,
            );

            insets.push({
                key: slot.county,
                text: slot.text,
                box: {
                    x: INSET_COL_X,
                    y: boxY,
                    w: INSET_COL_W,
                    h: INSET_SLOT_H,
                },
                d: geoPath(insetProjection)(feature) ?? "",
            });
        });
    }

    return {
        insets,
        label: view.label,
        regions: mainFeatures.map((feature) => ({
            name: regionName(feature),
            d: generator(feature) ?? "",
        })),
    };
}

interface RegionProps {
    name: string;
    d: string;
    fill: string | undefined;
    isSelected: boolean;
    onSelectRegion: (name: string) => void;
    onHoverRegion: (name: string | null, point: HoverPoint | null) => void;
}

function Region({
    name,
    d,
    fill,
    isSelected,
    onSelectRegion,
    onHoverRegion,
}: RegionProps) {
    return (
        <path
            d={d}
            className={`taiwan-map__region${isSelected ? " is-selected" : ""}`}
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
}

export default function TaiwanMap({
    geo,
    level,
    county,
    selectedRegion,
    hoveredRegion,
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
    const { regions, insets, label } =
        level === "town" && townView ? townView : countyView;

    const pathByName = new Map<string, string>();
    for (const region of regions) pathByName.set(region.name, region.d);
    for (const inset of insets) pathByName.set(inset.key, inset.d);

    const selectedPath = selectedRegion
        ? pathByName.get(selectedRegion)
        : undefined;
    const hoveredPath =
        hoveredRegion && hoveredRegion !== selectedRegion
            ? pathByName.get(hoveredRegion)
            : undefined;

    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="taiwan-map"
            role="img"
            aria-label={label}
        >
            {regions.map(({ name, d }) => (
                <Region
                    key={name}
                    name={name}
                    d={d}
                    fill={fillByRegion.get(name)}
                    isSelected={name === selectedRegion}
                    onSelectRegion={onSelectRegion}
                    onHoverRegion={onHoverRegion}
                />
            ))}
            {insets.map((inset) => (
                <g key={inset.key}>
                    <rect
                        x={inset.box.x}
                        y={inset.box.y}
                        width={inset.box.w}
                        height={inset.box.h}
                        className="taiwan-map__inset-box"
                    />
                    <text
                        x={inset.box.x + 9}
                        y={inset.box.y + 16}
                        className="taiwan-map__inset-label"
                    >
                        {inset.text}
                    </text>
                    <Region
                        name={inset.key}
                        d={inset.d}
                        fill={fillByRegion.get(inset.key)}
                        isSelected={inset.key === selectedRegion}
                        onSelectRegion={onSelectRegion}
                        onHoverRegion={onHoverRegion}
                    />
                </g>
            ))}
            {selectedPath && (
                <path
                    className="taiwan-map__outline taiwan-map__outline--selected"
                    d={selectedPath}
                />
            )}
            {hoveredPath && (
                <path
                    className="taiwan-map__outline taiwan-map__outline--hover"
                    d={hoveredPath}
                />
            )}
        </svg>
    );
}
