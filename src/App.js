import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import emailjs from "emailjs-com";

// Nav Items and theme colors (same as your current)
const navItems = [
  { label: "Home", id: "hero", key: "home" },
  { label: "About Me", id: "about", key: "about" },
  { label: "Skills", id: "skills", key: "skills" },
  { label: "Projects", id: "projects", key: "projects" },
  { label: "Contact", id: "contact", key: "contact" },
];

const themeColors = {
  saffron: {
    primary: "#f59e0b",
    primaryDark: "#d97706",
    primaryLight: "#fbbf24",
    particlesColor: "#fbbf24",
  },
  blue: {
    primary: "#3b82f6",
    primaryDark: "#2563eb",
    primaryLight: "#60a5fa",
    particlesColor: "#3b82f6",
  },
  violet: {
    primary: "#8b5cf6",
    primaryDark: "#7c3aed",
    primaryLight: "#a78bfa",
    particlesColor: "#a78bfa",
  },
};

// 3D Cursor, InteractiveParticles, Floating3DCanvas omitted here (use your code)

const translations = {
  en: {
    home: "Home",
    about: "About Me",
    skills: "Skills",
    projects: "Projects",
    contact: "Contact",
    seeMyWork: "See My Work",
    fullStackDescription: "Full-stack Developer & AI Enthusiast — Building beautiful, scalable web experiences.",
    aboutText1:
      "Meet Gojiya is a Solution Analyst on the Product Engineering and Development team, within the Engineering, AI, and Data offering at Deloitte Canada. Meet has the ability to link business with technology to extract insights from complex data and build data-driven solutions.",
    aboutText2:
      "Meet is a graduate of the University of New Brunswick, where he earned a Master of Computer Science degree. He also holds a Bachelor’s degree in Computer Engineering from Gujarat Technological University. Meet is driven by technology innovation, advanced analytics, adaptability, collaboration, and creativity, ultimately furthering his career as well as those around him. He possesses a strong entrepreneurial spirit, which fuels his passion for creating impactful solutions and driving positive change within the industry and the world.",
    aboutText3:
      "An avid learner and active listener, Meet thrives on absorbing knowledge from as many people as possible, recognizing that every interaction is an opportunity to gain new insights and perspectives. His extremely curious personality propels him to explore new ideas, question existing paradigms, and continuously seek out opportunities for learning and growth.",
    sendMessage: "Send Message",
    messageSentSuccess: "Message sent successfully!",
    messageSentFail: "Oops! Something went wrong. Please try again.",
    backToTop: "Back to Top",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourMessage: "Your Message",
    liveDemo: "Live Demo",
    github: "GitHub",
    downloadResume: "Download Resume",
  },
  fr: {
    home: "Accueil",
    about: "À Propos",
    skills: "Compétences",
    projects: "Projets",
    contact: "Contact",
    seeMyWork: "Voir Mon Travail",
    fullStackDescription:
      "Développeur Full-stack & passionné d'IA — Création d'expériences web belles et évolutives.",
    aboutText1:
      "Meet Gojiya est un analyste de solutions dans l'équipe de développement et d'ingénierie produit chez Deloitte Canada. Il relie la technologie aux affaires pour extraire des insights à partir de données complexes et construire des solutions basées sur les données.",
    aboutText2:
      "Meet est diplômé de l'Université du Nouveau-Brunswick avec un master en informatique. Il possède également une licence en génie informatique de l'Université technologique du Gujarat. Il est motivé par l'innovation technologique, l'analyse avancée, l'adaptabilité, la collaboration et la créativité, faisant progresser sa carrière et celle de ses pairs.",
    aboutText3:
      "Apprenant passionné et bon auditeur, Meet absorbe les connaissances de nombreuses personnes, voyant chaque interaction comme une opportunité d'apprendre. Sa curiosité l'amène à explorer de nouvelles idées, remettre en question les paradigmes et chercher continuellement à grandir.",
    sendMessage: "Envoyer le message",
    messageSentSuccess: "Message envoyé avec succès !",
    messageSentFail: "Oups ! Quelque chose a mal tourné. Veuillez réessayer.",
    backToTop: "Retour en haut",
    yourName: "Votre nom",
    yourEmail: "Votre email",
    yourMessage: "Votre message",
    liveDemo: "Démo en direct",
    github: "GitHub",
    downloadResume: "Télécharger le CV",
  },
  hi: {
    home: "होम",
    about: "मेरे बारे में",
    skills: "कौशल",
    projects: "परियोजनाएं",
    contact: "संपर्क करें",
    seeMyWork: "मेरा काम देखें",
    fullStackDescription:
      "फुल-स्टैक डेवलपर और एआई उत्साही — सुंदर, स्केलेबल वेब अनुभव बनाना।",
    aboutText1:
      "मीट गोजिया डेलॉइट कनाडा में इंजीनियरिंग, एआई और डेटा टीम के उत्पाद विकास विभाग में सॉल्यूशन एनालिस्ट हैं। वे व्यवसाय और प्रौद्योगिकी को जोड़कर जटिल डेटा से अंतर्दृष्टि निकालने और डेटा-संचालित समाधान बनाने में सक्षम हैं।",
    aboutText2:
      "मीट ने यूनिवर्सिटी ऑफ न्यू ब्रंसविक से मास्टर ऑफ कंप्यूटर साइंस की डिग्री प्राप्त की है। वे गुजरात टेक्नोलॉजिकल यूनिवर्सिटी से कंप्यूटर इंजीनियरिंग में स्नातक हैं। वे तकनीकी नवाचार, उन्नत विश्लेषण, अनुकूलन, सहयोग और रचनात्मकता से प्रेरित हैं।",
    aboutText3:
      "एक उत्साही शिक्षार्थी और सक्रिय श्रोता, मीट ज्ञान अर्जित करने के लिए हर बातचीत को एक अवसर मानते हैं। उनकी जिज्ञासु प्रकृति उन्हें नए विचारों की खोज करने, मौजूदा मान्यताओं को चुनौती देने और लगातार सीखने के अवसर तलाशने के लिए प्रेरित करती है।",
    sendMessage: "संदेश भेजें",
    messageSentSuccess: "संदेश सफलतापूर्वक भेजा गया!",
    messageSentFail: "ओह! कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    backToTop: "शीर्ष पर जाएं",
    yourName: "आपका नाम",
    yourEmail: "आपका ईमेल",
    yourMessage: "आपका संदेश",
    liveDemo: "लाइव डेमो",
    github: "GitHub",
    downloadResume: "रिज्यूमे डाउनलोड करें",
  },
  // Add other languages here similarly (gu, kn, te, pa, es, zh, ar, ru, de, ja, etc.)
};

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "hi", name: "Hindi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "te", name: "Telugu" },
  { code: "pa", name: "Punjabi" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "pt", name: "Portuguese" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "ta", name: "Tamil" },
  { code: "ur", name: "Urdu" },
  // Add more as desired
];

