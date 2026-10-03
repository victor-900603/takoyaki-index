import type { RegionStat } from "../lib/stats";

interface MapTooltipProps {
    x: number;
    y: number;
    name: string;
    stat: RegionStat | undefined;
    unit: string;
}

export default function MapTooltip({
    x,
    y,
    name,
    stat,
    unit,
}: MapTooltipProps) {
    return (
        <div className="map-tooltip" style={{ left: x, top: y }}>
            <strong className="map-tooltip__name">{name}</strong>
            {stat ? (
                <>
                    <span>
                        平均 {stat.avg.toFixed(1)} {unit}
                    </span>
                    <span>
                        中位數 {stat.median.toFixed(1)} {unit}
                    </span>
                    <span>
                        範圍 {stat.min.toFixed(1)}–{stat.max.toFixed(1)} {unit}
                    </span>
                    <span>樣本 {stat.sampleCount} 間</span>
                </>
            ) : (
                <span>尚無資料</span>
            )}
        </div>
    );
}
