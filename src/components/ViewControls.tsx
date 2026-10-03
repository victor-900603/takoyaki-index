import type { ScaleMode } from "../lib/colorScale";
import type { Metric } from "../lib/metric";

interface ViewControlsProps {
    metric: Metric;
    onMetricChange: (metric: Metric) => void;
    scaleMode: ScaleMode;
    onScaleModeChange: (mode: ScaleMode) => void;
}

const METRIC_OPTIONS: { id: Metric; label: string }[] = [
    { id: "unit", label: "每顆單價" },
    { id: "box6", label: "一盒 6 顆" },
];

const SCALE_OPTIONS: { id: ScaleMode; label: string }[] = [
    { id: "quantile", label: "分位" },
    { id: "fixed", label: "固定級距" },
];

export default function ViewControls({
    metric,
    onMetricChange,
    scaleMode,
    onScaleModeChange,
}: ViewControlsProps) {
    return (
        <div className="view-controls">
            <div className="view-controls__group" role="group" aria-label="價格口徑">
                {METRIC_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        className={`view-controls__button${
                            metric === option.id ? " is-active" : ""
                        }`}
                        aria-pressed={metric === option.id}
                        onClick={() => onMetricChange(option.id)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <div className="view-controls__group" role="group" aria-label="分級方式">
                {SCALE_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        className={`view-controls__button${
                            scaleMode === option.id ? " is-active" : ""
                        }`}
                        aria-pressed={scaleMode === option.id}
                        onClick={() => onScaleModeChange(option.id)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
