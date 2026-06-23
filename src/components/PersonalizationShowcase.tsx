import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

const TOPICS = [
  'OpenAI', 'Gemini', 'Claude', 'AI Agents',
  'Research Papers', 'Robotics', 'Startups', 'Machine Learning'
];

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'HI', label: 'Hindi' },
  { code: 'HG', label: 'Hinglish' },
  { code: 'ES', label: 'Spanish' },
  { code: 'FR', label: 'French' },
  { code: 'DE', label: 'German' },
  { code: 'JA', label: 'Japanese' },
  { code: 'IT', label: 'Italian' },
  { code: 'PT', label: 'Portuguese' },
  { code: 'RU', label: 'Russian' },
  { code: 'AR', label: 'Arabic' },
  { code: 'NL', label: 'Dutch' },
  { code: 'KO', label: 'Korean' },
  { code: 'ZH', label: 'Chinese' },
];

const TOPIC_TO_DOMAIN_ID: Record<string, string> = {
  'OpenAI':           'ai-research',
  'Gemini':           'ai-research',
  'Claude':           'ai-research',
  'AI Agents':        'agentic-frameworks',
  'Research Papers':  'ai-research',
  'Robotics':         'ai-industry',
  'Startups':         'ai-industry',
  'Machine Learning': 'machine-learning',
};

const FALLBACK_DATA: Record<string, any> = {
  'ai-research': { id: 'ai-research', title: 'AI Research Updates', source: 'ArXiv', confidence: 0.92, summary: 'Recent advancements in model architecture and training methodologies.' },
  'agentic-frameworks': { id: 'agentic-frameworks', title: 'Agentic Frameworks', source: 'GitHub', confidence: 0.89, summary: 'New tools for building autonomous AI agents and multi-agent systems.' },
  'ai-industry': { id: 'ai-industry', title: 'AI Industry News', source: 'TechCrunch', confidence: 0.95, summary: 'Latest funding rounds and product launches in the AI sector.' },
  'machine-learning': { id: 'machine-learning', title: 'Machine Learning', source: 'PapersWithCode', confidence: 0.94, summary: 'State-of-the-art results on standard machine learning benchmarks.' },
};

