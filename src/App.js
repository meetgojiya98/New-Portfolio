import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Tilt from "react-parallax-tilt";
import emailjs from "emailjs-com";

// NAV ITEMS
const navItems = [
  { label: "Home", id: "hero" },
  { label: "About Me", id: "about" },
  { label: "Skills", id: "skills" },
  { label: "Projects", id: "projects" },
  { label: "Contact", id: "contact" },
];

// THEMES
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

// 3D Cursor: disabled on mobile
function Cursor3D({ color }) {
  const meshRef = useRef();
  const { viewport, mouse } = useThree();
  const pos = useRef([0, 0]);

  // Hide on small screens
  if (typeof window !== "undefined" && window.innerWidth < 768) return null;

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
    <mesh ref={meshRef} aria-hidden="true">
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

// Interactive Particles with reduced count on mobile
function InteractiveParticles({ color }) {
  const { viewport, mouse } = useThree();

  // Adjust particle count based on screen width
  const PARTICLE_COUNT = typeof window !== "undefined" && window.innerWidth < 768 ? 50 : 100;
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
      <points ref={pointsRef} aria-hidden="true">
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
      <lineSegments ref={linesRef} aria-hidden="true">
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

// Scroll Indicator
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

// Section Reveal with staggered children for better UX
function SectionReveal({ id, colors, title, children }) {
  const controls = useAnimation();
  const ref = useRef();

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (top < windowHeight - 100) {
        controls.start("visible");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [controls]);

  // Children wrapped with stagger
  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.15, duration: 0.8 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="max-w-4xl mx-auto px-4 text-center relative z-10"
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <motion.h2
        id={`${id}-title`}
        className="text-4xl font-bold sticky top-20 bg-white dark:bg-gray-900 py-2 z-30"
        style={{ color: colors.primary }}
        variants={childVariants}
      >
        {title}
      </motion.h2>
      <motion.div variants={childVariants} className="text-lg max-w-3xl mx-auto leading-relaxed text-justify">
        {children}
      </motion.div>
    </motion.section>
  );
}

// Tooltip component for skills
function Tooltip({ text, children }) {
  return (
    <div className="relative group inline-block">
      {children}
      <span
        role="tooltip"
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity select-none whitespace-nowrap"
      >
        {text}
      </span>
    </div>
  );
}

// Loading skeleton for project description
function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mx-auto"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mx-auto"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mx-auto"></div>
    </div>
  );
}

// Social Icon with animated stroke on hover
function SocialIcon({ href, label, children, color }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="relative group inline-block"
      style={{ color }}
    >
      <svg
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5 transition-colors duration-300"
        viewBox="0 0 24 24"
      >
        {children}
        <motion.path
          initial={{ pathLength: 0 }}
          whileHover={{ pathLength: 1, stroke: color }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </svg>
    </a>
  );
}

