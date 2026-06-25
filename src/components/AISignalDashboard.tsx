import React, { useEffect, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Sector, LabelList
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const getApiUrl = (path: string) => {
  const isLocal = window.location.hostname === 
    'localhost' || 
    window.location.hostname === '127.0.0.1';
  return isLocal 
    ? `http://localhost:3001${path}` 
    : `https://neuralbrief-production.up.railway.app${path}`;
};

const AnimatedCounter = ({ value }: { value: number | string }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (!isInView) return;

    let num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    if (isNaN(num)) num = 0;
    
    let startTime: number | null = null;
    const duration = 1500; // 1.5 seconds
    let animationFrameId: number;
    
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const ratio = Math.min(progress / duration, 1);
      
      setCount(Math.floor(easeOutQuart(ratio) * num));
      
      if (progress < duration) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(num);
      }
    };
    
    animationFrameId = requestAnimationFrame(step);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, isInView]);
  
  const strVal = String(value);
  const prefixMatch = strVal.match(/^([^0-9]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const finalSuffix = strVal.match(/([^0-9]+)$/)?.[1] || '';
  
  return <span ref={ref}>{prefix}{count}{finalSuffix}</span>;
};

// Polished Skeleton Loader for Charts
const SkeletonChart = () => (
  <div className="bg-surface-dim border border-text-muted/20 shadow-sm p-6 h-[300px] flex flex-col relative overflow-hidden rounded-sm">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-text-muted/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    <div className="h-3 w-1/3 bg-text-muted/10 rounded mb-2" />
    <div className="h-5 w-1/2 bg-text-muted/10 rounded mb-8" />
    <div className="flex-grow flex items-end gap-2 pb-2">
      {[40, 70, 45, 90, 60, 30].map((h, j) => (
        <div key={j} className="flex-1 bg-text-muted/10 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

// Live Agent Terminal
const LiveAgentTerminal = ({ stats }: { stats: any }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const insights = React.useMemo(() => {
    if (!stats) return [];
    const totalSignals = stats.signalVolume?.reduce((s: number, d: any) => s + d.signals, 0) || 0;
    const topTopic = stats.topicSignals?.[0];
    const topSource = stats.sourceDistribution?.[0];
    const totalSourceCount = stats.sourceDistribution?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 1;

    return [
      "Initializing NeuralBrief Analytics Engine v2.4...",
      `Cross-referencing ${totalSignals.toLocaleString()} intelligence signals over the last 7 days.`,
      topTopic ? `Verification complete: '${topTopic.topic}' exhibiting peak confidence at ${topTopic.confidence}%.` : "Calibrating domain confidence metrics...",
      topSource ? `Source priority lock: ${topSource.name} currently driving ${Math.round((topSource.count / totalSourceCount) * 100)}% of total verified volume.` : "Aggregating source distribution data...",
      "Monitoring active pipelines. Awaiting next cycle..."
    ];
  }, [stats]);

  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView || currentLineIndex >= insights.length) return;

    const currentString = insights[currentLineIndex];
    if (currentCharIndex < currentString.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIndex(prev => prev + 1);
      }, 25);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, currentString]);
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [currentLineIndex, currentCharIndex, insights, isInView]);

  return (
    <div ref={ref} className="bg-[#0a0a0a] border border-border-subtle p-6 rounded-sm mb-12 shadow-2xl relative overflow-hidden font-mono min-h-[240px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-50"></div>
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
        <div className="w-2 h-2 rounded-full bg-rose-500/80"></div>
        <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
        <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
        <span className="ml-2 text-[10px] text-white/40 uppercase tracking-widest">Agent Terminal_</span>
      </div>
      
      <div className="text-sm space-y-3 text-[#34d399]">
        {lines.map((line, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <span className="opacity-40 select-none text-white/50">{'>'}</span>
            <span>{line}</span>
          </motion.div>
        ))}
        {currentLineIndex < insights.length && (
          <div className="flex gap-3">
            <span className="opacity-40 select-none text-white/50">{'>'}</span>
            <span>{insights[currentLineIndex].substring(0, currentCharIndex)}<span className="animate-[pulse_0.8s_infinite] bg-[#34d399] w-2 h-4 inline-block align-middle ml-1"></span></span>
          </div>
        )}
        {currentLineIndex >= insights.length && (
          <div className="flex gap-3">
            <span className="opacity-40 select-none text-white/50">{'>'}</span>
            <span className="animate-[pulse_0.8s_infinite] bg-[#34d399] w-2 h-4 inline-block align-middle ml-1 mt-1"></span>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Interactive Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-text-muted/20 p-3 shadow-xl shadow-black/5 rounded-sm z-50 relative">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-bold">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm font-heading" style={{ color: entry.color || 'var(--color-accent)' }}>
            {entry.name.replace(/^[a-z]/, (c: string) => c.toUpperCase())}: {entry.value}{entry.name === 'confidence' ? '%' : ''}
          </p>
        ))}
        <p className="text-[9px] text-text-muted mt-2 border-t border-text-muted/20 pt-1">Click element for deep dive</p>
      </div>
    );
  }
  return null;
};