function t(key, lang = "en") {
  return (translations[lang] && translations[lang][key]) || translations["en"][key] || key;
}

export default function App() {
  const validThemes = ["saffron", "blue", "violet"];

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return validThemes.includes(saved) ? saved : "blue";
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === null ? true : saved === "true";
  });

  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const formRef = useRef(null);

  // Data arrays for projects and skills, similar to your existing ones
  const projects = [
    {
      title: "Stock Market Copilot",
      description:
        "End-to-end React and FastAPI app that delivers stock data, news, and AI insights for smarter investment decisions.",
      link: "https://github.com/meetgojiya98/Stock-Market-Copilot",
      live: "https://stock-market-copilot.vercel.app/",
    },
    {
      title: "Stock Sentiment Dashboard",
      description:
        "The app provides a real-time dashboard displaying stock market sentiment, trending stocks, latest news, and Reddit posts to help users track market mood and insights.",
      link: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard",
      live: "https://meetgojiya98.github.io/stock-sentiment-frontend/",
    },
    {
      title: "StockVision",
      description:
        "StockVision is a responsive web app that predicts future stock prices using real market data. It features interactive charts, multiple ticker support, dark mode, and lets users save favorite stocks for easy access.",
      link: "https://github.com/meetgojiya98/StockVision",
      live: "https://stock-vision-five.vercel.app/",
    },
  ];

  const skills = [
    "JavaScript (ES6+)",
    "React.js & Next.js",
    "Node.js & Express",
    "MongoDB & SQL",
    "Python & FastAPI",
    "HTML5 & CSS3",
    "Git & CI/CD",
    "Pandas & NumPy",
    "REST APIs",
    "Postman & Jira",
    "TypeScript",
    "Java",
    "AWS",
    "OpenAI & AI Integration",
    "Selenium",
  ];

  // Effects for localStorage, scroll, etc.
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    const sections = navItems.map(({ id }) => document.getElementById(id));
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setScrolled(scrollTop > 30);
      setShowBackToTop(scrollTop > 300);

      let current = "hero";
      sections.forEach((section) => {
        if (section) {
          const offsetTop = section.offsetTop - 120;
          if (scrollTop >= offsetTop) current = section.id;
        }
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sendEmail = (e) => {
    e.preventDefault();
    setContactStatus(null);
    emailjs
      .sendForm("service_i6dqi68", "template_mrty8sn", formRef.current, "bqXMM_OmpPWcc1AMi")
      .then(() => {
        setContactStatus("SUCCESS");
        formRef.current.reset();
      })
      .catch(() => setContactStatus("FAILED"));
  };

  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <>
      <style>{`
        :root {
          --color-primary: ${colors.primary};
          --color-primary-dark: ${colors.primaryDark};
          --color-primary-light: ${colors.primaryLight};
          transition: background-color 0.5s ease, color 0.5s ease;
        }
        .glass-card {
          background: rgba(255 255 255 / 0.15);
          backdrop-filter: saturate(180%) blur(10px);
          transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255 255 255 / 0.3);
          box-shadow: 0 0 20px var(--color-primary-light);
          transform: translateY(-5px) scale(1.03);
          cursor: pointer;
        }
        nav ul li:hover {
          color: var(--color-primary);
          text-decoration: underline;
          transform: scale(1.05);
          transition: all 0.3s ease;
        }
        a:hover {
          color: var(--color-primary);
          text-decoration: underline;
          transform: scale(1.05);
          transition: all 0.3s ease;
        }
        button:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .back-to-top {
          position: fixed;
          bottom: 80px;
          right: 20px;
          z-index: 100;
          background-color: var(--color-primary);
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 9999px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
          opacity: 0.8;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .back-to-top:hover {
          opacity: 1;
          transform: scale(1.1);
        }
        .lang-select {
          background: transparent;
          border: none;
          color: inherit;
          font-weight: 600;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: background-color 0.3s ease;
        }
        .lang-select:hover {
          background-color: var(--color-primary-light);
          color: var(--color-primary-dark);
        }
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: space-around;
          width: 25px;
          height: 25px;
          background: transparent;
          border: none;
          cursor: pointer;
          z-index: 60;
          padding: 0;
        }
        .hamburger div {
          width: 25px;
          height: 3px;
          background: var(--color-primary);
          border-radius: 2px;
          transition: all 0.3s linear;
          position: relative;
          transform-origin: 1px;
        }
        .hamburger.open div:nth-child(1) {
          transform: rotate(45deg);
        }
        .hamburger.open div:nth-child(2) {
          opacity: 0;
          transform: translateX(20px);
        }
        .hamburger.open div:nth-child(3) {
          transform: rotate(-45deg);
        }
        .mobile-menu {
          display: none;
        }
        @media (max-width: 767px) {
          .hamburger {
            display: flex;
          }
          nav ul {
            display: none !important;
          }
          .mobile-menu {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 60px;
            right: 0;
            width: 70vw;
            max-width: 300px;
            height: calc(100vh - 60px);
            background-color: rgba(255 255 255 / 0.95);
            backdrop-filter: blur(10px);
            box-shadow: -4px 0 12px rgba(0,0,0,0.1);
            padding: 2rem 1.5rem;
            z-index: 55;
            flex-wrap: nowrap;
            gap: 1.5rem;
            transform-origin: right center;
          }
          .dark .mobile-menu {
            background-color: rgba(31 41 55 / 0.95);
          }
          .mobile-menu a, .mobile-menu button, .mobile-menu select {
            font-size: 1.2rem;
          }
        }
      `}</style>

      <div
        className={`relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`}
        style={{ paddingBottom: "90px" }}
      >
        {/* 3D Canvas (use your existing Floating3DCanvas code) */}
        <Floating3DCanvas theme={theme} />

        {/* Scroll Progress Bar */}
        <div
          className="fixed top-0 left-0 h-1 z-50 transition-all"
          style={{ width: `${scrollProgress}%`, backgroundColor: colors.primary }}
        />

        {/* Navbar */}
        <nav
          className={`fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 transition-shadow ${
            scrolled ? "shadow-lg" : ""
          }`}
        >
          <div className="container mx-auto flex justify-between items-center px-6 py-3">
            <div
              onClick={() => scrollTo("hero")}
              className="text-2xl font-bold cursor-pointer select-none"
            >
              Meet Gojiya
            </div>

            {/* Desktop Nav */}
            <ul className="hidden md:flex space-x-10 font-medium text-lg">
              {navItems.map(({ label, id, key }) => (
                <li
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`cursor-pointer transition ${
                    activeSection === id
                      ? "text-[var(--color-primary)] font-semibold"
                      : "hover:text-[var(--color-primary)] hover:underline"
                  }`}
                >
                  {t(key, lang)}
                </li>
              ))}
            </ul>

            {/* Desktop Language Selector */}
            <select
              aria-label="Select Language"
              className="lang-select hidden md:block"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              {languages.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {/* Hamburger Menu */}
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div />
              <div />
              <div />
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mobile-menu"
              role="menu"
              aria-label="Mobile navigation"
            >
              {navItems.map(({ label, id, key }) => (
                <a
                  key={id}
                  href="#!"
                  role="menuitem"
                  tabIndex={0}
                  className={`block px-4 py-2 rounded ${
                    activeSection === id
                      ? "text-[var(--color-primary)] font-semibold"
                      : "hover:text-[var(--color-primary)] hover:underline"
                  }`}
                  onClick={() => scrollTo(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") scrollTo(id);
                  }}
                >
                  {t(key, lang)}
                </a>
              ))}

              <select
                aria-label="Select Language"
                className="lang-select mt-4 w-full"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {languages.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </nav>

        <main className="container mx-auto px-6 pt-24 space-y-48 max-w-6xl scroll-smooth">
          {/* Hero */}
          <section
            id="hero"
            className="min-h-screen flex flex-col justify-center items-center text-center space-y-8 relative z-10"
          >
            <motion.h1
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="text-6xl font-extrabold tracking-tight"
              style={{ color: colors.primary }}
            >
              Meet Gojiya
            </motion.h1>
            <motion.p
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="max-w-xl text-lg md:text-xl"
            >
              {t("fullStackDescription", lang)}
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("projects")}
              className="px-8 py-3 text-white rounded-lg shadow-lg transition z-10"
              style={{ backgroundColor: colors.primary }}
            >
              {t("seeMyWork", lang)}
            </motion.button>
            <ScrollIndicator onClick={() => scrollTo("about")} />
          </section>

          {/* About Me */}
          <SectionReveal id="about" colors={colors} title={t("about", lang)}>
            <p>{t("aboutText1", lang)}</p>
            <br />
            <p>{t("aboutText2", lang)}</p>
            <br />
            <p>{t("aboutText3", lang)}</p>
          </SectionReveal>

          {/* Skills */}
          <SectionReveal id="skills" colors={colors} title={t("skills", lang)}>
            <div className="flex flex-wrap justify-center gap-4">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="glass-card px-5 py-2 rounded-full text-white font-semibold shadow-lg cursor-default select-none transition"
                  style={{ backgroundColor: colors.primary }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </SectionReveal>

          {/* Projects */}
          <SectionReveal id="projects" colors={colors} title={t("projects", lang)}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={projects[currentProject]?.title}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8 }}
                className="glass-card block mx-auto max-w-3xl p-8 rounded-xl shadow-lg cursor-pointer select-none"
              >
                <h3 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
                  {projects[currentProject]?.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                  {projects[currentProject]?.description}
                </p>

                <div className="flex justify-center gap-6">
                  <a
                    href={projects[currentProject]?.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold"
                    style={{ color: colors.primary }}
                  >
                    {t("liveDemo", lang)}
                  </a>
                  <a
                    href={projects[currentProject]?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold"
                    style={{ color: colors.primary }}
                  >
                    {t("github", lang)}
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-4 mt-4">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to project ${idx + 1}`}
                  className={`w-4 h-4 rounded-full ${
                    idx === currentProject ? `bg-[var(--color-primary)]` : "bg-gray-400"
                  } transition`}
                  onClick={() => setCurrentProject(idx)}
                  style={{ backgroundColor: idx === currentProject ? colors.primary : undefined }}
                />
              ))}
            </div>
          </SectionReveal>

          {/* Contact */}
          <SectionReveal id="contact" colors={colors} title={t("contact", lang)}>
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6 text-left">
              <input
                type="text"
                name="user_name"
                placeholder={t("yourName", lang)}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                style={{ borderColor: colors.primary }}
              />
              <input
                type="email"
                name="user_email"
                placeholder={t("yourEmail", lang)}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                style={{ borderColor: colors.primary }}
              />
              <textarea
                name="message"
                placeholder={t("yourMessage", lang)}
                rows={6}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition resize-none"
                style={{ borderColor: colors.primary }}
              />
              <button
                type="submit"
                className="w-full py-3 text-white rounded-lg transition"
                style={{ backgroundColor: colors.primary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
              >
                {t("sendMessage", lang)}
              </button>
            </form>
            {contactStatus === "SUCCESS" && (
              <p className="mt-4 text-green-500 font-semibold">{t("messageSentSuccess", lang)}</p>
            )}
            {contactStatus === "FAILED" && (
              <p className="mt-4 text-red-500 font-semibold">{t("messageSentFail", lang)}</p>
            )}
          </SectionReveal>
        </main>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="back-to-top"
            aria-label={t("backToTop", lang)}
            title={t("backToTop", lang)}
          >
            ↑ {t("backToTop", lang)}
          </button>
        )}

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-between items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-300 select-none z-40">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="flex space-x-6">
            <a
              href="https://github.com/meetgojiya98"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-current transition"
              style={{ color: colors.primary }}
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.373 0 12a12 12 0 008.207 11.385c.6.11.82-.26.82-.577v-2.022c-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.083-.729.083-.729 1.205.086 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.333-5.466-5.933 0-1.312.467-2.38 1.235-3.22-.123-.303-.535-1.522.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 016.003 0c2.29-1.553 3.296-1.23 3.296-1.23.654 1.654.243 2.873.12 3.176.77.84 1.232 1.91 1.232 3.22 0 4.61-2.807 5.63-5.48 5.922.43.37.815 1.102.815 2.222v3.293c0 .32.22.694.825.576A12 12 0 0024 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/meet-gojiya/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-current transition"
              style={{ color: colors.primary }}
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.354V9h3.415v1.561h.047c.476-.9 1.637-1.848 3.372-1.848 3.604 0 4.27 2.372 4.27 5.455v6.284zM5.337 7.433c-1.145 0-2.073-.928-2.073-2.073 0-1.146.928-2.073 2.073-2.073s2.073.927 2.073 2.073c0 1.145-.928 2.073-2.073 2.073zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.224.792 24 1.771 24h20.451c.98 0 1.778-.776 1.778-1.729V1.729C24 .774 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </footer>

        {/* Resume Download Button */}
        <a
          href="https://drive.google.com/file/d/1d8C33RiAOEV_1q_QDPrWC0uk-i8J4kqO/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-6 z-50 text-white px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none"
          title={t("downloadResume", lang)}
          download
          style={{ backgroundColor: colors.primary }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8"
            />
          </svg>
          <span>{t("downloadResume", lang)}</span>
        </a>
      </div>
    </>
  );
}
