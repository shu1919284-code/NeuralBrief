import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp, getCountFromServer, collection } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FocusDomains } from './components/FocusDomains';
import { Preview } from './components/Preview';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { NeuralCanvas } from './components/NeuralCanvas';
import { CustomCursor } from './components/CustomCursor';
import { ScrollProgress } from './components/ProgressBar';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AudioProvider } from './contexts/AudioContext';
import { BookmarkProvider } from './contexts/BookmarkContext';
import { BackToTop } from './components/BackToTop';
import { ReadingTime } from './components/ReadingTime';
import { DevDashboard } from './components/DevDashboard';
import { BottomNav } from './components/BottomNav';
import { BriefingPage } from './components/BriefingPage';
import { OnboardingModal } from './components/OnboardingModal';
import { db } from './lib/firebase';
import { hashEmail } from './lib/hash';
import { useAuth } from './contexts/AuthContext';

const Engine = lazy(() =>
  import('./components/Engine')
    .then(m => ({ default: m.Engine })));
const HowItWorks = lazy(() =>
  import('./components/HowItWorks')
    .then(m => ({ default: m.HowItWorks })));
const Pipeline3D = lazy(() =>
  import('./components/Pipeline3D')
    .then(m => ({ default: m.Pipeline3D })));
const PersonalizationShowcase = lazy(() =>
  import('./components/PersonalizationShowcase')
    .then(m => ({ default: m.PersonalizationShowcase })));
const FAQ = lazy(() =>
  import('./components/FAQ')
    .then(m => ({ default: m.FAQ })));
const AISignalDashboard = lazy(() =>
  import('./components/AISignalDashboard')
    .then(m => ({ default: m.AISignalDashboard })));

const getApiUrl = (path: string) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return `http://localhost:3001${path}`;
  }
  return `https://neuralbrief-production.up.railway.app${path}`;
};

/**
 * Thin inline subscribe strip shown between the Preview and
 * PersonalizationShowcase sections.
 */
