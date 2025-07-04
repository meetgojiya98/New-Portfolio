import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import emailjs from "emailjs-com";

const navItems = [
  { label: "Home", id: "hero" },
  { label: "About Me", id: "about" },
  { label: "Skills", id: "skills" },
  { label: "Projects", id: "projects" },
  { label: "Contact", id: "contact" },
];

const themeColors = {
  saffron: {
    primary: "#f59e0b",
    primaryDark: "#d97706",
    primaryLight: "#fbbf24",
    threeColor1: "#d97706",
    threeColor2: "#f59e0b",
    particlesColor: "#fbbf24",
  },
  blue: {
    primary: "#3b82f6",
    primaryDark: "#2563eb",
    primaryLight: "#60a5fa",
    threeColor1: "#2563eb",
    threeColor2: "#3b82f6",
    particlesColor: "#3b82f6",
  },
  violet: {
    primary: "#8b5cf6",
    primaryDark: "#7c3aed",
    primaryLight: "#a78bfa",
    threeColor1: "#7c3aed",
    threeColor2: "#8b5cf6",
    particlesColor: "#a78bfa",
  },
};

// 3D Cursor
function Cursor3D({ color }) {
  const meshRef = useRef();
  const { viewport, mouse } = useThree();
  const pos = useRef([0, 0]);

  useFrame(() => {
    pos.current[0] += (mouse.x * viewport.width * 0.5 - pos.current[0]) * 0.15;
    pos.current[1] += (mouse.y * viewport.height * 0.5 - pos.current[1]) * 0.15;
    if (meshRef.current) {
      meshRef.current.position.x = pos.current[0];
      meshRef.current.position.y = pos.current[1];
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.025;
      meshRef.current.scale.lerp([1.5, 1.5, 1.5], 0.07);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.95}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.7}
      />
    </mesh>
  );
}

// Interactive Particles
function InteractiveParticles({ color }) {
  const { viewport, mouse } = useThree();

  const PARTICLE_COUNT = 100;
  const PARTICLE_DISTANCE = 1.7;
  const positions = useRef([]);
  const velocities = useRef([]);

  if (positions.current.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.current.push([
        (Math.random() - 0.5) * viewport.width * 1.2,
        (Math.random() - 0.5) * viewport.height * 1.2,
        (Math.random() - 0.5) * 5,
      ]);
      velocities.current.push([
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
      ]);
    }
  }

  const pointsRef = useRef();
  const linesRef = useRef();

  useFrame(() => {
    const ptsPositions = pointsRef.current.geometry.attributes.position.array;
    const linesPositions = linesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let p = positions.current[i];
      let v = velocities.current[i];

      for (let axis = 0; axis < 3; axis++) {
        p[axis] += v[axis];
      }

      if (p[0] < -viewport.width / 2 - 1 || p[0] > viewport.width / 2 + 1) v[0] = -v[0];
      if (p[1] < -viewport.height / 2 - 1 || p[1] > viewport.height / 2 + 1) v[1] = -v[1];
      if (p[2] < -3 || p[2] > 3) v[2] = -v[2];

      const mx = mouse.x * viewport.width * 0.5;
      const my = mouse.y * viewport.height * 0.5;
      const dx = p[0] - mx;
      const dy = p[1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) {
        const force = (1.5 - dist) * 0.05;
        v[0] += (dx / dist) * force;
        v[1] += (dy / dist) * force;
      }

      v[0] = Math.min(Math.max(v[0], -0.04), 0.04);
      v[1] = Math.min(Math.max(v[1], -0.04), 0.04);
      v[2] = Math.min(Math.max(v[2], -0.04), 0.04);

      ptsPositions[i * 3] = p[0];
      ptsPositions[i * 3 + 1] = p[1];
      ptsPositions[i * 3 + 2] = p[2];
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    let lineIndex = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const p1 = positions.current[i];
        const p2 = positions.current[j];
        const dx = p1[0] - p2[0];
        const dy = p1[1] - p2[1];
        const dz = p1[2] - p2[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < PARTICLE_DISTANCE) {
          linesPositions[lineIndex++] = p1[0];
          linesPositions[lineIndex++] = p1[1];
          linesPositions[lineIndex++] = p1[2];
          linesPositions[lineIndex++] = p2[0];
          linesPositions[lineIndex++] = p2[1];
          linesPositions[lineIndex++] = p2[2];
        }
      }
    }
    linesRef.current.geometry.setDrawRange(0, lineIndex / 3);
    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={new Float32Array(PARTICLE_COUNT * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.12}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT * PARTICLE_COUNT * 2}
            array={new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3 * 2)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} />
      </lineSegments>
    </>
  );
}

