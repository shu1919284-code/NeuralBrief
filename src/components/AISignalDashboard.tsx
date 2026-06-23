import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip,
  AreaChart, Area, ResponsiveContainer,
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

// Custom Hook/Component for Animated Counters
const AnimatedCounter = ({ value }: { value: number | string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
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
  }, [value]);
  
  const strVal = String(value);
  const prefixMatch = strVal.match(/^([^0-9]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const finalSuffix = strVal.match(/([^0-9]+)$/)?.[1] || '';
  
  return <>{prefix}{count}{finalSuffix}</>;
};

// Custom Interactive Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-main/80 backdrop-blur-md border border-accent p-3 shadow-lg shadow-accent/20 rounded-sm">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm font-heading" style={{ color: entry.color || 'var(--color-accent)' }}>
            {entry.name.replace(/^[a-z]/, (c: string) => c.toUpperCase())}: {entry.value}{entry.name === 'confidence' ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
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
    <section 
      className="py-32 px-6 md:px-16 max-w-7xl mx-auto" 
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
          {[1,2,3].map(i => (
            <div key={i} className="bg-surface-dim border border-border-subtle p-8 h-[300px] animate-pulse" />
          ))}
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
                className="bg-surface-dim border border-border-subtle p-6 text-center group hover:border-accent/40 transition-colors duration-300"
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

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart 1: Topic Confidence Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-surface-dim border border-border-subtle p-6 lg:col-span-1"
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
                    angle={-30}
                    textAnchor="end"
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                    domain={[80, 100]}
                  />
                  <Tooltip cursor={{ fill: 'var(--color-border-subtle)', opacity: 0.2 }} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="confidence" 
                    fill={accentColor} 
                    opacity={0.85}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
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
              className="bg-surface-dim border border-border-subtle p-6 lg:col-span-1"
            >
              <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
                Signal Volume
              </div>
              <div className="text-sm font-heading mb-6 text-text-main">
                Articles processed — last 7 days
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart 
                  data={stats.signalVolume}
                  margin={{ left: -20, top: 10, bottom: 0, right: 10 }}
                >
                  <defs>
                    <linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={accentColor} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={textMuted} opacity={0.2} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: textMuted }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="signals" 
                    stroke={accentColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSignals)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: accentColor }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Chart 3: Source Distribution Pie with ActiveShape */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-surface-dim border border-border-subtle p-6 lg:col-span-1 flex flex-col"
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
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="count"
                      onMouseEnter={onPieEnter}
                      animationDuration={1500}
                      stroke="none"
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
        <div className="text-center text-text-muted text-sm py-20">
          Signal data unavailable. Backend may be warming up.
        </div>
      )}
    </section>
  );
}

export default AISignalDashboard;
