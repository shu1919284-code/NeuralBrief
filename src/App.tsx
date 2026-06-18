import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FocusDomains } from './components/FocusDomains';
import { Engine } from './components/Engine';
import { Preview } from './components/Preview';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { NeuralCanvas } from './components/NeuralCanvas';
import { CustomCursor } from './components/CustomCursor';
import { ProgressBar } from './components/ProgressBar';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import { BackToTop } from './components/BackToTop';
import { ReadingTime } from './components/ReadingTime';
import { FAQ } from './components/FAQ';
import { DevDashboard } from './components/DevDashboard';
import { BottomNav } from './components/BottomNav';
import { BriefingPage } from './components/BriefingPage';

const getApiUrl = (path: string) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return `http://localhost:3001${path}`;
  }
  return `https://neuralbrief-production.up.railway.app${path}`;
};

export default function App() {
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [errorBriefing, setErrorBriefing] = useState<string | null>(null);

  const [domainsData, setDomainsData] = useState<any[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [errorDomains, setErrorDomains] = useState<string | null>(null);

  const [selectedBriefing, setSelectedBriefing] = useState<'core' | 'data-science' | 'machine-learning' | 'ai-research' | 'agentic-frameworks' | null>(null);

  useEffect(() => {
    // Fetch latest briefing
    fetch(getApiUrl('/api/briefing/latest'))
      .then(async (res) => {
        if (!res.ok) {
          let errMsg = `Failed to fetch latest briefing: ${res.status}`;
          try {
            const errData = await res.json();
            if (errData && errData.error) errMsg = errData.error;
          } catch (_) {}
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then((data) => {
        setBriefingData(data);
        setLoadingBriefing(false);
      })
      .catch((err) => {
        setErrorBriefing(err instanceof Error ? err.message : String(err));
        setLoadingBriefing(false);
      });

    // Fetch domains briefing
    fetch(getApiUrl('/api/briefing/domains'))
      .then(async (res) => {
        if (!res.ok) {
          let errMsg = `Failed to fetch domains briefing: ${res.status}`;
          try {
            const errData = await res.json();
            if (errData && errData.error) errMsg = errData.error;
          } catch (_) {}
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then((data) => {
        setDomainsData(data.domains || []);
        setLoadingDomains(false);
      })
      .catch((err) => {
        setErrorDomains(err instanceof Error ? err.message : String(err));
        setLoadingDomains(false);
      });
  }, []);

  return (
    <AuthProvider>
      <AudioProvider>
        <BookmarkProvider>
          <LanguageProvider>
            {selectedBriefing ? (
              <BriefingPage 
                onBack={() => setSelectedBriefing(null)} 
                data={
                  selectedBriefing === 'core' 
                    ? briefingData 
                    : domainsData.find(d => d.id === selectedBriefing)
                } 
                loading={selectedBriefing === 'core' ? loadingBriefing : loadingDomains}
                error={selectedBriefing === 'core' ? errorBriefing : errorDomains}
              />
            ) : (
              <div className="min-h-screen relative">
                <ProgressBar />
                <CustomCursor />
                <NeuralCanvas />
                <Navbar />
                <main>
                  <ReadingTime />
                  <Hero />
                  <FocusDomains 
                    domains={domainsData}
                    loading={loadingDomains}
                    error={errorDomains}
                    onSelectDomain={(id) => setSelectedBriefing(id as any)}
                  />
                  <Engine />
                  <Preview 
                    onOpenBriefing={() => setSelectedBriefing('core')} 
                    data={briefingData}
                    loading={loadingBriefing}
                    error={errorBriefing}
                  />
                  <CTA />
                  <FAQ />
                </main>
                <Footer />
                <BackToTop />
                <DevDashboard />
                <BottomNav />
              </div>
            )}
          </LanguageProvider>
        </BookmarkProvider>
      </AudioProvider>
    </AuthProvider>
  );
}