// Hamburger menu for mobile nav
function MobileMenu({ navItems, activeSection, onSelect, colors }) {
  const [open, setOpen] = useState(false);

  // Close on selecting nav item
  const handleSelect = (id) => {
    setOpen(false);
    onSelect(id);
  };

  return (
    <>
      <button
        aria-label="Toggle menu"
        aria-expanded={open}
        className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setOpen(!open)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke={colors.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>
      <motion.nav
        initial={{ x: "100%" }}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-lg z-50 p-6 flex flex-col space-y-6 md:hidden"
      >
        {navItems.map(({ label, id }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={`text-left text-lg font-medium transition-colors ${
              activeSection === id ? `text-[var(--color-primary)] font-semibold` : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </motion.nav>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}

// Back to Top button
function BackToTop({ visible, onClick, colors }) {
  return (
    <motion.button
      aria-label="Back to top"
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 30 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-28 right-6 bg-[var(--color-primary)] text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-light)]"
      style={{ backgroundColor: colors.primary }}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </motion.button>
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
  const [backToTopVisible, setBackToTopVisible] = useState(false);
  const formRef = useRef(null);

  // Loading state for project descriptions (simulate loading)
  const [loadingProject, setLoadingProject] = useState(false);

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
    const sections = navItems.map(({ id }) => document.getElementById(id));
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setScrolled(scrollTop > 30);
      setBackToTopVisible(scrollTop > 400);

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
  };

  // Simulate loading on project change
  const [currentProject, setCurrentProject] = useState(0);
  const projectTimeout = useRef();

  useEffect(() => {
    setLoadingProject(true);
    projectTimeout.current = setTimeout(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
      setLoadingProject(false);
    }, 6000);
    return () => clearTimeout(projectTimeout.current);
  }, [currentProject]);

  const cycleTheme = () => {
    const currentIndex = validThemes.indexOf(theme);
    setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
  };

  const colors = themeColors[theme] || themeColors.saffron;

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

  const sendEmail = (e) => {
    e.preventDefault();
    setContactStatus(null);
    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formRef.current, EMAILJS_USER_ID)
      .then(() => {
        setContactStatus("SUCCESS");
        formRef.current.reset();
      })
      .catch(() => setContactStatus("FAILED"));
  };

  // Back to Top Handler
  const handleBackToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Accessibility: Trap focus in mobile menu when open? (Could be added in future)

  return (
    <>
      <style>{`
        :root {
          --color-primary: ${colors.primary};
          --color-primary-dark: ${colors.primaryDark};
          --color-primary-light: ${colors.primaryLight};
          --scrollbar-thumb: ${colors.primaryLight};
          --scrollbar-track: transparent;
        }
        html, body, #root {
          transition: background-color 0.6s ease, color 0.6s ease;
          scroll-behavior: smooth;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
        }
        ::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-thumb);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
          transition: background-color 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-primary);
        }
        /* Animated gradient text */
        .gradient-text {
          background: linear-gradient(270deg, var(--color-primary), var(--color-primary-light), var(--color-primary-dark));
          background-size: 600% 600%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 8s ease infinite;
        }
        @keyframes gradientShift {
          0% {background-position: 0% 50%;}
          50% {background-position: 100% 50%;}
          100% {background-position: 0% 50%;}
        }
        /* Button hover with scale and color shift */
        .btn-animated:hover, .btn-animated:focus {
          transform: scale(1.05);
          background-color: var(--color-primary-dark) !important;
          box-shadow: 0 6px 12px rgba(0,0,0,0.2);
          outline: none;
        }
        /* Link underline animation */
        .link-underline {
          position: relative;
          color: inherit;
          text-decoration: none;
        }
        .link-underline::after {
          content: "";
          position: absolute;
          width: 0%;
          height: 2px;
          bottom: 0;
          left: 0;
          background-color: var(--color-primary);
          transition: width 0.3s ease;
        }
        .link-underline:hover::after, .link-underline:focus::after {
          width: 100%;
          outline: none;
        }
        /* Tilt card shadow & depth */
        .tilt-card {
          background: rgba(255 255 255 / 0.15);
          backdrop-filter: saturate(180%) blur(10px);
          border-radius: 1rem;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          cursor: pointer;
        }
        .tilt-card:hover, .tilt-card:focus-within {
          box-shadow: 0 10px 25px rgba(0,0,0,0.25);
          outline: none;
        }
        /* Responsive Improvements */
        @media (max-width: 768px) {
          .btn-animated {
            padding: 1rem 2rem;
            font-size: 1.1rem;
          }
          nav ul li {
            padding: 1rem 0.5rem;
            font-size: 1.1rem;
          }
          textarea, input {
            font-size: 1rem;
          }
        }
      `}</style>

      <div
        className={`relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`}
        style={{ paddingBottom: "110px" }}
      >
        {/* 3D Canvas */}
        <Floating3DCanvas theme={theme} />

        {/* Scroll Progress Bar */}
        <div
          className="fixed top-0 left-0 h-1 z-50 transition-all"
          style={{ width: `${scrollProgress}%`, backgroundColor: colors.primary }}
          aria-hidden="true"
        />

        {/* Navbar */}
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
              tabIndex={0}
              role="link"
              onKeyDown={(e) => {
                if (e.key === "Enter") scrollTo("hero");
              }}
              className="text-2xl font-bold cursor-pointer select-none gradient-text"
            >
              Meet Gojiya
            </div>

            {/* Desktop Nav */}
            <ul className="hidden md:flex space-x-10 font-medium text-lg">
              {navItems.map(({ label, id }) => (
                <li
                  key={id}
                  onClick={() => scrollTo(id)}
                  onKeyDown={(e) => e.key === "Enter" && scrollTo(id)}
                  tabIndex={0}
                  className={`cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    activeSection === id ? "text-[var(--color-primary)] font-semibold" : ""
                  }`}
                  style={{ color: activeSection === id ? colors.primary : undefined }}
                  aria-current={activeSection === id ? "page" : undefined}
                >
                  <span className="link-underline">{label}</span>
                </li>
              ))}
            </ul>

            {/* Mobile Hamburger Menu */}
            <MobileMenu navItems={navItems} activeSection={activeSection} onSelect={scrollTo} colors={colors} />

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                aria-label="Toggle Dark Mode"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 btn-animated"
                style={{ backgroundColor: colors.primary }}
              >
                {darkMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
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
                  >
                    <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18z" />
                  </svg>
                )}
              </button>
              <button
                aria-label="Cycle Color Theme"
                onClick={() => {
                  const currentIndex = validThemes.indexOf(theme);
                  setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
                }}
                className="p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Cycle Color Theme"
              >
                🎨
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="container mx-auto px-6 pt-24 space-y-48 max-w-6xl scroll-smooth" tabIndex={-1}>

          {/* Hero */}
          <section
            id="hero"
            className="min-h-screen flex flex-col justify-center items-center text-center space-y-8 relative z-10"
          >
            <motion.h1
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="text-6xl font-extrabold tracking-tight gradient-text"
              tabIndex={-1}
            >
              Meet Gojiya
            </motion.h1>
            <motion.p
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="max-w-xl text-lg md:text-xl"
            >
              Full-stack Developer & AI Enthusiast — Building beautiful, scalable web experiences.
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("projects")}
              className="px-8 py-3 text-white rounded-lg shadow-lg transition btn-animated"
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
                <Tooltip key={skill} text={`Skill: ${skill}`}>
                  <span
                    tabIndex={0}
                    className="glass-card px-5 py-2 rounded-full text-white font-semibold shadow-lg cursor-default select-none transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    style={{ backgroundColor: colors.primary }}
                    aria-label={`Skill: ${skill}`}
                  >
                    {skill}
                  </span>
                </Tooltip>
              ))}
            </div>
          </SectionReveal>

          {/* Projects */}
          <SectionReveal id="projects" colors={colors} title="Projects">
            <AnimatePresence mode="wait" initial={false}>
              {loadingProject ? (
                <SkeletonLoader key="loading-skeleton" />
              ) : (
                <Tilt
                  className="tilt-card block mx-auto max-w-3xl p-8 rounded-xl shadow-lg cursor-pointer select-none"
                  tiltMaxAngleX={7}
                  tiltMaxAngleY={7}
                  glareEnable={false}
                  key={projects[currentProject].title}
                  transitionSpeed={400}
                  tabIndex={0}
                  role="group"
                  aria-label={`Project card: ${projects[currentProject].title}`}
                >
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.8 }}
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
                        className="hover:underline font-semibold link-underline"
                        style={{ color: colors.primary }}
                      >
                        Live Demo
                      </a>
                      <a
                        href={projects[currentProject].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline font-semibold link-underline"
                        style={{ color: colors.primary }}
                      >
                        GitHub
                      </a>
                    </div>
                  </motion.div>
                </Tilt>
              )}
            </AnimatePresence>

            <div className="flex justify-center gap-4 mt-4" role="tablist" aria-label="Project navigation">
              {projects.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Go to project ${idx + 1}`}
                  role="tab"
                  aria-selected={idx === currentProject}
                  tabIndex={idx === currentProject ? 0 : -1}
                  className={`w-4 h-4 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    idx === currentProject ? `bg-[var(--color-primary)]` : "bg-gray-400"
                  } transition`}
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
              aria-live="polite"
              noValidate
            >
              <input
                type="text"
                name="user_name"
                placeholder="Your Name"
                required
                aria-required="true"
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition"
                style={{ borderColor: colors.primary }}
              />
              <input
                type="email"
                name="user_email"
                placeholder="Your Email"
                required
                aria-required="true"
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition"
                style={{ borderColor: colors.primary }}
              />
              <textarea
                name="message"
                placeholder="Your Message"
                rows={6}
                required
                aria-required="true"
                className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition resize-none"
                style={{ borderColor: colors.primary }}
              />
              <button
                type="submit"
                className="w-full py-3 text-white rounded-lg transition btn-animated"
                style={{ backgroundColor: colors.primary }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.primaryDark)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}
              >
                Send Message
              </button>
            </form>
            {contactStatus === "SUCCESS" && (
              <p
                className="mt-4 text-green-500 font-semibold"
                role="alert"
                tabIndex={-1}
              >
                Message sent successfully!
              </p>
            )}
            {contactStatus === "FAILED" && (
              <p
                className="mt-4 text-red-500 font-semibold"
                role="alert"
                tabIndex={-1}
              >
                Oops! Something went wrong. Please try again.
              </p>
            )}
          </SectionReveal>
        </main>

        {/* Back to top button */}
        <BackToTop visible={backToTopVisible} onClick={handleBackToTop} colors={colors} />

        {/* Footer */}
        <footer
          className="fixed bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex justify-between items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-300 select-none z-40"
          role="contentinfo"
        >
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
              {/* GitHub Icon */}
              <svg
                fill="currentColor"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
              {/* LinkedIn Icon */}
              <svg
                fill="currentColor"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.354V9h3.415v1.561h.047c.476-.9 1.637-1.848 3.372-1.848 3.604 0 4.27 2.372 4.27 5.455v6.284zM5.337 7.433c-1.145 0-2.073-.928-2.073-2.073 0-1.146.928-2.073 2.073-2.073s2.073.927 2.073 2.073c0 1.145-.928 2.073-2.073 2.073zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.224.792 24 1.771 24h20.451c.98 0 1.778-.776 1.778-1.729V1.729C24 .774 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </footer>

        {/* Resume Button */}
        <a
          href="https://drive.google.com/file/d/1d8C33RiAOEV_1q_QDPrWC0uk-i8J4kqO/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-6 z-50 text-white px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none btn-animated"
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
