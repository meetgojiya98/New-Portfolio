import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "emailjs-com";
import * as THREE from "three"; // Added for proper lerp use

const navItems = [
  { label: "Home", id: "hero" },
  { label: "About Me", id: "about" },
  { label: "Skills", id: "skills" },
  { label: "Projects", id: "projects" },
  { label: "Contact", id: "contact" },
];

// Define your theme colors
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

// 3D Shapes
function RotatingTorusKnot({ colorPrimary, colorHover, ...props }) {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.01;
      mesh.current.rotation.y += 0.013;
      const targetScale = hovered
        ? new THREE.Vector3(1.15, 1.15, 1.15)
        : new THREE.Vector3(1, 1, 1);
      mesh.current.scale.lerp(targetScale, 0.1);
    }
  });

  return (
    <mesh
      {...props}
      ref={mesh}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <torusKnotGeometry args={[1, 0.3, 150, 20]} />
      <meshPhysicalMaterial
        color={hovered ? colorHover : colorPrimary}
        metalness={0.8}
        roughness={0.1}
        clearcoat={1}
        clearcoatRoughness={0}
      />
    </mesh>
  );
}

function RotatingIcosahedron({ color, ...props }) {
  const mesh = useRef();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.008;
      mesh.current.rotation.y -= 0.01;
    }
  });

  return (
    <mesh {...props} ref={mesh}>
      <icosahedronGeometry args={[1.3, 0]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
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
        opacity: 0.7,
      }}
      camera={{ position: [5, 5, 6], fov: 50 }}
      gl={{ antialias: true, toneMappingExposure: 1.5 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[0, 10, 5]} intensity={1} />
      <pointLight position={[10, 10, 10]} intensity={0.7} />
      <Suspense fallback={null}>
        <RotatingTorusKnot
          position={[-2, 0, 0]}
          colorPrimary={colors.threeColor1}
          colorHover={colors.threeColor2}
        />
        <RotatingIcosahedron color={colors.threeColor2} position={[2, 0, 0]} />
        <Stars
          radius={100}
          depth={50}
          count={500}
          factor={5}
          saturation={50}
          fade
          speed={1}
          color={colors.particlesColor}
        />
      </Suspense>
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.5}
        enableZoom={false}
        enablePan={false}
      />
    </Canvas>
  );
}

// Replace these with your EmailJS credentials
const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";

export default function App() {
  const validThemes = ["saffron", "blue", "violet"];

  // Theme and dark mode states with validation
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return validThemes.includes(saved) ? saved : "saffron";
  });

  // Default dark mode ON if not previously saved
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === null ? true : saved === "true";
  });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const formRef = useRef(null);

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

  const sendEmail = (e) => {
    e.preventDefault();
    setContactStatus(null);

    emailjs
      .sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_USER_ID
      )
      .then(() => {
        setContactStatus("SUCCESS");
        formRef.current.reset();
      })
      .catch(() => setContactStatus("FAILED"));
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
    "Selenium"
  ];

  const [currentProject, setCurrentProject] = useState(0);
  const projectTimeout = useRef();

  useEffect(() => {
    projectTimeout.current = setTimeout(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 5000);
    return () => clearTimeout(projectTimeout.current);
  }, [currentProject]);

  // Cycle theme colors on button press
  const cycleTheme = () => {
    const currentIndex = validThemes.indexOf(theme);
    setTheme(validThemes[(currentIndex + 1) % validThemes.length]);
  };

  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`}
      style={{ paddingBottom: "90px" }}
    >
      {/* Floating 3D Canvas Background */}
      <Floating3DCanvas theme={theme} />

      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 z-50 transition-all"
        style={{ width: `${scrollProgress}%`, backgroundColor: colors.primary }}
      />

      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700 transition-shadow ${
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
          <ul className="hidden md:flex space-x-10 font-medium text-lg">
            {navItems.map(({ label, id }) => (
              <li
                key={id}
                onClick={() => scrollTo(id)}
                className={`cursor-pointer hover:text-[${colors.primary}] transition ${
                  activeSection === id ? `text-[${colors.primary}] font-semibold` : ""
                }`}
                style={{
                  color: activeSection === id ? colors.primary : undefined,
                }}
              >
                {label}
              </li>
            ))}
          </ul>
          <div className="flex items-center space-x-4">
            <button
              aria-label="Toggle Dark Mode"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full text-white transition`}
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
              onClick={cycleTheme}
              className="p-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              title="Cycle Color Theme"
            >
              🎨
            </button>
          </div>
        </div>
      </nav>

      {/* ... rest of your component unchanged ... */}
    </div>
  );
}
