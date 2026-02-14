import React from 'react';

/**
 * Recharts dot props passed by LineChart
 */
interface RechartsDotProps {
  cx?: number;
  cy?: number;
  payload?: Record<string, unknown>;
  data?: unknown[];
}

interface ChartPeakDotConfig {
  /** Key in payload for the numeric value (e.g. 'minutes', 'score') */
  valueKey: string;
  /** Format the value for display in the badge */
  formatValue: (value: number) => string;
  /** Optional: filter values before computing min/max (e.g. exclude zeros) */
  filterValues?: (values: number[]) => number[];
  /** Optional: only show low peak when this returns true (e.g. when max - min > 1) */
  showLowOnlyWhen?: (min: number, max: number) => boolean;
}

export type ChartPeakDotProps = RechartsDotProps & ChartPeakDotConfig;

/**
 * Shared custom dot for Recharts LineChart that highlights peak (max) and low (min) points.
 * Used by Dashboard (Weekly Focus) and HappyIndex (Weekly Mood Flow).
 */
const ChartPeakDot = (props: ChartPeakDotProps) => {
  const { cx = 0, cy = 0, payload = {}, data = [], valueKey, formatValue, filterValues, showLowOnlyWhen } = props;

  if (!data || data.length === 0) return null;

  const items = data as Array<Record<string, unknown>>;
  let values = items.map((d) => Number(d[valueKey]) ?? 0);
  if (filterValues) {
    values = filterValues(values);
  }
  if (values.length === 0) return <circle cx={cx} cy={cy} r={0} />;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const value = Number(payload[valueKey]) ?? 0;

  // High peak
  if (value === max) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#fcd34d" stroke="#18181b" strokeWidth={3} />
        <foreignObject x={cx - 20} y={cy - 28} width={40} height={20}>
          <div className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1 rounded-md text-center border border-amber-500/20">
            {formatValue(value)}
          </div>
        </foreignObject>
      </g>
    );
  }

  // Low peak (only when showLowOnlyWhen returns true, or always if not provided)
  const shouldShowLow = !showLowOnlyWhen || showLowOnlyWhen(min, max);
  if (value === min && shouldShowLow) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#fb7185" stroke="#18181b" strokeWidth={3} />
        <foreignObject x={cx - 20} y={cy + 10} width={40} height={20}>
          <div className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-1 rounded-md text-center border border-rose-500/20">
            {formatValue(value)}
          </div>
        </foreignObject>
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={0} />;
};

export default ChartPeakDot;
