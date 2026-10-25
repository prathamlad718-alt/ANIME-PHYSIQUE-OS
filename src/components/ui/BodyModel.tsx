import React, { useState } from 'react';
import { StandardMetricKey, STANDARD_METRIC_LABELS, MeasurementEntry } from '../../domain/types';
import { Crosshair, RotateCw } from 'lucide-react';

interface BodyModelProps {
  selectedSite: StandardMetricKey;
  onSelectSite: (site: StandardMetricKey) => void;
  latestEntry?: MeasurementEntry;
  priorEntry?: MeasurementEntry;
}

interface SiteTarget {
  key: StandardMetricKey;
  label: string;
  x: number; // percentage
  y: number; // percentage
  view: 'front' | 'back' | 'both';
}

const BODY_SITES: SiteTarget[] = [
  { key: 'neck', label: 'Neck', x: 50, y: 15, view: 'both' },
  { key: 'shoulders', label: 'Deltoids', x: 50, y: 22, view: 'both' },
  { key: 'chest', label: 'Pectorals', x: 50, y: 29, view: 'front' },
  { key: 'leftUpperArm', label: 'L. Bicep', x: 28, y: 31, view: 'both' },
  { key: 'rightUpperArm', label: 'R. Bicep', x: 72, y: 31, view: 'both' },
  { key: 'leftForearm', label: 'L. Forearm', x: 22, y: 44, view: 'both' },
  { key: 'rightForearm', label: 'R. Forearm', x: 78, y: 44, view: 'both' },
  { key: 'waist', label: 'Waist / Core', x: 50, y: 42, view: 'front' },
  { key: 'hips', label: 'Hips / Glutes', x: 50, y: 52, view: 'both' },
  { key: 'leftThigh', label: 'L. Quad / Hamstring', x: 39, y: 64, view: 'both' },
  { key: 'rightThigh', label: 'R. Quad / Hamstring', x: 61, y: 64, view: 'both' },
  { key: 'leftCalf', label: 'L. Calf', x: 38, y: 82, view: 'both' },
  { key: 'rightCalf', label: 'R. Calf', x: 62, y: 82, view: 'both' },
];

export const BodyModel: React.FC<BodyModelProps> = ({
  selectedSite,
  onSelectSite,
  latestEntry,
  priorEntry,
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [hoveredSite, setHoveredSite] = useState<StandardMetricKey | null>(null);

  const activeSites = BODY_SITES.filter(
    (site) => site.view === 'both' || site.view === view
  );

  const activeTarget = hoveredSite || selectedSite;
  const currentVal = latestEntry?.standardMetrics[activeTarget];
  const priorVal = priorEntry?.standardMetrics[activeTarget];
  const delta =
    currentVal !== undefined && priorVal !== undefined ? currentVal - priorVal : null;

  return (
    <div className="relative border border-tactical-border/80 bg-obsidian-charcoal/90 p-4 rounded-sm flex flex-col items-center justify-between overflow-hidden shadow-hud-blue">
      {/* Background Target Grid Overlay */}
      <div className="absolute inset-0 bg-tactical-grid opacity-40 pointer-events-none" />

      {/* Top Header: View Toggle & Selected Site Telemetry */}
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-tactical-border/60 z-10">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-solo-blue animate-spin-slow" />
          <span className="font-display font-bold uppercase text-xs tracking-wider text-white">
            ANATOMICAL HUD SCANNER
          </span>
        </div>

        <button
          onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono uppercase bg-obsidian-elevated border border-tactical-border hover:border-solo-blue text-ayanokoji-secondary hover:text-white rounded-sm transition-colors"
        >
          <RotateCw className="w-3 h-3 text-solo-blue" />
          <span>{view.toUpperCase()} VIEW</span>
        </button>
      </div>

      {/* Center Stage: Interactive Wireframe Mannequin Canvas */}
      <div className="relative w-full max-w-[280px] h-[340px] flex items-center justify-center my-2 select-none">
        {/* Futuristic SVG Wireframe Human Silhouette */}
        <svg
          viewBox="0 0 200 360"
          className="w-full h-full stroke-tactical-border/70 fill-obsidian-void/80"
        >
          <defs>
            <linearGradient id="bodyGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.06" />
            </linearGradient>
            <radialGradient id="reticleGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00D2FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Coordinate Scan Rings */}
          <circle cx="100" cy="180" r="160" stroke="#1E293B" strokeDasharray="3 6" fill="none" opacity="0.4" />
          <circle cx="100" cy="180" r="110" stroke="#1E293B" strokeDasharray="2 4" fill="none" opacity="0.4" />

          {/* Athletic Silhouette Outline */}
          {/* Head & Neck */}
          <path
            d="M 100 20 C 112 20 120 32 120 48 C 120 62 114 70 110 74 L 110 82 L 90 82 L 90 74 C 86 70 80 62 80 48 C 80 32 88 20 100 20 Z"
            fill="url(#bodyGlow)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Torso & Shoulders */}
          {view === 'front' ? (
            <path
              d="M 90 82 L 110 82 L 148 94 L 140 148 L 126 150 L 120 185 L 124 205 L 76 205 L 80 185 L 74 150 L 60 148 L 52 94 Z"
              fill="url(#bodyGlow)"
              stroke="#334155"
              strokeWidth="1.5"
            />
          ) : (
            /* Back view: Trapezius and lats emphasis */
            <path
              d="M 90 82 L 110 82 L 152 92 L 142 148 L 128 150 L 120 185 L 124 205 L 76 205 L 80 185 L 72 150 L 58 148 L 48 92 Z"
              fill="url(#bodyGlow)"
              stroke="#334155"
              strokeWidth="1.5"
            />
          )}

          {/* Chest & Core Wireframe lines */}
          {view === 'front' ? (
            <>
              {/* Pec lines */}
              <path d="M 72 118 Q 100 128 128 118" stroke="#00D2FF" strokeWidth="1" opacity="0.3" fill="none" />
              <line x1="100" y1="95" x2="100" y2="180" stroke="#00D2FF" strokeWidth="1" strokeDasharray="2 3" opacity="0.25" />
              {/* Abdominal segments */}
              <line x1="88" y1="140" x2="112" y2="140" stroke="#334155" strokeWidth="1" />
              <line x1="86" y1="156" x2="114" y2="156" stroke="#334155" strokeWidth="1" />
              <line x1="88" y1="172" x2="112" y2="172" stroke="#334155" strokeWidth="1" />
            </>
          ) : (
            /* Demon back spine line */
            <>
              <line x1="100" y1="85" x2="100" y2="195" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
              <path d="M 75 110 Q 100 135 125 110" stroke="#EF4444" strokeWidth="1" opacity="0.3" fill="none" />
              <path d="M 80 140 Q 100 160 120 140" stroke="#EF4444" strokeWidth="1" opacity="0.3" fill="none" />
            </>
          )}

          {/* Arms (Left & Right) */}
          <path
            d="M 52 94 L 40 140 L 32 195 L 38 200 L 48 150 L 60 115 Z"
            fill="url(#bodyGlow)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <path
            d="M 148 94 L 160 140 L 168 195 L 162 200 L 152 150 L 140 115 Z"
            fill="url(#bodyGlow)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Legs & Calves */}
          {/* Left Leg */}
          <path
            d="M 78 205 L 72 265 L 70 330 L 80 348 L 86 348 L 90 325 L 94 265 L 98 205 Z"
            fill="url(#bodyGlow)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          {/* Right Leg */}
          <path
            d="M 122 205 L 128 265 L 130 330 L 120 348 L 114 348 L 110 325 L 106 265 L 102 205 Z"
            fill="url(#bodyGlow)"
            stroke="#334155"
            strokeWidth="1.5"
          />
        </svg>

        {/* Interactive Coordinate Target Markers */}
        {activeSites.map((site) => {
          const isSelected = selectedSite === site.key;
          const isHovered = hoveredSite === site.key;

          return (
            <button
              key={site.key}
              type="button"
              onClick={() => onSelectSite(site.key)}
              onMouseEnter={() => setHoveredSite(site.key)}
              onMouseLeave={() => setHoveredSite(null)}
              style={{
                left: `${site.x}%`,
                top: `${site.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20 cursor-pointer p-2"
              title={site.label}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? 'scale-125 border-2 border-solo-blue bg-solo-blue shadow-[0_0_12px_rgba(0,210,255,0.9)] ring-2 ring-solo-blue/40'
                    : isHovered
                    ? 'scale-110 border border-white bg-solo-blue/60'
                    : 'border border-tactical-border bg-obsidian-charcoal hover:border-solo-blue/80'
                }`}
              >
                <div
                  className={`w-1 h-1 rounded-full ${
                    isSelected ? 'bg-obsidian-void' : 'bg-ayanokoji-muted group-hover:bg-solo-blue'
                  }`}
                />
              </div>

              {/* Ping wave animation when selected */}
              {isSelected && (
                <span className="absolute inset-0 rounded-full bg-solo-blue/30 animate-ping pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Live Target Telemetry Readout */}
      <div className="w-full bg-obsidian-void border border-tactical-border/80 p-2.5 rounded-sm z-10">
        <div className="flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-[10px] text-ayanokoji-muted uppercase tracking-wider block">
              TARGET SITE
            </span>
            <span className="text-white font-bold text-xs">
              {STANDARD_METRIC_LABELS[activeTarget]}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-ayanokoji-muted uppercase tracking-wider block">
              READING
            </span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-solo-blue font-bold tabular-nums">
                {currentVal !== undefined ? `${currentVal} ${latestEntry?.unit || 'cm'}` : '—'}
              </span>
              {delta !== null && (
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    delta > 0
                      ? 'text-status-success'
                      : delta < 0
                      ? 'text-status-warning'
                      : 'text-ayanokoji-muted'
                  }`}
                >
                  ({delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
