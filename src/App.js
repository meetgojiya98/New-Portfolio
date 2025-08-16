import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Trail, Text, Html } from "@react-three/drei";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import emailjs from "emailjs-com";

/* ===========================================================
   OUT-OF-THIS-WORLD • HYPER ENHANCED PORTFOLIO (no new libs)
   =========================================================== */

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

const baseThemes = {
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

// Helpers: color + math utils
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;
const map = (v, a1, a2, b1, b2) => b1 + ((v - a1) * (b2 - b1)) / (a2 - a1 || 1);
function hexToHsl(hex) {
  const c = hex.replace('#','');
  const bigint = parseInt(c.length === 3 ? c.split('').map(x=>x+x).join('') : c, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
}
const hslToCss = (h,s,l) => `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
const makeRamp = (h,s,l) => [ hslToCss(h, s, clamp(l, 10, 90)), hslToCss(h, clamp(s+5, 0, 100), clamp(l+12, 0, 95)), hslToCss(h, clamp(s-10, 0, 100), clamp(l+28, 0, 98)) ];
function deriveThemeFromHSL(h,s,l){
  const primary = hslToCss(h,s,l);
  const primaryDark = hslToCss(h, clamp(s+5,0,100), clamp(l-10,0,100));
  const primaryLight = hslToCss(h, clamp(s-10,0,100), clamp(l+12,0,100));
  const ramps = makeRamp(h,s,l);
  return { primary, primaryDark, primaryLight, particlesColor: primaryLight, ramps };
}
const stringToHue = (str) => { let h=0; for(let i=0;i<str.length;i++){ h=(h*31 + str.charCodeAt(i))%360; } return h; };
const numShort = (n) => n>=1e6? (n/1e6).toFixed(1)+"M" : n>=1e3? (n/1e3).toFixed(1)+"k" : String(n);

// ------------------------------
// ACCESSIBILITY / PREFS / KONAMI
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
function useKonami(callback){
  useEffect(()=>{
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let i=0;
    const onKey = (e)=>{ if(e.key === seq[i]){ i++; if(i===seq.length){ callback?.(); i=0; } } else { i=0; } };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[callback]);
}

// ------------------------------
// SHADERS • Nebula Plane (time-driven FBM), Bloom billboards
// ------------------------------
function NebulaPlane({ colors, opacity=0.6 }){
  const ref = useRef();
  const uniforms = useMemo(()=>({
    uTime: { value: 0 },
    uA: { value: new THREE.Color(colors.ramps[0]) },
    uB: { value: new THREE.Color(colors.ramps[2]) },
  }), [colors]);
  useFrame((_,dt)=>{ if(ref.current){ uniforms.uTime.value += dt*0.12; } });
  return (
    <mesh ref={ref} position={[0,0,-1.5]} scale={[16,10,1]}>
      <planeGeometry args={[1,1,128,128]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec2 vUv; varying vec3 vPos;
          void main(){ vUv=uv; vPos=position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `}
        fragmentShader={`
          varying vec2 vUv; varying vec3 vPos; uniform float uTime; uniform vec3 uA; uniform vec3 uB;
          // 2D noise by IQ
          float hash(vec2 p){ return fract(1e4*sin(17.0*p.x + 0.1*p.y)* (0.1+abs(sin(p.y*13.0)))); }
          float noise(in vec2 x){ vec2 i=floor(x); vec2 f=fract(x); float a=hash(i); float b=hash(i+vec2(1.0,0.0)); float c=hash(i+vec2(0.0,1.0)); float d=hash(i+vec2(1.0,1.0)); vec2 u=f*f*(3.0-2.0*f); return mix(a,b,u.x)+ (c-a)*u.y*(1.0-u.x)+ (d-b)*u.x*u.y; }
          float fbm(vec2 x){ float v=0.0; float a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*noise(x); x=m*x+0.1; a*=0.5; } return v; }
          void main(){ vec2 p = (vUv-0.5)*3.0; float n = fbm(p + uTime*0.12); float g = smoothstep(0.3,1.0,n);
            vec3 col = mix(uA,uB, g);
            col += 0.15*vec3(1.0,1.0,1.0)*smoothstep(0.8,1.0,n);
            gl_FragColor = vec4(col, g*${opacity.toFixed(2)});
          }
        `}
      />
    </mesh>
  );
}

