import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "emailjs-com";

// ------------------------------
// NAV + THEME
// ------------------------------
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
    particlesColor: "#fbbf24",
    ramps: ["#f59e0b", "#fbbf24", "#fff1c2"],
  },
  blue: {
    primary: "#3b82f6",
    primaryDark: "#2563eb",
    primaryLight: "#60a5fa",
    particlesColor: "#60a5fa",
    ramps: ["#2563eb", "#3b82f6", "#93c5fd"],
  },
  violet: {
    primary: "#8b5cf6",
    primaryDark: "#7c3aed",
    primaryLight: "#a78bfa",
    particlesColor: "#a78bfa",
    ramps: ["#7c3aed", "#8b5cf6", "#c4b5fd"],
  },
};

// ------------------------------
// ACCESSIBILITY / MOTION PREFS
// ------------------------------
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    onChange();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

// ------------------------------
// GLOW BILLBOARD (soft bloom-ish shader)
// ------------------------------
function GlowBillboard({ color = "#ffffff", scale = 6, opacity = 0.2, position = [0, 0, 0] }) {
  const matRef = useRef();
  const meshRef = useRef();
  const { camera } = useThree();
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    }),
    [color, opacity]
  );

  useFrame(() => {
    if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale} renderOrder={-1}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform vec3 uColor;
          uniform float uOpacity;
          void main() {
            vec2 p = vUv - 0.5;
            float d = length(p) * 2.0;
            float a = smoothstep(1.0, 0.0, d);
            a = pow(a, 1.8);
            gl_FragColor = vec4(uColor, a * uOpacity);
          }
        `}
      />
    </mesh>
  );
}

// ------------------------------
// 3D ELEMENTS
// ------------------------------
function Cursor3D({ color }) {
  const group = useRef();
  const { viewport, mouse } = useThree();
  const pos = useRef([0, 0]);

  useFrame(() => {
    pos.current[0] += (mouse.x * viewport.width * 0.5 - pos.current[0]) * 0.15;
    pos.current[1] += (mouse.y * viewport.height * 0.5 - pos.current[1]) * 0.15;
    if (group.current) {
      group.current.position.x = pos.current[0];
      group.current.position.y = pos.current[1];
      group.current.rotation.x += 0.02;
      group.current.rotation.y += 0.025;
    }
  });

  return (
    <group ref={group}>
      <GlowBillboard color={color} scale={2.2} opacity={0.28} />
      <mesh>
        <icosahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={color}
          metalness={0.95}
          roughness={0.08}
          emissive={color}
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

function InteractiveParticles({ color }) {
  const { viewport, mouse } = useThree();

  const PARTICLE_COUNT = 110;
  const PARTICLE_DISTANCE = 1.8;
  const positions = useRef([]);
  const velocities = useRef([]);

  if (positions.current.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.current.push([
        (Math.random() - 0.5) * viewport.width * 1.25,
        (Math.random() - 0.5) * viewport.height * 1.25,
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
    if (!pointsRef.current || !linesRef.current) return;
    const ptsPositions = pointsRef.current.geometry.attributes.position.array;
    const linesPositions = linesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let p = positions.current[i];
      let v = velocities.current[i];

      for (let axis = 0; axis < 3; axis++) p[axis] += v[axis];

      if (p[0] < -viewport.width / 2 - 1 || p[0] > viewport.width / 2 + 1) v[0] = -v[0];
      if (p[1] < -viewport.height / 2 - 1 || p[1] > viewport.height / 2 + 1) v[1] = -v[1];
      if (p[2] < -3 || p[2] > 3) v[2] = -v[2];

      const mx = mouse.x * viewport.width * 0.5;
      const my = mouse.y * viewport.height * 0.5;
      const dx = p[0] - mx;
      const dy = p[1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5 && dist > 0.0001) {
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
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
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
        <lineBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
    </>
  );
}

function Floating3DCanvas({ theme }) {
  const { primary, primaryLight } = themeColors[theme] || themeColors.saffron;
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, pointerEvents: "auto", zIndex: 1, opacity: 0.85 }}
      camera={{ position: [0, 0, 12], fov: 65 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <pointLight position={[-5, -5, 5]} intensity={0.6} />
      {/* Backdrop */}
      <Suspense fallback={null}>
        <Stars radius={80} depth={40} count={1200} factor={4} saturation={0} fade speed={0.4} />
        {/* Big soft glows behind everything */}
        <GlowBillboard color={primaryLight} scale={10} opacity={0.14} position={[0, 0, -1]} />
        <GlowBillboard color={primary} scale={6} opacity={0.18} position={[0.5, -0.3, -0.8]} />
        <InteractiveParticles color={primaryLight} />
        <Cursor3D color={primary} />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.12} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

// ------------------------------
// VISUAL OVERLAYS (CSS-ONLY)
// ------------------------------
function AuroraLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2] mix-blend-screen opacity-70"
      style={{
        background:
          "radial-gradient(60% 40% at 20% 10%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 60%), conic-gradient(from 180deg at 30% 50%, rgba(255,255,255,0.05), rgba(0,0,0,0) 50%)",
        maskImage: "radial-gradient(90% 60% at 50% 50%, black 40%, transparent 80%)",
        filter: "blur(40px)",
        animation: "auroraMove 14s ease-in-out infinite alternate",
      }}
    />
  );
}

function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[3] opacity-[0.08]"
      style={{
        backgroundImage:
          "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 4px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

// ------------------------------
// UTIL: IN-VIEW
// ------------------------------
function useInView(ref, rootMargin = "-100px") {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => entry.isIntersecting && setShow(true), { rootMargin });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return show;
}

// ------------------------------
// UI PRIMITIVES
// ------------------------------
function Magnetic({ children, strength = 20, className, style }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${(relX / rect.width) * strength}px, ${(relY / rect.height) * strength}px)`;
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0,0)";
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={style}>
      {children}
    </div>
  );
}

