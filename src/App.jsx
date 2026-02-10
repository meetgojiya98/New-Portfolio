import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import "./App.css";

const navItems = [
  { label: "About", id: "about" },
  { label: "Expertise", id: "skills" },
  { label: "Work", id: "work" },
  { label: "Contact", id: "contact" },
];

const highlights = [
  { value: "6+", label: "Years in product delivery" },
  { value: "15+", label: "Shipped products and platforms" },
  { value: "Toronto", label: "Based in Canada" },
];

const skillsByGroup = [
  {
    title: "Product Frontend",
    skills: ["React", "Next.js", "TypeScript", "Motion UI", "Accessibility"],
  },
  {
    title: "API and Platform",
    skills: ["Node.js", "FastAPI", "PostgreSQL", "MongoDB", "API Design"],
  },
  {
    title: "Applied AI",
    skills: ["RAG", "Agent Workflows", "Prompt Systems", "LLM Evaluation"],
  },
  {
    title: "Execution",
    skills: ["CI/CD", "AWS", "Observability", "Testing", "Performance Tuning"],
  },
];

const projects = [
  {
    title: "Reframe",
    description:
      "AI powered privacy-first CBT-inspired self-coaching web app.",
    stack: ["Next.js", "LLM Workflows", "Product UX"],
    repo: "https://github.com/meetgojiya98/Reframe",
    live: "https://reframe-tawny.vercel.app/",
  },
  {
    title: "Climb",
    description:
      "Career acceleration platform that generates role-specific resumes and cover letters, tracks applications, and surfaces salary signals.",
    stack: ["AI Workflows", "Resume AI", "Analytics"],
    repo: "https://github.com/meetgojiya98/Climb",
    live: "https://climb-wheat.vercel.app/",
  },
  {
    title: "Stock Market Copilot",
    description:
      "Research cockpit for investors with live data, sentiment signals, and explainable AI summaries delivered through a fast, responsive interface.",
    stack: ["React", "FastAPI", "AI Insights"],
    repo: "https://github.com/meetgojiya98/Stock-Market-Copilot",
    live: "https://stock-market-copilot.vercel.app/",
  },
  {
    title: "Stock Sentiment Dashboard",
    description:
      "Real-time dashboard aggregating market sentiment, trending tickers, latest news, and Reddit signals to track market mood.",
    stack: ["React", "Sentiment NLP", "Data Viz"],
    repo: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard",
    live: "https://meetgojiya98.github.io/Stock-Sentiment-Dashboard/",
  },
  {
    title: "StockVision",
    description:
      "Responsive forecasting app that predicts stock movements with historical market data, interactive charts, and watchlist support.",
    stack: ["React", "Forecasting", "Charts"],
    repo: "https://github.com/meetgojiya98/StockVision",
    live: "https://stock-vision-five.vercel.app/",
  },
  {
    title: "MapleLoom",
    description:
      "Private, offline-first RAG workspace powered by Ollama, Qdrant, and Meilisearch for source-grounded answers and low-latency retrieval.",
    stack: ["Ollama", "Qdrant", "Search Infra"],
    repo: "https://github.com/meetgojiya98/MapleLoom",
  },
  {
    title: "PDF Redactor",
    description:
      "Privacy-first PII redaction tool for PDFs and scanned images with OCR, masking controls, and downloadable audit trails.",
    stack: ["React", "OCR", "Document Security"],
    repo: "https://github.com/meetgojiya98/PDF-Redactor",
    live: "https://pdf-redactor-bay.vercel.app/",
  },
  {
    title: "PDF Vault",
    description:
      "Browser-only toolkit to merge, split, sign, redact, and compress PDFs with zero uploads and complete client-side processing.",
    stack: ["React", "Web APIs", "Privacy-first"],
    repo: "https://github.com/meetgojiya98/PDF-Vault",
    live: "https://pdf-vault-lemon.vercel.app/",
  },
  {
    title: "PDF Copilot",
    description:
      "Local-first PDF assistant that answers questions with cited passages using hybrid retrieval, OCR fallback, and streaming responses.",
    stack: ["RAG", "SQLite", "Ollama"],
    repo: "https://github.com/meetgojiya98/PDF-Copilot",
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top, behavior: "smooth" });
}