function GlowBillboard({ color = "#ffffff", scale = 6, opacity = 0.2, position = [0, 0, 0] }) {
  const meshRef = useRef();
  const { camera } = useThree();
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } }), [color, opacity]);
  useFrame(() => { if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion); });
  return (
    <mesh ref={meshRef} position={position} scale={scale} renderOrder={-1}>
      <planeGeometry args={[1,1,1,1]} />
      <shaderMaterial
        transparent depthWrite={false} depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`varying vec2 vUv; uniform vec3 uColor; uniform float uOpacity; void main(){ vec2 p=vUv-0.5; float d=length(p)*2.0; float a=smoothstep(1.0,0.0,d); a=pow(a,1.7); gl_FragColor=vec4(uColor,a*uOpacity); }`}
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
      <Trail width={2} color={new THREE.Color(color)} length={8} decay={1} local attenuation>
        <mesh>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color={color} metalness={0.95} roughness={0.08} emissive={color} emissiveIntensity={0.9} />
        </mesh>
      </Trail>
    </group>
  );
}

function InteractiveParticles({ color, count=140 }) {
  const { viewport, mouse } = useThree();
  const PARTICLE_COUNT = count;
  const PARTICLE_DISTANCE = 1.9;
  const positions = useRef([]);
  const velocities = useRef([]);
  if (positions.current.length === 0) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions.current.push([(Math.random()-0.5)*viewport.width*1.25,(Math.random()-0.5)*viewport.height*1.25,(Math.random()-0.5)*5]);
      velocities.current.push([(Math.random()-0.5)*0.01,(Math.random()-0.5)*0.01,(Math.random()-0.5)*0.01]);
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
      if (p[0] < -viewport.width/2-1 || p[0] > viewport.width/2+1) v[0] = -v[0];
      if (p[1] < -viewport.height/2-1 || p[1] > viewport.height/2+1) v[1] = -v[1];
      if (p[2] < -3 || p[2] > 3) v[2] = -v[2];
      const mx = mouse.x * viewport.width * 0.5; const my = mouse.y * viewport.height * 0.5;
      const dx = p[0] - mx; const dy = p[1] - my; const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 1.5 && dist > 0.0001) { const f = (1.5 - dist) * 0.05; v[0] += (dx / dist) * f; v[1] += (dy / dist) * f; }
      v[0] = Math.min(Math.max(v[0], -0.04), 0.04);
      v[1] = Math.min(Math.max(v[1], -0.04), 0.04);
      v[2] = Math.min(Math.max(v[2], -0.04), 0.04);
      ptsPositions[i*3] = p[0]; ptsPositions[i*3+1] = p[1]; ptsPositions[i*3+2] = p[2];
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    let lineIndex = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const p1 = positions.current[i]; const p2 = positions.current[j];
        const dx = p1[0]-p2[0]; const dy = p1[1]-p2[1]; const dz = p1[2]-p2[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < PARTICLE_DISTANCE) {
          linesPositions[lineIndex++] = p1[0]; linesPositions[lineIndex++] = p1[1]; linesPositions[lineIndex++] = p1[2];
          linesPositions[lineIndex++] = p2[0]; linesPositions[lineIndex++] = p2[1]; linesPositions[lineIndex++] = p2[2];
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
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={new Float32Array(PARTICLE_COUNT * 3)} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.12} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT * PARTICLE_COUNT * 2} array={new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3 * 2)} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
    </>
  );
}

function Floating3DCanvas({ colors, reduced=false }) {
  const { primary, primaryLight } = colors;
  return (
    <Canvas style={{ position: "fixed", inset: 0, pointerEvents: "auto", zIndex: 1, opacity: 0.92 }} camera={{ position: [0, 0, 12], fov: 65 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5,5,5]} intensity={0.9} />
      <pointLight position={[-5,-5,5]} intensity={0.6} />
      <Suspense fallback={null}>
        <Stars radius={90} depth={45} count={reduced ? 900 : 1600} factor={4} saturation={0} fade speed={0.35} />
        <NebulaPlane colors={colors} />
        <GlowBillboard color={primaryLight} scale={12} opacity={0.13} position={[0,0,-1]} />
        <GlowBillboard color={primary} scale={7} opacity={0.18} position={[0.5,-0.3,-0.8]} />
        <InteractiveParticles color={primaryLight} count={reduced ? 80 : 140} />
        <Cursor3D color={primary} />
      </Suspense>
      <OrbitControls autoRotate={!reduced} autoRotateSpeed={reduced ? 0.06 : 0.12} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

// ------------------------------
// VISUAL OVERLAYS (CSS)
// ------------------------------
function AuroraLayer() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[2] mix-blend-screen opacity-70" style={{
      background: "radial-gradient(60% 40% at 20% 10%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 60%), conic-gradient(from 180deg at 30% 50%, rgba(255,255,255,0.05), rgba(0,0,0,0) 50%)",
      maskImage: "radial-gradient(90% 60% at 50% 50%, black 40%, transparent 80%)",
      filter: "blur(40px)",
      animation: "auroraMove 14s ease-in-out infinite alternate",
    }} />
  );
}
function NoiseOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[3] opacity-[0.08]" style={{
      backgroundImage: "repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 4px)",
      mixBlendMode: "overlay",
    }} />
  );
}

