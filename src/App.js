import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Trail } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from "emailjs-com";

/* ===========================================================
   SAFFRON DARK • MOBILE FIX + DYNAMIC BACKGROUND (tilt + scroll)
   =========================================================== */

const navItems = [
  { label: "Home", id: "hero" },
  { label: "About Me", id: "about" },
  { label: "Skills", id: "skills" },
  { label: "Projects", id: "projects" },
  { label: "Contact", id: "contact" },
];

const theme = {
  primary: "#f59e0b",
  primaryDark: "#d97706",
  primaryLight: "#fbbf24",
  particlesColor: "#fbbf24",
  ramps: ["#d97706", "#f59e0b", "#fde68a"],
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/* ---------- Motion & Device tilt ---------- */
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

function useDeviceTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 }); // range roughly [-1, 1]
  useEffect(() => {
    const onOrient = (e) => {
      // beta [-180,180] (front/back), gamma [-90,90] (left/right)
      const x = clamp((e.gamma || 0) / 45, -1, 1);
      const y = clamp(-(e.beta || 0) / 45, -1, 1);
      setTilt({ x, y });
    };
    // iOS permission prompt (best-effort, silently ignore if denied)
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === "function") {
      window.DeviceOrientationEvent.requestPermission().catch(() => {}).finally(() => {
        window.addEventListener("deviceorientation", onOrient);
      });
    } else {
      window.addEventListener("deviceorientation", onOrient);
    }
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, []);
  return tilt;
}

/* ---------- Shaders ---------- */
function NebulaPlane({ colors, opacity = 0.6, parallax = { x: 0, y: 0 }, scrollRatio = 0 }) {
  const baseHslA = useMemo(() => {
    const c = new THREE.Color(colors.ramps[0]); const o = { h:0,s:0,l:0 }; c.getHSL(o); return o;
  }, [colors]);
  const baseHslB = useMemo(() => {
    const c = new THREE.Color(colors.ramps[2]); const o = { h:0,s:0,l:0 }; c.getHSL(o); return o;
  }, [colors]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uA: { value: new THREE.Color().setHSL(baseHslA.h, baseHslA.s, baseHslA.l) },
    uB: { value: new THREE.Color().setHSL(baseHslB.h, baseHslB.s, baseHslB.l) },
    uScroll: { value: 0 },
  }), [baseHslA, baseHslB]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt * 0.12;
    uniforms.uScroll.value = scrollRatio;
    const t = uniforms.uTime.value;
    const driftA = (baseHslA.h + 0.02 * Math.sin(t * 0.25)) % 1;
    const driftB = (baseHslB.h + 0.03 * Math.cos(t * 0.21)) % 1;
    uniforms.uA.value.setHSL(driftA < 0 ? driftA + 1 : driftA, baseHslA.s, baseHslA.l);
    uniforms.uB.value.setHSL(driftB < 0 ? driftB + 1 : driftB, baseHslB.s, baseHslB.l);
  });

  // subtle parallax: move plane with tilt/scroll
  const px = parallax.x * 0.5;
  const py = parallax.y * 0.35 + (scrollRatio - 0.5) * 0.8;

  return (
    <mesh position={[px, py, -1.6]} scale={[16, 10, 1]}>
      <planeGeometry args={[1, 1, 128, 128]} />
      <shaderMaterial
        transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`
          varying vec2 vUv; uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uScroll;
          float hash(vec2 p){ return fract(1e4*sin(17.0*p.x + 0.1*p.y)*(0.1+abs(sin(p.y*13.0)))); }
          float noise(vec2 x){ vec2 i=floor(x); vec2 f=fract(x);
            float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
            vec2 u=f*f*(3.-2.*f); return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y; }
          float fbm(vec2 x){ float v=0., a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
            for(int i=0;i<5;i++){ v+=a*noise(x); x=m*x+0.1; a*=0.5; } return v; }
          void main(){
            vec2 p=(vUv-0.5)* (3.0 + uScroll*0.6); // zoom with scroll
            float n=fbm(p + uTime*0.12);
            float g=smoothstep(0.3,1.0,n);
            vec3 col=mix(uA,uB,g);
            col += 0.15*vec3(1.)*smoothstep(0.8,1.0,n);
            gl_FragColor=vec4(col, g*${opacity.toFixed(2)});
          }
        `}
      />
    </mesh>
  );
}