function DynamicBackdrop() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, idx) => ({
        id: idx,
        left: 6 + Math.random() * 88,
        top: 4 + Math.random() * 90,
        size: 6 + Math.random() * 18,
        driftX: -30 + Math.random() * 60,
        driftY: -40 + Math.random() * 80,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 4,
        opacity: 0.16 + Math.random() * 0.3,
      })),
    []
  );

  return (
    <div className="dynamic-backdrop" aria-hidden="true">
      <div className="mesh-layer mesh-layer--one" />
      <div className="mesh-layer mesh-layer--two" />
      <div className="scan-lines" />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="float-particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
          }}
          animate={{
            x: [0, particle.driftX, particle.driftX * -0.45, 0],
            y: [0, particle.driftY, particle.driftY * -0.5, 0],
            scale: [1, 1.16, 0.9, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("portfolio-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleNavClick = (id) => {
    scrollToSection(id);
    setMenuOpen(false);
  };

  return (
    <div className="portfolio-shell">
      <DynamicBackdrop />
      <div className="backdrop-orb backdrop-orb--a" aria-hidden="true" />
      <div className="backdrop-orb backdrop-orb--b" aria-hidden="true" />
      <div className="backdrop-orb backdrop-orb--c" aria-hidden="true" />

      <header className="site-header">
        <button className="brand-mark" onClick={() => scrollToSection("hero")}>
          MG
        </button>
        <nav className={`header-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-cta">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((prevMenuState) => !prevMenuState)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <a
            className="resume-link"
            href="https://drive.google.com/file/d/15gTSqEa7rEuCcxXnsYserv56c3scs9tP/view?usp=sharing"
            target="_blank"
            rel="noreferrer"
          >
            Resume
          </a>
        </div>
      </header>

      <main className="site-main">
        <section id="hero" className="hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">FULL-STACK PRODUCT ENGINEERING + APPLIED AI</p>
            <h1>I build AI-native digital products that feel premium, fast, and trustworthy.</h1>
            <p className="hero-description">
              I am Meet Gojiya, a software engineer who combines product thinking, clean
              architecture, and sharp interface design to ship software people actually enjoy
              using.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => scrollToSection("work")}>
                Explore Projects
              </button>
              <a
                className="btn btn-secondary"
                href="https://www.linkedin.com/in/meet-gojiya/"
                target="_blank"
                rel="noreferrer"
              >
                Connect on LinkedIn
              </a>
            </div>
          </motion.div>

          <motion.aside
            className="hero-panel"
            initial={{ opacity: 0, y: 52 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="profile-image-wrap">
              <img src="/profile.png" alt="Meet Gojiya" />
            </div>
            <p className="status-pill">Open to impactful product collaborations</p>
            <ul className="highlight-list">
              {highlights.map((item) => (
                <li key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </motion.aside>
        </section>

        <motion.section
          id="about"
          className="content-section"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <div className="section-label">About</div>
          <h2>Engineering depth paired with product-level taste.</h2>
          <p>
            I work at the intersection of software engineering and applied AI, translating complex
            requirements into reliable, user-centered products. My experience spans enterprise
            consulting, startup speed, and platform modernization.
          </p>
          <p>
            From early prototypes to hardened production systems, I focus on architecture clarity,
            measurable performance, and polished interaction design. Strong products are built in
            layers, and details at each layer matter.
          </p>
        </motion.section>

        <motion.section
          id="skills"
          className="content-section"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="section-label">Skills</div>
          <h2>A capability stack designed for modern product teams.</h2>
          <motion.div
            className="skill-grid"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {skillsByGroup.map((group) => (
              <motion.article key={group.title} className="skill-card" variants={sectionReveal}>
                <h3>{group.title}</h3>
                <div className="chip-wrap">
                  {group.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          id="work"
          className="content-section"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="section-label">All Work</div>
          <h2>A complete view of products I have built and shipped.</h2>
          <motion.div
            className="project-grid"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {projects.map((project) => (
              <motion.article key={project.title} className="project-card" variants={sectionReveal}>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="chip-wrap chip-wrap--dense">
                  {project.stack.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="project-links">
                  <a href={project.repo} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                  {project.live ? (
                    <a href={project.live} target="_blank" rel="noreferrer">
                      Live Demo
                    </a>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          id="contact"
          className="content-section content-section--cta"
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="section-label">Contact</div>
          <h2>Have an ambitious product in mind? Let’s talk.</h2>
          <p>
            I am open to high-impact roles and collaborations across full-stack engineering,
            AI-enabled product development, and modernization initiatives.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="mailto:meetgojiya98@gmail.com">
              Email Me
            </a>
            <a
              className="btn btn-secondary"
              href="https://github.com/meetgojiya98"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Profile
            </a>
          </div>
        </motion.section>
      </main>

      <footer className="site-footer">
        <span>© {year} Meet Gojiya</span>
        <span>Designed and engineered for clarity, speed, and impact.</span>
      </footer>
    </div>
  );
}
