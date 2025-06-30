import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  Environment,
  ContactShadows,
  Html,
  useGLTF,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
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

// Fancy TorusKnot with glassy material and subtle hover pulsation
function FancyTorusKnot({ ...props }) {
  const mesh = useRef();
  const hoverRef = useRef(false);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += 0.005;
    mesh.current.rotation.y += 0.007;

    if (hoverRef.current) {
      const scale = 1 + 0.15 * Math.sin(clock.elapsedTime * 5);
      mesh.current.scale.set(scale, scale, scale);
    } else {
      mesh.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <mesh
      {...props}
      ref={mesh}
      onPointerOver={() => (hoverRef.current = true)}
      onPointerOut={() => (hoverRef.current = false)}
      castShadow
      receiveShadow
    >
      <torusKnotGeometry args={[1, 0.3, 256, 32]} />
      <meshPhysicalMaterial
        clearcoat={1}
        clearcoatRoughness={0}
        metalness={0.9}
        roughness={0.05}
        color="#f59e0b"
        reflectivity={1}
        transmission={0.4} // glass effect
        thickness={1.5}
        anisotropy={1}
      />
    </mesh>
  );
}

// Pulsing icosahedron with subtle vertex noise animation
function PulsingIcosahedron({ ...props }) {
  const mesh = useRef();
  const tempVerts = useRef();

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    mesh.current.rotation.x += 0.003;
    mesh.current.rotation.y -= 0.004;

    // Pulsing emissive intensity
    mesh.current.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(clock.elapsedTime * 4);

    // Vertex noise animation
    if (!tempVerts.current) {
      tempVerts.current = mesh.current.geometry.attributes.position.array.slice();
    }
    const positions = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = tempVerts.current[i] + 0.05 * Math.sin(clock.elapsedTime * 5 + i);
      positions[i + 1] = tempVerts.current[i + 1] + 0.05 * Math.cos(clock.elapsedTime * 4 + i);
      positions[i + 2] = tempVerts.current[i + 2] + 0.05 * Math.sin(clock.elapsedTime * 3 + i);
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <mesh {...props} ref={mesh} castShadow receiveShadow>
      <icosahedronGeometry args={[1.3, 0]} />
      <meshStandardMaterial
        color="#8b5cf6"
        metalness={0.8}
        roughness={0.15}
        emissive="#7c3aed"
        emissiveIntensity={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Advanced 3D Canvas with shadows, environment, postprocessing, and nice lighting
function AdvancedFloating3DCanvas({ theme }) {
  const colors = themeColors[theme] || themeColors.saffron;

  return (
    <Canvas
      shadows
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        zIndex: 1,
        opacity: 0.85,
      }}
      camera={{ position: [7, 7, 9], fov: 55 }}
      gl={{ antialias: true, toneMappingExposure: 1.2, physicallyCorrectLights: true }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={1.2}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[10, 10, 10]} intensity={0.7} />

      {/* Environment & shadows */}
      <Environment
        background={false}
        preset="sunset"
        blur={0.8}
        resolution={256}
      />
      <ContactShadows
        rotation-x={Math.PI / 2}
        position={[0, -1.4, 0]}
        opacity={0.4}
        width={10}
        height={10}
        blur={2}
        far={4}
      />

      <Suspense fallback={<Html center>Loading 3D...</Html>}>
        <FancyTorusKnot position={[-2, 0, 0]} />
        <PulsingIcosahedron position={[2, 0, 0]} />
      </Suspense>

      {/* Particles */}
      <Stars
        radius={120}
        depth={70}
        count={700}
        factor={8}
        saturation={70}
        fade
        speed={1.5}
        color={colors.particlesColor}
      />

      {/* Controls */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.3}
        enableZoom={false}
        enablePan={false}
      />

      {/* Postprocessing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          height={300}
          intensity={1.2}
          kernelSize={5}
          mipmapBlur
        />
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={3} height={480} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}

// EmailJS config (replace with your own!)
const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";

export default function App() {
  const validThemes = ["saffron", "blue", "violet"];

  // Theme & dark mode default ON if no saved preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return validThemes.includes(saved) ? saved : "saffron";
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === null ? true : saved === "true";
  });

  // Other states & refs
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
    "Selenium",
  ];

  const [currentProject, setCurrentProject] = useState(0);
  const projectTimeout = useRef();

  useEffect(() => {
    projectTimeout.current = setTimeout(() => {
      setCurrentProject((prev) => (prev + 1) % projects.length);
    }, 5000);
    return () => clearTimeout(projectTimeout.current);
  }, [currentProject]);

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
      {/* Advanced 3D Canvas Background */}
      <AdvancedFloating3DCanvas theme={theme} />

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

      {/* Main content sections ... */}
      <main className="container mx-auto px-6 pt-24 space-y-48 max-w-6xl scroll-smooth">
        {/* Hero Section */}
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
            className="px-8 py-3 text-white rounded-lg shadow-lg transition z-10"
            style={{ backgroundColor: colors.primary }}
          >
            See My Work
          </motion.button>
        </section>

        {/* Other sections like About Me, Skills, Projects, Contact ... */}
        {/* (Keep these unchanged from your original code) */}
        {/* Feel free to paste your existing sections here */}
      </main>

      {/* Footer and Resume Button remain unchanged */}
      {/* (Keep these unchanged from your original code) */}
    </div>
  );
}