function GlowBillboard({ color = "#ffffff", scale = 6, opacity = 0.2, position = [0, 0, 0] }) {
  const meshRef = useRef(); const { camera } = useThree();
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } }), [color, opacity]);
  useFrame(() => { if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion); });
  return (
    <mesh ref={meshRef} position={position} scale={scale} renderOrder={-1}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity;
          void main(){ vec2 p=vUv-0.5; float d=length(p)*2.0; float a=smoothstep(1.0,0.0,d); a=pow(a,1.7); gl_FragColor=vec4(uColor,a*uOpacity); }`}
      />
    </mesh>
  );
}

/* ---------- 3D elements w/ tilt & scroll ---------- */
function Cursor3D({ color, tilt = { x: 0, y: 0 } }) {
  const group = useRef(); const { viewport, mouse } = useThree();
  const pos = useRef([0, 0]);
  useFrame(() => {
    const tx = mouse.x * viewport.width * 0.5 + tilt.x * viewport.width * 0.25;
    const ty = mouse.y * viewport.height * 0.5 + tilt.y * viewport.height * 0.2;
    pos.current[0] += (tx - pos.current[0]) * 0.15;
    pos.current[1] += (ty - pos.current[1]) * 0.15;
    if (group.current) {
      group.current.position.x = pos.current[0];
      group.current.position.y = pos.current[1];
      group.current.rotation.x += 0.02; group.current.rotation.y += 0.025;
    }
  });
  return (
    <group ref={group}>
      <GlowBillboard color={color} scale={2.2} opacity={0.28} />
      <Trail width={2} color={new THREE.Color(color)} length={8} decay={1} local attenuation>
        <mesh>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color={color} metalness={0.95} roughness={0.08} emissive={color} emissiveIntensity={0.9} />
        </mesh>
      </Trail>
    </group>
  );
}

function InteractiveParticles({ color, count = 120, tilt = { x: 0, y: 0 } }) {
  const { viewport, mouse } = useThree();
  const PARTICLE_COUNT = count, PARTICLE_DISTANCE = 1.7;
  const positions = useRef([]), velocities = useRef([]);
  if (positions.current.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.current.push([(Math.random() - 0.5) * viewport.width * 1.25, (Math.random() - 0.5) * viewport.height * 1.25, (Math.random() - 0.5) * 5]);
      velocities.current.push([(Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01]);
    }
  }
  const pointsRef = useRef(), linesRef = useRef();

  useFrame(() => {
    if (!pointsRef.current || !linesRef.current) return;
    const pts = pointsRef.current.geometry.attributes.position.array;
    const lns = linesRef.current.geometry.attributes.position.array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let p = positions.current[i], v = velocities.current[i];
      p[0] += v[0]; p[1] += v[1]; p[2] += v[2];
      if (p[0] < -viewport.width / 2 - 1 || p[0] > viewport.width / 2 + 1) v[0] = -v[0];
      if (p[1] < -viewport.height / 2 - 1 || p[1] > viewport.height / 2 + 1) v[1] = -v[1];
      if (p[2] < -3 || p[2] > 3) v[2] = -v[2];

      const mx = mouse.x * viewport.width * 0.5 + tilt.x * viewport.width * 0.25;
      const my = mouse.y * viewport.height * 0.5 + tilt.y * viewport.height * 0.25;
      const dx = p[0] - mx, dy = p[1] - my, dist = Math.hypot(dx, dy);
      if (dist < 1.6 && dist > 0.0001) {
        const f = (1.6 - dist) * 0.05; v[0] += (dx / dist) * f; v[1] += (dy / dist) * f;
      }
      v[0] = Math.min(Math.max(v[0], -0.04), 0.04);
      v[1] = Math.min(Math.max(v[1], -0.04), 0.04);
      v[2] = Math.min(Math.max(v[2], -0.04), 0.04);

      pts[i * 3] = p[0]; pts[i * 3 + 1] = p[1]; pts[i * 3 + 2] = p[2];
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    let idx = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const p1 = positions.current[i], p2 = positions.current[j];
        const dx = p1[0] - p2[0], dy = p1[1] - p2[1], dz = p1[2] - p2[2];
        const dist = Math.hypot(dx, dy, dz);
        if (dist < PARTICLE_DISTANCE) {
          lns[idx++] = p1[0]; lns[idx++] = p1[1]; lns[idx++] = p1[2];
          lns[idx++] = p2[0]; lns[idx++] = p2[1]; lns[idx++] = p2[2];
        }
      }
    }
    linesRef.current.geometry.setDrawRange(0, idx / 3);
    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={new Float32Array(PARTICLE_COUNT * 3)} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.12} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT * PARTICLE_COUNT * 2} array={new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3 * 2)} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </lineSegments>
    </>
  );
}

function Floating3DCanvas({ colors, reduced = false, tilt = { x: 0, y: 0 }, scrollRatio = 0 }) {
  const { primary, primaryLight } = colors;
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.92 }}
      camera={{ position: [0, 0, 12], fov: 65 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <pointLight position={[-5, -5, 5]} intensity={0.6} />
      <Suspense fallback={null}>
        <Stars radius={90} depth={45} count={reduced ? 700 : 1400} factor={4} saturation={0} fade speed={0.35 + scrollRatio * 0.15} />
        <NebulaPlane colors={colors} parallax={tilt} scrollRatio={scrollRatio} />
        <GlowBillboard color={primaryLight} scale={12} opacity={0.12} position={[0, 0, -1]} />
        <GlowBillboard color={primary} scale={7} opacity={0.18} position={[0.5, -0.3, -0.8]} />
        <InteractiveParticles color={primaryLight} count={reduced ? 70 : 120} tilt={tilt} />
        <Cursor3D color={primary} tilt={tilt} />
      </Suspense>
      <OrbitControls autoRotate={!reduced} autoRotateSpeed={reduced ? 0.06 : 0.12 + scrollRatio * 0.2} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

/* ---------- Visual overlays ---------- */
function AuroraLayer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2] mix-blend-screen opacity-70"
      style={{
        background:
          "radial-gradient(60% 40% at 20% 10%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 60%), conic-gradient(from 180deg at 30% 50%, rgba(255,255,255,0.05), rgba(0,0,0,0) 50%)",
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
        backgroundImage: "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 4px)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

/* ---------- Utilities ---------- */
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
function CursorRing() {
  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70";
    const ring = document.createElement("div");
    ring.style.cssText = "position:absolute;width:20px;height:20px;border:2px solid rgba(255,255,255,0.6);border-radius:9999px;transform:translate(-50%,-50%);transition:transform .08s ease-out, opacity .2s";
    el.appendChild(ring); document.body.appendChild(el);
    const onMove = (e) => { ring.style.left = e.clientX + "px"; ring.style.top = e.clientY + "px"; };
    const onDown = () => { ring.style.transform = "translate(-50%,-50%) scale(0.7)"; };
    const onUp = () => { ring.style.transform = "translate(-50%,-50%) scale(1)"; };
    window.addEventListener("mousemove", onMove); window.addEventListener("mousedown", onDown); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); el.remove(); };
  }, []);
  return null;
}

/* ---------- UI primitives ---------- */
function Magnetic({ children, strength = 20, className, style }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${(relX / rect.width) * strength}px, ${(relY / rect.height) * strength}px)`;
  }
  function onLeave() { const el = ref.current; if (!el) return; el.style.transform = "translate(0,0)"; }
  return (<div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className} style={style}>{children}</div>);
}

