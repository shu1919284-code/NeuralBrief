import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'hi' | 'zh' | 'ko';

/** Flat dot-notation translation map for a single language. */
type TranslationMap = Record<string, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Translation dictionaries
// Keys follow the namespace.key dot-notation agreed in the project spec.
// ─────────────────────────────────────────────────────────────────────────────

const en: TranslationMap = {
  // nav
  'nav.features': 'Features',
  'nav.howItWorks': 'How It Works',
  'nav.pricing': 'Pricing',
  'nav.signIn': 'Sign In',
  'nav.dashboard': 'Dashboard',
  'nav.signOut': 'Sign Out',

  // hero
  'hero.headline': 'Stay Ahead of',
  'hero.subheadline': 'the Machine.',
  'hero.emailPlaceholder': 'Enter your email address',
  'hero.ctaButton': 'Get My Briefing',
  'hero.successMessage': 'Successfully subscribed. Welcome.',
  'hero.errorMessage': 'Something went wrong. Please try again.',

  // features
  'features.title': 'Four Agents. One Perfect Brief.',
  'features.subtitle': 'An autonomous pipeline runs every morning so you never miss what matters.',
  'features.badge1': 'Scraper Agent',
  'features.badge2': 'Filter Agent',
  'features.badge3': 'Zero Noise',
  'features.desc1': 'Crawls 200+ sources across ArXiv, GitHub, TechCrunch, and more every morning.',
  'features.desc2': 'Scores each article for relevance, deduplicates, and discards low-signal noise.',
  'features.desc3': 'Delivers only what matches your chosen topics — nothing you did not ask for.',

  // footer
  'footer.tagline': 'Intelligence, delivered daily.',
  'footer.rights': '© 2025 NeuralBrief',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.contact': 'Contact',
  'footer.emailPlaceholder': 'email@address.com',
  'footer.ctaButton': 'Subscribed. See you tomorrow.',

  // profile
  'profile.title': 'Your Profile',
  'profile.topics': 'Topics',
  'profile.preferences': 'Preferences',
  'profile.bookmarks': 'Bookmarks',
  'profile.save': 'Save Changes',
  'profile.saving': 'Saving…',
  'profile.saved': 'Saved',
  'profile.logout': 'Log Out',
  'profile.digestFrequency': 'Digest Frequency',
  'profile.daily': 'Daily',
  'profile.weekly': 'Weekly',

  // auth
  'auth.signInWithGoogle': 'Continue with Google',
  'auth.signingIn': 'Signing in…',
  'auth.signOut': 'Sign Out',
  'auth.popupBlocked': 'Pop-up blocked. Please allow pop-ups for this site and try again.',
  'auth.authError': 'Authentication failed. Please try again.',
  'auth.loginRequired': 'Please sign in to continue.',

  // bookmarks
  'bookmarks.title': 'Saved Articles',
  'bookmarks.empty': 'No bookmarks yet. Start reading to save articles here.',
  'bookmarks.remove': 'Remove',
  'bookmarks.loginRequired': 'Sign in to view your bookmarks.',

  // engine
  'engine.title': 'The Pipeline',
  'engine.description': 'Four specialised agents run in sequence every morning at 07:00 UTC.',
  'engine.step1': 'Scraper Agent — harvests fresh articles from 200+ curated sources.',
  'engine.step2': 'Filter Agent — scores relevance and removes duplicates.',
  'engine.step3': 'Summary Agent — distils each article into a two-sentence brief.',
  'engine.step4': 'Email Agent — assembles and sends your personalised digest via Gmail.',

  // faq
  'faq.title': 'Frequently Asked Questions',
  'faq.q1': 'Which topics can I follow?',
  'faq.a1': 'You can follow any combination of AI research, product releases, developer tools, startups, policy, and more.',
  'faq.q2': 'When is the digest delivered?',
  'faq.a2': 'Digests are sent at 07:00 UTC every morning, or weekly on Monday if you prefer.',
  'faq.q3': 'How do you prevent duplicate articles?',
  'faq.a3': 'The Filter Agent deduplicates by URL and semantic similarity before summaries are generated.',
  'faq.q4': 'Is my Gmail data private?',
  'faq.a4': 'We only send email to your inbox — we never read, index, or store your Gmail messages.',
  'faq.q5': 'Can I change my topics later?',
  'faq.a5': 'Yes — open your profile at any time to add or remove topics. Changes apply from the next digest.',

  // cta
  'cta.title': 'Ready for a smarter morning?',
  'cta.subtitle': 'Trusted by engineers at',
  'cta.button': 'Start Free',

  // additional keys used in components
  'reading_time': 'min read',
  'preview_overline': 'Live Preview',
  'preview_title_1': 'Sample',
  'preview_title_2': 'Digest',
  'nav_domains': 'Topics',
  'nav_engine': 'Engine',
  'nav_digest': 'Preview',
  'search_placeholder': 'Search articles...',
  'focus_overline': 'Focus Domains',
  'focus_title_1': 'Selected',
  'focus_title_2': 'Topics',
  'focus_desc': 'Our agents track, scrape, and filter content across these core domains every day.',
  'faq_overline': 'FAQ',
  'faq_title_1': 'Common',
  'faq_title_2': 'Questions',
  'engine_overline': 'How it Works',
  'engine_title_1': 'The',
  'engine_title_2': 'Engine',
  'engine_desc': 'Four autonomous agents collaborate to scrape, filter, summarize, and deliver your morning briefing.',
  'cta_title_1': 'Ready for a',
  'cta_title_2': 'Smarter Morning?',
  'cta_desc': 'Start your daily AI and technology intelligence feed today.',
};