function MiniCTA(): React.JSX.Element {
  const SUBSCRIBER_BASELINE = 500;

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subCount, setSubCount] = useState<number | null>(null);

  useEffect(() => {
    getCountFromServer(collection(db, 'subscribers'))
      .then(snap => setSubCount(snap.data().count))
      .catch(() => setSubCount(null));
  }, []);

  const displayCount =
    subCount !== null && subCount > SUBSCRIBER_BASELINE
      ? subCount.toLocaleString()
      : SUBSCRIBER_BASELINE.toLocaleString();

  const displayLabel = `Join ${displayCount}+ engineers getting their daily AI briefing`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('loading');
    try {
      const hashedId = await hashEmail(trimmed);
      await setDoc(
        doc(db, 'subscribers', hashedId),
        { email: trimmed, subscribedAt: serverTimestamp(), active: true },
        { merge: true }
      );
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error subscribing:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-b border-border-subtle"
    >
      <section className="py-12 px-6 md:px-16 max-w-4xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-6">
          {displayLabel}
        </p>
        <div className="flex justify-center flex-wrap gap-4 relative z-10 mx-auto min-w-[280px] w-full max-w-sm">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center py-2 text-sm italic border-b border-transparent text-primary font-bold"
              >
                Welcome aboard.
              </motion.div>
            ) : (
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full relative"
              >
                <div className={`border-b pb-2 flex justify-between items-center w-full transition-colors ${status === 'error' ? 'border-red-500' : 'border-text-main'}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@address.com"
                    disabled={status === 'loading'}
                    className="bg-transparent border-none outline-none w-full text-sm italic placeholder-text-muted disabled:opacity-50"
                  />
                  <button type="submit" disabled={status === 'loading'} className="cursor-pointer hover:opacity-50 active:scale-75 transition-all disabled:opacity-50 bg-transparent border-none p-0 outline-none">
                    {status === 'loading' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-text-main border-t-transparent animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    )}
                  </button>
                </div>
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -bottom-6 left-0 text-[10px] text-red-500 uppercase tracking-widest font-bold">
                    Please enter a valid email.
                  </motion.div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}

// ─── Onboarding gate — reads auth context ────────────────────────────────────

/**
 * Wraps the app content and shows the OnboardingModal when needed.
 * Must be inside AuthProvider so it can read useAuth().
 */
function AppWithOnboarding() {
  const { user, loading, isNewUser, onboardingComplete, markOnboardingSeen } = useAuth();

  const [briefingData, setBriefingData] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [errorBriefing, setErrorBriefing] = useState<string | null>(null);

  const [domainsData, setDomainsData] = useState<any[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [errorDomains, setErrorDomains] = useState<string | null>(null);

  const [selectedBriefing, setSelectedBriefing] = useState<
    'core' | 'data-science' | 'machine-learning' | 'ai-research' | 'agentic-frameworks' |
    'mlops' | 'model-releases' | 'ai-industry' | 'tools-libraries' | null
  >(null);

  // Whether the onboarding modal should render
  const showOnboarding = !loading && !!user && (isNewUser || !onboardingComplete);

  useEffect(() => {
    fetch(getApiUrl('/api/briefing/latest'))
      .then(async (res) => {
        if (!res.ok) {
          let errMsg = `Failed to fetch latest briefing: ${res.status}`;
          try { const d = await res.json(); if (d?.error) errMsg = d.error; } catch (_) {}
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then((data) => { setBriefingData(data); setLoadingBriefing(false); })
      .catch((err) => { setErrorBriefing(err instanceof Error ? err.message : String(err)); setLoadingBriefing(false); });

    fetch(getApiUrl('/api/briefing/domains'))
      .then(async (res) => {
        if (!res.ok) {
          let errMsg = `Failed to fetch domains briefing: ${res.status}`;
          try { const d = await res.json(); if (d?.error) errMsg = d.error; } catch (_) {}
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then((data) => { setDomainsData(data.domains || []); setLoadingDomains(false); })
      .catch((err) => { setErrorDomains(err instanceof Error ? err.message : String(err)); setLoadingDomains(false); });
  }, []);

  return (
    <>
      {/* Onboarding modal — renders on top of everything, z-[200] */}
      {showOnboarding && (
        <OnboardingModal onComplete={markOnboardingSeen} />
      )}

      {selectedBriefing ? (
        <BriefingPage
          onBack={() => setSelectedBriefing(null)}
          data={selectedBriefing === 'core' ? briefingData : domainsData.find(d => d.id === selectedBriefing)}
          loading={selectedBriefing === 'core' ? loadingBriefing : loadingDomains}
          error={selectedBriefing === 'core' ? errorBriefing : errorDomains}
        />
      ) : (
        <div className="min-h-screen relative">
          <div
            className="theme-atmosphere fixed inset-0 pointer-events-none -z-20 transition-colors duration-1000"
            style={{ background: 'var(--bg-gradient)' }}
          />
          <ScrollProgress />
          <CustomCursor />
          <NeuralCanvas />
          <Navbar />
          <main>
            <ReadingTime />
            <Hero briefingData={briefingData} loadingBriefing={loadingBriefing} />
            <Preview
              onOpenBriefing={(tabId) => {
                if (tabId === 'all') setSelectedBriefing('core');
                else if (tabId === 'research') setSelectedBriefing('ai-research');
                else if (tabId === 'agentic') setSelectedBriefing('agentic-frameworks');
              }}
              data={briefingData}
              domainsData={domainsData}
              loading={loadingBriefing}
              error={errorBriefing}
            />
            <MiniCTA />
            <Suspense fallback={null}>
              <PersonalizationShowcase domainsData={domainsData} loadingDomains={loadingDomains} />
            </Suspense>
            <Suspense fallback={null}>
              <HowItWorks />
            </Suspense>
            <Suspense fallback={null}>
              <Engine />
            </Suspense>
            <Suspense fallback={null}>
              <AISignalDashboard />
            </Suspense>
            <FocusDomains
              domains={domainsData}
              loading={loadingDomains}
              error={errorDomains}
              onSelectDomain={(id) => setSelectedBriefing(id as any)}
            />
            <Suspense fallback={null}>
              <Pipeline3D />
            </Suspense>
            <Suspense fallback={null}>
              <FAQ />
            </Suspense>
            <CTA />
          </main>
          <Footer />
          <BackToTop />
          <DevDashboard />
          <BottomNav />
        </div>
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioProvider>
          <BookmarkProvider>
            <LanguageProvider>
              <AppWithOnboarding />
            </LanguageProvider>
          </BookmarkProvider>
        </AudioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}