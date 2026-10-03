import type { RegionStat } from "../lib/stats";

export interface TooltipAction {
    label: string;
    onClick: () => void;
}

interface MapTooltipProps {
    x: number;
    y: number;
    name: string;
    stat: RegionStat | undefined;
    unit: string;
    action?: TooltipAction;
}

export default function MapTooltip({
    x,
    y,
    name,
    stat,
    unit,
    action,
}: MapTooltipProps) {
    return (
        <div
            className={
                "map-tooltip" + (action ? " map-tooltip--interactive" : "")
            }
            style={{ left: x, top: y }}
        >
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
            {action && (
                <button
                    type="button"
                    className="map-tooltip__action"
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
