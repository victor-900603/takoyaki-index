import {
    LOW_SAMPLE_COLOR,
    MIN_SAMPLE,
    NO_DATA_COLOR,
} from "../lib/colorScale";

interface LegendProps {
    thresholds: number[];
    colors: readonly string[];
    title: string;
}

function formatRange(index: number, thresholds: number[]): string {
    if (index === 0) return `< ${thresholds[0].toFixed(1)}`;
    if (index === thresholds.length) {
        return `≥ ${thresholds[thresholds.length - 1].toFixed(1)}`;
    }
    return `${thresholds[index - 1].toFixed(1)}–${thresholds[index].toFixed(1)}`;
}

export default function Legend({ thresholds, colors, title }: LegendProps) {
    return (
        <div className="legend">
            <h2 className="legend__title">{title}</h2>
            <ul className="legend__list">
                {thresholds.length > 0 &&
                    colors.map((color, index) => (
                        <li key={color} className="legend__item">
                            <span
                                className="legend__swatch"
                                style={{ background: color }}
                            />
                            <span>{formatRange(index, thresholds)}</span>
                        </li>
                    ))}
                <li className="legend__item">
                    <span
                        className="legend__swatch"
                        style={{ background: LOW_SAMPLE_COLOR }}
                    />
                    <span>樣本不足（少於 {MIN_SAMPLE} 間）</span>
                </li>
                <li className="legend__item">
                    <span
                        className="legend__swatch"
                        style={{ background: NO_DATA_COLOR }}
                    />
                    <span>無資料</span>
                </li>
            </ul>
        </div>
    );
}