function TiltCard({ children, className, max = 10, glow = "var(--color-primary)", onClick }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -2 * max; const ry = (px - 0.5) * 2 * max;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    el.style.boxShadow = `${-ry}px ${rx}px 40px 0px ${glow}`;
  }
  function onLeave() { const el = ref.current; if (!el) return; el.style.transform = "perspective(900px) rotateX(0) rotateY(0)"; el.style.boxShadow = "none"; }
  return (<div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} className={className}>{children}</div>);
}

function SkillRing({ label, level = 80, accent = "var(--color-primary)" }) {
  const pct = clamp(level, 0, 100);
  const angle = (pct / 100) * 360;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${accent} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg)` }} />
        <div className="absolute inset-1 rounded-full bg-black/60 backdrop-blur-sm grid place-items-center text-xs">{pct}%</div>
      </div>
      <div className="text-sm">{label}</div>
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
      <svg className="w-8 h-8 text-gray-200/90 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
    </motion.button>
  );
}

function SectionReveal({ id, colors, title, children }) {
  const ref = useRef(); const inView = useInView(ref);
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0, transition: { duration: 0.8 } } : undefined}
      className="max-w-6xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8 text-center relative z-10"
    >
      <motion.h2 className="text-3xl md:text-5xl font-extrabold tracking-tight" style={{ background: `linear-gradient(135deg, ${colors.ramps[0]}, ${colors.ramps[2]})`, WebkitBackgroundClip: "text", color: "transparent" }}>{title}</motion.h2>
      <div className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed text-justify md:text-center">{children}</div>
    </motion.section>
  );
}

/* ---------- Email + confetti ---------- */
const EMAILJS_SERVICE_ID = "service_i6dqi68";
const EMAILJS_TEMPLATE_ID = "template_mrty8sn";
const EMAILJS_USER_ID = "bqXMM_OmpPWcc1AMi";
function burstConfetti(x = window.innerWidth / 2, y = window.innerHeight / 2) {
  const container = document.createElement("div");
  container.style.position = "fixed"; container.style.left = 0; container.style.top = 0; container.style.width = "100vw"; container.style.height = "100vh"; container.style.pointerEvents = "none"; container.style.zIndex = 60; document.body.appendChild(container);
  const EMOJIS = ["✨","🌟","💫","🪄","🔥","🧡","🎉","🌈"]; const pieces = 42;
  for (let i = 0; i < pieces; i++) {
    const span = document.createElement("span");
    span.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    span.style.position = "absolute"; span.style.left = `${x}px`; span.style.top = `${y}px`; span.style.fontSize = `${Math.random() * 18 + 14}px`; span.style.transition = `transform 800ms cubic-bezier(.2,.8,.2,1), opacity 900ms ease`;
    container.appendChild(span);
    const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.4; const radius = 120 + Math.random() * 160; const dx = Math.cos(angle) * radius; const dy = Math.sin(angle) * radius;
    requestAnimationFrame(() => { span.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random() * 360}deg)`; span.style.opacity = "0"; });
  }
  setTimeout(() => container.remove(), 1200);
}

