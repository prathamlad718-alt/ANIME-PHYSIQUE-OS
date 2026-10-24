import React, { useState } from 'react';

export interface TrendDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
  label?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  unit: string;
  color?: 'blue' | 'crimson';
  height?: number;
  emptyMessage?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  unit,
  color = 'blue',
  height = 200,
  emptyMessage = 'No trajectory data points recorded yet.',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center border border-tactical-border/40 bg-obsidian-charcoal/30 text-xs font-mono text-ayanokoji-muted"
      >
        {emptyMessage}
      </div>
    );
  }

  // Sort chronological for chart display
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const values = sorted.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const paddingX = 40;
  const paddingY = 30;
  const svgWidth = 500;
  const svgHeight = height;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const points = sorted.map((d, index) => {
    const x =
      sorted.length === 1
        ? paddingX + chartWidth / 2
        : paddingX + (index / (sorted.length - 1)) * chartWidth;
    const y =
      sorted.length === 1
        ? paddingY + chartHeight / 2
        : paddingY + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, curr, index) => {
    return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${
          paddingY + chartHeight
        } Z`
      : '';

  const strokeColor = color === 'crimson' ? '#EF4444' : '#00D2FF';

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* Tooltip bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-ayanokoji-muted mb-2 px-1">
        <div>
          <span>MIN: </span>
          <span className="text-ayanokoji-slate font-semibold tabular-nums">
            {minVal.toFixed(1)} {unit}
          </span>
          <span className="mx-2 text-tactical-border">|</span>
          <span>MAX: </span>
          <span className="text-ayanokoji-slate font-semibold tabular-nums">
            {maxVal.toFixed(1)} {unit}
          </span>
        </div>
        <div>
          {hoveredPoint ? (
            <span className="text-solo-blue font-semibold">
              {hoveredPoint.date}: {hoveredPoint.value.toFixed(1)} {unit}
            </span>
          ) : (
            <span>{sorted.length} RECORDED POINTS</span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={svgWidth - paddingX}
          y2={paddingY}
          stroke="#1E293B"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <line
          x1={paddingX}
          y1={paddingY + chartHeight / 2}
          x2={svgWidth - paddingX}
          y2={paddingY + chartHeight / 2}
          stroke="#1E293B"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <line
          x1={paddingX}
          y1={paddingY + chartHeight}
          x2={svgWidth - paddingX}
          y2={paddingY + chartHeight}
          stroke="#1E293B"
          strokeWidth="1"
        />

        {/* Area fill */}
        {areaD && <path d={areaD} fill={`url(#grad-${color})`} />}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((pt, idx) => (
          <g key={idx} className="cursor-pointer">
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.date === pt.data.date ? 6 : 4}
              fill="#07080C"
              stroke={strokeColor}
              strokeWidth="2"
              onMouseEnter={() => setHoveredPoint(pt.data)}
              onMouseLeave={() => setHoveredPoint(null)}
              className="transition-all duration-150"
            />
          </g>
        ))}
      </svg>

      {/* Axis dates */}
      <div className="flex justify-between text-[10px] font-mono text-ayanokoji-muted mt-1 px-1">
        <span>{sorted[0].date}</span>
        {sorted.length > 1 && <span>{sorted[sorted.length - 1].date}</span>}
      </div>
    </div>
  );
};
