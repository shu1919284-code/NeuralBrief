import React, { useEffect, useState } from 'react';
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
  keyPoints: KeyPoint[];
}

export function BriefingPage({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = async (): Promise<BriefingData> => {
    const res = await fetch('https://neuralbrief-production.up.railway.app/api/briefing/latest');
    if (!res.ok) {
      throw new Error(`Failed to fetch latest briefing: ${res.status}`);
    }
    const parsed = await res.json();
    
    // Validate shape
    if (
      !parsed ||
      typeof parsed.title !== 'string' ||
      typeof parsed.source !== 'string' ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.keyPoints) ||
      parsed.keyPoints.some((kp: any) => !kp || typeof kp.heading !== 'string' || typeof kp.text !== 'string')
    ) {
      throw new Error('Invalid briefing data format received');
    }
    return parsed;
  };

  useEffect(() => {
    let active = true;
    fetchBriefing()
      .then((parsedData) => {
        if (active) {
          setData(parsedData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
          <button 
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchBriefing()
                .then((d) => {
                  setData(d);
                  setLoading(false);
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : String(err));
                  setLoading(false);
                });
            }}
            className="mt-4 text-[10px] uppercase tracking-widest border border-border-subtle px-4 py-2 hover:bg-surface-dim font-bold transition-all cursor-pointer"
          >
            Retry Sync
          </button>
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
            <div>Sync: <span className="text-text-main">LIVE FEED</span></div>
          </div>

          <div className="space-y-6 text-sm text-text-main/80 leading-relaxed font-sans">
            <p>
              {data.summary}
            </p>

            <h3 className="font-heading text-2xl text-text-main italic pt-2">Key Optimizations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {data.keyPoints.map((kp, idx) => (
                <div key={idx} className="bg-surface-dim p-5 border border-border-subtle">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-text-main mb-2">{kp.heading}</h4>
                  <p className="text-xs text-text-muted">
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

export default BriefingPage;
