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

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <BookmarkProvider>
          <LanguageProvider>
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
                <Preview />
                <CTA />
                <FAQ />
              </main>
              <Footer />
              <BackToTop />
              <DevDashboard />
              <BottomNav />
            </div>
          </LanguageProvider>
        </BookmarkProvider>
      </AudioProvider>
    </AuthProvider>
  );
}