/* ---------- Mobile bottom nav (safe-area aware) ---------- */
function MobileNav({ active, onJump, colors }) {
  return (
    <nav
      className="fixed md:hidden left-1/2 -translate-x-1/2 z-40 w-[94%]"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div
        className="flex justify-around items-center rounded-2xl px-3 py-2 border border-white/10 backdrop-blur-xl"
        style={{ background: "rgba(0,0,0,0.45)", boxShadow: `0 10px 30px ${colors.primary}22` }}
      >
        {navItems.map(({ id, label }) => {
          const is = active === id;
          return (
            <button
              key={id}
              onClick={() => onJump(id)}
              className="flex-1 py-2 mx-1 rounded-xl text-xs font-semibold"
              style={{
                background: is ? `linear-gradient(135deg, ${colors.ramps[0]}, ${colors.ramps[2]})` : "transparent",
                color: is ? "#0b0b0b" : "#e5e7eb",
                border: is ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.08)",
              }}
              aria-current={is ? "page" : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- App ---------- */
export default function App() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const tilt = useDeviceTilt();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("dark"); // force dark
    html.style.transition = "background-color 0.3s ease, color 0.3s ease";
  }, []);

  const colors = theme; // locked saffron
  const rampCSS = `linear-gradient(135deg, ${colors.ramps[0]} 0%, ${colors.ramps[1]} 55%, ${colors.ramps[2]} 100%)`;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const formRef = useRef(null);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id); if (!el) return;
    const yOffset = -80; const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const sections = navItems.map(({ id }) => document.getElementById(id));
    const onScroll = () => {
      const scrollTop = window.scrollY; const docHeight = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setScrolled(scrollTop > 30);
      let current = "hero"; sections.forEach((section) => { if (section) { const offsetTop = section.offsetTop - 120; if (scrollTop >= offsetTop) current = section.id; } });
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sendEmail = (e) => {
    e.preventDefault(); setContactStatus(null); setSendingEmail(true);
    emailjs
      .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formRef.current, EMAILJS_USER_ID)
      .then(() => { setContactStatus("SUCCESS"); setSendingEmail(false); formRef.current.reset(); burstConfetti(window.innerWidth - 120, window.innerHeight - 120); })
      .catch(() => { setContactStatus("FAILED"); setSendingEmail(false); });
  };

  const projects = useMemo(
    () => [
      { title: "Stock Market Copilot", description: "End-to-end React + FastAPI app that delivers stock data, news, and AI insights for smarter investment decisions.", link: "https://github.com/meetgojiya98/Stock-Market-Copilot", live: "https://stock-market-copilot.vercel.app/", repo: "meetgojiya98/Stock-Market-Copilot", tags: ["React", "FastAPI", "AI", "Finance"] },
      { title: "Stock Sentiment Dashboard", description: "Real-time dashboard for market sentiment, trending tickers, news, and Reddit feeds to track market mood.", link: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard", live: "https://meetgojiya98.github.io/stock-sentiment-frontend/", repo: "meetgojiya98/Stock-Sentiment-Dashboard", tags: ["React", "D3", "Reddit API", "Charts"] },
      { title: "StockVision", description: "Predicts future stock prices from real market data with interactive charts, favorites, and dark mode.", link: "https://github.com/meetgojiya98/StockVision", live: "https://stock-vision-five.vercel.app/", repo: "meetgojiya98/StockVision", tags: ["React", "ML", "Timeseries", "Charts"] },
      { title: "MapleLoom", description: "Private RAG interface powered by Ollama, Qdrant, Meilisearch — offline, source-anchored answers.", link: "https://github.com/meetgojiya98/MapleLoom", repo: "meetgojiya98/MapleLoom", tags: ["RAG", "Ollama", "Qdrant", "Search"] },
    ],
    []
  );

  const filteredProjects = projects.filter((p) => {
    if (!projectQuery) return true;
    const q = projectQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q));
  });

  return (
    <>
      <style>{`
        :root { --color-primary: ${colors.primary}; --color-primary-dark: ${colors.primaryDark}; --color-primary-light: ${colors.primaryLight}; }
        html { scroll-behavior: smooth; }
        .glass-card { background: rgba(255 255 255 / 0.10); backdrop-filter: saturate(180%) blur(12px); transition: background .3s ease, box-shadow .3s ease, transform .3s ease; }
        .glass-card:hover { background: rgba(255 255 255 / 0.22); box-shadow: 0 0 28px var(--color-primary-light); transform: translateY(-4px); cursor: pointer; }
        .active-pill { position: absolute; bottom: -6px; left: 0; right: 0; margin: 0 auto; width: 24px; height: 3px; border-radius: 9999px; background: var(--color-primary); }
        @keyframes auroraMove { 0% { transform: translateY(-5%) scale(1.05) rotate(0deg); } 100% { transform: translateY(5%) scale(1.05) rotate(6deg); } }
      `}</style>

      <CursorRing />
      <a href="#hero" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded">Skip to content</a>

      <div className="relative bg-black/70 dark:bg-gray-950 text-gray-100 min-h-screen transition-colors duration-700 font-sans" style={{ paddingBottom: "110px" }}>
        {/* Dynamic background (time + scroll + tilt) */}
        <Floating3DCanvas colors={colors} reduced={usePrefersReducedMotion()} tilt={tilt} scrollRatio={scrollProgress / 100} />
        <AuroraLayer />
        <NoiseOverlay />

        {/* top progress */}
        <div className="fixed top-0 left-0 h-1 z-50 transition-all" style={{ width: `${scrollProgress}%`, background: rampCSS, opacity: 0.9 }} />

        {/* DESKTOP HEADER ONLY (mobile hidden to avoid the “sticking at bottom” issue) */}
        <nav className={`hidden md:block fixed top-0 w-full z-40 backdrop-blur-md bg-black/35 border-b border-white/10 ${scrolled ? "shadow-lg" : ""}`} aria-label="Primary Navigation">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
            <div onClick={() => scrollTo("hero")} className="text-2xl font-extrabold cursor-pointer select-none tracking-tight" style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>Meet Gojiya</div>
            <ul className="flex space-x-8 font-medium text-lg relative" role="menubar">
              {navItems.map(({ label, id }) => (
                <li key={id} onClick={() => scrollTo(id)} tabIndex={0} className={`relative pb-2 cursor-pointer transition hover:text-[var(--color-primary)] ${activeSection === id ? "text-[var(--color-primary)] font-semibold" : ""}`} aria-current={activeSection === id ? "page" : undefined}>
                  {label}{activeSection === id && <span className="active-pill" />}
                </li>
              ))}
            </ul>
            <div className="w-8" aria-hidden />
          </div>
        </nav>

        {/* MAIN */}
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-28 space-y-28 md:space-y-48">
          {/* HERO */}
          <section id="hero" className="min-h-[70vh] md:min-h-screen flex flex-col justify-center items-center text-center gap-4 md:gap-8 relative z-10">
            <motion.h1 initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2 }} className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight" style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>Meet Gojiya</motion.h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-sm sm:text-base md:text-base text-white/80">Solution Analyst • Full-stack Dev • AI Enthusiast</motion.div>
            <motion.p initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.1 }} className="max-w-2xl text-base sm:text-lg md:text-xl text-white/90 px-2">I craft resilient, data-driven products—blending gorgeous UI with grounded engineering. Dive into the work.</motion.p>
            <div className="flex gap-2 sm:gap-3 z-10">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} onClick={() => scrollTo("projects")} className="px-6 sm:px-8 py-2.5 sm:py-3 text-black rounded-xl shadow-lg transition focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" style={{ background: rampCSS }}>See My Work</motion.button>
            </div>
            <div className="hidden md:block"><ScrollIndicator onClick={() => scrollTo("about")} /></div>
          </section>

          {/* ABOUT */}
          <SectionReveal id="about" colors={colors} title="About Me">
            <p>Meet Gojiya is a Solution Analyst on the Product Engineering and Development team within the Engineering, AI, and Data offering at Deloitte Canada. He links business with technology to extract insights from complex data and build data-driven solutions.</p>
            <br />
            <p>He holds a Master of Computer Science from the University of New Brunswick and a Bachelor’s in Computer Engineering from Gujarat Technological University. He thrives on innovation, analytics, adaptability, and collaboration—pairing an entrepreneurial spirit with a drive to create positive, real-world impact.</p>
            <br />
            <p>A curious, active listener, he treats every interaction as a chance to learn—exploring new ideas, questioning assumptions, and continuously growing.</p>
          </SectionReveal>

          {/* SKILLS */}
          <SectionReveal id="skills" colors={colors} title="Skills">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {[
                { title: "Frontend", skills: [["React", 92], ["Next.js", 86], ["TypeScript", 88], ["CSS", 85]] },
                { title: "Backend", skills: [["Node.js", 90], ["FastAPI", 85], ["MongoDB", 82], ["SQL", 78]] },
                { title: "Data & AI", skills: [["Python", 90], ["Pandas", 86], ["OpenAI API", 84], ["LangChain", 72]] },
                { title: "Tools", skills: [["Git", 92], ["Docker", 74], ["AWS", 68], ["CI/CD", 76]] },
              ].map((cat) => (
                <div key={cat.title} className="glass-card rounded-2xl p-5 md:p-6 text-left">
                  <div className="mb-4 md:mb-5 font-semibold tracking-wide text-lg" style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>{cat.title}</div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {cat.skills.map(([name, lvl]) => (<SkillRing key={name} label={name} level={lvl} accent={colors.primary} />))}
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>

          {/* PROJECTS (saffron accents, minimal) */}
          <SectionReveal id="projects" colors={colors} title="Projects">
            <div className="max-w-3xl mx-auto mb-6 flex items-center gap-2 md:gap-3">
              <input value={projectQuery} onChange={(e)=>setProjectQuery(e.target.value)} placeholder="Filter projects by title, tag, or description…" className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-white/10 border border-white/20 outline-none text-sm md:text-base" />
              <button onClick={()=>setProjectQuery("")} className="px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm">Clear</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              {filteredProjects.map((p) => {
                const accent = colors.primary, accent2 = colors.primaryLight;
                const accentRamp = `linear-gradient(135deg, ${accent}, ${accent2})`;
                return (
                  <TiltCard key={p.title} className="glass-card rounded-2xl overflow-hidden text-left group" glow={accent} onClick={() => setSelectedProject(p)}>
                    <div className="h-1 w-full" style={{ background: accentRamp }} />
                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent2 }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors.primaryDark }} />
                      </div>
                      <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/60">{p.repo?.split("/")[1] || "project"}</div>
                    </div>
                    <div className="p-5 md:p-6 space-y-3 md:space-y-4">
                      <h3 className="text-lg md:text-xl font-semibold" style={{ background: accentRamp, WebkitBackgroundClip: "text", color: "transparent" }}>{p.title}</h3>
                      <p className="text-white/90 text-sm md:text-base">{p.description}</p>
                      <div className="text-[11px] md:text-xs uppercase tracking-wide text-white/60">{(p.tags||[]).join(" • ")}</div>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-1">
                        <div className="flex-1" />
                        {p.live && (
                          <a href={p.live} target="_blank" rel="noopener noreferrer" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border transition hover:text-white text-sm md:text-base" style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }} title="View Live Demo">
                            <span style={{ background: accentRamp, WebkitBackgroundClip: "text", color: "transparent" }}>Live Demo ↗</span>
                          </a>
                        )}
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border transition hover:text-white text-sm md:text-base" style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }} title="View GitHub Repository">
                          <span style={{ background: accentRamp, WebkitBackgroundClip: "text", color: "transparent" }}>GitHub ↗</span>
                        </a>
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </SectionReveal>

          {/* CONTACT */}
          <SectionReveal id="contact" colors={colors} title="Contact Me">
            <form ref={formRef} onSubmit={sendEmail} className="space-y-4 md:space-y-6 text-left" aria-label="Contact form">
              <input type="text" name="user_name" placeholder="Your Name" required className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none transition text-sm md:text-base" />
              <input type="email" name="user_email" placeholder="Your Email" required className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none transition text-sm md:text-base" />
              <textarea name="message" placeholder="Your Message" rows={6} required className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none transition resize-none text-sm md:text-base" />
              <button type="submit" className="w-full py-3 text-black rounded-lg transition flex justify-center items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50 text-sm md:text-base" style={{ background: rampCSS }} disabled={sendingEmail} title={sendingEmail ? "Sending message..." : "Send Message"}>
                {sendingEmail && (
                  <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 mr-2 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                )}
                <span>{sendingEmail ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
            {contactStatus === "SUCCESS" && (<p className="mt-4 text-green-400 font-semibold" role="alert">Message sent successfully!</p>)}
            {contactStatus === "FAILED" && (<p className="mt-4 text-red-400 font-semibold" role="alert">Oops! Something went wrong. Please try again.</p>)}
          </SectionReveal>
        </main>

        {/* PROJECT MODAL */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
              <motion.div layout initial={{ scale:0.98, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.98, opacity:0 }} className="w-full max-w-3xl rounded-2xl overflow-hidden border border-white/10 bg-black/70">
                <div className="p-5 md:p-6 space-y-3 md:space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold" style={{ background:`linear-gradient(135deg, ${colors.ramps[0]}, ${colors.ramps[2]})`, WebkitBackgroundClip:'text', color:'transparent' }}>{selectedProject.title}</h3>
                  <p className="text-white/90 text-sm md:text-base">{selectedProject.description}</p>
                  <div className="text-[11px] md:text-xs uppercase tracking-wide text-white/60">{(selectedProject.tags||[]).join(" • ")}</div>
                  <div className="flex gap-3 pt-2 flex-wrap">
                    {selectedProject.live && <a target="_blank" rel="noreferrer" href={selectedProject.live} className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm md:text-base">Live Demo</a>}
                    <a target="_blank" rel="noreferrer" href={selectedProject.link} className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm md:text-base">GitHub</a>
                    <div className="flex-1" />
                    <button onClick={()=>setSelectedProject(null)} className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/20 hover:bg-white/10 text-sm md:text-base">Close</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER: fixed on desktop; normal flow on mobile to avoid overlaps */}
        <footer className="w-full bg-black/40 border-t border-white/10 flex justify-between items-center px-4 md:px-6 py-2 text-[11px] sm:text-sm text-white/80 select-none z-30 backdrop-blur md:fixed md:bottom-0 md:left-0">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="hidden sm:flex space-x-4 md:space-x-6 items-center">
            <a href="https://github.com/meetgojiya98" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/meet-gojiya/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">LinkedIn ↗</a>
          </div>
        </footer>

        {/* MOBILE bottom nav */}
        <MobileNav active={activeSection} onJump={scrollTo} colors={colors} />

        {/* RESUME BUTTON (safe-area aware on mobile) */}
        <a
          href="https://drive.google.com/file/d/17XX80PFS8ga66W_fNSaoY-iGfgna8qth/view?usp=sharing"
          target="_blank" rel="noopener noreferrer"
          className="fixed right-4 md:right-6 z-50 text-black px-4 md:px-5 py-2.5 md:py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50 text-sm md:text-base"
          title="Download Resume" download
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)", background: rampCSS }}
          onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
          onMouseOut={(e) => (e.currentTarget.style.filter = "none")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8" /></svg>
          <span>Resume</span>
        </a>
      </div>
    </>
  );
}
