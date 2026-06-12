import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

/** Shape of each analytics metric document from Firestore. */
interface MetricRow {
  date: string;
  views: number;
  signups: number;
  digests_sent: number;
}

const MARGIN = { top: 20, right: 30, bottom: 50, left: 100 } as const;
const CHART_HEIGHT = 300;

/**
 * Renders a responsive D3 horizontal bar chart inside the given container div.
 * Clears any previous SVG before drawing.
 */
function renderChart(container: HTMLDivElement, rows: MetricRow[]): void {
  d3.select(container).selectAll('*').remove();

  const containerWidth = container.clientWidth || 580;
  const width = containerWidth - MARGIN.left - MARGIN.right;
  const height = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', CHART_HEIGHT)
    .append('g')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  const maxVal =
    d3.max(rows, (d) => Math.max(d.views, d.signups, d.digests_sent)) ?? 1;

  const x = d3.scaleLinear().domain([0, maxVal + Math.ceil(maxVal * 0.1)]).range([0, width]);

  const y = d3
    .scaleBand()
    .range([0, height])
    .domain(rows.map((d) => d.date))
    .padding(0.25);

  const barH = y.bandwidth() / 3;

  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5))
    .attr('color', '#666')
    .selectAll('text')
    .style('font-family', 'monospace')
    .style('font-size', '10px');

  svg
    .append('g')
    .call(d3.axisLeft(y))
    .attr('color', '#666')
    .selectAll('text')
    .style('font-family', 'monospace')
    .style('font-size', '10px');

  const palette: Record<'views' | 'signups' | 'digests_sent', string> = {
    views: '#e2e8f0',
    signups: '#94a3b8',
    digests_sent: '#475569',
  };

  const keys: Array<'views' | 'signups' | 'digests_sent'> = ['views', 'signups', 'digests_sent'];

  keys.forEach((key, i) => {
    svg
      .selectAll(`rect-${key}`)
      .data(rows)
      .enter()
      .append('rect')
      .attr('x', x(0))
      .attr('y', (d) => (y(d.date) ?? 0) + barH * i)
      .attr('width', 0)
      .attr('height', barH)
      .attr('fill', palette[key])
      .transition()
      .duration(700)
      .delay(i * 150)
      .attr('width', (d) => x(d[key]));
  });

  // Legend
  const legend = svg.append('g').attr('transform', `translate(0, ${height + 32})`);
  keys.forEach((key, i) => {
    const lx = i * 110;
    legend.append('rect').attr('x', lx).attr('y', 0).attr('width', 10).attr('height', 10).attr('fill', palette[key]);
    legend
      .append('text')
      .attr('x', lx + 14)
      .attr('y', 9)
      .text(key.replace('_', ' '))
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .attr('fill', '#888');
  });
}

/**
 * DevDashboard — toggled via Ctrl+Shift+D / Cmd+Shift+D.
 * Visible only to authenticated users; chart data shown only to admins.
 */
export function DevDashboard(): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Admin check + data load
  useEffect(() => {
    if (!user || !isOpen) {
      setIsAdmin(false);
      setRows([]);
      return;
    }

    const loadData = async (): Promise<void> => {
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const adminFlag = userSnap.exists() && userSnap.data().isAdmin === true;
        setIsAdmin(adminFlag);

        if (!adminFlag) {
          setRows([]);
          setLoading(false);
          return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const metricsRef = collection(db, 'analytics', today, 'metrics');
        const snap = await getDocs(metricsRef);

        const fetched: MetricRow[] = snap.docs.map((d) => {
          const raw = d.data();
          return {
            date: typeof raw['date'] === 'string' ? raw['date'] : d.id,
            views: typeof raw['views'] === 'number' ? raw['views'] : 0,
            signups: typeof raw['signups'] === 'number' ? raw['signups'] : 0,
            digests_sent: typeof raw['digests_sent'] === 'number' ? raw['digests_sent'] : 0,
          } satisfies MetricRow;
        });

        setRows(fetched);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error('[DevDashboard] Failed to load analytics:', message);
        setIsAdmin(false);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, isOpen]);

  // D3 chart render + ResizeObserver
  useEffect(() => {
    if (!isOpen || !isAdmin || !chartRef.current || rows.length === 0) return;

    const container = chartRef.current;
    renderChart(container, rows);

    const observer = new ResizeObserver(() => {
      renderChart(container, rows);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, isAdmin, rows]);

  const exportCsv = useCallback((): void => {
    const header = 'Date,Views,Signups,Digests Sent';
    const body = rows.map((r) => `${r.date},${r.views},${r.signups},${r.digests_sent}`).join('\n');
    const uri = encodeURI(`data:text/csv;charset=utf-8,${header}\n${body}`);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rows]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-8 z-[100] bg-surface border border-border-subtle p-6 shadow-2xl rounded-xl w-[90vw] max-w-[650px]"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-heading italic text-xl">Dev Dashboard</h3>
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-mono font-bold">
                {isAdmin ? "Live Firestore Analytics" : "Admin Access Required"}
              </span>
            </div>
            <div className="flex gap-4 items-center">
              {isAdmin && rows.length > 0 && (
                <button
                  onClick={exportCsv}
                  className="text-[10px] uppercase tracking-widest text-text-muted hover:text-text-main active:scale-90 cursor-pointer border px-2 py-1 border-border-subtle hover:border-text-main rounded"
                >
                  Export CSV
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[10px] uppercase tracking-widest text-text-muted hover:text-text-main active:scale-90 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Body */}
          {loading && (
            <p className="text-xs font-mono text-text-muted text-center py-8">Loading analytics…</p>
          )}

          {!loading && !isAdmin && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-2xl">🔒</span>
              <p className="text-sm font-mono text-text-muted text-center">
                Admin access required to view analytics.
              </p>
            </div>
          )}

          {!loading && isAdmin && rows.length === 0 && (
            <p className="text-xs font-mono text-text-muted text-center py-8">
              No metrics found for today.
            </p>
          )}

          {!loading && isAdmin && rows.length > 0 && (
            <div ref={chartRef} className="w-full overflow-hidden" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DevDashboard;