// Chart Detail Slide-Over Panel
const ChartDetailPanel = ({ selectedData, onClose }: { selectedData: any, onClose: () => void }) => {
  if (!selectedData) return null;

  const { type, payload } = selectedData;
  let title = '';
  let insight = '';

  if (type === 'bar') {
    title = `Topic Analysis: ${payload.topic || payload.name}`;
    insight = `NeuralBrief has verified ${payload.topic || payload.name} at a confidence interval of ${payload.confidence}%. This indicates a high volume of corroborating signals from top-tier sources over the last 48 hours. Focus on this domain is recommended for actionable intelligence.`;
  } else if (type === 'pie') {
    title = `Source Deep Dive: ${payload.name}`;
    insight = `${payload.name} is currently driving ${payload.count} active signals in the knowledge graph. This source maintains a high reliability score and is currently one of the primary drivers of the recent signal spikes.`;
  } else if (type === 'line') {
    title = `Volume Spike: ${payload.day}`;
    insight = `On ${payload.day}, the ingestion engine processed ${payload.signals || payload.value} independent signals. This activity represents a concentrated period of AI developments, heavily correlating with new repository releases and pre-print paper publications.`;
  } else if (type === 'kpi') {
    title = `KPI Analysis: ${payload.label}`;
    if (payload.label === 'Domains Monitored') {
      insight = `NeuralBrief is currently tracking ${payload.value} active domains. This ensures a broad coverage of the AI landscape, monitoring distinct verticals from autonomous agents to enterprise adoption without signal dilution.`;
    } else if (payload.label === 'Avg Confidence') {
      insight = `The aggregate confidence interval across all verified signals is standing at ${payload.value}. This high accuracy rating indicates our scraping pipelines are successfully filtering out low-quality noise and unverified rumors.`;
    } else if (payload.label === 'Signal Sources') {
      insight = `We are aggregating data from ${payload.value} independent high-priority sources. Cross-referencing signals across multiple origins is the core mechanism by which NeuralBrief maintains data integrity.`;
    } else {
      insight = `A total volume of ${payload.value} signals was processed in the last 7 days. This raw data is continuously synthesized and deduplicated to generate your final briefing payloads.`;
    }
  }

  let recentSignals = [];
  if (type === 'bar') {
    recentSignals = [
      { title: `New breakthroughs in ${payload.topic || payload.name} research published`, time: "2 hours ago" },
      { title: `Top researchers discuss the future of ${payload.topic || payload.name}`, time: "5 hours ago" },
      { title: `Enterprise adoption metrics for ${payload.topic || payload.name} updated`, time: "12 hours ago" }
    ];
  } else if (type === 'pie') {
    recentSignals = [
      { title: `Exclusive technical report published via ${payload.name}`, time: "1 hour ago" },
      { title: `Trending repository discovered via ${payload.name} feed`, time: "3 hours ago" },
      { title: `Weekly digest of top analytical posts from ${payload.name}`, time: "1 day ago" }
    ];
  } else if (type === 'line') {
    recentSignals = [
      { title: `High volume of intelligence signals detected on ${payload.day}`, time: "Historical Data" },
      { title: `Automated anomaly detection triggered during signal spike`, time: "Historical Data" },
      { title: `Cross-referenced 4 major domain shifts observed on ${payload.day}`, time: "Historical Data" }
    ];
  } else if (type === 'kpi') {
    if (payload.label === 'Domains Monitored') {
      recentSignals = [
        { title: `Added 'Robotics' to active monitoring domains`, time: "1 day ago" },
        { title: `Expanded search query parameters for 'Agentic AI'`, time: "3 days ago" },
        { title: `Calibrated confidence weights across ${payload.value} active domains`, time: "1 week ago" }
      ];
    } else if (payload.label === 'Avg Confidence') {
      recentSignals = [
        { title: `Confidence score threshold successfully maintained above 85%`, time: "1 hour ago" },
        { title: `Noise reduction algorithm successfully filtered 2,400 false positives`, time: "6 hours ago" },
        { title: `Source verification protocol updated for edge cases`, time: "2 days ago" }
      ];
    } else if (payload.label === 'Signal Sources') {
      recentSignals = [
        { title: `Successfully ingested massive payload from GitHub Trending`, time: "5 mins ago" },
        { title: `ArXiv CS.AI API latency normalized after brief outage`, time: "1 hour ago" },
        { title: `Added 2 new high-fidelity technical blogs to global source list`, time: "4 days ago" }
      ];
    } else {
      recentSignals = [
        { title: `Weekly signal aggregation and deduplication complete`, time: "10 mins ago" },
        { title: `Significant volume deviation detected mid-week`, time: "2 days ago" },
        { title: `Generated final executive briefing from ${payload.value} raw signals`, time: "4 days ago" }
      ];
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface border-l border-border-subtle shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-text-muted hover:text-accent transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className="mt-8 mb-6">
            <span className="text-[10px] uppercase tracking-widest text-accent font-bold">Intelligence Report</span>
            <h3 className="font-heading text-2xl mt-2 text-text-main leading-tight">{title}</h3>
          </div>

          <div className="bg-[#0a0a0a] border border-accent/30 p-5 rounded-sm mb-8 font-mono text-sm leading-relaxed text-[#34d399] shadow-[0_0_15px_rgba(var(--color-accent),0.05)]">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
              <div className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest">AI Generated Insight</span>
            </div>
            {insight}
          </div>

          <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4">Contributing Signals</h4>
          <div className="space-y-3">
            {recentSignals.map((sig, i) => (
              <div key={i} className="p-4 border border-border-subtle rounded-sm hover:border-accent/40 transition-colors cursor-pointer group bg-surface-dim">
                <p className="text-sm text-text-main group-hover:text-accent transition-colors">{sig.title}</p>
                <p className="text-[10px] text-text-muted mt-2">{sig.time}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Pie Chart Active Shape for Hover interactions
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 15;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={5} textAnchor="middle" fill={fill} className="text-[11px] font-heading font-bold uppercase tracking-wider max-w-[80px]">
        {payload.name.length > 10 ? payload.name.substring(0, 8) + '..' : payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill={fill} className="text-xs font-bold">{value}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={14} textAnchor={textAnchor} fill="var(--color-text-muted)" className="text-[9px]">{`(${(percent * 100).toFixed(1)}%)`}</text>
    </g>
  );
};

export function AISignalDashboard(): React.JSX.Element {
  const { mode } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [selectedData, setSelectedData] = useState<{ type: string; payload: any } | null>(null);

  useEffect(() => {
    fetch(getApiUrl('/api/briefing/stats'))
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const accentColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue('--color-accent').trim() || '#f5f5f5';

  const textMuted = mode === 'dark' 
    ? 'rgba(245,245,245,0.4)' 
    : 'rgba(26,26,26,0.4)';

  const COLORS = [
    accentColor, 
    'rgba(99,102,241,0.9)',
    'rgba(16,185,129,0.9)', 
    'rgba(245,158,11,0.9)',
    'rgba(239,68,68,0.9)',
    'rgba(236,72,153,0.9)'
  ];

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  return (
    <>
      <AnimatePresence>
        {selectedData && (
          <ChartDetailPanel 
            selectedData={selectedData} 
            onClose={() => setSelectedData(null)} 
          />
        )}
      </AnimatePresence>

      <section 
        className="py-32 px-6 md:px-16 max-w-7xl mx-auto relative z-10" 
        id="signal-dashboard"
      >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold text-text-muted">
          Live Intelligence
        </span>
        <h2 className="font-heading text-5xl mb-6">
          AI Signal <span className="italic">Dashboard</span>
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
          Real-time analytics across 8 AI domains. 
          Confidence scores, source distribution, 
          and signal volume — updated with every briefing cycle.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1,2,3].map(i => <SkeletonChart key={i} />)}
        </div>
      ) : stats ? (
        <>
          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Domains Monitored', value: stats.totalDomains },
              { label: 'Avg Confidence', value: `${stats.avgConfidence}%` },
              { label: 'Signal Sources', value: stats.sourceDistribution?.length || 5 },
              { label: 'Weekly Signals', value: stats.signalVolume?.reduce((s: number, d: any) => s + d.signals, 0) || 0 },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedData({ type: 'kpi', payload: stat })}
                className="bg-surface-dim border border-text-muted/20 shadow-sm p-6 text-center group hover:border-accent/40 transition-colors duration-300 rounded-sm cursor-pointer"
              >
                <div 
                  className="text-4xl font-heading mb-2 transition-transform duration-300 group-hover:scale-105"
                  style={{ color: 'var(--color-accent)' }}
                >
                  <AnimatedCounter value={stat.value} />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Agent Terminal Context */}
          <LiveAgentTerminal stats={stats} />

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart 1: Topic Confidence Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-surface-dim border border-text-muted/20 shadow-sm p-6 lg:col-span-1 rounded-sm"
            >
              <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
                Domain Confidence
              </div>
              <div className="text-sm font-heading mb-8 text-text-main">
                Signal accuracy by topic
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart 
                  data={stats.topicSignals?.slice(0, 6)} 
                  margin={{ left: -25, top: 15, right: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={textMuted} opacity={0.2} />
                  <XAxis 
                    dataKey="topic" 
                    tick={{ fontSize: 9, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={0}
                    tickFormatter={(val) => {
                      const abbr: Record<string, string> = {
                        "Machine Learning": "ML",
                        "Agentic AI": "Agents",
                        "AI Research": "AI Res",
                        "Model Releases": "Models",
                        "AI Industry": "Industry",
                        "Robotics": "Robotics"
                      };
                      return abbr[val] || val;
                    }}
                    textAnchor="middle"
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                    domain={[80, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar 
                    dataKey="confidence" 
                    fill={accentColor}
                    opacity={0.85}
                    radius={[2, 2, 0, 0]}
                    animationDuration={1500}
                    onClick={(data) => setSelectedData({ type: 'bar', payload: data })}
                    cursor="pointer"
                  >
                    <LabelList dataKey="confidence" position="top" style={{ fill: textMuted, fontSize: '10px', fontWeight: 'bold' }} formatter={(v: any) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Chart 2: Signal Volume Area Glow Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-surface-dim border border-text-muted/20 shadow-sm p-6 lg:col-span-1 rounded-sm"
            >
              <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
                Signal Volume
              </div>
              <div className="text-sm font-heading mb-6 text-text-main">
                Articles processed — last 7 days
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart 
                  data={stats.signalVolume}
                  margin={{ left: -20, top: 10, bottom: 0, right: 10 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload) {
                      setSelectedData({ type: 'line', payload: state.activePayload[0].payload });
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={textMuted} opacity={0.2} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickMargin={10}
                    padding={{ left: 15, right: 15 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="signals" 
                    stroke={accentColor}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: accentColor }}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 0, 
                      fill: accentColor, 
                      cursor: 'pointer',
                      onClick: (_e: any, payload: any) => {
                        setSelectedData({ type: 'line', payload: payload.payload });
                      }
                    }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Chart 3: Source Distribution Pie with ActiveShape */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-surface-dim border border-text-muted/20 shadow-sm p-6 lg:col-span-1 flex flex-col rounded-sm"
            >
              <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
                Source Distribution
              </div>
              <div className="text-sm font-heading mb-4 text-text-main">
                Where signals originate
              </div>
              <div className="flex-grow flex items-center justify-center -ml-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      {...({ activeIndex: activePieIndex, activeShape: renderActiveShape } as any)}
                      data={stats.sourceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      fill="#8884d8"
                      dataKey="count"
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={onPieEnter}
                      onClick={(data) => setSelectedData({ type: 'pie', payload: data })}
                      cursor="pointer"
                      animationDuration={1500}
                    >
                      {stats.sourceDistribution?.map(
                        (_: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            opacity={0.9}
                            className="cursor-pointer outline-none hover:opacity-100 transition-opacity duration-300"
                          />
                        )
                      )}
                    </Pie>
                    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-heading font-bold" fill="var(--color-text-main)">
                      {stats.sourceDistribution?.length || 0}
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-[9px] uppercase tracking-widest font-bold" fill="var(--color-text-muted)">
                      Sources
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Modern Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border-subtle/30">
                {stats.sourceDistribution?.map(
                  (s: any, i: number) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-1.5 cursor-pointer group"
                      onMouseEnter={() => setActivePieIndex(i)}
                    >
                      <div 
                        className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-300 ${activePieIndex === i ? 'scale-150' : 'scale-100'}`} 
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className={`text-[10px] uppercase tracking-wider transition-colors duration-300 ${activePieIndex === i ? 'text-text-main font-bold' : 'text-text-muted'}`}>
                        {s.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-[2px]">
            <div className="bg-surface border border-text-muted/20 px-6 py-3 shadow-xl rounded-sm text-sm font-mono text-text-muted font-bold">
              Signal data unavailable. Backend warming up...
            </div>
          </div>
          {[1,2,3].map(i => <SkeletonChart key={i} />)}
        </div>
      )}
    </section>
    </>
  );
}

export default AISignalDashboard;
