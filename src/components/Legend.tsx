import {
    LOW_SAMPLE_COLOR,
    MIN_SAMPLE,
    NO_DATA_COLOR,
    type LegendTick,
} from "../lib/colorScale";

interface LegendProps {
    ticks: LegendTick[];
    colors: readonly string[];
    title: string;
}

export default function Legend({ ticks, colors, title }: LegendProps) {
    const hasScale = ticks.length > 0;
    return (
        <div className="legend">
            <h2 className="legend__title">{title}</h2>
            {hasScale && (
                <div className="legend__scale">
                    <div className="legend__bar">
                        {colors.map((color) => (
                            <span
                                key={color}
                                className="legend__band"
                                style={{ background: color }}
                            />
                        ))}
                    </div>
                    <div className="legend__ticks">
                        {ticks.map((tick, index) => (
                            <span
                                key={index}
                                className="legend__tick"
                                style={{ left: `${tick.position * 100}%` }}
                            >
                                <span className="legend__tick-mark" />
                                <span className="legend__tick-label">
                                    {tick.value.toFixed(1)}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <div className="legend__extras">
                <span className="legend__extra">
                    <span
                        className="legend__swatch"
                        style={{ background: LOW_SAMPLE_COLOR }}
                    />
                    樣本不足（少於 {MIN_SAMPLE} 間）
                </span>
                <span className="legend__extra">
                    <span
                        className="legend__swatch"
                        style={{ background: NO_DATA_COLOR }}
                    />
                    無資料
                </span>
            </div>
        </div>
    );
}