// ─────────────────────────────────────────────────────────────────────────────

const es: TranslationMap = {
  'nav.features': 'Características',
  'nav.howItWorks': 'Cómo funciona',
  'nav.pricing': 'Precios',
  'nav.signIn': 'Iniciar sesión',
  'nav.dashboard': 'Panel',
  'nav.signOut': 'Cerrar sesión',

  'hero.headline': 'Mantente un paso',
  'hero.subheadline': 'adelante.',
  'hero.emailPlaceholder': 'Introduce tu correo electrónico',
  'hero.ctaButton': 'Recibir mi resumen',
  'hero.successMessage': 'Suscripción correcta. Bienvenido.',
  'hero.errorMessage': 'Algo salió mal. Inténtalo de nuevo.',

  'features.title': 'Cuatro agentes. Un resumen perfecto.',
  'features.subtitle': 'Un proceso autónomo se ejecuta cada mañana para que no te pierdas nada importante.',
  'features.badge1': 'Agente Scraper',
  'features.badge2': 'Agente Filtro',
  'features.badge3': 'Cero ruido',
  'features.desc1': 'Rastrea más de 200 fuentes entre ArXiv, GitHub, TechCrunch y otras cada mañana.',
  'features.desc2': 'Puntúa cada artículo por relevancia, elimina duplicados y descarta el ruido.',
  'features.desc3': 'Entrega solo lo que coincide con tus temas elegidos.',

  'footer.tagline': 'Inteligencia, entregada cada día.',
  'footer.rights': '© 2025 NeuralBrief',
  'footer.privacyPolicy': 'Política de privacidad',
  'footer.terms': 'Términos de servicio',
  'footer.contact': 'Contacto',
  'footer.emailPlaceholder': 'correo@dominio.com',
  'footer.ctaButton': 'Suscrito. Hasta mañana.',

  'profile.title': 'Tu perfil',
  'profile.topics': 'Temas',
  'profile.preferences': 'Preferencias',
  'profile.bookmarks': 'Guardados',
  'profile.save': 'Guardar cambios',
  'profile.saving': 'Guardando…',
  'profile.saved': 'Guardado',
  'profile.logout': 'Cerrar sesión',
  'profile.digestFrequency': 'Frecuencia del resumen',
  'profile.daily': 'Diario',
  'profile.weekly': 'Semanal',

  'auth.signInWithGoogle': 'Continuar con Google',
  'auth.signingIn': 'Iniciando sesión…',
  'auth.signOut': 'Cerrar sesión',
  'auth.popupBlocked': 'Ventana emergente bloqueada. Permite ventanas emergentes e inténtalo de nuevo.',
  'auth.authError': 'Error de autenticación. Inténtalo de nuevo.',
  'auth.loginRequired': 'Por favor, inicia sesión para continuar.',

  'bookmarks.title': 'Artículos guardados',
  'bookmarks.empty': 'Sin marcadores aún. Empieza a leer para guardar artículos aquí.',
  'bookmarks.remove': 'Eliminar',
  'bookmarks.loginRequired': 'Inicia sesión para ver tus marcadores.',

  'engine.title': 'El proceso',
  'engine.description': 'Cuatro agentes especializados se ejecutan en secuencia cada mañana a las 07:00 UTC.',
  'engine.step1': 'Agente Scraper — recopila artículos frescos de más de 200 fuentes.',
  'engine.step2': 'Agente Filtro — puntúa la relevancia y elimina duplicados.',
  'engine.step3': 'Agente Resumen — condensa cada artículo en dos frases.',
  'engine.step4': 'Agente Email — monta y envía tu resumen personalizado por Gmail.',

  'faq.title': 'Preguntas frecuentes',
  'faq.q1': '¿Qué temas puedo seguir?',
  'faq.a1': 'Puedes seguir combinaciones de investigación en IA, lanzamientos de productos, herramientas para desarrolladores, startups, política y más.',
  'faq.q2': '¿Cuándo se entrega el resumen?',
  'faq.a2': 'Los resúmenes se envían a las 07:00 UTC cada mañana, o semanalmente los lunes si lo prefieres.',
  'faq.q3': '¿Cómo se evitan artículos duplicados?',
  'faq.a3': 'El Agente Filtro deduplica por URL y similitud semántica antes de generar los resúmenes.',
  'faq.q4': '¿Son privados mis datos de Gmail?',
  'faq.a4': 'Solo enviamos correos a tu bandeja de entrada — nunca leemos ni almacenamos tus mensajes de Gmail.',
  'faq.q5': '¿Puedo cambiar mis temas más adelante?',
  'faq.a5': 'Sí — abre tu perfil en cualquier momento para añadir o eliminar temas. Los cambios aplican desde el próximo resumen.',

  'cta.title': '¿Listo para una mañana más inteligente?',
  'cta.subtitle': 'Utilizado por ingenieros de',
  'cta.button': 'Empezar gratis',

  // additional keys used in components
  'reading_time': 'min de lectura',
  'preview_overline': 'Vista Previa',
  'preview_title_1': 'Resumen',
  'preview_title_2': 'de Muestra',
  'nav_domains': 'Temas',
  'nav_engine': 'Proceso',
  'nav_digest': 'Previsualizar',
  'search_placeholder': 'Buscar artículos...',
  'focus_overline': 'Dominios de Enfoque',
  'focus_title_1': 'Temas',
  'focus_title_2': 'Seleccionados',
  'focus_desc': 'Nuestros agentes rastrean, recopilan y filtran contenido en estas áreas clave todos los días.',
  'faq_overline': 'Preguntas Frecuentes',
  'faq_title_1': 'Preguntas',
  'faq_title_2': 'Comunes',
  'engine_overline': 'Cómo Funciona',
  'engine_title_1': 'El',
  'engine_title_2': 'Proceso',
  'engine_desc': 'Cuatro agentes autónomos colaboran para rastrear, filtrar, resumir y entregar su informe matutino.',
  'cta_title_1': '¿Listo para una',
  'cta_title_2': 'Mañana más Inteligente?',
  'cta_desc': 'Comience hoy mismo su feed de inteligencia diario sobre IA y tecnología.',
};