const MOCK_TRANSLATIONS: Record<string, Record<string, { title: string; summary: string }>> = {
  'ES': {
    'ai-research': { title: 'Actualizaciones de IA', summary: 'Avances recientes en la arquitectura de modelos y metodologías de entrenamiento.' },
    'agentic-frameworks': { title: 'Marcos Agentivos', summary: 'Nuevas herramientas para construir agentes de IA autónomos.' },
    'ai-industry': { title: 'Noticias de IA', summary: 'Últimas rondas de financiación y lanzamientos de productos en IA.' },
    'machine-learning': { title: 'Aprendizaje Automático', summary: 'Resultados de vanguardia en pruebas de aprendizaje automático.' }
  },
  'FR': {
    'ai-research': { title: 'Mises à jour IA', summary: 'Avancées récentes dans l\'architecture des modèles et l\'entraînement.' },
    'agentic-frameworks': { title: 'Cadres Agentiques', summary: 'Nouveaux outils pour créer des agents d\'IA autonomes.' },
    'ai-industry': { title: 'Actualités IA', summary: 'Dernières levées de fonds et lancements de produits en IA.' },
    'machine-learning': { title: 'Apprentissage Auto', summary: 'Résultats de pointe sur les benchmarks d\'apprentissage automatique.' }
  },
  'HI': {
    'ai-research': { title: 'AI अनुसंधान अपडेट', summary: 'मॉडल आर्किटेक्चर और प्रशिक्षण पद्धतियों में हालिया प्रगति।' },
    'agentic-frameworks': { title: 'एजेंटिक फ्रेमवर्क', summary: 'स्वायत्त AI एजेंट बनाने के लिए नए उपकरण।' },
    'ai-industry': { title: 'AI उद्योग समाचार', summary: 'AI क्षेत्र में नवीनतम फंडिंग राउंड और उत्पाद लॉन्च।' },
    'machine-learning': { title: 'मशीन लर्निंग', summary: 'मानक मशीन लर्निंग बेंचमार्क पर अत्याधुनिक परिणाम।' }
  },
  'ZH': {
    'ai-research': { title: 'AI 研究更新', summary: '模型架构和训练方法的最新进展。' },
    'agentic-frameworks': { title: '智能体框架', summary: '构建自主 AI 智能体的新工具。' },
    'ai-industry': { title: 'AI 行业新闻', summary: 'AI 领域的最新融资轮次和产品发布。' },
    'machine-learning': { title: '机器学习', summary: '标准机器学习基准上的最先进结果。' }
  },
  'KO': {
    'ai-research': { title: 'AI 연구 업데이트', summary: '모델 아키텍처 및 훈련 방법론의 최근 발전.' },
    'agentic-frameworks': { title: '에이전트 프레임워크', summary: '자율 AI 에이전트를 구축하기 위한 새로운 도구.' },
    'ai-industry': { title: 'AI 산업 뉴스', summary: 'AI 부문의 최신 펀딩 라운드 및 제품 출시.' },
    'machine-learning': { title: '기계 학습', summary: '표준 기계 학습 벤치마크의 최첨단 결과.' }
  },
  'HG': {
    'ai-research': { title: 'AI Research Updates', summary: 'Model architecture aur training methodologies mein latest advancements.' },
    'agentic-frameworks': { title: 'Agentic Frameworks', summary: 'Autonomous AI agents aur multi-agent systems banane ke naye tools.' },
    'ai-industry': { title: 'AI Industry News', summary: 'AI sector mein latest funding rounds aur product launches.' },
    'machine-learning': { title: 'Machine Learning', summary: 'Standard machine learning benchmarks par best results.' }
  },
  'DE': {
    'ai-research': { title: 'KI-Forschung', summary: 'Jüngste Fortschritte in Modellarchitektur und Trainingsmethodik.' },
    'agentic-frameworks': { title: 'Agentische KI', summary: 'Neue Tools zum Erstellen autonomer KI-Agenten.' },
    'ai-industry': { title: 'KI-Industrie-News', summary: 'Aktuelle Finanzierungsrunden und Produkteinführungen.' },
    'machine-learning': { title: 'Maschinelles Lernen', summary: 'Modernste Ergebnisse bei Standard-Benchmarks.' }
  },
  'JA': {
    'ai-research': { title: 'AI研究アップデート', summary: 'モデルアーキテクチャとトレーニング手法の最近の進歩。' },
    'agentic-frameworks': { title: '自律AIフレームワーク', summary: '自律型AIエージェントを構築するための新しいツール。' },
    'ai-industry': { title: 'AI業界ニュース', summary: 'AIセクターでの最新の資金調達と製品リリース。' },
    'machine-learning': { title: '機械学習', summary: '標準的な機械学習ベンチマークでの最先端の結果。' }
  },
  'IT': {
    'ai-research': { title: 'Aggiornamenti Ricerca AI', summary: 'Recenti progressi nell\'architettura dei modelli.' },
    'agentic-frameworks': { title: 'Framework Agenti', summary: 'Nuovi strumenti per costruire agenti AI autonomi.' },
    'ai-industry': { title: 'Notizie Settore AI', summary: 'Ultimi round di finanziamento e lanci di prodotti.' },
    'machine-learning': { title: 'Machine Learning', summary: 'Risultati all\'avanguardia sui benchmark standard.' }
  },
  'PT': {
    'ai-research': { title: 'Atualizações de Pesquisa IA', summary: 'Avanços recentes em arquitetura de modelos.' },
    'agentic-frameworks': { title: 'Estruturas de Agentes', summary: 'Novas ferramentas para construir agentes autônomos de IA.' },
    'ai-industry': { title: 'Notícias da Indústria de IA', summary: 'Últimas rodadas de financiamento e lançamentos de produtos.' },
    'machine-learning': { title: 'Machine Learning', summary: 'Resultados de ponta em benchmarks padrão.' }
  },
  'RU': {
    'ai-research': { title: 'Обновления ИИ', summary: 'Последние достижения в архитектуре моделей.' },
    'agentic-frameworks': { title: 'Фреймворки агентов', summary: 'Новые инструменты для создания автономных ИИ-агентов.' },
    'ai-industry': { title: 'Новости индустрии ИИ', summary: 'Последние раунды финансирования и запуски продуктов.' },
    'machine-learning': { title: 'Машинное обучение', summary: 'Передовые результаты в стандартных бенчмарках.' }
  },
  'AR': {
    'ai-research': { title: 'أبحاث الذكاء الاصطناعي', summary: 'التطورات الأخيرة في بنية النماذج ومنهجيات التدريب.' },
    'agentic-frameworks': { title: 'أطر الوكلاء', summary: 'أدوات جديدة لبناء وكلاء الذكاء الاصطناعي المستقلين.' },
    'ai-industry': { title: 'أخبار صناعة الذكاء الاصطناعي', summary: 'أحدث جولات التمويل وإطلاق المنتجات.' },
    'machine-learning': { title: 'تعلم الآلة', summary: 'أحدث النتائج في معايير تعلم الآلة القياسية.' }
  },
  'NL': {
    'ai-research': { title: 'AI-onderzoeksupdates', summary: 'Recente vooruitgang in modelarchitectuur en trainingsmethodologieën.' },
    'agentic-frameworks': { title: 'Agentische kaders', summary: 'Nieuwe tools voor het bouwen van autonome AI-agenten.' },
    'ai-industry': { title: 'AI-industrie Nieuws', summary: 'Laatste financieringsrondes en productlanceringen.' },
    'machine-learning': { title: 'Machine Learning', summary: 'Geavanceerde resultaten op standaard machine learning benchmarks.' }
  }
};

