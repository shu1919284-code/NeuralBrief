import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BarChart2, Bot, BrainCircuit, Cpu, Settings, Zap, Briefcase, Code2,
  Filter, Mail, Layers, Rss, Bookmark
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const BORDER     = 'rgba(240,234,214,0.08)';
const BORDER_H   = 'rgba(240,234,214,0.18)';
const TEXT       = '#f0ead6';
const TEXT_DIM   = 'rgba(240,234,214,0.5)';
const TEXT_FAINT = 'rgba(240,234,214,0.25)';
const SURFACE2   = '#191916';
const GOLD       = 'rgba(212,178,106,1)';
const GOLD_MID   = 'rgba(212,178,106,0.3)';

// ─── Section metadata ─────────────────────────────────────────────────────────

interface SectionMeta {
  label:   string;
  icon:    React.ElementType;
  group:   string;
  anchor:  string;
  color:   [number, number, number];
}

const SECTION_META: Record<string, SectionMeta> = {
  'Data Science':      { label: 'Data Science',     icon: BarChart2,    group: 'Focus Domains',   anchor: '#focus-domains', color: [56,  189, 248] },
  'Machine Learning':  { label: 'Machine Learning',  icon: Bot,          group: 'Focus Domains',   anchor: '#focus-domains', color: [168, 85,  247] },
  'AI Research':       { label: 'AI Research',       icon: BrainCircuit, group: 'Focus Domains',   anchor: '#focus-domains', color: [52,  211, 153] },
  'Agentic AI':        { label: 'Agentic AI',        icon: Cpu,          group: 'Focus Domains',   anchor: '#focus-domains', color: [251, 146, 60]  },
  'MLOps':             { label: 'MLOps',             icon: Settings,     group: 'Focus Domains',   anchor: '#focus-domains', color: [34,  197, 94]  },
  'Model Releases':    { label: 'Model Releases',    icon: Zap,          group: 'Focus Domains',   anchor: '#focus-domains', color: [250, 204, 21]  },
  'AI Industry':       { label: 'AI Industry',       icon: Briefcase,    group: 'Focus Domains',   anchor: '#focus-domains', color: [244, 114, 182] },
  'Tools & Libraries': { label: 'Tools & Libraries', icon: Code2,        group: 'Focus Domains',   anchor: '#focus-domains', color: [99,  102, 241] },
  'Phase: Scrape':     { label: 'Scrape',            icon: Rss,          group: 'Pipeline Phases', anchor: '#engine',        color: [56,  189, 248] },
  'Phase: Filter':     { label: 'Filter',            icon: Filter,       group: 'Pipeline Phases', anchor: '#engine',        color: [52,  211, 153] },
  'Phase: Summarise':  { label: 'Summarise',         icon: Layers,       group: 'Pipeline Phases', anchor: '#engine',        color: [168, 85,  247] },
  'Phase: Dispatch':   { label: 'Dispatch',          icon: Mail,         group: 'Pipeline Phases', anchor: '#engine',        color: [251, 146, 60]  },
};

// ─── Mini canvas thumbnail ────────────────────────────────────────────────────

function MiniCanvas({ color, icon: Icon }: { color: [number, number, number]; icon: React.ElementType }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [r, g, b] = color;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = 52;
    canvas.height = 52;
    const ctx = canvas.getContext('2d')!;

    // Simple animated particle field per card
    const particles = Array.from({ length: 8 }, () => ({
      x: Math.random() * 52,
      y: Math.random() * 52,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1 + Math.random() * 1.5,
    }));

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, 52, 52);
      // bg
      ctx.fillStyle = `rgba(${r},${g},${b},0.06)`;
      ctx.fillRect(0, 0, 52, 52);
      // connections
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 52) p.vx *= -1;
        if (p.y < 0 || p.y > 52) p.vy *= -1;
        particles.forEach(m => {
          const dx = m.x - p.x, dy = m.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 28) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.2 * (1 - d / 28)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        });
        ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [r, g, b]);

  return (
    <div style={{ width: 52, height: 52, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: 52, height: 52 }} />
      {/* Icon overlay */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <Icon size={16} strokeWidth={1.5} style={{ color: `rgba(${color[0]},${color[1]},${color[2]},0.7)` }} />
      </div>
    </div>
  );
}