// ------------------------------
// UTIL: IN-VIEW + CURSOR RING
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
function CursorRing(){
  useEffect(()=>{
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70';
    const ring = document.createElement('div');
    ring.style.cssText = 'position:absolute;width:24px;height:24px;border:2px solid rgba(255,255,255,0.7);border-radius:9999px;transform:translate(-50%,-50%);transition:transform .08s ease-out, opacity .2s';
    el.appendChild(ring); document.body.appendChild(el);
    const onMove = (e)=>{ ring.style.left=e.clientX+'px'; ring.style.top=e.clientY+'px'; };
    const onDown = ()=>{ ring.style.transform='translate(-50%,-50%) scale(0.7)'; };
    const onUp = ()=>{ ring.style.transform='translate(-50%,-50%) scale(1)'; };
    window.addEventListener('mousemove', onMove); window.addEventListener('mousedown', onDown); window.addEventListener('mouseup', onUp);
    return ()=>{ window.removeEventListener('mousemove', onMove); window.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); el.remove(); };
  },[]);
  return null;
}

// ------------------------------
// UI PRIMITIVES
// ------------------------------
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

function TiltCard({ children, className, max = 10, glow = "var(--color-primary)" }) {
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
  return (<div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className}>{children}</div>);
}

function ScrollIndicator({ onClick }) {
  return (
    <motion.button onClick={onClick} initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-12 left-1/2 -translate-x-1/2 focus:outline-none" aria-label="Scroll down indicator" title="Scroll down" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
      <svg className="w-8 h-8 text-gray-200/90 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
    </motion.button>
  );
}

function SectionReveal({ id, colors, title, children }) {
  const ref = useRef();
  const inView = useInView(ref);
  return (
    <motion.section id={id} ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0, transition: { duration: 0.8 } } : undefined} className="max-w-6xl mx-auto px-4 space-y-8 text-center relative z-10">
      <motion.h2 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ background: `linear-gradient(135deg, ${colors.ramps[0]}, ${colors.ramps[2]})`, WebkitBackgroundClip:'text', color:'transparent' }}>{title}</motion.h2>
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
  container.style.position = "fixed"; container.style.left = 0; container.style.top = 0; container.style.width = "100vw"; container.style.height = "100vh"; container.style.pointerEvents = "none"; container.style.zIndex = 60; document.body.appendChild(container);
  const EMOJIS = ["✨","🌟","💫","🪄","🔥","🧡","🎉","🌈"]; const pieces = 42;
  for (let i=0;i<pieces;i++) { const span=document.createElement("span"); span.textContent=EMOJIS[Math.floor(Math.random()*EMOJIS.length)]; span.style.position="absolute"; span.style.left=`${x}px`; span.style.top=`${y}px`; span.style.fontSize=`${Math.random()*18+14}px`; span.style.transition=`transform 800ms cubic-bezier(.2,.8,.2,1), opacity 900ms ease`; container.appendChild(span); const angle=(i/pieces)*Math.PI*2+Math.random()*0.4; const radius=120+Math.random()*160; const dx=Math.cos(angle)*radius; const dy=Math.sin(angle)*radius; requestAnimationFrame(()=>{ span.style.transform=`translate(${dx}px, ${dy}px) rotate(${Math.random()*360}deg)`; span.style.opacity="0"; }); }
  setTimeout(()=>container.remove(), 1200);
}

// ------------------------------
// HOOK: GitHub repo stats (no libs)
// ------------------------------
function useGithubStats(projects){
  const [stats, setStats] = useState({});
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      const entries = await Promise.all(projects.map(async p=>{
        if(!p.repo) return [p.repo, null];
        try{ const r = await fetch(`https://api.github.com/repos/${p.repo}`); if(!r.ok) throw new Error('rate'); const d = await r.json(); return [p.repo,{ stars: d.stargazers_count, forks: d.forks_count, issues: d.open_issues_count }]; }catch{ return [p.repo,null]; }
      }));
      if(!cancelled){ const obj={}; entries.forEach(([k,v])=>{ if(k) obj[k]=v; }); setStats(obj); }
    })();
    return ()=>{ cancelled=true; };
  },[projects]);
  return stats;
}

// ------------------------------
// MINIMAP NAV • right side dots
// ------------------------------
function MinimapNav({ active, onJump, colors }){
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
      {navItems.map((n)=>{
        const is = active===n.id;
        return (
          <button key={n.id} aria-label={`Jump to ${n.label}`} onClick={()=>onJump(n.id)} className="relative w-3.5 h-3.5 rounded-full outline-none" style={{ background: is? colors.primary : 'rgba(255,255,255,0.4)', boxShadow: is? `0 0 0 4px ${colors.primary}33` : 'none' }} />
        );
      })}
    </div>
  );
}

