import type { CountyStat } from "../lib/stats";

interface MapTooltipProps {
    x: number;
    y: number;
    county: string;
    stat: CountyStat | undefined;
}

export default function MapTooltip({ x, y, county, stat }: MapTooltipProps) {
    return (
        <div className="map-tooltip" style={{ left: x, top: y }}>
            <strong className="map-tooltip__name">{county}</strong>
            {stat ? (
                <>
                    <span>平均 {stat.avg.toFixed(1)} 元／顆</span>
                    <span>中位數 {stat.median.toFixed(1)} 元／顆</span>
                    <span>樣本 {stat.sampleCount} 間</span>
                </>
            ) : (
                <span>尚無資料</span>
            )}
        </div>
    );
}