// ─────────────────────────────────────────────────────────────────────────────

const fr: TranslationMap = {
  'nav.features': 'Fonctionnalités',
  'nav.howItWorks': 'Comment ça marche',
  'nav.pricing': 'Tarifs',
  'nav.signIn': 'Se connecter',
  'nav.dashboard': 'Tableau de bord',
  'nav.signOut': 'Se déconnecter',

  'hero.headline': 'Gardez une longueur',
  'hero.subheadline': "d'avance.",
  'hero.emailPlaceholder': 'Entrez votre adresse e-mail',
  'hero.ctaButton': 'Recevoir mon briefing',
  'hero.successMessage': 'Abonnement réussi. Bienvenue.',
  'hero.errorMessage': 'Une erreur est survenue. Veuillez réessayer.',

  'features.title': 'Quatre agents. Un briefing parfait.',
  'features.subtitle': 'Un pipeline autonome s\'exécute chaque matin pour que vous ne manquiez rien d\'essentiel.',
  'features.badge1': 'Agent Scraper',
  'features.badge2': 'Agent Filtre',
  'features.badge3': 'Zéro bruit',
  'features.desc1': 'Parcourt plus de 200 sources — ArXiv, GitHub, TechCrunch et d\'autres — chaque matin.',
  'features.desc2': 'Note chaque article par pertinence, déduplique et élimine le bruit.',
  'features.desc3': 'Livre uniquement ce qui correspond à vos sujets sélectionnés.',

  'footer.tagline': 'L\'intelligence, livrée chaque jour.',
  'footer.rights': '© 2025 NeuralBrief',
  'footer.privacyPolicy': 'Politique de confidentialité',
  'footer.terms': "Conditions d'utilisation",
  'footer.contact': 'Contact',
  'footer.emailPlaceholder': 'email@domaine.com',
  'footer.ctaButton': 'Abonné. À demain.',

  'profile.title': 'Votre profil',
  'profile.topics': 'Sujets',
  'profile.preferences': 'Préférences',
  'profile.bookmarks': 'Favoris',
  'profile.save': 'Enregistrer',
  'profile.saving': 'Enregistrement…',
  'profile.saved': 'Enregistré',
  'profile.logout': 'Se déconnecter',
  'profile.digestFrequency': 'Fréquence du digest',
  'profile.daily': 'Quotidien',
  'profile.weekly': 'Hebdomadaire',

  'auth.signInWithGoogle': 'Continuer avec Google',
  'auth.signingIn': 'Connexion en cours…',
  'auth.signOut': 'Se déconnecter',
  'auth.popupBlocked': 'Fenêtre pop-up bloquée. Autorisez les pop-ups et réessayez.',
  'auth.authError': 'Échec de l\'authentification. Veuillez réessayer.',
  'auth.loginRequired': 'Veuillez vous connecter pour continuer.',

  'bookmarks.title': 'Articles sauvegardés',
  'bookmarks.empty': 'Aucun favori pour l\'instant. Lisez des articles pour les sauvegarder ici.',
  'bookmarks.remove': 'Supprimer',
  'bookmarks.loginRequired': 'Connectez-vous pour voir vos favoris.',

  'engine.title': 'Le pipeline',
  'engine.description': 'Quatre agents spécialisés s\'exécutent en séquence chaque matin à 07:00 UTC.',
  'engine.step1': 'Agent Scraper — collecte de nouveaux articles depuis plus de 200 sources.',
  'engine.step2': 'Agent Filtre — note la pertinence et supprime les doublons.',
  'engine.step3': 'Agent Résumé — condense chaque article en deux phrases.',
  'engine.step4': 'Agent Email — assemble et envoie votre digest personnalisé via Gmail.',

  'faq.title': 'Questions fréquentes',
  'faq.q1': 'Quels sujets puis-je suivre ?',
  'faq.a1': 'Vous pouvez suivre la recherche en IA, les lancements de produits, les outils développeurs, les startups, la politique et bien plus.',
  'faq.q2': 'Quand le digest est-il livré ?',
  'faq.a2': 'Les digests sont envoyés à 07:00 UTC chaque matin, ou le lundi si vous préférez un rythme hebdomadaire.',
  'faq.q3': 'Comment les doublons sont-ils évités ?',
  'faq.a3': "L'Agent Filtre déduplique par URL et similarité sémantique avant la génération des résumés.",
  'faq.q4': 'Mes données Gmail sont-elles privées ?',
  'faq.a4': 'Nous envoyons uniquement des e-mails dans votre boîte de réception — nous ne lisons ni ne stockons vos messages Gmail.',
  'faq.q5': 'Puis-je changer mes sujets plus tard ?',
  'faq.a5': "Oui — ouvrez votre profil à tout moment pour ajouter ou supprimer des sujets. Les modifications s'appliquent dès le prochain digest.",

  'cta.title': 'Prêt pour des matins plus intelligents ?',
  'cta.subtitle': 'Adopté par des ingénieurs chez',
  'cta.button': 'Commencer gratuitement',

  // additional keys used in components
  'reading_time': 'min de lecture',
  'preview_overline': 'Aperçu en Direct',
  'preview_title_1': 'Exemple de',
  'preview_title_2': 'Digest',
  'nav_domains': 'Sujets',
  'nav_engine': 'Pipeline',
  'nav_digest': 'Aperçu',
  'search_placeholder': 'Rechercher des articles...',
  'focus_overline': 'Domaines d\'Intérêt',
  'focus_title_1': 'Sujets',
  'focus_title_2': 'Sélectionnés',
  'focus_desc': 'Nos agents surveillent, collectent et filtrent le contenu de ces domaines clés chaque jour.',
  'faq_overline': 'FAQ',
  'faq_title_1': 'Questions',
  'faq_title_2': 'Fréquentes',
  'engine_overline': 'Comment Ça Marche',
  'engine_title_1': 'Le',
  'engine_title_2': 'Pipeline',
  'engine_desc': 'Quatre agents autonomes collaborent pour collecter, filtrer, résumer et livrer votre briefing matinal.',
  'cta_title_1': 'Prêt pour un',
  'cta_title_2': 'Matin plus Intelligent ?',
  'cta_desc': 'Commencez dès aujourd\'hui votre flux quotidien d\'intelligence IA et technologique.',
};