function Floating3DCanvas({ theme }) {
  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        zIndex: 1,
        opacity: 0.8,
      }}
      camera={{ position: [0, 0, 12], fov: 65 }}
      gl={{ antialias: true, toneMappingExposure: 1.5 }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, 5]} intensity={0.5} />
      <Suspense fallback={null}>
        <InteractiveParticles color={colors.particlesColor} />
        <Cursor3D color={colors.primary} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.1} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

function ScrollIndicator({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: [0, 15, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-12 left-1/2 transform -translate-x-1/2 focus:outline-none"
      aria-label="Scroll down indicator"
      title="Scroll down"
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <svg
        className="w-8 h-8 text-gray-500 dark:text-gray-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </motion.button>
  );
}

function SectionReveal({ id, colors, title, children }) {
  const controls = useAnimation();
  const ref = useRef();

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (top < windowHeight - 100) {
        controls.start({ opacity: 1, y: 0, transition: { duration: 0.8 } });
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [controls]);

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      className="max-w-4xl mx-auto px-4 space-y-8 text-center relative z-10"
    >
      <motion.h2 className="text-4xl font-bold" style={{ color: colors.primary }}>
        {title}
      </motion.h2>
      <div className="text-lg max-w-3xl mx-auto leading-relaxed text-justify">{children}</div>
    </motion.section>
  );
}