// ─── Localize Helper functions ───────────────────────────────────────────────

const getLocalizedLabel = (label: string, t: (k: string) => string): string => {
  switch (label) {
    case 'Data Science': return t('topic_data_science_label');
    case 'Machine Learning': return t('topic_machine_learning_label');
    case 'AI Research': return t('topic_ai_research_label');
    case 'Agentic AI': return t('topic_agentic_ai_label');
    case 'MLOps': return t('topic_mlops_label');
    case 'Model Releases': return t('topic_model_releases_label');
    case 'AI Industry': return t('topic_ai_industry_label');
    case 'Tools & Libraries': return t('topic_tools_libraries_label');
    case 'Scrape': return t('engine_card1_title');
    case 'Filter': return t('engine_card2_title');
    case 'Summarise': return t('engine_card3_title');
    case 'Dispatch': return t('engine_card4_title');
    default: return label;
  }
};

const getLocalizedGroup = (group: string, t: (k: string) => string): string => {
  if (group === 'Focus Domains') return t('focus_overline') || 'Focus Domains';
  if (group === 'Pipeline Phases') return t('nav_engine') || 'Pipeline Phases';
  return group;
};

// ─── Bookmark card ────────────────────────────────────────────────────────────

function BookmarkCard({ id, meta, onRemove }: { id: string; meta: SectionMeta; onRemove: () => void }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = React.useState(false);

  const jumpTo = () => {
    const el = document.querySelector(meta.anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10, transition: { duration: 0.18 } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: SURFACE2,
        border: `0.5px solid ${hovered ? BORDER_H : BORDER}`,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Animated thumbnail */}
      <MiniCanvas color={meta.color} icon={meta.icon} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, letterSpacing: '0.01em' }}>
          {getLocalizedLabel(meta.label, t)}
        </div>
        <div style={{ fontSize: 10, color: TEXT_FAINT, marginTop: 2 }}>
          {getLocalizedGroup(meta.group, t)} · {t('profile.bookmarked') || 'bookmarked'}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10, flexShrink: 0 }}>
        <button
          onClick={jumpTo}
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: hovered ? GOLD : TEXT_FAINT,
            border: `0.5px solid ${hovered ? GOLD_MID : BORDER}`,
            background: 'transparent', padding: '4px 10px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {t('profile.jump') || 'Jump ↗'}
        </button>
        <button
          onClick={onRemove}
          title="Remove bookmark"
          style={{
            background: 'none', border: 'none', color: TEXT_FAINT,
            fontSize: 11, cursor: 'pointer', padding: '2px 2px', lineHeight: 1,
            opacity: hovered ? 0.7 : 0.3, transition: 'opacity 0.15s',
          }}
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 0', textAlign: 'center', gap: 10 }}>
      <Bookmark size={28} strokeWidth={1} style={{ color: TEXT_FAINT, opacity: 0.3 }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, opacity: 0.5 }}>
        {t('bookmarks.empty') ? t('bookmarks.empty').split('.')[0] : 'No bookmarks yet'}
      </div>
      <div style={{ fontSize: 10, color: TEXT_FAINT, opacity: 0.35, maxWidth: 190, lineHeight: 1.6 }}>
        {t('bookmarks.instructions') || 'Tap the bookmark icon on any Focus Domain card or Engine phase to save it here.'}
      </div>
    </div>
  );
}

// ─── BookmarksTab ─────────────────────────────────────────────────────────────

export function BookmarksTab() {
  const { t } = useLanguage();
  const { bookmarks, toggleBookmark } = useBookmarks();

  if (bookmarks.length === 0) return <EmptyState />;

  // Group by section type
  const groups = bookmarks.reduce<Record<string, string[]>>((acc, id) => {
    const group = SECTION_META[id]?.group ?? 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(id);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AnimatePresence>
        {Object.entries(groups).map(([group, ids]) => (
          <div key={group}>
            {/* Group label */}
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: TEXT_FAINT, marginBottom: 8,
            }}>
              {getLocalizedGroup(group, t)}
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <AnimatePresence>
                {ids.map(id => {
                  const meta = SECTION_META[id];
                  if (!meta) return null;
                  return (
                    <BookmarkCard
                      key={id}
                      id={id}
                      meta={meta}
                      onRemove={() => toggleBookmark(id)}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}