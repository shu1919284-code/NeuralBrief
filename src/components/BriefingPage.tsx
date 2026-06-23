import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface KeyPoint {
  heading: string;
  text: string;
}

interface BriefingData {
  title: string;
  source: string;
  confidence: number;
  summary: string;
  detailedAnalysis: string;
  keyPoints: KeyPoint[];
  generatedAt?: string;
}

export function BriefingPage({ 
  onBack, 
  data, 
  loading, 
  error 
}: { 
  onBack: () => void; 
  data: BriefingData | null; 
  loading: boolean; 
  error: string | null; 
}) {
  return (
    <div className="min-h-screen bg-surface px-6 py-16 md:px-16 max-w-4xl mx-auto flex flex-col justify-start">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-muted hover:text-text-main mb-12 text-[10px] uppercase tracking-widest font-bold transition-colors cursor-pointer self-start"
      >
        <X size={14} /> Close
      </button>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-text-muted gap-4">
          <Loader2 className="animate-spin text-text-main" size={32} />
          <span className="text-xs uppercase tracking-widest font-mono font-bold">Parsing Neural Feed...</span>
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-rose-500 gap-4 text-center">
          <span className="text-sm font-bold font-heading">Failed to align neural feed</span>
          <p className="text-xs text-text-muted max-w-md">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-text-muted font-bold block mb-4 border-b border-border-subtle pb-2">
            NeuralBrief Briefing Reader / Technical Report
          </span>

          <h1 className="font-heading text-3xl md:text-5xl mb-6 leading-tight">
            {data.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-text-muted mb-8 border-b border-border-subtle pb-4">
            <div>Source: <span className="text-text-main">{data.source}</span></div>
            <div>Confidence: <span className="text-text-main">{data.confidence.toFixed(3)}</span></div>
            {data.generatedAt && (
              <div>Updated: <span className="text-text-main">{new Date(data.generatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
            )}
            <div>Sync: <span className="text-text-main">LIVE FEED</span></div>
          </div>

          <div className="space-y-6 text-sm text-text-main/80 leading-relaxed font-sans">
            <p className="font-medium text-text-main text-base border-l-2 border-border-subtle pl-4 mb-8 py-1 italic">
              {data.summary}
            </p>

            <h3 className="font-heading text-2xl text-text-main italic pt-4 mb-4">Detailed Technical Report</h3>
            <div className="space-y-4">
              {data.detailedAnalysis.split('\n').filter(p => p.trim()).map((para, idx) => (
                renderMarkdownParagraph(para, idx)
              ))}
            </div>

            <h3 className="font-heading text-2xl text-text-main italic pt-8 mb-4">Key Takeaways</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {data.keyPoints.map((kp, idx) => (
                <div key={idx} className="bg-surface-dim p-6 border border-border-subtle flex flex-col justify-start">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">0{idx + 1} / {kp.heading}</span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {kp.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function sanitizeUrl(urlText: string): string {
  // Strip control characters and whitespace
  const sanitized = urlText.replace(/[^\x20-\x7E]/g, '').trim();
  const normalized = sanitized.replace(/\s+/g, '').toLowerCase();
  if (
    normalized.startsWith('javascript:') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('vbscript:') ||
    normalized.startsWith('file:')
  ) {
    return '#';
  }
  return sanitized;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-text-main">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[') && part.includes('](')) {
      const closeBracket = part.indexOf(']');
      const linkText = part.substring(1, closeBracket);
      const url = part.substring(closeBracket + 2, part.length - 1);
      return (
        <a key={i} href={sanitizeUrl(url)} target="_blank" rel="noopener noreferrer" className="text-text-main underline hover:opacity-75 transition-opacity font-semibold">
          {linkText}
        </a>
      );
    }
    return part;
  });
}

function renderMarkdownParagraph(text: string, key: number): React.ReactNode {
  const trimmed = text.trim();
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    const content = trimmed.substring(2).trim();
    return (
      <li key={key} className="ml-6 list-disc mb-2 text-justify text-sm text-text-main/80 leading-relaxed font-sans">
        {parseInlineMarkdown(content)}
      </li>
    );
  }
  if (/^\d+\.\s/.test(trimmed)) {
    const index = trimmed.indexOf(' ');
    const content = trimmed.substring(index + 1).trim();
    return (
      <li key={key} className="ml-6 list-decimal mb-2 text-justify text-sm text-text-main/80 leading-relaxed font-sans">
        {parseInlineMarkdown(content)}
      </li>
    );
  }
  return (
    <p key={key} className="mb-4 text-justify text-sm text-text-main/80 leading-relaxed font-sans">
      {parseInlineMarkdown(trimmed)}
    </p>
  );
}

export default BriefingPage;