// ------------------------------
// MAIN APP
// ------------------------------
export default function App() {
  const validThemes = ["saffron", "blue", "violet"];
  const prefersReducedMotion = usePrefersReducedMotion();

  // Parse theme from URL (optional share links)
  useEffect(()=>{
    const q = new URLSearchParams(window.location.search);
    const t = q.get('theme'); const hs = q.get('h'); const ss = q.get('s'); const ls = q.get('l'); const dm=q.get('dark');
    if(t && validThemes.includes(t)) localStorage.setItem('theme', t);
    if(hs && ss && ls){ localStorage.setItem('useCustomTheme','true'); localStorage.setItem('themeH', hs); localStorage.setItem('themeS', ss); localStorage.setItem('themeL', ls); }
    if(dm) localStorage.setItem('darkMode', dm);
  },[]);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return validThemes.includes(saved) ? saved : "blue";
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === null ? true : saved === "true";
  });

  const [useCustom, setUseCustom] = useState(() => localStorage.getItem("useCustomTheme") === "true");
  const [h, setH] = useState(() => {
    const saved = localStorage.getItem("themeH");
    return saved ? parseInt(saved,10) : hexToHsl(baseThemes["blue"].primary).h;
  });
  const [s, setS] = useState(() => {
    const saved = localStorage.getItem("themeS");
    return saved ? parseInt(saved,10) : 85;
  });
  const [l, setL] = useState(() => {
    const saved = localStorage.getItem("themeL");
    return saved ? parseInt(saved,10) : 58;
  });
  const customColors = useMemo(() => deriveThemeFromHSL(h,s,l), [h,s,l]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactStatus, setContactStatus] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [projectQuery, setProjectQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const formRef = useRef(null);

  // Persist theme + editor
  useEffect(() => localStorage.setItem("theme", theme), [theme]);
  useEffect(() => localStorage.setItem("useCustomTheme", String(useCustom)), [useCustom]);
  useEffect(() => { localStorage.setItem("themeH", String(h)); localStorage.setItem("themeS", String(s)); localStorage.setItem("themeL", String(l)); }, [h,s,l]);

  // Dark mode toggle
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    const html = document.documentElement; if (darkMode) html.classList.add("dark"); else html.classList.remove("dark");
    html.style.transition = "background-color 0.3s ease, color 0.3s ease";
  }, [darkMode]);

  // Scroll + section tracking
  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id); if (!el) return;
    const yOffset = -80; const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" }); setPaletteOpen(false);
  },[]);

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

  // GA pageview on section change
  useEffect(() => { if (typeof window.gtag === "function") window.gtag("event", "page_view", { page_path: `/#${activeSection}` }); }, [activeSection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((s) => !s); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === ",") { e.preventDefault(); setEditorOpen((s) => !s); }
      if (e.key === "Escape") { setPaletteOpen(false); setEditorOpen(false); setSelectedProject(null); }
      if (e.key === "PageDown") { e.preventDefault(); const idx = navItems.findIndex((n) => n.id === activeSection); const next = navItems[Math.min(navItems.length - 1, idx + 1)].id; scrollTo(next); }
      if (e.key === "PageUp") { e.preventDefault(); const idx = navItems.findIndex((n) => n.id === activeSection); const prev = navItems[Math.max(0, idx - 1)].id; scrollTo(prev); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSection, scrollTo]);

  // Konami → confetti
  useKonami(()=>burstConfetti(window.innerWidth/2, window.innerHeight/2));

  const sendEmail = (e) => {
    e.preventDefault(); setContactStatus(null); setSendingEmail(true);
    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formRef.current, EMAILJS_USER_ID)
      .then(() => { setContactStatus("SUCCESS"); setSendingEmail(false); formRef.current.reset(); burstConfetti(window.innerWidth - 120, window.innerHeight - 120); })
      .catch(() => { setContactStatus("FAILED"); setSendingEmail(false); });
  };

  const projects = useMemo(() => [
    {
      title: "Stock Market Copilot",
      description: "End-to-end React + FastAPI app that delivers stock data, news, and AI insights for smarter investment decisions.",
      link: "https://github.com/meetgojiya98/Stock-Market-Copilot",
      live: "https://stock-market-copilot.vercel.app/",
      repo: "meetgojiya98/Stock-Market-Copilot",
      thumb: "https://opengraph.githubassets.com/1/meetgojiya98/Stock-Market-Copilot",
      tags: ["React","FastAPI","AI","Finance"],
    },
    {
      title: "Stock Sentiment Dashboard",
      description: "Real-time dashboard for market sentiment, trending tickers, news, and Reddit feeds to track market mood.",
      link: "https://github.com/meetgojiya98/Stock-Sentiment-Dashboard",
      live: "https://meetgojiya98.github.io/stock-sentiment-frontend/",
      repo: "meetgojiya98/Stock-Sentiment-Dashboard",
      thumb: "https://opengraph.githubassets.com/1/meetgojiya98/Stock-Sentiment-Dashboard",
      tags: ["React","D3","Reddit API","Charts"],
    },
    {
      title: "StockVision",
      description: "Predicts future stock prices from real market data with interactive charts, favorites, and dark mode.",
      link: "https://github.com/meetgojiya98/StockVision",
      live: "https://stock-vision-five.vercel.app/",
      repo: "meetgojiya98/StockVision",
      thumb: "https://opengraph.githubassets.com/1/meetgojiya98/StockVision",
      tags: ["React","ML","Timeseries","Charts"],
    },
    {
      title: "MapleLoom",
      description: "Private RAG interface powered by Ollama, Qdrant, Meilisearch — offline, source-anchored answers.",
      link: "https://github.com/meetgojiya98/MapleLoom",
      repo: "meetgojiya98/MapleLoom",
      thumb: "https://opengraph.githubassets.com/1/meetgojiya98/MapleLoom",
      tags: ["RAG","Ollama","Qdrant","Search"],
    },
  ], []);

  // Active colors (base theme or custom)
  const themeColors = useMemo(() => baseThemes, []);
  const colors = useCustom ? customColors : (themeColors[theme] || themeColors.saffron);
  const rampCSS = `linear-gradient(135deg, ${colors.ramps[0]} 0%, ${colors.ramps[1]} 55%, ${colors.ramps[2]} 100%)`;

  const stats = useGithubStats(projects);

  const filteredProjects = projects.filter(p => {
    if(!projectQuery) return true;
    const q = projectQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.tags||[]).some(t=>t.toLowerCase().includes(q));
  });

  const copyShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    if(useCustom){ url.searchParams.set('h', String(h)); url.searchParams.set('s', String(s)); url.searchParams.set('l', String(l)); }
    url.searchParams.set('dark', String(darkMode));
    navigator.clipboard.writeText(url.toString());
    setToast('Link copied!');
    setTimeout(()=>setToast(null), 1500);
  };

  return (
    <>
      <style>{`
        :root { --color-primary: ${colors.primary}; --color-primary-dark: ${colors.primaryDark}; --color-primary-light: ${colors.primaryLight}; }
        html { scroll-behavior: smooth; }
        .glass-card { background: rgba(255 255 255 / 0.11); backdrop-filter: saturate(180%) blur(12px); transition: background .3s ease, box-shadow .3s ease, transform .3s ease; }
        .glass-card:hover { background: rgba(255 255 255 / 0.24); box-shadow: 0 0 28px var(--color-primary-light); transform: translateY(-4px); cursor: pointer; }
        .active-pill { position: absolute; bottom: -6px; left: 0; right: 0; margin: 0 auto; width: 24px; height: 3px; border-radius: 9999px; background: var(--color-primary); }
        @keyframes auroraMove { 0% { transform: translateY(-5%) scale(1.05) rotate(0deg); } 100% { transform: translateY(5%) scale(1.05) rotate(6deg); } }
        .marquee { display: flex; gap: 1rem; will-change: transform; animation: scrollX 28s linear infinite; }
        @keyframes scrollX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      {/* Custom DOM cursor ring */}
      <CursorRing />

      <a href="#hero" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded">Skip to content</a>

      <div className={`relative bg-black/70 dark:bg-gray-950 text-gray-100 min-h-screen transition-colors duration-700 font-sans`} style={{ paddingBottom: "90px" }}>
        {/* 3D background + visual layers */}
        <Floating3DCanvas colors={colors} reduced={prefersReducedMotion} />
        <AuroraLayer />
        <NoiseOverlay />

        {/* Scroll progress */}
        <div className="fixed top-0 left-0 h-1 z-50 transition-all" style={{ width: `${scrollProgress}%`, background: rampCSS }} />

        {/* NAVBAR */}
        <nav className={`fixed top-0 w-full z-40 backdrop-blur-md bg-black/35 border-b border-white/10 transition-shadow ${scrolled ? "shadow-lg" : ""}`} role="navigation" aria-label="Primary Navigation">
          <div className="container mx-auto flex justify-between items-center px-6 py-3">
            <div onClick={() => scrollTo("hero")} className="text-2xl font-extrabold cursor-pointer select-none tracking-tight" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") scrollTo("hero"); }} role="link" aria-label="Go to Home" style={{ background: rampCSS, WebkitBackgroundClip:'text', color:'transparent' }}>Meet Gojiya</div>

            <ul className="hidden md:flex space-x-8 font-medium text-lg relative" role="menubar">
              {navItems.map(({ label, id }) => (
                <li key={id} onClick={() => scrollTo(id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") scrollTo(id); }} tabIndex={0} className={`relative pb-2 cursor-pointer transition hover:text-[var(--color-primary)] ${activeSection === id ? "text-[var(--color-primary)] font-semibold" : ""}`} aria-current={activeSection === id ? "page" : undefined} role="menuitem">{label}{activeSection === id && <span className="active-pill" />}</li>
              ))}
            </ul>

            <div className="flex items-center space-x-3">
              <Magnetic>
                <button aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" style={{ background: rampCSS }} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
                  {darkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M12 3v1m0 16v1m8.66-11.66l-.707.707M5.05 18.95l-.707.707m15.192 2.121l-.707-.707M5.05 5.05l-.707-.707M21 12h-1M4 12H3" /><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={2} /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="none" aria-hidden="true"><path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 1 0-18z" /></svg>
                  )}
                </button>
              </Magnetic>
              <Magnetic>
                <button aria-label="Cycle Color Theme" onClick={() => setTheme(validThemes[(validThemes.indexOf(theme)+1)%validThemes.length])} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition theme-cycle-btn focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" title="Cycle Color Theme">🎨</button>
              </Magnetic>
              <Magnetic>
                <button onClick={() => setPaletteOpen(true)} className="hidden md:inline-flex px-3 py-2 rounded-lg border border-white/20 hover:border-[var(--color-primary)]/80 hover:text-[var(--color-primary)] transition" title="Open command palette (⌘/Ctrl + K)">⌘K</button>
              </Magnetic>
              <Magnetic>
                <button onClick={() => setEditorOpen(true)} className="hidden md:inline-flex px-3 py-2 rounded-lg border border-white/20 hover:border-[var(--color-primary)]/80 hover:text-[var(--color-primary)] transition" title="Open theme editor (⌘/Ctrl + ,)">Theme</button>
              </Magnetic>
              <Magnetic>
                <button onClick={copyShareLink} className="hidden md:inline-flex px-3 py-2 rounded-lg border border-white/20 hover:border-[var(--color-primary)]/80 hover:text-[var(--color-primary)] transition" title="Copy theme share link">Share</button>
              </Magnetic>
            </div>
          </div>
        </nav>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:-20, opacity:0 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl text-black" style={{ background: rampCSS }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MINIMAP NAV */}
        <MinimapNav active={activeSection} onJump={scrollTo} colors={colors} />

        {/* COMMAND PALETTE */}
        <AnimatePresence>
          {paletteOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-28">
              <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="w-[90%] max-w-xl rounded-2xl border border-white/10 bg-black/60 shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <input autoFocus onKeyDown={(e) => { if (e.key === "Escape") setPaletteOpen(false); }} placeholder="Type to jump: home, about, skills, projects, contact…" className="w-full bg-transparent outline-none text-lg px-2 py-1 placeholder-gray-400" />
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {navItems.map((n) => (
                    <li key={n.id} className="px-4 py-3 hover:bg-[var(--color-primary)]/10 cursor-pointer" onClick={() => scrollTo(n.id)}>
                      <div className="font-semibold">{n.label}</div>
                      <div className="text-sm text-gray-400">#{n.id}</div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* THEME EDITOR */}
        <AnimatePresence>
          {editorOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-end p-6">
              <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/70 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="font-semibold">Theme Editor</div>
                  <button onClick={() => setEditorOpen(false)} className="px-2 py-1 rounded hover:bg-white/10">✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <label className="flex items-center justify-between gap-3"><span>Enable custom</span><input type="checkbox" checked={useCustom} onChange={e=>setUseCustom(e.target.checked)} /></label>
                  <div>
                    <div className="text-sm mb-1">Hue: {h}°</div>
                    <input type="range" min="0" max="360" value={h} onChange={(e)=>setH(parseInt(e.target.value,10))} className="w-full" />
                  </div>
                  <div>
                    <div className="text-sm mb-1">Saturation: {s}%</div>
                    <input type="range" min="0" max="100" value={s} onChange={(e)=>setS(parseInt(e.target.value,10))} className="w-full" />
                  </div>
                  <div>
                    <div className="text-sm mb-1">Lightness: {l}%</div>
                    <input type="range" min="0" max="100" value={l} onChange={(e)=>setL(parseInt(e.target.value,10))} className="w-full" />
                  </div>
                  <div className="flex gap-2 items-center">
                    {makeRamp(h,s,l).map((c,i)=>(<div key={i} className="h-8 w-full rounded" style={{ background:c }} />))}
                  </div>
                  <div className="flex justify-between pt-2">
                    <button className="px-3 py-2 rounded border border-white/10 hover:bg-white/10" onClick={()=>{ const b=baseThemes[theme]; const {h:hh,s:ss,l:ll}=hexToHsl(b.primary); setH(hh); setS(ss); setL(ll); }}>Reset to {theme}</button>
                    <button className="px-3 py-2 rounded text-black" style={{ background: `linear-gradient(90deg, ${makeRamp(h,s,l).join(',')})`, boxShadow:'inset 0 0 0 1px rgba(0,0,0,.1)' }} onClick={()=>setUseCustom(true)}>Use These</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN */}
        <main className="container mx-auto px-6 pt-24 space-y-48 max-w-7xl">
          {/* HERO */}
          <section id="hero" className="min-h-screen flex flex-col justify-center items-center text-center space-y-8 relative z-10">
            <motion.h1 initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2 }} className="text-6xl md:text-7xl font-extrabold tracking-tight" style={{ background: rampCSS, WebkitBackgroundClip: "text", color: "transparent" }}>Meet Gojiya</motion.h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-base text-white/80">Solution Analyst • Full‑stack Dev • AI Enthusiast</motion.div>
            <motion.p initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.1 }} className="max-w-2xl text-lg md:text-xl text-white/90">I craft resilient, data‑driven products—blending gorgeous UI with grounded engineering. Dive into the work, or tune the theme live.</motion.p>
            <div className="flex gap-3 z-10">
              <Magnetic>
                <motion.button whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.96 }} onClick={() => scrollTo("projects")} className="px-8 py-3 text-black rounded-xl shadow-lg transition focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" style={{ background: rampCSS }}>See My Work</motion.button>
              </Magnetic>
              <Magnetic>
                <button onClick={()=>setEditorOpen(true)} className="px-8 py-3 rounded-xl border border-white/20 hover:border-[var(--color-primary)]/80 hover:text-[var(--color-primary)] transition">Live Theme</button>
              </Magnetic>
            </div>
            <ScrollIndicator onClick={() => scrollTo("about")} />
          </section>

          {/* ABOUT */}
          <SectionReveal id="about" colors={colors} title="About Me">
            <p>Meet Gojiya is a Solution Analyst on the Product Engineering and Development team within the Engineering, AI, and Data offering at Deloitte Canada. He links business with technology to extract insights from complex data and build data‑driven solutions.</p>
            <br />
            <p>He holds a Master of Computer Science from the University of New Brunswick and a Bachelor’s in Computer Engineering from Gujarat Technological University. He thrives on innovation, analytics, adaptability, and collaboration—pairing an entrepreneurial spirit with a drive to create positive, real‑world impact.</p>
            <br />
            <p>A curious, active listener, he treats every interaction as a chance to learn—exploring new ideas, questioning assumptions, and continuously growing.</p>
          </SectionReveal>

          {/* SKILLS (MARQUEE + CHIPS) */}
          <SectionReveal id="skills" colors={colors} title="Skills">
            <div className="overflow-hidden py-2">
              <div className="marquee">
                {["JavaScript (ES6+)","React.js & Next.js","Node.js & Express","MongoDB & SQL","Python & FastAPI","HTML5 & CSS3","Git & CI/CD","Pandas & NumPy","REST APIs","Postman & Jira","TypeScript","Java","AWS","OpenAI & AI Integration","Selenium","WebGL","LangChain","FastAPI"].concat(["JavaScript (ES6+)","React.js & Next.js","Node.js & Express","MongoDB & SQL","Python & FastAPI"]).map((skill, i) => (
                  <span key={i} className="px-5 py-2 rounded-full text-black font-semibold shadow-lg select-none" style={{ background: rampCSS }}>{skill}</span>
                ))}
              </div>
            </div>
          </SectionReveal>

          {/* PROJECTS (Filters + Grid + Modal) */}
          <SectionReveal id="projects" colors={colors} title="Projects">
            <div className="max-w-3xl mx-auto mb-6 flex items-center gap-3">
              <input value={projectQuery} onChange={(e)=>setProjectQuery(e.target.value)} placeholder="Filter projects by title, tag, or description…" className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 outline-none" />
              <button onClick={()=>setProjectQuery("")} className="px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10">Clear</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredProjects.map((p) => {
                const hue = stringToHue(p.repo || p.title);
                const accent = hslToCss(hue, 72, 56);
                const accent2 = hslToCss((hue+18)%360, 68, 62);
                const accentRamp = `linear-gradient(135deg, ${accent}, ${accent2})`;
                const st = stats[p.repo];
                return (
                  <TiltCard key={p.title} className="glass-card rounded-2xl overflow-hidden text-left group" glow={accent}>
                    {/* Accent top bar */}
                    <div className="h-1 w-full" style={{ background: accentRamp }} />

                    {/* Thumb with animated caption */}
                    <div className="relative" onClick={()=>setSelectedProject(p)}>
                      <motion.img src={p.thumb} alt={`${p.title} thumbnail`} loading="lazy" className="w-full h-48 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} initial={{ scale: 1.02 }} whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }} />
                      <motion.div initial={{ opacity: 0, y: 20 }} whileHover={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} className="absolute inset-x-0 bottom-0 p-4">
                        <div className="rounded-xl px-3 py-2 text-white shadow-lg" style={{ background: accentRamp }}>
                          <h3 className="text-lg font-semibold">{p.title}</h3>
                        </div>
                      </motion.div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                      <p className="text-white/90">{p.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(p.tags||[]).map(t=> <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-white/10 border border-white/15">{t}</span>)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {st && (
                          <div className="flex items-center gap-3 text-sm text-white/80">
                            <span title="Stars">⭐ {numShort(st.stars)}</span>
                            <span title="Forks">🍴 {numShort(st.forks)}</span>
                            <span title="Issues">🐞 {numShort(st.issues)}</span>
                          </div>
                        )}
                        <div className="flex-1" />
                        {p.live && (
                          <a href={p.live} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border transition hover:text-white" style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }} title="View Live Demo">
                            <span style={{ background: accentRamp, WebkitBackgroundClip: "text", color: "transparent" }}>Live Demo ↗</span>
                          </a>
                        )}
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border transition hover:text-white" style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }} title="View GitHub Repository">
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
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6 text-left" aria-label="Contact form">
              <input type="text" name="user_name" placeholder="Your Name" required className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none transition" />
              <input type="email" name="user_email" placeholder="Your Email" required className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none transition" />
              <textarea name="message" placeholder="Your Message" rows={6} required className="w-full p-3 rounded-md bg-white/10 border border-white/20 focus:outline-none transition resize-none" />
              <button type="submit" className="w-full py-3 text-black rounded-lg transition flex justify-center items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" style={{ background: rampCSS }} disabled={sendingEmail} title={sendingEmail ? "Sending message..." : "Send Message"}>
                {sendingEmail && (
                  <svg className="animate-spin h-5 w-5 mr-2 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
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
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div layout initial={{ scale:0.98, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.98, opacity:0 }} className="w-full max-w-3xl rounded-2xl overflow-hidden border border-white/10 bg-black/70">
                <div className="relative">
                  <img src={selectedProject.thumb} alt="thumb" className="w-full max-h-[50vh] object-cover" />
                  <button onClick={()=>setSelectedProject(null)} className="absolute top-3 right-3 px-3 py-2 rounded-lg bg-black/50 hover:bg-black/70">✕</button>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold" style={{ background:rampCSS, WebkitBackgroundClip:'text', color:'transparent' }}>{selectedProject.title}</h3>
                  <p className="text-white/90">{selectedProject.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProject.tags||[]).map(t=> <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-white/10 border border-white/15">{t}</span>)}
                  </div>
                  <div className="flex gap-3">
                    {selectedProject.live && <a target="_blank" rel="noreferrer" href={selectedProject.live} className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10">Live Demo</a>}
                    <a target="_blank" rel="noreferrer" href={selectedProject.link} className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10">GitHub</a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}
        <footer className="fixed bottom-0 left-0 w-full bg-black/40 border-t border-white/10 flex justify-between items-center px-6 py-2 text-sm text-white/80 select-none z-40 backdrop-blur">
          <div>© {new Date().getFullYear()} Meet Gojiya. All rights reserved.</div>
          <div className="flex space-x-6 items-center">
            <a href="https://github.com/meetgojiya98" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" title="GitHub Profile">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/meet-gojiya/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-white transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2" title="LinkedIn Profile">LinkedIn ↗</a>
          </div>
        </footer>

        {/* RESUME FLOATING BUTTON */}
        <a href="https://drive.google.com/file/d/17XX80PFS8ga66W_fNSaoY-iGfgna8qth/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="fixed bottom-20 right-6 z-50 text-black px-5 py-3 rounded-full shadow-lg transition flex items-center space-x-2 select-none focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)] focus:ring-opacity-50" title="Download Resume" download style={{ background: rampCSS }} onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(0.95)")} onMouseOut={(e) => (e.currentTarget.style.filter = "none") }>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0 0l-4-4m4 4l4-4M12 4v8" /></svg>
          <span>Resume</span>
        </a>
      </div>
    </>
  );
}