function TiltCard({ children, className, max = 10, glow = "var(--color-primary)" }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -2 * max;
    const ry = (px - 0.5) * 2 * max;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    el.style.boxShadow = `${-ry}px ${rx}px 40px 0px ${glow}40`;
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0)";
    el.style.boxShadow = "none";
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className}>
      {children}
    </div>
  );
}

function ScrollIndicator({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: [0, 15, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 focus:outline-none"
      aria-label="Scroll down indicator"
      title="Scroll down"
      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
    >
      <svg className="w-8 h-8 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </motion.button>
  );
}

function SectionReveal({ id, colors, title, children }) {
  const ref = useRef();
  const inView = useInView(ref);
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0, transition: { duration: 0.8 } } : undefined}
      className="max-w-5xl mx-auto px-4 space-y-8 text-center relative z-10"
    >
      <motion.h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: colors.primary }}>
        {title}
      </motion.h2>
      <div className="text-lg max-w-3xl mx-auto leading-relaxed text-justify">{children}</div>
    </motion.section>
  );
}

// ------------------------------
// EMAIL / CONFETTI
// ------------------------------
const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";

function burstConfetti(x = window.innerWidth / 2, y = window.innerHeight / 2) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = 0;
  container.style.top = 0;
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.zIndex = 60;
  document.body.appendChild(container);

  const EMOJIS = ["✨", "🌟", "💫", "🪄", "🔥", "🧡", "🎉", "🌈"];
  const pieces = 36;
  for (let i = 0; i < pieces; i++) {
    const span = document.createElement("span");
    span.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    span.style.position = "absolute";
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    span.style.fontSize = `${Math.random() * 18 + 14}px`;
    span.style.transition = `transform 800ms cubic-bezier(.2,.8,.2,1), opacity 900ms ease`;
    container.appendChild(span);
    const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4;
    const radius = 120 + Math.random() * 120;
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    requestAnimationFrame(() => {
      span.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg)`;
      span.style.opacity = "0";
    });
  }
  setTimeout(() => container.remove(), 1200);
}

// ------------------------------
// MAIN APP
// ------------------------------
export default function App() {
  const validThemes = ["saffron", "blue", "violet"];
  const prefersReducedMotion = usePrefersReducedMotion();

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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const formRef = useRef(null);

  // Persist theme
  useEffect(() => localStorage.setItem("theme", theme), [theme]);

  // Dark mode toggle with smooth transition
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    const html = document.documentElement;
    if (darkMode) html.classList.add("dark");
    else html.classList.remove("dark");
    html.style.transition = "background-color 0.3s ease, color 0.3s ease";
  }, [darkMode]);

  // Scroll + active section tracking
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
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GA pageview on section change
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: `/#${activeSection}` });
    }
  }, [activeSection]);

  // Keyboard: Cmd/Ctrl+K for palette, PageUp/Down to navigate sections
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((s) => !s);
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        const idx = navItems.findIndex((n) => n.id === activeSection);
        const next = navItems[Math.min(navItems.length - 1, idx + 1)].id;
        scrollTo(next);
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        const idx = navItems.findIndex((n) => n.id === activeSection);
        const prev = navItems[Math.max(0, idx - 1)].id;
        scrollTo(prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSection]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setMenuOpen(false);
    setPaletteOpen(false);
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
        burstConfetti(window.innerWidth - 120, window.innerHeight - 120);
      })
      .catch(() => {
        setContactStatus("FAILED");
        setSendingEmail(false);
      });
  };

  const projects = useMemo(
    () => [
      {
        title: "Stock Market Copilot",
        description:
          "End-to-end React and FastAPI app that delivers stock data, news, and AI insights for smarter investment decisions.",
        link: "https://github.com/meetgojiya98/Stock-Market-Copilot",
        live: "https://stock-market-copilot.vercel.app/",
        thumb: "https://opengraph.githubassets.com/1/meetgojiya98/Stock-Market-Copilot",
      },
      {
        title: "Stock Sentiment Dashboard",
        description:
          "Real-time dashboard for market sentiment, trending tickers, news, and Reddit feeds to track market mood.",
        link: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard",
        live: "https://meetgojiya98.github.io/stock-sentiment-frontend/",
        thumb: "https://opengraph.githubassets.com/1/meetgojiya98/Stock-Sentiment-Dashboard",
      },
      {
        title: "StockVision",
        description:
          "Responsive app that predicts future stock prices from real market data with interactive charts and favorites.",
        link: "https://github.com/meetgojiya98/StockVision",
        live: "https://stock-vision-five.vercel.app/",
        thumb: "https://opengraph.githubassets.com/1/meetgojiya98/StockVision",
      },
      {
        title: "MapleLoom",
        description:
          "Precise, private RAG interface powered by Ollama, Qdrant, and Meilisearch. Offline. Source-anchored answers.",
        link: "https://github.com/meetgojiya98/MapleLoom",
        thumb: "https://opengraph.githubassets.com/1/meetgojiya98/MapleLoom",
      },
    ],
    []
  );

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

  const colors = themeColors[theme] || themeColors.saffron;

  const cycleTheme = () => {
    const idx = ["saffron", "blue", "violet"].indexOf(theme);
    setTheme(["saffron", "blue", "violet"][(idx + 1) % 3]);
  };

  const rampCSS = `linear-gradient(135deg, ${colors.ramps[0]} 0%, ${colors.ramps[1]} 55%, ${colors.ramps[2]} 100%)`;

  return (
    <>
      <style>{`
        :root {
          --color-primary: ${colors.primary};
          --color-primary-dark: ${colors.primaryDark};
          --color-primary-light: ${colors.primaryLight};
        }
        html { scroll-behavior: smooth; }
        .glass-card { background: rgba(255 255 255 / 0.12); backdrop-filter: saturate(180%) blur(10px); transition: background .3s ease, box-shadow .3s ease, transform .3s ease; }
        .glass-card:hover { background: rgba(255 255 255 / 0.25); box-shadow: 0 0 24px var(--color-primary-light); transform: translateY(-4px); cursor: pointer; }
        button:focus, a:focus, input:focus, textarea:focus, li:focus { outline: 3px solid var(--color-primary); outline-offset: 2px; }
        .theme-cycle-btn:active { transform: scale(0.9); transition: transform .15s ease; }
        .active-pill { position: absolute; bottom: -6px; left: 0; right: 0; margin: 0 auto; width: 24px; height: 3px; border-radius: 9999px; background: var(--color-primary); }
        @keyframes auroraMove { 0% { transform: translateY(-5%) scale(1.05) rotate(0deg); } 100% { transform: translateY(5%) scale(1.05) rotate(6deg); } }
        .marquee { display: flex; gap: 1rem; will-change: transform; animation: scrollX 28s linear infinite; }
        @keyframes scrollX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <div className={`relative bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-700 font-sans`} style={{ paddingBottom: "90px" }}>
        {/* 3D background + visual layers */}
        <Floating3DCanvas theme={theme} />
        <AuroraLayer />
        <NoiseOverlay />

        {/* Scroll progress */}
        <div className="fixed top-0 left-0 h-1 z-50 transition-all" style={{ width: `${scrollProgress}%`, background: rampCSS }} />

        {/* NAVBAR */}
        <nav className={`fixed top-0 w-full z-40 backdrop-blur-md bg-white/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 transition-shadow ${scrolled ? "shadow-lg" : ""}`} role="navigation" aria-label="Primary Navigation">
          <div className="container mx-auto flex justify-between items-center px-6 py-3">
            <div
              onClick={() => scrollTo("hero")}
              className="text-2xl font-extrabold cursor-pointer select-none tracking-tight"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") scrollTo("hero"); }}
              role="link"
              aria-label="Go to Home"
            >
              Meet Gojiya
            </div>

            <ul className="hidden md:flex space-x-8 font-medium text-lg relative" role="menubar">
              {navItems.map(({ label, id }) => (
                <li
                  key={id}
                  onClick={() => scrollTo(id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") scrollTo(id); }}
                  tabIndex={0}
                  className={`relative pb-2 cursor-pointer transition hover:text-[var(--color-primary)] ${activeSection === id ? "text-[var(--color-primary)] font-semibold" : ""}`}
                  aria-current={activeSection === id ? "page" : undefined}
                  role="menuitem"
                >
                  {label}
                  {activeSection === id && <span className="active-pill" />}
                </li>
              ))}
            </ul>

            <div className="flex items-center space-x-3">
              <Magnetic>
                <button
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                  style={{ background: rampCSS }}
                  title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path d="M12 3v1m0 16v1m8.66-11.66l-.707.707M5.05 18.95l-.707.707m15.192 2.121l-.707-.707M5.05 5.05l-.707-.707M21 12h-1M4 12H3" />
                      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="none" aria-hidden="true">
                      <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18z" />
                    </svg>
                  )}
                </button>
              </Magnetic>
              <Magnetic>
                <button
                  aria-label="Cycle Color Theme"
                  onClick={cycleTheme}
                  className="p-2 rounded-full bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 transition theme-cycle-btn focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                  title="Cycle Color Theme"
                >
                  🎨
                </button>
              </Magnetic>
              <Magnetic>
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden md:inline-flex px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-[var(--color-primary)]/80 hover:text-[var(--color-primary)] transition"
                  title="Open command palette (⌘/Ctrl + K)"
                >
                  ⌘K
                </button>
              </Magnetic>
            </div>
          </div>
        </nav>

        {/* COMMAND PALETTE */}
        <AnimatePresence>
          {paletteOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-28">
              <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="w-[90%] max-w-xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                  <input autoFocus onKeyDown={(e) => { if (e.key === "Escape") setPaletteOpen(false); }} placeholder="Type to jump: home, about, skills, projects, contact…" className="w-full bg-transparent outline-none text-lg px-2 py-1 placeholder-gray-500" />
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {navItems.map((n) => (
                    <li key={n.id} className="px-4 py-3 hover:bg-[var(--color-primary)]/10 cursor-pointer" onClick={() => scrollTo(n.id)}>
                      <div className="font-semibold">{n.label}</div>
                      <div className="text-sm text-gray-500">#{n.id}</div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN */}
        <main className="container mx-auto px-6 pt-24 space-y-48 max-w-6xl">
          {/* HERO */}
          <section id="hero" className="min-h-screen flex flex-col justify-center items-center text-center space-y-8 relative z-10">
            <motion.h1 initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2 }} className="text-6xl md:text-7xl font-extrabold tracking-tight" style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>
              Meet Gojiya
            </motion.h1>
            <motion.p initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.5 }} className="max-w-xl text-lg md:text-xl">
              Full-stack Developer & AI Enthusiast — building beautiful, scalable web experiences.
            </motion.p>
            <Magnetic>
              <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.96 }} onClick={() => scrollTo("projects")} className="px-8 py-3 text-white rounded-xl shadow-lg transition z-10 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" style={{ background: rampCSS }}>
                See My Work
              </motion.button>
            </Magnetic>
            <ScrollIndicator onClick={() => scrollTo("about")} />
          </section>

          {/* ABOUT */}
          <SectionReveal id="about" colors={colors} title="About Me">
            <p>
              Meet Gojiya is a Solution Analyst on the Product Engineering and Development team within the Engineering, AI, and Data offering at Deloitte Canada. He links business with technology to extract insights from complex data and build data-driven solutions.
            </p>
            <br />
            <p>
              Meet holds a Master of Computer Science from the University of New Brunswick and a Bachelor’s in Computer Engineering from Gujarat Technological University. He thrives on innovation, analytics, adaptability, and collaboration, pairing an entrepreneurial spirit with a drive to create positive, real-world impact.
            </p>
            <br />
            <p>
              A curious, active listener, he treats every interaction as a chance to learn—exploring new ideas, questioning assumptions, and continuously growing.
            </p>
          </SectionReveal>

          {/* SKILLS (MARQUEE + CHIPS) */}
          <SectionReveal id="skills" colors={colors} title="Skills">
            <div className="overflow-hidden py-2">
              <div className="marquee">
                {[...skills, ...skills].map((skill, i) => (
                  <span key={i} className="px-5 py-2 rounded-full text-white font-semibold shadow-lg select-none" style={{ background: rampCSS }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </SectionReveal>

          {/* PROJECTS (TILT CARDS GRID with THUMBS) */}
          <SectionReveal id="projects" colors={colors} title="Projects">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((p) => (
                <TiltCard key={p.title} className="glass-card rounded-2xl p-0 overflow-hidden text-left">
                  {/* Thumb */}
                  <div className="relative">
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.45))" }} />
                    <img
                      src={p.thumb}
                      alt={`${p.title} thumbnail`}
                      loading="lazy"
                      className="w-full h-48 object-cover transition-transform duration-500 will-change-transform hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-2xl font-semibold drop-shadow" style={{ color: "#fff" }}>{p.title}</h3>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-5">{p.description}</p>
                    <div className="flex flex-wrap gap-4">
                      {p.live && (
                        <a href={p.live} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-[var(--color-primary)]/50 hover:text-white transition" style={{ background: "transparent" , boxShadow: `inset 0 0 0 1px ${colors.primary}40` }} title="View Live Demo">
                          <span style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>Live Demo ↗</span>
                        </a>
                      )}
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-[var(--color-primary)]/50 hover:text-white transition" style={{ background: "transparent", boxShadow: `inset 0 0 0 1px ${colors.primary}40` }} title="View GitHub Repository">
                        <span style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>GitHub ↗</span>
                      </a>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </SectionReveal>

          {/* CONTACT */}
          <SectionReveal id="contact" colors={colors} title="Contact Me">
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6 text-left" aria-label="Contact form">
              <input type="text" name="user_name" placeholder="Your Name" required className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition" style={{ borderColor: colors.primary }} />
              <input type="email" name="user_email" placeholder="Your Email" required className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition" style={{ borderColor: colors.primary }} />
              <textarea name="message" placeholder="Your Message" rows={6} required className="w-full p-3 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none transition resize-none" style={{ borderColor: colors.primary }} />
              <button type="submit" className="w-full py-3 text-white rounded-lg transition flex justify-center items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" style={{ background: rampCSS }} disabled={sendingEmail} title={sendingEmail ? "Sending message..." : "Send Message"}>
                {sendingEmail && (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                <span>{sendingEmail ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
            {contactStatus === "SUCCESS" && (
              <p className="mt-4 text-green-500 font-semibold" role="alert">Message sent successfully!</p>
            )}
            {contactStatus === "FAILED" && (
              <p className="mt-4 text-red-500 font-semibold" role="alert">Oops! Something went wrong. Please try again.</p>
            )}
          </SectionReveal>
        </main>

        {/* FOOTER */}
        <footer className="fixed bottom-0 left-0 w-full bg-gray-200 dark:bg-gray-900/80 border-t border-gray-300 dark:border-gray-800 flex justify-between items-center px-6 py-2 text-sm text-gray-700 dark:text-gray-300 select-none z-40 backdrop-blur">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="flex space-x-6">
            <a href="https://github.com/meetgojiya98" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-current transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" style={{ color: colors.primary }} title="GitHub Profile">
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.373 0 12a12 12 0 008.207 11.385c.6.11.82-.26.82-.577v-2.022c-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.09-.744.083-.729.083-.729 1.205.086 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.333-5.466-5.933 0-1.312.467-2.38 1.235-3.22-.123-.303-.535-1.522.117-3.176 0 0 1.008-.323 3.3 1.23a11.5 11.5 0 016.003 0c2.29-1.553 3.296-1.23 3.296-1.23.654 1.654.243 2.873.12 3.176.77.84 1.232 1.91 1.232 3.22 0 4.61-2.807 5.63-5.48 5.922.43.37.815 1.102.815 2.222v3.293c0 .32.22.694.825.576A12 12 0 0024 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/meet-gojiya/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-current transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" style={{ color: colors.primary }} title="LinkedIn Profile">
              <svg fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.028-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.942v5.664H9.354V9h3.415v1.561h.047c.476-.9 1.637-1.848 3.372-1.848 3.604 0 4.27 2.372 4.27 5.455v6.284zM5.337 7.433c-1.145 0-2.073-.928-2.073-2.073 0-1.146.928-2.073 2.073-2.073s2.073.927 2.073 2.073c0 1.145-.928 2.073-2.073 2.073zm1.777 13.019H3.56V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.224.792 24 1.771 24h20.451c.98 0 1.778-.776 1.778-1.729V1.729C24 .774 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </footer>

        {/* RESUME FLOATING BUTTON */}
        <a href="https://drive.google.com/file/d/17XX80PFS8ga66W_fNSaoY-iGfgna8qth/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="fixed bottom-20 right-6 z-50 text-white px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" title="Download Resume" download style={{ background: rampCSS }} onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(0.95)")} onMouseOut={(e) => (e.currentTarget.style.filter = "none")}}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8" />
          </svg>
          <span>Resume</span>
        </a>
      </div>
    </>
  );
}
