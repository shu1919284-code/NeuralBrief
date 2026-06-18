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

export default function App() {
  const [activePage, setActivePage] = useState<'home' | 'briefing'>('home');
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://neuralbrief-production.up.railway.app/api/briefing/latest')
      .then(async (res) => {
        if (!res.ok) {
          let errMsg = `Failed to fetch latest briefing: ${res.status}`;
          try {
            const errData = await res.json();
            if (errData && errData.error) {
              errMsg = errData.error;
            }
          } catch (_) {}
          throw new Error(errMsg);
        }
        return res.json();
      })
      .then((data) => {
        setBriefingData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, []);

  return (
    <AuthProvider>
      <AudioProvider>
        <BookmarkProvider>
          <LanguageProvider>
            {activePage === 'briefing' ? (
              <BriefingPage 
                onBack={() => setActivePage('home')} 
                data={briefingData} 
                loading={loading}
                error={error}
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
                  <FocusDomains />
                  <Engine />
                  <Preview 
                    onOpenBriefing={() => setActivePage('briefing')} 
                    data={briefingData}
                    loading={loading}
                    error={error}
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