// ─────────────────────────────────────────────────────────────────────────────

const hi: TranslationMap = {
  'nav.features': 'विशेषताएँ',
  'nav.howItWorks': 'यह कैसे काम करता है',
  'nav.pricing': 'मूल्य निर्धारण',
  'nav.signIn': 'साइन इन करें',
  'nav.dashboard': 'डैशबोर्ड',
  'nav.signOut': 'साइन आउट करें',

  'hero.headline': 'तकनीक की दुनिया में',
  'hero.subheadline': 'सबसे आगे रहें।',
  'hero.emailPlaceholder': 'अपना ईमेल पता दर्ज करें',
  'hero.ctaButton': 'मेरा ब्रीफ़िंग पाएँ',
  'hero.successMessage': 'सफलतापूर्वक सदस्यता ली। स्वागत है।',
  'hero.errorMessage': 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',

  'features.title': 'चार एजेंट। एक परफेक्ट ब्रीफ।',
  'features.subtitle': 'हर सुबह एक स्वायत्त पाइपलाइन चलती है ताकि आप कुछ भी न चूकें।',
  'features.badge1': 'स्क्रेपर एजेंट',
  'features.badge2': 'फ़िल्टर एजेंट',
  'features.badge3': 'शून्य शोर',
  'features.desc1': 'हर सुबह ArXiv, GitHub, TechCrunch और अन्य 200+ स्रोतों को खंगालता है।',
  'features.desc2': 'प्रत्येक लेख को प्रासंगिकता के आधार पर स्कोर करता है और डुप्लीकेट हटाता है।',
  'features.desc3': 'केवल वही सामग्री देता है जो आपके चुने गए विषयों से मेल खाती है।',

  'footer.tagline': 'बुद्धिमत्ता, हर दिन वितरित।',
  'footer.rights': '© 2025 NeuralBrief',
  'footer.privacyPolicy': 'गोपनीयता नीति',
  'footer.terms': 'सेवा की शर्तें',
  'footer.contact': 'संपर्क',
  'footer.emailPlaceholder': 'email@address.com',
  'footer.ctaButton': 'सदस्यता ले ली। कल मिलेंगे।',

  'profile.title': 'आपकी प्रोफ़ाइल',
  'profile.topics': 'विषय',
  'profile.preferences': 'प्राथमिकताएँ',
  'profile.bookmarks': 'बुकमार्क',
  'profile.save': 'परिवर्तन सहेजें',
  'profile.saving': 'सहेजा जा रहा है…',
  'profile.saved': 'सहेजा गया',
  'profile.logout': 'लॉग आउट',
  'profile.digestFrequency': 'डाइजेस्ट आवृत्ति',
  'profile.daily': 'दैनिक',
  'profile.weekly': 'साप्ताहिक',

  'auth.signInWithGoogle': 'Google से जारी रखें',
  'auth.signingIn': 'साइन इन हो रहा है…',
  'auth.signOut': 'साइन आउट करें',
  'auth.popupBlocked': 'पॉप-अप ब्लॉक हो गया। कृपया पॉप-अप की अनुमति दें और पुनः प्रयास करें।',
  'auth.authError': 'प्रमाणीकरण विफल। कृपया पुनः प्रयास करें।',
  'auth.loginRequired': 'जारी रखने के लिए कृपया साइन इन करें।',

  'bookmarks.title': 'सहेजे गए लेख',
  'bookmarks.empty': 'अभी कोई बुकमार्क नहीं। लेख पढ़ें और यहाँ सहेजें।',
  'bookmarks.remove': 'हटाएँ',
  'bookmarks.loginRequired': 'बुकमार्क देखने के लिए साइन इन करें।',

  'engine.title': 'पाइपलाइन',
  'engine.description': 'चार विशेष एजेंट हर सुबह 07:00 UTC पर क्रम से चलते हैं।',
  'engine.step1': 'स्क्रेपर एजेंट — 200+ स्रोतों से ताज़े लेख एकत्र करता है।',
  'engine.step2': 'फ़िल्टर एजेंट — प्रासंगिकता स्कोर करता है और डुप्लीकेट हटाता है।',
  'engine.step3': 'सारांश एजेंट — प्रत्येक लेख को दो वाक्यों में संक्षिप्त करता है।',
  'engine.step4': 'ईमेल एजेंट — आपका व्यक्तिगत डाइजेस्ट Gmail से भेजता है।',

  'faq.title': 'अक्सर पूछे जाने वाले प्रश्न',
  'faq.q1': 'मैं कौन से विषय फ़ॉलो कर सकता हूँ?',
  'faq.a1': 'AI शोध, उत्पाद लॉन्च, डेवलपर टूल, स्टार्टअप, नीति और बहुत कुछ।',
  'faq.q2': 'डाइजेस्ट कब भेजा जाता है?',
  'faq.a2': 'हर सुबह 07:00 UTC पर, या साप्ताहिक चुनने पर सोमवार को।',
  'faq.q3': 'डुप्लीकेट लेखों को कैसे रोका जाता है?',
  'faq.a3': 'फ़िल्टर एजेंट URL और अर्थपूर्ण समानता के आधार पर डुप्लीकेट हटाता है।',
  'faq.q4': 'क्या मेरा Gmail डेटा सुरक्षित है?',
  'faq.a4': 'हम केवल आपके इनबॉक्स में ईमेल भेजते हैं — आपके Gmail संदेश कभी नहीं पढ़ते।',
  'faq.q5': 'क्या मैं बाद में विषय बदल सकता हूँ?',
  'faq.a5': 'हाँ — किसी भी समय अपनी प्रोफ़ाइल खोलें। परिवर्तन अगले डाइजेस्ट से लागू होंगे।',

  'cta.title': 'एक स्मार्ट सुबह के लिए तैयार हैं?',
  'cta.subtitle': 'इन कंपनियों के इंजीनियर भरोसा करते हैं',
  'cta.button': 'मुफ़्त में शुरू करें',

  // additional keys used in components
  'reading_time': 'मिनट का पाठ',
  'preview_overline': 'लाइव पूर्वावलोकन',
  'preview_title_1': 'नमूना',
  'preview_title_2': 'डाइजेस्ट',
  'nav_domains': 'विषय',
  'nav_engine': 'इंजन',
  'nav_digest': 'पूर्वावलोकन',
  'search_placeholder': 'लेख खोजें...',
  'focus_overline': 'फोकस डोमेन',
  'focus_title_1': 'चयनित',
  'focus_title_2': 'विषय',
  'focus_desc': 'हमारे एजेंट हर दिन इन मुख्य डोमेन में सामग्री को ट्रैक, स्क्रैप और फ़िल्टर करते हैं।',
  'faq_overline': 'सामान्य प्रश्न',
  'faq_title_1': 'सामान्य',
  'faq_title_2': 'प्रश्न',
  'engine_overline': 'यह कैसे काम करता है',
  'engine_title_1': 'मुख्य',
  'engine_title_2': 'पाइपलाइन',
  'engine_desc': 'सुबह का ब्रीफिंग देने के लिए चार स्वायत्त एजेंट मिलकर काम करते हैं।',
  'cta_title_1': 'क्या आप एक',
  'cta_title_2': 'स्मार्ट सुबह के लिए तैयार हैं?',
  'cta_desc': 'आज ही अपना दैनिक एआई और तकनीकी ब्रीफिंग शुरू करें।',
};