const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";

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

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const formRef = useRef(null);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Dark mode toggle with smooth transition
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      html.style.transition = "background-color 0.3s ease, color 0.3s ease";
    } else {
      html.classList.remove("dark");
      html.style.transition = "background-color 0.3s ease, color 0.3s ease";
    }
  }, [darkMode]);

  // Scroll listener for scroll progress, shadow, and active section tracking
  useEffect(() => {
    const sections = navItems.map(({ id }) => document.getElementById(id));
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setScrolled(scrollTop > 30);

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

  // Google Analytics pageview tracking on section change
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: `/#${activeSection}`,
      });
    }
  }, [activeSection]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setMenuOpen(false);
  };

  const sendEmail = (e) => {
    e.preventDefault();
    setContactStatus(null);
    setSendingEmail(true);
    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formRef.current, EMAILJS_USER_ID)
      .then(() => {
        setContactStatus("SUCCESS");
        setSendingEmail(false);
        formRef.current.reset();
      })
      .catch(() => {
        setContactStatus("FAILED");
        setSendingEmail(false);
      });
  };

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

  const [currentProject, setCurrentProject] = useState(0);
  const projectTimeout = useRef();

  useEffect(() => {
    projectTimeout.current = setTimeout(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 6000);
    return () => clearTimeout(projectTimeout.current);
  }, [currentProject]);

  const cycleTheme = () => {
    const currentIndex = validThemes.indexOf(theme);
    setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
  };

  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <>
      <style>{`
        :root {
          --color-primary: ${colors.primary};
          --color-primary-dark: ${colors.primaryDark};
          --color-primary-light: ${colors.primaryLight};
        }
        .glass-card {
          background: rgba(255 255 255 / 0.15);
          backdrop-filter: saturate(180%) blur(10px);
          transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255 255 255 / 0.3);
          box-shadow: 0 0 20px var(--color-primary-light);
          transform: translateY(-5px);
          cursor: pointer;
        }
        /* Focus outlines for accessibility */
        button:focus,
        a:focus,
        input:focus,
        textarea:focus,
        li:focus {
          outline: 3px solid var(--color-primary);
          outline-offset: 2px;
        }
        /* Animate theme cycling button */
        .theme-cycle-btn:active {
          transform: scale(0.9);
          transition: transform 0.15s ease;
        }
      `}</style>

      <div
        className={`relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`}
        style={{ paddingBottom: "90px" }}
      >
        <Floating3DCanvas theme={theme} />

        <div
          className="fixed top-0 left-0 h-1 z-50 transition-all"
          style={{ width: `${scrollProgress}%`, backgroundColor: colors.primary }}
        />

        <nav
          className={`fixed top-0 w-full z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 transition-shadow ${
            scrolled ? "shadow-lg" : ""
          }`}
          role="navigation"
          aria-label="Primary Navigation"
        >
          <div className="container mx-auto flex justify-between items-center px-6 py-3">
            <div
              onClick={() => scrollTo("hero")}
              className="text-2xl font-bold cursor-pointer select-none"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") scrollTo("hero");
              }}
              role="link"
              aria-label="Go to Home"
            >
              Meet Gojiya
            </div>
            <ul className="hidden md:flex space-x-10 font-medium text-lg" role="menubar">
              {navItems.map(({ label, id }) => (
                <li
                  key={id}
                  onClick={() => scrollTo(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") scrollTo(id);
                  }}
                  tabIndex={0}
                  className={`cursor-pointer hover:text-[var(--color-primary)] transition ${
                    activeSection === id ? "text-[var(--color-primary)] font-semibold" : ""
                  }`}
                  aria-current={activeSection === id ? "page" : undefined}
                  role="menuitem"
                >
                  {label}
                </li>
              ))}
            </ul>
            <div className="flex items-center space-x-4">
              <button
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                style={{ backgroundColor: colors.primary }}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M12 3v1m0 16v1m8.66-11.66l-.707.707M5.05 18.95l-.707.707m15.192 2.121l-.707-.707M5.05 5.05l-.707-.707M21 12h-1M4 12H3" />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    stroke="none"
                    aria-hidden="true"
                  >
                    <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18z" />
                  </svg>
                )}
              </button>
              <button
                aria-label="Cycle Color Theme"
                onClick={cycleTheme}
                className="p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition theme-cycle-btn focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                title="Cycle Color Theme"
              >
                🎨
              </button>
            </div>
          </div>
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
              Full-stack Developer & AI Enthusiast — Building beautiful, scalable web
              experiences.
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("projects")}
              className="px-8 py-3 text-white rounded-lg shadow-lg transition z-10 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              See My Work
            </motion.button>
            <ScrollIndicator onClick={() => scrollTo("about")} />
          </section>

          {/* About Me */}
          <SectionReveal id="about" colors={colors} title="About Me">
            <p>
              Meet Gojiya is a Solution Analyst on the Product Engineering and Development team,
              within the Engineering, AI, and Data offering at Deloitte Canada. Meet has the
              ability to link business with technology to extract insights from complex data and
              build data-driven solutions.
            </p>
            <br />
            <p>
              Meet is a graduate of the University of New Brunswick, where he earned a Master of
              Computer Science degree. He also holds a Bachelor’s degree in Computer Engineering
              from Gujarat Technological University. Meet is driven by technology innovation,
              advanced analytics, adaptability, collaboration, and creativity, ultimately
              furthering his career as well as those around him. He possesses a strong
              entrepreneurial spirit, which fuels his passion for creating impactful solutions
              and driving positive change within the industry and the world.
            </p>
            <br />
            <p>
              An avid learner and active listener, Meet thrives on absorbing knowledge from as
              many people as possible, recognizing that every interaction is an opportunity to
              gain new insights and perspectives. His extremely curious personality propels him
              to explore new ideas, question existing paradigms, and continuously seek out
              opportunities for learning and growth.
            </p>
          </SectionReveal>

          {/* Skills */}
          <SectionReveal id="skills" colors={colors} title="Skills">
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
          <SectionReveal id="projects" colors={colors} title="Projects">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={projects[currentProject].title}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8 }}
                className="glass-card block mx-auto max-w-3xl p-8 rounded-xl shadow-lg cursor-pointer select-none"
              >
                <h3 className="text-2xl font-semibold mb-4" style={{ color: colors.primary }}>
                  {projects[currentProject].title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                  {projects[currentProject].description}
                </p>

                <div className="flex justify-center gap-6">
                  <a
                    href={projects[currentProject].live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                    style={{ color: colors.primary }}
                    title="View Live Demo"
                  >
                    Live Demo
                  </a>
                  <a
                    href={projects[currentProject].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                    style={{ color: colors.primary }}
                    title="View GitHub Repository"
                  >
                    GitHub
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
                  } transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2`}
                  onClick={() => setCurrentProject(idx)}
                  style={{ backgroundColor: idx === currentProject ? colors.primary : undefined }}
                />
              ))}
            </div>
          </SectionReveal>

          {/* Contact */}
          <SectionReveal id="contact" colors={colors} title="Contact Me">
            <form
              ref={formRef}
              onSubmit={sendEmail}
              className="space-y-6 text-left"
              aria-label="Contact form"
            >
              <input
                type="text"
                name="user_name"
                placeholder="Your Name"
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                style={{ borderColor: colors.primary }}
              />
              <input
                type="email"
                name="user_email"
                placeholder="Your Email"
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition"
                style={{ borderColor: colors.primary }}
              />
              <textarea
                name="message"
                placeholder="Your Message"
                rows={6}
                required
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition resize-none"
                style={{ borderColor: colors.primary }}
              />
              <button
                type="submit"
                className="w-full py-3 text-white rounded-lg transition flex justify-center items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50"
                style={{ backgroundColor: colors.primary }}
                disabled={sendingEmail}
                title={sendingEmail ? "Sending message..." : "Send Message"}
              >
                {sendingEmail && (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                )}
                <span>{sendingEmail ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
            {contactStatus === "SUCCESS" && (
              <p className="mt-4 text-green-500 font-semibold" role="alert">
                Message sent successfully!
              </p>
            )}
            {contactStatus === "FAILED" && (
              <p className="mt-4 text-red-500 font-semibold" role="alert">
                Oops! Something went wrong. Please try again.
              </p>
            )}
          </SectionReveal>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-between items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-300 select-none z-40">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="flex space-x-6">
            <a
              href="https://github.com/meetgojiya98"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-current transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              style={{ color: colors.primary }}
              title="GitHub Profile"
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.373 0 12a12 12 0 008.207 11.385c.6.11.82-.26.82-.577v-2.022c-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.083-.729.083-.729 1.205.086 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.333-5.466-5.933 0-1.312.467-2.38 1.235-3.22-.123-.303-.535-1.522.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 016.003 0c2.29-1.553 3.296-1.23 3.296-1.23.654 1.654.243 2.873.12 3.176.77.84 1.232 1.91 1.232 3.22 0 4.61-2.807 5.63-5.48 5.922.43.37.815 1.102.815 2.222v3.293c0 .32.22.694.825.576A12 12 0 0024 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/meet-gojiya/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-current transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              style={{ color: colors.primary }}
              title="LinkedIn Profile"
            >
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.354V9h3.415v1.561h.047c.476-.9 1.637-1.848 3.372-1.848 3.604 0 4.27 2.372 4.27 5.455v6.284zM5.337 7.433c-1.145 0-2.073-.928-2.073-2.073 0-1.146.928-2.073 2.073-2.073s2.073.927 2.073 2.073c0 1.145-.928 2.073-2.073 2.073zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.224.792 24 1.771 24h20.451c.98 0 1.778-.776 1.778-1.729V1.729C24 .774 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </footer>

        <a
          href="https://drive.google.com/file/d/1d8C33RiAOEV_1q_QDPrWC0uk-i8J4kqO/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-6 z-50 text-white px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50"
          title="Download Resume"
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
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8"
            />
          </svg>
          <span>Resume</span>
        </a>
      </div>
    </>
  );
}
