import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';

// ─── Node data ──────────────────────────────────────────────────────────────
// SVG-space coordinates, matching viewBox="0 0 900 200".

const NODE_POSITIONS = [
  { x: 80, y: 120 },  // RSS Feed
  { x: 230, y: 70 },  // Scraper
  { x: 450, y: 100 }, // Gemini AI
  { x: 670, y: 70 },  // Gmail
  { x: 820, y: 120 }, // You
];

const NODE_INFOS = [
  { name: 'RSS Feed', desc: 'Monitors 100+ curated blogs, engineering channels, and news feeds in real-time.' },
  { name: 'Scraper', desc: 'Extracts full article content, strips media noise, and parses structural metadata.' },
  { name: 'Gemini AI', desc: 'Synthesizes raw inputs into deep technical, structured academic digests.' },
  { name: 'Gmail', desc: 'Formats the finished synopsis and coordinates daily inbox dispatch via Gmail APIs.' },
  { name: 'You', desc: 'A clean, structured intelligence briefing waiting in your inbox by 7:00 AM daily.' },
];

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 200;

// Pre-compute label positions as percentages of the viewBox so they can be
// placed with plain absolute left/top — no per-frame JS projection needed.
const NODE_PERCENT_POSITIONS = NODE_POSITIONS.map((p) => ({
  left: (p.x / VIEWBOX_WIDTH) * 100,
  top: (p.y / VIEWBOX_HEIGHT) * 100,
}));

/**
 * Converts a list of 2D points into a single SVG path `d` string using
 * cubic Bezier segments that approximate a Catmull-Rom spline (the same
 * curve family THREE.CatmullRomCurve3 produces), so the line travels
 * smoothly through every node without any drawing library.
 */
function catmullRomToBezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < points.length ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x},${p2.y}`;
  }

  return d;
}

const PULSE_COUNT = 3;
const PULSE_DURATION = 4;
const PULSE_STAGGER = 0.8;
const MAX_TILT_DEG = 4;

type TooltipAnchor = 'left' | 'right' | 'center';

export function Pipeline3D(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // ─── Tooltip overflow detection ─────────────────────────────────────────
  // Refs to each node's popover element so we can measure its actual
  // on-screen position and re-anchor it dynamically if it would clip past
  // the viewport edge — no hardcoded pixel offsets, purely measured.
  const tooltipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [tooltipAnchor, setTooltipAnchor] = useState<TooltipAnchor>('center');

  useLayoutEffect(() => {
    if (hoveredNode === null) return;

    const el = tooltipRefs.current[hoveredNode];
    if (!el) return;

    // Measure with the current (default/center) anchoring applied, then
    // correct synchronously before paint if it overflows either edge.
    const rect = el.getBoundingClientRect();

    if (rect.right > window.innerWidth) {
      setTooltipAnchor('right');
    } else if (rect.left < 0) {
      setTooltipAnchor('left');
    } else {
      setTooltipAnchor('center');
    }
  }, [hoveredNode]);

  const pathD = useMemo(() => catmullRomToBezierPath(NODE_POSITIONS), []);

  // ─── Mouse parallax ─────────────────────────────────────────────────────
  // Direct style mutation on mousemove — no rAF loop, no Three.js.
  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      if (relX < 0 || relX > rect.width || relY < 0 || relY > rect.height) return;

      const x = (relX / rect.width - 0.5) * 2; // -1..1
      const y = (relY / rect.height - 0.5) * 2; // -1..1

      const rotateY = x * MAX_TILT_DEG;
      const rotateX = -y * MAX_TILT_DEG;

      svg.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    };

    const onMouseLeave = () => {
      svg.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto" id="pipeline-3d">
      <div className="text-center mb-12">
        <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 block font-bold">
          Data Flow Visualizer
        </span>
        <h2 className="font-heading text-5xl mb-6">
          End-to-End <span className="italic">Execution Pipeline</span>
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
          Trace the lifecycle of a daily briefing, from scraping raw external sources to direct inbox delivery.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[400px] md:h-[480px] bg-surface-dim overflow-hidden border border-border-subtle flex items-center justify-center"
      >
        {/* SVG Pipeline (replaces the old Three.js WebGL scene) */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)', transition: 'transform 0.2s ease-out' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connecting line — Catmull-Rom-approximated cubic bezier through all nodes */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            className="opacity-30"
            style={{ filter: 'drop-shadow(0 0 6px var(--color-theme-glow))' }}
          />

          {/* Traveling pulse dots, animated along the same path via offset-path/offset-distance */}
          {Array.from({ length: PULSE_COUNT }).map((_, i) => (
            <motion.circle
              key={i}
              r={5}
              fill="var(--color-accent)"
              style={{
                offsetPath: `path('${pathD}')`,
                offsetRotate: '0deg',
                filter: 'drop-shadow(0 0 4px var(--color-theme-glow))',
              }}
              animate={{ offsetDistance: ['0%', '100%'] }}
              transition={{
                duration: PULSE_DURATION,
                repeat: Infinity,
                ease: 'linear',
                delay: i * PULSE_STAGGER,
              }}
            />
          ))}

          {/* Node markers */}
          {NODE_POSITIONS.map((pos, idx) => (
            <g key={idx}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={8}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={1.5}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={3}
                fill="var(--color-accent)"
                style={{ filter: 'drop-shadow(0 0 4px var(--color-theme-glow))' }}
              />
            </g>
          ))}
        </svg>

        {/* HTML Interactive Overlays */}
        {NODE_INFOS.map((node, idx) => {
          const pct = NODE_PERCENT_POSITIONS[idx];

          return (
            <div
              key={idx}
              className="absolute pointer-events-auto"
              style={{
                left: `${pct.left}%`,
                top: `${pct.top}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <div
                className="relative flex flex-col items-center group cursor-pointer"
                onMouseEnter={() => setHoveredNode(idx)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setHoveredNode(hoveredNode === idx ? null : idx)}
              >
                {/* Visual node core */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border border-text-main flex items-center justify-center transition-all duration-300 ${
                    hoveredNode === idx ? 'scale-125 bg-text-main/15' : 'group-hover:scale-115'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-text-main" />
                </div>

                {/* Badge Label */}
                <div
                  className={`mt-2.5 px-3 py-1.5 border border-border-subtle bg-surface/90 backdrop-blur-md text-[9px] uppercase tracking-widest font-bold text-text-main transition-colors duration-300 shadow-sm select-none ${
                    hoveredNode === idx ? 'border-text-main' : 'group-hover:border-text-muted'
                  }`}
                >
                  {node.name}
                </div>

                {/*
                  Sliding popover description.
                  Anchoring is now dynamic: it defaults to centered, and
                  tooltipAnchor (computed via getBoundingClientRect in the
                  useLayoutEffect above) re-anchors it left or right only
                  when the centered position would actually overflow the
                  viewport — so it works correctly at any screen width,
                  not just for the first/last node in the list.
                */}
                <div
                  ref={(el) => {
                    tooltipRefs.current[idx] = el;
                  }}
                  className={`absolute bottom-full mb-3 w-48 p-3 bg-surface border border-border-subtle shadow-xl backdrop-blur-md text-[10px] text-text-muted leading-relaxed font-mono transition-all duration-300 pointer-events-none ${
                    hoveredNode === idx
                      ? 'opacity-100 translate-y-0 visible'
                      : 'opacity-0 translate-y-2 invisible'
                  } ${
                    hoveredNode === idx && tooltipAnchor === 'left'
                      ? 'left-0 translate-x-0'
                      : hoveredNode === idx && tooltipAnchor === 'right'
                      ? 'right-0 translate-x-0'
                      : 'left-1/2 -translate-x-1/2'
                  }`}
                >
                  <div className="text-text-main font-bold uppercase tracking-widest mb-1.5 border-b border-border-subtle pb-1">
                    {node.name}
                  </div>
                  <div>{node.desc}</div>
                  <div
                    className={`absolute top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-border-subtle ${
                      hoveredNode === idx && tooltipAnchor === 'left'
                        ? 'left-4'
                        : hoveredNode === idx && tooltipAnchor === 'right'
                        ? 'right-4'
                        : 'left-1/2 -translate-x-1/2'
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Pipeline3D;