// ─────────────────────────────────────────────────────────────────────────────

const zh: TranslationMap = {
  'nav.features': '功能特点',
  'nav.howItWorks': '工作原理',
  'nav.pricing': '定价',
  'nav.signIn': '登录',
  'nav.dashboard': '控制台',
  'nav.signOut': '退出登录',

  'hero.headline': '掌握前沿',
  'hero.subheadline': 'AI 动态。',
  'hero.emailPlaceholder': '请输入您的电子邮箱',
  'hero.ctaButton': '获取我的简报',
  'hero.successMessage': '订阅成功，欢迎您。',
  'hero.errorMessage': '出现错误，请重试。',

  'features.title': '四个智能体，一份完美简报。',
  'features.subtitle': '每天清晨，自动化流水线为您筛选最重要的资讯。',
  'features.badge1': '抓取智能体',
  'features.badge2': '过滤智能体',
  'features.badge3': '零噪音',
  'features.desc1': '每天早上爬取 ArXiv、GitHub、TechCrunch 等 200 余个来源。',
  'features.desc2': '对每篇文章进行相关性评分，去重并过滤低价值内容。',
  'features.desc3': '仅推送与您选择的主题匹配的内容。',

  'footer.tagline': '每日智能简报，准时送达。',
  'footer.rights': '© 2025 NeuralBrief',
  'footer.privacyPolicy': '隐私政策',
  'footer.terms': '服务条款',
  'footer.contact': '联系我们',
  'footer.emailPlaceholder': 'email@address.com',
  'footer.ctaButton': '订阅成功，明天见。',

  'profile.title': '个人资料',
  'profile.topics': '话题',
  'profile.preferences': '偏好设置',
  'profile.bookmarks': '收藏',
  'profile.save': '保存更改',
  'profile.saving': '保存中…',
  'profile.saved': '已保存',
  'profile.logout': '退出登录',
  'profile.digestFrequency': '简报频率',
  'profile.daily': '每日',
  'profile.weekly': '每周',

  'auth.signInWithGoogle': '使用 Google 继续',
  'auth.signingIn': '登录中…',
  'auth.signOut': '退出登录',
  'auth.popupBlocked': '弹窗被拦截，请允许弹窗后重试。',
  'auth.authError': '身份验证失败，请重试。',
  'auth.loginRequired': '请登录后继续。',

  'bookmarks.title': '已保存文章',
  'bookmarks.empty': '暂无收藏，开始阅读以保存文章。',
  'bookmarks.remove': '删除',
  'bookmarks.loginRequired': '请登录以查看您的收藏。',

  'engine.title': '处理流水线',
  'engine.description': '四个专用智能体每天早上 07:00 UTC 按顺序运行。',
  'engine.step1': '抓取智能体 — 从 200 余个精选来源采集最新文章。',
  'engine.step2': '过滤智能体 — 进行相关性评分并去除重复内容。',
  'engine.step3': '摘要智能体 — 将每篇文章提炼为两句话简报。',
  'engine.step4': '邮件智能体 — 生成您的个性化简报并通过 Gmail 发送。',

  'faq.title': '常见问题',
  'faq.q1': '我可以关注哪些话题？',
  'faq.a1': '可关注 AI 研究、产品发布、开发者工具、创业公司、政策等多种组合。',
  'faq.q2': '简报何时送达？',
  'faq.a2': '每天早上 07:00 UTC 发送，或选择每周一发送。',
  'faq.q3': '如何防止重复文章？',
  'faq.a3': '过滤智能体在生成摘要前通过 URL 和语义相似度去重。',
  'faq.q4': '我的 Gmail 数据安全吗？',
  'faq.a4': '我们仅向您的收件箱发送邮件，从不读取或存储您的 Gmail 邮件。',
  'faq.q5': '我之后可以更改话题吗？',
  'faq.a5': '可以 — 随时打开个人资料添加或删除话题，变更从下一期简报起生效。',

  'cta.title': '准备好迎接更智慧的每天早晨了吗？',
  'cta.subtitle': '受到这些公司工程师的信赖',
  'cta.button': '免费开始',

  // additional keys used in components
  'reading_time': '分钟阅读',
  'preview_overline': '实时预览',
  'preview_title_1': '简报',
  'preview_title_2': '样例',
  'nav_domains': '话题',
  'nav_engine': '流水线',
  'nav_digest': '预览',
  'search_placeholder': '搜索文章...',
  'focus_overline': '核心领域',
  'focus_title_1': '精选',
  'focus_title_2': '话题',
  'focus_desc': '我们的智能体每天追踪、爬取并筛选这些核心领域的内容。',
  'faq_overline': '常见问题',
  'faq_title_1': '常见',
  'faq_title_2': '解答',
  'engine_overline': '工作原理',
  'engine_title_1': '处理',
  'engine_title_2': '流水线',
  'engine_desc': '四个专用智能体协同运行，抓取、过滤、总结并发送您的每日简报。',
  'cta_title_1': '准备好迎接更',
  'cta_title_2': '智慧的清晨了吗？',
  'cta_desc': '今天就开启您的每日 AI 与科技情报定制推送。',
};

