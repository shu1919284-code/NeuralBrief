import { ThemePersonality } from '../contexts/ThemeContext';

export interface NodeConfig {
  role: string;
  title: string;
  desc: string;
}

export interface EngineConfig {
  tagText: string;
  packets: string[];
  nodes: {
    ingestion: NodeConfig;
    logicGate: NodeConfig;
    mistral: NodeConfig;
    llama: NodeConfig;
    groq: NodeConfig;
    dispatch: NodeConfig;
  };
  backgroundType: 'neural' | 'blueprint' | 'halos' | 'grid';
}

export function getEngineConfig(theme: ThemePersonality): EngineConfig {
  switch (theme) {
    case 'indigo-intelligence':
      return {
        tagText: 'Lab Protocol : Academic Validation',
        packets: [
          'ArXiv CS.CL', 'Theorem Proof', 'GitHub PR',
          'Model Weights', 'Conference Paper', 'Dataset Release',
          'Benchmark Run', 'API Deprecation', 'Lab Notes'
        ],
        nodes: {
          ingestion: { role: 'Data Sourcing', title: 'Paper Monitor', desc: 'Monitors academic pre-prints and open source ML repositories.' },
          logicGate: { role: 'Semantic Filter', title: 'Methodology Check', desc: 'Applies rigorous validation against existing scientific literature.' },
          mistral: { role: 'Consensus Modeling', title: 'MISTRAL LARGE 2', desc: 'Signal ranking and consensus weighting.' },
          llama: { role: 'Research Synthesis', title: 'LLAMA 3.1 405B', desc: 'Long-context analysis and technical synthesis.' },
          groq: { role: 'Speed Prioritization', title: 'LPU INFERENCE', desc: 'Real-time events and speed-sensitive updates.' },
          dispatch: { role: 'Distribution', title: 'Research Dispatch', desc: 'Formats and delivers the research payload.' }
        },
        backgroundType: 'blueprint'
      };
    case 'golden-executive':
      return {
        tagText: 'Executive Protocol : High Confidence',
        packets: [
          'SEC Filing', 'Market Analysis', 'Earnings Call',
          'Strategy Memo', 'Merger Rumor', 'Quarterly Report',
          'Competitor Move', 'Risk Assessment', 'Executive Summary'
        ],
        nodes: {
          ingestion: { role: 'Intelligence Gathering', title: 'Market Monitor', desc: 'Aggregates tier-1 financial filings and enterprise strategy drops.' },
          logicGate: { role: 'Risk Assessor', title: 'Signal Gate', desc: 'Filters market noise to extract high-impact corporate intelligence.' },
          mistral: { role: 'Consensus Modeling', title: 'MISTRAL LARGE 2', desc: 'Signal ranking and consensus weighting.' },
          llama: { role: 'Research Synthesis', title: 'LLAMA 3.1 405B', desc: 'Long-context analysis and technical synthesis.' },
          groq: { role: 'Speed Prioritization', title: 'LPU INFERENCE', desc: 'Real-time events and speed-sensitive updates.' },
          dispatch: { role: 'Distribution', title: 'Executive Dispatch', desc: 'Pushes the finalized strategic intelligence directly to your inbox.' }
        },
        backgroundType: 'halos'
      };
    case 'emerald-analyst':
      return {
        tagText: 'Analyst Protocol : Live Data',
        packets: [
          'Live Ticker', 'Bloomberg Data', 'Forex Feed',
          'Sentiment Score', 'Volume Spike', 'Macro Indicator',
          'Commodity Price', 'Yield Curve', 'Order Book'
        ],
        nodes: {
          ingestion: { role: 'Data Sourcing', title: 'Live Ingestion', desc: 'High-frequency streaming of quantitative metrics and global data.' },
          logicGate: { role: 'Semantic Filter', title: 'Outlier Detection', desc: 'Identifies statistical anomalies and eliminates standard noise.' },
          mistral: { role: 'Consensus Modeling', title: 'MISTRAL LARGE 2', desc: 'Signal ranking and consensus weighting.' },
          llama: { role: 'Research Synthesis', title: 'LLAMA 3.1 405B', desc: 'Long-context analysis and technical synthesis.' },
          groq: { role: 'Speed Prioritization', title: 'LPU INFERENCE', desc: 'Real-time events and speed-sensitive updates.' },
          dispatch: { role: 'Distribution', title: 'Terminal Dispatch', desc: 'Fires the clean data stream to your operational dashboard.' }
        },
        backgroundType: 'grid'
      };
    case 'crimson-real-time':
      return {
        tagText: 'Alert Protocol : Threat Detected',
        packets: [
          'Breaking News', 'Zero-Day Alert', 'Exploit Payload',
          'Server Breach', 'Botnet Activity', 'Malware Signature',
          'CVE Update', 'Patch Release', 'Ransomware Track'
        ],
        nodes: {
          ingestion: { role: 'Data Sourcing', title: 'Threat Monitor', desc: 'Scans dark web forums and real-time vulnerability feeds.' },
          logicGate: { role: 'Risk Assessor', title: 'Severity Gate', desc: 'Prioritizes high-risk critical infrastructure signals.' },
          llama: { role: 'Research Synthesis', title: 'LLAMA 3.1 405B', desc: 'Long-context analysis and technical synthesis.' },
          mistral: { role: 'Consensus Modeling', title: 'MISTRAL LARGE 2', desc: 'Signal ranking and consensus weighting.' },
          groq: { role: 'Speed Prioritization', title: 'LPU INFERENCE', desc: 'Real-time events and speed-sensitive updates.' }, dispatch: { role: 'Distribution', title: 'Emergency Dispatch', desc: 'Triggers multi-channel critical alerts.' }
        },
        backgroundType: 'neural'
      };
    case 'amber-insight':
      return {
        tagText: 'Editorial Protocol : Narrative Active',
        packets: [
          'Opinion Piece', 'Deep Dive', 'Journal Entry',
          'Thought Leadership', 'Industry Essay', 'Interview Transcript',
          'Trend Analysis', 'Keynote Speech', 'Substack Post'
        ],
        nodes: {
          ingestion: { role: 'Data Sourcing', title: 'Context Monitor', desc: 'Gathers long-form essays and industry deep dives.' },
          logicGate: { role: 'Semantic Filter', title: 'Editorial Gate', desc: 'Filters for high-quality narrative structures and thought leadership.' },
          mistral: { role: 'Consensus Modeling', title: 'MISTRAL LARGE 2', desc: 'Signal ranking and consensus weighting.' },
          llama: { role: 'Research Synthesis', title: 'LLAMA 3.1 405B', desc: 'Long-context analysis and technical synthesis.' },
          groq: { role: 'Speed Prioritization', title: 'LPU INFERENCE', desc: 'Real-time events and speed-sensitive updates.' },
          dispatch: { role: 'Distribution', title: 'Newsletter Dispatch', desc: 'Publishes the curated edition directly to subscribers.' }
        },
        backgroundType: 'neural'
      };
    case 'neural':
    default:
      return {
        tagText: 'Protocol Active : Consensus',
        packets: [
          'Model Weights', 'API Update', 'Benchmark Result',
          'Agent Framework', 'RLHF Research', 'Open Source Release',
          'GPT-5 Paper', 'Claude Update', 'Startup Funding'
        ],
        nodes: {
          ingestion: { role: 'Data Sourcing', title: 'Monitor Pipeline', desc: 'Continuously monitors 500+ top-tier industry sources, RSS feeds, and ArXiv pre-prints for breaking AI news.' },
          logicGate: { role: 'Semantic Filter', title: 'Logic Gate', desc: 'Deduplicates content and applies vector relevance scoring to instantly discard low-signal marketing fluff.' },
          mistral: { role: 'Consensus Modeling', title: 'MISTRAL LARGE 2', desc: 'Signal ranking and consensus weighting.' },
          llama: { role: 'Research Synthesis', title: 'LLAMA 3.1 405B', desc: 'Long-context analysis and technical synthesis.' },
          groq: { role: 'Speed Prioritization', title: 'LPU INFERENCE', desc: 'Real-time events and speed-sensitive updates.' },
          dispatch: { role: 'Distribution', title: 'Delivery Dispatch', desc: 'Formats the multi-agent consensus into a clean dispatch and pushes it to email and the platform.' }
        },
        backgroundType: 'neural'
      };
  }
}