const getTopicLabel = (topic: string, t: (k: string) => string): string => {
  switch (topic) {
    case 'AI Agents': return t('topic_agentic_ai_label');
    case 'Research Papers': return t('topic_ai_research_label');
    case 'Machine Learning': return t('topic_machine_learning_label');
    case 'OpenAI': return t('topic_openai') !== 'topic_openai' ? t('topic_openai') : 'OpenAI';
    case 'Gemini': return t('topic_gemini') !== 'topic_gemini' ? t('topic_gemini') : 'Gemini';
    case 'Claude': return t('topic_claude') !== 'topic_claude' ? t('topic_claude') : 'Claude';
    case 'Robotics': return t('topic_robotics') !== 'topic_robotics' ? t('topic_robotics') : 'Robotics';
    case 'Startups': return t('topic_startups') !== 'topic_startups' ? t('topic_startups') : 'Startups';
    default: return topic;
  }
};

interface PersonalizationShowcaseProps {
  domainsData: any[];
  loadingDomains: boolean;
}

export function PersonalizationShowcase({ domainsData, loadingDomains }: PersonalizationShowcaseProps): React.JSX.Element {
  const { t, language, setLanguage } = useLanguage();
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set(['AI Agents', 'OpenAI']));

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topic)) {
        if (next.size > 1) next.delete(topic);
      } else {
        if (next.size < 4) next.add(topic);
      }
      return next;
    });
  };

  const relevanceScore = useMemo(() => {
    const base = 75;
    const increment = 6;
    const computed = Math.min(99, base + (selectedTopics.size * increment));
    if (loadingDomains) return Math.min(computed, 87);
    return computed;
  }, [selectedTopics, loadingDomains]);

  return (
    <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="personalization">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
        
        {/* Left Column: The Input (Teaching the AI) */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex flex-col"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold text-text-muted">
            {t('personalize_overline') || 'Personalization Engine'}
          </span>
          <h2 className="font-heading text-4xl md:text-5xl mb-6">
            {t('personalize_headline_1') || 'Build Your Own'}<br />
            <span className="italic">{t('personalize_headline_2') || 'AI Briefing'}</span>
          </h2>
          <p className="text-sm text-text-muted mb-12 leading-relaxed">
            {t('personalize_desc') || 'You control the signal. Select your focus areas and preferred language, and our agents will tailor a feed specifically for your workflow.'}
          </p>

          <div className="space-y-10">
            {/* Topic Selection */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-main">
                  {t('personalize_topics') || 'Focus Areas'}
                </span>
                <span className="text-[10px] text-text-muted">
                  {selectedTopics.size}/4 {t('selected') || 'Selected'}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {TOPICS.map(topic => {
                  const isActive = selectedTopics.has(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`
                        text-xs px-4 py-2 border transition-all duration-200 cursor-pointer active:scale-95
                        ${isActive 
                          ? 'bg-[var(--color-accent)] text-[var(--color-surface)] border-[var(--color-accent)] font-bold shadow-[0_0_10px_var(--color-theme-glow)]' 
                          : 'bg-transparent text-text-muted border-border-subtle hover:border-text-muted hover:text-text-main hover:shadow-[0_0_10px_var(--color-theme-glow)]'
                        }
                      `}
                    >
                      {isActive && <span className="mr-2 opacity-70">●</span>}
                      {getTopicLabel(topic, t)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-border-subtle pb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-main">
                  {t('personalize_language') || 'Output Language'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => {
                  return (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code.toLowerCase() as any)}
                      className={`
                        text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all
                        border ${language.toUpperCase() === lang.code ? 'border-text-main text-[var(--color-surface)] shadow-[0_0_10px_var(--color-theme-glow)]' : 'border-transparent text-text-muted hover:text-text-main hover:border-border-subtle'}
                      `}
                      style={language.toUpperCase() === lang.code ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } : {}}
                    >
                      {lang.code}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: The Output (Dynamic Briefings) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          <div className="bg-surface border border-border-subtle p-6 md:p-10 flex flex-col h-full relative overflow-hidden">
            
            {/* Header: Feedback & Relevance */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 border-b border-border-subtle pb-6 relative z-10">
              <div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
                  {t('system_status') || 'System Status'}
                </div>
                <div className="text-sm font-heading text-text-main">
                  {selectedTopics.size > 0 
                    ? t('personalize_feedback_some') || 'NeuralBrief is adapting your feed to prioritize these signals.'
                    : t('personalize_feedback_none') || 'Select topics to teach NeuralBrief what matters to you.'
                  }
                </div>
              </div>
              <div className="flex flex-col sm:items-end">
                <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">
                  {t('personalize_relevance') || 'Briefing Relevance'}
                </div>
                <div className="text-3xl font-heading" style={{ color: 'var(--color-accent)', textShadow: '0 0 15px var(--color-theme-glow)' }}>
                  {relevanceScore}%
                </div>
              </div>
            </div>

            {/* Dynamic Briefing List */}
            <div className="space-y-6 relative z-10 min-h-[300px]">
              <AnimatePresence mode="popLayout">
                {Array.from(selectedTopics).map((topic: string, i: number) => {
                  const domainId = TOPIC_TO_DOMAIN_ID[topic];
                  const data = domainsData.find(d => d.id === domainId) || FALLBACK_DATA[domainId];
                  const isLoading = loadingDomains;
                  
                  const selectedLangCode = language.toUpperCase();

                  const displayTitle = selectedLangCode !== 'EN' && MOCK_TRANSLATIONS[selectedLangCode]?.[domainId]?.title 
                    ? MOCK_TRANSLATIONS[selectedLangCode][domainId].title 
                    : data.title;

                  const displaySummary = selectedLangCode !== 'EN' && MOCK_TRANSLATIONS[selectedLangCode]?.[domainId]?.summary 
                    ? MOCK_TRANSLATIONS[selectedLangCode][domainId].summary 
                    : data.summary;

                  return (
                    <motion.div
                      key={topic}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.4, type: 'spring', bounce: 0, delay: i * 0.05 }}
                      className="bg-surface-dim border border-border-subtle p-5 transition-all hover:shadow-[0_0_15px_var(--color-theme-glow)]"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {isLoading ? (
                        /* Skeleton loader */
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="h-4 bg-text-muted/15 rounded w-3/4 animate-pulse" />
                            <span className="text-[9px] px-2 py-0.5 border border-border-subtle text-text-muted uppercase tracking-wider shrink-0">
                              {getTopicLabel(topic, t)}
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="h-3 bg-text-muted/10 rounded w-full animate-pulse" />
                            <div className="h-3 bg-text-muted/10 rounded w-full animate-pulse" />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="h-3 bg-text-muted/10 rounded w-24 animate-pulse" />
                          </div>
                        </div>
                      ) : (
                        /* Real data */
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <h4 className="font-heading text-lg leading-tight">{displayTitle}</h4>
                            <span className="text-[9px] px-2 py-0.5 border border-border-subtle text-text-muted uppercase tracking-wider shrink-0">
                              {getTopicLabel(topic, t)}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed mb-4">
                            {displaySummary}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase">
                            <span style={{ color: 'var(--color-accent)' }}>{t('source') || 'Source'}: {data.source}</span>
                            <span className="text-text-muted opacity-50">|</span>
                            <span className="text-text-muted">{t('confidence') || 'Conf'}: {(data.confidence ?? 0.95).toFixed(3)}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            {/* Subtle background glow representing active engine */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 blur-[100px] pointer-events-none transition-colors duration-1000" 
              style={{ background: 'var(--color-theme-glow)' }}
            />

          </div>
        </motion.div>

      </div>
    </section>
  );
}