// ─────────────────────────────────────────────────────────────────────────────

const ko: TranslationMap = {
  'nav.features': '기능',
  'nav.howItWorks': '작동 방식',
  'nav.pricing': '요금제',
  'nav.signIn': '로그인',
  'nav.dashboard': '대시보드',
  'nav.signOut': '로그아웃',

  'hero.headline': '기술의 흐름을',
  'hero.subheadline': '앞서 파악하세요.',
  'hero.emailPlaceholder': '이메일 주소를 입력하세요',
  'hero.ctaButton': '브리핑 받기',
  'hero.successMessage': '구독이 완료되었습니다. 환영합니다.',
  'hero.errorMessage': '오류가 발생했습니다. 다시 시도해 주세요.',

  'features.title': '네 개의 에이전트. 하나의 완벽한 브리핑.',
  'features.subtitle': '매일 아침 자동 파이프라인이 실행되어 중요한 정보를 놓치지 않게 합니다.',
  'features.badge1': '스크레이퍼 에이전트',
  'features.badge2': '필터 에이전트',
  'features.badge3': '노이즈 제로',
  'features.desc1': '매일 아침 ArXiv, GitHub, TechCrunch 등 200개 이상의 소스를 수집합니다.',
  'features.desc2': '각 기사의 관련성을 평가하고, 중복을 제거하며, 저품질 콘텐츠를 걸러냅니다.',
  'features.desc3': '선택한 주제와 일치하는 콘텐츠만 전달합니다.',

  'footer.tagline': '매일 아침, 인텔리전스가 도착합니다.',
  'footer.rights': '© 2025 NeuralBrief',
  'footer.privacyPolicy': '개인정보처리방침',
  'footer.terms': '이용약관',
  'footer.contact': '문의하기',
  'footer.emailPlaceholder': 'email@address.com',
  'footer.ctaButton': '구독 완료. 내일 봬요.',

  'profile.title': '내 프로필',
  'profile.topics': '주제',
  'profile.preferences': '환경 설정',
  'profile.bookmarks': '북마크',
  'profile.save': '변경 사항 저장',
  'profile.saving': '저장 중…',
  'profile.saved': '저장됨',
  'profile.logout': '로그아웃',
  'profile.digestFrequency': '다이제스트 빈도',
  'profile.daily': '매일',
  'profile.weekly': '매주',

  'auth.signInWithGoogle': 'Google로 계속하기',
  'auth.signingIn': '로그인 중…',
  'auth.signOut': '로그아웃',
  'auth.popupBlocked': '팝업이 차단되었습니다. 팝업을 허용하고 다시 시도해 주세요.',
  'auth.authError': '인증에 실패했습니다. 다시 시도해 주세요.',
  'auth.loginRequired': '계속하려면 로그인하세요.',

  'bookmarks.title': '저장된 기사',
  'bookmarks.empty': '아직 북마크가 없습니다. 기사를 읽고 여기에 저장해 보세요.',
  'bookmarks.remove': '삭제',
  'bookmarks.loginRequired': '북마크를 보려면 로그인하세요.',

  'engine.title': '파이프라인',
  'engine.description': '네 개의 전문 에이전트가 매일 오전 07:00 UTC에 순서대로 실행됩니다.',
  'engine.step1': '스크레이퍼 에이전트 — 200개 이상의 소스에서 최신 기사를 수집합니다.',
  'engine.step2': '필터 에이전트 — 관련성을 평가하고 중복을 제거합니다.',
  'engine.step3': '요약 에이전트 — 각 기사를 두 문장으로 압축합니다.',
  'engine.step4': '이메일 에이전트 — 개인화된 다이제스트를 Gmail로 발송합니다.',

  'faq.title': '자주 묻는 질문',
  'faq.q1': '어떤 주제를 팔로우할 수 있나요?',
  'faq.a1': 'AI 연구, 제품 출시, 개발자 도구, 스타트업, 정책 등 다양한 조합을 팔로우할 수 있습니다.',
  'faq.q2': '다이제스트는 언제 전달되나요?',
  'faq.a2': '매일 오전 07:00 UTC에 발송되며, 주간 선택 시 월요일에 발송됩니다.',
  'faq.q3': '중복 기사는 어떻게 방지하나요?',
  'faq.a3': '필터 에이전트가 URL 및 의미적 유사도를 기준으로 요약 생성 전에 중복을 제거합니다.',
  'faq.q4': '내 Gmail 데이터는 안전한가요?',
  'faq.a4': '받은 편지함에 이메일만 발송하며, Gmail 메시지를 읽거나 저장하지 않습니다.',
  'faq.q5': '나중에 주제를 변경할 수 있나요?',
  'faq.a5': '언제든지 프로필을 열어 주제를 추가하거나 제거할 수 있습니다. 변경 사항은 다음 다이제스트부터 적용됩니다.',

  'cta.title': '더 스마트한 아침을 시작할 준비가 되셨나요?',
  'cta.subtitle': '이 기업의 엔지니어들이 신뢰합니다',
  'cta.button': '무료로 시작하기',

  // additional keys used in components
  'reading_time': '분 읽기',
  'preview_overline': '실시간 미리보기',
  'preview_title_1': '샘플',
  'preview_title_2': '다이제스트',
  'nav_domains': '주제',
  'nav_engine': '엔진',
  'nav_digest': '미리보기',
  'search_placeholder': '기사 검색...',
  'focus_overline': '핵심 분야',
  'focus_title_1': '선택된',
  'focus_title_2': '주제들',
  'focus_desc': '우리 에이전트들은 매일 이 핵심 분야에서 콘텐츠를 모니터링하고 필터링합니다.',
  'faq_overline': '자주 묻는 질문',
  'faq_title_1': '자주 묻는',
  'faq_title_2': '질문들',
  'engine_overline': '작동 방식',
  'engine_title_1': '핵심',
  'engine_title_2': '파이프라인',
  'engine_desc': '네 개의 자동 에이전트가 협력하여 아침 브리핑을 수집, 필터링, 요약 및 발송합니다.',
  'cta_title_1': '더 스마트한 아침을',
  'cta_title_2': '시작할 준비가 되셨나요?',
  'cta_desc': '오늘부터 일일 AI 및 기술 인텔리전스 피드를 시작하세요.',
};

// ─────────────────────────────────────────────────────────────────────────────

const DICTIONARIES: Record<Language, TranslationMap> = { en, es, fr, hi, zh, ko };

// ─────────────────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Provides language switching and translation lookup to the component tree.
 * Translations are bundled inline — no network fetch required.
 */
export function LanguageProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [language, setLanguage] = useState<Language>('en');

  /**
   * Returns the translated string for `key` in the active language.
   * Falls back to the key itself when a translation is missing so the UI
   * always renders something meaningful.
   */
  const t = (key: string): string => DICTIONARIES[language][key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook to consume LanguageContext. Must be used inside LanguageProvider. */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageProvider;