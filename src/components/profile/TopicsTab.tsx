import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BarChart2, Bot, BrainCircuit, Cpu, Settings, Zap, Briefcase, Code2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// ─── Animation renderers ──────────────────────────────────────────────────────

type AnimFn = (canvas: HTMLCanvasElement, r: number, g: number, b: number) => () => void;

const animBars: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const COUNT = 18;
  const bars = Array.from({ length: COUNT }, (_, i) => ({
    x: (i / (COUNT - 1)) * W,
    h: Math.random() * H * 0.55 + H * 0.1,
    target: Math.random() * H * 0.55 + H * 0.1,
    speed: 0.012 + Math.random() * 0.018,
  }));
  let rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    bars.forEach(b => {
      b.h += (b.target - b.h) * b.speed;
      if (Math.abs(b.h - b.target) < 1) b.target = Math.random() * H * 0.55 + H * 0.1;
      const bw = (W / COUNT) * 0.55;
      ctx.fillStyle = `rgba(${r},${g},${b},${0.15 + 0.2 * (b.h / H)})`;
      ctx.fillRect(b.x - bw / 2, H - b.h, bw, b.h);
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animNeural: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const nodes = Array.from({ length: 12 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    radius: 1.5 + Math.random() * 1.5,
  }));
  let rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      nodes.forEach(m => {
        const dx = m.x - n.x, dy = m.y - n.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.25 * (1 - dist / 60)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      });
      ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2); ctx.fill();
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animWave: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  let t = 0, rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    [0, 1, 2].forEach(layer => {
      const amp = 8 + layer * 5, freq = 0.04 - layer * 0.008, speed = 0.03 + layer * 0.01;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 - layer * 0.03})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = H / 2 + amp * Math.sin(freq * x + t * (speed * 60) + layer * 1.2);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    t += 0.016;
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animOrbit: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const orbits = [
    { r: 22, speed: 0.025, angle: 0, dotR: 2.5, alpha: 0.5 },
    { r: 35, speed: -0.018, angle: 1, dotR: 2, alpha: 0.35 },
    { r: 48, speed: 0.012, angle: 2.5, dotR: 1.5, alpha: 0.22 },
  ];
  let rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.08)`; ctx.lineWidth = 0.5;
    orbits.forEach(o => {
      ctx.beginPath(); ctx.arc(cx, cy, o.r, 0, Math.PI * 2); ctx.stroke();
      o.angle += o.speed;
      const dx = cx + Math.cos(o.angle) * o.r, dy = cy + Math.sin(o.angle) * o.r;
      ctx.fillStyle = `rgba(${r},${g},${b},${o.alpha})`;
      ctx.beginPath(); ctx.arc(dx, dy, o.dotR, 0, Math.PI * 2); ctx.fill();
      const tx = cx + Math.cos(o.angle + Math.PI) * o.r, ty = cy + Math.sin(o.angle + Math.PI) * o.r;
      ctx.fillStyle = `rgba(${r},${g},${b},${o.alpha * 0.4})`;
      ctx.beginPath(); ctx.arc(tx, ty, o.dotR * 0.6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = `rgba(${r},${g},${b},0.4)`;
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animPipeline: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const lanes = [H * 0.3, H * 0.5, H * 0.7];
  const packets: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
  let tick = 0, rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    lanes.forEach(y => {
      ctx.strokeStyle = `rgba(${r},${g},${b},0.07)`; ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.setLineDash([]);
    });
    tick++;
    if (tick % 18 === 0) packets.push({ x: -6, y: lanes[Math.floor(Math.random() * lanes.length)], speed: 0.8 + Math.random() * 0.8, size: 2 + Math.random() * 2, alpha: 0.4 + Math.random() * 0.3 });
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i]; p.x += p.speed;
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.3})`; ctx.beginPath(); ctx.arc(p.x - p.size * 3, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
      if (p.x > W + 10) packets.splice(i, 1);
    }
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animSpark: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const particles: { x: number; y: number; vx: number; vy: number; life: number; decay: number; r: number }[] = [];
  let tick = 0, rafId: number;
  const burst = () => {
    const cx = W * 0.5 + (Math.random() - 0.5) * W * 0.4;
    const cy = H * 0.5 + (Math.random() - 0.5) * H * 0.4;
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 0.5 + Math.random() * 1.5;
      particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, decay: 0.02 + Math.random() * 0.015, r: 1 + Math.random() * 1.5 });
    }
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    tick++; if (tick % 55 === 0) burst();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life -= p.decay;
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, p.life * 0.6)})`; 
      ctx.beginPath(); 
      ctx.arc(p.x, p.y, Math.max(0, p.r * p.life), 0, Math.PI * 2); 
      ctx.fill();
      if (p.life <= 0) particles.splice(i, 1);
    }
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animGraph: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const COUNT = 10;
  const points = Array.from({ length: COUNT + 2 }, () => H * 0.3 + Math.random() * H * 0.4);
  let offset = 0, rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    offset += 0.4;
    if (offset >= W / (COUNT - 1)) { offset = 0; points.shift(); points.push(H * 0.25 + Math.random() * H * 0.5); }
    const step = W / (COUNT - 1);
    ctx.beginPath();
    points.forEach((y, i) => { const x = i * step - offset; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`; ctx.lineWidth = 1.5; ctx.stroke();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.1)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.lineTo(W, H); ctx.lineTo(-offset, H); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

const animCode: AnimFn = (canvas, r, g, b) => {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const LINE_H = 10;
  const snippets = ['const model=', 'fn train(', 'import {', 'export default', 'async fn', 'let x=', '[0,1,0]', 'torch.nn', 'loss.backward()', 'optimizer', 'def fit(', 'return <', 'batch_size', 'epoch+=1', 'sigmoid(', 'softmax('];
  const lines = Array.from({ length: Math.ceil(H / LINE_H) + 2 }, (_, i) => ({
    y: i * LINE_H,
    speed: 0.3 + Math.random() * 0.3,
    text: snippets[Math.floor(Math.random() * snippets.length)],
    alpha: 0.06 + Math.random() * 0.1,
    offset: Math.random() * W * 0.5,
  }));
  let rafId: number;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = '7px monospace';
    lines.forEach(l => {
      l.y += l.speed;
      if (l.y > H + LINE_H) { l.y = -LINE_H; l.text = snippets[Math.floor(Math.random() * snippets.length)]; l.alpha = 0.06 + Math.random() * 0.1; l.offset = Math.random() * W * 0.5; }
      ctx.fillStyle = `rgba(${r},${g},${b},${l.alpha})`;
      ctx.fillText(l.text, l.offset, l.y);
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
};

// ─── Topic config ─────────────────────────────────────────────────────────────

const TOPICS = [
  { id: 'data_science',     Icon: BarChart2,    labelKey: 'topic_data_science_label',     descKey: 'topic_data_science_desc',     anim: animBars,     color: [56, 189, 248]  as [number,number,number] },
  { id: 'machine_learning', Icon: Bot,          labelKey: 'topic_machine_learning_label', descKey: 'topic_machine_learning_desc', anim: animNeural,   color: [168, 85, 247]  as [number,number,number] },
  { id: 'ai_research',      Icon: BrainCircuit, labelKey: 'topic_ai_research_label',      descKey: 'topic_ai_research_desc',      anim: animWave,     color: [52, 211, 153]  as [number,number,number] },
  { id: 'agentic_ai',       Icon: Cpu,          labelKey: 'topic_agentic_ai_label',       descKey: 'topic_agentic_ai_desc',       anim: animOrbit,    color: [251, 146, 60]  as [number,number,number] },
  { id: 'mlops',            Icon: Settings,     labelKey: 'topic_mlops_label',            descKey: 'topic_mlops_desc',            anim: animPipeline, color: [34, 197, 94]   as [number,number,number] },
  { id: 'model_releases',   Icon: Zap,          labelKey: 'topic_model_releases_label',   descKey: 'topic_model_releases_desc',   anim: animSpark,    color: [250, 204, 21]  as [number,number,number] },
  { id: 'ai_industry',      Icon: Briefcase,    labelKey: 'topic_ai_industry_label',      descKey: 'topic_ai_industry_desc',      anim: animGraph,    color: [244, 114, 182] as [number,number,number] },
  { id: 'tools_libraries',  Icon: Code2,        labelKey: 'topic_tools_libraries_label',  descKey: 'topic_tools_libraries_desc',  anim: animCode,     color: [99, 102, 241]  as [number,number,number] },
];

// ─── AnimatedTopicCard ────────────────────────────────────────────────────────

interface CardProps {
  topic: typeof TOPICS[number];
  isSelected: boolean;
  locked: boolean;
  label: string;
  desc: string;
  onToggle: () => void;
}

function AnimatedTopicCard({ topic, isSelected, locked, label, desc, onToggle }: CardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [r, g, b] = topic.color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width || 200;
    canvas.height = rect.height || 96;
    const cleanup = topic.anim(canvas, r, g, b);
    return cleanup;
  }, []);

  return (
    <motion.button
      whileTap={!locked ? { scale: 0.97 } : {}}
      onClick={onToggle}
      disabled={locked}
      className="relative overflow-hidden text-left transition-all duration-200"
      style={{
        height: 96,
        border: `0.5px solid ${isSelected ? `rgba(${r},${g},${b},0.45)` : 'rgba(240,234,214,0.08)'}`,
        background: isSelected ? `rgba(${r},${g},${b},0.06)` : '#191916',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.6 : 1,
      }}
    >
      {/* Canvas background animation */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Dark overlay — lighter when selected */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isSelected
          ? `linear-gradient(160deg, rgba(17,17,9,0.62) 0%, rgba(17,17,9,0.38) 100%)`
          : `linear-gradient(160deg, rgba(17,17,9,0.82) 0%, rgba(17,17,9,0.6) 100%)`,
        transition: 'background 0.25s',
      }} />

      {/* Shimmer on active */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%)',
          backgroundSize: '250% 100%',
          animation: 'tt-shimmer 3.5s infinite',
        }} />
      )}

      {/* Selected dot */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: `rgba(${r},${g},${b},1)`,
          zIndex: 3,
        }} />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '11px 13px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <topic.Icon
          size={15}
          strokeWidth={1.5}
          style={{ marginBottom: 7, color: isSelected ? `rgba(${r},${g},${b},1)` : 'rgba(240,234,214,0.3)', transition: 'color 0.2s' }}
        />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: isSelected ? '#f0ead6' : 'rgba(240,234,214,0.5)', transition: 'color 0.2s', lineHeight: 1.2 }}>
          {label}
        </div>
        <div style={{ fontSize: 9, color: isSelected ? 'rgba(240,234,214,0.6)' : 'rgba(240,234,214,0.25)', marginTop: 3, lineHeight: 1.4, transition: 'color 0.2s' }}>
          {desc}
        </div>
      </div>

      <style>{`@keyframes tt-shimmer { 0% { background-position: 250% 0; } 100% { background-position: -250% 0; } }`}</style>
    </motion.button>
  );
}

// ─── TopicsTab ────────────────────────────────────────────────────────────────

interface TopicsTabProps {
  selectedTopics: string[];
  toggleTopic: (topicId: string) => void;
  canChangeTopics: () => boolean;
  daysUntilTopicChange: () => number;
}

export function TopicsTab({ selectedTopics, toggleTopic, canChangeTopics, daysUntilTopicChange }: TopicsTabProps) {
  const { t } = useLanguage();
  const locked = !canChangeTopics();
  const days = daysUntilTopicChange();

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,234,214,0.3)' }}>
          {t('profile.select_topics') || 'Select your topics'}
        </div>
        {locked && (
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.8)' }}>
            {t('profile.locked') || 'Locked'} · {days}{t('profile.days_left') || 'd left'}
          </div>
        )}
      </div>

      {/* Lock notice */}
      {locked && (
        <div style={{ fontSize: 10, color: 'rgba(240,234,214,0.35)', border: '0.5px solid rgba(240,234,214,0.08)', padding: '8px 12px', marginBottom: 10, lineHeight: 1.5 }}>
          {(t('profile.topics_lock_notice') || 'Topics can be changed every 7 days. Next change in {days} day{plural}.')
            .replace('{days}', String(days))
            .replace('{plural}', days !== 1 ? 's' : '')}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {TOPICS.map(topic => (
          <AnimatedTopicCard
            key={topic.id}
            topic={topic}
            isSelected={selectedTopics.includes(topic.id)}
            locked={locked}
            label={t(topic.labelKey)}
            desc={t(topic.descKey)}
            onToggle={() => toggleTopic(topic.id)}
          />
        ))}
      </div>

      {/* Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <div style={{ fontSize: 10, color: 'rgba(240,234,214,0.35)' }}>
          {(t('profile.topics_selected') || '{count} topic{plural} selected')
            .replace('{count}', String(selectedTopics.length))
            .replace('{plural}', selectedTopics.length !== 1 ? 's' : '')}
        </div>
      </div>
    </div>
  );
}